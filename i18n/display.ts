import type { CharacterFull, CharacterIndex, CharacterPower, Preset } from '../types';
import type { Locale } from './types';
import type { CharacterOverlay, CharacterOverlayCatalog } from './characters/types';
import ptCatalogJson from './characters/pt.json';
import esCatalogJson from './characters/es.json';
import { KEYWORD_GLOSSARY, KEYWORD_KEYS } from './keywords';
import { PAUSE_GAME_TAG, TAG_LABELS } from './tags';
import { POWER_TYPE_LABELS } from './powerTypes';
import { PRESET_OVERLAYS } from './presets';
import { RELATION_LABELS } from './relations';

const ptCatalog = ptCatalogJson as CharacterOverlayCatalog;
const esCatalog = esCatalogJson as CharacterOverlayCatalog;

const catalogs: Record<Exclude<Locale, 'en'>, CharacterOverlayCatalog> = {
  pt: ptCatalog,
  es: esCatalog,
};

function overlayCatalog(locale: Locale): CharacterOverlayCatalog | null {
  if (locale === 'en') return null;
  return catalogs[locale] ?? null;
}

export function getCharacterOverlay(locale: Locale, englishName: string): CharacterOverlay | undefined {
  return overlayCatalog(locale)?.[englishName];
}

/** Display name for a role. `name` must be the English canonical key. */
export function translateRoleName(locale: Locale, name: string): string {
  if (!name) return name;
  if (locale === 'en') return name;
  const overlayName = overlayCatalog(locale)?.[name]?.name;
  if (overlayName) return overlayName;
  const relation = RELATION_LABELS[locale]?.[name];
  return relation ?? name;
}

export function translateTag(locale: Locale, tag: string): string {
  if (!tag) return tag;
  if (locale === 'en') return tag;
  const pause = tag.match(/^pauses?\s+game\s+(\d+)$/i);
  if (pause) {
    return PAUSE_GAME_TAG[locale].replace('{{n}}', pause[1]);
  }
  return TAG_LABELS[locale]?.[tag] ?? tag;
}

