import {
  extractHeadings,
  getDocumentStats,
  highlightSearch,
  renderMarkdown,
} from './markdown.mjs';
import {
  collectProjectAssetsFromDirectoryHandle,
  collectMarkdownEntriesFromDirectoryHandle,
  getProjectLoadingPercent,
  normalizeProjectAssets,
  normalizeProjectFiles,
} from './project.mjs';
import {
  buildProjectKnowledge,
  resolveMarkdownLinkPath,
} from './knowledge.mjs';
import { buildProjectHealth } from './project-health.mjs';
import {
  buildImageSnippet,
  formatMarkdownRelativePath,
  resolveDroppedImageReference,
  sanitizeImageFileName,
} from './image-assets.mjs';
import {
  ensureMarkdownFilePath,
  normalizeCreatePath,
} from './project-actions.mjs';
import { collectSearchMatches } from './editor-search.mjs';
import { buildOutlineEntries } from './outline.mjs';
import {
  forgetRecentItem as forgetRecentListItem,
  readStoredList,
  rememberRecentItem as rememberRecentListItem,
  renderRecentItems,
} from './recent-items.mjs';
import {
  buildDocumentRelationsHtml,
  buildProjectHealthHtml,
  getQuickOpenResults as getQuickOpenResultsForEntries,
  renderProjectFiles as renderProjectFilesHtml,
  renderProjectSearchResults as renderProjectSearchResultsHtml,
  renderQuickOpenResults as renderQuickOpenResultsHtml,
} from './project-sidebar.mjs';
import {
  escapeHtml,
  escapeRegExp,
  stripExtension,
  stripNativePath,
} from './text-utils.mjs';
import { createDiagramController } from './diagram-controller.mjs';
import { bindAppEvents } from './app-events.mjs';
import { createScanSettingsController } from './app-scan-settings.mjs';
import { sampleMarkdown } from './sample-document.mjs';

const draftKey = 'local-markdown-studio:draft';
const fileNameKey = 'local-markdown-studio:file-name';
const themeKey = 'local-markdown-studio:theme';
const recentFilesKey = 'local-markdown-studio:recent-files';
const recentProjectsKey = 'local-markdown-studio:recent-projects';
const defaultScanExtensions = ['.md'];
const defaultIgnoredDirectories = ['node_modules'];
const defaultScanExtensionOptions = ['.md', '.markdown', '.txt'];
const defaultIgnoredDirectoryOptions = ['node_modules', 'dist', 'build', 'coverage', 'out'];
const defaultGeneralRuleOptions = ['.*'];

const elements = {
  body: document.body,
  editor: document.querySelector('#editor'),
  preview: document.querySelector('#preview'),
  outline: document.querySelector('#outline'),
  stats: document.querySelector('#stats'),
  fileName: document.querySelector('#fileName'),
  fileInput: document.querySelector('#fileInput'),
  projectInput: document.querySelector('#projectInput'),
  openButton: document.querySelector('#openButton'),
  openProjectButton: document.querySelector('#openProjectButton'),
  recentButton: document.querySelector('#recentButton'),
  recentPanel: document.querySelector('#recentPanel'),
  recentClose: document.querySelector('#recentClose'),
  recentFiles: document.querySelector('#recentFiles'),
  recentProjects: document.querySelector('#recentProjects'),
  sampleButton: document.querySelector('#sampleButton'),
  saveButton: document.querySelector('#saveButton'),
  saveAsButton: document.querySelector('#saveAsButton'),
  exportButton: document.querySelector('#exportButton'),
  focusButton: document.querySelector('#focusButton'),
  imageInput: document.querySelector('#imageInput'),
  themeButton: document.querySelector('#themeButton'),
  searchInput: document.querySelector('#searchInput'),
  replaceInput: document.querySelector('#replaceInput'),
  matchStatus: document.querySelector('#matchStatus'),
  searchPrevButton: document.querySelector('#searchPrevButton'),
  searchNextButton: document.querySelector('#searchNextButton'),
  replaceButton: document.querySelector('#replaceButton'),
  replaceAllButton: document.querySelector('#replaceAllButton'),
  clearDraftButton: document.querySelector('#clearDraftButton'),
  dropOverlay: document.querySelector('#dropOverlay'),
  loadingOverlay: document.querySelector('#loadingOverlay'),
  loadingTitle: document.querySelector('#loadingTitle'),
  loadingPercent: document.querySelector('#loadingPercent'),
  loadingBar: document.querySelector('#loadingBar'),
  loadingMessage: document.querySelector('#loadingMessage'),
  previewPane: document.querySelector('.preview-pane'),
  diagramViewer: document.querySelector('#diagramViewer'),
  diagramViewerCanvas: document.querySelector('#diagramViewerCanvas'),
  diagramViewerClose: document.querySelector('#diagramViewerClose'),
  diagramZoomOut: document.querySelector('#diagramZoomOut'),
  diagramZoomIn: document.querySelector('#diagramZoomIn'),
  diagramZoomReset: document.querySelector('#diagramZoomReset'),
  diagramZoomLevel: document.querySelector('#diagramZoomLevel'),
  outlinePane: document.querySelector('.outline-pane'),
  projectPanel: document.querySelector('.project-panel'),
  newFileButton: document.querySelector('#newFileButton'),
  newFolderButton: document.querySelector('#newFolderButton'),
  projectFiles: document.querySelector('#projectFiles'),
  projectMeta: document.querySelector('#projectMeta'),
  quickOpenInput: document.querySelector('#quickOpenInput'),
  quickOpenResults: document.querySelector('#quickOpenResults'),
  projectSearchInput: document.querySelector('#projectSearchInput'),
  projectSearchResults: document.querySelector('#projectSearchResults'),
  projectHealth: document.querySelector('#projectHealth'),
  documentRelations: document.querySelector('#documentRelations'),
  scanSummary: document.querySelector('#scanSummary'),
  scanSettingsButton: document.querySelector('#scanSettingsButton'),
  scanSettingsDialog: document.querySelector('#scanSettingsDialog'),
  scanSettingsClose: document.querySelector('#scanSettingsClose'),
  scanSettingsApply: document.querySelector('#scanSettingsApply'),
  scanExtensionList: document.querySelector('#scanExtensionList'),
  scanExtensionInput: document.querySelector('#scanExtensionInput'),
  addScanExtensionButton: document.querySelector('#addScanExtensionButton'),
  generalRuleList: document.querySelector('#generalRuleList'),
  generalRuleInput: document.querySelector('#generalRuleInput'),
  addGeneralRuleButton: document.querySelector('#addGeneralRuleButton'),
  ignoreDirectoryList: document.querySelector('#ignoreDirectoryList'),
  ignoreDirectoryInput: document.querySelector('#ignoreDirectoryInput'),
  addIgnoreDirectoryButton: document.querySelector('#addIgnoreDirectoryButton'),
  modeButtons: [...document.querySelectorAll('[data-mode]')],
  formatButtons: [...document.querySelectorAll('[data-format-action]')],
};

