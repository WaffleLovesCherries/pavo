import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lockWay } from './pull.ts';

test('let go, the drawer locks at the nearer end', () => {
  assert.equal(lockWay(30, 200, 0, false), false);
  assert.equal(lockWay(150, 200, 0, false), true);
  assert.equal(lockWay(100, 200, 0, false), false, 'exactly halfway falls shut');
});

test('a flick decides the way whichever end is nearer', () => {
  assert.equal(lockWay(30, 200, 900, false), true, 'flicked down from nearly shut: opens');
  assert.equal(lockWay(170, 200, -900, false), false, 'flicked up from nearly open: shuts');
  assert.equal(lockWay(30, 200, 50, false), false, 'a slow move is no flick');
});

test('a hand that stopped before letting go is no flick', () => {
  assert.equal(lockWay(30, 200, 900, true), false);
});
