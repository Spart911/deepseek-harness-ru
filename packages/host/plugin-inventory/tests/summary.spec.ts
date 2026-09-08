import { describe, expect, it } from 'vitest'
import { pathToFileURL } from 'node:url'
import { resolvePackageSummary } from '../src/summary.ts'

describe('resolvePackageSummary', () => {
  it('reads the description of a workspace package', () => {
    const summary = resolvePackageSummary(
      '@deepseek-ai/dsh-host-plugin-inventory',
      [import.meta.url],
    )
    expect(summary).toMatch(/Loader|plugin/i)
  })

  it('returns null for cordis builtins and relative paths', () => {
    expect(resolvePackageSummary('cordis:active', [import.meta.url])).toBeNull()
    expect(resolvePackageSummary('./local.ts', [pathToFileURL(process.cwd()).href])).toBeNull()
  })
})
