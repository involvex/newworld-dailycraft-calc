const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getDesktopSources: () => ipcRenderer.invoke('get-desktop-sources'),
  onTriggerOCR: (callback) => ipcRenderer.on('trigger-ocr', callback),
  onShowSettings: (callback) => ipcRenderer.on('show-settings', callback),
  onShowAbout: (callback) => ipcRenderer.on('show-about', callback)
});