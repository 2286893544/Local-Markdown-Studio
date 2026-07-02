import { extractHeadings } from './markdown.mjs';
import {
  extractMarkdownLinks,
  isLocalMarkdownHref,
  resolveMarkdownLinkPath,
} from './knowledge.mjs';

const imageExtensionPattern = /\.(apng|avif|gif|jpe?g|png|svg|webp)$/i;

export function buildProjectHealth({ entries = [], assets = [] } = {}) {
  const entryPaths = new Set(entries.map((entry) => normalizePath(entry.path)));
  const assetPaths = new Set(assets.map((asset) => normalizePath(asset.path)));
  const referencedAssetPaths = new Set();
  const missingImageAssets = [];
  const absoluteImagePaths = [];
  const unresolvedMarkdownLinks = [];
  const duplicateHeadingSlugs = [];

  entries.forEach((entry) => {
    const links = extractMarkdownLinks(entry.content || '');

    links.filter((link) => link.isImage).forEach((link) => {
      if (isExternalHref(link.href)) return;
      if (isAbsoluteLocalPath(link.href)) {
        absoluteImagePaths.push(toIssue(entry, link));
        return;
      }

      const resolvedPath = resolveMarkdownLinkPath(entry.path, link.href);
      if (!isImageAssetPath(resolvedPath)) return;
      referencedAssetPaths.add(resolvedPath);
      if (!assetPaths.has(resolvedPath)) {
        missingImageAssets.push({ ...toIssue(entry, link), resolvedPath });
      }
    });

    links.filter((link) => !link.isImage && isLocalMarkdownHref(link.href)).forEach((link) => {
      const resolvedPath = resolveMarkdownLinkPath(entry.path, link.href);
      if (!entryPaths.has(resolvedPath)) {
        unresolvedMarkdownLinks.push({ ...toIssue(entry, link), resolvedPath });
      }
    });

    duplicateHeadingSlugs.push(...findDuplicateHeadingSlugs(entry));
  });

  const unusedImageAssets = assets
    .filter((asset) => isImageAssetPath(asset.path))
    .filter((asset) => !referencedAssetPaths.has(normalizePath(asset.path)))
    .map((asset) => ({ path: normalizePath(asset.path), name: asset.name }));

  return {
    missingImageAssets,
    unusedImageAssets,
    absoluteImagePaths,
    duplicateHeadingSlugs,
    unresolvedMarkdownLinks,
  };
}

export function buildImageAssetInventory({ entries = [], assets = [] } = {}) {
  const assetMap = new Map(assets
    .filter((asset) => isImageAssetPath(asset.path))
    .map((asset) => [normalizePath(asset.path), {
      path: normalizePath(asset.path),
      name: asset.name,
      referenceCount: 0,
      unused: true,
      references: [],
    }]));

  entries.forEach((entry) => {
    extractMarkdownLinks(entry.content || '')
      .filter((link) => link.isImage && !isExternalHref(link.href) && !isAbsoluteLocalPath(link.href))
      .forEach((link) => {
        const resolvedPath = resolveMarkdownLinkPath(entry.path, link.href);
        const asset = assetMap.get(resolvedPath);
        if (!asset) return;

        asset.references.push(toIssue(entry, link));
        asset.referenceCount = asset.references.length;
        asset.unused = false;
      });
  });

  return [...assetMap.values()];
}

export function isImageAssetPath(filePath = '') {
  return imageExtensionPattern.test(normalizePath(filePath));
}

function findDuplicateHeadingSlugs(entry) {
  const grouped = new Map();
  extractHeadings(entry.content || '').forEach((heading) => {
    const list = grouped.get(heading.id) || [];
    list.push(heading.text);
    grouped.set(heading.id, list);
  });

  return [...grouped.entries()]
    .filter(([, headings]) => headings.length > 1)
    .map(([slug, headings]) => ({
      fileId: entry.id,
      fileName: entry.name,
      filePath: entry.path,
      slug,
      headings,
    }));
}

function toIssue(entry, link) {
  return {
    fileId: entry.id,
    fileName: entry.name,
    filePath: entry.path,
    href: link.href,
    label: link.label,
  };
}

function isExternalHref(href = '') {
  return /^(https?:|data:|blob:)/i.test(String(href).trim());
}

function isAbsoluteLocalPath(href = '') {
  const value = String(href).trim();
  return /^\/[^/]/.test(value) || /^[a-z]:[\\/]/i.test(value);
}

function normalizePath(value = '') {
  return String(value).replace(/\\/g, '/').replace(/^\/+/, '');
}
