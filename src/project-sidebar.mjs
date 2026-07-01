import { escapeHtml } from './text-utils.mjs';

export function buildProjectSearchResults(entries = [], query = '') {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return [];

  const results = [];
  for (const entry of entries) {
    const text = String(entry.draft ?? entry.content ?? '');
    const index = text.toLocaleLowerCase().indexOf(normalizedQuery);
    if (index === -1 && !entry.path.toLocaleLowerCase().includes(normalizedQuery)) continue;
    const start = Math.max(0, index - 28);
    const excerpt = index >= 0 ? text.slice(start, index + normalizedQuery.length + 48).replace(/\s+/g, ' ') : entry.path;
    results.push({ entry, excerpt, index });
  }

  return results;
}

export function renderProjectSearchResults(entries = [], query = '') {
  const results = buildProjectSearchResults(entries, query);
  return results.length
    ? results.slice(0, 20).map(({ entry, excerpt }) => `<button class="project-search-result" type="button" data-project-search-id="${escapeHtml(entry.id)}">
      <span>${escapeHtml(entry.name)}</span>
      <small>${escapeHtml(excerpt)}</small>
    </button>`).join('')
    : '<p class="empty-outline">项目中没有匹配内容</p>';
}

export function getQuickOpenResults(entries = [], query = '') {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return [];

  return entries
    .filter((entry) => `${entry.name} ${entry.path}`.toLocaleLowerCase().includes(normalizedQuery))
    .sort((a, b) => a.path.length - b.path.length || a.path.localeCompare(b.path));
}

export function renderQuickOpenResults(entries = [], query = '') {
  const results = getQuickOpenResults(entries, query);
  return results.length
    ? results.slice(0, 12).map((entry) => `<button class="quick-open-result" type="button" data-quick-open-id="${escapeHtml(entry.id)}">
      <span>${escapeHtml(entry.name)}</span>
      <small>${escapeHtml(entry.path)}</small>
    </button>`).join('')
    : '<p class="empty-outline">没有匹配文件</p>';
}

export function renderProjectFiles(entries = [], activeId = '') {
  return entries
    .map((entry) => {
      const activeClass = entry.id === activeId ? ' is-active' : '';
      return `<button class="project-file${activeClass}" type="button" data-file-id="${escapeHtml(entry.id)}">
        <span class="project-file-name">${escapeHtml(entry.name)}</span>
        <span class="project-file-path">${escapeHtml(entry.path)}</span>
      </button>`;
    })
    .join('');
}

export function buildDocumentRelationsHtml({ backlinks = [], unresolvedLinks = [] } = {}) {
  const backlinksHtml = backlinks.length
    ? backlinks.slice(0, 12).map((link) => `<button class="relation-link" type="button" data-relation-file-id="${escapeHtml(link.id)}">
      <span>${escapeHtml(link.name)}</span>
      <small>${escapeHtml(link.label || link.path)}</small>
    </button>`).join('')
    : '<p class="empty-outline">暂无反向链接</p>';
  const unresolvedHtml = unresolvedLinks.length
    ? unresolvedLinks.slice(0, 12).map((link) => `<div class="relation-missing">
      <span>${escapeHtml(link.label || link.href)}</span>
      <small>${escapeHtml(link.resolvedPath)}</small>
    </div>`).join('')
    : '<p class="empty-outline">没有失效链接</p>';

  return `
    <section>
      <h3>反向链接</h3>
      ${backlinksHtml}
    </section>
    <section>
      <h3>失效链接</h3>
      ${unresolvedHtml}
    </section>
  `;
}

export function buildProjectHealthHtml(health) {
  const groups = [
    ['缺失图片', health.missingImageAssets],
    ['未引用图片', health.unusedImageAssets],
    ['绝对路径图片', health.absoluteImagePaths],
    ['重复标题', health.duplicateHeadingSlugs],
    ['失效文档链接', health.unresolvedMarkdownLinks],
  ];
  const total = groups.reduce((sum, [, items]) => sum + items.length, 0);
  return `
    <div class="project-health-header">
      <strong>项目检查</strong>
      <span>${total ? `${total} 个问题` : '未发现问题'}</span>
    </div>
    ${groups.map(([label, items]) => renderHealthGroup(label, items)).join('')}
  `;
}

function renderHealthGroup(label, items) {
  const details = items.slice(0, 4).map((item) => `<li>
    <span>${escapeHtml(item.filePath || item.path || item.slug || item.href)}</span>
    <small>${escapeHtml(item.resolvedPath || item.href || item.name || item.headings?.join(' / ') || '')}</small>
  </li>`).join('');
  return `<section class="health-group">
    <h3>${escapeHtml(label)} <span>${items.length}</span></h3>
    ${items.length ? `<ul>${details}</ul>` : '<p class="empty-outline">无</p>'}
  </section>`;
}
