import en from "../../languages/en.json";

type TranslationDictionary = typeof en;
type TranslationKey = keyof TranslationDictionary;
type TranslationParams = Record<string, string | number>;

const dictionaries = {
  en,
};

export const translate = (
  language: "en",
  key: TranslationKey,
  params?: TranslationParams,
): string => {
  const template = dictionaries[language][key] ?? dictionaries.en[key] ?? key;

  if (!params) {
    return template;
  }

  return Object.entries(params).reduce(
    (value, [paramKey, paramValue]) =>
      value.replaceAll(`{${paramKey}}`, String(paramValue)),
    template,
  );
};
