import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PAPER_STYLES, paperFor, titleHash } from './paper.ts';

test('the hash is deterministic and lands in 0-3', () => {
  for (const t of ['Hazelnut praline ganache', 'Cocoa brioche', '', 'ñ']) {
    const a = paperFor(t);
    assert.equal(a.style, paperFor(t).style);
    assert.ok(PAPER_STYLES.includes(a.style));
    assert.ok(titleHash(t) >= 0 && titleHash(t) < 4);
  }
});

test('different titles spread across the four styles', () => {
  const titles = ['70% dark shell ganache', 'Cacao nib tuile', 'Cocoa brioche', 'Hazelnut praline ganache',
    'Passion fruit jelly', 'Pistachio marzipan centre', 'Raspberry pâte de fruit', 'Salted caramel filling',
    'Lemon curd', 'Coffee ganache', 'Orange jelly', 'Brown butter shortbread'];
  const seen = new Set(titles.map((t) => paperFor(t).style));
  assert.equal(seen.size, 4);
});

test('the tilt is a small angle in degrees', () => {
  for (const t of ['a', 'bb', 'ccc', 'dddd', 'eeeee']) {
    const { tilt } = paperFor(t);
    assert.ok(Math.abs(tilt) <= 1.5, `${t}: ${tilt}`);
  }
});
