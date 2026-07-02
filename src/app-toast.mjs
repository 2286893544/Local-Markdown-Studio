let toastTimer = 0;

export function showToast(elements, message) {
  if (!elements.toast) return;

  elements.toast.textContent = message;
  elements.toast.classList.add('is-visible');
  elements.toast.setAttribute('aria-hidden', 'false');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    elements.toast.classList.remove('is-visible');
    elements.toast.setAttribute('aria-hidden', 'true');
  }, 1800);
}
