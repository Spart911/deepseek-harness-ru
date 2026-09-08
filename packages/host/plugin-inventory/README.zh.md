---
description: "面向 web GUI 宿主的 Cordis Loader 插件清单 Remote：通过 pluginInventory/list 与 pluginInventory/setEnabled 列出条目摘要并切换启用状态。"
kind: "package-reference"
---

# @deepseek-ai/dsh-host-plugin-inventory

[English](README.md) | 中文

## 概述

客户端与设置页可以展示宿主当前组合了什么，并单独打开或关闭插件：调用 `pluginInventory/list` 即按 Loader 顺序返回当前的非组条目——条目 id、模块标识、有效启用状态、设置页是否可切换该行、可选的 package.json 摘要，以及根 Fiber 阶段（`pending`、`loading`、`active`、`failed` 或 `unloading`；条目没有存活根 Fiber 时为 `null`）。调用 `pluginInventory/setEnabled` 会通过 Loader 配置树更新一个可变条目并返回新快照。Loader 仍是唯一的生命周期权威；本包不拥有第二份缓存或事件流。Client 包通过显式的 [`api-remotes`](../../api/remotes/README.zh.md) 组合消费这些 Remote，而不导入 Host 实现。

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

当客户端或设置页需要展示宿主当前组合了什么——哪些插件已加载、已启用、是否存活——时调用 `pluginInventory/list`。当受信任客户端需要启用或停用其中一行时调用 `pluginInventory/setEnabled`。Remote 是唯一入口：该服务仅供 Remote 使用，刻意不声明同进程 Cordis `Context` merge。

### 快照包含什么

每一行是一个非组 Loader 条目：其条目 id、精确模块标识、有效启用状态（含被禁用的祖先组）、清单是否允许切换它、模块解析到包时可选的 package.json `description` 摘要，以及当前根 Fiber 阶段。`pending` 表示条目等待加载，`loading` 表示正在读取，`active` 表示正在运行，`failed` 表示其 fiber 被拒绝，`unloading` 表示正在拆除；`null` 表示完全不存在存活的根 Fiber。结构性的 group 行会被跳过。

### 你能用它做什么、不能做什么

该清单是供展示与受控启停的实时投影：客户端可以渲染名单、标出失败条目、比较快照，并切换可变行。组合关键模块（设置界面外壳、本地化、web 传输、本清单自身及相关 runner）报告 `mutable: false` 并拒绝 `setEnabled`。服务仍不携带历史——已经失败并被移除的 fiber 缺席——且每次 `list()` 或成功的 `setEnabled` 都会再次读取 Loader。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现细节——点击展开</summary>

### 设计概念

该网关是没有第二套生命周期真相的直接投影：每次 `list()` 都读取 `ctx.loader.entries()`，并把每个非组条目映射为公开行。`setEnabled` 按 id 解析条目，拒绝不可变模块，然后调用 `ctx.loader.update` 清除或设置 `disabled`，并返回新投影。Cordis 内部的 plugin/status 事件已经维护 `Entry.fiber` 与 `Fiber.state`，再加缓存只会多出一份需要同步的生命周期真相。

### 阶段映射

Fiber 状态映射到公开阶段词汇，其中 `disposed` 折叠为 `null`——fiber 已消失的条目没有可报告的存活根。因此阶段从不区分为何没有存活根：条目可能从未启动，或其 fiber 可能已被 dispose。

### 源码映射

| 文件 | 角色 |
|---|---|
| [`src/index.ts`](src/index.ts) | `PluginInventoryGateway`：`pluginInventory` Remote 服务、投影与启停变更 |
| [`src/types.ts`](src/types.ts) | 公开载荷类型：`PluginInventoryEntry`、`PluginInventorySnapshot`、`PluginFiberPhase` |
| [`src/mutable.ts`](src/mutable.ts) | 组合关键模块拒绝列表，用于 `mutable` / `setEnabled` |
| [`src/summary.ts`](src/summary.ts) | 为清单摘要解析 package.json description |
| [`src/invariant.ts`](src/invariant.ts) | 不变量伴生（无运行时不变量；每个快照都直接投影 Loader 拥有的状态） |

Typert 生成由 `./typert` 与 `./remote` 暴露的 Host 与 Client Remote 产物。

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

当清单契约不够用时阅读这些内容：Remote 如何到达客户端，然后是它所投影的 Loader 与渲染它的界面。

- [Remote 组合](../../api/remotes/README.zh.md) — 客户端如何在不导入 Host 实现的情况下消费 `pluginInventory/list` 与 `pluginInventory/setEnabled`。
- [Cordis plugin loader](../../../vendor/loader/README.md) — 本包投影并更新其条目的 Loader。
- [插件清单设置界面](../../client/ui-settings-plugin-inventory/README.zh.md) — 渲染并切换清单的浏览器侧投影。

-----

<a id="model-experience"></a>
## 模型体验

无；宿主侧 Loader 投影不注册任何面向模型的内容。

#### KV Cache 影响

无；本包既不组装也不发送提供方请求。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>


这些限制定义了瞬时清单无法告诉客户端的内容。它们是当前包约束，不是任务积压。

- **仅瞬时状态** — 结果不含持久失败历史或订阅；缺失的根 Fiber 一律报告为 `null`，不论为何没有存活根。
- **无来源信息** — 服务不标识是哪个 bundle、profile 或覆盖引入了条目。
- **受保护模块保持不可变** — 设置页不能停用同一会话中维持 web GUI 与本清单可达性所需的模块。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文——点击展开</summary>

无。

</details>
