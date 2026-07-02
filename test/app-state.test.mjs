import assert from 'node:assert/strict';
import { createInitialDocumentState } from '../src/app-state.mjs';

function createStorage(values = {}) {
  const removed = [];
  return {
    removed,
    getItem(key) {
      return values[key] ?? null;
    },
    removeItem(key) {
      removed.push(key);
    },
  };
}

const draftKey = 'draft';
const fileNameKey = 'file-name';
const sampleMarkdown = '# Sample';

assert.deepEqual(
  createInitialDocumentState(createStorage({
    [draftKey]: '# Existing',
    [fileNameKey]: 'notes.md',
  }), { draftKey, fileNameKey, sampleMarkdown }),
  { fileName: 'notes.md', markdown: '# Existing' },
);

const staleStorage = createStorage({
  [draftKey]: '%PDF huge content',
  [fileNameKey]: '1.v.pdf',
});

assert.deepEqual(
  createInitialDocumentState(staleStorage, { draftKey, fileNameKey, sampleMarkdown }),
  { fileName: '未命名文档', markdown: sampleMarkdown },
);
assert.deepEqual(staleStorage.removed, [draftKey, fileNameKey]);

console.log('app state tests passed');
