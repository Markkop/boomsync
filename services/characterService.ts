import { CharacterFull, CharacterIndex } from '../types';
import characterIndexData from '../characters/index.json';

const characterIndex: CharacterIndex[] = characterIndexData.characters;
const characterCache: Map<string, CharacterFull> = new Map();

export async function getCharacter(name: string): Promise<CharacterFull | null> {
  if (characterCache.has(name)) {
    return characterCache.get(name)!;
  }

  const indexEntry = characterIndex.find(c => c.name === name);
  if (!indexEntry) {
    return null;
  }

  try {
    // Dynamic import with explicit .json extension for Vite
    const teamData = await import(`../characters/${indexEntry.file.replace('.json', '')}.json`);
    const char = teamData.characters?.find((c: CharacterFull) => c.name === name);
    
    if (char) {
      // Ensure all required fields exist with defaults
      const normalizedChar: CharacterFull = {
        name: char.name || name,
        team: char.team || indexEntry.team,
        winCondition: char.winCondition || '',
        powers: Array.isArray(char.powers) ? char.powers : [],
        tags: Array.isArray(char.tags) ? char.tags : [],
        worksWellWith: Array.isArray(char.worksWellWith) ? char.worksWellWith : [],
        doesntWorkWellWith: Array.isArray(char.doesntWorkWellWith) ? char.doesntWorkWellWith : [],
        requires: Array.isArray(char.requires) ? char.requires : [],
        requiresGroup: char.requiresGroup || indexEntry.requiresGroup,
        notes: Array.isArray(char.notes) ? char.notes : []
      };
      characterCache.set(name, normalizedChar);
      return normalizedChar;
    }
  } catch (error) {
    console.error(`Failed to load character ${name} from ${indexEntry.file}:`, error);
  }

  return null;
}

export function getAllCharacters(): CharacterIndex[] {
  return characterIndex;
}

export function getCharactersByTeam(team: string): CharacterIndex[] {
  return characterIndex.filter(c => c.team === team);
}

export function searchCharacters(query: string): CharacterIndex[] {
  const lowerQuery = query.toLowerCase();
  return characterIndex.filter(c => 
    c.name.toLowerCase().includes(lowerQuery) ||
    c.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

export function filterCharactersByTag(tag: string): CharacterIndex[] {
  return characterIndex.filter(c => c.tags.includes(tag));
}

export function getAllTags(): string[] {
  const tagSet = new Set<string>();
  characterIndex.forEach(c => {
    c.tags.forEach(tag => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}