const state = {
  fileName: localStorage.getItem(fileNameKey) || '未命名文档',
  markdown: localStorage.getItem(draftKey) || sampleMarkdown,
  mode: 'split',
  theme: localStorage.getItem(themeKey) || 'light',
  query: '',
  replaceText: '',
  searchMatchIndex: -1,
  searchMatches: [],
  nativeSearchResult: null,
  projectName: '',
  projectFiles: [],
  projectAssets: [],
  activeProjectFileId: '',
  projectSource: null,
  quickOpenQuery: '',
  projectSearchQuery: '',
  recentFiles: readStoredList(recentFilesKey),
  recentProjects: readStoredList(recentProjectsKey),
  currentNativePath: '',
  dirty: false,
  focusMode: false,
  activeOutlineId: '',
  expandedOutlineIds: new Set(),
  collapsedOutlineIds: new Set(),
  diagramZoom: 1,
  pendingDiagramZoomFrame: 0,
  syncingScroll: false,
  scan: {
    extensionOptions: [...defaultScanExtensionOptions],
    generalRuleOptions: [...defaultGeneralRuleOptions],
    ignoredDirectoryOptions: [...defaultIgnoredDirectoryOptions],
    markdownExtensions: [...defaultScanExtensions],
    ignoredDirectoryPatterns: [...defaultGeneralRuleOptions],
    ignoredDirectoryNames: [...defaultIgnoredDirectories],
    ignoreDotDirectories: true,
  },
};

const diagrams = createDiagramController({ elements, state });
const scanSettings = createScanSettingsController({ elements, state });

initialize();

function initialize() {
  elements.editor.value = state.markdown;
  elements.fileName.textContent = state.fileName;
  document.documentElement.dataset.theme = state.theme;
  syncNativeTheme();
  bindAppEvents({
    elements,
    state,
    diagrams,
    sampleMarkdown,
    draftKey,
    fileNameKey,
    themeKey,
    actions: {
      addGeneralRule: scanSettings.addGeneralRule,
      addIgnoredDirectory: scanSettings.addIgnoredDirectory,
      addScanExtension: scanSettings.addScanExtension,
      removeScanOption: scanSettings.removeScanOption,
      rescanCurrentProject,
      updateScanSettingsFromInputs: scanSettings.updateScanSettingsFromInputs,
      clearProjectState, confirmDiscardChanges, consumePendingNativeFile, markDirty, persistActiveProjectDraft, persistDraft,
      closeRecentPanel, openRecentFile, openRecentPanel, openRecentProject,
      createProjectFile, createProjectFolder, getProjectNameFromFiles, getQuickOpenResults, openProject, openProjectFromFiles, openQuickOpenResult,
      downloadFile, getDocumentTitle, render, renderProjectSearchResults, renderQuickOpenResults,
      hideDropOverlay, insertImageAssetFromFile, insertMarkdownSnippet, openFile, showDropOverlay,
      loadNativeMarkdownFile, openMarkdownLink, openNativeFile, replaceAllMatches, replaceCurrentMatch, runNativeFindInPage,
      saveCurrentDocument, saveCurrentDocumentAs, setDocumentContent, setFocusMode, setMode, stepSearchMatch,
      closeScanSettingsDialog: scanSettings.closeScanSettingsDialog,
      openScanSettingsDialog: scanSettings.openScanSettingsDialog,
      syncEditorScrollToPreview, syncNativeTheme, syncPreviewScrollToEditor, updateActiveOutlineFromScroll,
    },
  });
  scanSettings.renderScanSettings();
  render();
}

function render({ scrollToSearchMatch = false, focusEditorMatch = false } = {}) {
  const rendered = renderMarkdown(state.markdown);
  const useNativeFind = Boolean(window.markdownNative?.findInPage);
  refreshSearchMatches();
  elements.preview.innerHTML = useNativeFind ? rendered : highlightSearch(rendered, state.query);
  if (!useNativeFind) highlightCurrentPreviewMatch();
  diagrams.fitDiagramsToContainers();
  renderProjectFiles();
  renderQuickOpenResults();
  renderProjectSearchResults();
  renderProjectHealth();
  renderDocumentRelations();
  renderOutline();
  renderStats();
  renderSearchStatus();
  renderRecentPanel();
  elements.fileName.textContent = `${state.dirty ? '● ' : ''}${state.fileName}`;
  if (scrollToSearchMatch) scrollToSearchMatchElement({ focusEditorMatch });
}

