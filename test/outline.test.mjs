import assert from 'node:assert/strict';
import { buildOutlineEntries } from '../src/outline.mjs';

const entries = buildOutlineEntries([
  { id: 'intro', text: 'Intro', level: 1, lineIndex: 0 },
  { id: 'scope', text: 'Scope', level: 2, lineIndex: 3 },
  { id: 'detail', text: 'Detail', level: 3, lineIndex: 6 },
  { id: 'next', text: 'Next', level: 2, lineIndex: 9 },
]);

assert.deepEqual(entries, [
  { id: 'intro', text: 'Intro', level: 1, lineIndex: 0, outlineId: 'intro-0', hasChildren: true, collapsed: false, hidden: false },
  { id: 'scope', text: 'Scope', level: 2, lineIndex: 3, outlineId: 'scope-1', hasChildren: true, collapsed: true, hidden: false },
  { id: 'detail', text: 'Detail', level: 3, lineIndex: 6, outlineId: 'detail-2', hasChildren: false, collapsed: false, hidden: true },
  { id: 'next', text: 'Next', level: 2, lineIndex: 9, outlineId: 'next-3', hasChildren: false, collapsed: false, hidden: false },
]);

assert.equal(buildOutlineEntries([
  { id: 'intro', text: 'Intro', level: 1, lineIndex: 0 },
  { id: 'scope', text: 'Scope', level: 2, lineIndex: 3 },
], { collapsedOutlineIds: new Set(['intro-0']) })[1].hidden, true);
assert.deepEqual(buildOutlineEntries([]), []);

console.log('outline tests passed');
