import assert from 'node:assert/strict';
import {
  canUseNativeFind,
  createDefaultSearchOptions,
  getSearchOptions,
  replaceMatches,
  toggleFindInSelectionState,
  toggleSearchOptionState,
} from '../src/find-options.mjs';

const state = {
  query: 'alpha',
  searchMatchIndex: -1,
  searchOptions: createDefaultSearchOptions(),
  searchSelectionRange: null,
};

toggleSearchOptionState(state, 'caseSensitive');
assert.equal(state.searchOptions.caseSensitive, true);
assert.equal(state.searchMatchIndex, 0);
assert.equal(canUseNativeFind(state), true);

toggleSearchOptionState(state, 'wholeWord');
assert.equal(state.searchOptions.wholeWord, true);
assert.equal(canUseNativeFind(state), false);

toggleFindInSelectionState(state, { selectionStart: 2, selectionEnd: 2 });
assert.equal(state.searchOptions.inSelection, false);
assert.equal(state.searchSelectionRange, null);

toggleFindInSelectionState(state, { selectionStart: 2, selectionEnd: 8 });
assert.equal(state.searchOptions.inSelection, true);
assert.deepEqual(getSearchOptions(state).range, { start: 2, end: 8 });

assert.equal(
  replaceMatches('alpha beta alpha', [{ start: 0, end: 5 }, { start: 11, end: 16 }], 'x'),
  'x beta x',
);

console.log('find option tests passed');
