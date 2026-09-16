import { test } from 'node:test';
import assert from 'node:assert/strict';
import rehypeMethodIcons from './rehypeMethodIcons.ts';

const el = (tagName: string, children: any[], properties: Record<string, unknown> = {}) => ({
  type: 'element',
  tagName,
  properties,
  children,
});
const txt = (value: string) => ({ type: 'text', value });

test('a step gets its icons appended and counted, in reading order', () => {
  const li = el('li', [txt('Heat the cream and pour over the '), el('strong', [txt('chocolate')]), txt('.')]);
  const tree = { type: 'root', children: [el('ol', [li])] };
  rehypeMethodIcons({ base: '/' })(tree);

  assert.equal(li.properties.style, '--icons:3');
  assert.deepEqual(li.properties.className, ['with-icons']);
  const span = li.children.at(-1) as any;
  assert.deepEqual(span.properties.className, ['step-icons']);
  assert.deepEqual(
    span.children.map((svg: any) => svg.children[0].properties.href),
    ['/icons.svg#i-heat', '/icons.svg#i-cream', '/icons.svg#i-chocolate'],
  );
});

test('steps without keywords are left alone', () => {
  const li = el('li', [txt('Serve.')]);
  rehypeMethodIcons()({ type: 'root', children: [el('ol', [li])] });
  assert.equal(li.children.length, 1);
  assert.equal(li.properties.style, undefined);
});

test('a paragraph inside a list item is not decorated twice, a top-level one is', () => {
  const inner = el('p', [txt('Whisk the eggs.')]);
  const li = el('li', [inner]);
  const top = el('p', [txt('Chill overnight.')]);
  rehypeMethodIcons()({ type: 'root', children: [el('ul', [li]), top] });

  assert.equal(li.properties.style, '--icons:2');
  assert.equal(inner.properties.style, undefined);
  assert.equal(top.properties.style, '--icons:2');
});

test('nested lists do not feed their words to the parent step', () => {
  const nested = el('li', [txt('Add the butter.')]);
  const li = el('li', [txt('Make the dough:'), el('ul', [nested])]);
  rehypeMethodIcons()({ type: 'root', children: [el('ol', [li])] });

  assert.equal(li.properties.style, '--icons:1');
  assert.equal(nested.properties.style, '--icons:1');
});

test('the limit and the base path are honoured', () => {
  const li = el('li', [txt('Heat, stir, whisk and chill the cream.')], { style: 'color:red' });
  rehypeMethodIcons({ base: '/book', limit: 2 })({ type: 'root', children: [el('ol', [li])] });

  assert.equal(li.properties.style, 'color:red;--icons:2');
  const span = li.children.at(-1) as any;
  assert.equal(span.children.length, 2);
  assert.equal(span.children[0].children[0].properties.href, '/book/icons.svg#i-heat');
});
