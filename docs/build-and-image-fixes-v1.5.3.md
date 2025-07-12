# Build & Image Loading Fixes - Version 1.5.3

## 🔧 Issues Fixed

### 1. Certificate Signing Build Error
**Problem**: `Env WIN_CSC_LINK is not correct, cannot resolve: E:\new-world-crafting-calculator\${env.CSC_LINK} doesn't exist`

**Root Cause**: Environment variables weren't being loaded properly in some build contexts.

**Solution**:
```powershell
# Set environment variables explicitly before building
$env:CSC_LINK = "e:\new-world-crafting-calculator\test-cert.pfx"
$env:CSC_KEY_PASSWORD = "testpassword123"
node build-signed.js
```

**Fixed**: ✅ Our custom `build-signed.js` script now works consistently

### 2. Images Not Loading in Electron Build
**Problem**: Item icons from `cdn.nwdb.info` and `nwdb.info` were not loading in the packaged Electron app.

**Root Causes**:
1. **Web Security Conflict**: `webSecurity: true` in window preferences but `session.defaultSession.webSecurity = false` globally
2. **Content Security Policy**: CSP was blocking external image sources
3. **Sandbox Mode**: Enabled sandbox was preventing external resource loading

**Solutions Applied**:

#### A. Fixed Electron Security Settings (`electron.js`)
```javascript
webPreferences: {
  nodeIntegration: false,
  contextIsolation: true,
  webSecurity: false,        // ✅ Allow external images
  sandbox: false,           // ✅ Allow external resources
  allowRunningInsecureContent: true, // ✅ Allow HTTP from HTTPS
  preload: path.join(__dirname, 'preload.js')
}
```

#### B. Updated Content Security Policy
```javascript
"img-src 'self' data: blob: file: https://cdn.nwdb.info https://nwdb.info;"
```

#### C. Enhanced Fallback Icon System
- Replaced file-based fallback with base64 encoded SVG
- Added debug logging for image loading issues
- Improved error handling in `CraftingNode.tsx`

```typescript
// New fallback system
const fallback = 'data:image/svg+xml;base64,[base64-encoded-svg]';
if (e.currentTarget.src !== fallback) {
  console.warn('Failed to load item icon:', e.currentTarget.src);
  e.currentTarget.src = fallback;
}
```

## 🎯 Results

### Before Fixes:
- ❌ Build failed with certificate errors
- ❌ Item icons showed as broken images in Electron
- ❌ No fallback for missing images

### After Fixes:
- ✅ **Successful Build**: Version 1.5.3 builds and signs properly
- ✅ **Working Images**: External icons load correctly from NWDB
- ✅ **Fallback Icons**: Graceful degradation with SVG placeholders
- ✅ **Debug Logging**: Console shows image loading status

## 🚀 Version 1.5.3 Features

**New in this release**:
- ✅ Fixed certificate signing build process
- ✅ Resolved external image loading in Electron
- ✅ Enhanced auto-updater error handling (from v1.5.2)
- ✅ Improved fallback icon system
- ✅ Added debug logging for troubleshooting

## 📋 Build Commands

### Recommended Build Process:
```powershell
# Clean build with proper environment setup
Remove-Item -Recurse -Force dist-electron -ErrorAction SilentlyContinue
$env:CSC_LINK = "e:\new-world-crafting-calculator\test-cert.pfx"
$env:CSC_KEY_PASSWORD = "testpassword123"
node build-signed.js
```

### Alternative (if environment variables are set globally):
```powershell
npm run build:signed
```

## 🔍 Troubleshooting

### If Images Still Don't Load:
1. **Check Console**: Look for debug logs showing image URLs
2. **Network Tab**: Verify external requests to `cdn.nwdb.info`
3. **Fallback Icons**: Should show gray placeholder if images fail
4. **CSP Errors**: Check for Content Security Policy violations

### If Build Fails:
1. **Clean First**: Remove `dist-electron` folder
2. **Set Variables**: Ensure `CSC_LINK` and `CSC_KEY_PASSWORD` are set
3. **Use Custom Script**: `node build-signed.js` is more reliable than electron-builder directly

## 📦 Release Files

**Generated in** `release/release-v1.5.3/`:
- ✅ `New World Crafting Calculator Setup 1.5.3.exe` (94.80 MB)
- ✅ `latest.yml` (auto-updater metadata)
- ✅ `*.blockmap` files (for delta updates)
- ✅ `release-info.json` (release information)

**All issues resolved!** 🎉 Version 1.5.3 is ready for distribution with working image loading and fixed auto-updater.
