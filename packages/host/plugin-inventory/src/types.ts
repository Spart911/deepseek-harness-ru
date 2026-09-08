import type { Branded } from '@deepseek-ai/dsh-brand'

/** Stable Loader-tree identity of one configured plugin entry. */
export type PluginEntryId = Branded<'PluginEntryId'>

/** Lifecycle state of an entry's root Fiber, or null when it has no live root Fiber. */
export type PluginFiberPhase =
  | 'pending'
  | 'loading'
  | 'active'
  | 'failed'
  | 'unloading'
  | null

/** One non-group Loader entry exposed to trusted clients. */
export interface PluginInventoryEntry {
  readonly entryId: PluginEntryId
  /** Loader patch `id` used by the profile user layer, when present. */
  readonly patchId: string | null
  /** Exact module specifier imported by the Loader entry. */
  readonly moduleName: string
  /** Effective Loader enablement, including disabled ancestor groups. */
  readonly enabled: boolean
  /**
   * Whether the inventory Remote may toggle this entry.
   * False for composition-critical modules whose disablement would strand
   * Settings, the web transport, or this inventory itself.
   */
  readonly mutable: boolean
  /**
   * Owning package.json `description` when the module resolves to a package,
   * otherwise null (builtins, relative paths, or unresolved specs).
   */
  readonly summary: string | null
  readonly fiberPhase: PluginFiberPhase
}

/** Point-in-time inventory returned by the plugin inventory Remote. */
export interface PluginInventorySnapshot {
  readonly entries: readonly PluginInventoryEntry[]
}
