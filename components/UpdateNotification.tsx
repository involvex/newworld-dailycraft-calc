import React, { useState, useEffect } from 'react';
import { UpdateInfo } from '../types';

interface UpdateNotificationProps {
  className?: string;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [updateState, setUpdateState] = useState<'available' | 'downloading' | 'downloaded' | 'error' | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string>('');

  useEffect(() => {
    // Check if we're in Electron environment
    if (!window.electronAPI?.updater) {
      return;
    }

    const { updater } = window.electronAPI;

    // Get current app version
    updater.getAppVersion().then((version: string) => {
      setCurrentVersion(version);
    });

    // Set up event listeners
    const removeChecking = updater.onChecking(() => {
      console.log('Checking for updates...');
    });

    const removeUpdateAvailable = updater.onUpdateAvailable((_event: any, info: UpdateInfo) => {
      console.log('Update available:', info);
      setUpdateInfo(info);
      setUpdateState('available');
      setIsVisible(true);
    });

    const removeNoUpdate = updater.onNoUpdate(() => {
      console.log('No updates available');
    });

    const removeError = updater.onError((_event: any, error: any) => {
      console.error('Update error:', error);
      const errorMessage = error.message || error;
      
      // Don't show notification for "no releases" errors - this is normal
      if (errorMessage.includes('No releases found') || errorMessage.includes('404')) {
        console.log('No GitHub releases available yet - this is normal');
        return;
      }
      
      setError(errorMessage || 'An error occurred while checking for updates');
      setUpdateState('error');
      setIsVisible(true);
    });

    const removeDownloadProgress = updater.onDownloadProgress((_event: any, progress: any) => {
      setDownloadProgress(progress.percent);
      if (updateState !== 'downloading') {
        setUpdateState('downloading');
      }
    });

    const removeUpdateDownloaded = updater.onUpdateDownloaded(() => {
      console.log('Update downloaded');
      setUpdateState('downloaded');
      setDownloadProgress(100);
    });

    // Check for updates on component mount (only in production)
    if (process.env.NODE_ENV === 'production') {
      updater.checkForUpdates();
    }

    // Cleanup event listeners
    return () => {
      removeChecking();
      removeUpdateAvailable();
      removeNoUpdate();
      removeError();
      removeDownloadProgress();
      removeUpdateDownloaded();
    };
  }, [updateState]);

  const handleDownload = async () => {
    if (!window.electronAPI?.updater) return;
    
    try {
      setUpdateState('downloading');
      setDownloadProgress(0);
      const result = await window.electronAPI.updater.downloadUpdate();
      
      if (!result.success && result.error) {
        setError(result.error);
        setUpdateState('error');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to download update');
      setUpdateState('error');
    }
  };

  const handleInstall = async () => {
    if (!window.electronAPI?.updater) return;
    
    try {
      await window.electronAPI.updater.installUpdate();
    } catch (err) {
      setError('Failed to install update');
      setUpdateState('error');
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setError(null);
  };

  const handleCheckForUpdates = async () => {
    if (!window.electronAPI?.updater) return;
    
    try {
      setError(null);
      console.log('Manual update check initiated');
      const result = await window.electronAPI.updater.checkForUpdates();
      
      if (!result.success && result.error) {
        // Show user-friendly error message
        setError(result.error);
        setUpdateState('error');
        setIsVisible(true);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to check for updates';
      
      // Don't show notification for missing releases
      if (errorMessage.includes('No releases found') || errorMessage.includes('404')) {
        console.log('No releases available yet - this is normal');
        return;
      }
      
      setError(errorMessage);
      setUpdateState('error');
      setIsVisible(true);
    }
  };

  if (!isVisible && !error) return null;

  const progressBarStyle = {
    width: `${downloadProgress}%`
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm ${className}`}>
      <div className="bg-gray-800/95 backdrop-blur-sm border border-gray-600/50 rounded-lg p-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="text-white font-semibold text-sm">App Update</h3>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Content */}
        {updateState === 'available' && updateInfo && (
          <div className="space-y-3">
            <p className="text-gray-300 text-sm">
              Version <span className="text-yellow-300 font-mono">{updateInfo.version}</span> is available!
            </p>
            <p className="text-gray-400 text-xs">
              Current: <span className="font-mono">{currentVersion}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-2 px-3 rounded transition-colors"
              >
                Download
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 text-gray-400 hover:text-white text-xs transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        )}

        {updateState === 'downloading' && (
          <div className="space-y-3">
            <p className="text-gray-300 text-sm">Downloading update...</p>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={progressBarStyle}
              ></div>
            </div>
            <p className="text-gray-400 text-xs text-center">
              {Math.round(downloadProgress)}%
            </p>
          </div>
        )}

        {updateState === 'downloaded' && (
          <div className="space-y-3">
            <p className="text-gray-300 text-sm">Update downloaded successfully!</p>
            <p className="text-gray-400 text-xs">
              Ready to install version <span className="text-yellow-300 font-mono">{updateInfo?.version}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded transition-colors"
              >
                Install & Restart
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 text-gray-400 hover:text-white text-xs transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        )}

        {updateState === 'error' && error && (
          <div className="space-y-3">
            <p className="text-red-400 text-sm">Update Error</p>
            <p className="text-gray-400 text-xs">{error}</p>
            <div className="flex gap-2">
              <button
                onClick={handleCheckForUpdates}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-xs py-2 px-3 rounded transition-colors"
              >
                Retry
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 text-gray-400 hover:text-white text-xs transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateNotification;
