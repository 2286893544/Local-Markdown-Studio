export function collectSearchMatches(markdown = '', query = '', options = {}) {
  const term = String(query).trim();
  if (!term) return [];

  const text = String(markdown);
  const range = normalizeRange(options.range, text.length);
  const source = text.slice(range.start, range.end);
  const matcher = createSearchMatcher(term, options);
  if (!matcher) return [];

  const matches = [];
  let match;

  while ((match = matcher.exec(source))) {
    const matchText = match[0];
    if (!matchText) {
      matcher.lastIndex += 1;
      continue;
    }
    matches.push({ start: range.start + match.index, end: range.start + match.index + matchText.length });
  }

  return matches;
}

export function createSearchMatcher(query = '', options = {}) {
  const term = String(query).trim();
  if (!term) return null;

  const source = options.useRegex ? term : escapeRegExp(term);
  const pattern = options.wholeWord ? `\\b(?:${source})\\b` : source;
  const flags = options.caseSensitive ? 'g' : 'gi';

  try {
    return new RegExp(pattern, flags);
  } catch {
    return null;
  }
}

function normalizeRange(range, textLength) {
  if (!range) return { start: 0, end: textLength };
  const start = clampIndex(Math.min(range.start, range.end), textLength);
  const end = clampIndex(Math.max(range.start, range.end), textLength);
  return start === end ? { start: 0, end: textLength } : { start, end };
}

function clampIndex(value, textLength) {
  return Math.min(Math.max(Number(value) || 0, 0), textLength);
}

function escapeRegExp(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
