export function toggleSidebar({ elements, state }) {
  state.sidebarCollapsed = !state.sidebarCollapsed;
  elements.body.classList.toggle('is-sidebar-collapsed', state.sidebarCollapsed);
  elements.outlinePane.setAttribute('aria-expanded', String(!state.sidebarCollapsed));
  elements.sidebarToggleButton.textContent = state.sidebarCollapsed ? '›' : '‹';
  elements.sidebarToggleButton.title = state.sidebarCollapsed ? '展开侧边目录' : '收起侧边目录';
  elements.sidebarToggleButton.setAttribute('aria-label', elements.sidebarToggleButton.title);
}
