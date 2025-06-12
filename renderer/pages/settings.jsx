import React, { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import StaticLayout from '../components/StaticLayout'
import ClientOnly from '../components/ClientOnly'
import { useTheme } from '../contexts/ThemeContext'
import { useTranslation } from 'react-i18next'
import { 
  LanguageIcon, 
  SunIcon, 
  MoonIcon, 
  ComputerDesktopIcon,
  BellIcon,
  ShieldCheckIcon,
  KeyIcon,
  ClockIcon,
  ArrowPathIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import Toggle from '../components/Toggle'
import { getSuccessMessage, getErrorMessage, handleApiError } from '../utils/apiMessages'
import toast from 'react-hot-toast'
import UpdateManager from '../components/UpdateManager'

const defaultSettings = {
  language: 'en',
  theme: 'system',
  app: {
    title: '',
    name: '',
    subtitle: ''
  },
  notifications: {
    enabled: true,
    sound: true,
    desktop: true
  },
  security: {
    twoFactor: false,
    sessionTimeout: 30
  },
  system: {
    autoUpdate: true,
    maxRoomsPerAccount: 1,
    accountCooldown: 60
  },
  proxy: {
    maxAccountsPerProxy: 1
  }
}

export default function SettingsPage() {
  const { t } = useTranslation('common')
  const { theme, setTheme, changeTheme } = useTheme()
  const [settings, setSettings] = useState(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [debouncedSettings, setDebouncedSettings] = useState(null)
  const [deviceInfo, setDeviceInfo] = useState(null)

  useEffect(() => {
    loadSettings()
    loadDeviceInfo()
  }, [])

  const loadSettings = async () => {
    try {
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        const result = await window.tiktokAPI.getSettings()
        if (result.success && result.settings) {
          // Merge với default settings để đảm bảo có đầy đủ các trường
          setSettings({
            ...defaultSettings,
            ...result.settings,
            notifications: {
              ...defaultSettings.notifications,
              ...(result.settings.notifications || {})
            },
            security: {
              ...defaultSettings.security,
              ...(result.settings.security || {})
            },
            system: {
              ...defaultSettings.system,
              ...(result.settings.system || {})
            },
            proxy: {
              ...defaultSettings.proxy,
              ...(result.settings.proxy || {})
            }
          })
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error(handleApiError(error))
    } finally {
      setIsLoading(false)
    }
  }

  const loadDeviceInfo = async () => {
    try {
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        const result = await window.tiktokAPI.getDeviceInfo()
        if (result.success && result.deviceInfo) {
          // Thêm thông tin về platform/arch từ DeviceFingerprint
          const deviceData = result.deviceInfo
          if (!deviceData.deviceInfo.platform) {
            deviceData.deviceInfo.platform = window.navigator.platform
          }
          if (!deviceData.deviceInfo.arch) {
            deviceData.deviceInfo.arch = navigator.userAgent.includes('x64') ? 'x64' : 
              navigator.userAgent.includes('Win64') ? 'x64' : 
              navigator.userAgent.includes('x86_64') ? 'x64' : 'x86'
          }
          setDeviceInfo(deviceData)
        }
      }
    } catch (error) {
      console.error('Error loading device info:', error)
    }
  }

  const handleLanguageChange = async (lang) => {
    try {
      // Lưu vào localStorage trước
      localStorage.setItem('amac-language', lang);

      // Cập nhật i18next language
      if (typeof window !== 'undefined' && window.i18n) {
        await window.i18n.changeLanguage(lang);
      }

      // Trigger storage event manually vì localStorage.setItem không trigger event trên cùng tab
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'amac-language',
        newValue: lang,
        oldValue: settings.language,
        storageArea: localStorage
      }));

      // Save to backend
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        const result = await window.tiktokAPI.saveSettings({
          ...settings,
          language: lang
        })
        if (result.success) {
          setSettings(prev => ({ ...prev, language: lang }))
          toast.success(getSuccessMessage('languageChanged'))
        } else {
          // Chỉ hiện thông báo lỗi, không revert ngôn ngữ
          toast.error(handleApiError({ message: 'Failed to save language setting' }))
        }
      }
    } catch (error) {
      console.error('Error changing language:', error)
      // Chỉ hiện thông báo lỗi, không revert ngôn ngữ
      toast.error(handleApiError(error))
    }
  }

  const handleThemeChange = async (newTheme) => {
    try {
      // Sử dụng changeTheme từ context để đảm bảo đồng bộ
      await changeTheme(newTheme);
      toast.success(getSuccessMessage('themeChanged'));
    } catch (error) {
      console.error('Error changing theme:', error);
      toast.error(handleApiError(error));
    }
  }

  const handleNotificationChange = async (key, value) => {
    try {
      // Gọi API backend để bật/tắt thông báo desktop
      if (key === 'desktop') {
        const result = await window.tiktokAPI.toggleNotifications(value);
        if (!result.success) {
          toast.error(handleApiError(result.error || 'Không thể thay đổi cài đặt thông báo'));
          return;
        }
      }
      
      // Gọi API backend để bật/tắt âm thanh thông báo
      if (key === 'sound') {
        const result = await window.tiktokAPI.toggleNotificationSound(value);
        if (!result.success) {
          toast.error(handleApiError(result.error || 'Không thể thay đổi cài đặt âm thanh thông báo'));
          return;
        }
      }

      if (typeof window !== 'undefined' && window.tiktokAPI) {
        const newSettings = {
          ...settings,
          notifications: {
            ...settings.notifications,
            [key]: value
          }
        }
        const result = await window.tiktokAPI.saveSettings(newSettings)
        if (result.success) {
          setSettings(newSettings)
          toast.success(getSuccessMessage('settingsSaved'))
        }
      }
    } catch (error) {
      console.error('Error updating notification settings:', error)
      toast.error(handleApiError(error))
    }
  }

  const handleSecurityChange = async (key, value) => {
    try {
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        const newSettings = {
          ...settings,
          security: {
            ...settings.security,
            [key]: value
          }
        }
        const result = await window.tiktokAPI.saveSettings(newSettings)
        if (result.success) {
          setSettings(newSettings)
          toast.success(getSuccessMessage('settingsSaved'))
        }
      }
    } catch (error) {
      console.error('Error updating security settings:', error)
      toast.error(handleApiError(error))
    }
  }

  const handleSystemChange = async (key, value) => {
    try {
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        const newSettings = {
          ...settings,
          system: {
            ...settings.system,
            [key]: value
          }
        }
        const result = await window.tiktokAPI.saveSettings(newSettings)
        if (result.success) {
          setSettings(newSettings)
          toast.success(getSuccessMessage('settingsSaved'))
        }
      }
    } catch (error) {
      console.error('Error updating system settings:', error)
      toast.error(handleApiError(error))
    }
  }

  const handleProxyChange = async (key, value) => {
    try {
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        const newSettings = {
          ...settings,
          proxy: {
            ...settings.proxy,
            [key]: value
          }
        }
        const result = await window.tiktokAPI.saveSettings(newSettings)
        if (result.success) {
          setSettings(newSettings)
          toast.success(getSuccessMessage('settingsSaved'))
        }
      }
    } catch (error) {
      console.error('Error updating proxy settings:', error)
      toast.error(handleApiError(error))
    }
  }

  const handleResetSettings = async () => {
    try {
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        const result = await window.tiktokAPI.resetSettings()
        if (result.success) {
          setSettings(defaultSettings)
          // Lưu vào localStorage và emit event
          localStorage.setItem('amac-settings', JSON.stringify(defaultSettings))
          window.dispatchEvent(new Event('settings-changed'))
          toast.success(getSuccessMessage('settingsReset'))
        }
      }
    } catch (error) {
      console.error('Error resetting settings:', error)
      toast.error(handleApiError(error))
    }
  }

  // Debounce function
  const debounce = (func, wait) => {
    let timeout
    return (...args) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  // Tạo debounced save function một lần duy nhất
  const debouncedSave = useCallback(
    debounce(async (newSettings) => {
      try {
        if (typeof window !== 'undefined' && window.tiktokAPI) {
          const result = await window.tiktokAPI.saveSettings(newSettings)
          if (result.success) {
            // Chỉ lưu vào localStorage và emit event
            localStorage.setItem('amac-settings', JSON.stringify(newSettings))
            window.dispatchEvent(new Event('settings-changed'))
            toast.success(getSuccessMessage('settingsSaved'))
          }
        }
      } catch (error) {
        console.error('Error updating app settings:', error)
        toast.error(handleApiError(error))
      }
    }, 200),
    [] // Empty dependencies array ensures the debounced function is created only once
  )

  // Simplified handleAppSettingChange
  const handleAppSettingChange = (key, value) => {
    // Cập nhật UI ngay lập tức với giá trị mới
    const newSettings = {
      ...settings,
      app: {
        ...settings.app,
        [key]: value
      }
    }
    
    // Cập nhật state ngay lập tức
    setSettings(prevSettings => ({
      ...prevSettings,
      app: {
        ...prevSettings.app,
        [key]: value
      }
    }))

    // Debounce việc lưu vào database
    debouncedSave(newSettings)
  }

  // Thêm hàm gửi thông báo thử nghiệm
  const handleSendTestNotification = async () => {
    try {
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        const result = await window.tiktokAPI.sendTestNotification();
        if (result.success && result.sent) {
          toast.success(t('settings.notifications.testSent'));
        } else {
          toast.error(t('settings.notifications.testFailed'));
        }
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error(handleApiError(error));
    }
  }

  // Render phần App Settings
  const renderAppSettings = () => {
    // Đảm bảo giá trị mặc định là chuỗi rỗng nếu undefined
    const appTitle = settings.app?.title || ''
    const appName = settings.app?.name || ''
    const appSubtitle = settings.app?.subtitle || ''

    return (
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <InformationCircleIcon className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400" />
          {t('settings.app.title')}
        </h3>
        <div className="space-y-4">
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('app.titleLabel')}
              </label>
              <input
                type="text"
                value={appTitle}
                onChange={(e) => handleAppSettingChange('title', e.target.value)}
                placeholder={t('app.title')}
                className="input-field"
              />
              <p className="mt-1 text-sm text-gray-500">
                {t('settings.app.titleDescription')}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('app.nameLabel')}
              </label>
              <input
                type="text"
                value={appName}
                onChange={(e) => handleAppSettingChange('name', e.target.value)}
                placeholder={t('app.name')}
                className="input-field"
              />
              <p className="mt-1 text-sm text-gray-500">
                {t('settings.app.nameDescription')}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('app.subtitleLabel')}
              </label>
              <input
                type="text"
                value={appSubtitle}
                onChange={(e) => handleAppSettingChange('subtitle', e.target.value)}
                placeholder={t('app.subtitle')}
                className="input-field"
              />
              <p className="mt-1 text-sm text-gray-500">
                {t('settings.app.subtitleDescription')}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Thêm vào phần render notifications
  const renderNotificationsSettings = () => {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-start mb-4">
        <BellIcon className="w-6 h-6 mr-2 text-pink-600 dark:text-pink-400" />
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('settings.notifications.title')}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              {t('settings.notifications.description')}
            </p>
          </div>
        </div>
        
        <div className="space-y-6 mt-6">
          <SettingRow
            title={t('settings.notifications.desktop')}
            description={t('settings.notifications.desktopDescription')}
          >
            <Toggle
              enabled={settings.notifications.desktop}
              onChange={(enabled) => handleNotificationChange('desktop', enabled)}
            />
          </SettingRow>
          
          <SettingRow
            title={t('settings.notifications.sound.title')}
            description={t('settings.notifications.sound.description')}
          >
            <Toggle
              enabled={settings.notifications.sound}
              onChange={(enabled) => handleNotificationChange('sound', enabled)}
            />
          </SettingRow>

          <SettingRow
            title={t('settings.notifications.test')}
            description={t('settings.notifications.testDescription')}
          >
            <button
              onClick={handleSendTestNotification}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm"
              disabled={!settings.notifications.desktop}
            >
              {t('settings.notifications.sendTest')}
            </button>
          </SettingRow>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <StaticLayout activePage="settings">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </StaticLayout>
    )
  }

  return (
    <StaticLayout activePage="settings">
      <Head>
        <title>{`${t('settings.title')} - ${settings?.app?.title || t('app.title')}`}</title>
      </Head>
      
      <ClientOnly fallback={
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2 w-48"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-64"></div>
            </div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4 w-32"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4 w-full"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
            </div>
          ))}
        </div>
      }>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{t('settings.description')}</p>
            </div>
            <button
              onClick={handleResetSettings}
              className="btn-secondary flex items-center"
            >
              <ArrowPathIcon className="w-5 h-5 mr-2" />
              {t('settings.resetToDefault')}
            </button>
          </div>
          {renderAppSettings()}

          {/* Language Settings */}
          <div className="card p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <LanguageIcon className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
              {t('settings.language.title')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{t('settings.language.description')}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <button
                onClick={() => handleLanguageChange('en')}
                className={`btn ${settings.language === 'en' ? 'btn-primary' : 'btn-secondary'} text-sm`}
              >
                🇺🇸 {t('settings.language.english')}
              </button>
              <button
                onClick={() => handleLanguageChange('zh')}
                className={`btn ${settings.language === 'zh' ? 'btn-primary' : 'btn-secondary'} text-sm`}
              >
                🇨🇳 {t('settings.language.chinese')}
              </button>
              <button
                onClick={() => handleLanguageChange('ja')}
                className={`btn ${settings.language === 'ja' ? 'btn-primary' : 'btn-secondary'} text-sm`}
              >
                🇯🇵 {t('settings.language.japanese')}
              </button>
              <button
                onClick={() => handleLanguageChange('ko')}
                className={`btn ${settings.language === 'ko' ? 'btn-primary' : 'btn-secondary'} text-sm`}
              >
                🇰🇷 {t('settings.language.korean')}
              </button>
              <button
                onClick={() => handleLanguageChange('th')}
                className={`btn ${settings.language === 'th' ? 'btn-primary' : 'btn-secondary'} text-sm`}
              >
                🇹🇭 {t('settings.language.thai')}
              </button>
              <button
                onClick={() => handleLanguageChange('fr')}
                className={`btn ${settings.language === 'fr' ? 'btn-primary' : 'btn-secondary'} text-sm`}
              >
                🇫🇷 {t('settings.language.french')}
              </button>
              <button
                onClick={() => handleLanguageChange('vi')}
                className={`btn ${settings.language === 'vi' ? 'btn-primary' : 'btn-secondary'} text-sm`}
              >
                🇻🇳 {t('settings.language.vietnamese')}
              </button>
              
            </div>
          </div>

          {renderNotificationsSettings()}
          {/* Theme Settings */}
          <div className="card p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <SunIcon className="w-6 h-6 mr-2 text-yellow-600 dark:text-yellow-400" />
              {t('settings.theme.title')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{t('settings.theme.description')}</p>
            <div className="flex space-x-4">
              <button
                onClick={() => handleThemeChange('light')}
                className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
              >
                <SunIcon className="w-5 h-5 mr-2" />
                {t('settings.theme.light')}
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
              >
                <MoonIcon className="w-5 h-5 mr-2" />
                {t('settings.theme.dark')}
              </button>
              <button
                onClick={() => handleThemeChange('system')}
                className={`btn ${theme === 'system' ? 'btn-primary' : 'btn-secondary'}`}
              >
                <ComputerDesktopIcon className="w-5 h-5 mr-2" />
                {t('settings.theme.system')}
              </button>
            </div>
          </div>
          
          {/* Security Settings */}
          <div className="card p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <ShieldCheckIcon className="w-6 h-6 mr-2 text-green-600 dark:text-green-400" />
              {t('settings.security.title')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{t('settings.security.description')}</p>
            <div className="space-y-4">
              <SettingRow
                title={t('settings.security.twoFactor.title')}
                description={t('settings.security.twoFactor.description')}
              >
                <Toggle 
                  checked={settings.security.twoFactor}
                  onChange={(value) => handleSecurityChange('twoFactor', value)}
                />
              </SettingRow>
              <SettingRow
                title={t('settings.security.sessionTimeout.title')}
                description={t('settings.security.sessionTimeout.description')}
              >
                <select
                  value={settings.security.sessionTimeout}
                  onChange={(e) => handleSecurityChange('sessionTimeout', parseInt(e.target.value))}
                  className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={15}>15 {t('settings.security.sessionTimeout.minutes')}</option>
                  <option value={30}>30 {t('settings.security.sessionTimeout.minutes')}</option>
                  <option value={60}>60 {t('settings.security.sessionTimeout.minutes')}</option>
                  <option value={120}>120 {t('settings.security.sessionTimeout.minutes')}</option>
                </select>
              </SettingRow>
            </div>
          </div>

          {/* System Settings */}
          <div className="card p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <ComputerDesktopIcon className="w-6 h-6 mr-2 text-purple-600 dark:text-purple-400" />
              {t('settings.system.title')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{t('settings.system.description')}</p>
            <div className="space-y-4">
              <SettingRow
                title={t('settings.system.autoUpdate.title')}
                description={t('settings.system.autoUpdate.description')}
              >
                <Toggle 
                  checked={settings.system.autoUpdate}
                  onChange={(value) => handleSystemChange('autoUpdate', value)}
                />
              </SettingRow>
              
              <SettingRow
                title={t('settings.system.maxRoomsPerAccount.title')}
                description={t('settings.system.maxRoomsPerAccount.description')}
              >
                <select
                  value={settings.system?.maxRoomsPerAccount || 1}
                  onChange={(e) => handleSystemChange('maxRoomsPerAccount', parseInt(e.target.value))}
                  className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                  <option value={6}>6</option>
                  <option value={7}>7</option>
                  <option value={8}>8</option>
                  <option value={9}>9</option>
                  <option value={10}>10</option>
                </select>
              </SettingRow>
              
              <SettingRow
                title={t('settings.system.accountCooldown.title')}
                description={t('settings.system.accountCooldown.description')}
              >
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    max="3600"
                    value={settings.system?.accountCooldown || 0}
                    onChange={(e) => handleSystemChange('accountCooldown', parseInt(e.target.value) || 0)}
                    className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-24"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    {settings.system?.accountCooldown === 0 
                      ? t('settings.system.accountCooldown.disabled') 
                      : `${settings.system?.accountCooldown} ${t('settings.system.accountCooldown.seconds')}`}
                  </span>
                </div>
              </SettingRow>
            </div>
          </div>

          {/* Proxy Settings */}
          <div className="card p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <ShieldCheckIcon className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
              {t('settings.proxy.title')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{t('settings.proxy.description')}</p>
            <div className="space-y-4">
              <SettingRow
                title={t('settings.proxy.maxAccountsPerProxy.title')}
                description={t('settings.proxy.maxAccountsPerProxy.description')}
              >
                <select
                  value={settings.proxy?.maxAccountsPerProxy || 1}
                  onChange={(e) => handleProxyChange('maxAccountsPerProxy', parseInt(e.target.value))}
                  className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                </select>
              </SettingRow>
            </div>
          </div>

          {/* About Section */}
          <div className="card p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <InformationCircleIcon className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
              {t('settings.about.title')}
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{t('settings.about.version')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">1.0.0</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{t('settings.about.license')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">MIT</p>
              </div>
              {/* Team Information */}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{t('settings.about.teamTitle')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.about.teamMembers')}</p>
              </div>
              
              {/* Device Information */}
              {deviceInfo && (
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{t('settings.about.deviceInfo')}</p>
                  <div className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <p>ID: {deviceInfo.deviceId ? deviceInfo.deviceId: 'N/A'}</p>
                    <p>{t('settings.about.platform')}: {deviceInfo.deviceInfo.platform || 'N/A'}</p>
                    <p>{t('settings.about.architecture')}: {deviceInfo.deviceInfo.arch || 'N/A'}</p>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500 dark:text-gray-400 pt-2">{t('settings.about.licenseText')}</p>
            </div>
          </div>

          {/* Auto-Update Section */}
          <UpdateManager />
        </div>
      </ClientOnly>
    </StaticLayout>
  )
}

// Helper component for settings rows
function SettingRow({ title, description, children }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      {children}
    </div>
  )
}
