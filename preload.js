const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getDesktopSources: () => ipcRenderer.invoke('get-desktop-sources'),
  onTriggerOCR: (callback) => {
    ipcRenderer.on('trigger-ocr', callback);
    // Return cleanup function
    return () => ipcRenderer.removeListener('trigger-ocr', callback);
  },
  onShowSettings: (callback) => {
    ipcRenderer.on('show-settings', callback);
    // Return cleanup function
    return () => ipcRenderer.removeListener('show-settings', callback);
  },
  onShowAbout: (callback) => {
    ipcRenderer.on('show-about', callback);
    // Return cleanup function
    return () => ipcRenderer.removeListener('show-about', callback);
  },
  exitApp: () => ipcRenderer.invoke('app-exit')
});