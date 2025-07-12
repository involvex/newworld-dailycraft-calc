# 🚀 Release Management

This document explains how to create and manage releases for the New World Crafting Calculator.

## 📋 Quick Start

### Option 1: Automated Release Script (Recommended)

```powershell
# Create a new release
.\create-release.ps1 -Version "1.5.1" -ReleaseNotes "Fixed crafting calculations for new items"

# Dry run to test without making changes
.\create-release.ps1 -Version "1.5.1" -DryRun
```

### Option 2: Manual GitHub Actions

1. Go to **Actions** tab in GitHub
2. Select **Create Release** workflow
3. Click **Run workflow**
4. Enter version and release notes
5. Click **Run workflow**

### Option 3: Git Tag (Automatic)

```bash
# Update package.json version manually, then:
git add package.json
git commit -m "chore: bump version to v1.5.1"
git tag -a v1.5.1 -m "Release v1.5.1"
git push origin main
git push origin v1.5.1
```

## 🔄 Release Process

When you create a release, the following happens automatically:

1. **🔨 Build**: Application is built with production settings
2. **🔐 Sign**: Executables are digitally signed with a certificate
3. **📦 Package**: Creates both installer and portable versions
4. **🏷️ Tag**: Creates a Git tag for the version
5. **📤 Upload**: Uploads signed files to GitHub Releases
6. **📝 Notes**: Generates release notes with download links

## 📁 Release Assets

Each release includes:

- **Setup Installer** (`*-Setup.exe`): Full installer with shortcuts and uninstaller
- **Portable Version** (`*-Portable.exe`): Standalone executable, no installation required
- **Auto-updater files** (`latest.yml`): For automatic update checks

## 🔐 Code Signing

### Current Setup (Development)
- Uses **self-signed certificates** created during build
- Provides basic code signing for development/testing
- Windows may show warnings for self-signed certificates

### Production Recommendations
For production releases, consider:

1. **DigiCert Code Signing Certificate** (~$400/year)
   - Trusted by Windows immediately
   - No security warnings for users
   - Better reputation building

2. **Sectigo Code Signing Certificate** (~$200/year)
   - Alternative trusted certificate authority
   - Same benefits as DigiCert

3. **Microsoft Store Submission**
   - Automatic code signing through Microsoft
   - Built-in distribution and updates

## 🛠️ Configuration

### Environment Variables (for local development)

Create a `.env` file with:
```env
CSC_LINK=path/to/your/certificate.pfx
CSC_KEY_PASSWORD=your_certificate_password
```

### GitHub Secrets (for automated releases)

The workflow automatically creates certificates, but for production you can set:
- `CSC_LINK`: Path to your production certificate
- `CSC_KEY_PASSWORD`: Certificate password

## 📊 Version Management

### Semantic Versioning
- **Major** (1.0.0): Breaking changes
- **Minor** (1.1.0): New features, backward compatible
- **Patch** (1.1.1): Bug fixes, backward compatible

### Examples
```powershell
# Bug fix release
.\create-release.ps1 -Version "1.5.1" -ReleaseNotes "Fixed inventory detection bug"

# Feature release
.\create-release.ps1 -Version "1.6.0" -ReleaseNotes "Added new crafting recipes for Season 5"

# Major release
.\create-release.ps1 -Version "2.0.0" -ReleaseNotes "Complete UI redesign and new features"
```

## 🔍 Troubleshooting

### Build Fails
1. Check Node.js version (requires v20+)
2. Run `npm install` to update dependencies
3. Check for TypeScript errors: `npm run build`

### Signing Fails
1. Verify certificate file exists and is valid
2. Check certificate password is correct
3. Ensure certificate hasn't expired

### GitHub Actions Fails
1. Check workflow logs in GitHub Actions tab
2. Verify repository permissions are correct
3. Ensure no sensitive files are committed

## 📚 Scripts Reference

### Package.json Scripts
- `npm run build:signed`: Build and sign the application
- `npm run release`: Alias for build:signed
- `npm run build:electron:prod`: Build production Electron assets
- `npm run dist`: Build portable version (unsigned)

### PowerShell Scripts
- `create-release.ps1`: Complete release automation
- `create-test-cert.ps1`: Create development certificate
- `build-signed.js`: Node.js script for signed builds

## 🔗 Links

- **Repository**: https://github.com/involvex/newworld-dailycraft-calc
- **Releases**: https://github.com/involvex/newworld-dailycraft-calc/releases
- **Live Demo**: https://involvex.github.io/newworld-dailycraft-calc/
- **Issues**: https://github.com/involvex/newworld-dailycraft-calc/issues
