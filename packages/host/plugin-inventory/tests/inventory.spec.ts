import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { Context, type Plugin } from '@deepseek-ai/cordis'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import { remoteMethods } from '@deepseek-ai/dsh-typert-protocol'
import PluginInventoryGateway from '../src/index.ts'
import * as patchEnablement from '../src/patch-enablement.ts'
import { isMutableModule, isMutablePatchId } from '../src/mutable.ts'

const contexts: Context[] = []

afterEach(async () => {
  await Promise.all(contexts.splice(0).map(ctx => ctx.fiber.dispose()))
})

const activePlugin: Plugin.Function = () => {}
const pendingPlugin: Plugin.Object = {
  inject: ['neverReady'],
  apply() {},
}

async function harness(): Promise<{
  ctx: Context
  inventory: PluginInventoryGateway
}> {
  const ctx = new Context()
  contexts.push(ctx)
  await ctx.plugin(Loader)
  ctx.loader.builtins.active = activePlugin
  ctx.loader.builtins.pending = pendingPlugin
  await ctx.plugin(PluginInventoryGateway)
  const inventory = ctx.get('pluginInventory') as PluginInventoryGateway
  return { ctx, inventory }
}

describe('PluginInventoryGateway', () => {
  it('publishes list and setEnabled under the pluginInventory namespace', async () => {
    const { inventory } = await harness()
    expect(inventory.typertRemote).toMatchObject({
      serviceKey: 'pluginInventory',
      namespace: 'pluginInventory',
    })
    expect(remoteMethods(inventory)).toEqual([
      { method: 'list', invocation: { kind: 'direct' } },
      { method: 'setEnabled', invocation: { kind: 'direct' } },
    ])
  })

  it('projects current non-group Loader entries without a second cache', async () => {
    const { ctx, inventory } = await harness()
    const activeId = await ctx.loader.create({ name: 'cordis:active' })
    const pendingId = await ctx.loader.create({ name: 'cordis:pending' })
    const disabledId = await ctx.loader.create({
      name: 'cordis:not-installed',
      disabled: true,
    })
    await ctx.loader.create({ name: 'cordis:active', group: true })
    const activePatchId = ctx.loader.resolve(activeId).options.id
    const pendingPatchId = ctx.loader.resolve(pendingId).options.id
    const disabledPatchId = ctx.loader.resolve(disabledId).options.id

    const snapshot = inventory.list()
    expect(snapshot.entries).toHaveLength(3)
    expect(snapshot.entries).toEqual(expect.arrayContaining([
      {
        entryId: activeId,
        patchId: activePatchId,
        moduleName: 'cordis:active',
        enabled: true,
        mutable: true,
        summary: null,
        fiberPhase: 'active',
      },
      {
        entryId: pendingId,
        patchId: pendingPatchId,
        moduleName: 'cordis:pending',
        enabled: true,
        mutable: true,
        summary: null,
        fiberPhase: 'pending',
      },
      {
        entryId: disabledId,
        patchId: disabledPatchId,
        moduleName: 'cordis:not-installed',
        enabled: false,
        mutable: true,
        summary: null,
        fiberPhase: null,
      },
    ]))

    await ctx.loader.update(activeId, { disabled: true })
    expect(inventory.list().entries.find(entry => entry.entryId === activeId)).toEqual({
      entryId: activeId,
      patchId: activePatchId,
      moduleName: 'cordis:active',
      enabled: false,
      mutable: true,
      summary: null,
      fiberPhase: null,
    })

    await ctx.loader.remove(pendingId)
    expect(inventory.list().entries.some(entry => entry.entryId === pendingId)).toBe(false)
  })

  it('toggles enablement on the targeted Loader entry', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'dsh-plugin-inventory-toggle-'))
    writeFileSync(join(dir, 'cordis.patch.yml'), '[]\n')
    const { ctx, inventory } = await harness()
    ctx.baseUrl = `${pathToFileURL(dir).href}/`
    const entryId = await ctx.loader.create({ name: 'cordis:active' })
    const patchId = ctx.loader.resolve(entryId).options.id

    await inventory.setEnabled(entryId as never, false)
    expect(ctx.loader.resolve(entryId).disabled).toBe(true)
    expect(readPatch(join(dir, 'cordis.patch.yml'))).toContain(patchId!)
    expect(readPatch(join(dir, 'cordis.patch.yml'))).toContain('disabled: true')

    await inventory.setEnabled(entryId as never, true)
    expect(ctx.loader.resolve(entryId).disabled).toBe(false)
    expect(readPatch(join(dir, 'cordis.patch.yml'))).toContain('disabled: false')
  })

  it('round-trips profile patch files for enablement', () => {
    const dir = mkdtempSync(join(tmpdir(), 'dsh-plugin-inventory-patch-'))
    const path = join(dir, 'cordis.patch.yml')
    writeFileSync(path, '[]\n')
    const patches = patchEnablement.readProfilePatches(path)
    patchEnablement.writeProfilePatches(
      path,
      patchEnablement.upsertPatchDisabled(patches, 'web-search-deepseek', false),
    )
    expect(readPatch(path)).toContain('disabled: true')
    patchEnablement.writeProfilePatches(
      path,
      patchEnablement.upsertPatchDisabled(
        patchEnablement.readProfilePatches(path),
        'web-search-deepseek',
        true,
      ),
    )
    expect(readPatch(path)).toContain('disabled: false')
  })

  it('refuses to toggle composition-critical modules', async () => {
    const { ctx, inventory } = await harness()
    const id = await ctx.loader.create({
      name: '@deepseek-ai/dsh-host-plugin-inventory',
      disabled: true,
    })
    expect(inventory.list().entries.find(entry => entry.entryId === id)?.mutable).toBe(false)
    await expect(inventory.setEnabled(id as never, false)).rejects.toThrow(/cannot be toggled/)
  })

  it('refuses setEnabled for unknown entry ids', async () => {
    const { inventory } = await harness()
    await expect(inventory.setEnabled('missing' as never, false)).rejects.toThrow(/was not found/)
  })
})

describe('isMutableModule', () => {
  it('marks Settings, transport, timer, and root include modules immutable', () => {
    expect(isMutableModule('cordis:include')).toBe(false)
    expect(isMutableModule('cordis:group')).toBe(false)
    expect(isMutableModule('@deepseek-ai/cordis-plugin-timer')).toBe(false)
    expect(isMutableModule('@deepseek-ai/dsh-client-ui-settings')).toBe(false)
    expect(isMutableModule('@deepseek-ai/dsh-host-webserver')).toBe(false)
    expect(isMutableModule('@deepseek-ai/dsh-tool-bash')).toBe(true)
  })
})

describe('isMutablePatchId', () => {
  it('marks the root include and timer rows immutable', () => {
    expect(isMutablePatchId('include')).toBe(false)
    expect(isMutablePatchId('timer')).toBe(false)
    expect(isMutablePatchId('hmr')).toBe(true)
  })
})

function readPatch(path: string): string {
  return readFileSync(path, 'utf8')
}
