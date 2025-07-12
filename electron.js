const { app, BrowserWindow, Tray, Menu, session, desktopCapturer, ipcMain, globalShortcut, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const ConfigService = require('./services/configService');

let tray = null;
let mainWindow = null;
let configService = null;
let isDev = false; // Will be set when app is ready

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'logo.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true, // Enable for production builds
      experimentalFeatures: false, // Disable for security
      sandbox: true, // Enable sandbox for security
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'New World Crafting Calculator',
    show: false,
    autoHideMenuBar: true
  });
  
  // Additional security: Prevent new window creation
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    console.log('Blocked attempt to open external URL:', url);
    return { action: 'deny' };
  });
  
  // Disable navigation to external URLs for security
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'http://localhost:3000' && !navigationUrl.startsWith('file://')) {
      event.preventDefault();
    }
  });
  
  // Set custom menu
  const customMenu = Menu.buildFromTemplate([
    {
      label: 'App',
      submenu: [
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => mainWindow.webContents.send('show-settings')
        },
        { type: 'separator' },
        {
          label: 'About',
          click: () => mainWindow.webContents.send('show-about')
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.isQuiting = true;
            app.quit();
          }
        }
      ]
    }
  ]);
  
  Menu.setApplicationMenu(customMenu);

  // Load from dev server in development, build files in production
  if (isDev) {
    console.log('Loading development server at http://localhost:3000');
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    mainWindow.loadFile(indexPath);
  }
  
  // Add error handling
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', validatedURL, 'Error:', errorDescription);
  });
  
  mainWindow.webContents.on('did-finish-load', () => {
    if (isDev) console.log('Page loaded successfully');
    mainWindow.show();
  });
  
  // Add console message listener (dev only)
  if (isDev) {
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
      console.log(`Console [${level}]: ${message}`);
    });
    
    // Add DOM ready listener (dev only)
    mainWindow.webContents.on('dom-ready', () => {
      console.log('DOM is ready');
    });
  }

  // Hide to tray instead of closing (if tray exists)
  mainWindow.on('close', (event) => {
    if (!app.isQuiting && tray) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  // Create a simple tray icon
  const trayIconPath = path.join(__dirname, 'logo.png');
  
  try {
    tray = new Tray(trayIconPath);
  } catch (error) {
    console.error('Failed to create tray:', error);
    return;
  }
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Calculator',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    {
      label: 'Hide Calculator',
      click: () => {
        mainWindow.hide();
      }
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('show-settings');
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  if (tray) {
    tray.setToolTip('New World Crafting Calculator');
    tray.setContextMenu(contextMenu);
    
    // Double click to show/hide
    tray.on('double-click', () => {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  }
}

app.whenReady().then(() => {
  // Set development mode detection
  isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev') || !app.isPackaged;
  
  if (isDev) {
    console.log('Electron app is ready (Development Mode)');
  }
  
  // Initialize config service with error handling
  try {
    configService = new ConfigService();
    if (isDev) console.log('ConfigService initialized successfully');
  } catch (error) {
    console.error('Failed to initialize ConfigService:', error);
    // Continue without config service for now
  }
  
  // Enhanced security: Set secure session defaults
  session.defaultSession.webSecurity = false; // Disabled for local files
  
  // Initialize auto-updater
  initializeAutoUpdater();
  
  // Set Content Security Policy (more permissive for local files)
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: file: https://cdn.tailwindcss.com https://fonts.googleapis.com https://fonts.gstatic.com https://esm.sh https://unpkg.com; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' data: file: https://cdn.tailwindcss.com https://esm.sh https://unpkg.com; " +
          "style-src 'self' 'unsafe-inline' data: file: https://cdn.tailwindcss.com https://fonts.googleapis.com; " +
          "font-src 'self' data: file: https://fonts.gstatic.com; " +
          "img-src 'self' data: blob: file:; " +
          "connect-src 'self' blob: file:;"
        ]
      }
    });
  });
  
  // Handle screen capture permissions securely
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    // Only allow desktop capture for OCR functionality
    if (permission === 'media') {
      callback(true);
    } else {
      console.log('Permission request denied:', permission);
      callback(false);
    }
  });
  
  // Handle desktop capture
  ipcMain.handle('get-desktop-sources', async () => {
    const sources = await desktopCapturer.getSources({ 
      types: ['screen'], 
      fetchWindowIcons: false 
    });
    console.log('Desktop sources found:', sources.length);
    return sources;
  });
  
  // Handle app exit
  ipcMain.handle('app-exit', () => {
    app.isQuiting = true;
    app.quit();
  });

  // Config management handlers
  ipcMain.handle('load-config', () => {
    try {
      return configService ? configService.loadConfig() : {};
    } catch (error) {
      console.error('Error loading config:', error);
      return {};
    }
  });

  ipcMain.handle('save-config', (event, config) => {
    try {
      return configService ? configService.saveConfig(config) : false;
    } catch (error) {
      console.error('Error saving config:', error);
      return false;
    }
  });

  ipcMain.handle('get-config-path', () => {
    try {
      return configService ? configService.getConfigPath() : '';
    } catch (error) {
      console.error('Error getting config path:', error);
      return '';
    }
  });

  ipcMain.handle('export-config', async () => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Configuration',
      defaultPath: 'new-world-crafting-config.json',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePath) {
      return configService.exportConfig(result.filePath);
    }
    return false;
  });

  ipcMain.handle('import-config', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Configuration',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return configService.importConfig(result.filePaths[0]);
    }
    return false;
  });

  // Hotkey management
  ipcMain.handle('register-hotkeys', (event, hotkeys) => {
    return registerHotkeys(hotkeys);
  });
  
  // Load initial config and register hotkeys
  try {
    const config = configService ? configService.loadConfig() : { hotkeys: {} };
    registerHotkeys(config.hotkeys);
    if (isDev) console.log('Config loaded and hotkeys registered');
  } catch (error) {
    console.error('Failed to load config:', error);
    registerHotkeys({});
  }
  
  if (isDev) console.log('Creating window and tray...');
  createWindow();
  createTray();
  if (isDev) console.log('Window and tray created');
}).catch(error => {
  console.error('Failed to start Electron app:', error);
});

