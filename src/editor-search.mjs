export function collectSearchMatches(markdown = '', query = '') {
  const term = String(query).trim();
  if (!term) return [];

  const text = String(markdown);
  const lowerText = text.toLocaleLowerCase();
  const lowerTerm = term.toLocaleLowerCase();
  const matches = [];
  let cursor = 0;

  while (cursor < text.length) {
    const index = lowerText.indexOf(lowerTerm, cursor);
    if (index === -1) break;
    matches.push({ start: index, end: index + term.length });
    cursor = index + term.length;
  }

  return matches;
}
