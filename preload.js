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
  },
  
  // Auto-updater functionality
  updater: {
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    downloadUpdate: () => ipcRenderer.invoke('download-update'),
    installUpdate: () => ipcRenderer.invoke('install-update'),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    
    // Event listeners for updater events
    onChecking: (callback) => {
      ipcRenderer.on('updater-checking', callback);
      return () => ipcRenderer.removeListener('updater-checking', callback);
    },
    onUpdateAvailable: (callback) => {
      ipcRenderer.on('updater-update-available', callback);
      return () => ipcRenderer.removeListener('updater-update-available', callback);
    },
    onNoUpdate: (callback) => {
      ipcRenderer.on('updater-no-update', callback);
      return () => ipcRenderer.removeListener('updater-no-update', callback);
    },
    onError: (callback) => {
      ipcRenderer.on('updater-error', callback);
      return () => ipcRenderer.removeListener('updater-error', callback);
    },
    onDownloadProgress: (callback) => {
      ipcRenderer.on('updater-download-progress', callback);
      return () => ipcRenderer.removeListener('updater-download-progress', callback);
    },
    onUpdateDownloaded: (callback) => {
      ipcRenderer.on('updater-update-downloaded', callback);
      return () => ipcRenderer.removeListener('updater-update-downloaded', callback);
    }
  }
});