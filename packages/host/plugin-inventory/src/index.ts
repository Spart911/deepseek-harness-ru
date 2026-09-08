/** Projection of the current Cordis Loader plugin entries, with enablement mutation. */

import type { Context, FiberState } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/cordis-plugin-loader'
import { getRootIncludeEntry, refreshLiveUserPatches } from '@deepseek-ai/dsh-app-boot'
import { TypertRemoteService, Remote } from '@deepseek-ai/dsh-typert-protocol'
// Typert-generated ./typert and ./remote artifacts import Zod at runtime.
import type {} from 'zod'
import { EXCLUSIVE_ENABLEMENT_MODULES, isMutableModule, isMutablePatchId, LEAKED_WEB_ROUTE_PREFIXES } from './mutable.ts'
import { writeProfilePatchEnablement } from './patch-enablement.ts'
import { resolvePackageSummary } from './summary.ts'
import type {
  PluginEntryId,
  PluginFiberPhase,
  PluginInventoryEntry,
  PluginInventorySnapshot,
} from './types.ts'

export type * from './types.ts'

/** Cordis HMR module specifier. */
const HMR_MODULE = '@deepseek-ai/cordis-plugin-hmr'

/** Modules that may have a runtime companion row outside the bundle patch id. */
const COMPANION_MODULE_NAMES = new Set([HMR_MODULE])

/** Brand an existing Loader-tree entry id at the owning boundary. */
function pluginEntryId(value: string): PluginEntryId {
  return value as PluginEntryId
}

/** Runtime mirror: FiberState is a cross-package const enum. */
const FIBER_STATE = {
  PENDING: 0 as FiberState.PENDING,
  LOADING: 1 as FiberState.LOADING,
  ACTIVE: 2 as FiberState.ACTIVE,
  FAILED: 3 as FiberState.FAILED,
  DISPOSED: 4 as FiberState.DISPOSED,
  UNLOADING: 5 as FiberState.UNLOADING,
} as const

/** Complete public projection of Cordis Fiber states. */
const FIBER_PHASE = {
  [FIBER_STATE.PENDING]: 'pending',
  [FIBER_STATE.LOADING]: 'loading',
  [FIBER_STATE.ACTIVE]: 'active',
  [FIBER_STATE.FAILED]: 'failed',
  [FIBER_STATE.DISPOSED]: null,
  [FIBER_STATE.UNLOADING]: 'unloading',
} as const satisfies Record<FiberState, PluginFiberPhase>

/** User-layer config override applied when enabling one module from Settings. */
function enablementPatchConfig(moduleName: string, enabled: boolean): Record<string, unknown> | undefined {
  if (!enabled || moduleName !== HMR_MODULE) return undefined
  // Web profiles ship bundle HMR disabled with `root: ['.']`. Enabling through
  // Settings should match the launcher's watch-only fallback (`root: []`) so
  // cordis.patch.yml stays live without mounting a second HMR service.
  return { root: [] }
}

/** Remote service exposing Loader inventory and enablement toggles. */
export class PluginInventoryGateway extends TypertRemoteService {
  static inject = ['loader']

  /** Per-process package summary cache keyed by module specifier. */
  private readonly summaries = new Map<string, string | null>()

  constructor(ctx: Context) {
    super(ctx, 'pluginInventory')
  }

  /**
   * Read the Loader directly on every call. Cordis's internal plugin/status
   * events already maintain Entry.fiber and Fiber.state, so a second cache
   * would only add another lifecycle truth to keep synchronized.
   * @returns Current non-group Loader entries in Loader order.
   */
  @Remote('list')
  list(): PluginInventorySnapshot {
    return { entries: this.project() }
  }

