import { escapeHtml } from './text-utils.mjs';

const supportedScanExtensions = new Set(['.md', '.markdown']);

export function renderScanOption(type, value, checked) {
  const dataName = {
    extension: 'data-scan-extension',
    rule: 'data-general-rule',
    directory: 'data-ignore-dir',
  }[type];
  const label = escapeHtml(value);
  const text = type === 'rule' ? escapeHtml(formatGeneralRuleLabel(value)) : label;
  return `
    <div class="scan-option-row">
      <label>
        <input type="checkbox" ${dataName}="${label}" ${checked ? 'checked' : ''}>
        <span>${text}</span>
      </label>
      <button class="scan-remove-button" type="button" data-scan-remove="${type}" data-value="${label}" aria-label="删除 ${label}">×</button>
    </div>
  `;
}

export function normalizeScanExtension(value) {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return '';
  const withoutWildcard = trimmed.replace(/^\*+/, '');
  const extension = withoutWildcard.startsWith('.') ? withoutWildcard : `.${withoutWildcard}`;
  return supportedScanExtensions.has(extension) ? extension : '';
}

export function normalizeGeneralRulePattern(value) {
  return value.trim().replace(/^\/+|\/+$/g, '').toLowerCase();
}

export function normalizeDirectoryName(value) {
  return value.trim().replace(/^\/+|\/+$/g, '');
}

export function formatGeneralRuleLabel(pattern) {
  if (pattern === '.*') return '不扫描 .xxxx 目录';
  return `不扫描 ${pattern} 目录`;
}

export function buildScanSummaryText(scan) {
  const scanTypes = scan.markdownExtensions.length ? scan.markdownExtensions.join(' / ') : '未选择文件类型';
  const ignored = scan.ignoredDirectoryNames.length ? scan.ignoredDirectoryNames.join('、') : '不跳过目录';
  const rules = scan.ignoredDirectoryPatterns.length
    ? scan.ignoredDirectoryPatterns.map(formatGeneralRuleLabel).join('、')
    : '无通用规则';
  return `将扫描 ${scanTypes}；${rules}；跳过 ${ignored}`;
}
