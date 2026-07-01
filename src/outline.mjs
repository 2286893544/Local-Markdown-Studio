export function buildOutlineEntries(headings = [], options = {}) {
  if (!headings.length) return [];
  const baseLevel = Math.min(...headings.map((heading) => heading.level));
  const collapsedOutlineIds = options.collapsedOutlineIds || new Set();
  const expandedOutlineIds = options.expandedOutlineIds || new Set();
  const stack = [];

  return headings.map((heading, index) => {
    while (stack.length && stack[stack.length - 1].level >= heading.level) {
      stack.pop();
    }

    const outlineId = `${heading.id}-${index}`;
    const hasChildren = hasOutlineChildren(headings, index);
    const defaultCollapsed = heading.level > baseLevel && hasChildren;
    const collapsed = getCollapsedState({ outlineId, hasChildren, defaultCollapsed }, collapsedOutlineIds, expandedOutlineIds);
    const hidden = stack.some((entry) => entry.collapsed);
    const entry = {
      ...heading,
      outlineId,
      hasChildren,
      collapsed,
      hidden,
    };

    stack.push({ level: heading.level, collapsed });
    return entry;
  });
}

function hasOutlineChildren(headings, index) {
  const level = headings[index].level;
  for (let cursor = index + 1; cursor < headings.length; cursor += 1) {
    if (headings[cursor].level <= level) return false;
    if (headings[cursor].level > level) return true;
  }
  return false;
}

function getCollapsedState(entry, collapsedOutlineIds, expandedOutlineIds) {
  if (!entry.hasChildren) return false;
  if (collapsedOutlineIds.has(entry.outlineId)) return true;
  if (expandedOutlineIds.has(entry.outlineId)) return false;
  return entry.defaultCollapsed;
}
