/**
 * Rehype plugin for the method of a recipe: every step (list item, or a
 * paragraph outside a list) whose words match ICON_KEYWORDS gets a
 * `<span class="step-icons">` of `<svg><use>` symbols appended and a
 * `--icons` custom property with their count, so the sheet's CSS can keep
 * the text clear of them. Symbols come from the /icons.svg sprite.
 */
import { matchIcons } from './iconMatch.ts';

interface Node {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: Node[];
}

interface Options {
  /** Site base path, so the sprite URL is right when the site is not at "/". */
  base?: string;
  /** Most icons per step. */
  limit?: number;
}

const SKIP = new Set(['ul', 'ol', 'code', 'pre']);

/** Text of a node, not descending into nested lists or code. */
function text(node: Node): string {
  if (node.type === 'text') return node.value ?? '';
  if (node.type === 'element' && SKIP.has(node.tagName ?? '')) return '';
  return (node.children ?? []).map(text).join('');
}

function iconsSpan(icons: string[], sprite: string): Node {
  return {
    type: 'element',
    tagName: 'span',
    properties: { className: ['step-icons'], ariaHidden: 'true' },
    children: icons.map((name) => ({
      type: 'element',
      tagName: 'svg',
      properties: { className: ['step-icon'] },
      children: [{ type: 'element', tagName: 'use', properties: { href: `${sprite}#i-${name}` }, children: [] }],
    })),
  };
}

export default function rehypeMethodIcons({ base = '/', limit = 3 }: Options = {}) {
  const sprite = `${base.endsWith('/') ? base : `${base}/`}icons.svg`;

  function decorate(node: Node) {
    const icons = matchIcons(text(node), limit);
    if (!icons.length) return;
    const props = (node.properties ??= {});
    const style = typeof props.style === 'string' && props.style ? `${props.style};` : '';
    props.style = `${style}--icons:${icons.length}`;
    props.className = [...((props.className as string[] | undefined) ?? []), 'with-icons'];
    (node.children ??= []).push(iconsSpan(icons, sprite));
  }

  function walk(node: Node, inListItem: boolean) {
    if (node.type === 'element') {
      if (node.tagName === 'li') {
        decorate(node);
        inListItem = true;
      } else if (node.tagName === 'p' && !inListItem) {
        decorate(node);
        return;
      }
    }
    for (const child of node.children ?? []) walk(child, inListItem);
  }

  return (tree: Node) => walk(tree, false);
}
