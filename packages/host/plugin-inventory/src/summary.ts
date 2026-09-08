/** Resolve a Loader module specifier to its package.json description when possible. */

import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { isAbsolute, join } from 'node:path'

interface PackageManifest {
  readonly description?: unknown
}

/** Parse a bare package or package-subpath specifier into its package name. */
function barePackageName(specifier: string): string | undefined {
  if (specifier.startsWith('.') || specifier.includes(':') || isAbsolute(specifier)) return undefined
  const [first = '', second = ''] = specifier.split('/')
  return first.startsWith('@') ? `${first}/${second}` : first
}

/** Locate package.json for a bare package name using Node search paths from anchors. */
function barePackageManifest(packageName: string, anchors: readonly string[]): string | undefined {
  for (const anchor of anchors) {
    let searchPaths: string[] | null
    try {
      searchPaths = createRequire(anchor).resolve.paths(packageName)
    } catch {
      // Anchor is not a resolvable file URL/path; try the next one.
      continue
    }
    if (searchPaths === null) continue
    for (const searchPath of searchPaths) {
      const manifest = join(searchPath, packageName, 'package.json')
      if (existsSync(manifest)) return manifest
    }
  }
  return undefined
}

/** Read `description` from a package.json path, or null when absent/invalid. */
function descriptionFromManifest(path: string): string | null {
  let manifest: PackageManifest
  try {
    manifest = JSON.parse(readFileSync(path, 'utf8')) as PackageManifest
  } catch {
    // Corrupt or unreadable manifest — treat as no summary.
    return null
  }
  return typeof manifest.description === 'string' && manifest.description.length > 0
    ? manifest.description
    : null
}

/**
 * Resolve a human-readable package summary for one Loader module specifier.
 * @param moduleName - exact Loader `options.name`.
 * @param anchors - absolute file URLs/paths used as `createRequire` bases.
 * @returns package.json description, or null when not a resolvable package.
 */
export function resolvePackageSummary(
  moduleName: string,
  anchors: readonly string[],
): string | null {
  const packageName = barePackageName(moduleName)
  if (packageName === undefined) return null
  const manifest = barePackageManifest(packageName, anchors)
  if (manifest === undefined) return null
  return descriptionFromManifest(manifest)
}
