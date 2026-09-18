import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { PATTERNS, formatNoteDate, normaliseKey, parseSecrets, patternFor, sha256 } from './secret.ts';

test('there are five patterns', () => {
  assert.deepEqual([...PATTERNS], ['hearts', 'flowers', 'dots', 'stripes', 'stars']);
});

test('a note without a pattern always gets the same one, from the list', () => {
  for (const t of ['Te quiero', 'Para un día gris', '', 'ñ']) {
    assert.equal(patternFor(t), patternFor(t));
    assert.ok(PATTERNS.includes(patternFor(t)));
  }
});

test('different notes spread across the patterns', () => {
  const texts = ['Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete', 'Ocho', 'Nueve', 'Diez', 'Once', 'Doce'];
  assert.equal(new Set(texts.map(patternFor)).size, PATTERNS.length);
});

test('the key is compared ignoring case, surrounding space and composition', () => {
  assert.equal(normaliseKey('  Mamorcito '), 'mamorcito');
  assert.equal(normaliseKey('MAMORCITO'), 'mamorcito');
  assert.equal(normaliseKey('café'), 'café');
});

test('sha256 matches the known vectors', () => {
  assert.equal(sha256(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  assert.equal(sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(
    sha256('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'),
    '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
  );
  assert.notEqual(sha256('mamorcito'), sha256('mamorcita'));
});

test('sha256 agrees with node on longer and non-ASCII input', () => {
  for (const s of ['a'.repeat(55), 'a'.repeat(56), 'a'.repeat(64), 'a'.repeat(1000), 'mamorcito ñ 💛', 'café']) {
    assert.equal(sha256(s), createHash('sha256').update(s, 'utf8').digest('hex'), JSON.stringify(s));
  }
});

test('parseSecrets fills in defaults and keeps what is given', () => {
  const s = parseSecrets({ password: 'Clave', notes: [{ text: 'Hola' }, { text: 'Adiós', pattern: 'stars' }] });
  assert.equal(s.lock, sha256('clave'));
  assert.equal(s.title, 'Para ti');
  assert.equal(s.notes[0]!.pattern, patternFor('Hola'));
  assert.equal(s.notes[1]!.pattern, 'stars');
  assert.equal(parseSecrets({ password: 'x', title: 'Mía', notes: [{ text: 'a' }] }).title, 'Mía');
});

test('a note may carry the day it was written, kept as YYYY-MM-DD', () => {
  const s = parseSecrets({ password: 'x', notes: [{ text: 'a', date: '2026-09-18' }, { text: 'b' }] });
  assert.equal(s.notes[0]!.date, '2026-09-18');
  assert.equal(s.notes[1]!.date, undefined);
});

test('a date that is not a real day fails the build, naming the note', () => {
  assert.throws(() => parseSecrets({ password: 'x', notes: [{ text: 'a', date: '18/09/2026' }] }), /note 1.*date/);
  assert.throws(() => parseSecrets({ password: 'x', notes: [{ text: 'a' }, { text: 'b', date: '2026-02-30' }] }), /note 2.*date/);
  assert.throws(() => parseSecrets({ password: 'x', notes: [{ text: 'a', date: 20260918 }] }), /note 1.*date/);
});

test('the date is written out in Spanish', () => {
  assert.equal(formatNoteDate('2026-09-18'), '18 de septiembre de 2026');
  assert.equal(formatNoteDate('2025-01-01'), '1 de enero de 2025');
});

test('parseSecrets refuses what it cannot use, naming the note', () => {
  assert.throws(() => parseSecrets({ notes: [] }), /password/);
  assert.throws(() => parseSecrets({ password: ' ', notes: [] }), /password/);
  assert.throws(() => parseSecrets({ password: 'x', notes: [{ text: '' }] }), /note 1/);
  assert.throws(() => parseSecrets({ password: 'x', notes: [{ text: 'ok' }, { text: 'Hola', pattern: 'plaid' }] }), /note 2.*plaid/);
  assert.throws(() => parseSecrets({ password: 'x' }), /notes/);
});