export function formatTagLabel(locale: Locale, tag: string): string {
  const label = translateTag(locale, tag);
  if (locale === 'en') {
    return label
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function translatePowerType(locale: Locale, type: string): string {
  if (!type || locale === 'en') return type;
  return POWER_TYPE_LABELS[locale]?.[type] ?? type;
}

export function translateRelationLabel(locale: Locale, value: string): string {
  return translateRoleName(locale, value);
}

export function translateIndexDescription(locale: Locale, englishName: string, fallback?: string): string | undefined {
  if (locale === 'en') return fallback;
  return overlayCatalog(locale)?.[englishName]?.description ?? fallback;
}

export function translateCharacterIndex(locale: Locale, character: CharacterIndex): CharacterIndex {
  if (locale === 'en') return character;
  const overlay = getCharacterOverlay(locale, character.name);
  return {
    ...character,
    // Keep English `name`, `tags`, and `requires` as canonical keys.
    description: overlay?.description ?? character.description,
    requiresGroup: overlay?.requiresGroup ?? character.requiresGroup,
  };
}

export function translateCharacter(locale: Locale, character: CharacterFull): CharacterFull {
  if (locale === 'en') return character;
  const overlay = getCharacterOverlay(locale, character.name);
  const powers: CharacterPower[] = character.powers.map((power, index) => {
    const overlayPower = overlay?.powers?.[index];
    return {
      ...power,
      name: overlayPower?.name ?? power.name,
      // Keep English type for icon/keyword matching; translate at display with translatePowerType.
      type: power.type,
      description: overlayPower?.description ?? power.description,
    };
  });
  return {
    ...character,
    name: overlay?.name ?? character.name,
    winCondition: overlay?.winCondition ?? character.winCondition,
    powers,
    notes: overlay?.notes ?? character.notes,
    requiresGroup: overlay?.requiresGroup ?? character.requiresGroup,
  };
}

export function translatePresetName(locale: Locale, preset: Pick<Preset, 'id' | 'name'>): string {
  if (locale === 'en') return preset.name;
  return PRESET_OVERLAYS[locale]?.[preset.id]?.name ?? preset.name;
}

export function translatePresetMeta(locale: Locale, preset: Pick<Preset, 'id' | 'metaAnalysis'>): string {
  if (locale === 'en') return preset.metaAnalysis;
  return PRESET_OVERLAYS[locale]?.[preset.id]?.metaAnalysis ?? preset.metaAnalysis;
}

export function translateKeywordLabel(locale: Locale, englishKey: string): string {
  const entry = KEYWORD_GLOSSARY[englishKey];
  if (!entry) return translateTag(locale, englishKey);
  return entry.label[locale] ?? englishKey;
}

export function getKeywordDefinition(locale: Locale, keyword: string): string | undefined {
  const englishKey = resolveKeywordKey(keyword);
  if (!englishKey) return undefined;
  return KEYWORD_GLOSSARY[englishKey]?.definition[locale];
}

/** Resolve a display term (any locale) or English key to the canonical English keyword. */
export function resolveKeywordKey(keyword: string): string | undefined {
  const lower = keyword.toLowerCase().trim();
  if (KEYWORD_GLOSSARY[lower]) return lower;

  if (lower.includes('pause game') || lower.includes('pauses game') || lower.includes('pausa o jogo') || lower.includes('pausa el juego') || lower.includes('pausar jogo') || lower.includes('pausar juego')) {
    return KEYWORD_GLOSSARY['pause game'] ? 'pause game' : 'pauses game';
  }
  const partials: Array<[string, string[]]> = [
    ['card share power', ['card share power', 'poder de compartilhar carta', 'poder de compartir carta', 'compartilhar carta', 'compartir carta']],
    ['color share power', ['color share power', 'poder de compartilhar cor', 'poder de compartir color', 'compartilhar cor', 'compartir color']],
    ['private reveal power', ['private reveal power', 'poder de revelação privada', 'poder de revelación privada', 'revelação privada', 'revelación privada']],
    ['public reveal power', ['public reveal power', 'poder de revelação pública', 'poder de revelación pública', 'revelação pública', 'revelación pública']],
    ['odd player count', ['odd player count', 'número ímpar', 'número impar']],
    ['primary character', ['primary character', 'personagem principal', 'personaje principal']],
    ['card swap', ['card swap', 'troca de cartas', 'intercambio de cartas']],
    ['acting', ['acting', 'interpretação', 'actuación']],
    ['condition', ['condition', 'condição', 'condición']],
    ['contagious', ['contagious', 'contagioso']],
    ['bury', ['bury', 'buried', 'enterrar', 'enterrada']],
  ];
  for (const [key, needles] of partials) {
    if (needles.some(n => lower.includes(n))) return key;
  }

  for (const [key, entry] of Object.entries(KEYWORD_GLOSSARY)) {
    if (entry.label.en.toLowerCase() === lower) return key;
    if (entry.label.pt.toLowerCase() === lower) return key;
    if (entry.label.es.toLowerCase() === lower) return key;
  }
  return undefined;
}

export function getKeywordMatchTerms(locale: Locale): Array<{ term: string; englishKey: string }> {
  const terms: Array<{ term: string; englishKey: string }> = [];
  for (const [key, entry] of Object.entries(KEYWORD_GLOSSARY)) {
    terms.push({ term: entry.label.en, englishKey: key });
    if (locale !== 'en') {
      const localized = entry.label[locale];
      if (localized && localized.toLowerCase() !== entry.label.en.toLowerCase()) {
        terms.push({ term: localized, englishKey: key });
      }
    }
  }
  return terms;
}

export function getRoleNameMatchTerms(locale: Locale): Array<{ term: string; englishName: string }> {
  const terms: Array<{ term: string; englishName: string }> = [];
  const seen = new Set<string>();
  const add = (term: string, englishName: string) => {
    const key = `${term.toLowerCase()}::${englishName}`;
    if (!term || seen.has(key)) return;
    seen.add(key);
    terms.push({ term, englishName });
  };

  const catalog = overlayCatalog(locale);
  const englishNames = new Set<string>([
    ...Object.keys(ptCatalog),
    ...Object.keys(esCatalog),
  ]);
  for (const englishName of englishNames) {
    add(englishName, englishName);
    if (locale !== 'en') {
      const translated = catalog?.[englishName]?.name;
      if (translated) add(translated, englishName);
    }
  }
  return terms;
}

export function characterMatchesQuery(character: CharacterIndex, query: string, locale: Locale): boolean {
  const lower = query.toLowerCase().trim();
  if (!lower) return true;
  if (character.name.toLowerCase().includes(lower)) return true;
  if (translateRoleName(locale, character.name).toLowerCase().includes(lower)) return true;
  if (character.tags.some(tag => tag.toLowerCase().includes(lower) || translateTag(locale, tag).toLowerCase().includes(lower))) {
    return true;
  }
  const desc = translateIndexDescription(locale, character.name, character.description);
  if (desc && desc.toLowerCase().includes(lower)) return true;
  return false;
}

export function isWinConditionPhrase(text: string, termStart: number, termEnd: number): boolean {
  const beforeStart = Math.max(0, termStart - 16);
  const contextText = text.slice(beforeStart, termEnd).toLowerCase();
  return (
    /\bwin\s+condition/.test(contextText) ||
    /\bwin\s+objective/.test(contextText) ||
    /condi[cç][aã]o\s+de\s+vit[oó]ria/.test(contextText) ||
    /objetivo\s+de\s+vit[oó]ria/.test(contextText) ||
    /condici[oó]n\s+de\s+victoria/.test(contextText) ||
    /objetivo\s+de\s+victoria/.test(contextText)
  );
}

export { KEYWORD_KEYS };
