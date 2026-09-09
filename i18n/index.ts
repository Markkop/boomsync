import { en } from './en';
import { es } from './es';
import { pt } from './pt';
import type { Locale, TranslationParams, TranslationTree } from './types';
import { LOCALE_STORAGE_KEY, LOCALES } from './types';

export type { Locale, TranslationParams, TranslationTree };
export { LOCALE_NATIVE_NAMES, LOCALE_STORAGE_KEY, LOCALES } from './types';
export {
  characterMatchesQuery,
  formatTagLabel,
  getKeywordDefinition,
  translateCharacter,
  translateCharacterIndex,
  translateKeywordLabel,
  translatePowerType,
  translatePresetMeta,
  translatePresetName,
  translateRelationLabel,
  translateRoleName,
  translateTag,
} from './display';

const dictionaries: Record<Locale, TranslationTree> = { en, pt, es };

function lookup(tree: TranslationTree, path: string): string | undefined {
  const parts = path.split('.');
  let cur: string | TranslationTree | undefined = tree;
  for (const part of parts) {
    if (cur == null || typeof cur === 'string') return undefined;
    cur = cur[part];
  }
  return typeof cur === 'string' ? cur : undefined;
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

export function t(locale: Locale, key: string, params?: TranslationParams): string {
  const dict = dictionaries[locale] ?? dictionaries.en;
  const raw = lookup(dict, key) ?? lookup(dictionaries.en, key) ?? key;
  return interpolate(raw, params);
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as string[]).includes(value);
}

export function readStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // ignore
  }
  return 'en';
}

export function writeStoredLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignore
  }
}

export function pluralSuffix(n: number): string {
  return n === 1 ? '' : 's';
}
