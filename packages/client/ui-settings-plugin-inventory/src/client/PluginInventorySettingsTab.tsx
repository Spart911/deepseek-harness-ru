import { useEffect, useId, useMemo, useState, type ReactNode } from 'react'
import type { PluginInventorySnapshot } from '@deepseek-ai/dsh-api-remotes/client'
import {
  IconChevronDownOutline14,
  IconSearchOutline16,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { PluginInventoryLocaleKey } from './locales.ts'
import css from './PluginInventorySettingsTab.module.css'

type PluginInventoryEntry = PluginInventorySnapshot['entries'][number]
type PluginEntryId = PluginInventoryEntry['entryId']
type PluginFiberPhase = PluginInventoryEntry['fiberPhase']

/** Registration-side Remote face used by the section. */
export interface PluginInventorySettingsTabInjected {
  /** Read a current Host inventory snapshot. */
  list: () => Promise<PluginInventorySnapshot>
  /**
   * Enable or disable one inventory entry and return the refreshed snapshot.
   * @param entryId - Loader-tree entry id from the current snapshot.
   * @param enabled - desired enablement.
   */
  setEnabled: (entryId: PluginEntryId, enabled: boolean) => Promise<PluginInventorySnapshot>
  /**
   * Localized description for a module, preferring language-pack copy over the
   * Host package.json summary.
   * @param moduleName - exact Loader module specifier.
   * @param summary - Host-resolved package.json description, or null.
   */
  describe: (moduleName: string, summary: string | null) => string | undefined
}

/** Full component props assembled by the Settings slot renderer. */
export type PluginInventorySettingsTabProps =
  PropsRuntime<'settings.plugins.tab'>
  & PropsLocale<'settings.pluginInventory'>
  & InjectFace<PluginInventorySettingsTabInjected>

type ViewState =
  | { readonly status: 'loading' }
  | { readonly status: 'error' }
  | { readonly status: 'ready'; readonly snapshot: PluginInventorySnapshot }

const PHASE_KEYS = {
  pending: 'pending',
  loading: 'loadingPhase',
  active: 'active',
  failed: 'failed',
  unloading: 'unloading',
} satisfies Record<Exclude<PluginFiberPhase, null>, PluginInventoryLocaleKey>

/** Localized accessible label for one root Fiber phase. */
function phaseLabel(
  phase: PluginFiberPhase,
  t: PluginInventorySettingsTabProps['t'],
): string {
  return phase === null ? t('unobserved') : t(PHASE_KEYS[phase])
}

/** Compact a module specifier without guessing whether its Loader id was generated. */
export function moduleShortName(moduleName: string): string {
  const unscoped = moduleName.startsWith('@') ? moduleName.slice(moduleName.indexOf('/') + 1) : moduleName
  return unscoped
    .replace(/^cordis:/, '')
    .replace(/^cordis-plugin-/, '')
    .replace(/^dsh-(?:host-|client-)?/, '')
}

/** Cordis builtin module specifiers mapped to description dictionary keys. */
const CORDIS_BUILTIN_DESC_KEYS: Record<string, string> = {
  'cordis:include': 'cordis-plugin-include',
  'cordis:group': 'cordis-plugin-group',
}

/**
 * Stable description dictionary key: unscoped package name (or raw specifier).
 * Keeps `cordis-plugin-hmr` distinct from `dsh-client-hmr`.
 */
export function moduleDescKey(moduleName: string): string {
  const builtin = CORDIS_BUILTIN_DESC_KEYS[moduleName]
  if (builtin !== undefined) return builtin
  if (moduleName.startsWith('@')) return moduleName.slice(moduleName.indexOf('/') + 1)
  return moduleName
}

/** Whether an inventory row matches the local catalog query. */
function matches(
  entry: PluginInventoryEntry,
  catalogTitle: string,
  description: string | undefined,
  normalizedQuery: string,
): boolean {
  if (normalizedQuery.length === 0) return true
  return [entry.moduleName, entry.entryId, catalogTitle, description ?? '']
    .some(value => value.toLocaleLowerCase().includes(normalizedQuery))
}

/**
 * Card titles for the catalog: the short module name when unique, otherwise the
 * patch id or Loader-tree tail so twin rows (bash/pwsh terminal backends) stay
 * distinguishable.
 */
export function catalogTitles(entries: readonly PluginInventoryEntry[]): Map<PluginEntryId, string> {
  const groups = new Map<string, PluginInventoryEntry[]>()
  for (const entry of entries) {
    const short = moduleShortName(entry.moduleName)
    const group = groups.get(short) ?? []
    group.push(entry)
    groups.set(short, group)
  }
  const titles = new Map<PluginEntryId, string>()
  for (const group of groups.values()) {
    const sole = group[0]
    if (group.length === 1 && sole !== undefined) {
      titles.set(sole.entryId, moduleShortName(sole.moduleName))
      continue
    }
    const patchIdOwners = new Map<string, number>()
    for (const entry of group) {
      const patchId = entry.patchId ?? ''
      patchIdOwners.set(patchId, (patchIdOwners.get(patchId) ?? 0) + 1)
    }
    for (const entry of group) {
      const patchId = entry.patchId
      const uniquePatch = patchId !== null && (patchIdOwners.get(patchId) ?? 0) === 1
      const fallbackTail = entry.entryId.includes(':')
        ? entry.entryId.slice(entry.entryId.lastIndexOf(':') + 1)
        : entry.entryId
      titles.set(entry.entryId, uniquePatch ? patchId : fallbackTail)
    }
  }
  return titles
}

/** Render the Host plugin inventory with descriptions and enablement toggles. */
export function PluginInventorySettingsTab({
  list,
  setEnabled,
  describe,
  t,
}: PluginInventorySettingsTabProps): ReactNode {
  const catalogId = useId()
  const [request, setRequest] = useState(0)
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<PluginInventoryEntry['entryId'] | null>(null)
  const [state, setState] = useState<ViewState>({ status: 'loading' })
  const [pendingId, setPendingId] = useState<PluginInventoryEntry['entryId'] | null>(null)
  const [toggleErrorId, setToggleErrorId] = useState<PluginInventoryEntry['entryId'] | null>(null)
  const [toggleErrorMessage, setToggleErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let current = true
    void Promise.resolve().then(() => list()).then(
      (snapshot) => { if (current) setState({ status: 'ready', snapshot }) },
      () => { if (current) setState({ status: 'error' }) },
    )
    return () => { current = false }
  }, [list, request])

  const normalizedQuery = query.trim().toLocaleLowerCase()
  const titles = useMemo(
    () => (state.status === 'ready' ? catalogTitles(state.snapshot.entries) : new Map()),
    [state],
  )
  const filteredEntries = useMemo(() => {
    if (state.status !== 'ready') return []
    return state.snapshot.entries.filter((entry) => {
      const description = describe(entry.moduleName, entry.summary)
      const catalogTitle = titles.get(entry.entryId) ?? moduleShortName(entry.moduleName)
      return matches(entry, catalogTitle, description, normalizedQuery)
    })
  }, [describe, normalizedQuery, state, titles])

  useEffect(() => {
    if (expanded !== null && !filteredEntries.some(entry => entry.entryId === expanded)) {
      setExpanded(null)
    }
  }, [expanded, filteredEntries])

  const retry = (): void => {
    setState({ status: 'loading' })
    setRequest(value => value + 1)
  }

  const toggle = async (entry: PluginInventoryEntry): Promise<void> => {
    if (!entry.mutable || pendingId !== null) return
    setPendingId(entry.entryId)
    setToggleErrorId(null)
    setToggleErrorMessage(null)
    try {
      const fresh = await list()
      const current = fresh.entries.find(candidate => candidate.entryId === entry.entryId)
        ?? (entry.patchId === null ? undefined : fresh.entries.find(candidate =>
          candidate.patchId === entry.patchId && candidate.moduleName === entry.moduleName))
        ?? entry
      const snapshot = await setEnabled(current.entryId, !current.enabled)
      setState({ status: 'ready', snapshot })
    } catch (error) {
      setToggleErrorId(entry.entryId)
      setToggleErrorMessage(error instanceof Error ? error.message : String(error))
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className={css.section} aria-busy={state.status === 'loading'}>
      {state.status === 'loading' ? <p className={css.status}>{t('loading')}</p> : null}
      {state.status === 'error' ? (
        <div className={css.failure}>
          <p role="alert">{t('error')}</p>
          <button type="button" onClick={retry}>{t('retry')}</button>
        </div>
      ) : null}
      {state.status === 'ready' ? (
        <div className={css.catalog}>
          <label className={css.search}>
            <IconSearchOutline16 aria-hidden="true" />
            <span className={css.visuallyHidden}>{t('search')}</span>
            <input
              type="search"
              value={query}
              placeholder={t('search')}
              aria-label={t('search')}
              onChange={(event) => { setQuery(event.currentTarget.value) }}
            />
          </label>
          <div className={css.catalogHeading}>
            <h3>{t('catalog')}</h3>
            <span data-plugin-count={filteredEntries.length}>{filteredEntries.length}</span>
          </div>
          {state.snapshot.entries.length === 0 ? <p className={css.status}>{t('empty')}</p> : null}
          {state.snapshot.entries.length > 0 && filteredEntries.length === 0
            ? <p className={css.status}>{t('emptySearch')}</p>
            : null}
          {filteredEntries.length > 0 ? (
            <ul className={css.cards}>
              {filteredEntries.map((entry) => {
                const status = phaseLabel(entry.fiberPhase, t)
                const title = titles.get(entry.entryId) ?? moduleShortName(entry.moduleName)
                const description = describe(entry.moduleName, entry.summary)
                const configuration = t(entry.enabled ? 'enabledTag' : 'disabledTag')
                const open = expanded === entry.entryId
                const detailId = `${catalogId}-details-${encodeURIComponent(entry.entryId)}`
                const busy = pendingId === entry.entryId
                return (
                  <li
                    className={css.card}
                    key={entry.entryId}
                    data-plugin-entry={entry.entryId}
                    data-open={open ? 'true' : undefined}
                  >
                    <div className={css.cardBody}>
                      <button
                        className={css.cardContent}
                        type="button"
                        aria-expanded={open}
                        aria-controls={detailId}
                        aria-label={entry.enabled ? `${title}, ${status}, ${configuration}` : `${title}, ${configuration}`}
                        onClick={() => {
                          setExpanded(current => current === entry.entryId ? null : entry.entryId)
                        }}
                      >
                        <span className={css.cardHead}>
                          <strong className={css.cardTitle} title={entry.moduleName}>{title}</strong>
                        </span>
                        <span className={css.cardTrailing}>
                          {entry.enabled ? (
                            <span
                              className={css.statusDot}
                              data-phase={entry.fiberPhase ?? 'unobserved'}
                              role="img"
                              aria-label={status}
                              title={status}
                            />
                          ) : null}
                          <span className={css.configTag} data-enabled={entry.enabled ? 'true' : 'false'}>
                            {configuration}
                          </span>
                          <IconChevronDownOutline14 className={css.chevron} size={12} aria-hidden="true" />
                        </span>
                      </button>
                      <button
                        type="button"
                        role="switch"
                        className={css.switch}
                        data-on={entry.enabled ? 'true' : 'false'}
                        aria-checked={entry.enabled}
                        aria-busy={busy}
                        aria-label={t(entry.enabled ? 'disable' : 'enable')}
                        title={entry.mutable ? undefined : t('immutableHint')}
                        disabled={!entry.mutable || busy}
                        onClick={(event) => {
                          event.stopPropagation()
                          void toggle(entry)
                        }}
                      >
                        <span className={css.thumb} />
                      </button>
                    </div>
                    {toggleErrorId === entry.entryId ? (
                      <p className={css.toggleFailure} role="alert">
                        {toggleErrorMessage ?? t('toggleError')}
                      </p>
                    ) : null}
                    {open ? (
                      <div className={css.cardDetails} id={detailId}>
                        {entry.patchId ? (
                          <code className={css.entryValue} data-loader-entry>{entry.patchId}</code>
                        ) : (
                          <code className={css.entryValue} data-loader-entry>{entry.entryId}</code>
                        )}
                        <dl className={css.details}>
                          {description ? (
                            <div>
                              <dt>{t('description')}</dt>
                              <dd>{description}</dd>
                            </div>
                          ) : null}
                          <div>
                            <dt>{t('configuration')}</dt>
                            <dd>{configuration}</dd>
                          </div>
                          {entry.enabled ? (
                            <div>
                              <dt>{t('cordis')}</dt>
                              <dd>{status}</dd>
                            </div>
                          ) : null}
                          {!entry.mutable ? (
                            <div>
                              <dt>{t('disable')}</dt>
                              <dd>{t('immutableHint')}</dd>
                            </div>
                          ) : null}
                        </dl>
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
