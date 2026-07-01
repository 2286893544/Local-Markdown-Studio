import {
  escapeHtml,
  stripNativePath,
} from './text-utils.mjs';

export function renderRecentItems(items = [], dataName, emptyText) {
  return items.length
    ? items.map((item) => renderRecentItem(item, dataName)).join('')
    : `<p class="empty-outline">${escapeHtml(emptyText)}</p>`;
}

export function rememberRecentItem(storageKey, list = [], item, storage = localStorage) {
  const next = [
    { path: item.path, name: item.name || stripNativePath(item.path) },
    ...list.filter((entry) => entry.path !== item.path),
  ].slice(0, 10);
  storage.setItem(storageKey, JSON.stringify(next));
  return next;
}

export function forgetRecentItem(storageKey, list = [], itemPath, storage = localStorage) {
  const next = list.filter((entry) => entry.path !== itemPath);
  storage.setItem(storageKey, JSON.stringify(next));
  return next;
}

export function readStoredList(storageKey, storage = localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(storageKey) || '[]');
    return Array.isArray(parsed)
      ? parsed.filter((item) => item?.path).map((item) => ({ path: item.path, name: item.name || stripNativePath(item.path) }))
      : [];
  } catch {
    return [];
  }
}

function renderRecentItem(item, dataName) {
  return `<button class="recent-item" type="button" ${dataName}="${escapeHtml(item.path)}">
    <span>${escapeHtml(item.name || stripNativePath(item.path) || item.path)}</span>
    <small>${escapeHtml(item.path)}</small>
  </button>`;
}
