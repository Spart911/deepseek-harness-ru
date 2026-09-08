---
description: "Cordis Loader plugin inventory Remote for web GUI hosts: list entries with summaries and toggle enablement through pluginInventory/list and pluginInventory/setEnabled."
kind: "package-reference"
---

# @deepseek-ai/dsh-host-plugin-inventory

English | [中文](README.zh.md)

## Summary

Clients and settings pages can show what is currently composed in the host and turn individual plugins on or off: calling `pluginInventory/list` returns the current non-group Loader entries in Loader order — entry id, module specifier, effective enablement, whether Settings may toggle the row, an optional package.json summary, and root Fiber phase (`pending`, `loading`, `active`, `failed`, or `unloading`, or `null` when an entry has no live root Fiber). Calling `pluginInventory/setEnabled` updates one mutable entry through the Loader config tree and returns a fresh snapshot. The Loader remains the sole lifecycle authority; this package owns no second cache or event stream. Client packages consume the Remotes through the explicit [`api-remotes`](../../api/remotes/README.md) assembly rather than importing the Host implementation.

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

Call `pluginInventory/list` when a client or settings page needs to show what is currently composed in the host — which plugins are loaded, enabled, and alive. Call `pluginInventory/setEnabled` when a trusted client should enable or disable one of those rows. The Remotes are the only entry points: the service is Remote-only and deliberately declares no same-process Cordis `Context` merge.

### What a snapshot contains

Each row is one non-group Loader entry: its entry id, the exact module specifier, the effective enablement (including disabled ancestor groups), whether the inventory may toggle it, an optional package.json `description` summary when the module resolves to a package, and the current root Fiber phase. `pending` means the entry waits to load, `loading` that it is being read, `active` that it is running, `failed` that its fiber rejected, and `unloading` that it is being torn down; `null` means no live root Fiber exists at all. Structural group rows are skipped.

### What you can and cannot do with it

The inventory is a live projection for display and controlled enablement: a client can render the roster, flag failed entries, compare snapshots, and toggle mutable rows. Composition-critical modules (Settings chrome, locale, web transport, this inventory itself, and related runners) report `mutable: false` and reject `setEnabled`. The service still carries no history — a fiber that already failed and was removed is absent — and every `list()` or successful `setEnabled` reads the Loader again.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

### Design concept

The gateway is a direct projection with no second lifecycle truth: every `list()` call reads `ctx.loader.entries()` and maps each non-group entry to its public row. `setEnabled` resolves the entry by id, refuses immutable modules, then calls `ctx.loader.update` with `disabled` cleared or set and returns a fresh projection. Cordis's internal plugin/status events already maintain `Entry.fiber` and `Fiber.state`, so a cache would only add another lifecycle truth to keep synchronized.

### The phase mapping

Fiber states map onto the public phase vocabulary, with `disposed` folding into `null` — an entry whose fiber is gone has no live root to report. The phase therefore never distinguishes why no live root exists: the entry may never have started, or its fiber may already have been disposed.

### Source map

| File | Role |
|---|---|
| [`src/index.ts`](src/index.ts) | `PluginInventoryGateway`: the `pluginInventory` Remote service, projection, and enablement mutation |
| [`src/types.ts`](src/types.ts) | Public payload types: `PluginInventoryEntry`, `PluginInventorySnapshot`, `PluginFiberPhase` |
| [`src/mutable.ts`](src/mutable.ts) | Composition-critical module deny-list for `mutable` / `setEnabled` |
| [`src/summary.ts`](src/summary.ts) | package.json description resolution for inventory summaries |
| [`src/invariant.ts`](src/invariant.ts) | Invariant companion (no runtime invariant; every snapshot projects Loader-owned state) |

Typert generates the Host and Client Remote artifacts exposed by `./typert` and `./remote`.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

Read these when the inventory contract is not enough: how the Remote reaches clients, then the Loader it projects and the surface that renders it.

- [Remote assembly](../../api/remotes/README.md) — how clients consume `pluginInventory/list` and `pluginInventory/setEnabled` without importing the Host implementation.
- [Cordis plugin loader](../../../vendor/loader/README.md) — the Loader whose entries this package projects and updates.
- [Plugin inventory settings surface](../../client/ui-settings-plugin-inventory/README.md) — the browser-side projection that renders and toggles the inventory.

-----

<a id="model-experience"></a>
## Model Experience

None, as the host-side Loader projection registers nothing model-facing.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>


These limits define what a point-in-time inventory cannot tell a client. They are current package constraints, not a task backlog.

- **Point-in-time state only** — the result contains no durable failure history or subscription; a missing root Fiber is reported as `null`, regardless of why no live root exists.
- **No provenance** — the service does not identify which bundle, profile, or override introduced an entry.
- **Protected modules stay immutable** — Settings cannot disable the modules required to keep the web GUI and this inventory reachable in the same session.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
