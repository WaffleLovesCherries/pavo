import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bounds, findSpot, keepInside, overlap, rotate, settle, slow, slowTurn, swing, throwSpeed, toLocal, type Box } from './drag.ts';

const floor: Box = { left: 100, top: 100, right: 500, bottom: 400 };
const note: Box = { left: 200, top: 150, right: 300, bottom: 250 };
const close = (a: number, b: number, msg?: string) => assert.ok(Math.abs(a - b) < 1e-9, msg ?? `${a} ≈ ${b}`);

test('an offset that keeps the note on the floor is left alone', () => {
  assert.deepEqual(keepInside(50, -20, note, floor), [50, -20]);
  assert.deepEqual(keepInside(0, 0, note, floor), [0, 0]);
});

test('a note pushed past a wall stops at it', () => {
  assert.deepEqual(keepInside(999, 0, note, floor), [200, 0]);
  assert.deepEqual(keepInside(-999, 0, note, floor), [-100, 0]);
  assert.deepEqual(keepInside(0, 999, note, floor), [0, 150]);
  assert.deepEqual(keepInside(0, -999, note, floor), [0, -50]);
});

test('a note wider than the floor keeps its left and top edges on it', () => {
  const big: Box = { left: 50, top: 50, right: 700, bottom: 600 };
  assert.deepEqual(keepInside(300, 300, big, floor), [50, 50]);
  assert.deepEqual(keepInside(-300, -300, big, floor), [50, 50]);
});

test('rotate turns clockwise on screen, y down', () => {
  const r = rotate({ x: 1, y: 0 }, Math.PI / 2);
  close(r.x, 0); close(r.y, 1);
});

test('bounds of an unturned note is the note itself', () => {
  assert.deepEqual(bounds(100, 50, { x: 50, y: 25 }, 0, { x: 250, y: 175 }), { left: 200, top: 150, right: 300, bottom: 200 });
});

test('bounds of a note turned a quarter about its centre swaps its sides', () => {
  const b = bounds(100, 50, { x: 50, y: 25 }, Math.PI / 2, { x: 250, y: 175 });
  close(b.left, 225); close(b.right, 275); close(b.top, 125); close(b.bottom, 225);
});

test('bounds keeps the pivot in place when turned about a corner', () => {
  const b = bounds(100, 50, { x: 0, y: 0 }, Math.PI / 2, { x: 250, y: 175 });
  close(b.left, 200); close(b.right, 250); close(b.top, 175); close(b.bottom, 275);
});

test('toLocal is the inverse of the placement', () => {
  const pivot = { x: 20, y: 10 };
  const at = { x: 300, y: 200 };
  const q = { x: 80, y: 40 };
  const on = rotate({ x: q.x - pivot.x, y: q.y - pivot.y }, 0.4);
  const back = toLocal({ x: at.x + on.x, y: at.y + on.y }, at, pivot, 0.4);
  close(back.x, q.x); close(back.y, q.y);
});

test('a note towed by a point turns so its centre trails behind', () => {
  // Centre above the grab point, pulled to the right: the centre swings to the left, counter-clockwise.
  assert.ok(swing({ x: 0, y: -40 }, { x: 10, y: 0 }, 30) < 0);
  // Centre below, pulled right: clockwise.
  assert.ok(swing({ x: 0, y: 40 }, { x: 10, y: 0 }, 30) > 0);
  // Centre already trailing straight behind: no turn.
  close(swing({ x: -40, y: 0 }, { x: 10, y: 0 }, 30), 0);
});

test('grabbing near the centre barely turns; a corner grab turns more; standing still turns nothing', () => {
  const near = Math.abs(swing({ x: 0, y: -2 }, { x: 10, y: 0 }, 30));
  const far = Math.abs(swing({ x: 0, y: -40 }, { x: 10, y: 0 }, 30));
  assert.ok(near < far / 10, `${near} vs ${far}`);
  assert.equal(swing({ x: 0, y: -40 }, { x: 0, y: 0 }, 30), 0);
});

test('pressed against a wall, a note turns toward lying square with it and never past', () => {
  const a = settle(0.3, 5);
  assert.ok(a > 0 && a < 0.3, `${a}`);
  assert.equal(settle(0.3, 1000), 0);
  assert.equal(settle(-0.3, 1000), 0);
  close(settle(1.4, 1000), Math.PI / 2, 'nearest square lie may be a quarter turn');
  assert.equal(settle(0.3, 0), 0.3);
});

