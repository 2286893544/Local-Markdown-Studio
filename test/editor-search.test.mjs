import assert from 'node:assert/strict';
import { collectSearchMatches } from '../src/editor-search.mjs';

assert.deepEqual(collectSearchMatches('Alpha beta alpha', 'alpha'), [
  { start: 0, end: 5 },
  { start: 11, end: 16 },
]);
assert.deepEqual(collectSearchMatches('Alpha beta', ''), []);
assert.deepEqual(collectSearchMatches('Alpha beta', 'missing'), []);

console.log('editor search tests passed');
