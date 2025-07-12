#!/usr/bin/env pwsh

param(
    [Parameter(Mandatory=$true)]
    [string]$Version,
    
    [Parameter(Mandatory=$false)]
    [string]$ReleaseNotes = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun
)

Write-Host "🚀 New World Crafting Calculator Release Script" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Validate version format
if ($Version -notmatch '^\d+\.\d+\.\d+$') {
    Write-Error "Invalid version format. Use semantic versioning (e.g., 1.5.1)"
    exit 1
}

$TagName = "v$Version"

Write-Host "📋 Release Information:" -ForegroundColor Yellow
Write-Host "  Version: $Version"
Write-Host "  Tag: $TagName"
Write-Host "  Release Notes: $($ReleaseNotes -ne '' ? $ReleaseNotes : 'Auto-generated')"
Write-Host "  Dry Run: $DryRun"
Write-Host ""

if ($DryRun) {
    Write-Host "🔍 DRY RUN MODE - No changes will be made" -ForegroundColor Magenta
    Write-Host ""
}

# Check if git repo is clean
$gitStatus = git status --porcelain
if ($gitStatus -and -not $DryRun) {
    Write-Error "Git repository has uncommitted changes. Please commit or stash them first."
    exit 1
}

# Update package.json version
Write-Host "📝 Updating package.json version..." -ForegroundColor Green
if (-not $DryRun) {
    $pkg = Get-Content package.json | ConvertFrom-Json
    $oldVersion = $pkg.version
    $pkg.version = $Version
    $pkg | ConvertTo-Json -Depth 100 | Set-Content package.json
    Write-Host "  Updated version from $oldVersion to $Version"
} else {
    Write-Host "  Would update package.json version to $Version"
}

# Build the application
Write-Host "🔨 Building signed application..." -ForegroundColor Green
if (-not $DryRun) {
    npm run build:signed
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build failed!"
        exit 1
    }
} else {
    Write-Host "  Would run: npm run build:signed"
}

# Create release directory and copy assets
Write-Host "📦 Preparing release assets..." -ForegroundColor Green
if (-not $DryRun) {
    New-Item -ItemType Directory -Force -Path "release-v$Version" | Out-Null
    
    # Copy the setup file
    $setupFile = Get-ChildItem -Path "dist-electron" -Filter "*Setup*.exe" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($setupFile) {
        $newSetupName = "New-World-Crafting-Calculator-v$Version-Setup.exe"
        Copy-Item $setupFile.FullName "release-v$Version\$newSetupName"
        Write-Host "  ✅ Copied: $newSetupName"
    }
    
    # Copy other exe files if they exist
    Get-ChildItem -Path "dist-electron" -Filter "*.exe" -Exclude "*Setup*", "*uninstaller*" | ForEach-Object {
        $newName = "New-World-Crafting-Calculator-v$Version-$($_.BaseName).exe"
        Copy-Item $_.FullName "release-v$Version\$newName"
        Write-Host "  ✅ Copied: $newName"
    }
    
    Write-Host "  📁 Release assets prepared in: release-v$Version"
} else {
    Write-Host "  Would create release-v$Version directory and copy build artifacts"
}

# Commit and tag
Write-Host "🏷️ Creating Git tag..." -ForegroundColor Green
if (-not $DryRun) {
    git add package.json
    git commit -m "chore: bump version to v$Version"
    git tag -a $TagName -m "Release v$Version"
    Write-Host "  ✅ Created tag: $TagName"
} else {
    Write-Host "  Would create tag: $TagName"
}

# Ask for confirmation to push
if (-not $DryRun) {
    Write-Host ""
    Write-Host "🤔 Ready to push to GitHub and create release!" -ForegroundColor Yellow
    $confirm = Read-Host "Do you want to continue? (y/N)"
    
    if ($confirm -eq 'y' -or $confirm -eq 'Y') {
        Write-Host "📤 Pushing to GitHub..." -ForegroundColor Green
        git push origin main
        git push origin $TagName
        
        Write-Host ""
        Write-Host "🎉 Success! Release v$Version has been created!" -ForegroundColor Green
        Write-Host "📝 GitHub Actions will automatically:" -ForegroundColor Cyan
        Write-Host "   - Build and sign the application"
        Write-Host "   - Create a GitHub release"
        Write-Host "   - Upload the signed installers"
        Write-Host ""
        Write-Host "🔗 Check the release at: https://github.com/involvex/newworld-dailycraft-calc/releases/tag/$TagName"
        Write-Host "⏱️ The release will be available in a few minutes."
    } else {
        Write-Host "❌ Release cancelled. You can push manually later with:" -ForegroundColor Yellow
        Write-Host "   git push origin main"
        Write-Host "   git push origin $TagName"
    }
} else {
    Write-Host ""
    Write-Host "✅ Dry run completed successfully!" -ForegroundColor Green
    Write-Host "🚀 Run without -DryRun to execute the actual release"
}

Write-Host ""
Write-Host "📁 Local release assets are in: release-v$Version" -ForegroundColor Cyan
