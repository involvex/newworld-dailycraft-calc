const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');

let tray = null;
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    },
    title: 'New World Crafting Calculator',
    show: false
  });

  // Load the GitHub Pages URL directly
  mainWindow.loadURL('https://involvex.github.io/newworld-dailycraft-calc/');
  
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
  // Create a simple tray icon (you can replace with actual icon file)
  tray = new Tray(path.join(__dirname, 'logo.png'));
  
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
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  // Keep app running in tray
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});