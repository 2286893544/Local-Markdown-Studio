import assert from 'node:assert/strict';
import { replaceMarkdownImageHref } from '../src/project-fixes.mjs';

const markdown = [
  '# Assets',
  '',
  '![Passport](/Users/me/Pictures/passport.png)',
  '![Other](/Users/me/Pictures/other.png)',
].join('\n');

assert.equal(
  replaceMarkdownImageHref(markdown, '/Users/me/Pictures/passport.png', '../Pictures/passport.png'),
  [
    '# Assets',
    '',
    '![Passport](../Pictures/passport.png)',
    '![Other](/Users/me/Pictures/other.png)',
  ].join('\n'),
);

assert.equal(
  replaceMarkdownImageHref(markdown, '/Users/me/Pictures/missing.png', '../Pictures/missing.png'),
  markdown,
);

console.log('project fixes tests passed');
