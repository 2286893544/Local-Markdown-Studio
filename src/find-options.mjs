export function createDefaultSearchOptions() {
  return { caseSensitive: false, wholeWord: false, useRegex: false, inSelection: false };
}

export function syncSearchOptionButtons(elements, state) {
  elements.searchOptionButtons.forEach((button) => {
    button.classList.toggle('is-active', Boolean(state.searchOptions[button.dataset.findOption]));
  });
  elements.findInSelectionButton.classList.toggle('is-active', state.searchOptions.inSelection);
}

export function toggleSearchOptionState(state, option) {
  if (!Object.hasOwn(state.searchOptions, option) || option === 'inSelection') return;
  state.searchOptions[option] = !state.searchOptions[option];
  resetSearchIndex(state);
}

export function toggleFindInSelectionState(state, editor) {
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const nextActive = !state.searchOptions.inSelection && start !== end;
  state.searchOptions.inSelection = nextActive;
  state.searchSelectionRange = nextActive ? { start, end } : null;
  resetSearchIndex(state);
}

export function getSearchOptions(state) {
  return {
    caseSensitive: state.searchOptions.caseSensitive,
    wholeWord: state.searchOptions.wholeWord,
    useRegex: state.searchOptions.useRegex,
    range: state.searchOptions.inSelection ? state.searchSelectionRange : null,
  };
}

export function canUseNativeFind(state) {
  return !state.searchOptions.wholeWord && !state.searchOptions.useRegex && !state.searchOptions.inSelection;
}

export function replaceMatches(markdown, matches, replacement) {
  return [...matches].reverse().reduce((nextMarkdown, match) => (
    `${nextMarkdown.slice(0, match.start)}${replacement}${nextMarkdown.slice(match.end)}`
  ), markdown);
}

function resetSearchIndex(state) {
  state.searchMatchIndex = state.query.trim() ? 0 : -1;
}
