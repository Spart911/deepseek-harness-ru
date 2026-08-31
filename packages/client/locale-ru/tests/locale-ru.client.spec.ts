// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import {
  LocaleRuntime,
  SETTINGS_NS,
  type LocaleSnapshot,
} from '@deepseek-ai/dsh-client-locale/client'
import { en as commonEn } from '@deepseek-ai/dsh-client-locale/src/locales/en.ts'
import { zh as commonZh } from '@deepseek-ai/dsh-client-locale/src/locales/zh.ts'
import { en as settingsEn } from '@deepseek-ai/dsh-client-locale/src/locales/settings.ts'
import { zh as settingsZh } from '@deepseek-ai/dsh-client-locale/src/locales/settings.ts'
import { en as sidebarEn } from '../../ui-sidebar/src/client/locales.ts'
import { en as workspaceEn } from '../../ui-workspace/src/client/locales.ts'
import { en as conversationEn } from '../../ui-conversation/src/client/locales.ts'
import { en as chatEn } from '../../ui-chat/src/client/locale.ts'
import { en as settingsGeneralEn } from '../../ui-settings-general/src/client/locales.ts'
import { en as settingsModelsEn } from '../../ui-settings-models/src/client/locales.ts'
import { en as settingsThemeEn } from '../../ui-theme/src/client/locales.ts'
import { en as settingsPluginsEn } from '../../ui-settings-plugins/src/client/locales.ts'
import { en as settingsPluginInventoryEn } from '../../ui-settings-plugin-inventory/src/client/locales.ts'
import { en as settingsAgentPresetEn } from '../../ui-agent-preset/src/client/locales.ts'
import {
  accessEn as permissionAccessEn,
  en as settingsPermissionEn,
} from '../../ui-permission-presets/src/client/locales.ts'
import { en as commandEn } from '../../ui-commands/src/client/locales.ts'
import { en as modelEn } from '../../ui-model-selection/src/client/locales.ts'
import { en as slashMenuEn } from '../../ui-input-trigger/src/client/locales.ts'
import { en as approvalEn } from '../../ui-approval/src/client/locales.ts'
import { en as planEn } from '../../ui-plan/src/client/locales.ts'
import { en as goalEn } from '../../ui-goal/src/client/locales.ts'
import { en as questionEn } from '../../ui-user-questions/src/client/locales.ts'
import { en as feedbackEn } from '../../ui-message-feedback/src/client/locales.ts'
import { en as jobEn } from '../../ui-jobs/src/client/locales.ts'
import { en as skillEn } from '../../ui-skill/src/client/locales.ts'
import { en as referenceEn } from '../../ui-reference/src/client/locales.ts'
import { en as deliverablesEn } from '../../ui-deliverables/src/client/locales.ts'
import { en as workflowRunEn } from '../../ui-workflow-run/src/client/locales.ts'
import { en as subagentEn } from '../../ui-subagent/src/client/locales.ts'
import { en as cordisEn } from '../../../extensions/ui-cordis/src/client/locales.ts'
import { en as trajectoryEn } from '../../ui-trajectory/src/client/locales.ts'
import { en as sessionLogDownloadEn } from '../../../session-query/session-log-export/src/client/locales.ts'
import { apply, inject, RU_LOCALE_ID } from '../src/client/index.ts'
import { commonRu } from '../src/client/common.ts'
import { ruNamespaces } from '../src/client/dicts/index.ts'
import { sidebarRu } from '../src/client/dicts/sidebar.ts'
import { workspaceRu } from '../src/client/dicts/workspace.ts'
import { conversationRu } from '../src/client/dicts/conversation.ts'
import { chatRu } from '../src/client/dicts/chat.ts'
import { settingsRu } from '../src/client/dicts/settings.ts'
import { settingsModelsRu } from '../src/client/dicts/settings-models.ts'
import { settingsThemeRu } from '../src/client/dicts/settings-theme.ts'
import { settingsPluginsRu } from '../src/client/dicts/settings-plugins.ts'
import { settingsPluginInventoryRu } from '../src/client/dicts/settings-plugin-inventory.ts'
import { settingsAgentPresetRu } from '../src/client/dicts/settings-agent-preset.ts'
import { permissionAccessRu, settingsPermissionRu } from '../src/client/dicts/permission.ts'
import { commandRu } from '../src/client/dicts/command.ts'
import { modelRu } from '../src/client/dicts/model.ts'
import { slashMenuRu } from '../src/client/dicts/slash-menu.ts'
import { directoryBrowserRu } from '../src/client/dicts/directory-browser.ts'
import { approvalRu } from '../src/client/dicts/approval.ts'
import {
  deliverablesRu,
  feedbackRu,
  goalRu,
  jobRu,
  planRu,
  questionRu,
  referenceRu,
  skillRu,
  workflowRunRu,
} from '../src/client/dicts/misc.ts'
import { subagentRu } from '../src/client/dicts/subagent.ts'
import { cordisRu } from '../src/client/dicts/cordis.ts'
import { trajectoryRu } from '../src/client/dicts/trajectory.ts'
import { sessionLogDownloadRu } from '../src/client/dicts/session-log-download.ts'

