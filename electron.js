const { app, BrowserWindow, Tray, Menu, session, desktopCapturer, ipcMain, globalShortcut, dialog } = require('electron');
const path = require('path');
const ConfigService = require('./services/configService');

let tray = null;
let mainWindow = null;
let configService = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'logo.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Temporarily disable for local file loading
      experimentalFeatures: true,
      sandbox: false, // Required for preload script functionality
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
  const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
  
  if (isDev) {
    console.log('Loading development server at http://localhost:3000');
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    console.log('Loading production build from:', indexPath);
    mainWindow.loadFile(indexPath);
    // Open DevTools in production for debugging
    mainWindow.webContents.openDevTools();
  }
  
  // Add error handling
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', validatedURL, 'Error:', errorDescription);
  });
  
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
    mainWindow.show();
  });
  
  // Add console message listener
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`Console [${level}]: ${message}`);
  });
  
  // Add DOM ready listener
  mainWindow.webContents.on('dom-ready', () => {
    console.log('DOM is ready');
  });

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
  console.log('Electron app is ready');
  
  // Initialize config service with error handling
  try {
    configService = new ConfigService();
    console.log('ConfigService initialized successfully');
  } catch (error) {
    console.error('Failed to initialize ConfigService:', error);
    // Continue without config service for now
  }
  
  // Enhanced security: Set secure session defaults
  session.defaultSession.webSecurity = false; // Disabled for local files
  
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
    console.log('Config loaded and hotkeys registered');
  } catch (error) {
    console.error('Failed to load config:', error);
    registerHotkeys({});
  }
  
  console.log('Creating window and tray...');
  createWindow();
  createTray();
  console.log('Window and tray created');
}).catch(error => {
  console.error('Failed to start Electron app:', error);
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
    
    console.log('Hotkeys registered:', hotkeys);
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