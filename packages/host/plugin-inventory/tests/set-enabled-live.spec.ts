import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import Hmr from '@deepseek-ai/cordis-plugin-hmr'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import Timer from '@deepseek-ai/cordis-plugin-timer'
import {
  mountRootInclude,
  PROFILE_PATCH_FILENAME,
  watchUserPatches,
} from '@deepseek-ai/dsh-app-boot'
import PluginInventoryGateway from '../src/index.ts'

const contexts: Context[] = []

afterEach(async () => {
  await Promise.all(contexts.splice(0).map(ctx => ctx.fiber.dispose()))
})

describe('PluginInventoryGateway live profile toggles', () => {
  it('persists enablement through the profile patch layer on a readonly include tree', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'dsh-plugin-inventory-live-'))
    const profileDir = join(dir, 'profile')
    mkdirSync(profileDir, { recursive: true })
    const configPath = join(profileDir, 'cordis.yml')
    const patchPath = join(profileDir, PROFILE_PATCH_FILENAME)
    writeFileSync(configPath, [
      '- id: toggle-me',
      '  name: cordis:active',
      '',
    ].join('\n'))
    writeFileSync(patchPath, '[]\n')

    const ctx = new Context()
    contexts.push(ctx)
    ctx.baseUrl = `${pathToFileURL(profileDir).href}/`
    await ctx.plugin(Loader)
    ctx.loader.builtins.active = () => {}
    const basePatches = [{ id: 'toggle-me', disabled: false }]
    await mountRootInclude(ctx, configPath, basePatches)
    await ctx.plugin(Timer)
    await ctx.plugin(Hmr, { root: [], ignored: [], debounce: 0 })
    await watchUserPatches(ctx, {
      binName: 'dsh-test',
      filename: patchPath,
      compose: userPatches => [...basePatches, ...userPatches],
    })
    await ctx.plugin(PluginInventoryGateway)
    const inventory = ctx.get('pluginInventory') as PluginInventoryGateway
    await ctx.loader.await()

    const row = inventory.list().entries.find(entry => entry.patchId === 'toggle-me')
    expect(row?.enabled).toBe(true)

    await inventory.setEnabled(row!.entryId, false)
    expect(readFileSync(patchPath, 'utf8')).toContain('disabled: true')
    const disabled = inventory.list().entries.find(entry => entry.patchId === 'toggle-me')
    expect(disabled?.enabled).toBe(false)

    await inventory.setEnabled(disabled!.entryId, true)
    expect(readFileSync(patchPath, 'utf8')).toContain('disabled: false')
    expect(inventory.list().entries.find(entry => entry.patchId === 'toggle-me')?.enabled).toBe(true)
  })
})
