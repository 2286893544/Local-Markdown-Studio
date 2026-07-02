import assert from 'node:assert/strict';
import {
  buildDocumentRelationsHtml,
  buildProjectAssetsHtml,
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
assert.match(
  buildProjectHealthHtml({
    missingImageAssets: [{ fileId: 'docs/a.md', filePath: 'docs/a.md', resolvedPath: 'assets/missing.png' }],
    unusedImageAssets: [],
    absoluteImagePaths: [{ fileId: 'docs/a.md', filePath: 'docs/a.md', href: '/Users/me/a.png' }],
    duplicateHeadingSlugs: [],
    unresolvedMarkdownLinks: [],
  }),
  /data-health-file-id="docs\/a\.md"/,
);
assert.match(
  buildProjectHealthHtml({
    missingImageAssets: [],
    unusedImageAssets: [],
    absoluteImagePaths: [{ fileId: 'docs/a.md', filePath: 'docs/a.md', href: '/Users/me/a.png' }],
    duplicateHeadingSlugs: [],
    unresolvedMarkdownLinks: [],
  }),
  /data-health-action="fix-absolute-images"/,
);
assert.match(
  buildProjectAssetsHtml([
    {
      path: 'assets/logo.png',
      name: 'logo.png',
      referenceCount: 1,
      unused: false,
      references: [{ fileId: 'readme', fileName: 'README.md', filePath: 'README.md' }],
    },
    { path: 'assets/orphan.png', name: 'orphan.png', referenceCount: 0, unused: true, references: [] },
  ]),
  /data-asset-file-id="readme"/,
);
assert.match(
  buildProjectAssetsHtml([
    { path: 'assets/orphan.png', name: 'orphan.png', referenceCount: 0, unused: true, references: [] },
  ]),
  /未引用/,
);

console.log('project sidebar tests passed');
