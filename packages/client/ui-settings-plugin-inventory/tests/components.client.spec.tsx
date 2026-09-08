// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PluginInventorySettingsTab } from '../src/client/PluginInventorySettingsTab.tsx'
import type {
  PluginInventorySettingsTabInjected,
  PluginInventorySettingsTabProps,
} from '../src/client/PluginInventorySettingsTab.tsx'
import { en, type PluginInventoryLocaleKey } from '../src/client/locales.ts'

afterEach(cleanup)

type Snapshot = Awaited<ReturnType<PluginInventorySettingsTabInjected['list']>>
const t = ((key: PluginInventoryLocaleKey): string => en[key]) as PluginInventorySettingsTabProps['t']

function props(
  list: PluginInventorySettingsTabInjected['list'],
  overrides: Partial<PluginInventorySettingsTabInjected> = {},
): PluginInventorySettingsTabProps {
  return {
    t,
    list,
    setEnabled: overrides.setEnabled ?? (async (_id, _enabled) => list()),
    describe: overrides.describe ?? ((_module, summary) => summary ?? undefined),
  } as PluginInventorySettingsTabProps
}

const SNAPSHOT = {
  entries: [
    {
      entryId: '8a1b2c3d',
      patchId: 'hmr',
      moduleName: '@deepseek-ai/cordis-plugin-hmr',
      enabled: true,
      mutable: true,
      summary: 'Hot Module Replacement Plugin for Cordis',
      fiberPhase: 'active',
    },
    {
      entryId: 'pending',
      patchId: 'pending-name',
      moduleName: 'cordis:pending-name',
      enabled: true,
      mutable: true,
      summary: null,
      fiberPhase: 'pending',
    },
    {
      entryId: 'loading',
      patchId: 'loading-name',
      moduleName: '@fixture/loading-name',
      enabled: true,
      mutable: true,
      summary: null,
      fiberPhase: 'loading',
    },
    {
      entryId: 'failed',
      patchId: 'failed-name',
      moduleName: '@fixture/failed-name',
      enabled: true,
      mutable: true,
      summary: null,
      fiberPhase: 'failed',
    },
    {
      entryId: 'unloading',
      patchId: 'unloading-name',
      moduleName: '@fixture/unloading-name',
      enabled: true,
      mutable: true,
      summary: null,
      fiberPhase: 'unloading',
    },
    {
      entryId: 'unobserved',
      patchId: 'unobserved-name',
      moduleName: '@fixture/unobserved-name',
      enabled: true,
      mutable: true,
      summary: null,
      fiberPhase: null,
    },
    {
      entryId: 'disabled-entry',
      patchId: 'directory-picker-native',
      moduleName: '@deepseek-ai/dsh-host-directory-picker-native',
      enabled: false,
      mutable: true,
      summary: 'Native directory picker',
      fiberPhase: null,
    },
    {
      entryId: 'locked',
      patchId: 'ui-settings',
      moduleName: '@deepseek-ai/dsh-client-ui-settings',
      enabled: true,
      mutable: false,
      summary: 'Settings chrome',
      fiberPhase: 'active',
    },
  ],
} as unknown as Snapshot

