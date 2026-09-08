---
description: "Cordis Loader inventory tab in Web Plugins settings: searchable plugin catalog with localized descriptions and enablement toggles."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-settings-plugin-inventory

English | [中文](README.zh.md)

## Summary

`dsh-client-ui-settings-plugin-inventory` contributes the **Plugin list** tab to the Web Settings Plugins section. The tab lazily calls `ctx.remote.pluginInventory.list()` the first time it is selected and renders a searchable two-column catalog of compact disclosure cards: each collapsed card shows the short module name, a localized or package.json description, an effective-enablement tag, a switch for mutable rows, and (for enabled entries) a colored root-fiber status dot; expanding a card reveals the Loader-tree entry id, effective configuration, and Cordis status. Loading, empty, no-match, and generic failure states stay local to the mounted component, and a failed read can be retried without exposing transport details.

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

Open the Plugins section in Settings and select the **Plugin list** tab to inspect and toggle the Host's plugin inventory. The tab reads no Remote during plugin activation — selecting it for the first time mounts the component and lazily calls `ctx.remote.pluginInventory.list()` through `api-remotes`.

### Reading a card

Each collapsed card uses the short module name as its title, shows a description under the title when one is available, and uses a small effective-enablement tag plus a switch; enabled entries also show a colored root-fiber status dot. Expanding one card reveals its Loader-tree entry id, followed by the effective configuration and, for enabled entries, Cordis status; disabled entries omit the redundant unmounted runtime state. Search filters the catalog by name, description, and entry id.

### Enabling or disabling a plugin

Mutable rows expose a switch that calls `pluginInventory/setEnabled` and replaces the catalog with the returned snapshot. Composition-critical modules keep a disabled switch and explain why in the expanded details. A failed toggle shows a generic error on that card without exposing transport details.

### Retrying a failed read

A failed read renders a generic failure state inside the tab; retrying re-runs the lazy `list()` call without exposing transport details.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The tab projects a Host-owned snapshot, then mutates enablement only through `setEnabled`; it performs no Remote read during plugin activation and takes the snapshot on first selection.

### Registration

The browser plugin registers one localized `settings.plugins.tab` contribution with id `all`; the Plugins section owns the navigation entry and tab chrome. Registration uses `ctx.slots.inject()`, so it follows late tab declaration, redeclaration, locale changes, and teardown without importing the section owner. Descriptions live in the untyped `settings.pluginInventory.desc` namespace (package short names) so language packs can override Host package.json summaries.

### Rendering

The entry id remains the React key, disclosure identity, detail value, and an additional search target; it is never classified by string shape.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Host plugin inventory](../../host/plugin-inventory/README.md) — the Remote that supplies snapshots and enablement toggles.
- [Plugins settings section](../ui-settings-plugins/README.md) — the section that hosts this tab.
- [Russian language pack](../locale-ru/README.md) — Russian chrome and description overrides for this tab.

-----

<a id="model-experience"></a>
## Model Experience

None, as the browser-side inventory projection registers nothing model-facing.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>


- **Host deny-list owns immutability** — the client disables switches from the snapshot's `mutable` flag; it does not invent its own protected set.
- **Description fallback** — when no locale override exists, the card shows the Host package.json summary; builtins without a package stay without a description line.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