function scrollToSearchMatchElement({ focusEditorMatch = false } = {}) {
  if (!state.query.trim() || !state.searchMatches.length) return;

  requestAnimationFrame(() => {
    if (!window.markdownNative?.findInPage) {
      highlightCurrentPreviewMatch();
      const previewMatches = [...elements.preview.querySelectorAll('mark')];
      const previewMatch = previewMatches[state.searchMatchIndex] || previewMatches[0];
      if (previewMatch) previewMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    selectCurrentEditorMatch({ focusEditorMatch });
  });
}

function refreshSearchMatches() {
  state.searchMatches = collectSearchMatches(state.markdown, state.query);
  if (!state.searchMatches.length) {
    state.searchMatchIndex = -1;
    return;
  }

  if (state.searchMatchIndex < 0) {
    state.searchMatchIndex = 0;
    return;
  }

  if (state.searchMatchIndex >= state.searchMatches.length) {
    state.searchMatchIndex = state.searchMatches.length - 1;
  }
}

function renderSearchStatus() {
  const total = state.searchMatches.length;
  const current = total && state.searchMatchIndex >= 0 ? state.searchMatchIndex + 1 : 0;
  elements.matchStatus.textContent = `${current}/${total}`;
  const disabled = !total;
  elements.searchPrevButton.disabled = disabled;
  elements.searchNextButton.disabled = disabled;
  elements.replaceButton.disabled = disabled;
  elements.replaceAllButton.disabled = disabled;
}

function highlightCurrentPreviewMatch() {
  const marks = [...elements.preview.querySelectorAll('mark')];
  marks.forEach((mark, index) => {
    mark.classList.toggle('is-current-search', index === state.searchMatchIndex);
  });
}

function stepSearchMatch(delta, { focusEditorMatch = false } = {}) {
  refreshSearchMatches();
  if (!state.searchMatches.length) return;

  const total = state.searchMatches.length;
  state.searchMatchIndex = (state.searchMatchIndex + delta + total) % total;
  render({ scrollToSearchMatch: true, focusEditorMatch });
  runNativeFindInPage({ forward: delta > 0, findNext: true });
}

function replaceCurrentMatch() {
  refreshSearchMatches();
  if (!state.searchMatches.length || state.searchMatchIndex < 0) return;

  const match = state.searchMatches[state.searchMatchIndex];
  state.markdown = `${state.markdown.slice(0, match.start)}${state.replaceText}${state.markdown.slice(match.end)}`;
  elements.editor.value = state.markdown;
  markDirty();
  persistActiveProjectDraft();
  persistDraft();
  render({ scrollToSearchMatch: true, focusEditorMatch: true });
  runNativeFindInPage({ forward: true, findNext: false });
}

function replaceAllMatches() {
  refreshSearchMatches();
  if (!state.searchMatches.length) return;

  const matcher = new RegExp(escapeRegExp(state.query.trim()), 'gi');
  state.markdown = state.markdown.replace(matcher, state.replaceText);
  state.searchMatchIndex = 0;
  elements.editor.value = state.markdown;
  markDirty();
  persistActiveProjectDraft();
  persistDraft();
  render({ scrollToSearchMatch: true, focusEditorMatch: true });
  runNativeFindInPage({ forward: true, findNext: false });
}

function selectCurrentEditorMatch({ focusEditorMatch = false } = {}) {
  const match = state.searchMatches[state.searchMatchIndex];
  if (!match) return;

  scrollEditorToCharacter(match.start);
  if (focusEditorMatch) {
    elements.editor.setSelectionRange(match.start, match.end);
    elements.editor.focus({ preventScroll: true });
  }
}

function scrollEditorToCharacter(characterIndex) {
  if (!Number.isFinite(characterIndex) || characterIndex < 0) return;

  const lineIndex = state.markdown.slice(0, characterIndex).split(/\r\n?|\n/).length - 1;
  scrollEditorToLine(lineIndex);
}

function runNativeFindInPage({ forward = true, findNext = false } = {}) {
  const term = state.query.trim();
  if (!window.markdownNative?.findInPage) return;
  if (!term) {
    window.markdownNative.stopFindInPage?.();
    return;
  }

  window.markdownNative.findInPage(term, { forward, findNext });
}

function renderRecentPanel() {
  elements.recentFiles.innerHTML = renderRecentItems(state.recentFiles, 'data-recent-file', '还没有最近文件');
  elements.recentProjects.innerHTML = renderRecentItems(state.recentProjects, 'data-recent-project', '还没有最近项目');
}

function openRecentPanel() {
  renderRecentPanel();
  elements.recentPanel.classList.add('is-visible');
  elements.recentPanel.setAttribute('aria-hidden', 'false');
}

function closeRecentPanel() {
  elements.recentPanel.classList.remove('is-visible');
  elements.recentPanel.setAttribute('aria-hidden', 'true');
}

async function openRecentFile(filePath) {
  if (!filePath || !confirmDiscardChanges()) return;
  closeRecentPanel();

  if (!window.markdownNative?.openRecentFile) {
    window.alert?.('浏览器模式不能重新打开最近文件，请使用“打开”重新选择。');
    return;
  }

  try {
    const file = await window.markdownNative.openRecentFile(filePath);
    if (file) loadNativeMarkdownFile(file);
  } catch {
    forgetRecentItem(recentFilesKey, state.recentFiles, filePath);
    renderRecentPanel();
    window.alert?.('这个文件已经无法打开，已从最近文件中移除。');
  }
}

async function openRecentProject(projectPath) {
  if (!projectPath || !confirmDiscardChanges()) return;
  closeRecentPanel();

  if (!window.markdownNative?.openRecentProject) {
    window.alert?.('浏览器模式不能重新打开最近项目，请使用“打开项目”重新选择。');
    return;
  }

  showGlobalLoading('正在打开最近项目', projectPath, 8);
  try {
    const project = await window.markdownNative.openRecentProject(projectPath, getProjectScanOptions());
    if (!project) return;

    state.projectSource = { type: 'native-directory', path: project.path, name: project.name };
    rememberRecentProject(project.path, project.name);
    await openProjectEntries(project.entries || [], project.name || stripNativePath(project.path) || '本地项目', { showLoading: false, assets: project.assets || [] });
  } catch {
    forgetRecentItem(recentProjectsKey, state.recentProjects, projectPath);
    window.alert?.('这个项目已经无法打开，已从最近项目中移除。');
  } finally {
    hideGlobalLoading();
  }
}

function rememberRecentFile(filePath, name) {
  if (!filePath) return;
  state.recentFiles = rememberRecentListItem(recentFilesKey, state.recentFiles, { path: filePath, name });
}

function rememberRecentProject(projectPath, name) {
  if (!projectPath) return;
  state.recentProjects = rememberRecentListItem(recentProjectsKey, state.recentProjects, { path: projectPath, name });
}

function forgetRecentItem(storageKey, list, itemPath) {
  const next = forgetRecentListItem(storageKey, list, itemPath);
  list.splice(0, list.length, ...next);
}

function renderProjectSearchResults() {
  const query = state.projectSearchQuery.trim();
  if (!state.projectSource || !query) {
    elements.projectSearchResults.innerHTML = '';
    return;
  }

  elements.projectSearchResults.innerHTML = renderProjectSearchResultsHtml(state.projectFiles, query);

  elements.projectSearchResults.querySelectorAll('[data-project-search-id]').forEach((button) => {
    button.addEventListener('click', () => openProjectSearchResult(button.dataset.projectSearchId));
  });
}

function renderQuickOpenResults() {
  if (!state.projectSource || !state.quickOpenQuery.trim()) {
    elements.quickOpenResults.innerHTML = '';
    return;
  }

  elements.quickOpenResults.innerHTML = renderQuickOpenResultsHtml(state.projectFiles, state.quickOpenQuery);

  elements.quickOpenResults.querySelectorAll('[data-quick-open-id]').forEach((button) => {
    button.addEventListener('click', () => openQuickOpenResult(button.dataset.quickOpenId));
  });
}

function getQuickOpenResults() {
  return getQuickOpenResultsForEntries(state.projectFiles, state.quickOpenQuery);
}

async function openQuickOpenResult(fileId) {
  if (!fileId) return;
  state.quickOpenQuery = '';
  elements.quickOpenInput.value = '';
  elements.quickOpenResults.innerHTML = '';
  await openProjectEntry(fileId, { showLoading: false, preserveMode: true });
}

function renderDocumentRelations() {
  if (!state.projectSource || !state.activeProjectFileId) {
    elements.documentRelations.innerHTML = '';
    return;
  }

  elements.documentRelations.innerHTML = buildDocumentRelationsHtml(
    buildProjectKnowledge(getProjectKnowledgeEntries(), state.activeProjectFileId),
  );

  elements.documentRelations.querySelectorAll('[data-relation-file-id]').forEach((button) => {
    button.addEventListener('click', () => openProjectEntry(button.dataset.relationFileId, { showLoading: false, preserveMode: true }));
  });
}

function renderProjectHealth() {
  if (!state.projectSource) {
    elements.projectHealth.innerHTML = '';
    return;
  }

  const health = buildProjectHealth({
    entries: getProjectKnowledgeEntries(),
    assets: state.projectAssets,
  });
  elements.projectHealth.innerHTML = buildProjectHealthHtml(health);
}

function getProjectKnowledgeEntries() {
  return state.projectFiles.map((entry) => ({
    ...entry,
    content: entry.id === state.activeProjectFileId ? state.markdown : String(entry.draft ?? entry.content ?? ''),
  }));
}

async function openProjectSearchResult(fileId) {
  const query = state.projectSearchQuery.trim();
  if (!fileId || !query) return;
  await openProjectEntry(fileId, { showLoading: false, preserveMode: true });
  state.query = query;
  elements.searchInput.value = query;
  state.searchMatchIndex = 0;
  render({ scrollToSearchMatch: true, focusEditorMatch: true });
  runNativeFindInPage({ forward: true, findNext: false });
}

async function saveCurrentDocument() {
  const activeEntry = state.projectFiles.find((entry) => entry.id === state.activeProjectFileId);
  const targetPath = activeEntry?.absolutePath || state.currentNativePath;

  if (targetPath && window.markdownNative?.saveFile) {
    const file = await window.markdownNative.saveFile(targetPath, state.markdown);
    if (!file) return;
    state.currentNativePath = file.path;
    state.fileName = activeEntry?.path || file.name || stripNativePath(file.path);
    if (activeEntry) {
      activeEntry.content = state.markdown;
      activeEntry.draft = undefined;
    }
    rememberRecentFile(file.path, file.name);
    state.dirty = false;
    persistDraft();
    render();
    return;
  }

  if (state.activeProjectFileId) {
    const entry = state.projectFiles.find((file) => file.id === state.activeProjectFileId);
    if (entry?.handle?.createWritable) {
      const writable = await entry.handle.createWritable();
      await writable.write(state.markdown);
      await writable.close();
      entry.content = state.markdown;
      entry.draft = undefined;
      state.dirty = false;
      render();
      return;
    }
  }

  await saveCurrentDocumentAs();
}

async function saveCurrentDocumentAs() {
  const suggestedName = state.fileName.endsWith('.md') || state.fileName.endsWith('.markdown')
    ? stripNativePath(state.fileName)
    : `${stripExtension(stripNativePath(state.fileName))}.md`;

  if (window.markdownNative?.saveFileAs) {
    const file = await window.markdownNative.saveFileAs(suggestedName, state.markdown);
    if (!file) return;
    state.currentNativePath = file.path;
    state.fileName = file.name || stripNativePath(file.path);
    rememberRecentFile(file.path, file.name);
    state.dirty = false;
    persistDraft();
    render();
    return;
  }

  downloadFile(suggestedName, state.markdown, 'text/markdown');
  state.dirty = false;
  render();
}

function confirmDiscardChanges() {
  if (!state.dirty) return true;
  return window.confirm?.('当前文档有未保存修改，继续会丢失这些修改。要继续吗？') !== false;
}

function markDirty() {
  state.dirty = true;
}

function setDocumentContent({ fileName, markdown, nativePath = '', dirty = false }) {
  state.fileName = fileName;
  state.markdown = String(markdown || '');
  state.currentNativePath = nativePath;
  state.dirty = dirty;
  state.query = '';
  state.searchMatchIndex = -1;
  state.searchMatches = [];
  elements.editor.value = state.markdown;
  elements.searchInput.value = '';
  persistDraft();
}

function renderProjectFiles() {
  const hasProject = Boolean(state.projectSource);
  elements.projectPanel.classList.toggle('is-hidden', !hasProject);
  elements.outlinePane.classList.toggle('without-project', !hasProject);
  elements.newFileButton.disabled = !hasProject;
  elements.newFolderButton.disabled = !hasProject;

  if (!hasProject) {
    elements.projectMeta.textContent = '未打开';
    elements.projectFiles.innerHTML = '';
    return;
  }

  if (!state.projectFiles.length) {
    elements.projectMeta.textContent = `${state.projectName || '项目'} · 0 篇`;
    elements.projectFiles.innerHTML = '<p class="empty-outline">当前扫描设置下没有找到 Markdown</p>';
    return;
  }

  elements.projectMeta.textContent = `${state.projectName || '项目'} · ${state.projectFiles.length} 篇`;
  elements.projectFiles.innerHTML = renderProjectFilesHtml(state.projectFiles, state.activeProjectFileId);

  elements.projectFiles.querySelectorAll('[data-file-id]').forEach((button) => {
    button.addEventListener('click', () => openProjectEntry(button.dataset.fileId, { showLoading: false, preserveMode: true }));
  });
}

function renderOutline() {
  const headings = extractHeadings(state.markdown);
  if (!headings.length) {
    elements.outline.innerHTML = '<p class="empty-outline">当前文档还没有标题</p>';
    return;
  }

  const entries = buildOutlineEntries(headings, {
    collapsedOutlineIds: state.collapsedOutlineIds,
    expandedOutlineIds: state.expandedOutlineIds,
  });
  elements.outline.innerHTML = entries
    .map((entry) => {
      const hiddenClass = entry.hidden ? ' is-hidden' : '';
      const collapsedClass = entry.collapsed ? ' is-collapsed' : '';
      const activeClass = entry.outlineId === state.activeOutlineId ? ' is-active' : '';
      const toggle = entry.hasChildren
        ? `<button class="outline-toggle" type="button" data-outline-toggle="${escapeHtml(entry.outlineId)}" aria-label="${entry.collapsed ? '展开' : '收起'} ${escapeHtml(entry.text)}" aria-expanded="${entry.collapsed ? 'false' : 'true'}"></button>`
        : '<span class="outline-toggle-placeholder"></span>';

      return `<div class="outline-entry${activeClass} level-${entry.level}${hiddenClass}${collapsedClass}" data-outline-id="${escapeHtml(entry.outlineId)}" data-target="${escapeHtml(entry.id)}" data-heading-index="${entry.headingIndex}" data-line-index="${entry.lineIndex}">
        ${toggle}
        <span class="outline-label">${escapeHtml(entry.text)}</span>
      </div>`;
    })
    .join('');

  elements.outline.querySelectorAll('[data-outline-toggle]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleOutlineEntry(button.dataset.outlineToggle);
    });
  });

  elements.outline.querySelectorAll('.outline-entry:not(.is-hidden)').forEach((entry) => {
    entry.addEventListener('click', () => {
      scrollToOutlineTarget(entry);
      toggleOutlineEntry(entry.dataset.outlineId);
    });
  });
}

