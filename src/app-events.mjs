import {
  buildExportHtml,
  renderMarkdown,
} from './markdown.mjs';
import { stripExtension } from './text-utils.mjs';

export function bindAppEvents({
  elements,
  state,
  diagrams,
  sampleMarkdown,
  draftKey,
  fileNameKey,
  themeKey,
  actions,
}) {
  elements.openButton.addEventListener('click', () => {
    if (!actions.confirmDiscardChanges()) return;
    if (window.markdownNative) {
      actions.openNativeFile();
      return;
    }
    elements.fileInput.click();
  });
  elements.openProjectButton.addEventListener('click', () => {
    if (actions.confirmDiscardChanges()) actions.openProject();
  });
  elements.recentButton.addEventListener('click', actions.openRecentPanel);
  elements.recentClose.addEventListener('click', actions.closeRecentPanel);
  elements.recentPanel.addEventListener('click', (event) => {
    if (event.target === elements.recentPanel) actions.closeRecentPanel();
  });
  elements.recentFiles.addEventListener('click', (event) => {
    const button = event.target.closest('[data-recent-file]');
    if (button) actions.openRecentFile(button.dataset.recentFile);
  });
  elements.recentProjects.addEventListener('click', (event) => {
    const button = event.target.closest('[data-recent-project]');
    if (button) actions.openRecentProject(button.dataset.recentProject);
  });
  elements.fileInput.addEventListener('change', (event) => {
    const [file] = event.target.files || [];
    if (file) actions.openFile(file);
    event.target.value = '';
  });
  elements.projectInput.addEventListener('change', (event) => {
    actions.openProjectFromFiles(event.target.files || [], actions.getProjectNameFromFiles(event.target.files) || '本地项目');
    event.target.value = '';
  });
  elements.newFileButton.addEventListener('click', actions.createProjectFile);
  elements.newFolderButton.addEventListener('click', actions.createProjectFolder);

  elements.editor.addEventListener('input', () => {
    state.markdown = elements.editor.value;
    actions.markDirty();
    actions.persistActiveProjectDraft();
    actions.persistDraft();
    actions.render();
    actions.runNativeFindInPage({ forward: true, findNext: false });
  });

  elements.sampleButton.addEventListener('click', () => {
    if (!actions.confirmDiscardChanges()) return;
    actions.clearProjectState();
    actions.setDocumentContent({
      fileName: '示例文档.md',
      markdown: sampleMarkdown,
      nativePath: '',
      dirty: false,
    });
    actions.render();
  });

  elements.saveButton.addEventListener('click', actions.saveCurrentDocument);
  elements.saveAsButton.addEventListener('click', actions.saveCurrentDocumentAs);

  elements.exportButton.addEventListener('click', () => {
    const rendered = renderMarkdown(state.markdown);
    const title = actions.getDocumentTitle();
    actions.downloadFile(`${stripExtension(title)}.html`, buildExportHtml(title, rendered), 'text/html');
  });

  elements.themeButton.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = state.theme;
    localStorage.setItem(themeKey, state.theme);
    actions.syncNativeTheme();
  });

  elements.searchInput.addEventListener('input', () => {
    state.query = elements.searchInput.value;
    state.searchMatchIndex = state.query.trim() ? 0 : -1;
    actions.render({ scrollToSearchMatch: true });
    actions.runNativeFindInPage({ forward: true, findNext: false });
  });
  elements.searchInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;

    event.preventDefault();
    actions.stepSearchMatch(event.shiftKey ? -1 : 1);
  });
  elements.replaceInput.addEventListener('input', () => {
    state.replaceText = elements.replaceInput.value;
  });
  elements.searchPrevButton.addEventListener('click', () => actions.stepSearchMatch(-1));
  elements.searchNextButton.addEventListener('click', () => actions.stepSearchMatch(1));
  elements.replaceButton.addEventListener('click', actions.replaceCurrentMatch);
  elements.replaceAllButton.addEventListener('click', actions.replaceAllMatches);
  elements.quickOpenInput.addEventListener('input', () => {
    state.quickOpenQuery = elements.quickOpenInput.value;
    actions.renderQuickOpenResults();
  });
  elements.quickOpenInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const [firstResult] = actions.getQuickOpenResults();
    if (!firstResult) return;
    event.preventDefault();
    actions.openQuickOpenResult(firstResult.id);
  });
  elements.projectSearchInput.addEventListener('input', () => {
    state.projectSearchQuery = elements.projectSearchInput.value;
    actions.renderProjectSearchResults();
  });

  elements.clearDraftButton.addEventListener('click', () => {
    if (!actions.confirmDiscardChanges()) return;
    localStorage.removeItem(draftKey);
    localStorage.removeItem(fileNameKey);
    actions.clearProjectState();
    actions.setDocumentContent({
      fileName: '未命名文档',
      markdown: '',
      nativePath: '',
      dirty: false,
    });
    actions.render();
  });

  elements.modeButtons.forEach((button) => {
    button.addEventListener('click', () => actions.setMode(button.dataset.mode));
  });
  elements.formatButtons.forEach((button) => {
    button.addEventListener('click', () => actions.insertMarkdownSnippet(button.dataset.formatAction));
  });
  elements.imageInput.addEventListener('change', (event) => {
    const [file] = event.target.files || [];
    if (file) actions.insertImageAssetFromFile(file);
    event.target.value = '';
  });
  elements.focusButton.addEventListener('click', () => actions.setFocusMode(!state.focusMode));

  elements.scanSettingsButton.addEventListener('click', actions.openScanSettingsDialog);
  elements.scanSettingsClose.addEventListener('click', actions.closeScanSettingsDialog);
  elements.scanSettingsApply.addEventListener('click', actions.rescanCurrentProject);
  elements.scanSettingsDialog.addEventListener('click', (event) => {
    if (event.target === elements.scanSettingsDialog) actions.closeScanSettingsDialog();
  });
  elements.scanExtensionList.addEventListener('change', actions.updateScanSettingsFromInputs);
  elements.generalRuleList.addEventListener('change', actions.updateScanSettingsFromInputs);
  elements.ignoreDirectoryList.addEventListener('change', actions.updateScanSettingsFromInputs);
  elements.scanExtensionList.addEventListener('click', actions.removeScanOption);
  elements.generalRuleList.addEventListener('click', actions.removeScanOption);
  elements.ignoreDirectoryList.addEventListener('click', actions.removeScanOption);
  elements.addScanExtensionButton.addEventListener('click', actions.addScanExtension);
  elements.addGeneralRuleButton.addEventListener('click', actions.addGeneralRule);
  elements.addIgnoreDirectoryButton.addEventListener('click', actions.addIgnoredDirectory);
  elements.scanExtensionInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') actions.addScanExtension();
  });
  elements.generalRuleInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') actions.addGeneralRule();
  });
  elements.ignoreDirectoryInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') actions.addIgnoredDirectory();
  });
  elements.preview.addEventListener('click', (event) => {
    const actionButton = event.target.closest('[data-diagram-action]');
    if (actionButton) {
      diagrams.handleDiagramAction(actionButton);
      return;
    }

    const link = event.target.closest('a');
    if (link && actions.openMarkdownLink(link)) {
      event.preventDefault();
      return;
    }

    const diagram = event.target.closest('.diagram-flowchart');
    if (diagram) diagrams.openDiagramViewer(diagram);
  });
  elements.preview.addEventListener('wheel', (event) => {
    const diagram = event.target.closest('.diagram-flowchart');
    if (diagram) diagrams.handleDiagramWheel(event, diagram, false);
  }, { passive: false });
  elements.previewPane.addEventListener('scroll', () => {
    actions.syncEditorScrollToPreview();
    actions.updateActiveOutlineFromScroll();
  }, { passive: true });
  elements.editor.addEventListener('scroll', actions.syncPreviewScrollToEditor, { passive: true });
  elements.editor.addEventListener('paste', (event) => {
    const image = [...(event.clipboardData?.files || [])].find((file) => file.type.startsWith('image/'));
    if (!image) return;
    event.preventDefault();
    actions.insertImageAssetFromFile(image);
  });
  window.markdownNative?.onFileOpened?.((file) => {
    actions.loadNativeMarkdownFile(file);
  });
  window.markdownNative?.onFoundInPage?.((result) => {
    state.nativeSearchResult = result;
  });
  actions.consumePendingNativeFile();
  elements.diagramViewer.addEventListener('click', (event) => {
    if (event.target === elements.diagramViewer) diagrams.closeDiagramViewer();
  });
  elements.diagramViewerClose.addEventListener('click', diagrams.closeDiagramViewer);
  elements.diagramZoomOut.addEventListener('click', () => diagrams.zoomDiagram(-0.15));
  elements.diagramZoomIn.addEventListener('click', () => diagrams.zoomDiagram(0.15));
  elements.diagramZoomReset.addEventListener('click', () => diagrams.setDiagramZoom(1));
  elements.diagramViewerCanvas.addEventListener('wheel', (event) => {
    if (!elements.diagramViewer.classList.contains('is-visible')) return;
    diagrams.handleDiagramWheel(event, elements.diagramViewerCanvas, true);
  }, { passive: false });
  window.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      if (event.shiftKey) {
        actions.saveCurrentDocumentAs();
      } else {
        actions.saveCurrentDocument();
      }
      return;
    }

    if (event.key === 'Escape') {
      diagrams.closeDiagramViewer();
      actions.closeScanSettingsDialog();
      actions.closeRecentPanel();
    }
  });
  window.addEventListener('beforeunload', (event) => {
    if (!state.dirty) return;
    event.preventDefault();
    event.returnValue = '';
  });
  window.addEventListener('resize', diagrams.fitDiagramsToContainers);

  window.addEventListener('dragenter', actions.showDropOverlay);
  window.addEventListener('dragover', (event) => {
    event.preventDefault();
    actions.showDropOverlay();
  });
  window.addEventListener('dragleave', (event) => {
    if (!event.relatedTarget) actions.hideDropOverlay();
  });
  window.addEventListener('drop', (event) => {
    event.preventDefault();
    actions.hideDropOverlay();
    const [file] = event.dataTransfer.files || [];
    if (!file) return;
    if (file.type.startsWith('image/')) {
      actions.insertImageAssetFromFile(file);
      return;
    }
    actions.openFile(file);
  });
}
