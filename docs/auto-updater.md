# Auto-Updater Implementation

This document describes the comprehensive auto-updater implementation for the New World Crafting Calculator Electron app.

## 🌟 Features

- **Automatic Update Checks**: Periodically checks for new releases on GitHub
- **Background Downloads**: Downloads updates in the background with progress tracking
- **User Notifications**: Clean, non-intrusive notification UI
- **Manual Check**: Users can manually check for updates via the About dialog
- **Secure Installation**: Verifies update integrity before installation
- **Progress Tracking**: Real-time download progress with percentage display

## 🏗️ Architecture

### 1. Main Process (electron.js)
- Initializes electron-updater with GitHub releases
- Sets up IPC handlers for update operations
- Manages update lifecycle and events
- Provides secure communication with renderer process

### 2. Preload Script (preload.js)
- Exposes update functionality through contextBridge
- Provides type-safe API for renderer process
- Handles event listeners for update progress

### 3. Renderer Process (React Components)
- **UpdateNotification**: Main notification component
- **App Integration**: Manual check button in About dialog
- **TypeScript Types**: Complete interface definitions

## 🔧 Implementation Details

### Update Flow
1. **Check**: App automatically checks for updates on startup
2. **Notify**: If update available, shows notification to user
3. **Download**: User can choose to download the update
4. **Install**: Once downloaded, user can install and restart

### File Structure
```
electron.js           # Main process with auto-updater logic
preload.js           # API exposure through contextBridge
types.ts             # TypeScript interfaces for updater
components/
  UpdateNotification.tsx  # Main notification component
App.tsx              # Integration and manual check button
```

### Key Components

#### InitializeAutoUpdater (electron.js)
```javascript
function initializeAutoUpdater() {
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'involvex',
    repo: 'newworld-dailycraft-calc',
    private: false
  });
}
```

#### IPC Handlers
- `check-for-updates`: Manually trigger update check
- `download-update`: Start downloading available update
- `install-update`: Install downloaded update and restart
- `get-app-version`: Get current application version

#### Event Listeners
- `checking-for-update`: Checking for updates started
- `update-available`: New update found
- `update-not-available`: No updates available
- `error`: Update error occurred
- `download-progress`: Download progress percentage
- `update-downloaded`: Update ready to install

### UpdateNotification Component

The notification component provides:
- Clean, modern UI using Tailwind CSS
- State management for different update phases
- Progress bar for download tracking
- User action buttons (Download, Install, Dismiss)
- Error handling and retry functionality

### Security Features

- **Certificate Validation**: Updates are signed and verified
- **Secure Channel**: Uses HTTPS for all communications
- **Integrity Checks**: Verifies download completeness
- **User Consent**: Requires user approval for installation

## 🚀 Usage

### For Users
1. **Automatic**: App checks for updates automatically
2. **Manual**: Click "🔄 Check for Updates" in About dialog
3. **Notification**: Will appear when updates are available
4. **Installation**: Choose when to download and install

### For Developers
1. **Release Process**: Tag releases on GitHub with proper versioning
2. **Build Assets**: Include `latest.yml` for update metadata
3. **Signing**: Ensure releases are properly signed
4. **Testing**: Use development builds to test update flow

## 🔍 Configuration

### Environment Variables
```bash
GH_TOKEN=your_github_token  # For private repos (optional)
```

### Build Configuration (package.json)
```json
{
  "build": {
    "publish": [
      {
        "provider": "github",
        "owner": "involvex",
        "repo": "newworld-dailycraft-calc"
      }
    ]
  }
}
```

## 🛠️ Development

### Testing Updates
1. Build with different version numbers
2. Use local test environment
3. Verify notification appearance
4. Test download and install flow

### Debugging
- Check console logs for update events
- Monitor network requests to GitHub API
- Verify latest.yml metadata file
- Test with different release versions

## 📝 Best Practices

1. **Version Management**: Use semantic versioning (e.g., 1.5.1)
2. **Release Notes**: Include meaningful release descriptions
3. **Asset Organization**: Keep releases in organized folders
4. **User Experience**: Minimize disruption during updates
5. **Error Handling**: Provide clear error messages and recovery options

## 🔒 Security Considerations

- Updates are verified against GitHub's secure endpoints
- Digital signatures ensure authenticity
- User has full control over update timing
- No automatic installation without user consent
- Secure IPC communication between processes

## 📊 Monitoring

The auto-updater logs important events:
- Update check attempts
- Available update notifications
- Download progress
- Installation success/failure
- Error conditions

This enables monitoring of update adoption and troubleshooting issues.

---

✅ **Status**: Fully implemented and tested
🎯 **Target**: Electron app users
🔄 **Update Method**: GitHub Releases
🛡️ **Security**: Signed and verified updates
