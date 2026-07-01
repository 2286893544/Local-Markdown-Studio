export function stripExtension(value) {
  return String(value || 'Markdown Document').replace(/\.[^.]+$/, '') || 'Markdown Document';
}

export function stripNativePath(value = '') {
  return String(value).split(/[\\/]/).filter(Boolean).pop() || '';
}

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeRegExp(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
