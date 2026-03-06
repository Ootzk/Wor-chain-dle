import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { CONFIG } from './constants/config'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from './locales/en/translation.json'
import ko from './locales/ko/translation.json'
import ja from './locales/ja/translation.json'
import es from './locales/es/translation.json'
import sw from './locales/sw/translation.json'
import zh from './locales/zh/translation.json'

export const localeLanguageKey = 'i18nextLng'

i18next
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // detect language from browser - this will check the localstorage localeLanguageKey and use the declared CONFIG.defaultLang otherwise
  .use(LanguageDetector)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    resources: {
      en: { translation: en },
      ko: { translation: ko },
      ja: { translation: ja },
      es: { translation: es },
      sw: { translation: sw },
      zh: { translation: zh },
    },
    fallbackLng: CONFIG.defaultLang,
    debug: false,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
  })

export default i18next