// Auto-updater configuration and initialization
function initializeAutoUpdater() {
  if (isDev) {
    console.log('Auto-updater disabled in development mode');
    return;
  }

  // Configure auto-updater
  autoUpdater.autoDownload = false; // Don't auto-download, ask user first
  autoUpdater.autoInstallOnAppQuit = false; // Don't auto-install, ask user first
  
  // Set update server (GitHub releases)
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'involvex',
    repo: 'newworld-dailycraft-calc',
    private: false
  });

  // Auto-updater event handlers
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...');
    if (mainWindow) {
      mainWindow.webContents.send('updater-checking');
    }
  });

  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version);
    if (mainWindow) {
      mainWindow.webContents.send('updater-update-available', {
        version: info.version,
        releaseNotes: info.releaseNotes,
        releaseDate: info.releaseDate,
        downloadUrl: `https://github.com/involvex/newworld-dailycraft-calc/releases/tag/v${info.version}`
      });
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('No updates available');
    if (mainWindow) {
      mainWindow.webContents.send('updater-no-update');
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err);
    if (mainWindow) {
      mainWindow.webContents.send('updater-error', err.message);
    }
  });

  autoUpdater.on('download-progress', (progress) => {
    console.log(`Download progress: ${Math.round(progress.percent)}%`);
    if (mainWindow) {
      mainWindow.webContents.send('updater-download-progress', {
        percent: Math.round(progress.percent),
        transferred: progress.transferred,
        total: progress.total,
        bytesPerSecond: progress.bytesPerSecond
      });
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info.version);
    if (mainWindow) {
      mainWindow.webContents.send('updater-update-downloaded', {
        version: info.version
      });
    }
  });

  // Check for updates on startup (after a delay)
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify().catch(err => {
      console.error('Error checking for updates:', err);
    });
  }, 5000); // Wait 5 seconds after startup

  // Set up periodic update checks (every 4 hours)
  setInterval(() => {
    autoUpdater.checkForUpdates().catch(err => {
      console.error('Error in periodic update check:', err);
    });
  }, 4 * 60 * 60 * 1000); // 4 hours
}

// Auto-updater IPC handlers
ipcMain.handle('check-for-updates', async () => {
  if (isDev) {
    return { message: 'Updates disabled in development mode' };
  }
  
  try {
    const result = await autoUpdater.checkForUpdates();
    return { success: true, updateInfo: result.updateInfo };
  } catch (error) {
    console.error('Error checking for updates:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('download-update', async () => {
  if (isDev) {
    return { message: 'Updates disabled in development mode' };
  }
  
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    console.error('Error downloading update:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('install-update', () => {
  if (isDev) {
    return { message: 'Updates disabled in development mode' };
  }
  
  // This will restart the app and install the update
  autoUpdater.quitAndInstall();
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

function registerHotkeys(hotkeys) {
  try {
    // Unregister all existing hotkeys
    globalShortcut.unregisterAll();
    
    // Register new hotkeys
    if (hotkeys.toggleCalculator) {
      globalShortcut.register(hotkeys.toggleCalculator, () => {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      });
    }
    
    if (hotkeys.triggerOCR) {
      globalShortcut.register(hotkeys.triggerOCR, () => {
        if (mainWindow.isVisible()) {
          mainWindow.webContents.send('trigger-ocr');
        }
      });
    }

    if (hotkeys.openSettings) {
      globalShortcut.register(hotkeys.openSettings, () => {
        if (mainWindow.isVisible()) {
          mainWindow.webContents.send('show-settings');
        }
      });
    }
    
    if (isDev) console.log('Hotkeys registered:', hotkeys);
    return true;
  } catch (error) {
    console.error('Error registering hotkeys:', error);
    return false;
  }
}

app.on('window-all-closed', () => {
  // Keep app running in tray
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});