/**
 * Russian language pack for the web GUI.
 * Registers `ru` in the locale catalog and contributes Russian dictionaries
 * for shipped UI namespaces. Missing keys fall through to English.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { ruNamespaces } from './dicts/index.ts'

/** BCP 47 language id registered by this pack. */
export const RU_LOCALE_ID = 'ru'

/** Required service: the shared locale catalog and dictionary registry. */
export const inject = ['locale']

/**
 * Register the Russian language definition and owned dictionaries.
 * @param ctx - Client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(
    () => ctx.locale.addLanguage({
      id: RU_LOCALE_ID,
      label: 'Русский',
      fallback: 'en',
    }),
    'locale-ru: language',
  )
  for (const [ns, dict] of ruNamespaces) {
    ctx.effect(
      () => ctx.locale.register(ns, RU_LOCALE_ID, dict),
      `locale-ru: ${ns} dictionary`,
    )
  }
}
