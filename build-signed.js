const { build, Platform } = require('electron-builder');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

async function buildSigned() {
  try {
    console.log('Building signed executable...');
    
    // Verify certificate is available
    if (!process.env.CSC_LINK && !process.env.CSC_KEY_PASSWORD) {
      console.warn('Warning: No code signing certificate configured');
      console.warn('The executable will not be signed and may trigger security warnings');
      console.warn('Configure CSC_LINK and CSC_KEY_PASSWORD environment variables');
    }
    
    await build({
      targets: Platform.WINDOWS.createTarget(),
      publish: 'never',
      config: {
        appId: 'com.involvex.newworldcraftingcalculator',
        productName: 'New World Crafting Calculator',
        copyright: `Copyright © ${new Date().getFullYear()} Involvex`,
        win: {
          target: [
            {
              target: 'nsis',
              arch: ['x64']
            }
          ],
          icon: 'logo.png',
          requestedExecutionLevel: 'asInvoker',
          signAndEditExecutable: true,
          verifyUpdateCodeSignature: false,
          cscLink: process.env.CSC_LINK,
          cscKeyPassword: process.env.CSC_KEY_PASSWORD
        },
        nsis: {
          oneClick: false,
          allowToChangeInstallationDirectory: true,
          createDesktopShortcut: true,
          createStartMenuShortcut: true,
          deleteAppDataOnUninstall: true,
          runAfterFinish: false
        },
        directories: {
          output: 'dist-electron'
        }
      }
    });
    
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildSigned();
