const defaultMarkdownExtensions = ['.md'];
const defaultIgnoredDirectoryNames = ['node_modules'];
const imageAssetExtensionPattern = /\.(apng|avif|gif|jpe?g|png|svg|webp)$/i;
const supportedMarkdownExtensions = new Set(['.md', '.markdown']);

export function isMarkdownProjectFile(path = '', options = {}) {
  const lowerPath = String(path).toLowerCase();
  return getMarkdownExtensions(options).some((extension) => lowerPath.endsWith(extension));
}

export function normalizeProjectFiles(files = [], options = {}) {
  return Array.from(files)
    .map((file) => {
      const path = normalizePath(file.webkitRelativePath || file.path || file.name || '');
      return {
        id: path,
        name: path.split('/').pop() || file.name || path,
        path,
        file,
      };
    })
    .filter((entry) => entry.path && isMarkdownProjectFile(entry.path, options) && !isIgnoredProjectPath(entry.path, options))
    .sort(compareProjectEntries);
}

export function normalizeProjectAssets(files = [], options = {}) {
  return Array.from(files)
    .map((file) => {
      const path = normalizePath(file.webkitRelativePath || file.path || file.name || '');
      return {
        id: path,
        name: path.split('/').pop() || file.name || path,
        path,
        file,
      };
    })
    .filter((entry) => entry.path && isImageProjectAsset(entry.path) && !isIgnoredProjectPath(entry.path, options))
    .sort(compareProjectEntries);
}

export function getProjectLoadingPercent(current, total, start = 0, end = 100) {
  const safeStart = clampPercent(start);
  const safeEnd = clampPercent(end);
  if (!total || total <= 0) return safeEnd;
  const ratio = Math.min(Math.max(current / total, 0), 1);
  return Math.round(safeStart + (safeEnd - safeStart) * ratio);
}

export async function collectProjectAssetsFromDirectoryHandle(directoryHandle, options = {}) {
  const assets = [];
  await collectAssetEntries(directoryHandle, '', assets, options);
  return assets.sort(compareProjectEntries);
}

export async function collectMarkdownEntriesFromDirectoryHandle(directoryHandle, options = {}, onProgress) {
  const scanOptions = typeof options === 'function' ? {} : options;
  const progressCallback = typeof options === 'function' ? options : onProgress;
  const entries = [];
  const counters = { visited: 0, markdown: 0 };
  await collectDirectoryEntries(directoryHandle, '', entries, counters, scanOptions, progressCallback);
  return entries.sort(compareProjectEntries);
}

async function collectAssetEntries(directoryHandle, prefix, assets, options) {
  for await (const [name, handle] of directoryHandle.entries()) {
    const path = normalizePath(prefix ? `${prefix}/${name}` : name);
    if (handle.kind === 'directory' && isIgnoredDirectoryName(name, options)) continue;
    if (handle.kind === 'directory') {
      await collectAssetEntries(handle, path, assets, options);
      continue;
    }
    if (handle.kind === 'file' && isImageProjectAsset(path)) {
      assets.push({
        id: path,
        name,
        path,
        handle,
      });
    }
  }
}

async function collectDirectoryEntries(directoryHandle, prefix, entries, counters, options, onProgress) {
  for await (const [name, handle] of directoryHandle.entries()) {
    const path = normalizePath(prefix ? `${prefix}/${name}` : name);
    if (handle.kind === 'directory' && isIgnoredDirectoryName(name, options)) {
      continue;
    }
    counters.visited += 1;
    if (handle.kind === 'directory') {
      onProgress?.({ ...counters, path, kind: handle.kind });
      await collectDirectoryEntries(handle, path, entries, counters, options, onProgress);
      continue;
    }
    if (handle.kind === 'file' && isMarkdownProjectFile(path, options)) {
      counters.markdown += 1;
      entries.push({
        id: path,
        name,
        path,
        handle,
      });
    }
    onProgress?.({ ...counters, path, kind: handle.kind });
  }
}

function isImageProjectAsset(path = '') {
  return imageAssetExtensionPattern.test(String(path).toLowerCase());
}

function compareProjectEntries(left, right) {
  const leftScore = getPriorityScore(left.path);
  const rightScore = getPriorityScore(right.path);
  if (leftScore !== rightScore) return leftScore - rightScore;
  return left.path.localeCompare(right.path, 'zh-CN', { sensitivity: 'base' });
}

function getPriorityScore(path) {
  return /^readme(?:\.(md|markdown))?$/i.test(path) ? 0 : 1;
}

function normalizePath(path) {
  return String(path).replace(/\\/g, '/').replace(/^\/+/, '');
}

function isIgnoredProjectPath(path, options) {
  return normalizePath(path)
    .split('/')
    .some((part) => isIgnoredDirectoryName(part, options));
}

function isIgnoredDirectoryName(name, options = {}) {
  const directoryName = String(name).toLowerCase();
  if (getIgnoredDirectoryPatterns(options).some((pattern) => matchesDirectoryPattern(directoryName, pattern))) return true;
  if (getIgnoreDotDirectories(options) && directoryName.startsWith('.')) return true;
  return new Set(getIgnoredDirectoryNames(options)).has(directoryName);
}

function getMarkdownExtensions(options = {}) {
  const extensions = options.markdownExtensions ?? defaultMarkdownExtensions;
  return extensions
    .map((extension) => String(extension).toLowerCase())
    .filter((extension) => supportedMarkdownExtensions.has(extension));
}

function getIgnoredDirectoryNames(options = {}) {
  const directoryNames = options.ignoredDirectoryNames ?? defaultIgnoredDirectoryNames;
  return directoryNames.map((name) => String(name).toLowerCase());
}

function getIgnoredDirectoryPatterns(options = {}) {
  return (options.ignoredDirectoryPatterns ?? [])
    .map((pattern) => String(pattern).trim().toLowerCase())
    .filter(Boolean);
}

function matchesDirectoryPattern(directoryName, pattern) {
  if (pattern === '.*') return directoryName.startsWith('.');
  if (!pattern.includes('*')) return directoryName === pattern;
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`).test(directoryName);
}

function getIgnoreDotDirectories(options = {}) {
  return options.ignoreDotDirectories !== false;
}

function clampPercent(value) {
  return Math.min(Math.max(Number(value) || 0, 0), 100);
}
