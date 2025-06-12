import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const UpdateNotificationBanner = () => {
  const { t } = useTranslation();
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Kiểm tra update state khi component mount
  useEffect(() => {
    checkUpdateState();
    
    // Check mỗi 5 phút
    const interval = setInterval(checkUpdateState, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const checkUpdateState = async () => {
    try {
      const hasUpdate = await window.tiktokAPI.hasActiveUpdate();
      
      if (hasUpdate) {
        const updateState = await window.tiktokAPI.getUpdateState();
        if (updateState && updateState.hasUpdateAvailable && !updateState.updateDismissed) {
          setUpdateInfo({
            currentVersion: updateState.currentVersion,
            latestVersion: updateState.latestVersion,
            releaseNotes: updateState.releaseNotes,
            downloadUrl: updateState.downloadUrl
          });
          setIsVisible(true);
        }
      } else {
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Error checking update state:', error);
    }
  };

  const handleDownloadUpdate = async () => {
    if (!updateInfo) return;
    
    setIsLoading(true);
    try {
      const result = await window.tiktokAPI.downloadAndInstall(updateInfo.downloadUrl);
      if (result.success) {
        console.log('Update download started');
      } else {
        console.error('Failed to start download:', result.error);
      }
    } catch (error) {
      console.error('Error downloading update:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = async () => {
    try {
      await window.tiktokAPI.dismissUpdate();
      setIsVisible(false);
      setUpdateInfo(null);
    } catch (error) {
      console.error('Error dismissing update:', error);
    }
  };

  if (!isVisible || !updateInfo) {
    return null;
  }

  return (
    <div className="bg-blue-600 text-white px-4 py-3 shadow-lg">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">
                {t('updateAvailable')} v{updateInfo.currentVersion} → v{updateInfo.latestVersion}
              </div>
              <div className="text-xs opacity-90 mt-1">
                {t('clickToUpdateNow')}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadUpdate}
              disabled={isLoading}
              className="bg-white text-blue-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{t('downloading')}</span>
                </div>
              ) : (
                t('updateNow')
              )}
            </button>
            
            <button
              onClick={handleDismiss}
              className="text-white hover:text-blue-200 transition-colors p-2"
              title={t('dismissUpdate')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotificationBanner; 