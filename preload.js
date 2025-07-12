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
  exitApp: () => ipcRenderer.invoke('app-exit'),
  
  // Configuration management
  config: {
    load: () => ipcRenderer.invoke('load-config'),
    save: (config) => ipcRenderer.invoke('save-config', config),
    getPath: () => ipcRenderer.invoke('get-config-path'),
    export: () => ipcRenderer.invoke('export-config'),
    import: () => ipcRenderer.invoke('import-config'),
    registerHotkeys: (hotkeys) => ipcRenderer.invoke('register-hotkeys', hotkeys)
  }
});