function scrollToOutlineTarget(entry) {
  const target = elements.preview.querySelector(`[data-heading-index="${entry.dataset.headingIndex}"]`) || document.getElementById(entry.dataset.target);
  state.syncingScroll = true;
  state.activeOutlineId = entry.dataset.outlineId || '';
  renderOutline();
  if (target) scrollPreviewToHeading(target);
  scrollEditorToLine(Number(entry.dataset.lineIndex));
  setTimeout(() => {
    state.syncingScroll = false;
  }, 520);
}

function scrollPreviewToHeading(target) {
  const paneRect = elements.previewPane.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const top = Math.max(0, elements.previewPane.scrollTop + targetRect.top - paneRect.top - 18);
  elements.previewPane.scrollTo({ top, behavior: 'smooth' });
}

function scrollEditorToLine(lineIndex) {
  if (!Number.isFinite(lineIndex) || lineIndex < 0) return;

  const styles = getComputedStyle(elements.editor);
  const lineHeight = parseFloat(styles.lineHeight) || 24;
  const top = Math.max(0, lineIndex * lineHeight - elements.editor.clientHeight * 0.18);
  elements.editor.scrollTo({ top, behavior: 'smooth' });
}

function updateActiveOutlineFromScroll() {
  if (state.syncingScroll) return;

  const headings = [...elements.preview.querySelectorAll('[data-heading-index]')];
  if (!headings.length) return;

  const paneRect = elements.previewPane.getBoundingClientRect();
  let active = headings[0];
  for (const heading of headings) {
    if (heading.getBoundingClientRect().top - paneRect.top <= 40) {
      active = heading;
    } else {
      break;
    }
  }

  const headingIndex = active?.dataset.headingIndex;
  if (!headingIndex) return;
  const nextOutlineId = [...elements.outline.querySelectorAll('.outline-entry')]
    .find((entry) => entry.dataset.headingIndex === headingIndex)?.dataset.outlineId || '';
  if (nextOutlineId && nextOutlineId !== state.activeOutlineId) {
    state.activeOutlineId = nextOutlineId;
    renderOutline();
  }
}

