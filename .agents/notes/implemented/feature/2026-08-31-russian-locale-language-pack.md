# Agent Note: Russian as an external language pack

Status: implemented

English | [中文](2026-08-31-russian-locale-language-pack.zh.md)

## Problem

The Russian distribution of DeepSeek Harness needs a selectable Russian UI without forking the built-in `zh`/`en` locale pair inside `dsh-client-locale`. Hardcoding Russian into the core locale package would couple every upstream merge to a product-specific language, while shipping no Russian at all leaves the RF web surface English-only until each user discovers Settings. The locale service already admits external languages through `addLanguage` and single-locale dictionary registration; the distribution still needs a concrete pack mounted in the shipped web composition.

## Decision

**Russian ships as `@deepseek-ai/dsh-client-locale-ru`, an external client language pack.** The pack registers `ru` with label `Русский` and fallback `en`, then contributes Russian dictionaries for the namespaces it owns. Today those namespaces are `common` and `settings.locale`. Untranslated keys and other namespaces walk the declared fallback chain to English. The pack does not alter `FALLBACK_LOCALE`, does not rewrite Host preference resolution, and does not force `ru` when the browser or a stored preference names another registered language.

**The shipped web profile mounts the pack after `dsh-client-locale`.** `packages/bundle/web-app/cordis.patch.yml` inserts the `locale-ru` row, and the web-app package depends on the workspace package so profile `node_modules` resolution can load it. Browser tags such as `ru-RU` match `ru` by primary subtag under the existing browser-derived provisional locale rules.

## Verification

Package specs mount a `LocaleRuntime` with the built-in dictionaries, apply the pack, and pin selection, owned-key translation, English fallback for unowned namespaces, `ru-RU` browser adoption, and fiber disposal removing the language. `pnpm run test:gui` covers the package under the client suites.

## Alternatives considered

- **Add `ru` as a third built-in locale beside `zh`/`en`** — rejected because built-in registration requires complete bilingual key pairs across every UI namespace at once, and it reopens the closed built-in set that language packs were designed to extend.
- **Ship only a custom `ru-web` profile without changing `web`** — deferred for a later distribution layer; the first pack must be reachable from the existing `dsh web` path so Russian appears in Settings without a separate profile install story.
- **Force `ru` as the product default regardless of browser/Host preference** — rejected for this pack; a Russian-first installer or profile can set preference later without baking a forced default into the language pack itself.
- **One dictionary file that re-exports every UI namespace** — deferred; partial coverage with English fallback keeps the first PR reviewable and lets later PRs grow namespace coverage independently.

## Consequences

- Settings → General lists **Русский**; selecting it switches owned copy immediately and falls through to English elsewhere until more dictionaries land.
- Upstream locale and UI packages stay mergeable; Russian copy lives in one owned package.
- Coverage gaps are visible as English strings inside an otherwise Russian chrome until each namespace gains a Russian dictionary.
