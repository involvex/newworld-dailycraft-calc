// Build everything: Electron app + GitHub Pages
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building everything...\n');

try {
  // 1. Build the web app
  console.log('📦 Building web app...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // 2. Copy to docs for GitHub Pages
  console.log('📄 Copying to docs folder...');
  if (fs.existsSync('./docs/index.html')) {
    fs.unlinkSync('./docs/index.html');
  }
  if (fs.existsSync('./docs/assets')) {
    fs.rmSync('./docs/assets', { recursive: true, force: true });
  }
  
  fs.copyFileSync('./dist/index.html', './docs/index.html');
  fs.cpSync('./dist/assets', './docs/assets', { recursive: true });
  
  // 3. Build Electron app
  console.log('💻 Building Electron app...');
  execSync('electron-builder', { stdio: 'inherit' });
  
  console.log('\n✅ Build complete!');
  console.log('📁 Electron app: dist-electron/');
  console.log('🌐 GitHub Pages: docs/');
  console.log('💡 Commit and push docs/ to deploy to GitHub Pages');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}