/**
 * Russian language pack for the web GUI.
 * Registers `ru` in the locale catalog and contributes Russian dictionaries
 * for namespaces this package owns today (`common`, `settings.locale`).
 * Untranslated namespaces fall through to English via the declared fallback.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { commonRu } from './common.ts'

/** BCP 47 language id registered by this pack. */
export const RU_LOCALE_ID = 'ru'

/** Locale-owned Language row namespace (owned by dsh-client-locale). */
const SETTINGS_LOCALE_NS = 'settings.locale'

/** Required service: the shared locale catalog and dictionary registry. */
export const inject = ['locale']

/**
 * Register the Russian language definition and the dictionaries this pack owns.
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
  ctx.effect(
    () => ctx.locale.register('common', RU_LOCALE_ID, commonRu),
    'locale-ru: common dictionary',
  )
  ctx.effect(
    () => ctx.locale.register(SETTINGS_LOCALE_NS, RU_LOCALE_ID, {
      'language.title': 'Язык',
    }),
    'locale-ru: settings.locale dictionary',
  )
}
