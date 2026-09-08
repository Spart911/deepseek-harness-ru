---
description: "Russian language pack for the web GUI: registers ru and contributes Russian dictionaries for users and maintainers shipping a Russian-ready browser surface."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-locale-ru

English | [中文](README.zh.md)

## Summary

This package adds Russian to the web GUI language catalog. It registers `ru` through `ctx.locale.addLanguage` with English as the fallback, and contributes Russian dictionaries for the shipped UI namespaces listed in `src/client/dicts/` (shell, settings, conversation, chat, trajectory, session export, and the other Client feature namespaces). Missing keys fall through to English. Mount it beside `dsh-client-locale` when the deployment should offer Russian in Settings → General; the shipped web profile includes it.

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

Load this plugin in the browser roster after `dsh-client-locale`. No configuration is required.

### Choosing Russian

Open Settings → General and select **Русский**. A browser that advertises `ru` or `ru-RU` (and has no stored locale preference) opens in Russian automatically. Keys this pack has not translated yet render from English.

### Extending coverage

Add further `ctx.locale.register(ns, 'ru', dict)` effects in this package (or a sibling pack) for each UI namespace you own. Do not fork built-in `zh`/`en` dictionaries into `dsh-client-locale`; language packs stay external.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

[`src/client/index.ts`](src/client/index.ts) registers the language definition and every dictionary in [`src/client/dicts/`](src/client/dicts/) as Cordis effects so disposal reverses them. The node half is an empty Loader seat. Lookup walks `ru` → `en` for each key, then repeats that chain in `common`, per the locale service contract.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [dsh-client-locale](../locale/README.md) — the catalog, preference, and dictionary registry this pack extends.
- [Locale-owned client UI copy](../../../.agents/notes/implemented/architecture/2026-08-23-locale-owned-client-ui-copy.md) — product copy ownership rules.
- [Russian as an external language pack](../../../.agents/notes/implemented/feature/2026-08-31-russian-locale-language-pack.md) — why Russian ships as a pack, not a built-in locale.

-----

<a id="model-experience"></a>
## Model Experience

None, as the package contributes browser localization only; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **No product-default override** — this pack does not force `ru` when the browser and Host preference name another language; a Russian-first distribution sets preference or browser language separately.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
