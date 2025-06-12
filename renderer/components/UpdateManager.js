import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

// Helper functions for localStorage management
const getUpdateStateFromLocalStorage = () => {
  try {
    const stored = localStorage.getItem('ttl-update-state');
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log('🔍 Retrieved update state from localStorage:', parsed);
      return parsed;
    }
  } catch (error) {
    console.error('❌ Error reading update state from localStorage:', error);
  }
  return null;
};

const saveUpdateStateToLocalStorage = (updateState) => {
  try {
    localStorage.setItem('ttl-update-state', JSON.stringify(updateState));
    console.log('💾 Saved update state to localStorage:', updateState);
  } catch (error) {
    console.error('❌ Error saving update state to localStorage:', error);
  }
};

const clearUpdateStateFromLocalStorage = () => {
  try {
    localStorage.removeItem('ttl-update-state');
    console.log('🗑️ Cleared update state from localStorage');
  } catch (error) {
    console.error('❌ Error clearing update state from localStorage:', error);
  }
};

const UpdateManager = () => {
  const { t } = useTranslation();
  const [updateStatus, setUpdateStatus] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [updateResult, setUpdateResult] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [settings, setSettings] = useState({
    autoCheck: true,
    checkInterval: 60 * 60 * 1000 // 1 hour
  });
  const [lastCheckTime, setLastCheckTime] = useState(null);

  useEffect(() => {
    loadUpdateStatus();
    
    // Listen for localStorage changes (cross-component sync)
    const handleStorageChange = (e) => {
      if (e.key === 'ttl-update-state') {
        console.log('🔄 UpdateManager: localStorage changed, reloading...');
        loadUpdateStatus();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadUpdateStatus = async () => {
    try {
      // 🔧 FIX: Try localStorage first for faster response
      const localUpdateState = getUpdateStateFromLocalStorage();
      if (localUpdateState && localUpdateState.hasUpdateAvailable && !localUpdateState.updateDismissed) {
        // console.log('🔍 UpdateManager: Using cached update state from localStorage');
        setUpdateResult({
          available: true,
          currentVersion: localUpdateState.currentVersion,
          latestVersion: localUpdateState.latestVersion,
          releaseNotes: localUpdateState.releaseNotes,
          downloadUrl: localUpdateState.downloadUrl,
          fromLocalStorage: true
        });
        setLastCheckTime(localUpdateState.lastCheckTime);
        
        // Get settings separately
        const settingsResult = await window.tiktokAPI.updateGetSettings();
        if (settingsResult.success) {
          setSettings(settingsResult.data);
        }
        return; // Use cached data
      }
      
      // Fallback: Check database if no localStorage cache
      const hasActiveUpdate = await window.tiktokAPI.hasActiveUpdate();
      // console.log('🔍 UpdateManager: hasActiveUpdate =', hasActiveUpdate);
      
      if (hasActiveUpdate) {
        const updateStateRes = await window.tiktokAPI.getUpdateState();
        const updateState = updateStateRes.data;
        // console.log('🔍 UpdateManager: updateState =', updateState);
        
        if (updateState && updateState.hasUpdateAvailable && !updateState.updateDismissed) {
          // Cache to localStorage for next time
          saveUpdateStateToLocalStorage(updateState);
          
          // Use database update state
          setUpdateResult({
            available: true,
            currentVersion: updateState.currentVersion,
            latestVersion: updateState.latestVersion,
            releaseNotes: updateState.releaseNotes,
            downloadUrl: updateState.downloadUrl,
            fromDatabase: true
          });
          setLastCheckTime(updateState.lastCheckTime);
          // console.log('✅ UpdateManager: Loaded update from database and cached to localStorage');
          
          // Get settings separately
          const settingsResult = await window.tiktokAPI.updateGetSettings();
          if (settingsResult.success) {
            setSettings(settingsResult.data);
          }
          return; // Don't call API if we have pending update
        }
      }
      
      // Fallback to normal status loading if no active update
      const result = await window.tiktokAPI.updateGetStatus();
      if (result.success) {
        setUpdateStatus(result.data);
        // Get settings separately
        const settingsResult = await window.tiktokAPI.updateGetSettings();
        if (settingsResult.success) {
          setSettings(settingsResult.data);
        }
        setLastCheckTime(result.data.lastCheckTime);
      }
    } catch (error) {
      console.error('❌ Failed to load update status:', error);
    }
  };

  const handleCheckForUpdates = async () => {
    setIsChecking(true);
    try {
      const result = await window.tiktokAPI.updateCheck();
      if (result.success) {
        // console.log('✅ Update check result:', result.data);
        setUpdateResult(result.data);
        
        // 💾 Cache update result to localStorage if available
        if (result.data && result.data.available) {
          const updateStateForCache = {
            hasUpdateAvailable: true,
            updateDismissed: false,
            currentVersion: result.data.currentVersion,
            latestVersion: result.data.latestVersion,
            releaseNotes: result.data.releaseNotes,
            downloadUrl: result.data.downloadUrl,
            lastCheckTime: new Date().toISOString()
          };
          saveUpdateStateToLocalStorage(updateStateForCache);
        } else {
          // Clear localStorage if no update available
          clearUpdateStateFromLocalStorage();
        }
        
        // Update last check time
        setLastCheckTime(new Date().toISOString());
        
        // Don't call loadUpdateStatus() here as it might overwrite updateResult
        // Just update settings if needed
        const settingsResult = await window.tiktokAPI.updateGetSettings();
        if (settingsResult.success) {
          setSettings(settingsResult.data);
        }
      }
    } catch (error) {
      console.error('❌ Manual update check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSettingsChange = async (newSettings) => {
    try {
      const result = await window.tiktokAPI.updateSetAutoCheck(
        newSettings.autoCheck, 
        newSettings.checkInterval / (60 * 1000) // Convert to minutes
      );
      if (result.success) {
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('❌ Failed to update settings:', error);
    }
  };

  const formatLastCheckTime = (timestamp) => {
    if (!timestamp) return t('update.neverChecked');
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return t('update.justNow');
    if (diffMinutes < 60) return t('update.minutesAgo', { minutes: diffMinutes });
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return t('update.hoursAgo', { hours: diffHours });
    
    const diffDays = Math.floor(diffHours / 24);
    return t('update.daysAgo', { days: diffDays });
  };

  const getIntervalText = (interval) => {
    const hours = interval / (1000 * 60 * 60);
    if (hours < 1) return t('update.interval.30minutes');
    if (hours === 1) return t('update.interval.1hour');
    if (hours === 24) return t('update.interval.daily');
    return t('update.interval.hours', { hours });
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
          <ArrowPathIcon className="h-5 w-5 mr-2" />
          {t('update.title')}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('update.description')}
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Current Status */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {t('update.currentVersion')}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              v{updateStatus?.currentVersion || '1.0.0'}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('update.lastChecked')}
              </p>
              <p className="text-sm text-gray-900 dark:text-white">
                {formatLastCheckTime(lastCheckTime)}
              </p>
            </div>
            
            <button
              onClick={handleCheckForUpdates}
              disabled={isChecking}
              className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChecking ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent mr-2"></div>
                  {t('update.checking')}
                </>
              ) : (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  {t('update.checkNow')}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Update Status Indicator */}
        {updateResult?.available ? (
          <div className="flex items-center p-4 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <ArrowPathIcon className="h-5 w-5 text-blue-500 mr-3" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {t('update.updateAvailable')}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {t('update.newVersionAvailable', { 
                  current: updateResult.currentVersion, 
                  latest: updateResult.latestVersion 
                })}
              </p>
              {updateResult.releaseNotes && (
                <div className="mt-2">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                    {t('update.releaseNotes')}:
                  </p>
                  <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 p-2 rounded max-h-32 overflow-y-auto">
                    {updateResult.releaseNotes.substring(0, 200)}
                    {updateResult.releaseNotes.length > 200 && '...'}
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col space-y-2">
              <button
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isDownloading}
                onClick={async () => {
                  try {
                    setIsDownloading(true);
                    setDownloadProgress(0);
                    
                    // console.log('🔽 Starting download for update:', updateResult);
                    
                    // Setup progress listener
                    const handleProgress = (progress) => {
                      // console.log('📥 Download progress:', progress);
                      setDownloadProgress(progress.progress || progress.percent || 0);
                    };
                    
                    // Listen for progress events
                    window.electronAPI?.on?.('update-download-progress', handleProgress);
                    
                    if (!updateResult?.downloadUrl) {
                      throw new Error('Download URL not available');
                    }
                    
                    const result = await window.tiktokAPI.downloadAndInstallUpdate(updateResult.downloadUrl);
                    
                    // Clean up listener
                    window.electronAPI?.removeListener?.('update-download-progress', handleProgress);
                    
                    if (result.success) {
                      // console.log('✅ Download completed successfully');
                      setDownloadProgress(100);
                    } else {
                      // console.error('❌ Download failed:', result.error);
                    }
                  } catch (error) {
                    // console.error('❌ Download error:', error);
                  } finally {
                    setIsDownloading(false);
                  }
                }}
              >
                {isDownloading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2"></div>
                    {downloadProgress > 0 ? `${Math.round(downloadProgress)}%` : t('update.downloading')}
                  </div>
                ) : (
                  t('update.download')
                )}
              </button>
              {/* <button
                className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                onClick={async () => {
                  try {
                    // Call API to dismiss update in database
                    await window.tiktokAPI.dismissUpdate();
                    // Clear localStorage cache
                    clearUpdateStateFromLocalStorage();
                    // Clear local state
                    setUpdateResult(null);
                    console.log('✅ Update dismissed and localStorage cleared');
                  } catch (error) {
                    console.error('❌ Error dismissing update:', error);
                    // Still clear local state even if API fails
                    setUpdateResult(null);
                  }
                }}
              >
                {t('update.dismiss')}
              </button> */}
            </div>
          </div>
        ) : (
          <div className="flex items-center p-4 rounded-md bg-green-50 dark:bg-green-900/20">
            <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                {t('update.upToDate')}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                {t('update.upToDateDescription')}
              </p>
            </div>
          </div>
        )}

        {/* Auto-Check Settings */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
            {t('update.settings.title')}
          </h4>
          
          <div className="space-y-4">
            {/* Enable Auto-Check */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('update.settings.autoCheck')}
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('update.settings.autoCheckDescription')}
                </p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={Boolean(settings.autoCheck)}
                  onChange={(e) => handleSettingsChange({ ...settings, autoCheck: e.target.checked })}
                  className="sr-only"
                />
                <button
                  onClick={() => handleSettingsChange({ ...settings, autoCheck: !Boolean(settings.autoCheck) })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    Boolean(settings.autoCheck) ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      Boolean(settings.autoCheck) ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Check Interval */}
            {Boolean(settings.autoCheck) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('update.settings.checkInterval')}
                </label>
                <select
                  value={settings.checkInterval || 60 * 60 * 1000}
                  onChange={(e) => handleSettingsChange({ ...settings, checkInterval: parseInt(e.target.value) })}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={30 * 60 * 1000}>{t('update.interval.30minutes')}</option>
                  <option value={60 * 60 * 1000}>{t('update.interval.1hour')}</option>
                  <option value={4 * 60 * 60 * 1000}>{t('update.interval.4hours')}</option>
                  {/* <option value={24 * 60 * 60 * 1000}>{t('update.interval.daily')}</option> */}
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t('update.settings.intervalDescription')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Update Information */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
            {t('update.info.title')}
          </h4>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('update.info.updateSource')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {t('update.info.githubReleases')}
              </dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('update.info.updateType')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {t('update.info.fullUpdate')}
              </dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('update.info.downloadLocation')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {t('update.info.tempDirectory')}
              </dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('update.info.backupCreated')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {t('update.info.yes')}
              </dd>
            </div>
          </div>
        </div>

        {/* Advanced Options */}
        {/* <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <details className="group">
            <summary className="flex items-center cursor-pointer text-sm font-medium text-gray-900 dark:text-white">
              <Cog6ToothIcon className="h-4 w-4 mr-2" />
              {t('update.advanced.title')}
              <svg
                className="ml-auto h-4 w-4 transform transition-transform group-open:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            
            <div className="mt-4 space-y-3 pl-6">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('update.advanced.channel')}
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {t('update.advanced.stable')}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('update.advanced.platform')}
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {process.platform} ({process.arch})
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('update.advanced.repository')}
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                tiktokdev/ttl
                </dd>
              </div>
            </div>
          </details>
        </div> */}
      </div>
    </div>
  );
};

export default UpdateManager; 