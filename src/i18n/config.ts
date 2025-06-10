import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import heTranslations from "./he.json";
import enTranslations from "./en.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      he: {
        translation: heTranslations,
      },
      en: {
        translation: enTranslations,
      },
    },
    lng: "he",
    fallbackLng: "he",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
