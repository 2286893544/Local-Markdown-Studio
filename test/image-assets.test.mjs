import assert from 'node:assert/strict';
import {
  buildImageSnippet,
  formatMarkdownRelativePath,
  resolveDroppedImageReference,
  sanitizeImageFileName,
} from '../src/image-assets.mjs';

assert.equal(sanitizeImageFileName('product image:1.png'), 'product-image-1.png');
assert.equal(buildImageSnippet('./assets/product.png', 'product.png'), '![product](./assets/product.png)');
assert.equal(buildImageSnippet('/Users/me/Desktop/hero.png', 'hero.png'), '![hero](/Users/me/Desktop/hero.png)');
assert.equal(formatMarkdownRelativePath('assets/product.png'), './assets/product.png');
assert.equal(formatMarkdownRelativePath('/Users/me/Desktop/hero.png'), '/Users/me/Desktop/hero.png');
assert.equal(formatMarkdownRelativePath('../assets/product.png'), '../assets/product.png');

assert.equal(
  resolveDroppedImageReference({
    documentPath: '/Users/me/docs/specs/prd.md',
    projectPath: '/Users/me/docs',
    sourcePath: '/Users/me/docs/assets/hero.png',
  }),
  '../assets/hero.png',
);

assert.equal(
  resolveDroppedImageReference({
    documentPath: '/Users/me/docs/specs/prd.md',
    projectPath: '/Users/me/docs',
    sourcePath: '/Users/me/docs/specs/images/hero.png',
  }),
  './images/hero.png',
);

assert.equal(
  resolveDroppedImageReference({
    documentPath: '/Users/me/docs/specs/prd.md',
    projectPath: '/Users/me/docs',
    sourcePath: '/Users/me/Desktop/hero.png',
  }),
  '../../Desktop/hero.png',
);

assert.equal(
  resolveDroppedImageReference({
    documentPath: '/Users/me/docs/specs/prd.md',
    sourcePath: '/Users/me/docs/specs/images/local.png',
  }),
  './images/local.png',
);

assert.equal(
  resolveDroppedImageReference({
    documentPath: '/Users/me/docs/specs/prd.md',
    sourcePath: '/Users/me/Desktop/hero.png',
  }),
  '../../Desktop/hero.png',
);

assert.equal(
  resolveDroppedImageReference({
    documentPath: '/Users/xujiahang/Documents/Typora/当前文件.md',
    sourcePath: '/Users/xujiahang/Documents/图片/护照/澳门.jpg',
  }),
  '../图片/护照/澳门.jpg',
);

console.log('image asset tests passed');
