/** `command` namespace dictionaries (popupSelect shell + slash-menu catalog copy). */

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'search.placeholder': '搜索…',
  'search.aria': '筛选选项',
  'status.loading': '正在加载选项…',
  'status.applying': '正在应用…',
  'status.empty': '无选项',
  'overlay.aria': '/{command} 选项',
  'listbox.aria': '/{command} 匹配项',
  'notice.imagesUnsupported': '/{command} 不接受图片附件，请先移除图片',
  'catalog.compact': '压缩较早的对话历史',
  'catalog.export': '将本 Session 日志下载为 ZIP 归档',
  'catalog.feedback': '记录关于本会话的反馈',
  'catalog.goal': '设置或查看长任务的目标',
  'catalog.permission': '切换权限预设（沙箱模式与审批策略）',
  'catalog.plan': '进入或退出计划模式',
  'catalog.model': '选择本会话使用的模型',
} satisfies Record<string, string>

/** The command namespace key union. */
export type CommandKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'search.placeholder': 'Search…',
  'search.aria': 'Filter options',
  'status.loading': 'Loading options…',
  'status.applying': 'Applying…',
  'status.empty': 'No options',
  'overlay.aria': '/{command} options',
  'listbox.aria': '/{command} matches',
  'notice.imagesUnsupported': '/{command} does not accept image attachments; remove them first',
  'catalog.compact': 'Compact older conversation history',
  'catalog.export': 'Download this Session log as a ZIP archive',
  'catalog.feedback': 'Record feedback about this session',
  'catalog.goal': 'Set or view the goal for a long-running task',
  'catalog.permission': 'Switch the permission preset (sandbox mode + approval policy)',
  'catalog.plan': 'Enter or leave plan mode',
  'catalog.model': 'Select the model for this conversation',
} satisfies Record<CommandKey, string>

/** Catalog keys owned by this namespace for shipped slash commands. */
const CATALOG_BY_NAME = {
  compact: 'catalog.compact',
  export: 'catalog.export',
  feedback: 'catalog.feedback',
  goal: 'catalog.goal',
  permission: 'catalog.permission',
  plan: 'catalog.plan',
  model: 'catalog.model',
} as const satisfies Record<string, CommandKey>

/**
 * Resolve a slash-menu description for a known shipped command.
 * @param name - command name without the leading slash.
 * @param fallback - host or contribution description when no catalog key exists.
 * @param t - `command` namespace translator.
 * @returns localized catalog copy, or the fallback for host-configured extras.
 */
export function catalogDescription(
  name: string,
  fallback: string,
  t: (key: CommandKey) => string,
): string {
  const key = CATALOG_BY_NAME[name as keyof typeof CATALOG_BY_NAME]
  return key === undefined ? fallback : t(key)
}
