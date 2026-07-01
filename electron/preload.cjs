const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('markdownNative', {
  openFile: () => ipcRenderer.invoke('native:open-file'),
  openRecentFile: (filePath) => ipcRenderer.invoke('native:open-recent-file', filePath),
  consumePendingFile: () => ipcRenderer.invoke('native:consume-pending-file'),
  onFileOpened: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const listener = (_event, file) => callback(file);
    ipcRenderer.on('native:file-opened', listener);
    return () => ipcRenderer.removeListener('native:file-opened', listener);
  },
  openProject: (options) => ipcRenderer.invoke('native:open-project', options),
  openRecentProject: (directoryPath, options) => ipcRenderer.invoke('native:open-recent-project', directoryPath, options),
  rescanProject: (directoryPath, options) => ipcRenderer.invoke('native:rescan-project', directoryPath, options),
  saveFile: (filePath, content) => ipcRenderer.invoke('native:save-file', filePath, content),
  saveFileAs: (suggestedName, content) => ipcRenderer.invoke('native:save-file-as', suggestedName, content),
  saveImageAsset: (payload) => ipcRenderer.invoke('native:save-image-asset', payload),
  createProjectFile: (directoryPath, relativePath, content, options) => ipcRenderer.invoke('native:create-project-file', directoryPath, relativePath, content, options),
  createProjectFolder: (directoryPath, relativePath, options) => ipcRenderer.invoke('native:create-project-folder', directoryPath, relativePath, options),
  setTheme: (theme) => ipcRenderer.invoke('native:set-theme', theme),
  findInPage: (query, options) => ipcRenderer.invoke('native:find-in-page', query, options),
  stopFindInPage: () => ipcRenderer.invoke('native:stop-find-in-page'),
  onFoundInPage: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const listener = (_event, result) => callback(result);
    ipcRenderer.on('native:found-in-page', listener);
    return () => ipcRenderer.removeListener('native:found-in-page', listener);
  },
});
