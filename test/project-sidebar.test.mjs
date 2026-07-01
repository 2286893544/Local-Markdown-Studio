import assert from 'node:assert/strict';
import {
  buildDocumentRelationsHtml,
  buildProjectHealthHtml,
  buildProjectSearchResults,
  renderProjectFiles,
  renderProjectSearchResults,
  renderQuickOpenResults,
  getQuickOpenResults,
} from '../src/project-sidebar.mjs';

const entries = [
  { id: 'readme', name: 'README.md', path: 'README.md', content: 'Product overview' },
  { id: 'guide', name: 'Guide.md', path: 'docs/guide.md', content: 'Install guide content' },
];

assert.deepEqual(getQuickOpenResults(entries, 'guide').map((entry) => entry.id), ['guide']);
assert.deepEqual(buildProjectSearchResults(entries, 'product').map((result) => result.entry.id), ['readme']);
assert.match(renderQuickOpenResults(entries, 'guide'), /data-quick-open-id="guide"/);
assert.match(renderProjectSearchResults(entries, 'install'), /data-project-search-id="guide"/);
assert.match(renderProjectFiles(entries, 'readme'), /project-file is-active/);
assert.match(
  buildDocumentRelationsHtml({
    backlinks: [{ id: 'readme', name: 'README.md', label: 'Back' }],
    unresolvedLinks: [{ label: 'Missing', resolvedPath: 'docs/missing.md' }],
  }),
  /data-relation-file-id="readme"/,
);
assert.match(
  buildProjectHealthHtml({
    missingImageAssets: [{ filePath: 'docs/a.md', resolvedPath: 'assets/missing.png' }],
    unusedImageAssets: [],
    absoluteImagePaths: [],
    duplicateHeadingSlugs: [],
    unresolvedMarkdownLinks: [],
  }),
  /1 个问题/,
);

console.log('project sidebar tests passed');
