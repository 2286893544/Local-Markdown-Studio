export function openFindPanel({ elements } = {}) {
  document.body.classList.add('is-find-open');
  setTimeout(() => {
    elements.searchInput.focus({ preventScroll: true });
    elements.searchInput.select();
  }, 0);
}

export function closeFindPanel({ elements, nativeApi = window.markdownNative } = {}) {
  document.body.classList.remove('is-find-open', 'is-replace-open');
  nativeApi?.stopFindInPage?.();
  elements.editor.focus({ preventScroll: true });
}
