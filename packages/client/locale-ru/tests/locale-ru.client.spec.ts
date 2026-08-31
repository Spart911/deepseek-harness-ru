// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import {
  LocaleRuntime,
  SETTINGS_NS,
  type LocaleSnapshot,
} from '@deepseek-ai/dsh-client-locale/client'
import { en as commonEn } from '@deepseek-ai/dsh-client-locale/src/locales/en.ts'
import { zh as commonZh } from '@deepseek-ai/dsh-client-locale/src/locales/zh.ts'
import { en as settingsEn } from '@deepseek-ai/dsh-client-locale/src/locales/settings.ts'
import { zh as settingsZh } from '@deepseek-ai/dsh-client-locale/src/locales/settings.ts'
import { apply, inject, RU_LOCALE_ID } from '../src/client/index.ts'
import { commonRu } from '../src/client/common.ts'

const stubLanguages = (...tags: string[]): void => {
  vi.stubGlobal('navigator', { languages: tags, language: tags[0] ?? '' })
}

/** Mount a LocaleRuntime with the built-in dictionaries, then the Russian pack. */
async function mountRu(browserTags: string[] = ['en-US']) {
  stubLanguages(...browserTags)
  const ctx = new Context()
  const events: LocaleSnapshot[] = []
  ctx.on('locale/change', (snapshot) => { events.push(snapshot) })
  const locale = new LocaleRuntime(ctx)
  ctx.provide('locale', locale)
  locale.register('common', { zh: commonZh, en: commonEn })
  locale.register(SETTINGS_NS, { zh: settingsZh, en: settingsEn })
  const fiber = ctx.plugin({ inject: [...inject], apply })
  await fiber.await()
  return { ctx, locale, fiber, events }
}

describe('locale-ru language pack', () => {
  beforeEach(() => {
    stubLanguages('en-US')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('declares the locale service dependency', () => {
    expect(inject).toEqual(['locale'])
  })

  it('registers Russian for selection and translates owned dictionaries', async () => {
    const { locale } = await mountRu()
    expect(locale.getLocale().locales.map(entry => entry.id)).toContain(RU_LOCALE_ID)
    locale.setLocale(RU_LOCALE_ID)
    expect(locale.getLocale().active).toBe(RU_LOCALE_ID)
    expect(locale.bind('common')('cancel')).toBe(commonRu.cancel)
    expect(locale.bind(SETTINGS_NS)('language.title')).toBe('Язык')
  })

  it('falls through to English for keys and namespaces this pack does not own', async () => {
    const { locale } = await mountRu()
    locale.register('other', 'en', { onlyEn: 'English only' })
    locale.setLocale(RU_LOCALE_ID)
    expect(locale.bind('other' as string)('onlyEn')).toBe('English only')
    expect(locale.bind('common')('cancel')).toBe(commonRu.cancel)
  })

  it('adopts Russian when the browser prefers a ru-* tag', async () => {
    const { locale } = await mountRu(['ru-RU', 'en-US'])
    expect(locale.getLocale().active).toBe(RU_LOCALE_ID)
    expect(locale.bind('common')('save')).toBe(commonRu.save)
  })

  it('removes the language and dictionaries when the plugin fiber disposes', async () => {
    const { locale, fiber } = await mountRu()
    locale.setLocale(RU_LOCALE_ID)
    expect(locale.getLocale().active).toBe(RU_LOCALE_ID)
    await fiber.dispose()
    expect(locale.getLocale().locales.map(entry => entry.id)).not.toContain(RU_LOCALE_ID)
    expect(locale.getLocale().active).toBe('en')
  })
})
