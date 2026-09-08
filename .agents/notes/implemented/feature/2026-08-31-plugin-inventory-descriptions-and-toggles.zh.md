# Agent Note: 插件清单描述与启停开关

Status: implemented

[English](2026-08-31-plugin-inventory-descriptions-and-toggles.md) | 中文

## 问题

Web 设置中的**插件列表**标签页只显示模块短名称与诊断状态。俄语发行版的操作者需要在每行下方看到可读描述，并在不手改 profile YAML 的情况下启用或停用插件。Host 清单 Remote 刻意只读，因此仅靠客户端开关无法持久化 Loader 启停。

## 决策

**Host `pluginInventory` 增加 `setEnabled` 与更丰富的 list 行。** 每个快照条目增加 `mutable`（组合关键模块保持为 false）与 `summary`（可解析时取 package.json `description`）。`setEnabled(entryId, enabled)` 通过 `loader.update` 更新 Loader 条目，经配置树持久化，并返回新快照。不可变模块会抛错，而不是停用设置、本地化、传输、webserver 或清单自身。

**设置标签页展示描述与开关。** 卡片在标题下渲染本地化描述，并为可变行提供开关。描述优先使用无类型的 `settings.pluginInventory.desc` 命名空间（键为去 scope 的包名），并回退到 Host `summary`。俄语包在该命名空间注册覆盖；英/中内置词典使用 package.json 文本。

## 验证

Host 规格覆盖 list 投影字段、成功切换、不可变拒绝与缺失条目错误。客户端组件规格覆盖描述渲染、按描述搜索、开关调用 `setEnabled` 以及锁定开关。`locale-ru` 保持清单 chrome 键与拥有包一致。

## 考虑过的替代方案

- **仅客户端假开关** — 拒绝；不会改变 Loader 组合，也无法在重载后保留。
- **每个模块都可变** — 拒绝；停用设置/本地化/传输会在同一会话中失去界面恢复路径。
- **为每个插件使用类型化 locale 键** — 拒绝；数百个包键会强迫每个语言包双语齐套；无类型 desc 命名空间让覆盖保持可选。

## 后果

- 设置 → 插件 → 插件列表可启停可变插件，并显示描述（激活 `ru` 时为俄语）。
- 可变条目可从 GUI 改变磁盘上的 profile 组合。
- 语言包拥有面向产品的描述语气；Host 摘要仍以英文 package.json 文本作为回退。
