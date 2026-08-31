---
description: "Web GUI 的俄语语言包：注册 ru 并贡献俄语词典，供需要俄语浏览器界面的用户与维护者使用。"
kind: "package-reference"
---

# @deepseek-ai/dsh-client-locale-ru

[English](README.md) | 中文

## Summary

本包把俄语加入 Web GUI 语言目录。它通过 `ctx.locale.addLanguage` 注册 `ru`（回退到英语），并为当前拥有的命名空间（`common` 与 `settings.locale`）贡献俄语词典。缺失的键以及其他命名空间回退到英语。当部署需要在「设置 → 通用」中提供俄语时，把它挂在 `dsh-client-locale` 旁边；随附的 web profile 已包含本包。

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

在浏览器 roster 中于 `dsh-client-locale` 之后加载本插件。无需配置。

### Choosing Russian

打开「设置 → 通用」并选择 **Русский**。浏览器声明 `ru` 或 `ru-RU` 且没有已存储语言偏好时，会自动以俄语打开。本包尚未翻译的键仍显示英语。

### Extending coverage

在本包（或兄弟包）中为每个你拥有的 UI 命名空间增加更多 `ctx.locale.register(ns, 'ru', dict)` 效果。不要把内置 `zh`/`en` 词典分叉进 `dsh-client-locale`；语言包保持外部扩展。

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

[`src/client/index.ts`](src/client/index.ts) 把语言定义与所拥有的词典注册为 Cordis effect，以便卸载时撤销。Node 半是空的 Loader 占位。按 locale 服务约定，每个键的查找走 `ru` → `en`，再在 `common` 中重复该链。

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [dsh-client-locale](../locale/README.zh.md) — 本包扩展的目录、偏好与词典注册表。
- [Locale-owned client UI copy](../../../.agents/notes/implemented/architecture/2026-08-23-locale-owned-client-ui-copy.zh.md) — 产品文案所有权规则。
- [Russian as an external language pack](../../../.agents/notes/implemented/feature/2026-08-31-russian-locale-language-pack.zh.md) — 为何俄语以语言包而非内置 locale 交付。

-----

<a id="model-experience"></a>
## Model Experience

None, as the package contributes browser localization only; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Partial coverage** — 本包目前仅为 `common` 与 `settings.locale` 提供俄语；其他 UI 命名空间在补充词典前回退到英语。
- **No product-default override** — 当浏览器与 Host 偏好指向其他语言时，本包不会强制使用 `ru`；俄语优先的发行版需另行设置偏好或浏览器语言。

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
