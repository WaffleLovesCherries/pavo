import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHOCOLATES, TEMP_AXIS, ROOM_TEMP } from '../config/tempering.ts';
import { checkChocolate, curvePath, keypoints, mid, plateaus, scaleX, scaleY, type Frame } from './tempering.ts';

const negro = CHOCOLATES[0]!;
const frame: Frame = { width: 200, height: 100, top: 10, right: 20, bottom: 30, left: 40 };

test('mid is the middle of a range', () => {
  assert.equal(mid([45, 50]), 47.5);
  assert.equal(mid([28.5, 29.5]), 29);
});

test('every configured chocolate is consistent and fits the axis', () => {
  for (const c of CHOCOLATES) {
    assert.deepEqual(checkChocolate(c), [], c.name);
    for (const [lo, hi] of [c.melt, c.cool, c.work]) {
      assert.ok(lo >= TEMP_AXIS[0] && hi <= TEMP_AXIS[1], `${c.name} range ${lo}-${hi} outside the axis`);
    }
  }
  assert.ok(ROOM_TEMP >= TEMP_AXIS[0]);
  assert.equal(new Set(CHOCOLATES.map((c) => c.key)).size, CHOCOLATES.length, 'keys are unique');
});

test('checkChocolate names each broken rule', () => {
  const bad = { ...negro, melt: [30, 28] as [number, number], cool: [33, 34] as [number, number], work: [30, 31] as [number, number] };
  const errors = checkChocolate(bad);
  assert.ok(errors.some((e) => /melt/.test(e)), 'reversed range');
  assert.ok(errors.some((e) => /cool.*work|work.*cool/.test(e)), 'cool must be below work');
  assert.ok(errors.some((e) => /work.*melt|melt.*work/.test(e)), 'work must be below melt');
});

test('keypoints trace room → melt → cool → work with increasing time', () => {
  const pts = keypoints(negro);
  assert.equal(pts[0]!.temp, ROOM_TEMP);
  assert.equal(pts[0]!.t, 0);
  assert.equal(pts.at(-1)!.t, 1);
  for (let i = 1; i < pts.length; i++) assert.ok(pts[i]!.t > pts[i - 1]!.t, `t increases at ${i}`);
  const temps = pts.map((p) => p.temp);
  assert.ok(temps.includes(mid(negro.melt)) && temps.includes(mid(negro.cool)) && temps.includes(mid(negro.work)));
  assert.equal(Math.max(...temps), mid(negro.melt));
  assert.equal(Math.min(...temps.slice(1)), mid(negro.cool));
});

test('plateaus give a labelled flat stretch per stage', () => {
  const p = plateaus(negro);
  assert.deepEqual(p.map((s) => s.stage), ['melt', 'cool', 'work']);
  for (const s of p) {
    assert.ok(s.from < s.to, 'plateau spans time');
    assert.equal(s.temp, mid(negro[s.stage]));
    assert.deepEqual(s.range, negro[s.stage]);
  }
});

test('scales map the axis onto the frame', () => {
  assert.equal(scaleY(TEMP_AXIS[0], frame), frame.height - frame.bottom);
  assert.equal(scaleY(TEMP_AXIS[1], frame), frame.top);
  const midY = scaleY((TEMP_AXIS[0] + TEMP_AXIS[1]) / 2, frame);
  assert.equal(midY, (frame.top + frame.height - frame.bottom) / 2);
  assert.equal(scaleX(0, frame), frame.left);
  assert.equal(scaleX(1, frame), frame.width - frame.right);
});

test('curvePath is a smooth path with one cubic per segment', () => {
  const path = curvePath(negro, frame);
  assert.match(path, /^M[\d.]+ [\d.]+/);
  assert.equal((path.match(/C/g) ?? []).length, keypoints(negro).length - 1);
  assert.doesNotMatch(path, /NaN|undefined/);
});
