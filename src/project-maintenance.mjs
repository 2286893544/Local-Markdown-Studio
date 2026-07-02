import { resolveDroppedImageReference } from './image-assets.mjs';
import {
  buildImageAssetInventory,
  buildProjectHealth,
} from './project-health.mjs';
import { replaceMarkdownImageHref } from './project-fixes.mjs';
import {
  buildProjectAssetsHtml,
  buildProjectHealthHtml,
} from './project-sidebar.mjs';

export function createProjectMaintenanceController({ elements, state, actions }) {
  function renderProjectHealth() {
    if (!state.projectSource) {
      elements.projectHealth.innerHTML = '';
      return;
    }

    const health = buildProjectHealth({
      entries: actions.getProjectKnowledgeEntries(),
      assets: state.projectAssets,
    });
    elements.projectHealth.innerHTML = buildProjectHealthHtml(health);

    elements.projectHealth.querySelectorAll('[data-health-file-id]').forEach((button) => {
      button.addEventListener('click', () => actions.openProjectEntry(button.dataset.healthFileId, { showLoading: false, preserveMode: true }));
    });
    elements.projectHealth.querySelector('[data-health-action="fix-absolute-images"]')?.addEventListener('click', fixAbsoluteImagePaths);
  }

  function renderProjectAssets() {
    if (!state.projectSource) {
      elements.projectAssets.innerHTML = '';
      return;
    }

    elements.projectAssets.innerHTML = buildProjectAssetsHtml(buildImageAssetInventory({
      entries: actions.getProjectKnowledgeEntries(),
      assets: state.projectAssets,
    }));

    elements.projectAssets.querySelectorAll('[data-asset-file-id]').forEach((button) => {
      button.addEventListener('click', () => actions.openProjectEntry(button.dataset.assetFileId, { showLoading: false, preserveMode: true }));
    });
  }

  async function fixAbsoluteImagePaths() {
    if (!state.projectSource) return;

    const health = buildProjectHealth({
      entries: actions.getProjectKnowledgeEntries(),
      assets: state.projectAssets,
    });
    const changes = buildAbsoluteImagePathChanges(health.absoluteImagePaths);

    if (!changes.size) {
      window.alert?.('没有可自动修复的绝对路径图片。请确认图片路径仍然存在，并在桌面应用中打开项目。');
      return;
    }

    actions.showGlobalLoading('正在修复图片路径', `准备更新 ${changes.size} 篇文档`, 12);
    try {
      let index = 0;
      for (const { entry, content } of changes.values()) {
        index += 1;
        actions.updateGlobalLoading(`正在更新 ${entry.path}`, Math.min(88, 12 + index * 18));
        await saveFixedEntry(entry, content);
      }
      actions.persistDraft();
      actions.render();
      actions.updateGlobalLoading('图片路径修复完成', 100);
      await actions.delay(180);
    } finally {
      actions.hideGlobalLoading();
    }
  }

  function buildAbsoluteImagePathChanges(issues) {
    const projectPath = state.projectSource?.type === 'native-directory' ? state.projectSource.path : '';
    const changes = new Map();

    issues.forEach((issue) => {
      const entry = state.projectFiles.find((file) => file.id === issue.fileId);
      const documentPath = entry?.absolutePath || (entry?.id === state.activeProjectFileId ? state.currentNativePath : '');
      const nextHref = resolveDroppedImageReference({ documentPath, projectPath, sourcePath: issue.href });
      if (!entry || !nextHref || nextHref === issue.href) return;

      const currentContent = changes.get(entry.id)?.content
        ?? (entry.id === state.activeProjectFileId ? state.markdown : String(entry.draft ?? entry.content ?? ''));
      const nextContent = replaceMarkdownImageHref(currentContent, issue.href, nextHref);
      if (nextContent !== currentContent) changes.set(entry.id, { entry, content: nextContent });
    });

    return changes;
  }

  async function saveFixedEntry(entry, content) {
    if (entry.absolutePath && window.markdownNative?.saveFile) {
      await window.markdownNative.saveFile(entry.absolutePath, content);
      entry.content = content;
      entry.draft = undefined;
    } else {
      entry.draft = content;
      if (entry.id !== state.activeProjectFileId) entry.content = content;
    }

    if (entry.id === state.activeProjectFileId) {
      state.markdown = content;
      elements.editor.value = content;
      state.dirty = !entry.absolutePath || !window.markdownNative?.saveFile;
    }
  }

  return {
    fixAbsoluteImagePaths,
    renderProjectAssets,
    renderProjectHealth,
  };
}