  /**
   * Enable or disable one Loader entry by its tree id, then persist through the
   * profile `cordis.patch.yml` layer when the entry's patch `id` is unique.
   * Duplicate patch ids (for example host and preset `plan-mode`) are toggled
   * in-process only because the include patch map cannot target one row.
   * @param entryId - Loader-tree entry id from a prior `list()` snapshot.
   * @param enabled - desired effective enablement (`true` clears a user-layer disable).
   * @returns Current inventory after the entry settles.
   * @throws when the entry is missing, lacks a patch id, is protected, or cannot settle.
   */
  @Remote('setEnabled')
  async setEnabled(entryId: PluginEntryId, enabled: boolean): Promise<PluginInventorySnapshot> {
    for (const entry of this.ctx.loader.entries()) {
      if (entry.id !== entryId) continue
      if (entry.options.group) break
      const moduleName = entry.options.name
      const patchId = entry.options.id
      if (!isMutableModule(moduleName)) {
        throw new Error(`plugin "${moduleName}" cannot be toggled from the inventory`)
      }
      if (patchId === undefined) {
        throw new Error(`plugin "${moduleName}" has no patch id for profile enablement`)
      }
      if (!isMutablePatchId(patchId)) {
        throw new Error(`plugin "${moduleName}" cannot be toggled from the inventory`)
      }
      if (!entry.disabled === enabled) {
        return { entries: this.project() }
      }
      const patchConfig = enablementPatchConfig(moduleName, enabled)
      const persistable = !this.duplicatePatchIds().has(patchId)
      if (persistable) {
        if (enabled) await this.removeCompanionEntries(entryId, moduleName)
        const disablePatchIds = enabled ? this.exclusiveSiblingPatchIds(moduleName, patchId) : []
        const revertBundleDefault = enabled && moduleName === 'dsh-plugin-marketplace'
        await writeProfilePatchEnablement(
          this.ctx,
          patchId,
          enabled,
          patchConfig,
          disablePatchIds,
          revertBundleDefault,
        )
        if (enabled && EXCLUSIVE_ENABLEMENT_MODULES.has(moduleName)) {
          await this.disableExclusiveModule(moduleName)
        } else if (enabled && disablePatchIds.length > 0) {
          await this.disableLoaderPatchIds(disablePatchIds)
        }
        this.clearLeakedWebRoutes(moduleName)
        try {
          await refreshLiveUserPatches(this.ctx)
        } catch (error) {
          const refreshUnavailable = error instanceof Error
            && error.message.includes('live user patch refresh is unavailable')
          if (!refreshUnavailable || getRootIncludeEntry(this.ctx) !== undefined) throw error
          await entry.update(enabled ? { disabled: null } : { disabled: true })
        }
        await this.ctx.loader.await().catch(() => {})
      } else {
        await entry.update(enabled ? { disabled: null } : { disabled: true })
        await this.ctx.loader.await().catch(() => {})
      }
      const settled = this.resolveEntry(entryId, patchId)
      if (settled === undefined || settled.disabled === enabled) {
        throw new Error(`plugin "${moduleName}" did not reach the requested enablement`)
      }
      return { entries: this.project() }
    }
    throw new Error(`plugin inventory entry "${entryId}" was not found`)
  }

  /** Resolve one inventory row after include reload by tree id or patch id. */
  private resolveEntry(entryId: string, patchId: string) {
    for (const candidate of this.ctx.loader.entries()) {
      if (candidate.id === entryId || candidate.options.id === patchId) return candidate
    }
    return undefined
  }

  /** Patch ids shared by more than one distinct Loader row. */
  private duplicatePatchIds(): Set<string> {
    const owners = new Map<string, string>()
    const duplicates = new Set<string>()
    for (const loaderEntry of this.ctx.loader.entries()) {
      if (loaderEntry.options.group) continue
      const id = loaderEntry.options.id
      if (id === undefined) continue
      const prior = owners.get(id)
      if (prior === undefined) owners.set(id, loaderEntry.id)
      else if (prior !== loaderEntry.id) duplicates.add(id)
    }
    return duplicates
  }

