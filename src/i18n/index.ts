import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fa from './locales/fa-AF.json';
const numberFormatters = new Map<string, Intl.NumberFormat>();
function formatInterpolation(value: unknown, _format?: string, locale = 'en') {
  if (typeof value !== 'number') return String(value);
  if (!numberFormatters.has(locale)) numberFormatters.set(locale, new Intl.NumberFormat(locale));
  return numberFormatters.get(locale)!.format(value);
}
function applyLanguage(locale: string) {
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === 'fa-AF' ? 'rtl' : 'ltr';
}
void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, 'fa-AF': { translation: fa } },
  lng: 'en', supportedLngs: ['en', 'fa-AF'], fallbackLng: false, keySeparator: false,
  interpolation: { escapeValue: false, alwaysFormat: true, format: formatInterpolation },
  parseMissingKeyHandler: key => { if (import.meta.env.DEV) console.error(`Missing translation: ${key}`); return `⟦${key}⟧`; },
});
i18n.on('languageChanged', applyLanguage);
applyLanguage(i18n.language);
export default i18n;
