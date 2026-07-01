export function ensureMarkdownFilePath(relativePath) {
  if (!relativePath) return '';
  return /\.(md|markdown)$/i.test(relativePath) ? relativePath : `${relativePath}.md`;
}

export function normalizeCreatePath(value = '') {
  const rawPath = String(value).trim().replace(/\\/g, '/');
  if (rawPath.startsWith('/') || /^[a-z]:\//i.test(rawPath)) return '';
  const path = rawPath.replace(/\/+$/g, '');
  if (!path || path.split('/').some((part) => !part || part === '.' || part === '..')) return '';
  return path;
}
