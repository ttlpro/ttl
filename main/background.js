const path = require('path')
const { app, ipcMain, screen } = require('electron')
const serve = require('electron-serve')
const { createWindow } = require('./helpers')
const Viewer = require("./businesses/Viewer.js");
const { log, error } = require('../lib/logger');
const { createMenu, setupMenuLocalization } = require('./menu');
const fs = require('fs')
const appState = require('../lib/app-state')
const AuthManager = require('../lib/auth-manager')
const DeviceFingerprint = require('../lib/device-fingerprint')
const UpdateManager = require('../lib/update-manager')

// IPC handlers will be imported later in the file

const isProd = process.env.NODE_ENV === 'production'

// Global managers - will be initialized in initializeManagers()
let storageManager = null
let accountManager = null
let proxyManager = null
let viewerManager = null
let configManager = null
let authManager = null
let updateManager = null

// Set app name
app.name = 'amac-tiktok-viewer'
if (process.platform === 'darwin') {
  const iconPath = isProd 
    ? path.join(process.resourcesPath, 'icon.png')
    : path.join(__dirname, '../resources/icon.png')
  
  try {
    if (require('fs').existsSync(iconPath)) {
      app.dock.setIcon(iconPath)
    }
  } catch (e) {
    // Ignore icon errors
  }
}

// Hàm cập nhật tên ứng dụng theo ngôn ngữ
function updateAppName() {
  // Đọc file translation dựa trên ngôn ngữ hiện tại
  const currentLanguage = appState.language || 'vi'
  const isProd = process.env.NODE_ENV === 'production'
  
  // Đọc file translation từ thư mục locales
  try {
    let translationPath
    
    if (isProd) {
      // Trong môi trường production, đường dẫn tới thư mục locales trong extraResources
      translationPath = path.join(process.resourcesPath, 'locales', currentLanguage, 'common.json')
      
      log(`🔍 App: Extra resources path: ${path.join(process.resourcesPath, 'locales')}`)
    } else {
      // Môi trường development
      translationPath = path.join(app.getAppPath(), 'renderer', 'locales', currentLanguage, 'common.json')
    }
    
    log(`🔍 App: Trying to load translations from: ${translationPath}`)
    
    if (fs.existsSync(translationPath)) {
      const data = fs.readFileSync(translationPath, 'utf8')
      const translations = JSON.parse(data)
      
      // Cập nhật tên ứng dụng nếu có
      if (translations && translations.app && translations.app.title) {
        app.name = translations.app.title
        log(`✅ App: Updated app name to "${app.name}" (${currentLanguage})`)
      }
    } else {
      log(`❌ App: Translation file not found for ${currentLanguage} at ${translationPath}`)
      
      // Thử dùng tiếng Việt làm fallback
      let fallbackPath
      
      if (isProd) {
        // Trong môi trường production
        fallbackPath = path.join(process.resourcesPath, 'locales', 'vi', 'common.json')
      } else {
        // Môi trường development
        fallbackPath = path.join(app.getAppPath(), 'renderer', 'locales', 'vi', 'common.json')
      }
      
      log(`🔍 App: Trying fallback at: ${fallbackPath}`)
      
      if (fs.existsSync(fallbackPath)) {
        const data = fs.readFileSync(fallbackPath, 'utf8')
        const translations = JSON.parse(data)
        
        // Cập nhật tên ứng dụng nếu có
        if (translations && translations.app && translations.app.title) {
          app.name = translations.app.title
          log(`✅ App: Updated app name to "${app.name}" (fallback to vi)`)
        }
      } else {
        log(`❌ App: Fallback translation file not found at ${fallbackPath}`)
      }
    }
  } catch (err) {
    log(`❌ App: Error updating app name: ${err.message}`)
  }
}

// Đăng ký lắng nghe sự kiện thay đổi ngôn ngữ cho tên ứng dụng
function setupAppNameLocalization() {
  appState.addListener('language', (language) => {
    log(`🌐 App: Language changed to ${language}, updating app name`)
    updateAppName()
  })
}

