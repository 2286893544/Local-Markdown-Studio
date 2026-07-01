import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const appSource = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');

assert.ok(appSource.split('\n').length <= 1400, 'src/app.js should stay under 1400 lines after feature-block extraction');
assert.match(appSource, /from '\.\/app-events\.mjs'/);
assert.match(appSource, /from '\.\/app-scan-settings\.mjs'/);
assert.doesNotMatch(appSource, /function bindEvents\(\) \{/);
assert.doesNotMatch(appSource, /function renderScanSettings\(\) \{/);

console.log('app structure tests passed');