const stubLanguages = (...tags: string[]): void => {
  vi.stubGlobal('navigator', { languages: tags, language: tags[0] ?? '' })
}

const keysOf = (dict: Record<string, string>): string[] => Object.keys(dict).sort()

/** English keys for `directory-browser` (inline in the owning plugin, not exported). */
const directoryBrowserEn: Record<string, string> = {
  'browser.title': 'Select Workspace Directory',
  'browser.home': 'Home',
  'browser.newFolder': 'New folder',
  'browser.folderName': 'Folder name',
  'browser.createIn': 'New folder in "{name}"',
  'browser.untitledFolder': 'Untitled folder',
  'browser.create': 'Create',
  'browser.cancel': 'Cancel',
  'browser.open': 'Open',
  'browser.editPath': 'Edit path',
  'browser.loading': 'Loading…',
  'browser.truncated': 'Too many folders to list; only the beginning is shown.',
  'browser.showHidden': 'Show hidden files',
}

/** Mount a LocaleRuntime with the built-in dictionaries, then the Russian pack. */
async function mountRu(browserTags: string[] = ['en-US']) {
  stubLanguages(...browserTags)
  const ctx = new Context()
  const events: LocaleSnapshot[] = []
  ctx.on('locale/change', (snapshot) => { events.push(snapshot) })
  const locale = new LocaleRuntime(ctx)
  ctx.provide('locale', locale)
  locale.register('common', { zh: commonZh, en: commonEn })
  locale.register(SETTINGS_NS, { zh: settingsZh, en: settingsEn })
  const fiber = ctx.plugin({ inject: [...inject], apply })
  await fiber.await()
  return { ctx, locale, fiber, events }
}

