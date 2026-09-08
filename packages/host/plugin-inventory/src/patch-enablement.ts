/** Persist plugin enablement through the profile `cordis.patch.yml` user layer. */

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Context } from '@deepseek-ai/cordis'
import type { Entry } from '@deepseek-ai/cordis-plugin-loader'
import { entryListSchema, type Include, type PatchOptions } from '@deepseek-ai/cordis-plugin-include'
import { withFileLock } from '@deepseek-ai/dsh-atomic-write'
import * as yaml from 'js-yaml'

/** Profile user-patch filename beside the booted `cordis.yml`. */
export const PROFILE_PATCH_FILENAME = 'cordis.patch.yml'

/** Resolve the profile patch path from the Loader root config directory. */
export function profilePatchPath(ctx: Context): string {
  if (ctx.baseUrl === undefined) {
    throw new Error('plugin inventory: profile base URL is unavailable')
  }
  const profileDir = fileURLToPath(new URL('.', ctx.baseUrl))
  return join(profileDir, PROFILE_PATCH_FILENAME)
}

/** Read the profile patch list, or an empty list when the file is absent. */
export function readProfilePatches(path: string): PatchOptions[] {
  try {
    const content = readFileSync(path, 'utf8')
    const parsed = yaml.load(content, { schema: entryListSchema })
    if (!Array.isArray(parsed)) {
      throw new Error('profile patch file must be a top-level YAML array')
    }
    return parsed as PatchOptions[]
  } catch (error) {
    if ((error as NodeJS.ErrnoException | null)?.code === 'ENOENT') return []
    throw error
  }
}

/** Serialize and atomically replace one profile patch file. */
export function writeProfilePatches(path: string, patches: PatchOptions[]): void {
  const content = `${yaml.dump(patches, { schema: entryListSchema }).trimEnd()}\n`
  writeFileSync(path, content, 'utf8')
}

/**
 * Upsert or clear `disabled` for one patch id without disturbing other fields.
 * @param patches - current profile patch rows.
 * @param patchId - Loader entry `id` targeted by the user layer.
 * @param enabled - desired effective enablement.
 * @returns the next patch list to persist.
 */
export function upsertPatchDisabled(
  patches: PatchOptions[],
  patchId: string,
  enabled: boolean,
): PatchOptions[] {
  return upsertPatchEnablement(patches, patchId, enabled)
}

/**
 * Upsert enablement for one patch id, optionally replacing the row `config`.
 * @param patches - current profile patch rows.
 * @param patchId - Loader entry `id` targeted by the user layer.
 * @param enabled - desired effective enablement.
 * @param config - when set on enable, replaces the targeted row config in the user layer.
 * @returns the next patch list to persist.
 */
export function upsertPatchEnablement(
  patches: PatchOptions[],
  patchId: string,
  enabled: boolean,
  config?: Record<string, unknown>,
  revertDisableOverride = false,
): PatchOptions[] {
  const next = structuredClone(patches)
  const index = next.findIndex(patch => patch.id === patchId && patch.insert === undefined)
  const existing = index >= 0 ? next[index] : undefined
  if (enabled) {
    if (config !== undefined) {
      const row: PatchOptions = { id: patchId, disabled: false, config }
      if (existing === undefined) next.push(row)
      else next[index] = { ...existing, ...row }
      return next
    }
    if (existing === undefined) {
      next.push({ id: patchId, disabled: false })
      return next
    }
    if (revertDisableOverride) {
      const keys = Object.keys(existing).filter(key => key !== 'id' && key !== 'insert')
      if (keys.every(key => key === 'disabled')) {
        next.splice(index, 1)
        return next
      }
    }
    delete existing.disabled
    const keys = Object.keys(existing).filter(key => key !== 'id')
    if (keys.length === 0) next[index] = { id: patchId, disabled: false }
    return next
  }
  if (existing !== undefined) {
    next[index] = { ...existing, disabled: true }
    return next
  }
  next.push({ id: patchId, disabled: true })
  return next
}

/**
 * Write enablement for one plugin into the profile patch file.
 * @param ctx - Host root context whose `baseUrl` anchors the profile directory.
 * @param patchId - Loader entry `id` to patch.
 * @param enabled - desired effective enablement.
 * @param config - optional row config replacement when enabling.
 * @param disablePatchIds - sibling patch ids to disable atomically when enabling.
 * @param revertDisableOverride - when enabling a bundle-managed row, drop a user-layer
 *   `disabled` override instead of writing `disabled: false`.
 */
export async function writeProfilePatchEnablement(
  ctx: Context,
  patchId: string,
  enabled: boolean,
  config?: Record<string, unknown>,
  disablePatchIds: readonly string[] = [],
  revertDisableOverride = false,
): Promise<void> {
  const path = profilePatchPath(ctx)
  await withFileLock(path, async () => {
    let patches = readProfilePatches(path)
    if (enabled) {
      for (const id of disablePatchIds) {
        patches = upsertPatchEnablement(patches, id, false, undefined, false)
      }
    }
    patches = upsertPatchEnablement(patches, patchId, enabled, config, revertDisableOverride)
    writeProfilePatches(path, patches)
  })
}

/**
 * Apply enablement to the running root Include's composed patch list.
 * Live profiles mount plugins through a readonly include tree, so this is the
 * only in-process path that can settle before the profile patch watcher runs.
 * @param includeEntry - root Include loader entry from {@link getRootIncludeEntry}.
 * @param patchId - Loader entry `id` to patch.
 * @param enabled - desired effective enablement.
 * @param config - optional row config replacement when enabling.
 */
export async function applyComposedPatchEnablement(
  includeEntry: Entry,
  patchId: string,
  enabled: boolean,
  config?: Record<string, unknown>,
): Promise<void> {
  const includeConfig = includeEntry.options.config as Include.Config
  const patches = upsertPatchEnablement(
    structuredClone(includeConfig.patches ?? []),
    patchId,
    enabled,
    config,
  )
  await includeEntry.update({
    config: {
      ...includeConfig,
      patches,
    },
  })
}

/** @deprecated Use {@link writeProfilePatchEnablement}. */
export async function writeProfilePatchDisabled(
  ctx: Context,
  patchId: string,
  enabled: boolean,
): Promise<void> {
  await writeProfilePatchEnablement(ctx, patchId, enabled)
}

/**
 * Wait until one Loader entry reflects the expected enablement or time out.
 * @param ctx - Host root context.
 * @param entryId - Loader-tree entry id.
 * @param enabled - expected enablement after HMR applies the patch file.
 * @param timeoutMs - maximum wait in milliseconds.
 */
export async function waitForEntryEnablement(
  ctx: Context,
  entryId: string,
  patchId: string,
  enabled: boolean,
  timeoutMs = 10_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      await ctx.loader.await()
    } catch {
      // Include reload can reject mid-flight while the patch file is settling.
    }
    for (const entry of ctx.loader.entries()) {
      if (entry.id !== entryId && entry.options.id !== patchId) continue
      if (!entry.disabled === enabled) return
      break
    }
    await new Promise(resolve => setTimeout(resolve, 25))
  }
  throw new Error(`plugin inventory: timed out waiting for entry "${entryId}" enablement`)
}
