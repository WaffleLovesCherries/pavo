# Chocolates para Andrea

A static recipe book built with [Astro](https://astro.build) and deployed to GitHub Pages.
No backend, no APIs: every recipe is a Markdown file in this repo.

## Run it

```sh
npm install
npm run dev      # http://localhost:4321/
npm run build    # static output in dist/
npm test         # checks the Markdown the recipe form writes, the icon matching and the tempering curves
```

Pushing to `main` builds and deploys via `.github/workflows/deploy.yml`.
In the repo settings, set **Pages > Source** to **GitHub Actions** once.

## Add a recipe

The quick way: click the wooden box in the site header, then the sheet that pops out of it.
A form slides in; **Save recipe** downloads a ready-made `<slug>.md`. Drop it in `src/content/recipes/` and push.

By hand: copy `src/content/recipe-template.md` to `src/content/recipes/<slug>.md`. The file name becomes the URL.
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
ingredients:               # [name, amount] or [name, amount, icon]
  - [Dark couverture 64%, 180 g]
  - [Heavy cream, 120 g]
  - [Fleur de sel, a pinch, spices]
---

1. Heat cream with invert sugar to 80°C.
2. Pour over the couverture in thirds, emulsifying between each addition.
```

Clicking a recipe opens it in a drawer over the index; its URL still works as a standalone page.
Every recipe is drawn on one of eight sheets of paper (clean, ring notebook, torn off, taped, squared, pinned, cup-stained, kraft),
picked by a tiny hash of the title in `src/lib/paper.ts`, so nothing has to be chosen by hand.

Ingredients get an icon from the words in their name (`couverture` is chocolate, `cream` is cream)
using the map in `src/config/iconKeywords.ts`. A third item overrides the guess with a file name from `src/icons`,
the same as the recipe icon. Rows without any icon keep their place in the column.

Method steps are scanned the same way: the icons for the words in a step are drawn at its right edge,
at most three per step, and the step reserves that width so the text never runs under them.
Add a word to the map to make it show up; the words are matched whole, ignoring case and accents.

Everything after the frontmatter is the method, rendered as Markdown.
A bad field (unknown category, effort of 7, missing name) fails the build with a message pointing at the file.

## The tempering guide

One page is not a recipe: the guide at `/templado/` with the tempering curve of every chocolate
(dark, milk, white, ruby, caramelised and cocoa butter). The site header is the front of that cabinet, and on the index the guide hides behind it: an unlabelled brass handle
(`src/components/TemperingDrop.astro`), an easter egg, slides the drawer out with the curves in miniature, and clicking the open
drawer opens the guide in the same drawer as a recipe. The handle can be clicked or dragged straight down and up; let go, the drawer
locks open or shut, whichever is nearer or the way it was flicked (`src/lib/pull.ts`). It is not a recipe, so it takes no part in the count or the filters.
The wrappers and the title card lie strewn about the drawer somewhere different on every load, and can be pushed around with
the mouse: towed by a corner a note swings round, pressed against a wall it squares up, and let go at speed it slides on.
The geometry and physics live in `src/lib/drag.ts`, covered by `npm test`; the tuning constants sit at the top of each block there.

It has two looks, and `TEMPERING_STYLE` in `src/config/tempering.ts` picks one: `cabinet`, each chocolate's
wrapper lying in an oak drawer with its curve printed on it (`CabinetGuide`, `CabinetCard`, `Wrapper`, `Note`), or `board`,
the curves drawn in chalk on a chalkboard (`TemperingGuide`, `TemperingCard`). Each chocolate carries the
colours for both: `wrap` (paper, ink, optional foil) and `chalk`.

The temperatures live in `src/config/tempering.ts`: each chocolate has a `melt`, `cool` and `work` range in °C,
a chalk colour and an optional note. Change a number there and the charts, the labels and the table at the bottom follow.
A range that makes no sense (cooling above working, working above melting) fails the build with a message naming the chocolate.

The drawer and the chalkboard are the `paper--cabinet` and `paper--board` styles in `src/styles/paper.css`.
Neither is one of the eight sheets the hash picks from, so a recipe never lands on them. The curve geometry is in `src/lib/tempering.ts`, covered by `npm test`.

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
