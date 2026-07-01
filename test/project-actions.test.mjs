import assert from 'node:assert/strict';
import {
  ensureMarkdownFilePath,
  normalizeCreatePath,
} from '../src/project-actions.mjs';

assert.equal(normalizeCreatePath('docs/Product PRD'), 'docs/Product PRD');
assert.equal(normalizeCreatePath('docs\\Product PRD.md'), 'docs/Product PRD.md');
assert.equal(normalizeCreatePath('/Users/me/docs/prd.md'), '');
assert.equal(normalizeCreatePath('C:\\Users\\me\\docs\\prd.md'), '');
assert.equal(normalizeCreatePath('../prd.md'), '');
assert.equal(normalizeCreatePath('docs/../prd.md'), '');
assert.equal(ensureMarkdownFilePath('docs/prd'), 'docs/prd.md');
assert.equal(ensureMarkdownFilePath('docs/prd.markdown'), 'docs/prd.markdown');

console.log('project action tests passed');
