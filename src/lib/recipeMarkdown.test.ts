import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRecipeMarkdown, slugify, type RecipeDraft } from './recipeMarkdown.ts';

const full: RecipeDraft = {
  name: 'Hazelnut praline ganache',
  category: 'ganache',
  icon: 'hazelnut',
  kind: 'filling',
  prep: '25 min + 12 h rest',
  effort: 3,
  sweetness: 3,
  bitterness: 3,
  intensity: 4,
  profile: 'Nutty',
  pairs: 22,
  tags: ['hazelnut', 'praline', 'bonbon'],
  lastMade: '2026-09-01',
  ingredients: [
    ['Dark couverture 64%', '180 g'],
    ['Heavy cream', '120 g'],
    ['Eggs', '2'],
  ],
  method: '1. Heat cream with invert sugar to 80°C.\n2. Pour over the couverture in thirds.',
};

test('slugify makes a file name the way the existing recipes are named', () => {
  assert.equal(slugify('70% Dark Shell Ganache'), '70-dark-shell-ganache');
  assert.equal(slugify('  Raspberry pâte de fruit! '), 'raspberry-pate-de-fruit');
  assert.equal(slugify('###'), 'recipe');
});

test('a full draft renders exactly like the README example', () => {
  assert.equal(
    buildRecipeMarkdown(full),
    `---
name: Hazelnut praline ganache
category: ganache
icon: hazelnut
kind: filling
prep: 25 min + 12 h rest
effort: 3
sweetness: 3
bitterness: 3
intensity: 4
profile: Nutty
pairs: 22
tags: [hazelnut, praline, bonbon]
lastMade: 2026-09-01
ingredients:
  - [Dark couverture 64%, 180 g]
  - [Heavy cream, 120 g]
  - [Eggs, 2]
---

1. Heat cream with invert sugar to 80°C.
2. Pour over the couverture in thirds.
`,
  );
});

test('optional fields are left out when empty', () => {
  const md = buildRecipeMarkdown({
    name: 'Plain',
    category: 'other',
    prep: '10 min',
    effort: 1,
    sweetness: 2,
    bitterness: 3,
    profile: 'Simple',
    pairs: 50,
    tags: [],
    ingredients: [],
    method: '',
  });
  assert.equal(
    md,
    `---
name: Plain
category: other
prep: 10 min
effort: 1
sweetness: 2
bitterness: 3
profile: Simple
pairs: 50
---
`,
  );
});

test('values that YAML would misread are quoted', () => {
  const md = buildRecipeMarkdown({
    ...full,
    name: '70: the dark one',
    kind: '#special',
    profile: 'true',
    tags: ['salt, flaky', 'ok'],
    ingredients: [['Sugar, caster', '50']],
    intensity: undefined,
    lastMade: undefined,
    method: '',
  });
  assert.match(md, /^name: "70: the dark one"$/m);
  assert.match(md, /^kind: "#special"$/m);
  assert.match(md, /^profile: "true"$/m);
  assert.match(md, /^tags: \["salt, flaky", ok\]$/m);
  assert.match(md, /^  - \["Sugar, caster", 50\]$/m);
  assert.doesNotMatch(md, /^intensity:/m);
  assert.doesNotMatch(md, /^lastMade:/m);
});

test('blank ingredient rows are skipped and whitespace is trimmed', () => {
  const md = buildRecipeMarkdown({
    ...full,
    ingredients: [['  Cream ', ' 100 g '], ['', ''], ['   ', '5']],
  });
  assert.match(md, /^ingredients:\n  - \[Cream, 100 g\]\n---$/m);
});

test('an ingredient icon is written as a third item, only when set', () => {
  const md = buildRecipeMarkdown({
    ...full,
    ingredients: [
      ['Dark couverture 64%', '180 g', 'chocolate'],
      ['Heavy cream', '120 g'],
      ['Eggs', '2', ''],
    ],
  });
  assert.match(
    md,
    /^ingredients:\n  - \[Dark couverture 64%, 180 g, chocolate\]\n  - \[Heavy cream, 120 g\]\n  - \[Eggs, 2\]\n---$/m,
  );
});
