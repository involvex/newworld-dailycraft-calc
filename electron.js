const { app, BrowserWindow, Tray, Menu, session, desktopCapturer, ipcMain, globalShortcut } = require('electron');
const path = require('path');

let tray = null;
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'logo.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
      experimentalFeatures: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'New World Crafting Calculator',
    show: false,
    autoHideMenuBar: true
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

  // Load the local build files
  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.show();
  });

  // Hide to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  // Create a simple tray icon
  tray = new Tray(path.join(__dirname, 'public', 'logo.png'));
  
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

app.whenReady().then(() => {
  // Handle screen capture permissions
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true);
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
  
  // Register global hotkeys
  globalShortcut.register('CommandOrControl+Alt+I', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
  
  globalShortcut.register('CommandOrControl+Alt+O', () => {
    if (mainWindow.isVisible()) {
      mainWindow.webContents.send('trigger-ocr');
    }
  });
  
  createWindow();
  createTray();
});

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