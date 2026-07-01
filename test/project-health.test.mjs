import assert from 'node:assert/strict';
import { buildProjectHealth } from '../src/project-health.mjs';

const entries = [
  {
    id: 'docs/index.md',
    name: 'index.md',
    path: 'docs/index.md',
    content: `# Intro

## Intro

![Logo](../assets/logo.png)
![Missing](../assets/missing.png)
![Absolute](/Users/example/Desktop/image.png)

[Missing doc](./missing.md)
`,
  },
  {
    id: 'docs/guide.md',
    name: 'guide.md',
    path: 'docs/guide.md',
    content: `# Guide

![Remote](https://example.com/remote.png)
[Index](./index.md)
`,
  },
];

const assets = [
  { path: 'assets/logo.png', name: 'logo.png' },
  { path: 'assets/orphan.png', name: 'orphan.png' },
];

assert.deepEqual(buildProjectHealth({ entries, assets }), {
  missingImageAssets: [
    {
      fileId: 'docs/index.md',
      fileName: 'index.md',
      filePath: 'docs/index.md',
      href: '../assets/missing.png',
      label: 'Missing',
      resolvedPath: 'assets/missing.png',
    },
  ],
  unusedImageAssets: [
    { path: 'assets/orphan.png', name: 'orphan.png' },
  ],
  absoluteImagePaths: [
    {
      fileId: 'docs/index.md',
      fileName: 'index.md',
      filePath: 'docs/index.md',
      href: '/Users/example/Desktop/image.png',
      label: 'Absolute',
    },
  ],
  duplicateHeadingSlugs: [
    {
      fileId: 'docs/index.md',
      fileName: 'index.md',
      filePath: 'docs/index.md',
      slug: 'intro',
      headings: ['Intro', 'Intro'],
    },
  ],
  unresolvedMarkdownLinks: [
    {
      fileId: 'docs/index.md',
      fileName: 'index.md',
      filePath: 'docs/index.md',
      href: './missing.md',
      label: 'Missing doc',
      resolvedPath: 'docs/missing.md',
    },
  ],
});

console.log('project health tests passed');
