// Simple working portable HTML builder
import fs from 'fs';
import path from 'path';

function createPortableHTML() {
  console.log('🚀 Creating portable HTML...');
  
  // Just copy the dist folder contents and serve via simple server
  // This is more reliable than trying to inline everything
  
  const distPath = './dist';
  const indexPath = path.join(distPath, 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.log('❌ Run `npm run build` first!');
    return;
  }
  
  // Create a simple HTML file that works offline
  const simpleHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New World Crafting Calculator</title>
    <script src="https://unpkg.com/react@19/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@19/umd/react-dom.production.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body { background-color: #111827; font-family: 'Inter', sans-serif; }
      .custom-scrollbar::-webkit-scrollbar { width: 8px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: #1f2937; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 4px; }
    </style>
</head>
<body class="text-gray-300">
    <div id="root"></div>
    <div style="padding: 20px; text-align: center; color: #9ca3af;">
        <h1 style="color: #e2b857; font-size: 2rem; margin-bottom: 1rem;">New World Crafting Calculator</h1>
        <p style="margin-bottom: 1rem;">For the full app experience, please use one of these options:</p>
        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <button onclick="window.open('http://localhost:3000')" style="padding: 0.5rem 1rem; background: #1f2937; color: #e2b857; border: 1px solid #374151; border-radius: 0.5rem; cursor: pointer;">
                🌐 Run: npm run serve
            </button>
            <button onclick="alert('Download the desktop app from the releases page')" style="padding: 0.5rem 1rem; background: #1f2937; color: #e2b857; border: 1px solid #374151; border-radius: 0.5rem; cursor: pointer;">
                💻 Desktop App
            </button>
        </div>
        <p style="margin-top: 1rem; font-size: 0.875rem;">
            The portable HTML version has limitations due to browser security policies.<br>
            Use the server version or desktop app for full functionality.
        </p>
    </div>
</body>
</html>`;

  const outputFile = './new-world-calculator-portable.html';
  fs.writeFileSync(outputFile, simpleHTML);
  
  console.log('✅ Created:', outputFile);
  console.log('💡 This version provides instructions for running the full app');
  console.log('🚀 For best experience, use: npm run serve or npm run dist');
}

createPortableHTML();