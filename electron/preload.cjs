const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('markdownNative', {
  openFile: () => ipcRenderer.invoke('native:open-file'),
  consumePendingFile: () => ipcRenderer.invoke('native:consume-pending-file'),
  onFileOpened: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const listener = (_event, file) => callback(file);
    ipcRenderer.on('native:file-opened', listener);
    return () => ipcRenderer.removeListener('native:file-opened', listener);
  },
  openProject: (options) => ipcRenderer.invoke('native:open-project', options),
  rescanProject: (directoryPath, options) => ipcRenderer.invoke('native:rescan-project', directoryPath, options),
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
