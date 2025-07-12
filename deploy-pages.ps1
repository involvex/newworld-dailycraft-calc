#!/usr/bin/env pwsh

Write-Host "🚀 Deploying to GitHub Pages..." -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Build the web application
Write-Host "🔨 Building web application..." -ForegroundColor Green
npm run build:pages

if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed!"
    exit 1
}

# Backup existing docs files that shouldn't be overwritten
Write-Host "💾 Backing up existing documentation..." -ForegroundColor Yellow
$backupFiles = @()

if (Test-Path "docs\documentation.html") {
    Copy-Item "docs\documentation.html" "docs\documentation.html.bak"
    $backupFiles += "documentation.html"
    Write-Host "  ✅ Backed up documentation.html"
}

if (Test-Path "docs\logo.png") {
    Copy-Item "docs\logo.png" "docs\logo.png.bak"
    $backupFiles += "logo.png"
    Write-Host "  ✅ Backed up logo.png"
}

# Deploy new files
Write-Host "📦 Deploying new files..." -ForegroundColor Green

# Copy index.html
Copy-Item "dist\index.html" "docs\index.html" -Force
Write-Host "  ✅ Updated index.html"

# Copy assets directory
if (Test-Path "docs\assets") {
    Remove-Item "docs\assets" -Recurse -Force
}
xcopy "dist\assets" "docs\assets" /E /I /Y | Out-Null
Write-Host "  ✅ Updated assets directory"

# Restore backed up files
Write-Host "🔄 Restoring preserved files..." -ForegroundColor Yellow
foreach ($file in $backupFiles) {
    if (Test-Path "docs\$file.bak") {
        Move-Item "docs\$file.bak" "docs\$file" -Force
        Write-Host "  ✅ Restored $file"
    }
}

# Check git status
Write-Host "📋 Checking changes..." -ForegroundColor Cyan
$changes = git status --porcelain docs/
if ($changes) {
    Write-Host "📝 Changes detected:" -ForegroundColor Green
    $changes | ForEach-Object { Write-Host "  $_" }
    
    # Ask for confirmation
    $commit = Read-Host "Do you want to commit and push these changes? (y/N)"
    
    if ($commit -eq 'y' -or $commit -eq 'Y') {
        Write-Host "📤 Committing and pushing changes..." -ForegroundColor Green
        
        git add docs/
        git commit -m "docs: deploy to GitHub Pages

- Update web application build
- Preserve documentation.html and other static files
- Deploy date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        
        git push origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "🎉 Successfully deployed to GitHub Pages!" -ForegroundColor Green
            Write-Host "🔗 Your site will be available at:" -ForegroundColor Cyan
            Write-Host "   https://involvex.github.io/newworld-dailycraft-calc/" -ForegroundColor Blue
            Write-Host "   https://involvex.github.io/newworld-dailycraft-calc/documentation.html" -ForegroundColor Blue
            Write-Host ""
            Write-Host "⏱️ Changes may take a few minutes to appear online." -ForegroundColor Yellow
        } else {
            Write-Error "Failed to push changes to GitHub!"
        }
    } else {
        Write-Host "❌ Deployment cancelled. Changes are ready but not committed." -ForegroundColor Yellow
        Write-Host "💡 You can manually commit with: git add docs/ && git commit -m 'Deploy to GitHub Pages' && git push origin main"
    }
} else {
    Write-Host "✅ No changes detected. Deployment is up to date!" -ForegroundColor Green
}

Write-Host ""
Write-Host "📁 Files in docs directory:" -ForegroundColor Cyan
Get-ChildItem "docs" -Recurse | ForEach-Object {
    $relativePath = $_.FullName.Replace((Get-Location).Path + "\docs\", "")
    if ($_.PSIsContainer) {
        Write-Host "  📁 $relativePath/" -ForegroundColor Blue
    } else {
        $size = [math]::Round($_.Length / 1KB, 1)
        Write-Host "  📄 $relativePath ($size KB)" -ForegroundColor Gray
    }
}
