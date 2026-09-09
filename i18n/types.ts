export type Locale = 'en' | 'pt' | 'es';

export const LOCALES: Locale[] = ['en', 'pt', 'es'];

export const LOCALE_STORAGE_KEY = 'boomsync-locale';

export const LOCALE_NATIVE_NAMES: Record<Locale, string> = {
  en: 'English',
  pt: 'Português',
  es: 'Español',
};

export type TranslationParams = Record<string, string | number>;

/** Nested string dictionary — leaves are strings. */
export type TranslationTree = { [key: string]: string | TranslationTree };
