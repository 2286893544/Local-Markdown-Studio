import assert from 'node:assert/strict';
import {
  collectProjectAssetsFromDirectoryHandle,
  collectMarkdownEntriesFromDirectoryHandle,
  getProjectLoadingPercent,
  isMarkdownProjectFile,
  normalizeProjectAssets,
  normalizeProjectFiles,
} from '../src/project.mjs';

assert.equal(isMarkdownProjectFile('README.md'), true);
assert.equal(isMarkdownProjectFile('docs/guide.markdown'), false);
assert.equal(isMarkdownProjectFile('notes/todo.txt'), false);
assert.equal(isMarkdownProjectFile('src/app.js'), false);
assert.equal(isMarkdownProjectFile('image.png'), false);

const files = normalizeProjectFiles([
  { name: 'app.js', webkitRelativePath: 'src/app.js' },
  { name: 'install.md', webkitRelativePath: 'docs/install.md' },
  { name: 'README.md', webkitRelativePath: 'README.md' },
  { name: 'draft.markdown', webkitRelativePath: 'notes/draft.markdown' },
  { name: 'package-readme.md', webkitRelativePath: 'node_modules/pkg/README.md' },
  { name: 'nested.md', webkitRelativePath: 'docs/node_modules/pkg/nested.md' },
  { name: 'rule.md', webkitRelativePath: '.cursor/rules/rule.md' },
  { name: 'agent.md', webkitRelativePath: '.claude/commands/agent.md' },
  { name: 'dist-note.md', webkitRelativePath: 'dist/dist-note.md' },
]);

assert.deepEqual(
  files.map((file) => file.path),
  ['README.md', 'dist/dist-note.md', 'docs/install.md'],
);

assert.deepEqual(files[0], {
  id: 'README.md',
  name: 'README.md',
  path: 'README.md',
  file: { name: 'README.md', webkitRelativePath: 'README.md' },
});

const assets = normalizeProjectAssets([
  { name: 'logo.png', webkitRelativePath: 'assets/logo.png' },
  { name: 'photo.webp', webkitRelativePath: 'docs/images/photo.webp' },
  { name: 'icon.svg', webkitRelativePath: 'node_modules/pkg/icon.svg' },
  { name: 'notes.md', webkitRelativePath: 'notes.md' },
]);

assert.deepEqual(
  assets.map((asset) => asset.path),
  ['assets/logo.png', 'docs/images/photo.webp'],
);

assert.equal(getProjectLoadingPercent(0, 10, 20, 70), 20);
assert.equal(getProjectLoadingPercent(5, 10, 20, 70), 45);
assert.equal(getProjectLoadingPercent(10, 10, 20, 70), 70);
assert.equal(getProjectLoadingPercent(12, 10, 20, 70), 70);
assert.equal(getProjectLoadingPercent(1, 0, 20, 70), 70);

const scanned = await collectMarkdownEntriesFromDirectoryHandle(
  fakeDirectory({
    'README.md': fakeFile('README.md'),
    docs: fakeDirectory({
      'guide.md': fakeFile('guide.md'),
      images: fakeDirectory({
        'photo.webp': fakeFile('photo.webp'),
      }),
    }),
    assets: fakeDirectory({
      'logo.png': fakeFile('logo.png'),
    }),
    node_modules: fakeDirectory({
      package: fakeDirectory({
        'README.md': fakeFile('README.md'),
      }),
    }),
    '.cursor': fakeDirectory({
      rules: fakeDirectory({
        'rule.md': fakeFile('rule.md'),
      }),
    }),
    '.claude': fakeDirectory({
      commands: fakeDirectory({
        'agent.md': fakeFile('agent.md'),
      }),
    }),
  }),
);

assert.deepEqual(
  scanned.map((entry) => entry.path),
  ['README.md', 'docs/guide.md'],
);

const scannedAssets = await collectProjectAssetsFromDirectoryHandle(
  fakeDirectory({
    'README.md': fakeFile('README.md'),
    assets: fakeDirectory({
      'logo.png': fakeFile('logo.png'),
    }),
  }),
);

assert.deepEqual(scannedAssets.map((asset) => asset.path), ['assets/logo.png']);

const markdownAndTxt = normalizeProjectFiles(
  [
    { name: 'README.md', webkitRelativePath: 'README.md' },
    { name: 'notes.txt', webkitRelativePath: 'notes.txt' },
    { name: 'draft.markdown', webkitRelativePath: 'draft.markdown' },
  ],
  { markdownExtensions: ['.md', '.txt'] },
);

assert.deepEqual(
  markdownAndTxt.map((entry) => entry.path),
  ['README.md', 'notes.txt'],
);

const noIgnoredDirectories = normalizeProjectFiles(
  [
    { name: 'README.md', webkitRelativePath: 'README.md' },
    { name: 'package-readme.md', webkitRelativePath: 'node_modules/pkg/README.md' },
  ],
  { ignoredDirectoryNames: [] },
);

assert.deepEqual(
  noIgnoredDirectories.map((entry) => entry.path),
  ['README.md', 'node_modules/pkg/README.md'],
);

const includeHiddenDirectories = normalizeProjectFiles(
  [
    { name: 'README.md', webkitRelativePath: 'README.md' },
    { name: 'agent.md', webkitRelativePath: '.claude/commands/agent.md' },
  ],
  { ignoredDirectoryNames: [], ignoreDotDirectories: false },
);

assert.deepEqual(
  includeHiddenDirectories.map((entry) => entry.path),
  ['README.md', '.claude/commands/agent.md'],
);

const ignoredByPattern = normalizeProjectFiles(
  [
    { name: 'README.md', webkitRelativePath: 'README.md' },
    { name: 'cache-note.md', webkitRelativePath: 'build-cache/cache-note.md' },
  ],
  { ignoredDirectoryNames: [], ignoredDirectoryPatterns: ['build-*'], ignoreDotDirectories: false },
);

assert.deepEqual(
  ignoredByPattern.map((entry) => entry.path),
  ['README.md'],
);

console.log('project tests passed');

function fakeFile(name) {
  return {
    kind: 'file',
    name,
  };
}

function fakeDirectory(children) {
  return {
    kind: 'directory',
    async *entries() {
      for (const [name, handle] of Object.entries(children)) {
        yield [name, handle];
      }
    },
  };
}
