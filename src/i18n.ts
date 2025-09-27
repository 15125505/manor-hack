import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import zhCN from "./locales/zh-CN.json";
import en from "./locales/en.json";

function getLanguage() {
  if (localStorage.getItem("test") == "1") {
    return "en";
  }
  const lang = navigator.language || (navigator as any).userLanguage;
  if (lang === "zh-CN" || lang === "zh-SG") {
    return "zh-CN";
  }
  return "en";
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      "zh-CN": { translation: zhCN },
      en: { translation: en }
    },
    lng: getLanguage(),
    fallbackLng: "en",
    interpolation: { escapeValue: false }
  });

export default i18n; 