/** Machine value of the preset that requires an explicit GUI risk gate. */
export const FULL_ACCESS_PRESET = 'danger-full-access'

/** Locale keys for the three shipped permission preset labels. */
export type PermissionPresetLabelKey =
  | 'preset.readOnly'
  | 'preset.workspaceWrite'
  | 'preset.fullAccess'

/**
 * Map a known preset machine value to its locale label key.
 * @param value - preset machine value from Settings or the permissions projection.
 * @returns the label key, or undefined for host-configured custom presets.
 */
export function permissionPresetLabelKey(value: string): PermissionPresetLabelKey | undefined {
  switch (value) {
    case 'read-only':
      return 'preset.readOnly'
    case 'workspace-write':
      return 'preset.workspaceWrite'
    case FULL_ACCESS_PRESET:
      return 'preset.fullAccess'
    default:
      return undefined
  }
}

/**
 * Convert conventional kebab-case preset names into user-facing title case.
 * @param name - host-supplied preset label or key.
 * @returns the title-cased conventional key, or a non-kebab label unchanged.
 */
export function displayPresetName(name: string): string {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) return name
  return name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

/**
 * Render a permission preset under its product label.
 * @param value - preset machine value.
 * @param name - host-supplied preset name.
 * @param t - optional locale lookup for shipped preset labels.
 * @returns the localized product label, Full access fallback, or the conventional display name.
 */
export function displayPermissionPreset(
  value: string,
  name: string,
  t?: (key: PermissionPresetLabelKey) => string,
): string {
  const key = permissionPresetLabelKey(value)
  if (key !== undefined && t !== undefined) return t(key)
  return value === FULL_ACCESS_PRESET ? 'Full access' : displayPresetName(name)
}
