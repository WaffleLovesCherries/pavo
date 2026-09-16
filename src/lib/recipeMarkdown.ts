/**
 * Turns a recipe drafted in the browser into the Markdown file the content
 * collection expects (see src/content/recipe-template.md). Pure functions,
 * so they run both in the composer's client script and in `npm test`.
 */

export interface RecipeDraft {
  name: string;
  category: string;
  icon?: string;
  kind?: string;
  prep: string;
  effort: number;
  sweetness: number;
  bitterness: number;
  intensity?: number;
  profile: string;
  pairs: number;
  tags: string[];
  lastMade?: string;
  /** [name, amount] or [name, amount, icon]; the icon is a file name from src/icons. */
  ingredients: [string, string, string?][];
  method: string;
}

export function slugify(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'recipe';
}

const YAML_WORDS = /^(true|false|yes|no|on|off|null|~)$/i;

/**
 * Writes a string as a YAML scalar, bare when it is unambiguous and
 * double-quoted otherwise. In a flow sequence ("[a, b]") commas and brackets
 * also need quoting. Numbers are quoted unless the caller allows them.
 */
function scalar(value: string, { flow = false, allowNumber = false } = {}): string {
  const v = value.trim();
  const unsafe =
    v === '' ||
    /^[-?:,[\]{}#&*!|>'"%@`]/.test(v) ||
    /: |\s#/.test(v) ||
    /[:\s]$/.test(v) ||
    YAML_WORDS.test(v) ||
    (!allowNumber && /^[-+]?(\d[\d_]*\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(v)) ||
    (flow && /[,[\]{}]/.test(v));
  return unsafe ? JSON.stringify(v) : v;
}

export function buildRecipeMarkdown(d: RecipeDraft): string {
  const lines: string[] = ['---', `name: ${scalar(d.name)}`, `category: ${d.category}`];
  if (d.icon) lines.push(`icon: ${d.icon}`);
  if (d.kind?.trim()) lines.push(`kind: ${scalar(d.kind)}`);
  lines.push(
    `prep: ${scalar(d.prep)}`,
    `effort: ${d.effort}`,
    `sweetness: ${d.sweetness}`,
    `bitterness: ${d.bitterness}`,
  );
  if (d.intensity) lines.push(`intensity: ${d.intensity}`);
  lines.push(`profile: ${scalar(d.profile)}`, `pairs: ${Math.round(d.pairs)}`);

  const tags = d.tags.map((t) => t.trim()).filter(Boolean);
  if (tags.length) lines.push(`tags: [${tags.map((t) => scalar(t, { flow: true })).join(', ')}]`);
  if (d.lastMade) lines.push(`lastMade: ${d.lastMade}`);

  const ingredients = d.ingredients.filter(([n]) => n.trim());
  if (ingredients.length) {
    lines.push('ingredients:');
    for (const [n, a, icon] of ingredients) {
      const items = [scalar(n, { flow: true }), scalar(a, { flow: true, allowNumber: true })];
      if (icon?.trim()) items.push(icon.trim());
      lines.push(`  - [${items.join(', ')}]`);
    }
  }
  lines.push('---');

  const method = d.method.trim();
  return lines.join('\n') + '\n' + (method ? `\n${method}\n` : '');
}
