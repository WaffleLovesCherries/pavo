/**
 * Every icon in src/icons as one cacheable SVG sprite, so the recipe composer
 * can show the whole set without inlining 200 KB into the page.
 * Reference a symbol with `<use href="…/icons.svg#i-<name>">`.
 */
import type { APIRoute } from 'astro';
import { parseSvg } from '../lib/backgroundTile';

const icons = import.meta.glob<string>('../icons/*.svg', { query: '?raw', import: 'default', eager: true });

const symbols = Object.entries(icons)
  .map(([path, svg]) => {
    const name = path.replace(/^.*\/(.+)\.svg$/, '$1');
    const { viewBox, inner } = parseSvg(svg);
    return `<symbol id="i-${name}" viewBox="${viewBox}">${inner}</symbol>`;
  })
  .join('');

export const GET: APIRoute = () =>
  new Response(`<svg xmlns="http://www.w3.org/2000/svg">${symbols}</svg>`, {
    headers: { 'Content-Type': 'image/svg+xml' },
  });