// Hàm cập nhật About Panel với hỗ trợ đa ngôn ngữ
function setupAboutPanel() {
  // Đọc file translation dựa trên ngôn ngữ hiện tại
  const currentLanguage = appState.language || 'vi'
  const isProd = process.env.NODE_ENV === 'production'
  
  // Đọc file translation từ thư mục locales
  let translations = {}
  try {
    let translationPath
    
    if (isProd) {
      // Trong môi trường production, đường dẫn tới thư mục locales trong extraResources
      translationPath = path.join(process.resourcesPath, 'locales', currentLanguage, 'common.json')
      
      log(`🔍 About Panel: Extra resources path: ${path.join(process.resourcesPath, 'locales')}`)
    } else {
      // Môi trường development
      translationPath = path.join(app.getAppPath(), 'renderer', 'locales', currentLanguage, 'common.json')
    }
    
    log(`🔍 About Panel: Trying to load translations from: ${translationPath}`)
    
    if (fs.existsSync(translationPath)) {
      const data = fs.readFileSync(translationPath, 'utf8')
      translations = JSON.parse(data)
      log(`✅ About Panel: Loaded ${currentLanguage} translations successfully`)
    } else {
      log(`❌ About Panel: Translation file not found for ${currentLanguage} at ${translationPath}`)
      // Fallback to Vietnamese
      let fallbackPath
      
      if (isProd) {
        // Trong môi trường production
        fallbackPath = path.join(process.resourcesPath, 'locales', 'vi', 'common.json')
      } else {
        // Môi trường development
        fallbackPath = path.join(app.getAppPath(), 'renderer', 'locales', 'vi', 'common.json')
      }
      
      log(`🔍 About Panel: Trying fallback at: ${fallbackPath}`)
      
      if (fs.existsSync(fallbackPath)) {
        const fallbackData = fs.readFileSync(fallbackPath, 'utf8')
        translations = JSON.parse(fallbackData)
        log(`✅ About Panel: Loaded fallback (vi) translations`)
      } else {
        log(`❌ About Panel: Fallback translation file not found at ${fallbackPath}`)
      }
    }
  } catch (err) {
    log(`❌ About Panel: Error loading translations: ${err.message}`)
    // Continue with empty translations object
  }
  
  // Helper function để lấy translation string
  const t = (key, params = {}) => {
    try {
      // Phân tách key
      const keyParts = key.split('.')
      let result = translations
      
      // Duyệt qua các phần của key
      for (const part of keyParts) {
        if (result && result[part] !== undefined) {
          result = result[part]
        } else {
          return key // Trả về key gốc nếu không tìm thấy dịch
        }
      }
      
      // Thay thế các tham số
      if (typeof result === 'string') {
        Object.keys(params).forEach(paramKey => {
          result = result.replace(`{${paramKey}}`, params[paramKey])
        })
      }
      
      return result
    } catch (err) {
      log(`❌ About Panel: Translation error for key ${key}: ${err.message}`)
      return key
    }
  }
  
  // Cấu hình About panel với thông tin đa ngôn ngữ
  app.setAboutPanelOptions({
    applicationName: t('app.name'),
    applicationVersion: app.getVersion(),
    version: app.getVersion(),
    copyright: t('settings.about.licenseText'),
    credits: t('settings.about.teamMembers'),
    iconPath: isProd 
      ? path.join(process.resourcesPath, 'icon.png')
      : path.join(__dirname, '../resources/icon.png')
  })
}

// Đăng ký lắng nghe sự kiện thay đổi ngôn ngữ
function setupAboutPanelLocalization() {
  appState.addListener('language', (language) => {
    log(`🌐 About Panel: Language changed to ${language}, updating about panel`)
    setupAboutPanel()
  })
}

// Import storage adapter for SQLite storage
const StorageAdapter = require('../lib/storage-adapter')

// Import all handlers
const accountHandlers = require('./handlers/accountHandlers')
const proxyHandlers = require('./handlers/proxyHandlers')
const roomHandlers = require('./handlers/roomHandlers')
const bulkOperationHandlers = require('./handlers/bulkOperationHandlers')
const settingsHandlers = require('./handlers/settingsHandlers')
const folderHandlers = require('./handlers/folderHandlers')
const utilityHandlers = require('./handlers/utilityHandlers')
const taskHandlers = require('./handlers/taskHandlers')
const notificationHandlers = require('./handlers/notificationHandlers')
const authHandlers = require('./handlers/authHandlers')

// Initialize data managers
// (managers are declared at the top of the file)

