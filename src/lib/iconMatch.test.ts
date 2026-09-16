import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { ICON_KEYWORDS } from '../config/iconKeywords.ts';
import { guessIcon, matchIcons } from './iconMatch.ts';

test('every icon in the keyword map exists in src/icons', () => {
  const icons = new Set(readdirSync(new URL('../icons/', import.meta.url)).map((f) => f.replace(/\.svg$/, '')));
  for (const icon of Object.keys(ICON_KEYWORDS)) assert.ok(icons.has(icon), `no src/icons/${icon}.svg`);
});

test('guessIcon picks the icon for an ingredient name', () => {
  assert.equal(guessIcon('Dark couverture 64%'), 'chocolate');
  assert.equal(guessIcon('Heavy cream'), 'cream');
  assert.equal(guessIcon('Eggs'), 'egg');
  assert.equal(guessIcon('Fleur de sel'), 'salt');
  assert.equal(guessIcon('Water'), undefined);
});

test('matching is whole-word, case- and accent-insensitive', () => {
  assert.equal(guessIcon('CREAM'), 'cream');
  assert.equal(guessIcon('Café molido'), 'cofee');
  assert.equal(guessIcon('cafe'), 'cofee');
  assert.equal(guessIcon('Creamy spread'), undefined);
  assert.equal(guessIcon('Limón'), 'citrus');
});

test('the longest phrase wins over a shorter word inside it', () => {
  assert.equal(guessIcon('Cream cheese'), 'cheese');
  assert.equal(guessIcon('Piping bag'), 'pastry-bag');
  assert.deepEqual(matchIcons('Fill a piping bag and pipe into the moulds'), ['pastry-bag', 'pipe']);
});

test('matchIcons lists icons in reading order without repeats and honours the limit', () => {
  const step = 'Heat the cream with the sugar, pour over the chocolate and stir the chocolate until smooth.';
  assert.deepEqual(matchIcons(step), ['heat', 'cream', 'sugar', 'chocolate', 'stir']);
  assert.deepEqual(matchIcons(step, 3), ['heat', 'cream', 'sugar']);
  assert.deepEqual(matchIcons('Nothing to see here.'), []);
});
