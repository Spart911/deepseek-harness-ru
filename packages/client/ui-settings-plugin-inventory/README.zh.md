---
description: "Web 设置「插件」分区中的 Cordis Loader 清单标签页：可搜索的插件目录，含本地化描述与启停开关。"
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-settings-plugin-inventory

[English](README.md) | 中文

## 概述

`dsh-client-ui-settings-plugin-inventory` 向 Web 设置的「插件」分区贡献**插件列表**标签页。该标签页在首次被选择时懒调用 `ctx.remote.pluginInventory.list()`，并以可搜索的双列紧凑折叠卡片展示清单：每张收起的卡片显示模块短名称、本地化或 package.json 描述、有效启停标签、可变行的开关，以及（对已启用条目）彩色根 fiber 状态圆点；展开卡片会显示 Loader 树条目 id、有效配置与 Cordis 状态。加载、空结果、无匹配与通用失败状态只属于已挂载组件，读取失败后可以重试，且不会暴露传输细节。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

打开设置中的「插件」分区并选择**插件列表**标签页，即可查看并切换宿主的插件清单。插件激活期间不会读取 Remote——首次选择该标签页时才挂载组件，并通过 `api-remotes` 懒调用 `ctx.remote.pluginInventory.list()`。

### 阅读卡片

每张收起的卡片使用模块短名称作为标题，在有描述时显示在标题下方，并以小标签与开关表示有效启停状态；已启用的条目还会显示彩色根 fiber 状态圆点。展开卡片后会直接展示 Loader 树条目 id、有效配置，已启用条目还会显示 Cordis 状态；已停用条目省略重复的「未挂载」运行状态。搜索按名称、描述与条目 id 过滤目录。

### 启用或停用插件

可变行提供开关，调用 `pluginInventory/setEnabled` 并用返回的快照替换目录。组合关键模块保持禁用开关，并在展开详情中说明原因。切换失败会在该卡片上显示通用错误，且不会暴露传输细节。

### 重试失败的读取

读取失败会在标签页内渲染通用失败状态；重试会重新执行懒 `list()` 调用，且不会暴露传输细节。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现细节——点击展开</summary>

该标签页投影宿主拥有的快照，并仅通过 `setEnabled` 变更启停；插件激活期间不执行任何 Remote 读取，首次选择时才取快照。

### 注册

浏览器插件注册一个 id 为 `all` 的本地化 `settings.plugins.tab` 贡献；「插件」分区拥有导航入口与标签栏。注册使用 `ctx.slots.inject()`，因此能跟随标签 slot 的延迟声明、重新声明、本地化变化与 teardown，而无需 import 分区拥有方。描述放在无类型的 `settings.pluginInventory.desc` 命名空间（包短名），以便语言包覆盖 Host 的 package.json 摘要。

### 渲染

条目 id 仍是 React key、折叠身份、详情值与额外搜索目标；从不按字符串形态分类。

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

- [宿主插件清单](../../host/plugin-inventory/README.zh.md) — 提供快照与启停切换的 Remote。
- [插件设置分区](../ui-settings-plugins/README.zh.md) — 承载本标签页的分区。
- [俄语语言包](../locale-ru/README.zh.md) — 本标签页的俄语界面文案与描述覆盖。

-----

<a id="model-experience"></a>
## 模型体验

无；浏览器侧清单投影不注册任何面向模型的内容。

#### KV Cache 影响

无；本包既不组装也不发送提供方请求。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>


- **不可变性由宿主拒绝列表拥有** — 客户端根据快照的 `mutable` 标志禁用开关，不自造受保护集合。
- **描述回退** — 没有本地化覆盖时，卡片显示 Host 的 package.json 摘要；没有包的 builtin 不显示描述行。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文——点击展开</summary>

无。

</details>
