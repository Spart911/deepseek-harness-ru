/**
 * Composition-critical modules that Settings must not disable through the
 * inventory Remote. Disabling any of these strands the web GUI transport,
 * Settings chrome, or the inventory surface itself with no recovery path
 * inside the same session.
 */
const IMMUTABLE_MODULE_NAMES = new Set([
  'cordis:include',
  'cordis:group',
  '@deepseek-ai/cordis-plugin-timer',
  '@deepseek-ai/dsh-host-plugin-inventory',
  '@deepseek-ai/dsh-client-ui-settings-plugin-inventory',
  '@deepseek-ai/dsh-client-ui-settings',
  '@deepseek-ai/dsh-client-ui-layout',
  '@deepseek-ai/dsh-client-ui-renderer',
  '@deepseek-ai/dsh-client-modules',
  '@deepseek-ai/dsh-client-locale',
  '@deepseek-ai/dsh-client-connection',
  '@deepseek-ai/dsh-api-remotes',
  '@deepseek-ai/dsh-api-gateway',
  '@deepseek-ai/dsh-host-webserver',
  '@deepseek-ai/dsh-web-app',
  '@deepseek-ai/dsh-web-app/startup',
  '@deepseek-ai/dsh-cordis-host-runner',
  '@deepseek-ai/dsh-cordis-client-runner',
  '@deepseek-ai/dsh-typert-loader',
  '@deepseek-ai/dsh-typert-registry',
])

/** Patch ids that must stay enabled for a booted profile to keep working. */
const IMMUTABLE_PATCH_IDS = new Set(['include', 'timer'])

/**
 * Modules whose Loader rows register one shared runtime slot, so enabling one
 * row must disable the other rows for the same module before reload.
 */
export const EXCLUSIVE_ENABLEMENT_MODULES = new Set([
  '@deepseek-ai/dsh-terminal-bash',
  'dsh-plugin-marketplace',
])

/**
 * Exact-route prefixes to clear before a live inventory toggle when a third-party
 * plugin registers web routes without fiber-scoped disposers.
 */
export const LEAKED_WEB_ROUTE_PREFIXES: Readonly<Record<string, string>> = {
  'dsh-plugin-marketplace': '/api/marketplace',
}

/**
 * Whether the inventory Remote may toggle a Loader entry by module name.
 * @param moduleName - exact Loader `options.name`.
 * @returns true when Settings may call `setEnabled` for this entry.
 */
export function isMutableModule(moduleName: string): boolean {
  return !IMMUTABLE_MODULE_NAMES.has(moduleName)
}

/**
 * Whether the inventory Remote may toggle one Loader row by its patch id.
 * @param patchId - Loader entry `id` from the composed configuration tree.
 */
export function isMutablePatchId(patchId: string): boolean {
  return !IMMUTABLE_PATCH_IDS.has(patchId)
}
