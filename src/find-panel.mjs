export function openFindPanel({ elements, showReplace = false } = {}) {
  document.body.classList.add('is-find-open');
  document.body.classList.toggle('is-replace-open', showReplace);
  setTimeout(() => {
    const input = showReplace ? elements.replaceInput : elements.searchInput;
    input.focus({ preventScroll: true });
    input.select();
  }, 0);
}

export function closeFindPanel({ elements, nativeApi = window.markdownNative } = {}) {
  document.body.classList.remove('is-find-open', 'is-replace-open');
  nativeApi?.stopFindInPage?.();
  elements.editor.focus({ preventScroll: true });
}
