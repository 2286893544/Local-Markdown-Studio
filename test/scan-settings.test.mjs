import assert from 'node:assert/strict';
import {
  buildScanSummaryText,
  formatGeneralRuleLabel,
  normalizeDirectoryName,
  normalizeGeneralRulePattern,
  normalizeScanExtension,
  renderScanOption,
} from '../src/scan-settings.mjs';

assert.equal(normalizeScanExtension('*.MARKDOWN'), '.markdown');
assert.equal(normalizeScanExtension('txt'), '.txt');
assert.equal(normalizeScanExtension(''), '');
assert.equal(normalizeGeneralRulePattern('/dist/'), 'dist');
assert.equal(normalizeDirectoryName('/Build/'), 'Build');
assert.equal(formatGeneralRuleLabel('.*'), '不扫描 .xxxx 目录');
assert.equal(formatGeneralRuleLabel('dist'), '不扫描 dist 目录');
assert.match(renderScanOption('rule', '.*', true), /data-general-rule="\.\*"/);
assert.match(renderScanOption('extension', '.md', false), /data-scan-extension="\.md"/);
assert.equal(
  buildScanSummaryText({
    markdownExtensions: ['.md', '.markdown'],
    ignoredDirectoryPatterns: ['.*'],
    ignoredDirectoryNames: ['node_modules'],
  }),
  '将扫描 .md / .markdown；不扫描 .xxxx 目录；跳过 node_modules',
);

console.log('scan setting tests passed');
