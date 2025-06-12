import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ArrowDownTrayIcon, 
  XMarkIcon, 
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const UpdateNotification = () => {
  const { t } = useTranslation();
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);

  useEffect(() => {
    // Listen for update events from main process
    const handleUpdateAvailable = (event, info) => {
      console.log('📢 Update available:', info);
      setUpdateInfo(info);
      setIsVisible(true);
    };

    const handleUpdateError = (event, error) => {
      console.error('❌ Update error:', error);
      // Show error toast or notification
    };

    const handleDownloadProgress = (event, progress) => {
      setDownloadProgress(progress.percent);
    };

    const handleDownloadCompleted = () => {
      setIsDownloading(false);
      setDownloadProgress(100);
    };

    // Register event listeners through window.tiktokAPI if available
    if (window.tiktokAPI && window.tiktokAPI.onUpdateAvailable) {
      window.tiktokAPI.onUpdateAvailable(handleUpdateAvailable);
      window.tiktokAPI.onUpdateError(handleUpdateError);
      window.tiktokAPI.onDownloadProgress(handleDownloadProgress);
      window.tiktokAPI.onDownloadCompleted(handleDownloadCompleted);
    }

    return () => {
      // Cleanup listeners if API provides cleanup method
      if (window.tiktokAPI && window.tiktokAPI.removeUpdateListeners) {
        window.tiktokAPI.removeUpdateListeners();
      }
    };
  }, []);

  const handleDownloadAndInstall = async () => {
    if (!updateInfo) return;

    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      const result = await window.tiktokAPI.updateDownloadInstall(updateInfo.downloadUrl);
      
      if (result.success) {
        // Show success message and restart option
        console.log('✅ Update downloaded and installed successfully');
      } else {
        console.error('❌ Update failed:', result.error);
        setIsDownloading(false);
      }
    } catch (error) {
      console.error('❌ Update download failed:', error);
      setIsDownloading(false);
    }
  };

  const handleDismiss = async () => {
    if (!updateInfo) return;
    
    setIsVisible(false);
  };

  const handleSkipVersion = async () => {
    if (!updateInfo) return;
    
    setIsVisible(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!isVisible || !updateInfo) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <InformationCircleIcon className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {t('update.available.title')}
          </h3>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            {t('update.available.message', {
              currentVersion: updateInfo.currentVersion,
              latestVersion: updateInfo.latestVersion
            })}
          </p>
          
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div>{t('update.fileSize')}: {formatFileSize(updateInfo.fileSize)}</div>
            <div>{t('update.publishedAt')}: {formatDate(updateInfo.publishedAt)}</div>
          </div>
        </div>

        {/* Release Notes Toggle */}
        {updateInfo.releaseNotes && (
          <div className="mb-4">
            <button
              onClick={() => setShowReleaseNotes(!showReleaseNotes)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showReleaseNotes ? t('update.hideReleaseNotes') : t('update.showReleaseNotes')}
            </button>
            
            {showReleaseNotes && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300 max-h-32 overflow-y-auto">
                <pre className="whitespace-pre-wrap">{updateInfo.releaseNotes}</pre>
              </div>
            )}
          </div>
        )}

        {/* Download Progress */}
        {isDownloading && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
              <span>{t('update.downloading')}</span>
              <span>{downloadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleDownloadAndInstall}
            disabled={isDownloading}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                {t('update.downloading')}
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                {t('update.downloadInstall')}
              </>
            )}
          </button>
          
          <button
            onClick={handleSkipVersion}
            disabled={isDownloading}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            {t('update.skip')}
          </button>
        </div>

        {/* Warning for manual updates */}
        {!updateInfo.manual && (
          <div className="mt-3 flex items-start space-x-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
            <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              {t('update.autoUpdateWarning')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateNotification; 