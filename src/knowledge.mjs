const markdownLinkPattern = /(!)?\[([^\]]*)\]\(([^)\s]+)\)/g;
const localMarkdownExtensionPattern = /\.(md|markdown|txt)$/i;

export function extractMarkdownLinks(markdown = '') {
  return [...String(markdown).matchAll(markdownLinkPattern)].map((match) => ({
    label: match[2],
    href: match[3],
    isImage: Boolean(match[1]),
  }));
}

export function isLocalMarkdownHref(href = '') {
  const value = String(href).trim();
  if (!value || value.startsWith('#')) return false;
  if (/^(https?:|mailto:|tel:|javascript:)/i.test(value)) return false;
  return localMarkdownExtensionPattern.test(stripHashAndQuery(value));
}

export function resolveMarkdownLinkPath(sourcePath = '', href = '') {
  const target = stripHashAndQuery(href).replace(/\\/g, '/').trim();
  if (!target) return '';
  if (target.startsWith('/')) return normalizePath(target.slice(1));

  const sourceParts = normalizePath(sourcePath).split('/').filter(Boolean);
  sourceParts.pop();
  return normalizePath([...sourceParts, ...target.split('/')].join('/'));
}

export function buildProjectKnowledge(entries = [], activeId = '') {
  const activeEntry = entries.find((entry) => entry.id === activeId);
  if (!activeEntry) return { backlinks: [], unresolvedLinks: [] };

  const pathToEntry = new Map(entries.map((entry) => [normalizePath(entry.path), entry]));
  const activePath = normalizePath(activeEntry.path);
  const backlinks = [];

  entries.forEach((entry) => {
    if (entry.id === activeId) return;
    extractMarkdownLinks(entry.content)
      .filter((link) => !link.isImage && isLocalMarkdownHref(link.href))
      .forEach((link) => {
        if (resolveMarkdownLinkPath(entry.path, link.href) === activePath) {
          backlinks.push({
            id: entry.id,
            name: entry.name,
            path: entry.path,
            label: link.label,
          });
        }
      });
  });

  const unresolvedLinks = extractMarkdownLinks(activeEntry.content)
    .filter((link) => !link.isImage && isLocalMarkdownHref(link.href))
    .map((link) => ({
      href: link.href,
      label: link.label,
      resolvedPath: resolveMarkdownLinkPath(activeEntry.path, link.href),
    }))
    .filter((link) => !pathToEntry.has(link.resolvedPath));

  return { backlinks, unresolvedLinks };
}

function stripHashAndQuery(value = '') {
  return String(value).trim().split('#')[0].split('?')[0];
}

function normalizePath(value = '') {
  const result = [];
  decodeURIComponent(String(value))
    .replace(/\\/g, '/')
    .split('/')
    .forEach((part) => {
      if (!part || part === '.') return;
      if (part === '..') {
        result.pop();
        return;
      }
      result.push(part);
    });
  return result.join('/');
}
