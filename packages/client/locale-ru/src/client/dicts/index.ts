import { commonRu } from '../common.ts'
import { approvalRu } from './approval.ts'
import { chatRu } from './chat.ts'
import { commandRu } from './command.ts'
import { conversationRu } from './conversation.ts'
import { cordisRu } from './cordis.ts'
import { directoryBrowserRu } from './directory-browser.ts'
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
} from './misc.ts'
import { modelRu } from './model.ts'
import { permissionAccessRu, settingsPermissionRu } from './permission.ts'
import { sessionLogDownloadRu } from './session-log-download.ts'
import { settingsRu } from './settings.ts'
import { settingsAgentPresetRu } from './settings-agent-preset.ts'
import { settingsModelsRu } from './settings-models.ts'
import { settingsPluginInventoryRu } from './settings-plugin-inventory.ts'
import { settingsPluginsRu } from './settings-plugins.ts'
import { settingsThemeRu } from './settings-theme.ts'
import { sidebarRu } from './sidebar.ts'
import { slashMenuRu } from './slash-menu.ts'
import { subagentRu } from './subagent.ts'
import { trajectoryRu } from './trajectory.ts'
import { workspaceRu } from './workspace.ts'

/** Namespace id → Russian dictionary for every owned UI surface. */
export const ruNamespaces: ReadonlyArray<readonly [string, Record<string, string>]> = [
  ['common', commonRu],
  ['settings.locale', { 'language.title': 'Язык' }],
  ['sidebar', sidebarRu],
  ['workspace', workspaceRu],
  ['settings', settingsRu],
  ['settings.theme', settingsThemeRu],
  ['settings.models', settingsModelsRu],
  ['settings.plugins', settingsPluginsRu],
  ['settings.pluginInventory', settingsPluginInventoryRu],
  ['settings.agentPreset', settingsAgentPresetRu],
  ['settings.permission', settingsPermissionRu],
  ['permission.access', permissionAccessRu],
  ['command', commandRu],
  ['model', modelRu],
  ['slash.menu', slashMenuRu],
  ['directory-browser', directoryBrowserRu],
  ['conversation', conversationRu],
  ['chat', chatRu],
  ['approval', approvalRu],
  ['plan', planRu],
  ['goal', goalRu],
  ['question', questionRu],
  ['feedback', feedbackRu],
  ['job', jobRu],
  ['skill', skillRu],
  ['reference', referenceRu],
  ['deliverables', deliverablesRu],
  ['workflowRun', workflowRunRu],
  ['subagent', subagentRu],
  ['cordis', cordisRu],
  ['trajectory', trajectoryRu],
  ['session-log-download', sessionLogDownloadRu],
]
