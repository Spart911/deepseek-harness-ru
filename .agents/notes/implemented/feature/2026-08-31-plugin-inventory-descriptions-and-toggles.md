# Agent Note: Plugin inventory descriptions and enablement toggles

Status: implemented

English | [中文](2026-08-31-plugin-inventory-descriptions-and-toggles.zh.md)

## Problem

The Web Settings **Plugin list** tab showed only short module names and diagnostic status. Operators on the Russian distribution needed a readable description under each row and a way to enable or disable plugins without editing profile YAML by hand. The Host inventory Remote was intentionally read-only, so a client-only switch could not persist Loader enablement.

## Decision

**Host `pluginInventory` gains `setEnabled` and richer list rows.** Each snapshot entry adds `mutable` (composition-critical modules stay false) and `summary` (package.json `description` when resolvable). `setEnabled(entryId, enabled)` updates the Loader entry through `loader.update`, persists via the config tree, and returns a fresh snapshot. Immutable modules throw rather than disable Settings, locale, remotes, webserver, or the inventory itself.

**The Settings tab shows descriptions and switches.** Cards render a localized description under the title and a switch for mutable rows. Descriptions prefer the untyped `settings.pluginInventory.desc` namespace (keys are unscoped package names) and fall back to Host `summary`. The Russian pack registers overrides in that namespace; English/Chinese ship package.json text as the built-in dictionaries.

## Verification

Host specs cover list projection fields, successful toggles, immutable refusal, and missing-entry errors. Client component specs cover description rendering, search-by-description, switch calls to `setEnabled`, and locked switches. `locale-ru` keeps chrome-key parity with the inventory owning package.

## Alternatives considered

- **Client-only fake toggles** — rejected; they would not change Loader composition or survive reload.
- **Always-mutable every module** — rejected; disabling Settings/locale/transport strands the session with no in-UI recovery.
- **Typed locale keys per plugin** — rejected; hundreds of package keys would force bilingual balance on every language pack; the untyped desc namespace keeps overrides optional.

## Consequences

- Settings → Plugins → Plugin list can enable/disable mutable plugins and shows descriptions (Russian when `ru` is active).
- Profile on-disk composition can change from the GUI for mutable entries.
- Language packs own product-facing description tone; Host summaries remain English package.json text as fallback.