test('a throw is read off the last stretch of movement', () => {
  // 8px every 16ms to the right, turning 0.01 rad each step.
  const samples = Array.from({ length: 10 }, (_, i) => ({ t: 1000 + i * 16, x: i * 8, y: 0, a: i * 0.01 }));
  const { v, w } = throwSpeed(samples, 1000 + 9 * 16 + 5);
  close(v.x, 500); close(v.y, 0); close(w, 0.625);
});

test('a note held still before letting go is not thrown', () => {
  const samples = Array.from({ length: 10 }, (_, i) => ({ t: 1000 + i * 16, x: i * 8, y: 0, a: 0 }));
  assert.deepEqual(throwSpeed(samples, 1000 + 9 * 16 + 300), { v: { x: 0, y: 0 }, w: 0 });
  assert.deepEqual(throwSpeed([], 5000), { v: { x: 0, y: 0 }, w: 0 });
  assert.deepEqual(throwSpeed([{ t: 4990, x: 3, y: 3, a: 0 }], 5000), { v: { x: 0, y: 0 }, w: 0 });
});

test('a quick flick with only two samples still counts, and speed is capped', () => {
  const { v } = throwSpeed([{ t: 1000, x: 0, y: 0, a: 0 }, { t: 1150, x: 0, y: 30, a: 0 }], 1160);
  close(v.x, 0); close(v.y, 200);
  const fast = throwSpeed([{ t: 1000, x: 0, y: 0, a: 0 }, { t: 1010, x: 500, y: 0, a: 0 }], 1012);
  assert.ok(Math.hypot(fast.v.x, fast.v.y) <= 3000);
  const twirl = throwSpeed([{ t: 1000, x: 0, y: 0, a: 0 }, { t: 1050, x: 0, y: 0, a: 3 }], 1052);
  assert.ok(twirl.w > 0 && twirl.w <= 8, 'spin is capped too');
});

test('friction slows a slide along its own line and stops it dead', () => {
  const s = slow({ x: 300, y: 400 }, 0.1);
  close(s.x / s.y, 0.75);
  assert.ok(Math.hypot(s.x, s.y) < 500);
  assert.deepEqual(slow({ x: 3, y: 4 }, 1), { x: 0, y: 0 });
  assert.deepEqual(slow({ x: 0, y: 0 }, 0.1), { x: 0, y: 0 });
});

test('friction slows a spin and stops it dead', () => {
  const w = slowTurn(5, 0.1);
  assert.ok(w > 0 && w < 5);
  assert.ok(slowTurn(-5, 0.1) < 0);
  assert.equal(slowTurn(0.1, 1), 0);
});

test('overlap is the shared area, zero when apart', () => {
  assert.equal(overlap({ left: 0, top: 0, right: 10, bottom: 10 }, { left: 5, top: 5, right: 20, bottom: 20 }), 25);
  assert.equal(overlap({ left: 0, top: 0, right: 10, bottom: 10 }, { left: 10, top: 0, right: 20, bottom: 10 }), 0);
  assert.equal(overlap({ left: 0, top: 0, right: 10, bottom: 10 }, { left: 30, top: 30, right: 40, bottom: 40 }), 0);
});

/** A small deterministic random source for the tests. */
function seeded(seed: number): () => number {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
}

test('a spot for a box lies inside the floor', () => {
  const rng = seeded(7);
  for (let i = 0; i < 50; i++) {
    const spot = findSpot(60, 40, floor, [], rng);
    assert.ok(spot.left >= floor.left && spot.right <= floor.right && spot.top >= floor.top && spot.bottom <= floor.bottom, JSON.stringify(spot));
    assert.equal(spot.right - spot.left, 60);
    assert.equal(spot.bottom - spot.top, 40);
  }
});

test('a spot keeps clear of what is already lying there when there is room', () => {
  const rng = seeded(3);
  const taken: Box[] = [];
  for (let i = 0; i < 6; i++) taken.push(findSpot(90, 70, floor, taken, rng));
  for (let i = 0; i < taken.length; i++) for (let j = i + 1; j < taken.length; j++) assert.equal(overlap(taken[i]!, taken[j]!), 0, `${i} and ${j}`);
});

test('a box too wide for the floor is held by the left wall', () => {
  const spot = findSpot(900, 40, floor, [], seeded(1));
  assert.equal(spot.left, 100);
  assert.equal(spot.right, 1000);
  assert.ok(spot.top >= 100 && spot.bottom <= 400, 'still fits the other way');
});