function openMarkdownLink(link) {
  const href = link.getAttribute('href') || '';
  if (!href || /^(https?:|mailto:|tel:)/i.test(href)) return false;

  const [rawPath, rawHash = ''] = href.split('#');
  const hash = decodeURIComponent(rawHash || '');
  if (!rawPath && hash) {
    const target = document.getElementById(hash);
    if (target) scrollPreviewToHeading(target);
    return true;
  }

  const activeEntry = state.projectFiles.find((file) => file.id === state.activeProjectFileId);
  if (!activeEntry) return false;
  const targetPath = resolveMarkdownLinkPath(activeEntry.path, rawPath);
  const candidates = [targetPath, `${targetPath}.md`, `${targetPath}.markdown`];
  const entry = state.projectFiles.find((file) => candidates.includes(file.path));
  if (!entry) return false;

  openProjectEntry(entry.id, { showLoading: false, preserveMode: true }).then(() => {
    if (!hash) return;
    requestAnimationFrame(() => {
      const target = document.getElementById(hash);
      if (target) scrollPreviewToHeading(target);
    });
  });
  return true;
}

function setFocusMode(enabled) {
  state.focusMode = Boolean(enabled);
  elements.body.classList.toggle('is-focus-mode', state.focusMode);
  elements.focusButton.classList.toggle('is-active', state.focusMode);
}

function insertMarkdownSnippet(action) {
  if (action === 'image') {
    elements.imageInput.click();
    return;
  }

  const snippets = {
    heading: { prefix: '## ', suffix: '', fallback: '标题' },
    bold: { prefix: '**', suffix: '**', fallback: '加粗文本' },
    link: { prefix: '[', suffix: '](./path.md)', fallback: '链接文本' },
    code: { prefix: '```text\n', suffix: '\n```', fallback: '代码' },
    table: { prefix: '\n| 列 1 | 列 2 |\n| --- | --- |\n| ', suffix: ' | 内容 |\n', fallback: '内容' },
    task: { prefix: '- [ ] ', suffix: '', fallback: '待办事项' },
  };
  const snippet = snippets[action];
  if (!snippet) return;

  const start = elements.editor.selectionStart;
  const end = elements.editor.selectionEnd;
  const selected = state.markdown.slice(start, end) || snippet.fallback;
  const next = `${snippet.prefix}${selected}${snippet.suffix}`;
  state.markdown = `${state.markdown.slice(0, start)}${next}${state.markdown.slice(end)}`;
  elements.editor.value = state.markdown;
  const cursor = start + snippet.prefix.length + selected.length;
  elements.editor.setSelectionRange(cursor, cursor);
  elements.editor.focus();
  markDirty();
  persistActiveProjectDraft();
  persistDraft();
  render();
}

function insertImageFile(file) {
  insertImageSnippet(`./assets/${sanitizeImageFileName(file.name || 'image.png')}`);
}

