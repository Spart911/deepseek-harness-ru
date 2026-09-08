/** Host plugin inventory registered into Web Settings — with enablement toggles. */

import type {} from '@deepseek-ai/dsh-client-locale/client'
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import {
  PluginInventorySettingsTab,
  moduleDescKey,
  type PluginInventorySettingsTabInjected,
} from './PluginInventorySettingsTab.tsx'
import { en, zh, type PluginInventoryLocaleKey } from './locales.ts'
import { en as enDesc, zh as zhDesc } from './descriptions.ts'

export type { PluginInventorySettingsTabInjected, PluginInventorySettingsTabProps } from './PluginInventorySettingsTab.tsx'
export type { PluginInventoryLocaleKey } from './locales.ts'
export { moduleDescKey, moduleShortName } from './PluginInventorySettingsTab.tsx'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Plugin inventory chrome copy. */
    'settings.pluginInventory': PluginInventoryLocaleKey
    /** Package-keyed plugin descriptions; language packs extend this namespace. */
    'settings.pluginInventory.desc': string
  }
}

/** Dictionary namespace owned by this plugin. */
export const NS = 'settings.pluginInventory'

/**
 * Untyped description namespace: keys are {@link moduleDescKey} values.
 * Language packs (e.g. `locale-ru`) register additional locales here.
 */
export const DESC_NS = 'settings.pluginInventory.desc'

/** Services required by the Settings registration and generated Remote face. */
export const inject = ['slots', 'locale', 'remote', 'remote.pluginInventory']

/** Cyrillic letters in a description string. */
const CYRILLIC = /[\u0400-\u04FF]/

/** Readable Russian label derived from a package dictionary key. */
function russianCatalogLabel(moduleName: string): string | undefined {
  const key = moduleDescKey(moduleName)
  const rules: Array<[RegExp, string]> = [
    [/^dsh-tool-/, 'Инструмент агента'],
    [/^dsh-command-/, 'Команда'],
    [/^dsh-client-ui-/, 'Интерфейс'],
    [/^dsh-client-/, 'Клиент'],
    [/^dsh-host-/, 'Хост'],
    [/^dsh-llm/, 'LLM'],
    [/^dsh-session/, 'Сессия'],
    [/^dsh-web/, 'Веб'],
    [/^dsh-api-/, 'API'],
    [/^dsh-plan/, 'Режим планирования'],
    [/^dsh-goal/, 'Цели'],
    [/^dsh-compaction/, 'Сжатие контекста'],
    [/^dsh-subagent/, 'Субагенты'],
    [/^dsh-workflow/, 'Workflow'],
    [/^dsh-hooks/, 'Хуки'],
    [/^dsh-shell/, 'Shell'],
    [/^dsh-fs/, 'Файловая система'],
    [/^dsh-preset/, 'Пресет'],
    [/^dsh-bundle/, 'Bundle'],
    [/^cordis-plugin-/, 'Cordis'],
    [/^cordis$/, 'Cordis'],
    [/^dsh-/, 'DSH'],
  ]
  for (const [pattern, prefix] of rules) {
    if (!pattern.test(key)) continue
    const tail = key.replace(pattern, '').replace(/^-/, '').replace(/-/g, ' ')
    return tail.length > 0 ? `${prefix}: ${tail}` : prefix
  }
  return undefined
}

/** Contribute the inventory tab to the Plugins settings section. */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-settings-plugin-inventory: dictionaries')
  ctx.effect(
    () => ctx.locale.register(DESC_NS, { zh: zhDesc, en: enDesc }),
    'ui-settings-plugin-inventory: descriptions',
  )

  const t = ctx.locale.bind(NS)
  const tDesc = ctx.locale.bind(DESC_NS)
  const usesRussianCatalog = (): boolean => ctx.locale.getLocale().active === 'ru'

  const list: PluginInventorySettingsTabInjected['list'] = async () => {
    const result = await ctx.remote.pluginInventory.list()
    if (!result.ok) {
      throw new Error(`pluginInventory.list failed: ${result.error.code}: ${result.error.message}`)
    }
    return result.value
  }

  const setEnabled: PluginInventorySettingsTabInjected['setEnabled'] = async (entryId, enabled) => {
    const result = await ctx.remote.pluginInventory.setEnabled(entryId, enabled)
    if (!result.ok) {
      throw new Error(`pluginInventory.setEnabled failed: ${result.error.code}: ${result.error.message}`)
    }
    return result.value
  }

  const describe: PluginInventorySettingsTabInjected['describe'] = (moduleName, summary) => {
    const key = moduleDescKey(moduleName)
    const localized = tDesc(key)
    const ruFallback = usesRussianCatalog()
    if (localized !== key) {
      if (!ruFallback || CYRILLIC.test(localized)) return localized
      const generated = russianCatalogLabel(moduleName)
      if (generated !== undefined) return generated
      return localized
    }
    if (ruFallback) {
      const generated = russianCatalogLabel(moduleName)
      if (generated !== undefined) return generated
    }
    return summary ?? undefined
  }

  const injected = (): PluginInventorySettingsTabInjected => ({ list, setEnabled, describe })

  ctx.slots.inject('settings.plugins.tab', () => ctx.slots.register({
    name: 'settings.plugins.tab',
    id: 'all',
    order: 10,
    label: () => t('tab'),
    locale: NS,
    inject: injected,
  }, PluginInventorySettingsTab))
}
