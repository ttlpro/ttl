import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import ClientOnly from './ClientOnly'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { UserProfile } from './auth'
import {
  HomeIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  GlobeAltIcon,
  PlusIcon,
  SunIcon,
  MoonIcon,
  LanguageIcon,
  ChevronDownIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import UpdateNotification from './UpdateNotification'

export default function StaticLayout({ children, activePage = 'home' }) {
  const { t, i18n } = useTranslation('common')
  const { theme, changeTheme, isDarkMode } = useTheme()
  const { hasValidLicense } = useAuth()
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [langReady, setLangReady] = useState(typeof window === 'undefined')
  const [settings, setSettings] = useState({
    app: {
      title: '',
      name: '',
      subtitle: ''
    }
  })

  // Navigation items using react-i18next
  const getNavItems = () => [
    { id: 'home', name: langReady ? t('navigation.home') : '', href: '/home', icon: HomeIcon },
    { id: 'rooms', name: langReady ? t('navigation.rooms') : '', href: '/rooms', icon: GlobeAltIcon },
    { id: 'accounts', name: langReady ? t('navigation.accounts') : '', href: '/accounts', icon: UserGroupIcon },
    { id: 'proxies', name: langReady ? t('navigation.proxies') : '', href: '/proxies', icon: Cog6ToothIcon },
    { id: 'tasks', name: langReady ? t('navigation.tasks') : '', href: '/tasks', icon: ClockIcon },
    { id: 'analytics', name: langReady ? t('navigation.analytics') : '', href: '/analytics', icon: ChartBarIcon },
    { id: 'pricing', name: langReady ? t('navigation.pricing') : '', href: '/pricing', icon: CurrencyDollarIcon },
    { id: 'settings', name: langReady ? t('navigation.settings') : '', href: '/settings', icon: WrenchScrewdriverIcon },
  ]

  useEffect(() => {
    setIsClient(true)
    loadSettings()

    // Lắng nghe sự kiện storage change
    const handleStorageChange = async (e) => {
      if (e.key === 'amac-settings') {
        await loadSettings()
      }
    }

    // Lắng nghe sự kiện custom cho cùng tab
    const handleSettingsChange = async () => {
      await loadSettings()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('settings-changed', handleSettingsChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('settings-changed', handleSettingsChange)
    }
  }, [])

  const loadSettings = async () => {
    try {
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        const result = await window.tiktokAPI.getSettings()
        if (result.success && result.settings) {
          setSettings(result.settings)
          // Lưu settings vào localStorage để đồng bộ giữa các tab
          localStorage.setItem('amac-settings', JSON.stringify(result.settings))
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLangReady(true)
    }
  }, [])

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      setLangReady(true)
    }
    
    i18n.on('languageChanged', handleLanguageChange)
    return () => i18n.off('languageChanged', handleLanguageChange)
  }, [i18n])

  const handleThemeToggle = async () => {
    if (!isClient) return
    try {
      const newTheme = isDarkMode ? 'light' : 'dark'
      await changeTheme(newTheme)
    } catch (error) {
      console.error('Error toggling theme:', error)
    }
  }

  const handleLanguageChange = async (lang) => {
    if (!isClient) return
    
    try {
      await i18n.changeLanguage(lang)
      localStorage.setItem('amac-language', lang)
      setIsLanguageDropdownOpen(false)
      
      // Save to backend if available
      if (window.tiktokAPI) {
        await window.tiktokAPI.changeLanguage(lang)
      }
    } catch (error) {
      console.error('Error changing language:', error)
    }
  }

  const handleNavigation = (href) => {
    if (!isClient) return
    window.location.href = href
  }

  const handleAddRoom = () => {
    if (!isClient) return
    
    if (!hasValidLicense) {
      // Hiển thị toast hoặc alert khi không có license
      if (window.tiktokAPI) {
        window.tiktokAPI.showToast('error', t('license.errors.licenseRequired'));
      } else {
        alert(t('license.errors.licenseRequired'));
      }
      return;
    }
    
    window.location.href = '/rooms?action=add'
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-colors duration-200">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <img 
              src="/icons/app-icon.png" 
              alt={settings.app?.title || t('app.title')} 
              className="w-10 h-10 flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                {settings.app?.name === undefined || settings.app?.name === '' ? t('app.name') : settings.app.name}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-tight">
                {settings.app?.subtitle === undefined || settings.app?.subtitle === '' ? t('app.subtitle') : settings.app.subtitle}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {getNavItems().map((item) => {
            const Icon = item.icon
            const isActive = activePage === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.href)}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-100 ${
                  isActive
                    ? 'bg-tiktok-primary text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                } cursor-pointer`}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span className="font-medium text-left">{item.name}</span>
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <ClientOnly fallback={
            <button
              onClick={handleAddRoom}
              disabled={!hasValidLicense}
              className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg ${
                hasValidLicense
                  ? 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white'
                  : 'bg-gray-400 dark:bg-gray-600 text-gray-300 cursor-not-allowed'
              }`}
              title={!hasValidLicense ? t('license.errors.licenseRequired') : ''}
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              {t('rooms.add')}
            </button>
          }>
            <button
              onClick={handleAddRoom}
              disabled={!hasValidLicense}
              className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg ${
                hasValidLicense
                  ? 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white'
                  : 'bg-gray-400 dark:bg-gray-600 text-gray-300 cursor-not-allowed'
              }`}
              title={!hasValidLicense ? t('license.errors.licenseRequired') : ''}
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              {t('rooms.add')}
            </button>
          </ClientOnly>
          
          <ClientOnly fallback={
            <div className="mt-3 text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {t('rooms.quickManagement')}
              </div>
            </div>
          }>
            <div className="mt-3 text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {t('rooms.quickManagement')}
              </div>
            </div>
          </ClientOnly>
        </div>

        <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between space-x-2">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm flex items-center"
              >
                <LanguageIcon className="w-4 h-4" />
                <span className="ml-1 text-xs uppercase font-medium">{i18n.language}</span>
                <ChevronDownIcon className="w-3 h-3 ml-1" />
              </button>
              
              {isLanguageDropdownOpen && (
                <div className="absolute left-0 bottom-full mb-2 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50">
                  <button
                    onClick={() => handleLanguageChange('en')}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      i18n.language === 'en'
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    🇺🇸 English
                  </button>
                  <button
                    onClick={() => handleLanguageChange('zh')}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      i18n.language === 'zh'
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    🇨🇳 中文
                  </button>
                  <button
                    onClick={() => handleLanguageChange('ja')}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      i18n.language === 'ja'
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    🇯🇵 日本語
                  </button>
                  <button
                    onClick={() => handleLanguageChange('ko')}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      i18n.language === 'ko'
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    🇰🇷 한국어
                  </button>
                  <button
                    onClick={() => handleLanguageChange('th')}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      i18n.language === 'th'
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    🇹🇭 ไทย
                  </button>
                  <button
                    onClick={() => handleLanguageChange('fr')}
                    className={`w-full text-left px-3 py-2 text-sm rounded-b-lg transition-colors ${
                      i18n.language === 'fr'
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    🇫🇷 Français
                  </button>
                  <button
                    onClick={() => handleLanguageChange('vi')}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      i18n.language === 'vi'
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    🇻🇳 Tiếng Việt
                  </button>
                  
                </div>
              )}
            </div>

            <button
              onClick={handleThemeToggle}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
              title={langReady ? (isDarkMode ? t('lightMode') : t('darkMode')) : (isDarkMode ? 'Light Mode' : 'Dark Mode')}
            >
              {isDarkMode ? (
                <SunIcon className="w-4 h-4" />
              ) : (
                <MoonIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Click outside handler for language dropdown */}
        {isLanguageDropdownOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsLanguageDropdownOpen(false)}
          />
        )}
        
        {/* Header with UserProfile */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Left side - UpdateInfoPanel */}
            <div>
              <UpdateInfoPanel />
            </div>
            
            {/* Right side - UserProfile */}
            <div>
              <UserProfile />
            </div>
          </div>
        </div>
        
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900 theme-transition">
          {children}
        </main>
        
        {/* Update Notification - Fixed position overlay */}
        <UpdateNotification />
      </div>
    </div>
  )
}

// Update Info Panel Component - Compact notification button
const UpdateInfoPanel = () => {
  const { t } = useTranslation();
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    checkUpdateState();
    // Debug - Remove forced test mode
    // setTimeout(() => {
    //   if (!updateInfo) {
    //     console.log('🐛 Debug: Force showing update panel for testing');
    //     setUpdateInfo({
    //       currentVersion: '1.0.0',
    //       latestVersion: '1.0.1',
    //       releaseNotes: 'Debug test update',
    //       downloadUrl: 'test-url'
    //     });
    //     setDebugInfo('DEBUG MODE - Forced display');
    //   }
    // }, 2000);

    // Click outside to close tooltip
    const handleClickOutside = (event) => {
      if (!event.target.closest('.update-info-panel')) {
        setShowTooltip(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const checkUpdateState = async () => {
    try {
      // console.log('🔍 UpdateInfoPanel: Checking update state...');
      
      if (!window.tiktokAPI) {
        console.log('❌ tiktokAPI not available');
        setDebugInfo('tiktokAPI not available');
        return;
      }

      const hasUpdate = await window.tiktokAPI.hasActiveUpdate();
      // console.log('🔍 hasActiveUpdate result:', hasUpdate);
      setDebugInfo(`hasActiveUpdate: ${hasUpdate}`);
      
      if (hasUpdate) {
        const updateStateRes = await window.tiktokAPI.getUpdateState();
        const updateState = updateStateRes.data || {};
        // console.log('🔍 updateState:', updateState);
        setDebugInfo(`updateState: ${JSON.stringify(updateState)}`);
        
        if (updateState && updateState.hasUpdateAvailable && !updateState.updateDismissed) {
          const updateInfo = {
            currentVersion: updateState.currentVersion,
            latestVersion: updateState.latestVersion,
            releaseNotes: updateState.releaseNotes,
            downloadUrl: updateState.downloadUrl
          };
          setUpdateInfo(updateInfo);
          
          // 💾 Cache to localStorage for Settings page
          try {
            localStorage.setItem('ttl-update-state', JSON.stringify(updateState));
            // console.log('💾 UpdateInfoPanel: Cached update state to localStorage');
          } catch (error) {
            console.error('❌ Error caching to localStorage:', error);
          }
          
          // console.log('✅ UpdateInfoPanel: Update info set');
        } else {
          // console.log('⚠️ UpdateInfoPanel: Update dismissed or not available');
          setDebugInfo('Update dismissed or not available');
          
          // Clear localStorage if no active update
          try {
            localStorage.removeItem('ttl-update-state');
            // console.log('🗑️ UpdateInfoPanel: Cleared localStorage cache');
          } catch (error) {
            console.error('❌ Error clearing localStorage:', error);
          }
        }
      } else {
        // console.log('ℹ️ UpdateInfoPanel: No active update');
        setDebugInfo('No active update');
      }
    } catch (error) {
      console.error('❌ UpdateInfoPanel error:', error);
      setDebugInfo(`Error: ${error.message}`);
    }
  };

  const handleUpdateNow = async () => {
    if (!updateInfo) return;
    
    setIsLoading(true);
    try {
      const result = await window.tiktokAPI.downloadAndInstall(updateInfo.downloadUrl);
      if (result.success) {
        // console.log('Update download started');
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
      // Clear localStorage cache  
      try {
        localStorage.removeItem('ttl-update-state');
        // console.log('🗑️ UpdateInfoPanel: Cleared localStorage on dismiss');
      } catch (error) {
        console.error('❌ Error clearing localStorage on dismiss:', error);
      }
      setUpdateInfo(null);
      setShowTooltip(false); // Close tooltip after dismiss
    } catch (error) {
      console.error('Error dismissing update:', error);
    }
  };

  const handleButtonClick = (e) => {
    e.stopPropagation();
    if (updateInfo) {
      // If có update, click để toggle tooltip  
      setShowTooltip(!showTooltip);
    } else {
      // If không có update, click để check
      checkUpdateState();
    }
  };

  // Only show when có update thật
  const shouldShow = updateInfo;

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="relative update-info-panel">
      {/* Compact Update Notification Button */}
      <button
        onClick={handleButtonClick}
        disabled={isLoading}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d={updateInfo ? "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" : "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"} 
            />
          </svg>
        )}
        
        <span>
          {updateInfo 
            ? `v${updateInfo.latestVersion}` 
            : t('update.upToDate')
          }
        </span>
      </button>

      {/* Tooltip với thông tin chi tiết - Click-based */}
      {showTooltip && updateInfo && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
          {updateInfo ? (
            <>
              <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                {t('update.updateAvailable')}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                v{updateInfo.currentVersion} → v{updateInfo.latestVersion}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleUpdateNow}
                  disabled={isLoading}
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? t('update.downloading') : t('update.updateNow')}
                </button>
                <button
                  onClick={handleDismiss}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors px-2 py-1"
                >
                  {t('update.dismiss')}
                </button>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('debug.info')}: {debugInfo}
              <button 
                onClick={checkUpdateState}
                className="ml-2 text-xs bg-gray-600 text-white px-2 py-1 rounded"
              >
                {t('retry')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};