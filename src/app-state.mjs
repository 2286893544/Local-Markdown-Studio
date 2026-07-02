const supportedMarkdownFilePattern = /\.(md|markdown)$/i;

export function createInitialDocumentState(storage, { draftKey, fileNameKey, sampleMarkdown }) {
  const storedMarkdown = storage.getItem(draftKey);
  const storedFileName = storage.getItem(fileNameKey) || '未命名文档';
  if (!storedMarkdown) return { fileName: storedFileName, markdown: sampleMarkdown };

  if (isStaleUnsupportedDraft(storedFileName)) {
    storage.removeItem(draftKey);
    storage.removeItem(fileNameKey);
    return { fileName: '未命名文档', markdown: sampleMarkdown };
  }

  return { fileName: storedFileName, markdown: storedMarkdown };
}

function isStaleUnsupportedDraft(fileName) {
  const value = String(fileName || '');
  return value !== '未命名文档' && /\.[^.]+$/.test(value) && !supportedMarkdownFilePattern.test(value);
}