async function insertImageAssetFromFile(file) {
  const activeEntry = state.projectFiles.find((entry) => entry.id === state.activeProjectFileId);
  const documentPath = activeEntry?.absolutePath || state.currentNativePath;
  const projectPath = state.projectSource?.type === 'native-directory' ? state.projectSource.path : '';
  const sourcePath = getNativeFilePath(file);
  const existingProjectImagePath = resolveDroppedImageReference({ documentPath, projectPath, sourcePath });
  const fileName = sanitizeImageFileName(file.name || 'image.png');

  if (existingProjectImagePath) {
    insertImageSnippet(existingProjectImagePath, fileName);
    return;
  }

  if (documentPath && window.markdownNative?.saveImageAsset) {
    try {
      const buffer = await file.arrayBuffer();
      const asset = await window.markdownNative.saveImageAsset({ documentPath, fileName, buffer });
      if (asset?.relativePath) {
        insertImageSnippet(formatMarkdownRelativePath(asset.relativePath), asset.fileName || fileName);
        return;
      }
    } catch {
      window.alert?.('图片复制到 assets 目录失败，已改为插入相对路径占位。');
    }
  }

  insertImageSnippet(`./assets/${fileName}`, fileName);
}

function insertImageSnippet(relativePath, fileName = '') {
  const snippet = buildImageSnippet(relativePath, fileName);
  const start = elements.editor.selectionStart;
  const end = elements.editor.selectionEnd;
  state.markdown = `${state.markdown.slice(0, start)}${snippet}${state.markdown.slice(end)}`;
  elements.editor.value = state.markdown;
  elements.editor.setSelectionRange(start + snippet.length, start + snippet.length);
  markDirty();
  persistActiveProjectDraft();
  persistDraft();
  render();
}

function getNativeFilePath(file) {
  return window.markdownNative?.getFilePath?.(file) || file?.path || '';
}

function toggleOutlineEntry(outlineId) {
  const entries = buildOutlineEntries(extractHeadings(state.markdown));
  const entry = entries.find((item) => item.outlineId === outlineId);
  if (!entry || !entry.hasChildren) return;

  if (entry.collapsed) {
    state.expandedOutlineIds.add(outlineId);
    state.collapsedOutlineIds.delete(outlineId);
  } else {
    state.collapsedOutlineIds.add(outlineId);
    state.expandedOutlineIds.delete(outlineId);
  }
  renderOutline();
}

function renderStats() {
  const stats = getDocumentStats(state.markdown);
  elements.stats.textContent = `${stats.words} 词 · ${stats.characters} 字符 · ${stats.headings} 标题 · ${stats.readingMinutes} 分钟读完`;
}

function openFile(file) {
  clearProjectState();
  const reader = new FileReader();
  reader.onload = () => {
    setDocumentContent({
      fileName: file.name,
      markdown: String(reader.result || ''),
      nativePath: '',
      dirty: false,
    });
    rememberRecentFile(file.name, file.name);
    setMode('split');
    render();
  };
  reader.readAsText(file);
}

async function openProject() {
  if (window.markdownNative) {
    await openNativeProject();
    return;
  }

  if ('showDirectoryPicker' in window) {
    try {
      const directoryHandle = await window.showDirectoryPicker({ mode: 'read' });
      state.projectSource = { type: 'directory', handle: directoryHandle, name: directoryHandle.name };
      showGlobalLoading('正在加载项目', '正在扫描文件夹...', 8);
      await yieldToBrowser();
      const files = await collectMarkdownEntriesFromDirectoryHandle(directoryHandle, getProjectScanOptions(), ({ visited, markdown }) => {
        const progress = Math.min(60, 8 + visited * 2);
        updateGlobalLoading(`已扫描 ${visited} 项，找到 ${markdown} 篇 Markdown`, progress);
      });
      const assets = await collectProjectAssetsFromDirectoryHandle(directoryHandle, getProjectScanOptions());
      updateGlobalLoading(`已找到 ${files.length} 篇 Markdown，正在建立索引`, 72);
      await yieldToBrowser();
      await openProjectEntries(files, directoryHandle.name, { showLoading: false, assets });
      updateGlobalLoading('项目加载完成', 100);
      await delay(180);
      return;
    } catch (error) {
      if (error?.name === 'AbortError') return;
      elements.projectInput.click();
      return;
    } finally {
      hideGlobalLoading();
    }
  }

  elements.projectInput.click();
}

async function openNativeFile() {
  const file = await window.markdownNative.openFile();
  if (!file) return;

  loadNativeMarkdownFile(file);
}

function loadNativeMarkdownFile(file) {
  clearProjectState();
  setDocumentContent({
    fileName: file.name || stripNativePath(file.path) || '未命名文档',
    markdown: String(file.content || ''),
    nativePath: file.path || '',
    dirty: false,
  });
  rememberRecentFile(file.path, file.name || stripNativePath(file.path));
  setMode('split');
  render();
}

async function consumePendingNativeFile() {
  const file = await window.markdownNative?.consumePendingFile?.();
  if (file) loadNativeMarkdownFile(file);
}

async function openNativeProject() {
  showGlobalLoading('正在加载项目', '正在打开系统文件夹选择器...', 5);
  try {
    await yieldToBrowser();
    const project = await window.markdownNative.openProject(getProjectScanOptions());
    if (!project) return;

    updateGlobalLoading(`已扫描 ${project.visited || 0} 项，找到 ${project.entries?.length || 0} 篇 Markdown`, 76);
    await yieldToBrowser();
    state.projectSource = { type: 'native-directory', path: project.path, name: project.name };
    rememberRecentProject(project.path, project.name);
    await openProjectEntries(project.entries || [], project.name || stripNativePath(project.path) || '本地项目', { showLoading: false, assets: project.assets || [] });
    updateGlobalLoading('项目加载完成', 100);
    await delay(180);
  } finally {
    hideGlobalLoading();
  }
}

async function openProjectFromFiles(files, projectName) {
  const fileList = Array.from(files || []);
  if (!fileList.length) return;
  state.projectSource = { type: 'files', files: fileList, name: projectName };

  showGlobalLoading('正在加载项目', `正在读取 ${fileList.length} 个文件...`, 8);
  try {
    await yieldToBrowser();
    const entries = normalizeProjectFiles(fileList, getProjectScanOptions());
    const assets = normalizeProjectAssets(fileList, getProjectScanOptions());
    updateGlobalLoading(`找到 ${entries.length} 篇 Markdown，正在建立项目列表`, getProjectLoadingPercent(entries.length, fileList.length, 20, 70));
    await yieldToBrowser();
    await openProjectEntries(entries, projectName, { showLoading: false, assets });
    updateGlobalLoading('项目加载完成', 100);
    await delay(180);
  } finally {
    hideGlobalLoading();
  }
}