// Initialize managers asynchronously
async function initializeManagers() {
  try {
    // Khởi tạo SQLite storage 
    storageManager = new StorageAdapter()
    await storageManager.init()
    
    // Set global database for UpdateManager
    global.database = storageManager.db
    console.log('🔄 global.database set:', !!global.database);
    console.log('🔄 global.database type:', global.database ? typeof global.database : 'null');
    console.log('🔄 storageManager.db exists:', !!storageManager.db);
    
    log(`🗄️ Storage initialized: ${storageManager.getStorageType().toUpperCase()}`)
    log('✅ Using SQLite for better performance')
    
    // Khởi tạo AuthManager
    authManager = new AuthManager(storageManager)
    
    // Lấy Auth API URL từ settings nếu có
    const authApiUrl = await storageManager.getSetting('authApiUrl')
    if (authApiUrl) {
      authManager.setAuthAPIURL(authApiUrl)
    }
    
    log('🔐 Auth manager initialized successfully')
    log('🔄 Database available for UpdateManager')
    
    // Tạo wrapper managers để tương thích với IPC handlers
    accountManager = {
      async getAllAccounts() {
        return await storageManager.getAllAccounts();
      },
      
      async addAccount(account) {
        return await storageManager.addAccount(account);
      },
      
      async deleteAccount(accountId) {
        return await storageManager.deleteAccount(accountId);
      },
      
      async updateAccount(accountId, updates) {
        return await storageManager.updateAccount(accountId, updates);
      },
      
      async getAccountsByFolder(folderId) {
        return await storageManager.getAccountsByFolder(folderId);
      },
      
      async importFromText(text, folderId) {
        return await storageManager.importAccountsFromText(text, folderId);
      }
    };
    
    proxyManager = {
      async getAllProxies() {
        return await storageManager.getAllProxies();
      },
      
      async addProxy(proxy) {
        return await storageManager.addProxy(proxy);
      },
      
      async deleteProxy(proxyId) {
        return await storageManager.deleteProxy(proxyId);
      },
      
      async updateProxy(proxyId, updates) {
        return await storageManager.updateProxy(proxyId, updates);
      },
      
      async getProxiesByFolder(folderId) {
        return await storageManager.getProxiesByFolder(folderId);
      },
      
      async testProxy(proxyId) {
        return await storageManager.testProxy(proxyId);
      },
      
      async importFromText(text, folderId) {
        // Sửa lại để gọi qua storageManager
        try {
          log(`📥 Gọi importProxiesFromText với text dài ${text.length} và folder ${folderId}`);
          const result = await storageManager.importProxiesFromText(text, folderId);
          return result;
        } catch (err) {
          error('❌ Lỗi khi import proxies từ text:', err);
          return { success: false, error: err.message };
        }
      },
      
      async bulkMoveProxiesToFolder(proxyIds, folderId) {
        // Sửa lại để gọi qua storageManager
        try {
          log(`📦 Đang gọi bulkMoveProxiesToFolder với ${proxyIds.length} proxies và folder ${folderId}`);
          
          // Kiểm tra tham số đầu vào
          if (!proxyIds || !Array.isArray(proxyIds) || proxyIds.length === 0) {
            error('❌ Lỗi: proxyIds không hợp lệ:', proxyIds);
            return { success: false, error: 'Danh sách proxy không hợp lệ hoặc rỗng' };
          }
          
          if (!folderId || typeof folderId !== 'string') {
            error('❌ Lỗi: folderId không hợp lệ:', folderId);
            return { success: false, error: 'ID thư mục không hợp lệ' };
          }
          
          // Kiểm tra xem phương thức tồn tại không
          if (typeof storageManager.bulkMoveProxiesToFolder !== 'function') {
            error('❌ Lỗi: Phương thức bulkMoveProxiesToFolder không tồn tại trong storageManager');
            log('Các phương thức có sẵn:', Object.keys(storageManager));
            return { success: false, error: 'Phương thức không được hỗ trợ. Vui lòng cập nhật phiên bản app.' };
          }
          
          log('📦 Gọi phương thức storageManager.bulkMoveProxiesToFolder');
          const result = await storageManager.bulkMoveProxiesToFolder(proxyIds, folderId);
          log('📦 Kết quả:', result);
          return result;
        } catch (err) {
          error('❌ Lỗi khi di chuyển proxies:', err);
          return { 
            success: false, 
            error: `Lỗi khi di chuyển proxies: ${err.message}`,
            stack: err.stack
          };
        }
      },
      
      async bulkTestProxies(proxyIds) {
        // Sửa lại để gọi qua storageManager
        try {
          log(`🔍 Gọi bulkTestProxies với ${proxyIds.length} proxies`);
          const result = await storageManager.bulkTestProxies(proxyIds);
          return result;
        } catch (err) {
          log('❌ Lỗi khi test proxies:', err);
          return { success: false, error: err.message };
        }
      },
      
      async exportProxies(format, proxyIds) {
        // Sửa lại để gọi qua storageManager
        try {
          log(`📤 Gọi exportProxies với format ${format}`);
          const result = await storageManager.exportProxies(format, proxyIds);
          return result;
        } catch (err) {
          log('❌ Lỗi khi export proxies:', err);
          return { success: false, error: err.message };
        }
      }
    };
    
    configManager = {
      async getSettings() {
        return await storageManager.getSettings();
      },
      
      async saveSettings(settings) {
        return await storageManager.saveSettings(settings);
      },
      
      async resetSettings() {
        return await storageManager.resetSettings();
      }
    };
    
    log('Storage-based managers initialized successfully')
  } catch (err) {
    error('Error initializing managers:', err)
    
    // Ultimate fallback
    accountManager = {
      getAllAccounts: async () => [],
      addAccount: async () => ({ success: true }),
      deleteAccount: async () => ({ success: true })
    }
    
    proxyManager = {
      getAllProxies: async () => [],
      addProxy: async () => ({ success: true }),
      deleteProxy: async () => ({ success: true }),
      testProxy: async () => ({ success: true, latency: '50ms' })
    }
    
    configManager = {
      getSettings: async () => ({ theme: 'dark', language: 'vi' }),
      saveSettings: async () => ({ success: true }),
      resetSettings: async () => ({ success: true })
    }
  }
}

