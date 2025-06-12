const { log, error } = require('../../lib/logger');
const notificationManager = require('../../lib/notification-manager');
const appState = require('../../lib/app-state');
const DeviceFingerprint = require('../../lib/device-fingerprint');

const settingsHandlers = (configManager) => {
  return {
    'get-settings': async () => {
      try {
        const settings = await configManager.getSettings()
        const defaultSettings = {
          theme: 'dark',
          language: 'en',
          autoSave: true,
          notifications: true,
          maxConcurrentViewers: 50,
          viewerDelay: 1000,
          autoReconnect: true,
          system: {
            autoUpdate: true,
            maxRoomsPerAccount: 1,
            accountCooldown: 60 // Mặc định là 60 giây
          },
          proxy: {
            maxAccountsPerProxy: 1
          },
          ...settings
        }
        
        // Đồng bộ với AppState
        appState.language = defaultSettings.language;
        appState.theme = defaultSettings.theme;
        appState.notifications = defaultSettings.notifications;
        
        return { success: true, settings: defaultSettings }
      } catch (err) {
        error('Error getting settings:', err)
        return { 
          success: false, 
          error: err.message,
          settings: {
            theme: 'dark',
            language: 'en',
            autoSave: true,
            notifications: true,
            maxConcurrentViewers: 50,
            viewerDelay: 1000,
            autoReconnect: true,
            system: {
              autoUpdate: true,
              maxRoomsPerAccount: 1,
              accountCooldown: 60
            },
            proxy: {
              maxAccountsPerProxy: 1
            }
          }
        }
      }
    },

    'save-settings': async (event, settings) => {
      try {
        // Lấy current settings trước để merge
        const currentSettings = await configManager.getSettings()
        
        // Merge với current settings và validate các field quan trọng
        const validatedSettings = {
          ...currentSettings,  // Current settings làm base
          ...settings,         // New settings sẽ ghi đè
          // Force validate các field quan trọng nếu có
          theme: settings.theme && ['light', 'dark', 'system'].includes(settings.theme) ? settings.theme : (currentSettings.theme || 'dark'),
          language: settings.language && ['vi', 'en', 'zh', 'ja', 'ko', 'th', 'fr'].includes(settings.language) ? settings.language : (currentSettings.language || 'vi'),
        }
        
        // Đồng bộ với AppState
        appState.language = validatedSettings.language;
        appState.theme = validatedSettings.theme;
        appState.notifications = validatedSettings.notifications;
        
        await configManager.saveSettings(validatedSettings)
        log('Settings saved:', 'validated:', validatedSettings, 'received:', settings)
        return { success: true, settings: validatedSettings }
      } catch (err) {
        error('Error saving settings:', err)
        return { success: false, error: err.message }
      }
    },

    'change-language': async (event, language) => {
      try {
        const currentSettings = await configManager.getSettings()
        const updatedSettings = { ...currentSettings, language }
        await configManager.saveSettings(updatedSettings)
        
        // Cập nhật ngôn ngữ trong AppState
        appState.language = language;
        
        log('Language changed to:', language)
        return { success: true, language }
      } catch (err) {
        error('Error changing language:', err)
        return { success: false, error: err.message }
      }
    },

    'change-theme': async (event, theme) => {
      try {
        const currentSettings = await configManager.getSettings()
        const updatedSettings = { ...currentSettings, theme }
        await configManager.saveSettings(updatedSettings)
        
        // Cập nhật theme trong AppState
        appState.theme = theme;
        
        log('Theme changed to:', theme)
        return { success: true, theme }
      } catch (err) {
        error('Error changing theme:', err)
        return { success: false, error: err.message }
      }
    },

    'get-available-languages': async () => {
      try {
        const languages = [
          { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
          { code: 'en', name: 'English', flag: '🇺🇸' },
          { code: 'zh', name: '中文', flag: '🇨🇳' },
          { code: 'ko', name: '한국어', flag: '🇰🇷' },
          { code: 'ja', name: '日本語', flag: '🇯🇵' },
          { code: 'th', name: 'ไทย', flag: '🇹🇭' }
        ]
        return { success: true, languages }
      } catch (err) {
        error('Error getting available languages:', err)
        return { success: false, error: err.message }
      }
    },

    'get-available-themes': async () => {
      try {
        const themes = [
          { 
            code: 'dark', 
            name: 'Dark Theme', 
            nameVi: 'Giao diện tối',
            description: 'Dark theme for better night viewing',
            descriptionVi: 'Giao diện tối phù hợp xem ban đêm'
          },
          { 
            code: 'light', 
            name: 'Light Theme', 
            nameVi: 'Giao diện sáng',
            description: 'Light theme for daylight viewing',
            descriptionVi: 'Giao diện sáng phù hợp ban ngày'
          },
          { 
            code: 'auto', 
            name: 'Auto Theme', 
            nameVi: 'Tự động',
            description: 'Automatically switch based on system preference',
            descriptionVi: 'Tự động chuyển theo hệ thống'
          }
        ]
        return { success: true, themes }
      } catch (err) {
        error('Error getting available themes:', err)
        return { success: false, error: err.message }
      }
    },

    'reset-settings': async () => {
      try {
        const defaultSettings = {
          theme: 'dark',
          language: 'vi',
          autoSave: true,
          notifications: true,
          maxConcurrentViewers: 50,
          viewerDelay: 1000,
          autoReconnect: true,
          system: {
            autoUpdate: true,
            maxRoomsPerAccount: 1,
            accountCooldown: 60
          },
          proxy: {
            maxAccountsPerProxy: 1
          }
        }
        await configManager.saveSettings(defaultSettings)
        log('Settings reset to default')
        return { success: true, settings: defaultSettings }
      } catch (err) {
        error('Error resetting settings:', err)
        return { success: false, error: err.message }
      }
    },

    'get-device-info': async () => {
      try {
        const deviceData = await DeviceFingerprint.getDeviceInfo();
        return { success: true, deviceInfo: deviceData };
      } catch (err) {
        error('Error getting device info:', err);
        return { success: false, error: err.message };
      }
    }
  }
}

module.exports = settingsHandlers