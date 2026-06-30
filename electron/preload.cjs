const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('markdownNative', {
  openFile: () => ipcRenderer.invoke('native:open-file'),
  openProject: (options) => ipcRenderer.invoke('native:open-project', options),
  rescanProject: (directoryPath, options) => ipcRenderer.invoke('native:rescan-project', directoryPath, options),
  setTheme: (theme) => ipcRenderer.invoke('native:set-theme', theme),
});
