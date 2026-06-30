import {
  buildExportHtml,
  extractHeadings,
  getDocumentStats,
  highlightSearch,
  renderMarkdown,
} from './markdown.mjs';
import {
  collectMarkdownEntriesFromDirectoryHandle,
  getProjectLoadingPercent,
  normalizeProjectFiles,
} from './project.mjs';

const draftKey = 'local-markdown-studio:draft';
const fileNameKey = 'local-markdown-studio:file-name';
const themeKey = 'local-markdown-studio:theme';
const defaultScanExtensions = ['.md'];
const defaultIgnoredDirectories = ['node_modules'];
const defaultScanExtensionOptions = ['.md', '.markdown', '.txt'];
const defaultIgnoredDirectoryOptions = ['node_modules', 'dist', 'build', 'coverage', 'out'];
const defaultGeneralRuleOptions = ['.*'];

const sampleMarkdown = `# 我的 Markdown 工作台

这是一个本地优先的 Markdown 阅读与编辑器。你可以直接打开本地 \`.md\` 文件，也可以把文件拖进窗口。

## 常用能力

- [x] 打开 Markdown 文件
- [x] 分屏编辑与实时预览
- [x] 自动保存本地草稿
- [x] 目录导航与搜索高亮
- [ ] 继续写你的下一篇文档

## 写作片段

> 好的写作工具应该安静、稳定，并且把注意力留给内容本身。

| 功能 | 状态 |
| --- | --- |
| Markdown 渲染 | 可用 |
| HTML 导出 | 可用 |
| 深浅主题 | 可用 |

\`\`\`js
const note = 'Keep it local and focused.';
console.log(note);
\`\`\`
`;

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
  sampleButton: document.querySelector('#sampleButton'),
  downloadButton: document.querySelector('#downloadButton'),
  exportButton: document.querySelector('#exportButton'),
  themeButton: document.querySelector('#themeButton'),
  searchInput: document.querySelector('#searchInput'),
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
  projectFiles: document.querySelector('#projectFiles'),
  projectMeta: document.querySelector('#projectMeta'),
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
};