describe('PluginInventorySettingsTab', () => {
  it('renders descriptions, runtime status, and enablement switches', async () => {
    const deferred = Promise.withResolvers<Snapshot>()
    const list = vi.fn(() => deferred.promise)
    const view = render(<PluginInventorySettingsTab {...props(list)} />)
    expect(screen.getByText(en.loading)).toBeTruthy()

    await act(async () => { deferred.resolve(SNAPSHOT) })
    expect(list).toHaveBeenCalledOnce()
    expect(screen.getByRole('searchbox', { name: en.search })).toBeTruthy()
    expect(screen.getByRole('heading', { name: en.catalog })).toBeTruthy()
    expect(view.container.querySelector('[data-plugin-count]')?.textContent).toBe('8')
    expect(screen.getAllByRole('listitem')).toHaveLength(8)
    expect(screen.queryByText('Hot Module Replacement Plugin for Cordis')).toBeNull()
    expect(screen.getAllByRole('switch')).toHaveLength(8)
    const locked = screen.getByRole('button', { name: 'ui-settings, Mounted, Enabled' })
      .parentElement!
      .querySelector('button[role="switch"]')
    expect(locked?.getAttribute('disabled')).not.toBeNull()
    expect(locked?.getAttribute('title')).toBe(en.immutableHint)
    expect(screen.getAllByText(en.enabledTag)).toHaveLength(7)
    expect(screen.getByText(en.disabledTag)).toBeTruthy()
    for (const value of [
      'Mounted',
      'Waiting for dependencies',
      'Loading',
      'Mount failed',
      'Unloading',
      'Not mounted',
    ]) {
      expect(screen.getAllByRole('img', { name: value }).length).toBeGreaterThan(0)
    }
    const active = screen.getByRole('button', { name: 'hmr, Mounted, Enabled' })
    expect(active.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(active)
    expect(active.getAttribute('aria-expanded')).toBe('true')
    expect(view.container.querySelector('[data-loader-entry]')?.textContent).toBe('hmr')
    expect(screen.getByText('Hot Module Replacement Plugin for Cordis')).toBeTruthy()
    expect(screen.getByText(en.description)).toBeTruthy()
    expect(screen.getByText(en.configuration)).toBeTruthy()
    expect(screen.getByText(en.cordis)).toBeTruthy()
    fireEvent.click(active)
    expect(view.container.querySelector('[data-loader-entry]')).toBeNull()

    fireEvent.click(active)
    fireEvent.change(screen.getByRole('searchbox', { name: en.search }), {
      target: { value: 'disabled-entry' },
    })
    expect(view.container.querySelector('[data-loader-entry]')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'directory-picker-native, Disabled' }))
    expect(screen.getAllByText(en.disabledTag)).toHaveLength(2)
    expect(screen.queryByText(en.cordis)).toBeNull()
    expect(screen.queryByText(en.unobserved)).toBeNull()
  })

  it('toggles a mutable plugin through setEnabled', async () => {
    const setEnabled = vi.fn(async () => ({
      entries: SNAPSHOT.entries.map(entry =>
        entry.entryId === '8a1b2c3d'
          ? { ...entry, enabled: false, fiberPhase: null }
          : entry),
    })) as PluginInventorySettingsTabInjected['setEnabled']
    render(<PluginInventorySettingsTab {...props(async () => SNAPSHOT, { setEnabled })} />)
    const switches = await screen.findAllByRole('switch', { name: en.disable })
    // First disable switch that is not the locked settings one — hmr is first enabled mutable.
    fireEvent.click(switches[0]!)
    await waitFor(() => { expect(setEnabled).toHaveBeenCalledOnce() })
    expect(setEnabled).toHaveBeenCalledWith('8a1b2c3d', false)
    expect(screen.getAllByText(en.disabledTag).length).toBeGreaterThanOrEqual(2)
  })

  it('filters by module name, description, or Loader entry id', async () => {
    render(<PluginInventorySettingsTab {...props(async () => SNAPSHOT)} />)
    const search = await screen.findByRole('searchbox', { name: en.search })

    fireEvent.change(search, { target: { value: 'disabled-entry' } })
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText('directory-picker-native')).toBeTruthy()

    fireEvent.change(search, { target: { value: 'cordis-plugin-hmr' } })
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText('hmr')).toBeTruthy()

    fireEvent.change(search, { target: { value: 'hot module' } })
    expect(screen.getAllByRole('listitem')).toHaveLength(1)

    fireEvent.change(search, { target: { value: 'not-a-plugin' } })
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    expect(screen.getByText(en.emptySearch)).toBeTruthy()
  })

  it('shows a generic failure and retries into the empty state', async () => {
    const list = vi.fn<PluginInventorySettingsTabInjected['list']>()
      .mockRejectedValueOnce(new Error('private transport detail'))
      .mockResolvedValueOnce({ entries: [] })
    render(<PluginInventorySettingsTab {...props(list)} />)

    expect((await screen.findByRole('alert')).textContent).toBe(en.error)
    expect(screen.queryByText('private transport detail')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: en.retry }))
    await waitFor(() => { expect(list).toHaveBeenCalledTimes(2) })
    expect(await screen.findByText(en.empty)).toBeTruthy()
  })

  it('contains a synchronous Remote failure and ignores a result after unmount', async () => {
    const syncFailure = vi.fn(() => { throw new Error('namespace unavailable') }) as PluginInventorySettingsTabInjected['list']
    const failed = render(<PluginInventorySettingsTab {...props(syncFailure)} />)
    expect((await screen.findByRole('alert')).textContent).toBe(en.error)
    failed.unmount()

    const deferred = Promise.withResolvers<Snapshot>()
    const pending = render(<PluginInventorySettingsTab {...props(() => deferred.promise)} />)
    pending.unmount()
    await act(async () => { deferred.resolve(SNAPSHOT) })
  })

  it('labels twin terminal backends by patch id instead of duplicating the package short name', async () => {
    const snapshot = {
      entries: [
        {
          entryId: 'include:agent-presets:terminal-bash',
          patchId: 'terminal-bash',
          moduleName: '@deepseek-ai/dsh-terminal-bash',
          enabled: true,
          mutable: true,
          summary: 'bash backend',
          fiberPhase: 'active',
        },
        {
          entryId: 'include:agent-presets:terminal-pwsh',
          patchId: 'terminal-pwsh',
          moduleName: '@deepseek-ai/dsh-terminal-bash',
          enabled: false,
          mutable: true,
          summary: 'pwsh backend',
          fiberPhase: null,
        },
      ],
    } as Snapshot
    render(<PluginInventorySettingsTab {...props(async () => snapshot)} />)
    expect(await screen.findByText('terminal-bash')).toBeTruthy()
    expect(screen.getByText('terminal-pwsh')).toBeTruthy()
    expect(screen.queryAllByText('terminal-bash')).toHaveLength(1)
  })
})
