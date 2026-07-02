import assert from 'node:assert/strict';
import { collectSearchMatches } from '../src/editor-search.mjs';

assert.deepEqual(collectSearchMatches('Alpha beta alpha', 'alpha'), [
  { start: 0, end: 5 },
  { start: 11, end: 16 },
]);
assert.deepEqual(collectSearchMatches('Alpha beta', ''), []);
assert.deepEqual(collectSearchMatches('Alpha beta', 'missing'), []);
assert.deepEqual(collectSearchMatches('Alpha alpha', 'alpha', { caseSensitive: true }), [
  { start: 6, end: 11 },
]);
assert.deepEqual(collectSearchMatches('alpha alphabet alpha', 'alpha', { wholeWord: true }), [
  { start: 0, end: 5 },
  { start: 15, end: 20 },
]);
assert.deepEqual(collectSearchMatches('A12 B34 C', '[A-Z]\\d+', { useRegex: true }), [
  { start: 0, end: 3 },
  { start: 4, end: 7 },
]);
assert.deepEqual(collectSearchMatches('alpha beta alpha', 'alpha', { range: { start: 6, end: 16 } }), [
  { start: 11, end: 16 },
]);
assert.deepEqual(collectSearchMatches('alpha', '[', { useRegex: true }), []);

console.log('editor search tests passed');
