/**
 * Builds one repeating SVG tile with a randomly chosen icon centred in every
 * dark checkerboard square, drawn as a low-contrast emboss so they read as ridges
 * pressed into the surface. Runs at build time only.
 */

export interface TileOptions {
  square?: number;
  squares?: number;
  iconSize?: number;
  fill?: number;
  seed?: number;
  light?: string;
  lightOpacity?: number;
  dark?: string;
  darkOpacity?: number;
  depth?: number;
}

const DEFAULTS: Required<TileOptions> = {
  square: 90,
  squares: 8,
  iconSize: 52,
  fill: 1,
  seed: 7,
  light: '#F2E3CE',
  lightOpacity: 0.11,
  dark: '#000000',
  darkOpacity: 0.38,
  depth: 2,
};

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function parseSvg(raw: string) {
  const viewBox = /viewBox="([^"]+)"/.exec(raw)?.[1] ?? '0 0 50 50';
  const inner = /<svg[^>]*>([\s\S]*?)<\/svg>/.exec(raw)?.[1] ?? '';
  return { viewBox, inner: inner.trim() };
}

export function tileSize(options: TileOptions = {}): number {
  const o = { ...DEFAULTS, ...options };
  return o.square * o.squares;
}

export function buildBackgroundTile(icons: Record<string, string>, options: TileOptions = {}): string {
  const o = { ...DEFAULTS, ...options };
  const random = rng(o.seed);
  const names = Object.keys(icons).sort();
  if (names.length === 0) throw new Error('buildBackgroundTile: no icons given');

  const size = o.square * o.squares;
  const pad = (o.square - o.iconSize) / 2;
  const used = new Set<string>();
  const uses: string[] = [];
  const grid: (string | null)[][] = [];

  for (let row = 0; row < o.squares; row++) {
    grid.push([]);
    for (let col = 0; col < o.squares; col++) {
      const dark = (row + col) % 2 === 0;
      if (!dark || random() > o.fill) { grid[row]!.push(null); continue; }
      const n = o.squares;
      const upRow = grid[(row + n - 1) % n];
      const taken = [
        upRow?.[(col + n - 1) % n],
        upRow?.[(col + 1) % n],
        grid[row]![(col + n - 2) % n],
      ];
      let name = names[Math.floor(random() * names.length)]!;
      for (let tries = 0; tries < 5 && taken.includes(name); tries++) {
        name = names[Math.floor(random() * names.length)]!;
      }
      grid[row]!.push(name);
      used.add(name);

      const x = col * o.square + pad;
      const y = row * o.square + pad;
      const common = `href="#i-${name}" width="${o.iconSize}" height="${o.iconSize}"`;
      const d = o.depth;
      uses.push(
        `<use ${common} x="${(x + d).toFixed(1)}" y="${(y + d).toFixed(1)}" fill="${o.dark}" color="${o.dark}" fill-opacity="${o.darkOpacity}" stroke-opacity="${o.darkOpacity}"/>` +
        `<use ${common} x="${(x - d).toFixed(1)}" y="${(y - d).toFixed(1)}" fill="${o.light}" color="${o.light}" fill-opacity="${o.lightOpacity}" stroke-opacity="${o.lightOpacity}"/>`,
      );
    }
  }

  const symbols = [...used]
    .map((name) => {
      const { viewBox, inner } = parseSvg(icons[name]!);
      return `<symbol id="i-${name}" viewBox="${viewBox}">${inner}</symbol>`;
    })
    .join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `<defs>${symbols}</defs>${uses.join('')}</svg>`
  );
}