  /**
   * Drop stale exact routes left by plugins that skip webServer disposers.
   * @param moduleName - Loader module specifier being toggled.
   */
  private clearLeakedWebRoutes(moduleName: string): void {
    const prefix = LEAKED_WEB_ROUTE_PREFIXES[moduleName]
    if (prefix === undefined) return
    this.ctx.get('webServer')?.clearExactRoutes(prefix)
  }

  /**
   * Disable active Loader rows for patch ids before a live include refresh when
   * their module shares one runtime registration slot.
   * @param patchIds - sibling patch ids already written into the profile layer.
   */
  private async disableLoaderPatchIds(patchIds: readonly string[]): Promise<void> {
    const targets = new Set(patchIds)
    for (const loaderEntry of this.ctx.loader.entries()) {
      const id = loaderEntry.options.id
      if (id === undefined || !targets.has(id) || loaderEntry.disabled) continue
      await loaderEntry.update({ disabled: true })
    }
    await this.ctx.loader.await().catch(() => {})
  }

  /**
   * Other mutable patch ids for modules that allow only one enabled Loader row.
   * @param moduleName - Loader module specifier for the row being enabled.
   * @param targetPatchId - patch id of the row being enabled.
   */
  private exclusiveSiblingPatchIds(moduleName: string, targetPatchId: string): string[] {
    if (!EXCLUSIVE_ENABLEMENT_MODULES.has(moduleName)) return []
    const siblings: string[] = []
    for (const loaderEntry of this.ctx.loader.entries()) {
      if (loaderEntry.options.name !== moduleName) continue
      const id = loaderEntry.options.id
      if (id === undefined || id === targetPatchId || !isMutablePatchId(id)) continue
      siblings.push(id)
    }
    return siblings
  }

  /**
   * Unload every Loader row for one exclusive module before a live include refresh.
   * @param moduleName - Loader module specifier.
   */
  private async disableExclusiveModule(moduleName: string): Promise<void> {
    const patchIds: string[] = []
    for (const loaderEntry of this.ctx.loader.entries()) {
      if (loaderEntry.options.name !== moduleName) continue
      const id = loaderEntry.options.id
      if (id === undefined) continue
      patchIds.push(id)
    }
    await this.disableLoaderPatchIds(patchIds)
  }

  /**
   * Drop other Loader rows for modules that install a singleton service.
   * The web profile's watch-only HMR fallback is one example.
   */
  private async removeCompanionEntries(targetEntryId: string, moduleName: string): Promise<void> {
    if (!COMPANION_MODULE_NAMES.has(moduleName)) return
    const removeIds: string[] = []
    for (const loaderEntry of this.ctx.loader.entries()) {
      if (loaderEntry.id === targetEntryId) continue
      if (loaderEntry.options.name !== moduleName) continue
      removeIds.push(loaderEntry.id)
    }
    for (const id of removeIds) {
      await this.ctx.loader.remove(id)
    }
  }

  /** Project every non-group Loader entry into the public inventory row. */
  private project(): PluginInventoryEntry[] {
    const entries: PluginInventoryEntry[] = []
    for (const entry of this.ctx.loader.entries()) {
      if (entry.options.group) continue
      const moduleName = entry.options.name
      const patchId = entry.options.id ?? null
      entries.push({
        entryId: pluginEntryId(entry.id),
        patchId,
        moduleName,
        enabled: !entry.disabled,
        mutable: isMutableModule(moduleName)
          && patchId !== null
          && isMutablePatchId(patchId),
        summary: this.summaryFor(moduleName),
        fiberPhase: entry.fiber === undefined ? null : FIBER_PHASE[entry.fiber.state],
      })
    }
    return entries
  }

  /** Cached package.json description for one module specifier. */
  private summaryFor(moduleName: string): string | null {
    if (this.summaries.has(moduleName)) return this.summaries.get(moduleName) ?? null
    const anchors = [
      this.ctx.baseUrl ?? import.meta.url,
      import.meta.url,
    ]
    const summary = resolvePackageSummary(moduleName, anchors)
    this.summaries.set(moduleName, summary)
    return summary
  }
}

export default PluginInventoryGateway
