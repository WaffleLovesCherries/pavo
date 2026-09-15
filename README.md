# Chocolates para Andrea

A static recipe book built with [Astro](https://astro.build) and deployed to GitHub Pages.
No backend, no APIs: every recipe is a Markdown file in this repo.

## Run it

```sh
npm install
npm run dev      # http://localhost:4321/
npm run build    # static output in dist/
npm test         # checks the Markdown the recipe form writes
```

Pushing to `main` builds and deploys via `.github/workflows/deploy.yml`.
In the repo settings, set **Pages > Source** to **GitHub Actions** once.

## Add a recipe

The quick way: click the wooden box in the site header, then the sheet that pops out of it.
A form slides in; **Save recipe** downloads a ready-made `<slug>.md`. Drop it in `src/content/recipes/` and push.

By hand: copy `src/content/recipes/_template.md` to `src/content/recipes/<slug>.md`. The file name becomes the URL.
Files starting with `_` are ignored, so the template never shows up on the site.

```md
---
name: Hazelnut praline ganache
category: ganache          # a key from src/config/categories.ts
icon: hazelnut             # optional; a file name from src/icons (no .svg)
kind: filling              # optional; shown after the category on the recipe page
prep: 25 min + 12 h rest
effort: 3                  # 1-5
sweetness: 3               # 1-5
bitterness: 3              # 1-5
intensity: 4               # optional, 1-5
profile: Nutty
pairs: 22                  # 0 = dark, 50 = milk, 100 = white
tags: [hazelnut, praline, bonbon]
lastMade: 2026-09-01       # optional; the index sorts by this, newest first
ingredients:
  - [Dark couverture 64%, 180 g]
  - [Heavy cream, 120 g]
---

1. Heat cream with invert sugar to 80°C.
2. Pour over the couverture in thirds, emulsifying between each addition.
```

Clicking a recipe opens it in a drawer over the index; its URL still works as a standalone page.
Every recipe is drawn on one of four sheets of paper (clean, ring notebook, torn off, taped),
picked by a tiny hash of the title in `src/lib/paper.ts`, so nothing has to be chosen by hand.

Everything after the frontmatter is the method, rendered as Markdown.
A bad field (unknown category, effort of 7, missing name) fails the build with a message pointing at the file.

## Add a category

Add a line to `src/config/categories.ts` with a key, label, colour and default icon.
The header filter buttons and card colours update automatically.

## Add an icon

Drop an SVG with a `viewBox` and no hardcoded fills into `src/icons/`.
It is inlined at build time and takes the category colour.

## Site text

Title, tagline, search placeholder and the number of tag chips in the header live in `src/config/site.ts`.

## Background

The page background is a checkerboard with assorted icons embossed into it, drifting slowly toward the mouse.
Tuning lives in the `BACKGROUND` block of `src/config/site.ts`:

- `maxSpeed` (px/s at the viewport edge) and `deadZone` (still radius around the centre) control the drift.
- Each dark checkerboard square holds one randomly chosen icon, centred; light squares stay empty. `tile.seed` reshuffles the picks; `iconSize` and `fill` control size and density.
- `lightOpacity`, `darkOpacity`, `depth` control how strong the ridge effect is.

The tile is generated at build time by `src/lib/backgroundTile.ts` and served as `/bg-tile.svg`.
Motion is disabled for touch-only devices and for users who prefer reduced motion.
