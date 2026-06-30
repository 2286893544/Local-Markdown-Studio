import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const website = await readFile(new URL('../website/index.html', import.meta.url), 'utf8');
const styles = await readFile(new URL('../website/styles.css', import.meta.url), 'utf8');

assert.match(website, /<title>Local Markdown Studio/);
assert.match(website, /href="\.\.\/dist\/Local Markdown Studio-macOS\.dmg"/);
assert.match(website, /M1 \/ M2 \/ M3 \/ M4/);
assert.match(website, /Intel Mac/);
assert.match(website, /Local Markdown Studio-macOS-x64\.dmg/);
assert.match(website, /xattr -dr com\.apple\.quarantine/);
assert.match(website, /本地优先/);
assert.match(website, /assets\/app-preview\.png/);
assert.match(website, /hero-inner/);
assert.match(website, /hero-highlights/);
assert.match(website, /section-inner/);
assert.match(styles, /--content-max: 1480px/);
assert.match(styles, /\.section-inner/);
assert.match(styles, /--accent: #3157d5/);
assert.match(styles, /@keyframes heroReveal/);
assert.match(styles, /@keyframes previewFloat/);
assert.match(styles, /@media \(max-width: 760px\)/);
assert.match(styles, /\.hero/);
assert.match(styles, /\.download-panel/);
assert.match(styles, /prefers-reduced-motion/);
assert.doesNotMatch(styles, /letter-spacing:\s*-/);

console.log('website source tests passed');