const state = {
  fileName: localStorage.getItem(fileNameKey) || '未命名文档',
  markdown: localStorage.getItem(draftKey) || sampleMarkdown,
  mode: 'split',
  theme: localStorage.getItem(themeKey) || 'light',
  query: '',
  projectName: '',
  projectFiles: [],
  activeProjectFileId: '',
  projectSource: null,
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

initialize();

function initialize() {
  elements.editor.value = state.markdown;
  elements.fileName.textContent = state.fileName;
  document.documentElement.dataset.theme = state.theme;
  syncNativeTheme();
  bindEvents();
  renderScanSettings();
  render();
}

function bindEvents() {
  elements.openButton.addEventListener('click', () => {
    if (window.markdownNative) {
      openNativeFile();
      return;
    }
    elements.fileInput.click();
  });
  elements.openProjectButton.addEventListener('click', openProject);
  elements.fileInput.addEventListener('change', (event) => {
    const [file] = event.target.files || [];
    if (file) openFile(file);
    event.target.value = '';
  });
  elements.projectInput.addEventListener('change', (event) => {
    openProjectFromFiles(event.target.files || [], getProjectNameFromFiles(event.target.files) || '本地项目');
    event.target.value = '';
  });

  elements.editor.addEventListener('input', () => {
    state.markdown = elements.editor.value;
    persistActiveProjectDraft();
    persistDraft();
    render();
  });

  elements.sampleButton.addEventListener('click', () => {
    clearProjectState();
    state.fileName = '示例文档.md';
    state.markdown = sampleMarkdown;
    elements.editor.value = state.markdown;
    persistDraft();
    render();
  });

  elements.downloadButton.addEventListener('click', () => {
    downloadFile(state.fileName.endsWith('.md') ? state.fileName : `${state.fileName}.md`, state.markdown, 'text/markdown');
  });

  elements.exportButton.addEventListener('click', () => {
    const rendered = renderMarkdown(state.markdown);
    const title = getDocumentTitle();
    downloadFile(`${stripExtension(title)}.html`, buildExportHtml(title, rendered), 'text/html');
  });

  elements.themeButton.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = state.theme;
    localStorage.setItem(themeKey, state.theme);
    syncNativeTheme();
  });

  elements.searchInput.addEventListener('input', () => {
    state.query = elements.searchInput.value;
    render({ scrollToSearchMatch: true });
  });

  elements.clearDraftButton.addEventListener('click', () => {
    localStorage.removeItem(draftKey);
    localStorage.removeItem(fileNameKey);
    clearProjectState();
    state.fileName = '未命名文档';
    state.markdown = '';
    elements.editor.value = '';
    render();
  });

  elements.modeButtons.forEach((button) => {
    button.addEventListener('click', () => setMode(button.dataset.mode));
  });

  elements.scanSettingsButton.addEventListener('click', openScanSettingsDialog);
  elements.scanSettingsClose.addEventListener('click', closeScanSettingsDialog);
  elements.scanSettingsApply.addEventListener('click', rescanCurrentProject);
  elements.scanSettingsDialog.addEventListener('click', (event) => {
    if (event.target === elements.scanSettingsDialog) closeScanSettingsDialog();
  });
  elements.scanExtensionList.addEventListener('change', updateScanSettingsFromInputs);
  elements.generalRuleList.addEventListener('change', updateScanSettingsFromInputs);
  elements.ignoreDirectoryList.addEventListener('change', updateScanSettingsFromInputs);
  elements.scanExtensionList.addEventListener('click', removeScanOption);
  elements.generalRuleList.addEventListener('click', removeScanOption);
  elements.ignoreDirectoryList.addEventListener('click', removeScanOption);
  elements.addScanExtensionButton.addEventListener('click', addScanExtension);
  elements.addGeneralRuleButton.addEventListener('click', addGeneralRule);
  elements.addIgnoreDirectoryButton.addEventListener('click', addIgnoredDirectory);
  elements.scanExtensionInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') addScanExtension();
  });
  elements.generalRuleInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') addGeneralRule();
  });
  elements.ignoreDirectoryInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') addIgnoredDirectory();
  });
  elements.preview.addEventListener('click', (event) => {
    const actionButton = event.target.closest('[data-diagram-action]');
    if (actionButton) {
      handleDiagramAction(actionButton);
      return;
    }

    const diagram = event.target.closest('.diagram-flowchart');
    if (diagram) openDiagramViewer(diagram);
  });
  elements.preview.addEventListener('wheel', (event) => {
    const diagram = event.target.closest('.diagram-flowchart');
    if (diagram) handleDiagramWheel(event, diagram, false);
  }, { passive: false });
  elements.previewPane.addEventListener('scroll', syncEditorScrollToPreview, { passive: true });
  elements.editor.addEventListener('scroll', syncPreviewScrollToEditor, { passive: true });
  elements.diagramViewer.addEventListener('click', (event) => {
    if (event.target === elements.diagramViewer) closeDiagramViewer();
  });
  elements.diagramViewerClose.addEventListener('click', closeDiagramViewer);
  elements.diagramZoomOut.addEventListener('click', () => zoomDiagram(-0.15));
  elements.diagramZoomIn.addEventListener('click', () => zoomDiagram(0.15));
  elements.diagramZoomReset.addEventListener('click', () => setDiagramZoom(1));
  elements.diagramViewerCanvas.addEventListener('wheel', (event) => {
    if (!elements.diagramViewer.classList.contains('is-visible')) return;
    handleDiagramWheel(event, elements.diagramViewerCanvas, true);
  }, { passive: false });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeDiagramViewer();
      closeScanSettingsDialog();
    }
  });
  window.addEventListener('resize', fitDiagramsToContainers);

  window.addEventListener('dragenter', showDropOverlay);
  window.addEventListener('dragover', (event) => {
    event.preventDefault();
    showDropOverlay();
  });
  window.addEventListener('dragleave', (event) => {
    if (!event.relatedTarget) hideDropOverlay();
  });
  window.addEventListener('drop', (event) => {
    event.preventDefault();
    hideDropOverlay();
    const [file] = event.dataTransfer.files || [];
    if (file) openFile(file);
  });
}

function render({ scrollToSearchMatch = false } = {}) {
  const rendered = renderMarkdown(state.markdown);
  elements.preview.innerHTML = highlightSearch(rendered, state.query);
  fitDiagramsToContainers();
  renderProjectFiles();
  renderOutline();
  renderStats();
  elements.fileName.textContent = state.fileName;
  if (scrollToSearchMatch) scrollToSearchMatchElement();
}

