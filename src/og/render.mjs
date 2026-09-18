// Renders src/og/og.svg to public/og.jpg with a headless Chrome, at the size link previews expect.
// Usage: npm run og   (set CHROME=<path to chrome.exe> if it is not in one of the usual places)
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildBackgroundTile } from '../lib/backgroundTile.ts';
import { BACKGROUND } from '../config/site.ts';

const WIDTH = 1200;
const HEIGHT = 630;
const SOURCE = new URL('./og.svg', import.meta.url);
// JPEG: the paper texture and gradients push a PNG past the ~300 KB WhatsApp will fetch.
const OUTPUT = new URL('../../public/og.jpg', import.meta.url);
const FONTS = ['italic 400 74px "Playfair Display"', '600 13px Karla', 'italic 400 15px Newsreader'];
const ICONS = new URL('../icons/', import.meta.url);

const chrome = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find((p) => p && existsSync(p));
if (!chrome) throw new Error('No Chrome found; set CHROME to the browser executable');

const profile = await mkdtemp(join(tmpdir(), 'og-'));

// The background is the site's own tile of embossed icons (src/pages/bg-tile.svg.ts), dropped into a copy
// of the SVG next to the checkerboard, so it never has to be pasted into og.svg by hand.
const icons = Object.fromEntries(await Promise.all(
  (await readdir(ICONS)).filter((f) => f.endsWith('.svg'))
    .map(async (f) => [f.slice(0, -4), await readFile(new URL(f, ICONS), 'utf8')]),
));
const tile = buildBackgroundTile(icons, BACKGROUND.tile).replace(/^<svg /, '<svg x="0" y="0" ');
const svg = await readFile(SOURCE, 'utf8');
if (!svg.includes('<!-- BG-TILE -->')) throw new Error('og.svg has no <!-- BG-TILE --> marker for the icon tile');
const PAGE = join(profile, 'og.svg');
await writeFile(PAGE, svg.replace('<!-- BG-TILE -->', tile));
const browser = spawn(chrome, [
  '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
  '--no-first-run', '--hide-scrollbars', `--window-size=${WIDTH},${HEIGHT}`,
]);

try {
  const port = await new Promise((resolve, reject) => {
    let log = '';
    browser.stderr.on('data', (chunk) => {
      log += chunk;
      const m = log.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)/);
      if (m) resolve(m[1]);
    });
    browser.on('exit', () => reject(new Error(`Chrome exited early:\n${log}`)));
  });

  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  const page = await connect(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);

  await page.send('Page.enable');
  await page.send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });
  const loaded = page.once('Page.loadEventFired');
  await page.send('Page.navigate', { url: `file:///${PAGE.replace(/\\/g, '/')}` });
  await loaded;

  // Wait for the Google Fonts @import so the label is not drawn in a fallback face.
  const fonts = await page.send('Runtime.evaluate', {
    expression: `document.fonts.ready.then(() => ${JSON.stringify(FONTS)}.filter((f) => !document.fonts.check(f)))`,
    awaitPromise: true, returnByValue: true,
  });
  if (fonts.result.value.length) throw new Error(`Fonts did not load: ${fonts.result.value.join(', ')}`);

  const shot = await page.send('Page.captureScreenshot', {
    format: 'jpeg', quality: 88, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT, scale: 1 },
  });
  await writeFile(OUTPUT, Buffer.from(shot.data, 'base64'));
  page.close();

  const { size } = await stat(OUTPUT);
  console.log(`public/og.jpg: ${WIDTH}x${HEIGHT}, ${Math.round(size / 1024)} KB`);
  if (size > 300 * 1024) console.warn('Warning: over 300 KB, WhatsApp may skip the image');
} finally {
  browser.kill();
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}

// A tiny DevTools Protocol client over Node's built-in WebSocket.
function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const pending = new Map();
    const waiting = new Map();
    let id = 0;
    ws.onerror = reject;
    ws.onmessage = ({ data }) => {
      const msg = JSON.parse(data);
      if (msg.id) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      } else if (waiting.has(msg.method)) {
        waiting.get(msg.method)(msg.params);
        waiting.delete(msg.method);
      }
    };
    ws.onopen = () => resolve({
      send(method, params = {}) {
        return new Promise((resolve, reject) => {
          pending.set(++id, { resolve, reject });
          ws.send(JSON.stringify({ id, method, params }));
        });
      },
      once(method) {
        return new Promise((resolve) => waiting.set(method, resolve));
      },
      close: () => ws.close(),
    });
  });
}
