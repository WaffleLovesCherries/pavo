/**
 * Which kind of paper a recipe is written on. A tiny hash of the title picks
 * one of four styles, so a recipe always gets the same sheet without anyone
 * having to choose. Shared by the cards, the viewer drawer and the recipe page.
 */

export const PAPER_STYLES = ['clean', 'ruled', 'torn', 'taped'] as const;
export type PaperStyle = (typeof PAPER_STYLES)[number];

function hash(title: string): number {
  let h = 7;
  for (const ch of title) h = (h * 31 + (ch.codePointAt(0) ?? 0)) >>> 0;
  return h;
}
export function titleHash(title: string): number {
  return hash(title) % 4;
}

export interface Paper {
  style: PaperStyle;
  tilt: number;
}

export function paperFor(title: string): Paper {
  const h = hash(title);
  const style = PAPER_STYLES[h % 4]!;
  const tilt = (((h >>> 2) % 5) - 2) * 0.55;
  return { style, tilt };
}
