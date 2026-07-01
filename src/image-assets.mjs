const imageExtensionPattern = /\.(apng|avif|gif|jpe?g|png|svg|webp)$/i;

export function sanitizeImageFileName(value = 'image.png') {
  return String(value || 'image.png')
    .replace(/[\\/:]/g, '-')
    .replace(/\0/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+/, '') || 'image.png';
}

export function buildImageSnippet(relativePath, fileName = '') {
  const safeName = fileName || stripNativePath(relativePath) || 'image.png';
  return `![${stripExtension(safeName)}](${formatMarkdownRelativePath(relativePath)})`;
}

export function formatMarkdownRelativePath(value = '') {
  const relativePath = normalizePath(value).replace(/^\/+/, '');
  if (!relativePath || relativePath.startsWith('./') || relativePath.startsWith('../')) return relativePath;
  return `./${relativePath}`;
}

export function resolveDroppedImageReference({ documentPath = '', projectPath = '', sourcePath = '' } = {}) {
  const normalizedDocumentPath = normalizeNativePath(documentPath);
  const normalizedSourcePath = normalizeNativePath(sourcePath);

  if (!normalizedDocumentPath || !normalizedSourcePath || !imageExtensionPattern.test(normalizedSourcePath)) return '';

  const relativePath = getRelativePath(getDirectoryPath(normalizedDocumentPath), normalizedSourcePath);
  return relativePath ? formatMarkdownRelativePath(relativePath) : '';
}

function getRelativePath(fromDirectory, targetPath) {
  const fromParts = splitPath(fromDirectory);
  const targetParts = splitPath(targetPath);
  if (!fromParts.length || !targetParts.length) return '';
  if (getPathRoot(fromParts[0]) !== getPathRoot(targetParts[0])) return '';

  let sharedIndex = 0;
  while (
    sharedIndex < fromParts.length
    && sharedIndex < targetParts.length
    && comparePathSegment(fromParts[sharedIndex], targetParts[sharedIndex])
  ) {
    sharedIndex += 1;
  }

  const upSegments = fromParts.slice(sharedIndex).map(() => '..');
  const downSegments = targetParts.slice(sharedIndex);
  return [...upSegments, ...downSegments].join('/') || '.';
}

function splitPath(value) {
  return normalizeNativePath(value).split('/').filter(Boolean);
}

function getDirectoryPath(value) {
  const path = normalizeNativePath(value);
  const parts = path.split('/');
  parts.pop();
  return parts.join('/') || '/';
}

function getPathRoot(firstPart = '') {
  return /^[a-z]:$/i.test(firstPart) ? firstPart.toLowerCase() : '';
}

function comparePathSegment(left, right) {
  if (/^[a-z]:$/i.test(left) || /^[a-z]:$/i.test(right)) {
    return left.toLowerCase() === right.toLowerCase();
  }
  return left === right;
}

function normalizeNativePath(value = '') {
  return String(value || '').trim().replace(/\\/g, '/').replace(/\/+/g, '/');
}

function normalizePath(value = '') {
  return String(value || '').trim().replace(/\\/g, '/').replace(/\/+/g, '/');
}

function stripExtension(value) {
  return String(value || 'Markdown Document').replace(/\.[^.]+$/, '') || 'Markdown Document';
}

function stripNativePath(value = '') {
  return String(value).split(/[\\/]/).filter(Boolean).pop() || '';
}
