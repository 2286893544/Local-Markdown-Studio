import assert from 'node:assert/strict';
import {
  buildProjectKnowledge,
  extractMarkdownLinks,
  isLocalMarkdownHref,
  resolveMarkdownLinkPath,
} from '../src/knowledge.mjs';

assert.deepEqual(extractMarkdownLinks('Read [Intro](./intro.md) and ![Logo](assets/logo.png).'), [
  { label: 'Intro', href: './intro.md', isImage: false },
  { label: 'Logo', href: 'assets/logo.png', isImage: true },
]);

assert.equal(isLocalMarkdownHref('./intro.md'), true);
assert.equal(isLocalMarkdownHref('../guide.markdown#install'), true);
assert.equal(isLocalMarkdownHref('https://example.com/readme.md'), false);
assert.equal(isLocalMarkdownHref('#local-section'), false);
assert.equal(isLocalMarkdownHref('assets/logo.png'), false);

assert.equal(resolveMarkdownLinkPath('docs/index.md', './intro.md#top'), 'docs/intro.md');
assert.equal(resolveMarkdownLinkPath('docs/guides/setup.md', '../index.md'), 'docs/index.md');
assert.equal(resolveMarkdownLinkPath('docs/index.md', '/root.md'), 'root.md');

const entries = [
  { id: 'index', path: 'docs/index.md', name: 'index.md', content: '[Intro](./intro.md)\n[Missing](./missing.md)' },
  { id: 'intro', path: 'docs/intro.md', name: 'intro.md', content: '[Back](./index.md)' },
  { id: 'notes', path: 'notes.md', name: 'notes.md', content: '[Intro](docs/intro.md)' },
];

assert.deepEqual(buildProjectKnowledge(entries, 'intro'), {
  backlinks: [
    { id: 'index', name: 'index.md', path: 'docs/index.md', label: 'Intro' },
    { id: 'notes', name: 'notes.md', path: 'notes.md', label: 'Intro' },
  ],
  unresolvedLinks: [],
});

assert.deepEqual(buildProjectKnowledge(entries, 'index'), {
  backlinks: [
    { id: 'intro', name: 'intro.md', path: 'docs/intro.md', label: 'Back' },
  ],
  unresolvedLinks: [
    { href: './missing.md', label: 'Missing', resolvedPath: 'docs/missing.md' },
  ],
});

console.log('knowledge tests passed');
