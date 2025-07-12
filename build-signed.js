const { build, Platform } = require('electron-builder');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env file
require('dotenv').config();

async function buildSigned() {
  try {
    console.log('Building signed executable...');
    
    // Get version from package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const version = packageJson.version;
    const releaseDir = `release/release-v${version}`;
    
    console.log(`Version: ${version}`);
    console.log(`Release directory: ${releaseDir}`);
    
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
          cscKeyPassword: process.env.CSC_KEY_PASSWORD,
          artifactName: 'New-World-Crafting-Calculator-Setup-${version}.${ext}'
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
    
    // Create release directory
    console.log('Organizing release files...');
    if (!fs.existsSync('release')) {
      fs.mkdirSync('release');
    }
    if (!fs.existsSync(releaseDir)) {
      fs.mkdirSync(releaseDir, { recursive: true });
    }
    
    // Copy release files to organized directory
    const distDir = 'dist-electron';
    if (fs.existsSync(distDir)) {
      const files = fs.readdirSync(distDir);
      
      for (const file of files) {
        const filePath = path.join(distDir, file);
        const stat = fs.statSync(filePath);
        
        // Only copy files that match the current version or are build metadata
        if (stat.isFile() && (
          file.includes(version) || // Files containing current version
          file.endsWith('.yml') || // Metadata files
          file.endsWith('.blockmap') // Block map files
        )) {
          const targetPath = path.join(releaseDir, file);
          fs.copyFileSync(filePath, targetPath);
          
          // Get file size for logging
          const fileSize = (stat.size / (1024 * 1024)).toFixed(2);
          console.log(`  ✅ Copied: ${file} (${fileSize} MB)`);
        }
      }
      
      // Create a release info file
      const releaseInfo = {
        version: version,
        buildDate: new Date().toISOString(),
        appId: 'com.involvex.newworldcraftingcalculator',
        productName: 'New World Crafting Calculator',
        platform: 'win32',
        arch: 'x64',
        signed: !!(process.env.CSC_LINK && process.env.CSC_KEY_PASSWORD),
        certificate: process.env.CSC_LINK || 'none'
      };
      
      fs.writeFileSync(
        path.join(releaseDir, 'release-info.json'),
        JSON.stringify(releaseInfo, null, 2)
      );
      console.log('  ✅ Created: release-info.json');
      
      console.log('');
      console.log(`🎉 Release v${version} organized in: ${releaseDir}`);
      console.log('📁 Release contents:');
      
      const releaseFiles = fs.readdirSync(releaseDir);
      releaseFiles.forEach(file => {
        const filePath = path.join(releaseDir, file);
        const stat = fs.statSync(filePath);
        const fileSize = (stat.size / (1024 * 1024)).toFixed(2);
        console.log(`   📄 ${file} (${fileSize} MB)`);
      });
    } else {
      console.warn('⚠️ dist-electron directory not found!');
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildSigned();
