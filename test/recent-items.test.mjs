import assert from 'node:assert/strict';
import {
  forgetRecentItem,
  rememberRecentItem,
  renderRecentItems,
} from '../src/recent-items.mjs';

const stored = [];
const storage = {
  setItem(key, value) {
    stored.push([key, value]);
  },
};

assert.equal(
  renderRecentItems([{ path: '/tmp/a.md', name: 'A <Doc>' }], 'data-recent-file', '空'),
  '<button class="recent-item" type="button" data-recent-file="/tmp/a.md">\n    <span>A &lt;Doc&gt;</span>\n    <small>/tmp/a.md</small>\n  </button>',
);
assert.equal(renderRecentItems([], 'data-recent-file', '空'), '<p class="empty-outline">空</p>');

const remembered = rememberRecentItem('recent', [{ path: '/tmp/old.md', name: 'Old' }], { path: '/tmp/a.md' }, storage);
assert.deepEqual(remembered, [
  { path: '/tmp/a.md', name: 'a.md' },
  { path: '/tmp/old.md', name: 'Old' },
]);
assert.deepEqual(forgetRecentItem('recent', remembered, '/tmp/old.md', storage), [
  { path: '/tmp/a.md', name: 'a.md' },
]);
assert.equal(stored.length, 2);

console.log('recent item tests passed');
