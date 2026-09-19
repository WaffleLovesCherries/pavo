import { test } from 'node:test';
import assert from 'node:assert/strict';
import { grip } from './grip.ts';

test('the first pointer takes hold and a second is refused while it holds', () => {
  const hand = grip();
  assert.equal(hand.take(1), true);
  assert.equal(hand.take(2), false);
  assert.equal(hand.holds(1), true);
  assert.equal(hand.holds(2), false);
});

test('only the pointer that holds can let go, and then the next may take hold', () => {
  const hand = grip();
  hand.take(1);
  hand.free(2);
  assert.equal(hand.holds(1), true);
  assert.equal(hand.take(2), false);
  hand.free(1);
  assert.equal(hand.holds(1), false);
  assert.equal(hand.take(2), true);
  assert.equal(hand.holds(2), true);
});

test('nothing holds an untouched grip', () => {
  const hand = grip();
  assert.equal(hand.holds(0), false);
  hand.free(0);
  assert.equal(hand.take(0), true);
});