describe('locale-ru language pack', () => {
  beforeEach(() => {
    stubLanguages('en-US')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('declares the locale service dependency', () => {
    expect(inject).toEqual(['locale'])
  })

  it('covers the English key set for every owned UI namespace', () => {
    expect(keysOf(commonRu)).toEqual(keysOf(commonEn))
    expect(keysOf({ 'language.title': 'Язык' })).toEqual(keysOf(settingsEn))
    expect(keysOf(sidebarRu)).toEqual(keysOf(sidebarEn))
    expect(keysOf(workspaceRu)).toEqual(keysOf(workspaceEn))
    expect(keysOf(settingsRu)).toEqual(keysOf(settingsGeneralEn))
    expect(keysOf(settingsThemeRu)).toEqual(keysOf(settingsThemeEn))
    expect(keysOf(settingsModelsRu)).toEqual(keysOf(settingsModelsEn))
    expect(keysOf(settingsPluginsRu)).toEqual(keysOf(settingsPluginsEn))
    expect(keysOf(settingsPluginInventoryRu)).toEqual(keysOf(settingsPluginInventoryEn))
    expect(keysOf(settingsAgentPresetRu)).toEqual(keysOf(settingsAgentPresetEn))
    expect(keysOf(settingsPermissionRu)).toEqual(keysOf(settingsPermissionEn))
    expect(keysOf(permissionAccessRu)).toEqual(keysOf(permissionAccessEn))
    expect(keysOf(commandRu)).toEqual(keysOf(commandEn))
    expect(keysOf(modelRu)).toEqual(keysOf(modelEn))
    expect(keysOf(slashMenuRu)).toEqual(keysOf(slashMenuEn))
    expect(keysOf(directoryBrowserRu)).toEqual(keysOf(directoryBrowserEn))
    expect(keysOf(conversationRu)).toEqual(keysOf(conversationEn))
    expect(keysOf(chatRu)).toEqual(keysOf(chatEn))
    expect(keysOf(approvalRu)).toEqual(keysOf(approvalEn))
    expect(keysOf(planRu)).toEqual(keysOf(planEn))
    expect(keysOf(goalRu)).toEqual(keysOf(goalEn))
    expect(keysOf(questionRu)).toEqual(keysOf(questionEn))
    expect(keysOf(feedbackRu)).toEqual(keysOf(feedbackEn))
    expect(keysOf(jobRu)).toEqual(keysOf(jobEn))
    expect(keysOf(skillRu)).toEqual(keysOf(skillEn))
    expect(keysOf(referenceRu)).toEqual(keysOf(referenceEn))
    expect(keysOf(deliverablesRu)).toEqual(keysOf(deliverablesEn))
    expect(keysOf(workflowRunRu)).toEqual(keysOf(workflowRunEn))
    expect(keysOf(subagentRu)).toEqual(keysOf(subagentEn))
    expect(keysOf(cordisRu)).toEqual(keysOf(cordisEn))
    expect(keysOf(trajectoryRu)).toEqual(keysOf(trajectoryEn))
    expect(keysOf(sessionLogDownloadRu)).toEqual(keysOf(sessionLogDownloadEn))
  })

  it('registers Russian for selection and translates owned dictionaries', async () => {
    const { locale } = await mountRu()
    expect(locale.getLocale().locales.map(entry => entry.id)).toContain(RU_LOCALE_ID)
    locale.setLocale(RU_LOCALE_ID)
    expect(locale.getLocale().active).toBe(RU_LOCALE_ID)
    expect(locale.bind('common')('cancel')).toBe(commonRu.cancel)
    expect(locale.bind(SETTINGS_NS)('language.title')).toBe('Язык')
    expect(locale.bind('sidebar' as string)('session.new')).toBe(sidebarRu['session.new'])
    expect(locale.bind('settings' as string)('title')).toBe(settingsRu.title)
    expect(locale.bind('conversation' as string)('input.send')).toBe(conversationRu['input.send'])
    expect(locale.bind('chat' as string)('view.chat')).toBe(chatRu['view.chat'])
    expect(locale.bind('trajectory' as string)('view.trajectory')).toBe(trajectoryRu['view.trajectory'])
  })

  it('falls through to English for keys and namespaces this pack does not own', async () => {
    const { locale } = await mountRu()
    locale.register('other', 'en', { onlyEn: 'English only' })
    locale.setLocale(RU_LOCALE_ID)
    expect(locale.bind('other' as string)('onlyEn')).toBe('English only')
    expect(locale.bind('common')('cancel')).toBe(commonRu.cancel)
  })

  it('adopts Russian when the browser prefers a ru-* tag', async () => {
    const { locale } = await mountRu(['ru-RU', 'en-US'])
    expect(locale.getLocale().active).toBe(RU_LOCALE_ID)
    expect(locale.bind('common')('save')).toBe(commonRu.save)
  })

  it('registers every declared namespace and removes them when the plugin fiber disposes', async () => {
    const { locale, fiber } = await mountRu()
    locale.setLocale(RU_LOCALE_ID)
    expect(locale.getLocale().active).toBe(RU_LOCALE_ID)
    expect(ruNamespaces.map(([ns]) => ns)).toContain('trajectory')
    expect(ruNamespaces.map(([ns]) => ns)).toContain('session-log-download')
    await fiber.dispose()
    expect(locale.getLocale().locales.map(entry => entry.id)).not.toContain(RU_LOCALE_ID)
    expect(locale.getLocale().active).toBe('en')
  })
})
