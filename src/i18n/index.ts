import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import it from './locales/it';
import en from './locales/en';
import es from './locales/es';
import fr from './locales/fr';
import zh from './locales/zh';
import { landing } from './landing';

export const SUPPORTED_LANGS = ['it', 'en', 'es', 'fr', 'zh'] as const;
export type AppLang = typeof SUPPORTED_LANGS[number];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      it: { translation: { ...it, landing: landing.it } },
      en: { translation: { ...en, landing: landing.en } },
      es: { translation: { ...es, landing: landing.es } },
      fr: { translation: { ...fr, landing: landing.fr } },
      zh: { translation: { ...zh, landing: landing.zh } },
    },
    fallbackLng: 'it',
    supportedLngs: SUPPORTED_LANGS as unknown as string[],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'app_lang',
    },
  });

export default i18n;