function scrollToSearchMatchElement() {
  if (!state.query.trim()) return;

  requestAnimationFrame(() => {
    const match = elements.preview.querySelector('mark');
    if (!match) return;

    match.scrollIntoView({ behavior: 'smooth', block: 'center' });
    syncEditorScrollToPreview();
  });
}

function renderProjectFiles() {
  const hasProject = Boolean(state.projectSource);
  elements.projectPanel.classList.toggle('is-hidden', !hasProject);
  elements.outlinePane.classList.toggle('without-project', !hasProject);

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
  elements.projectFiles.innerHTML = state.projectFiles
    .map((entry) => {
      const activeClass = entry.id === state.activeProjectFileId ? ' is-active' : '';
      return `<button class="project-file${activeClass}" type="button" data-file-id="${escapeHtml(entry.id)}">
        <span class="project-file-name">${escapeHtml(entry.name)}</span>
        <span class="project-file-path">${escapeHtml(entry.path)}</span>
      </button>`;
    })
    .join('');

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

  const entries = buildOutlineEntries(headings);
  elements.outline.innerHTML = entries
    .map((entry) => {
      const hiddenClass = entry.hidden ? ' is-hidden' : '';
      const collapsedClass = entry.collapsed ? ' is-collapsed' : '';
      const toggle = entry.hasChildren
        ? `<button class="outline-toggle" type="button" data-outline-toggle="${escapeHtml(entry.outlineId)}" aria-label="${entry.collapsed ? '展开' : '收起'} ${escapeHtml(entry.text)}" aria-expanded="${entry.collapsed ? 'false' : 'true'}"></button>`
        : '<span class="outline-toggle-placeholder"></span>';

      return `<div class="outline-entry level-${entry.level}${hiddenClass}${collapsedClass}" data-outline-id="${escapeHtml(entry.outlineId)}" data-target="${escapeHtml(entry.id)}" data-heading-index="${entry.headingIndex}" data-line-index="${entry.lineIndex}">
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

function buildOutlineEntries(headings) {
  const baseLevel = Math.min(...headings.map((heading) => heading.level));
  const stack = [];

  return headings.map((heading, index) => {
    while (stack.length && stack[stack.length - 1].level >= heading.level) {
      stack.pop();
    }

    const outlineId = `${heading.id}-${index}`;
    const hasChildren = hasOutlineChildren(headings, index);
    const defaultCollapsed = heading.level > baseLevel && hasChildren;
    const collapsed = isOutlineEntryCollapsed({ outlineId, hasChildren, defaultCollapsed });
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

function isOutlineEntryCollapsed(entry) {
  if (!entry.hasChildren) return false;
  if (state.collapsedOutlineIds.has(entry.outlineId)) return true;
  if (state.expandedOutlineIds.has(entry.outlineId)) return false;
  return entry.defaultCollapsed;
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
    state.fileName = file.name;
    state.markdown = String(reader.result || '');
    elements.editor.value = state.markdown;
    persistDraft();
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
      updateGlobalLoading(`已找到 ${files.length} 篇 Markdown，正在建立索引`, 72);
      await yieldToBrowser();
      await openProjectEntries(files, directoryHandle.name, { showLoading: false });
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

  clearProjectState();
  state.fileName = file.name || stripNativePath(file.path) || '未命名文档';
  state.markdown = String(file.content || '');
  elements.editor.value = state.markdown;
  persistDraft();
  setMode('split');
  render();
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
    await openProjectEntries(project.entries || [], project.name || stripNativePath(project.path) || '本地项目', { showLoading: false });
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
    updateGlobalLoading(`找到 ${entries.length} 篇 Markdown，正在建立项目列表`, getProjectLoadingPercent(entries.length, fileList.length, 20, 70));
    await yieldToBrowser();
    await openProjectEntries(entries, projectName, { showLoading: false });
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
  state.projectName = projectName;
  state.projectFiles = entries;
  state.activeProjectFileId = '';

  if (!entries.length) {
    state.fileName = `${projectName} · 未找到 Markdown`;
    state.markdown = '# 未找到 Markdown 文档\n\n这个文件夹里没有 `.md`、`.markdown` 或 `.txt` 文件。';
    elements.editor.value = state.markdown;
    persistDraft();
    render();
    hideGlobalLoading();
    return;
  }

  updateGlobalLoading(`正在打开 ${entries[0].path}`, 88);
  await yieldToBrowser();
  await openProjectEntry(entries[0].id, { showLoading: false });
  if (options.showLoading !== false) {
    updateGlobalLoading('项目加载完成', 100);
    await delay(180);
    hideGlobalLoading();
  }
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
  state.fileName = entry.path;
  state.markdown = text;
  elements.editor.value = state.markdown;
  persistDraft();
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
  state.activeProjectFileId = '';
  state.projectSource = null;
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

function openDiagramViewer(diagram) {
  const source = diagram.querySelector('.diagram-stage') || diagram.querySelector('svg');
  if (!source) return;

  elements.diagramViewerCanvas.innerHTML = '';
  elements.diagramViewerCanvas.append(source.cloneNode(true));
  setDiagramZoom(1);
  elements.diagramViewer.classList.add('is-visible');
  elements.diagramViewer.setAttribute('aria-hidden', 'false');
  elements.diagramViewerClose.focus();
}

function closeDiagramViewer() {
  if (!elements.diagramViewer.classList.contains('is-visible')) return;

  elements.diagramViewer.classList.remove('is-visible');
  elements.diagramViewer.setAttribute('aria-hidden', 'true');
  elements.diagramViewerCanvas.innerHTML = '';
  setDiagramZoom(1);
}

function zoomDiagram(delta) {
  setDiagramZoom(state.diagramZoom + delta);
}

function setDiagramZoom(value) {
  state.diagramZoom = Math.min(Math.max(Number(value) || 1, 0.45), 3);
  const percent = Math.round(state.diagramZoom * 100);

  applyDiagramZoom(elements.diagramViewerCanvas, state.diagramZoom);
  centerDiagramScroll(elements.diagramViewerCanvas);
  elements.diagramZoomLevel.textContent = `${percent}%`;
}

function handleDiagramAction(button) {
  const diagram = button.closest('.diagram-flowchart');
  if (!diagram) return;

  const action = button.dataset.diagramAction;
  if (action === 'open') {
    openDiagramViewer(diagram);
    return;
  }

  if (action === 'zoom-in') zoomInlineDiagram(diagram, 0.15);
  if (action === 'zoom-out') zoomInlineDiagram(diagram, -0.15);
  if (action === 'zoom-reset') setInlineDiagramZoom(diagram, 1);
}

function zoomInlineDiagram(diagram, delta) {
  setInlineDiagramZoom(diagram, Number(diagram.dataset.zoom || 1) + delta);
}

function handleDiagramWheel(event, container, isViewer) {
  if (!(event.ctrlKey || event.metaKey)) return;

  event.preventDefault();
  const currentZoom = isViewer ? state.diagramZoom : Number(container.dataset.zoom || 1);
  const nextZoom = currentZoom * Math.exp(-event.deltaY * 0.002);

  cancelAnimationFrame(state.pendingDiagramZoomFrame);
  state.pendingDiagramZoomFrame = requestAnimationFrame(() => {
    if (isViewer) {
      setDiagramZoom(nextZoom);
      return;
    }
    setInlineDiagramZoom(container, nextZoom);
  });
}

function setInlineDiagramZoom(diagram, value) {
  const zoom = Math.min(Math.max(Number(value) || 1, 0.35), 2.5);
  const percent = Math.round(zoom * 100);
  const label = diagram.querySelector('[data-diagram-zoom]');

  diagram.dataset.zoom = String(zoom);
  applyDiagramZoom(diagram, zoom);
  centerDiagramScroll(diagram);
  if (label) label.textContent = `${percent}%`;
}

function applyDiagramZoom(container, zoom) {
  const stage = container.querySelector('.diagram-stage');
  const svg = container.querySelector('svg');
  if (!stage || !svg) return;

  const baseWidth = Number(stage.dataset.baseWidth) || Number(svg.getAttribute('width')) || 960;
  const baseHeight = Number(stage.dataset.baseHeight) || Number(svg.getAttribute('height')) || 560;
  stage.style.setProperty('--diagram-zoom', String(zoom));
  stage.style.width = `${Math.ceil(baseWidth * zoom)}px`;
  stage.style.height = `${Math.ceil(baseHeight * zoom)}px`;
}

function fitDiagramsToContainers() {
  requestAnimationFrame(() => {
    elements.preview.querySelectorAll('.diagram-flowchart').forEach(fitDiagramToContainer);
  });
}

function fitDiagramToContainer(diagram) {
  const stage = diagram.querySelector('.diagram-stage');
  if (!stage) return;

  const baseWidth = Number(stage.dataset.baseWidth) || 0;
  if (!baseWidth) return;

  const styles = getComputedStyle(diagram);
  const horizontalPadding = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
  const availableWidth = Math.max(1, diagram.clientWidth - horizontalPadding);
  const zoom = Math.min(1, Math.max(0.35, availableWidth / baseWidth));
  setInlineDiagramZoom(diagram, zoom);
}

function centerDiagramScroll(container) {
  const extraWidth = container.scrollWidth - container.clientWidth;
  if (extraWidth > 0) {
    container.scrollLeft = extraWidth / 2;
  }
}

function renderScanSettings() {
  elements.scanExtensionList.innerHTML = state.scan.extensionOptions
    .map((extension) => renderScanOption('extension', extension, state.scan.markdownExtensions.includes(extension)))
    .join('');
  elements.generalRuleList.innerHTML = state.scan.generalRuleOptions
    .map((pattern) => renderScanOption('rule', pattern, state.scan.ignoredDirectoryPatterns.includes(pattern)))
    .join('');
  elements.ignoreDirectoryList.innerHTML = state.scan.ignoredDirectoryOptions
    .map((directory) => renderScanOption('directory', directory, state.scan.ignoredDirectoryNames.includes(directory)))
    .join('');
  renderScanSummary();
}

function updateScanSettingsFromInputs() {
  state.scan.markdownExtensions = [...elements.scanExtensionList.querySelectorAll('[data-scan-extension]')]
    .filter((input) => input.checked)
    .map((input) => input.dataset.scanExtension);
  state.scan.ignoredDirectoryPatterns = [...elements.generalRuleList.querySelectorAll('[data-general-rule]')]
    .filter((input) => input.checked)
    .map((input) => input.dataset.generalRule);
  state.scan.ignoredDirectoryNames = [...elements.ignoreDirectoryList.querySelectorAll('[data-ignore-dir]')]
    .filter((input) => input.checked)
    .map((input) => input.dataset.ignoreDir);
  state.scan.ignoreDotDirectories = state.scan.ignoredDirectoryPatterns.includes('.*');
  renderScanSummary();
}

function renderScanOption(type, value, checked) {
  const dataName = {
    extension: 'data-scan-extension',
    rule: 'data-general-rule',
    directory: 'data-ignore-dir',
  }[type];
  const label = escapeHtml(value);
  const text = type === 'rule' ? escapeHtml(formatGeneralRuleLabel(value)) : label;
  return `
    <div class="scan-option-row">
      <label>
        <input type="checkbox" ${dataName}="${label}" ${checked ? 'checked' : ''}>
        <span>${text}</span>
      </label>
      <button class="scan-remove-button" type="button" data-scan-remove="${type}" data-value="${label}" aria-label="删除 ${label}">×</button>
    </div>
  `;
}

function openScanSettingsDialog() {
  renderScanSettings();
  elements.scanSettingsDialog.classList.add('is-visible');
  elements.scanSettingsDialog.setAttribute('aria-hidden', 'false');
  elements.scanExtensionInput.focus();
}

function closeScanSettingsDialog() {
  elements.scanSettingsDialog.classList.remove('is-visible');
  elements.scanSettingsDialog.setAttribute('aria-hidden', 'true');
}

function addScanExtension() {
  const extension = normalizeScanExtension(elements.scanExtensionInput.value);
  if (!extension) return;
  if (!state.scan.extensionOptions.includes(extension)) {
    state.scan.extensionOptions.push(extension);
  }
  if (!state.scan.markdownExtensions.includes(extension)) {
    state.scan.markdownExtensions.push(extension);
  }
  elements.scanExtensionInput.value = '';
  renderScanSettings();
}

function addGeneralRule() {
  const pattern = normalizeGeneralRulePattern(elements.generalRuleInput.value);
  if (!pattern) return;
  if (!state.scan.generalRuleOptions.includes(pattern)) {
    state.scan.generalRuleOptions.push(pattern);
  }
  if (!state.scan.ignoredDirectoryPatterns.includes(pattern)) {
    state.scan.ignoredDirectoryPatterns.push(pattern);
  }
  state.scan.ignoreDotDirectories = state.scan.ignoredDirectoryPatterns.includes('.*');
  elements.generalRuleInput.value = '';
  renderScanSettings();
}

function addIgnoredDirectory() {
  const directory = normalizeDirectoryName(elements.ignoreDirectoryInput.value);
  if (!directory) return;
  if (!state.scan.ignoredDirectoryOptions.includes(directory)) {
    state.scan.ignoredDirectoryOptions.push(directory);
  }
  if (!state.scan.ignoredDirectoryNames.includes(directory)) {
    state.scan.ignoredDirectoryNames.push(directory);
  }
  elements.ignoreDirectoryInput.value = '';
  renderScanSettings();
}

function removeScanOption(event) {
  const button = event.target.closest('[data-scan-remove]');
  if (!button) return;

  const value = button.dataset.value;
  if (button.dataset.scanRemove === 'extension') {
    state.scan.extensionOptions = state.scan.extensionOptions.filter((extension) => extension !== value);
    state.scan.markdownExtensions = state.scan.markdownExtensions.filter((extension) => extension !== value);
  } else if (button.dataset.scanRemove === 'rule') {
    state.scan.generalRuleOptions = state.scan.generalRuleOptions.filter((pattern) => pattern !== value);
    state.scan.ignoredDirectoryPatterns = state.scan.ignoredDirectoryPatterns.filter((pattern) => pattern !== value);
    state.scan.ignoreDotDirectories = state.scan.ignoredDirectoryPatterns.includes('.*');
  } else {
    state.scan.ignoredDirectoryOptions = state.scan.ignoredDirectoryOptions.filter((directory) => directory !== value);
    state.scan.ignoredDirectoryNames = state.scan.ignoredDirectoryNames.filter((directory) => directory !== value);
  }
  renderScanSettings();
}

function normalizeScanExtension(value) {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return '';
  const withoutWildcard = trimmed.replace(/^\*+/, '');
  return withoutWildcard.startsWith('.') ? withoutWildcard : `.${withoutWildcard}`;
}

function normalizeGeneralRulePattern(value) {
  return value.trim().replace(/^\/+|\/+$/g, '').toLowerCase();
}

function normalizeDirectoryName(value) {
  return value.trim().replace(/^\/+|\/+$/g, '');
}

function formatGeneralRuleLabel(pattern) {
  if (pattern === '.*') return '不扫描 .xxxx 目录';
  return `不扫描 ${pattern} 目录`;
}

function renderScanSummary() {
  const scanTypes = state.scan.markdownExtensions.length ? state.scan.markdownExtensions.join(' / ') : '未选择文件类型';
  const ignored = state.scan.ignoredDirectoryNames.length ? state.scan.ignoredDirectoryNames.join('、') : '不跳过目录';
  const rules = state.scan.ignoredDirectoryPatterns.length
    ? state.scan.ignoredDirectoryPatterns.map(formatGeneralRuleLabel).join('、')
    : '无通用规则';
  elements.scanSummary.textContent = `将扫描 ${scanTypes}；${rules}；跳过 ${ignored}`;
}

async function rescanCurrentProject() {
  updateScanSettingsFromInputs();
  closeScanSettingsDialog();

  if (!state.projectSource) {
    renderScanSummary();
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
    updateGlobalLoading(`已找到 ${files.length} 篇 Markdown，正在更新列表`, 82);
    await yieldToBrowser();
    await openProjectEntries(files, name, { showLoading: false });
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
    await openProjectEntries(project.entries || [], project.name || name || '本地项目', { showLoading: false });
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

function stripExtension(value) {
  return String(value || 'Markdown Document').replace(/\.[^.]+$/, '') || 'Markdown Document';
}

function stripNativePath(value = '') {
  return String(value).split(/[\\/]/).filter(Boolean).pop() || '';
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
