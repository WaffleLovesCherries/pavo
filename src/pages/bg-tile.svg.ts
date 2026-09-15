import type { APIRoute } from 'astro';
import { buildBackgroundTile } from '../lib/backgroundTile';
import { BACKGROUND } from '../config/site';

const icons = import.meta.glob<string>('../icons/*.svg', { query: '?raw', import: 'default', eager: true });
const byName = Object.fromEntries(
  Object.entries(icons).map(([path, svg]) => [path.replace(/^.*\/(.+)\.svg$/, '$1'), svg]),
);

export const GET: APIRoute = () =>
  new Response(buildBackgroundTile(byName, BACKGROUND.tile), {
    headers: { 'Content-Type': 'image/svg+xml' },
  });
