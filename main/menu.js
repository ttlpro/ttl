const { app, Menu, shell, BrowserWindow } = require('electron');
const { log } = require('../lib/logger');
const path = require('path');
const appState = require('../lib/app-state');
const fs = require('fs');

// Hàm tạo Menu với hỗ trợ đa ngôn ngữ
function createMenu() {
  // Đọc file translation dựa trên ngôn ngữ hiện tại
  const currentLanguage = appState.language || 'vi';
  const isProd = process.env.NODE_ENV === 'production';
  
  // Đọc file translation từ thư mục locales
  let translations = {};
  try {
    let translationPath;
    
    if (isProd) {
      // Trong môi trường production, đường dẫn tới thư mục locales trong extraResources
      const extraResourcesPath = path.join(process.resourcesPath, 'locales');
      translationPath = path.join(extraResourcesPath, currentLanguage, 'common.json');
      
      log(`🔍 Menu: Extra resources path: ${extraResourcesPath}`);
      log(`🔍 Menu: Platform: ${process.platform}`);
    } else {
      // Môi trường development
      translationPath = path.join(app.getAppPath(), 'renderer', 'locales', currentLanguage, 'common.json');
    }
    
    log(`🔍 Menu: Trying to load translations from: ${translationPath}`);
    
    if (fs.existsSync(translationPath)) {
      const data = fs.readFileSync(translationPath, 'utf8');
      translations = JSON.parse(data);
      log(`✅ Menu: Loaded ${currentLanguage} translations successfully`);
    } else {
      log(`❌ Menu: Translation file not found for ${currentLanguage} at ${translationPath}`);
      // Fallback to Vietnamese
      let fallbackPath;
      
      if (isProd) {
        // Trong môi trường production
        fallbackPath = path.join(process.resourcesPath, 'locales', 'vi', 'common.json');
      } else {
        // Môi trường development
        fallbackPath = path.join(app.getAppPath(), 'renderer', 'locales', 'vi', 'common.json');
      }
      
      log(`🔍 Menu: Trying fallback at: ${fallbackPath}`);
      
      if (fs.existsSync(fallbackPath)) {
        const fallbackData = fs.readFileSync(fallbackPath, 'utf8');
        translations = JSON.parse(fallbackData);
        log(`✅ Menu: Loaded fallback (vi) translations`);
      } else {
        log(`❌ Menu: Fallback translation file not found at ${fallbackPath}`);
      }
    }
  } catch (err) {
    log(`❌ Menu: Error loading translations: ${err.message}`);
    // Continue with empty translations object
  }
  
  // Helper function để lấy translation string
  const t = (key, params = {}) => {
    try {
      // Phân tách key
      const keyParts = key.split('.');
      let result = translations;
      
      // Duyệt qua các phần của key
      for (const part of keyParts) {
        if (result && result[part] !== undefined) {
          result = result[part];
        } else {
          return key; // Trả về key gốc nếu không tìm thấy dịch
        }
      }
      
      // Thay thế các tham số
      if (typeof result === 'string') {
        Object.keys(params).forEach(paramKey => {
          result = result.replace(`{${paramKey}}`, params[paramKey]);
        });
      }
      
      return result;
    } catch (err) {
      log(`❌ Menu: Translation error for key ${key}: ${err.message}`);
      return key;
    }
  };
  
  const appName = app.getName() || 'TTL TikTok Live';
  const isMac = process.platform === 'darwin';
  
  // Template cho menu
  const template = [
    // App menu (macOS only)
    ...(isMac ? [
      {
        label: appName,
        submenu: [
          { label: t('menu.app.about', { appName }), role: 'about' },
          { type: 'separator' },
          { label: t('menu.app.hide', { appName }), role: 'hide' },
          { label: t('menu.app.hideOthers', {}), role: 'hideOthers' },
          { label: t('menu.app.showAll', {}), role: 'unhide' },
          { type: 'separator' },
          { label: t('menu.app.quit', { appName }), role: 'quit' }
        ]
      }
    ] : []),
    
    // File Menu
    {
      label: t('menu.file.title'),
      submenu: [
        {
          label: t('menu.file.newRoom'),
          accelerator: 'CmdOrCtrl+N',
          click: async () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              // Check license before opening modal
              const hasLicense = await focusedWindow.webContents.executeJavaScript(`
                (async () => {
                  try {
                    const result = await window.tiktokAPI.authCheckStatus();
                    if (!result || !result.authenticated || !result.license || result.license.status !== 'active') {
                      return false;
                    }
                    if (result.license.expiresAt) {
                      const expiryDate = new Date(result.license.expiresAt);
                      if (expiryDate <= new Date()) {
                        return false;
                      }
                    }
                    return true;
                  } catch (error) {
                    return false;
                  }
                })()
              `);
              
              if (!hasLicense) {
                focusedWindow.webContents.executeJavaScript(`
                  if (typeof window.tiktokAPI?.showToast === 'function') {
                    window.tiktokAPI.showToast('error', '${t('license.errors.licenseRequired')}');
                  } else {
                    alert('${t('license.errors.licenseRequired')}');
                  }
                `);
                return;
              }
              
              // Trực tiếp gọi executeJavaScript để mở modal
              focusedWindow.webContents.executeJavaScript(
                "if (typeof window.openModal === 'function') { window.openModal('ADD_ROOM') }"
              );
            }
          }
        },
        { type: 'separator' },
        // {
        //   label: t('menu.file.newAccount'),
        //   accelerator: 'CmdOrCtrl+Shift+A',
        //   click: async () => {
        //     const focusedWindow = BrowserWindow.getFocusedWindow();
        //     if (focusedWindow) {
        //       // Trực tiếp gọi executeJavaScript để mở modal
        //       focusedWindow.webContents.executeJavaScript(
        //         "if (typeof window.openModal === 'function') { window.openModal('ADD_ACCOUNT') }"
        //       );
        //     }
        //   }
        // },
        {
          label: t('menu.file.importAccountsText'),
          accelerator: 'CmdOrCtrl+Shift+I',
          click: async () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              // Check license before opening modal
              const hasLicense = await focusedWindow.webContents.executeJavaScript(`
                (async () => {
                  try {
                    const result = await window.tiktokAPI.authCheckStatus();
                    if (!result || !result.authenticated || !result.license || result.license.status !== 'active') {
                      return false;
                    }
                    if (result.license.expiresAt) {
                      const expiryDate = new Date(result.license.expiresAt);
                      if (expiryDate <= new Date()) {
                        return false;
                      }
                    }
                    return true;
                  } catch (error) {
                    return false;
                  }
                })()
              `);
              
              if (!hasLicense) {
                focusedWindow.webContents.executeJavaScript(`
                  if (typeof window.tiktokAPI?.showToast === 'function') {
                    window.tiktokAPI.showToast('error', '${t('license.errors.licenseRequired')}');
                  } else {
                    alert('${t('license.errors.licenseRequired')}');
                  }
                `);
                return;
              }
              
              // Trực tiếp gọi executeJavaScript để mở modal
              focusedWindow.webContents.executeJavaScript(
                "if (typeof window.openModal === 'function') { window.openModal('IMPORT_ACCOUNT_TEXT') }"
              );
            }
          }
        },
        // { type: 'separator' },
        // {
        //   label: t('menu.file.newProxy'),
        //   accelerator: 'CmdOrCtrl+Shift+P',
        //   click: async () => {
        //     const focusedWindow = BrowserWindow.getFocusedWindow();
        //     if (focusedWindow) {
        //       // Trực tiếp gọi executeJavaScript để mở modal
        //       focusedWindow.webContents.executeJavaScript(
        //         "if (typeof window.openModal === 'function') { window.openModal('ADD_PROXY') }"
        //       );
        //     }
        //   }
        // },
        {
          label: t('menu.file.importProxiesText'),
          click: async () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              // Trực tiếp gọi executeJavaScript để mở modal
              focusedWindow.webContents.executeJavaScript(
                "if (typeof window.openModal === 'function') { window.openModal('IMPORT_PROXY_TEXT') }"
              );
            }
          }
        },
        { type: 'separator' },
        isMac ? { label: t('menu.file.close'), role: 'close' } : { label: t('menu.app.quit', { appName }), role: 'quit' }
      ]
    },
    
    // Edit menu
    {
      label: t('menu.edit.title'),
      submenu: [
        { label: t('menu.edit.undo'), role: 'undo' },
        { label: t('menu.edit.redo'), role: 'redo' },
        { type: 'separator' },
        { label: t('menu.edit.cut'), role: 'cut' },
        { label: t('menu.edit.copy'), role: 'copy' },
        { label: t('menu.edit.paste'), role: 'paste' },
        ...(isMac ? [
          { label: t('menu.edit.selectAll'), role: 'selectAll' },
          { type: 'separator' }
        ] : [
          { label: t('menu.edit.selectAll'), role: 'selectAll' }
        ])
      ]
    },
    
    // View menu
    {
      label: t('menu.view.title'),
      submenu: [
        { label: t('menu.view.reload'), role: 'reload' },
        // { label: t('menu.view.toggleDevTools'), role: 'toggleDevTools' },
        { type: 'separator' },
        { label: t('menu.view.resetZoom'), role: 'resetZoom' },
        { label: t('menu.view.zoomIn'), role: 'zoomIn' },
        { label: t('menu.view.zoomOut'), role: 'zoomOut' },
        { type: 'separator' },
        { label: t('menu.view.toggleFullscreen'), role: 'togglefullscreen' }
      ]
    },
    
    // Tools menu
    {
      label: t('menu.tools.title'),
      submenu: [
        {
          label: t('menu.tools.checkAllAccounts'),
          click: async () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.send('app:check-all-accounts');
            }
          }
        },
        {
          label: t('menu.tools.checkAllProxies'),
          click: async () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.send('app:check-all-proxies');
            }
          }
        },
        { type: 'separator' },
        {
          label: t('menu.tools.clearCache'),
          click: async () => {
            const session = BrowserWindow.getFocusedWindow()?.webContents?.session;
            if (session) {
              await session.clearCache();
              await session.clearStorageData();
              BrowserWindow.getFocusedWindow()?.reload();
            }
          }
        },
        { type: 'separator' },
        {
          label: t('menu.tools.exportData'),
          click: async () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.send('app:export-data');
            }
          }
        },
        {
          label: t('menu.tools.importData'),
          click: async () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.send('app:import-data');
            }
          }
        }
      ]
    },
    
    // Window menu
    {
      label: t('menu.window.title'),
      role: 'window',
      submenu: [
        { label: t('menu.window.minimize'), role: 'minimize' },
        { label: t('menu.window.zoom'), role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { label: t('menu.window.front'), role: 'front' }
        ] : [])
      ]
    },
    
    // Help menu
    {
      label: t('menu.help.title'),
      role: 'help',
      submenu: [
        {
          label: t('menu.help.documentation'),
          click: async () => {
            await shell.openExternal('https://amac.ai/docs');
          }
        },
        {
          label: t('menu.help.reportIssue'),
          click: async () => {
            await shell.openExternal('https://amac.ai/support');
          }
        },
        {
          label: t('menu.help.checkForUpdates'),
          click: async () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.send('app:check-for-updates');
            }
          }
        },
        { type: 'separator' },
        ...(isMac ? [] : [
          {
            label: t('menu.help.about'),
            click: async () => {
              const focusedWindow = BrowserWindow.getFocusedWindow();
              if (focusedWindow) {
                focusedWindow.webContents.send('app:show-about');
              }
            }
          }
        ])
      ]
    }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  
  return menu;
}

// Đăng ký lắng nghe sự kiện thay đổi ngôn ngữ
function setupMenuLocalization() {
  appState.addListener('language', (language) => {
    log(`🌐 Menu: Language changed to ${language}, updating menu`);
    createMenu();
  });
}

module.exports = {
  createMenu,
  setupMenuLocalization
}; 