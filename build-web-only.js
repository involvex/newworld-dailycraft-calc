// Build web version only (skip problematic Electron build)
const { execSync } = require("child_process");
const fs = require("fs");

console.log("🚀 Building web version...\n");

try {
  // 1. Build the web app
  console.log("📦 Building web app...");
  execSync("npm run build", { stdio: "inherit" });

  // 2. Copy to docs for GitHub Pages
  console.log("📄 Copying to docs folder...");
  if (fs.existsSync("./docs/index.html")) {
    fs.unlinkSync("./docs/index.html");
  }
  if (fs.existsSync("./docs/assets")) {
    fs.rmSync("./docs/assets", { recursive: true, force: true });
  }

  fs.copyFileSync("./dist/index.html", "./docs/index.html");
  fs.cpSync("./dist/assets", "./docs/assets", { recursive: true });

  console.log("\n✅ Web build complete!");
  console.log("🌐 GitHub Pages ready: docs/");
  console.log("💡 Commit and push docs/ to deploy");
} catch (error) {
  console.error("❌ Build failed:", error.message);
  process.exit(1);
}