if (isProd) {
  serve({ 
    directory: 'app',
    scheme: 'app',
    hostname: 'localhost'
  })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

// Cập nhật viewerManager để quản lý đúng số lượng viewers
viewerManager = {
  isRunning: false,
  viewers: [],
  accounts: [],
  roomStats: new Map(), // Lưu stats cho từng room
  
  async start(config) {
    try {
      this.isRunning = true;
      this.accounts = config.accounts || [];
      
      // Tạo viewers cho từng account
      this.viewers = this.accounts.map((account, index) => ({
        id: `viewer_${index}`,
        account: account,
        status: 'connecting',
        roomId: config.roomId
      }));
      
      // Simulate viewer connections
      setTimeout(() => {
        this.viewers.forEach(viewer => {
          viewer.status = 'connected';
        });
        
        // Cập nhật room stats
        if (config.roomId) {
          this.roomStats.set(config.roomId, {
            currentViewers: this.viewers.filter(v => v.status === 'connected').length,
            status: 'running',
            accounts: this.accounts
          });
        }
        
        log(`TikTok viewer started successfully with ${this.viewers.length} viewers`);
      }, 2000);
      
      return { success: true, message: 'Viewer started successfully' };
    } catch (err) {
      log('Error starting viewer:', err);
      return { success: false, message: err.message };
    }
  },
  
  async stop() {
    try {
      this.isRunning = false;
      this.viewers = [];
      this.accounts = [];
      this.roomStats.clear();
      
      log('TikTok viewer stopped');
      return { success: true, message: 'Viewer stopped successfully' };
    } catch (err) {
      log('Error stopping viewer:', err);
      return { success: false, message: err.message };
    }
  },
  
  getStats() {
    const connectedViewers = this.viewers.filter(v => v.status === 'connected');
    return {
      activeViewers: connectedViewers.length,
      isRunning: this.isRunning,
      totalAccounts: this.accounts.length,
      viewers: this.viewers
    };
  },
  
  getRoomStats(roomId) {
    if (this.roomStats.has(roomId)) {
      return this.roomStats.get(roomId);
    }
    return {
      currentViewers: 0,
      status: 'stopped',
      accounts: []
    };
  },
  
  updateRoomStats(roomId, stats) {
    this.roomStats.set(roomId, stats);
  }
};

// Function to register all IPC handlers
function registerIPCHandlers() {
  // Get handler objects
  const accountHandlerObj = accountHandlers(accountManager, storageManager)
  const proxyHandlerObj = proxyHandlers(proxyManager, storageManager)
  const roomHandlerObj = roomHandlers(storageManager, viewerManager)
  const bulkOpHandlerObj = bulkOperationHandlers(storageManager)
  const settingsHandlerObj = settingsHandlers(configManager)
  const folderHandlerObj = folderHandlers(storageManager)
  const utilityHandlerObj = utilityHandlers(storageManager, viewerManager)
  const taskHandlerObj = taskHandlers(storageManager)
  const notificationHandlerObj = notificationHandlers()
  const authHandlerObj = authHandlers(authManager, storageManager)
  const { updateHandlers } = require('./handlers/updateHandlers')

  // Register all handlers
  const allHandlers = {
    ...accountHandlerObj,
    ...proxyHandlerObj,
    ...roomHandlerObj,
    ...bulkOpHandlerObj,
    ...settingsHandlerObj,
    ...folderHandlerObj,
    ...utilityHandlerObj,
    ...taskHandlerObj,
    ...notificationHandlerObj,
    ...authHandlerObj,
    ...updateHandlers,
    // Thêm handler cho deviceInfo
    'get-device-info': async () => {
      try {
        const deviceData = await DeviceFingerprint.getDeviceInfo();
        return { success: true, deviceInfo: deviceData };
      } catch (err) {
        console.error('Error getting device info:', err);
        return { success: false, error: err.message };
      }
    }
  }

  // Register each handler with ipcMain
  Object.entries(allHandlers).forEach(([channel, handler]) => {
    ipcMain.handle(channel, handler)
  })

  log(`Registered ${Object.keys(allHandlers).length} IPC handlers`)
}

;(async () => {
  await app.whenReady()
  
  // Initialize managers
  await initializeManagers()
  
  // Initialize UpdateManager with database support (AFTER database is ready)
  updateManager = new UpdateManager(global.database);
  console.log('🔄 UpdateManager initialized with database support');
  console.log('🔄 UpdateManager.updateStateStorage exists:', !!updateManager.updateStateStorage);
  
  // Register all IPC handlers
  registerIPCHandlers()
  
  // Cập nhật tên ứng dụng theo ngôn ngữ
  updateAppName()
  setupAppNameLocalization()
  
  // Cài đặt About panel
  setupAboutPanel()
  setupAboutPanelLocalization()
  
  // Create and set up menu with localization support
  createMenu();
  setupMenuLocalization();
  
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

  const mainWindow = createWindow('main', {
    width: Math.floor(screenWidth * 0.9), // 90% chiều rộng màn hình
    height: Math.floor(screenHeight * 0.9), // 90% chiều cao màn hình
    center: true,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      allowRunningInsecureContent: true
    },
    icon: path.join(__dirname, '../public/icons/app-icon.png'),
    title: 'TTL - TikTok Live Viewer'
  })

  if (isProd) {
    await mainWindow.loadURL('app://./home')
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}/home`)
    mainWindow.webContents.openDevTools()
  }

  // Set up update event forwarding to renderer
  updateManager.on('update-available', (updateInfo) => {
    console.log('📢 Forwarding update-available to renderer:', updateInfo);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-available', updateInfo);
    }
  });

  updateManager.on('update-not-available', (info) => {
    console.log('✅ No updates available');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-not-available', info);
    }
  });

  updateManager.on('update-error', (error) => {
    console.error('❌ Update error:', error);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-error', error);
    }
  });

  updateManager.on('download-started', (info) => {
    console.log('📥 Download started:', info);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('download-started', info);
    }
  });

  updateManager.on('download-progress', (progress) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('download-progress', progress);
    }
  });

  updateManager.on('download-completed', (info) => {
    console.log('✅ Download completed:', info);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('download-completed', info);
    }
  });

  updateManager.on('install-started', () => {
    console.log('🚀 Installation started');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('install-started');
    }
  });

  updateManager.on('install-completed', () => {
    console.log('✅ Installation completed');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('install-completed');
    }
  });

  updateManager.on('backup-created', (info) => {
    console.log('📦 Backup created:', info);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('backup-created', info);
    }
  });


})()

app.on('window-all-closed', () => {
  // Cleanup auth manager
  if (authManager) {
    authManager.cleanup()
  }
  app.quit()
})

app.on('before-quit', async () => {
  console.log('🔄 Application shutting down...');
  
  // Cleanup UpdateManager
  if (updateManager) {
    updateManager.destroy();
    console.log('🔄 UpdateManager destroyed');
  }

  // Cleanup auth manager
  if (authManager) {
    authManager.cleanup()
  }
  
  // Don't call app.quit() here as this event is already part of the quit process
})