async function openProjectEntries(entries, projectName, options = {}) {
  if (options.showLoading !== false) {
    showGlobalLoading('正在加载项目', '正在建立项目列表', 70);
  }
  const hydratedEntries = await hydrateProjectEntries(entries);
  state.projectName = projectName;
  state.projectFiles = hydratedEntries;
  state.projectAssets = options.assets || [];
  state.activeProjectFileId = '';
  state.quickOpenQuery = '';
  state.projectSearchQuery = '';
  elements.quickOpenInput.value = '';
  elements.projectSearchInput.value = '';

  if (!entries.length) {
    setDocumentContent({
      fileName: `${projectName} · 未找到 Markdown`,
      markdown: '# 未找到 Markdown 文档\n\n这个文件夹里没有 `.md`、`.markdown` 或 `.txt` 文件。',
      nativePath: '',
      dirty: false,
    });
    render();
    hideGlobalLoading();
    return;
  }

  const firstEntry = options.openPath
    ? hydratedEntries.find((entry) => entry.path === options.openPath) || hydratedEntries[0]
    : hydratedEntries[0];
  updateGlobalLoading(`正在打开 ${firstEntry.path}`, 88);
  await yieldToBrowser();
  await openProjectEntry(firstEntry.id, { showLoading: false });
  if (options.showLoading !== false) {
    updateGlobalLoading('项目加载完成', 100);
    await delay(180);
    hideGlobalLoading();
  }
}

async function createProjectFile() {
  if (!state.projectSource) return;
  const rawPath = window.prompt?.('输入新文档路径', 'untitled.md');
  if (!rawPath) return;

  const relativePath = ensureMarkdownFilePath(normalizeCreatePath(rawPath));
  if (!relativePath) {
    window.alert?.('文档路径不能是绝对路径，也不能包含 ..');
    return;
  }

  try {
    if (state.projectSource.type === 'native-directory' && window.markdownNative?.createProjectFile) {
      const project = await window.markdownNative.createProjectFile(
        state.projectSource.path,
        relativePath,
        `# ${stripExtension(stripNativePath(relativePath))}\n`,
        getProjectScanOptions(),
      );
      if (!project) return;
      state.projectSource = { type: 'native-directory', path: project.path, name: project.name };
      await openProjectEntries(project.entries || [], project.name || state.projectName, {
        showLoading: false,
        assets: project.assets || [],
        openPath: relativePath,
      });
      return;
    }

    if (state.projectSource.type === 'directory') {
      await createFileInDirectoryHandle(state.projectSource.handle, relativePath, `# ${stripExtension(stripNativePath(relativePath))}\n`);
      await refreshDirectoryProject(relativePath);
      return;
    }
  } catch (error) {
    window.alert?.(error?.message || '新建文档失败');
    return;
  }

  window.alert?.('当前项目打开方式不支持直接新建文档，请用“打开项目”选择本地文件夹。');
}

async function createProjectFolder() {
  if (!state.projectSource) return;
  const relativePath = normalizeCreatePath(window.prompt?.('输入新文件夹路径', 'docs') || '');
  if (!relativePath) {
    window.alert?.('文件夹路径不能是绝对路径，也不能包含 ..');
    return;
  }

  try {
    if (state.projectSource.type === 'native-directory' && window.markdownNative?.createProjectFolder) {
      const project = await window.markdownNative.createProjectFolder(state.projectSource.path, relativePath, getProjectScanOptions());
      if (!project) return;
      state.projectSource = { type: 'native-directory', path: project.path, name: project.name };
      await openProjectEntries(project.entries || [], project.name || state.projectName, {
        showLoading: false,
        assets: project.assets || [],
      });
      return;
    }

    if (state.projectSource.type === 'directory') {
      await getNestedDirectoryHandle(state.projectSource.handle, relativePath, { create: true });
      await refreshDirectoryProject();
      return;
    }
  } catch (error) {
    window.alert?.(error?.message || '新建文件夹失败');
    return;
  }

  window.alert?.('当前项目打开方式不支持直接新建文件夹，请用“打开项目”选择本地文件夹。');
}

async function refreshDirectoryProject(openPath = '') {
  const { handle, name } = state.projectSource;
  const files = await collectMarkdownEntriesFromDirectoryHandle(handle, getProjectScanOptions());
  const assets = await collectProjectAssetsFromDirectoryHandle(handle, getProjectScanOptions());
  await openProjectEntries(files, name, { showLoading: false, assets, openPath });
}

async function createFileInDirectoryHandle(rootHandle, relativePath, content) {
  const parts = relativePath.split('/').filter(Boolean);
  const fileName = parts.pop();
  const directoryHandle = await getNestedDirectoryHandle(rootHandle, parts.join('/'), { create: true });
  try {
    await directoryHandle.getFileHandle(fileName);
    throw new Error('同名文档已存在');
  } catch (error) {
    if (error?.message === '同名文档已存在') throw error;
    if (error?.name && error.name !== 'NotFoundError') throw error;
  }
  const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

async function getNestedDirectoryHandle(rootHandle, relativePath, options = {}) {
  let current = rootHandle;
  for (const part of relativePath.split('/').filter(Boolean)) {
    current = await current.getDirectoryHandle(part, options);
  }
  return current;
}

async function hydrateProjectEntries(entries) {
  const hydrated = [];
  for (const entry of entries) {
    if (typeof entry.content === 'string') {
      hydrated.push(entry);
      continue;
    }

    try {
      const file = entry.handle ? await entry.handle.getFile() : entry.file;
      if (file?.text) {
        hydrated.push({ ...entry, content: await file.text() });
        continue;
      }
    } catch {
      // Keep unreadable entries visible so users can still see and rescan the project.
    }

    hydrated.push(entry);
  }
  return hydrated;
}

async function openProjectEntry(fileId, options = {}) {
  const entry = state.projectFiles.find((file) => file.id === fileId);
  if (!entry) return;

  if (options.showLoading !== false) {
    showGlobalLoading('正在打开文档', entry.path, 35);
    await yieldToBrowser();
  }

  let file;
  if (entry.handle) {
    file = await entry.handle.getFile();
  } else {
    file = entry.file;
  }

  const text = entry.draft ?? entry.content ?? (await file.text());
  state.activeProjectFileId = entry.id;
  setDocumentContent({
    fileName: entry.path,
    markdown: text,
    nativePath: entry.absolutePath || '',
    dirty: Boolean(entry.draft),
  });
  if (!options.preserveMode) {
    setMode('split');
  }
  render();
  if (options.showLoading !== false) {
    updateGlobalLoading('文档加载完成', 100);
    await delay(120);
    hideGlobalLoading();
  }
}

function clearProjectState() {
  state.projectName = '';
  state.projectFiles = [];
  state.projectAssets = [];
  state.activeProjectFileId = '';
  state.projectSource = null;
  state.quickOpenQuery = '';
  state.projectSearchQuery = '';
  state.currentNativePath = '';
  if (elements.quickOpenInput) elements.quickOpenInput.value = '';
  if (elements.projectSearchInput) elements.projectSearchInput.value = '';
}

function persistActiveProjectDraft() {
  if (!state.activeProjectFileId) return;
  const entry = state.projectFiles.find((file) => file.id === state.activeProjectFileId);
  if (entry) entry.draft = state.markdown;
}

function persistDraft() {
  localStorage.setItem(draftKey, state.markdown);
  localStorage.setItem(fileNameKey, state.fileName);
}

function setMode(mode) {
  state.mode = mode;
  elements.body.dataset.mode = mode;
  elements.modeButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.mode === mode);
  });
}

