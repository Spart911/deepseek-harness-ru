# Agent Note: Russian as an external language pack

Status: implemented

[English](2026-08-31-russian-locale-language-pack.md) | 中文

## Problem

DeepSeek Harness 的俄语发行版需要可选的俄语 UI，但不能在 `dsh-client-locale` 内分叉内置的 `zh`/`en` 语言对。把俄语硬编码进核心 locale 包会把每次上游合并绑到产品专用语言；完全不提供俄语则让 RF Web 界面默认保持英语，直到用户自己找到设置。locale 服务已通过 `addLanguage` 与单语言词典注册支持外部语言；发行版仍需要在随附的 web 组合中挂载一个具体的语言包。

## Decision

**俄语以外部客户端语言包 `@deepseek-ai/dsh-client-locale-ru` 交付。** 该包注册 `ru`（标签 `Русский`，回退 `en`），并为它所拥有的命名空间贡献俄语词典。这些命名空间位于 `packages/client/locale-ru/src/client/dicts/`，覆盖随附 Client UI 界面（`common`、`settings.locale`、shell 与设置、会话、聊天、轨迹、Session 导出，以及在此注册的其他功能命名空间）。未翻译的键按声明的回退链走到英语。该包不改动 `FALLBACK_LOCALE`，不改写 Host 偏好解析，也不在浏览器或已存储偏好指向其他已注册语言时强制使用 `ru`。

**随附的 web profile 在 `dsh-client-locale` 之后挂载该包。** `packages/bundle/web-app/cordis.patch.yml` 插入 `locale-ru` 行，web-app 包依赖该 workspace 包，以便 profile 的 `node_modules` 解析能够加载它。在现有的浏览器派生临时 locale 规则下，`ru-RU` 一类浏览器标签通过主语言子标签匹配到 `ru`。

## Verification

包级规格挂载带有内置词典的 `LocaleRuntime`，应用该包，并固定选择、已拥有键的翻译、未拥有命名空间的英语回退、`ru-RU` 浏览器采纳、fiber 卸载移除该语言，以及每个已拥有 UI 命名空间的英语键对等。`pnpm run test:gui` 在客户端套件中覆盖该包。

## Alternatives considered

- **把 `ru` 作为与 `zh`/`en` 并列的第三内置 locale** — 不予采用，因为内置注册要求每个 UI 命名空间立刻具备完整双语键对，并会重新打开语言包本要扩展的封闭内置集合。
- **只交付自定义 `ru-web` profile 而不改 `web`** — 推迟到后续发行层；第一个语言包必须能从现有的 `dsh web` 路径到达，以便无需单独的 profile 安装故事即可在设置中出现俄语。
- **无视浏览器/Host 偏好强制以 `ru` 为产品默认** — 对本包不予采用；俄语优先的安装器或 profile 可稍后设置偏好，而无需把强制默认写进语言包本身。
- **一个重导出全部 UI 命名空间的词典文件** — 不以单文件交付；词典按界面分文件放在 `src/client/dicts/`，以便后续命名空间可独立落地。

## Consequences

- 「设置 → 通用」列出 **Русский**；选择后立即切换已拥有文案。
- 上游 locale 与 UI 包保持可合并；俄语文案集中在一个所属包中。
- 缺失的俄语键会在整体俄语外壳中回退到英语，直到补上该键。
