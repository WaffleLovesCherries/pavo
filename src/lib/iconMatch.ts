/**
 * Finds icons for free text by looking up the words in ICON_KEYWORDS.
 * Pure functions: they run at build time (recipe sheet, method steps) and in
 * the recipe composer's client script.
 */
import { ICON_KEYWORDS } from '../config/iconKeywords.ts';

interface Match {
  icon: string;
  index: number;
  length: number;
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** One regex per icon, built once: whole words, accents stripped, optional s/es plural. */
const PATTERNS: [string, RegExp][] = Object.entries(ICON_KEYWORDS).map(([icon, words]) => {
  const alternatives = words
    .map(normalize)
    .sort((a, b) => b.length - a.length)
    .map(escape)
    .join('|');
  return [icon, new RegExp(`(?<![\\p{L}\\p{N}])(?:${alternatives})(?:es|s)?(?![\\p{L}\\p{N}])`, 'gu')];
});

function allMatches(text: string): Match[] {
  const hay = normalize(text);
  const found: Match[] = [];
  for (const [icon, re] of PATTERNS) {
    re.lastIndex = 0;
    for (let m = re.exec(hay); m; m = re.exec(hay)) {
      found.push({ icon, index: m.index, length: m[0].length });
    }
  }
  // Longest phrase first, then keep only matches that do not overlap one already kept.
  found.sort((a, b) => b.length - a.length || a.index - b.index);
  const kept: Match[] = [];
  for (const m of found) {
    const end = m.index + m.length;
    if (!kept.some((k) => m.index < k.index + k.length && k.index < end)) kept.push(m);
  }
  return kept.sort((a, b) => a.index - b.index);
}

/** Icons mentioned in `text`, in reading order, without repeats, at most `limit`. */
export function matchIcons(text: string, limit = Infinity): string[] {
  const icons: string[] = [];
  for (const m of allMatches(text)) {
    if (!icons.includes(m.icon)) icons.push(m.icon);
    if (icons.length >= limit) break;
  }
  return icons;
}

/** The single best icon for an ingredient name: the longest phrase that matches, or undefined. */
export function guessIcon(text: string): string | undefined {
  const matches = allMatches(text);
  if (!matches.length) return undefined;
  return matches.reduce((best, m) => (m.length > best.length ? m : best)).icon;
}
