import "server-only";

export type Locale = "en" | "ko" | "zh";

const dictionaries = {
  en: () => import("./dictionaries/en.json").then((module) => module.default),
  ko: () => import("./dictionaries/ko.json").then((module) => module.default),
  zh: () => import("./dictionaries/zh.json").then((module) => module.default),
};

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)[Locale]>>;

export const getDictionary = async (locale: Locale) => {
  if (!dictionaries[locale]) {
    return dictionaries.en();
  }

  return dictionaries[locale]();
};