function syncNativeTheme() {
  window.markdownNative?.setTheme?.(state.theme);
}

function syncEditorScrollToPreview() {
  if (state.mode !== 'split' || state.syncingScroll) return;
  syncScrollPosition(elements.previewPane, elements.editor);
}

function syncPreviewScrollToEditor() {
  if (state.mode !== 'split' || state.syncingScroll) return;
  syncScrollPosition(elements.editor, elements.previewPane);
}

function syncScrollPosition(source, target) {
  const maxSourceScroll = source.scrollHeight - source.clientHeight;
  const maxTargetScroll = target.scrollHeight - target.clientHeight;
  if (maxSourceScroll <= 0 || maxTargetScroll <= 0) return;

  const ratio = source.scrollTop / maxSourceScroll;
  state.syncingScroll = true;
  target.scrollTop = ratio * maxTargetScroll;
  requestAnimationFrame(() => {
    state.syncingScroll = false;
  });
}

function showDropOverlay() {
  elements.dropOverlay.classList.add('is-visible');
}

function hideDropOverlay() {
  elements.dropOverlay.classList.remove('is-visible');
}

async function rescanCurrentProject() {
  scanSettings.updateScanSettingsFromInputs();
  scanSettings.closeScanSettingsDialog();

  if (!state.projectSource) {
    scanSettings.renderScanSummary();
    return;
  }

  if (state.projectSource.type === 'files') {
    await openProjectFromFiles(state.projectSource.files, state.projectSource.name);
    return;
  }

  if (state.projectSource.type === 'native-directory') {
    await rescanNativeProject();
    return;
  }

  const { handle, name } = state.projectSource;
  showGlobalLoading('正在重新扫描项目', '正在按当前设置扫描文件夹...', 8);
  try {
    await yieldToBrowser();
    const files = await collectMarkdownEntriesFromDirectoryHandle(handle, getProjectScanOptions(), ({ visited, markdown }) => {
      const progress = Math.min(70, 8 + visited * 2);
      updateGlobalLoading(`已扫描 ${visited} 项，找到 ${markdown} 篇 Markdown`, progress);
    });
    const assets = await collectProjectAssetsFromDirectoryHandle(handle, getProjectScanOptions());
    updateGlobalLoading(`已找到 ${files.length} 篇 Markdown，正在更新列表`, 82);
    await yieldToBrowser();
    await openProjectEntries(files, name, { showLoading: false, assets });
    updateGlobalLoading('重新扫描完成', 100);
    await delay(160);
  } finally {
    hideGlobalLoading();
  }
}

async function rescanNativeProject() {
  const { path: directoryPath, name } = state.projectSource;
  showGlobalLoading('正在重新扫描项目', '正在按当前设置扫描文件夹...', 8);
  try {
    await yieldToBrowser();
    const project = await window.markdownNative.rescanProject(directoryPath, getProjectScanOptions());
    if (!project) return;

    updateGlobalLoading(`已扫描 ${project.visited || 0} 项，找到 ${project.entries?.length || 0} 篇 Markdown`, 82);
    await yieldToBrowser();
    state.projectSource = { type: 'native-directory', path: project.path || directoryPath, name: project.name || name };
    await openProjectEntries(project.entries || [], project.name || name || '本地项目', { showLoading: false, assets: project.assets || [] });
    updateGlobalLoading('重新扫描完成', 100);
    await delay(160);
  } finally {
    hideGlobalLoading();
  }
}

function getProjectScanOptions() {
  return {
    markdownExtensions: state.scan.markdownExtensions,
    ignoredDirectoryNames: state.scan.ignoredDirectoryNames,
    ignoredDirectoryPatterns: state.scan.ignoredDirectoryPatterns,
    ignoreDotDirectories: state.scan.ignoreDotDirectories,
  };
}

function showGlobalLoading(title, message, percent = 0) {
  elements.loadingTitle.textContent = title;
  elements.loadingOverlay.classList.add('is-visible');
  elements.loadingOverlay.setAttribute('aria-hidden', 'false');
  updateGlobalLoading(message, percent);
}

function updateGlobalLoading(message, percent = 0) {
  const safePercent = Math.min(Math.max(Math.round(percent), 0), 100);
  elements.loadingMessage.textContent = message;
  elements.loadingPercent.textContent = `${safePercent}%`;
  elements.loadingBar.style.width = `${safePercent}%`;
}

function hideGlobalLoading() {
  elements.loadingOverlay.classList.remove('is-visible');
  elements.loadingOverlay.setAttribute('aria-hidden', 'true');
  elements.loadingBar.style.width = '0%';
}

function getProjectNameFromFiles(files) {
  const [firstFile] = Array.from(files || []);
  return firstFile?.webkitRelativePath?.split('/')?.[0] || '';
}

function normalizeRelativePath(value = '') {
  return decodeURIComponent(String(value))
    .replace(/\\/g, '/')
    .replace(/^\.\/+/, '')
    .replace(/\/{2,}/g, '/')
    .split('/')
    .reduce((parts, part) => {
      if (!part || part === '.') return parts;
      if (part === '..') {
        parts.pop();
        return parts;
      }
      parts.push(part);
      return parts;
    }, [])
    .join('/');
}

function yieldToBrowser() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
 }

function downloadFile(fileName, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getDocumentTitle() {
  const [firstHeading] = extractHeadings(state.markdown);
  return firstHeading?.text || stripExtension(state.fileName) || 'Markdown Document';
}
