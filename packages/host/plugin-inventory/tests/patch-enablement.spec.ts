import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import {
  PROFILE_PATCH_FILENAME,
  profilePatchPath,
  readProfilePatches,
  upsertPatchDisabled,
  upsertPatchEnablement,
  writeProfilePatches,
} from '../src/patch-enablement.ts'

describe('patch enablement', () => {
  it('resolves the profile patch beside a trailing-slash base URL', () => {
    const dir = mkdtempSync(join(tmpdir(), 'dsh-plugin-inventory-patch-path-'))
    const ctx = new Context()
    ctx.baseUrl = `${pathToFileURL(dirname(join(dir, 'cordis.yml'))).href}/`
    expect(profilePatchPath(ctx)).toBe(join(dir, PROFILE_PATCH_FILENAME))
  })

  it('upserts and clears disabled rows by patch id', () => {
    const base = [
      { id: 'web', config: { searchProvider: 'searxng' } },
      { id: 'llm-ollama', name: '@deepseek-ai/dsh-llm-ollama' },
    ]
    expect(upsertPatchDisabled(base, 'web-search-deepseek', false)).toEqual([
      ...base,
      { id: 'web-search-deepseek', disabled: true },
    ])
    const disabled = [
      ...base,
      { id: 'web-search-deepseek', disabled: true },
    ]
    expect(upsertPatchDisabled(disabled, 'web-search-deepseek', true)).toEqual([
      ...base,
      { id: 'web-search-deepseek', disabled: false },
    ])
    expect(upsertPatchDisabled(
      [{ id: 'web-search-deepseek', disabled: true, config: { keep: true } }],
      'web-search-deepseek',
      true,
    )).toEqual([{ id: 'web-search-deepseek', config: { keep: true } }])
    expect(upsertPatchDisabled([], 'hmr', true)).toEqual([
      { id: 'hmr', disabled: false },
    ])
    expect(upsertPatchEnablement([], 'hmr', true, { root: [] })).toEqual([
      { id: 'hmr', disabled: false, config: { root: [] } },
    ])
  })

  it('drops a bundle-managed disable override when re-enabling marketplace', () => {
    expect(upsertPatchEnablement(
      [{ id: 'plugin-marketplace', disabled: true }],
      'plugin-marketplace',
      true,
      undefined,
      true,
    )).toEqual([])
  })

  it('keeps an explicit disabled false row when clearing a prior disable patch', () => {
    expect(upsertPatchEnablement([{ id: 'terminal-pwsh', disabled: true }], 'terminal-pwsh', true))
      .toEqual([{ id: 'terminal-pwsh', disabled: false }])
  })

  it('disables exclusive siblings atomically when enabling one patch id', () => {
    let patches = upsertPatchEnablement([], 'terminal-bash', false)
    patches = upsertPatchEnablement(patches, 'terminal-pwsh', true)
    expect(patches).toEqual([
      { id: 'terminal-bash', disabled: true },
      { id: 'terminal-pwsh', disabled: false },
    ])
  })

  it('round-trips profile patch files', () => {
    const dir = mkdtempSync(join(tmpdir(), 'dsh-plugin-inventory-patch-'))
    const path = join(dir, 'cordis.patch.yml')
    writeFileSync(path, '- id: web-search-deepseek\n  disabled: true\n')
    const patches = readProfilePatches(path)
    writeProfilePatches(path, upsertPatchDisabled(patches, 'web-search-deepseek', true))
    expect(readFileSync(path, 'utf8')).toContain('disabled: false')
  })
})
