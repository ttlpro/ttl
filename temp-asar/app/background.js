(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("electron-serve"), require("request"), require("axios"), require("tunnel"), require("better-sqlite3"), (function webpackLoadOptionalExternalModule() { try { return require("https-proxy-agent"); } catch(e) {} }()));
	else if(typeof define === 'function' && define.amd)
		define(["electron-serve", "request", "axios", "tunnel", "better-sqlite3", "https-proxy-agent"], factory);
	else {
		var a = typeof exports === 'object' ? factory(require("electron-serve"), require("request"), require("axios"), require("tunnel"), require("better-sqlite3"), (function webpackLoadOptionalExternalModule() { try { return require("https-proxy-agent"); } catch(e) {} }())) : factory(root["electron-serve"], root["request"], root["axios"], root["tunnel"], root["better-sqlite3"], root["https-proxy-agent"]);
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(global, (__WEBPACK_EXTERNAL_MODULE_electron_serve__, __WEBPACK_EXTERNAL_MODULE_request__, __WEBPACK_EXTERNAL_MODULE_axios__, __WEBPACK_EXTERNAL_MODULE_tunnel__, __WEBPACK_EXTERNAL_MODULE_better_sqlite3__, __WEBPACK_EXTERNAL_MODULE_https_proxy_agent__) => {
return /******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./main/businesses sync recursive":
/*!*******************************!*\
  !*** ./main/businesses/ sync ***!
  \*******************************/
/***/ ((module) => {

function webpackEmptyContext(req) {
	var e = new Error("Cannot find module '" + req + "'");
	e.code = 'MODULE_NOT_FOUND';
	throw e;
}
webpackEmptyContext.keys = () => ([]);
webpackEmptyContext.resolve = webpackEmptyContext;
webpackEmptyContext.id = "./main/businesses sync recursive";
module.exports = webpackEmptyContext;

/***/ }),

/***/ "./lib/app-state.js":
/*!**************************!*\
  !*** ./lib/app-state.js ***!
  \**************************/
/***/ ((module) => {

"use strict";


/**
 * Quản lý trạng thái toàn cục của ứng dụng trong main process
 */
class AppState {
  constructor() {
    // Khởi tạo trạng thái mặc định
    this._state = {
      language: 'vi',
      // Ngôn ngữ mặc định
      theme: 'dark',
      notifications: true,
      soundEnabled: true
    };

    // Danh sách các listeners
    this._listeners = {
      language: []
    };
  }

  /**
   * Lấy ngôn ngữ hiện tại
   */
  get language() {
    return this._state.language;
  }

  /**
   * Đặt ngôn ngữ hiện tại và thông báo cho các listeners
   */
  set language(value) {
    if (this._state.language !== value) {
      this._state.language = value;
      this._notifyListeners('language', value);
    }
  }

  /**
   * Lấy theme hiện tại
   */
  get theme() {
    return this._state.theme;
  }

  /**
   * Đặt theme hiện tại
   */
  set theme(value) {
    this._state.theme = value;
  }

  /**
   * Lấy trạng thái thông báo
   */
  get notifications() {
    return this._state.notifications;
  }

  /**
   * Đặt trạng thái thông báo
   */
  set notifications(value) {
    this._state.notifications = value;
  }

  /**
   * Lấy trạng thái âm thanh
   */
  get soundEnabled() {
    return this._state.soundEnabled;
  }

  /**
   * Đặt trạng thái âm thanh
   */
  set soundEnabled(value) {
    this._state.soundEnabled = value;
  }

  /**
   * Đăng ký listener cho các thay đổi
   * @param {string} event - Tên sự kiện ('language', 'theme', etc)
   * @param {Function} callback - Hàm callback khi có thay đổi
   */
  addListener(event, callback) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(callback);
  }

  /**
   * Hủy đăng ký listener
   * @param {string} event - Tên sự kiện
   * @param {Function} callback - Hàm callback đã đăng ký
   */
  removeListener(event, callback) {
    if (this._listeners[event]) {
      this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
    }
  }

  /**
   * Thông báo cho các listeners về thay đổi
   * @param {string} event - Tên sự kiện
   * @param {any} value - Giá trị mới
   */
  _notifyListeners(event, value) {
    if (this._listeners[event]) {
      this._listeners[event].forEach(callback => {
        try {
          callback(value);
        } catch (err) {
          console.error(`Lỗi khi gọi listener cho ${event}:`, err);
        }
      });
    }
  }
}

// Export singleton instance
module.exports = new AppState();

/***/ }),

/***/ "./lib/logger.js":
/*!***********************!*\
  !*** ./lib/logger.js ***!
  \***********************/
/***/ ((module) => {

"use strict";


/**
 * Logger module cho ứng dụng TTL TikTok Live Viewer
 * Mặc định tắt tất cả console.log, chỉ bật khi cần debug
 */

// Mặc định là false - không hiển thị log
let LOG_ENABLED = false;
if (true) {
  LOG_ENABLED = true;
}

/**
 * Hàm log thay thế cho console.log, chỉ hiển thị khi LOG_ENABLED = true
 * @param  {...any} args Các tham số giống như console.log
 */
function log(...args) {
  if (LOG_ENABLED) {
    console.log(...args);
  }
}

/**
 * Hàm error luôn hiển thị (không bị ảnh hưởng bởi LOG_ENABLED)
 * @param  {...any} args Các tham số giống như console.error
 */
function error(...args) {
  console.error(...args);
}

/**
 * Hàm warn luôn hiển thị (không bị ảnh hưởng bởi LOG_ENABLED)
 * @param  {...any} args Các tham số giống như console.warn
 */
function warn(...args) {
  console.warn(...args);
}

/**
 * Bật/tắt log
 * @param {boolean} enabled true để bật, false để tắt
 */
function setLogEnabled(enabled) {
  global.LOG_ENABLED = enabled;
}
module.exports = {
  log,
  error,
  warn,
  setLogEnabled,
  LOG_ENABLED
};

/***/ }),

/***/ "./lib/notification-manager.js":
/*!*************************************!*\
  !*** ./lib/notification-manager.js ***!
  \*************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const {
  Notification,
  app,
  dialog
} = __webpack_require__(/*! electron */ "electron");
const path = __webpack_require__(/*! path */ "path");
const {
  log,
  error
} = __webpack_require__(/*! ./logger */ "./lib/logger.js");
const fs = __webpack_require__(/*! fs */ "fs");
const appState = __webpack_require__(/*! ./app-state */ "./lib/app-state.js");

/**
 * Quản lý thông báo desktop với hỗ trợ đa ngôn ngữ
 */
class NotificationManager {
  constructor() {
    this.enabled = true;

    // Thay đổi đường dẫn icon để sử dụng icon có sẵn
    // const iconPath = path.join(app.getAppPath(), 'resources/icon.png');
    const iconPath = path.join(__dirname, '..', 'resources', 'icon.png');
    log(`📢 Icon path for notifications: ${iconPath}`);
    this.iconPath = iconPath;
    this.soundEnabled = true;
    this.historyLimit = 50;
    this.notificationHistory = [];

    // Lưu tham chiếu đến thông báo để tránh bị garbage collected
    this.activeNotifications = [];

    // Khởi tạo hỗ trợ đa ngôn ngữ
    this.translations = this.loadTranslations(appState.language);

    // Đăng ký lắng nghe thay đổi ngôn ngữ từ AppState
    appState.addListener('language', language => {
      log(`🌐 Ngôn ngữ thông báo thay đổi thành: ${language}`);
      this.translations = this.loadTranslations(language);
    });

    // Kiểm tra hỗ trợ thông báo
    if (!Notification.isSupported()) {
      log('❌ Thông báo không được hỗ trợ trên hệ thống này');
      this.enabled = false;
    } else {
      log('✅ Thông báo được hỗ trợ trên hệ thống này');
    }

    // Thiết lập AppUserModelId cho Windows
    if (process.platform === 'win32') {
      try {
        app.setAppUserModelId(app.getName() || 'TTL TikTok Live');
        log('✅ Đã thiết lập AppUserModelId cho Windows');
      } catch (err) {
        error('❌ Lỗi khi thiết lập AppUserModelId:', err);
      }
    }
  }

  /**
   * Đọc file translations dựa trên ngôn ngữ
   */
  loadTranslations(lang) {
    try {
      const isProd = "development" === 'production';
      let translationPath;
      if (isProd) {
        // Trong môi trường production, đường dẫn tới thư mục locales đã giải nén
        const appPath = app.getAppPath();
        const appDir = path.dirname(appPath);

        // Thử tìm trong thư mục locales giải nén ở cùng cấp với app.asar
        translationPath = path.join(appDir, 'locales', lang, 'notification.json');

        // Trên macOS có thể có cấu trúc khác
        if (process.platform === 'darwin' && !fs.existsSync(translationPath)) {
          // Thử tìm trong Resources
          translationPath = path.join(process.resourcesPath, 'locales', lang, 'notification.json');
        }
      } else {
        // Môi trường development
        translationPath = path.join(app.getAppPath(), 'renderer', 'locales', lang, 'notification.json');
      }
      log(`🌐 Đang đọc bản dịch từ: ${translationPath}`);
      if (fs.existsSync(translationPath)) {
        const data = fs.readFileSync(translationPath, 'utf8');
        const translations = JSON.parse(data);
        log(`✅ Đọc bản dịch ${lang} thành công`);
        return translations;
      } else {
        log(`❌ Không tìm thấy file bản dịch cho ${lang} tại ${translationPath}`);
        // Nếu không tìm thấy, thử đọc tiếng Việt
        if (lang !== 'vi') {
          log(`🔄 Đang fallback về tiếng Việt`);
          return this.loadTranslations('vi');
        }
        // Nếu không có cả tiếng Việt, trả về object rỗng
        return {};
      }
    } catch (err) {
      error(`❌ Lỗi khi đọc bản dịch ${lang}:`, err);
      return {};
    }
  }

  /**
   * Đặt ngôn ngữ hiện tại
   */
  setLanguage(lang) {
    // Cập nhật ngôn ngữ trong AppState, NotificationManager sẽ được cập nhật qua listener
    appState.language = lang;
  }

  /**
   * Phương thức t() để lấy bản dịch
   */
  t(key, params = {}) {
    try {
      // Phân tách key
      const keyParts = key.split('.');
      let result = this.translations;

      // Duyệt qua các phần của key
      for (const part of keyParts) {
        if (result && result[part] !== undefined) {
          result = result[part];
        } else {
          log(`❓ Không tìm thấy key ${key} trong bản dịch ${appState.language}`);
          return key;
        }
      }

      // Thay thế các tham số
      if (typeof result === 'string') {
        for (const paramKey in params) {
          result = result.replace(`{${paramKey}}`, params[paramKey]);
        }
      }
      return result;
    } catch (err) {
      error(`❌ Lỗi khi dịch key ${key}:`, err);
      return key;
    }
  }

  /**
   * Gửi thông báo
   */
  sendNotification(options) {
    if (!this.enabled) {
      log('❌ Thông báo đã bị tắt, không gửi thông báo');
      return null;
    }
    try {
      log(`📢 Đang gửi thông báo: ${options.title}`);
      const defaultOptions = {
        title: 'TTL TikTok Live',
        body: '',
        icon: options.icon || this.iconPath,
        silent: !this.soundEnabled,
        timeoutType: 'default'
      };
      const notificationOptions = {
        ...defaultOptions,
        ...options
      };
      log(`📢 Chi tiết thông báo: ${JSON.stringify(notificationOptions)}`);

      // Tạo thông báo với tùy chọn đầy đủ
      const notification = new Notification({
        title: notificationOptions.title,
        body: notificationOptions.body,
        icon: notificationOptions.icon,
        silent: notificationOptions.silent,
        urgency: notificationOptions.urgency || 'normal',
        timeoutType: notificationOptions.timeoutType || 'default',
        hasReply: false
      });

      // Lưu tham chiếu đến thông báo để tránh bị garbage collected
      this.activeNotifications.push(notification);

      // Đăng ký các sự kiện
      notification.on('show', () => {
        log(`📢 Thông báo hiển thị: ${notificationOptions.title}`);
      });
      notification.on('click', () => {
        log(`📢 Thông báo được nhấp: ${notificationOptions.title}`);
        if (options.onClick) {
          options.onClick();
        }
        this.clearNotification(notification);
      });
      notification.on('close', () => {
        log(`📢 Thông báo đóng: ${notificationOptions.title}`);
        this.clearNotification(notification);
      });
      notification.on('failed', (event, err) => {
        log(`❌ Lỗi thông báo: ${err}`);
        this.clearNotification(notification);
      });

      // Hiển thị thông báo
      notification.show();
      log(`📢 Đã gọi hàm show() cho thông báo`);

      // Lưu vào lịch sử
      this.addToHistory({
        title: notificationOptions.title,
        body: notificationOptions.body,
        timestamp: new Date().toISOString()
      });
      return notification;
    } catch (err) {
      error('❌ Lỗi khi gửi thông báo:', err);

      // Hiển thị dialog thay thế nếu có lỗi
      try {
        dialog.showMessageBox({
          type: 'info',
          title: options.title || 'TTL TikTok Live',
          message: options.body || '',
          buttons: ['OK']
        });
      } catch (dialogErr) {
        error('❌ Lỗi khi hiển thị dialog thay thế:', dialogErr);
      }
      return null;
    }
  }

  /**
   * Xóa thông báo khỏi danh sách tham chiếu
   */
  clearNotification(notificationToDelete) {
    this.activeNotifications = this.activeNotifications.filter(notification => notification !== notificationToDelete);
    log(`📢 Đã xóa thông báo khỏi danh sách tham chiếu, còn lại ${this.activeNotifications.length} thông báo`);
  }

  /**
   * Gửi thông báo khi room dừng
   */
  notifyRoomStopped(roomData) {
    log(`📢 Gọi notifyRoomStopped với roomData: ${JSON.stringify(roomData)}`);
    const roomIdentifier = roomData.roomUsername || roomData.roomName || roomData.roomId || 'Unknown';
    return this.sendNotification({
      title: this.t('notifications.roomStopped.title'),
      body: this.t('notifications.roomStopped.body', {
        roomIdentifier
      }),
      urgency: 'normal',
      timeoutType: 'default',
      onClick: () => {
        // Action khi click vào thông báo
        log(`📱 Người dùng nhấp vào thông báo room dừng: ${roomIdentifier}`);
        // Có thể triển khai mở cửa sổ room history
      }
    });
  }

  /**
   * Gửi thông báo khi phát hiện room mới
   */
  notifyNewRoom(roomData) {
    log(`📢 Gọi notifyNewRoom với roomData: ${JSON.stringify(roomData)}`);
    const roomIdentifier = roomData.roomUsername || roomData.roomName || roomData.roomId || 'Unknown';
    return this.sendNotification({
      title: this.t('notifications.newRoom.title'),
      body: this.t('notifications.newRoom.body', {
        roomIdentifier
      }),
      urgency: 'normal',
      onClick: () => {
        log(`📱 Người dùng nhấp vào thông báo room mới: ${roomIdentifier}`);
      }
    });
  }
  notifyTest() {
    log(`📢 Gọi notifyTest`);
    return this.sendNotification({
      title: this.t('notifications.test.title'),
      body: this.t('notifications.test.body'),
      urgency: 'normal',
      onClick: () => {
        log(`📱 Người dùng nhấp vào thông báo test chức năng thông báo`);
      }
    });
  }

  /**
   * Gửi thông báo lỗi
   */
  notifyError(title, message) {
    log(`📢 Gọi notifyError với title: ${title}, message: ${message}`);
    return this.sendNotification({
      title: title || this.t('notifications.error.title'),
      body: message || this.t('notifications.error.defaultMessage'),
      urgency: 'critical',
      timeoutType: 'never'
    });
  }

  /**
   * Lưu thông báo vào lịch sử
   */
  addToHistory(notification) {
    this.notificationHistory.unshift(notification);

    // Giới hạn lịch sử
    if (this.notificationHistory.length > this.historyLimit) {
      this.notificationHistory = this.notificationHistory.slice(0, this.historyLimit);
    }
  }

  /**
   * Lấy lịch sử thông báo
   */
  getHistory() {
    return this.notificationHistory;
  }

  /**
   * Bật/tắt thông báo
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    log(`📢 Thông báo đã được ${enabled ? 'bật' : 'tắt'}`);
  }

  /**
   * Bật/tắt âm thanh
   */
  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
    log(`🔊 Âm thanh thông báo đã được ${enabled ? 'bật' : 'tắt'}`);
  }
}
module.exports = new NotificationManager();

/***/ }),

/***/ "./lib/storage-adapter.js":
/*!********************************!*\
  !*** ./lib/storage-adapter.js ***!
  \********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const path = __webpack_require__(/*! path */ "path");
const fs = __webpack_require__(/*! fs */ "fs");

// Import new modular storage system
const StorageManager = __webpack_require__(/*! ./storage/storage-manager */ "./lib/storage/storage-manager.js");

/**
 * Storage Adapter để dễ dàng chuyển đổi giữa JSON và SQLite
 * Tự động detect và migrate nếu cần
 */
class StorageAdapter {
  constructor() {
    this.storageType = 'sqlite'; // Always use SQLite
    this.storage = null;
    this.isInitialized = false;
  }
  async init() {
    try {
      console.log('🚀 Initializing Storage Adapter...');

      // Initialize SQLite storage với modular system
      this.storage = new StorageManager();
      await this.storage.init();

      // Chạy migration để đảm bảo schema đã được cập nhật
      console.log('🔄 Checking for database schema migrations...');
      if (typeof this.storage.migrateSchema === 'function') {
        await this.storage.migrateSchema();
      } else {
        console.log('⚠️ migrateSchema method not found in storage manager');
      }
      this.isInitialized = true;
      console.log('✅ Storage adapter initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize storage adapter:', error);
      throw error;
    }
  }

  // Delegate tất cả methods to storage manager
  async getAllFolders(type) {
    this.ensureInitialized();
    return this.storage.getAllFolders(type);
  }
  async createFolder(type, folderData) {
    this.ensureInitialized();
    return this.storage.createFolder(type, folderData);
  }
  async updateFolder(type, folderId, updates) {
    this.ensureInitialized();
    return this.storage.updateFolder(type, folderId, updates);
  }
  async deleteFolder(type, folderId) {
    this.ensureInitialized();
    return this.storage.deleteFolder(type, folderId);
  }
  async getAllAccounts() {
    this.ensureInitialized();
    return this.storage.getAllAccounts();
  }
  async getAccountsByFolder(folderId) {
    this.ensureInitialized();
    return this.storage.getAccountsByFolder(folderId);
  }
  async addAccount(accountData) {
    this.ensureInitialized();
    return this.storage.addAccount(accountData);
  }
  async deleteAccount(accountId) {
    this.ensureInitialized();
    return this.storage.deleteAccount(accountId);
  }
  async updateAccount(id, updates) {
    this.ensureInitialized();
    return this.storage.updateAccount(id, updates);
  }
  async updateAccountStats(accountId, stats) {
    this.ensureInitialized();
    return this.storage.updateAccountStats(accountId, stats);
  }
  async addAccountToRoom(accountId, roomId) {
    this.ensureInitialized();
    return this.storage.addAccountToRoom(accountId, roomId);
  }
  async removeAccountFromRoom(accountId, roomId) {
    this.ensureInitialized();
    return this.storage.removeAccountFromRoom(accountId, roomId);
  }
  async releaseAccountsFromRoom(roomId) {
    this.ensureInitialized();
    // Kiểm tra xem storage.roomStorage có tồn tại không
    if (this.storage && this.storage.roomStorage && typeof this.storage.roomStorage.releaseAccountsFromRoom === 'function') {
      return this.storage.roomStorage.releaseAccountsFromRoom(roomId);
    } else {
      console.error('❌ Cannot release accounts: storage.roomStorage not available');
      return {
        success: false,
        error: 'storage.roomStorage not available'
      };
    }
  }
  async clearAccountRooms(accountId) {
    this.ensureInitialized();
    return this.storage.clearAccountRooms(accountId);
  }
  async getAccountActiveRooms(accountId) {
    this.ensureInitialized();
    return this.storage.getAccountActiveRooms(accountId);
  }
  async getAccountsInRoom(roomId) {
    this.ensureInitialized();
    return this.storage.getAccountsInRoom(roomId);
  }
  async getAllProxies() {
    this.ensureInitialized();
    return this.storage.getAllProxies();
  }
  async getProxiesByFolder(folderId) {
    this.ensureInitialized();
    return this.storage.getProxiesByFolder(folderId);
  }
  async addProxy(proxyData) {
    this.ensureInitialized();
    return this.storage.addProxy(proxyData);
  }
  async deleteProxy(proxyId) {
    this.ensureInitialized();
    return this.storage.deleteProxy(proxyId);
  }
  async getProxyById(proxyId) {
    this.ensureInitialized();
    return this.storage.getProxyById(proxyId);
  }
  async updateProxy(proxyId, updates) {
    this.ensureInitialized();
    return this.storage.updateProxy(proxyId, updates);
  }
  async testProxy(proxyId) {
    this.ensureInitialized();
    return this.storage.testProxy(proxyId);
  }
  async importProxiesFromText(text, folderId = null) {
    this.ensureInitialized();
    return this.storage.importProxiesFromText(text, folderId);
  }
  async bulkMoveProxiesToFolder(proxyIds, folderId) {
    this.ensureInitialized();
    return this.storage.bulkMoveProxiesToFolder(proxyIds, folderId);
  }
  async bulkTestProxies(proxyIds) {
    this.ensureInitialized();
    return this.storage.bulkTestProxies(proxyIds);
  }
  async exportProxies(format = 'ip_port_username_password', proxyIds = null) {
    this.ensureInitialized();
    return this.storage.exportProxies(format, proxyIds);
  }
  async getAllRooms() {
    this.ensureInitialized();
    return this.storage.getAllRooms();
  }
  async addRoom(roomData) {
    this.ensureInitialized();
    return this.storage.addRoom(roomData);
  }
  async updateRoom(roomUid, updates) {
    this.ensureInitialized();
    return this.storage.updateRoom(roomUid, updates);
  }
  async deleteRoom(roomUid) {
    this.ensureInitialized();
    return this.storage.deleteRoom(roomUid);
  }
  async clearAllAccountRooms() {
    this.ensureInitialized();
    return this.storage.clearAllAccountRooms();
  }
  async addViewerHistoryEntry(roomUid, viewerData) {
    this.ensureInitialized();
    return this.storage.addViewerHistoryEntry(roomUid, viewerData);
  }
  async getRoomViewerHistory(roomUid, days = null) {
    this.ensureInitialized();
    return this.storage.getRoomViewerHistory(roomUid, days);
  }
  async cleanupViewerHistoryFiles() {
    this.ensureInitialized();
    return this.storage.cleanupViewerHistoryFiles();
  }
  async getSettings() {
    this.ensureInitialized();
    return this.storage.getSettings();
  }
  async saveSettings(settings) {
    this.ensureInitialized();
    return this.storage.saveSettings(settings);
  }
  async resetSettings() {
    this.ensureInitialized();
    return this.storage.resetSettings();
  }
  async getAllTasks() {
    this.ensureInitialized();
    return this.storage.getAllTasks();
  }
  async addTask(taskData) {
    this.ensureInitialized();
    return this.storage.addTask(taskData);
  }
  async updateTask(taskId, updates) {
    this.ensureInitialized();
    return this.storage.updateTask(taskId, updates);
  }
  async deleteTask(taskId) {
    this.ensureInitialized();
    return this.storage.deleteTask(taskId);
  }
  async getTaskById(taskId) {
    this.ensureInitialized();
    return this.storage.getTaskById(taskId);
  }
  async importAccountsFromText(text, folderId = null) {
    this.ensureInitialized();
    return this.storage.importAccountsFromText(text, folderId);
  }

  // Account bulk operations
  async bulkSetProxy(accountIds, proxyFolderId, accountsPerProxy = 1, selectedProxies = null) {
    this.ensureInitialized();
    return this.storage.bulkSetProxy(accountIds, proxyFolderId, accountsPerProxy, selectedProxies);
  }
  async bulkRemoveProxy(accountIds) {
    this.ensureInitialized();
    return this.storage.bulkRemoveProxy(accountIds);
  }
  async bulkSetStatus(accountIds, status) {
    this.ensureInitialized();
    return this.storage.bulkSetStatus(accountIds, status);
  }
  async bulkMoveToFolder(accountIds, folderId) {
    this.ensureInitialized();
    return this.storage.bulkMoveToFolder(accountIds, folderId);
  }
  async exportAccountsToText(format, accountIds, folderId) {
    this.ensureInitialized();
    return this.storage.exportAccountsToText(format, accountIds, folderId);
  }

  // Utility methods
  close() {
    if (this.storage && this.storage.close) {
      this.storage.close();
    }
    this.isInitialized = false;
  }
  ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('Storage adapter not initialized. Call init() first.');
    }
  }
  getStorageType() {
    this.ensureInitialized();
    return this.storage.getStorageType();
  }
  isUsingSQLite() {
    this.ensureInitialized();
    return this.storage.isUsingSQLite();
  }
  getDatabaseInfo() {
    this.ensureInitialized();
    if (this.storage.getDatabaseInfo) {
      return this.storage.getDatabaseInfo();
    }
    return null;
  }

  /**
   * Force migrate từ JSON sang SQLite
   */
  async forceMigrationToSQLite() {
    try {
      console.log('🔄 Force migration từ JSON sang SQLite...');
      const migration = new DataMigration();
      const result = await migration.run();
      if (result.success) {
        // Chuyển sang SQLite storage
        if (this.storage && typeof this.storage.close === 'function') {
          this.storage.close();
        }
        this.storage = new SQLiteStorageManager();
        this.storageType = 'sqlite';
        console.log('✅ Force migration thành công');
        return {
          success: true,
          results: result.results
        };
      } else {
        console.error('❌ Force migration thất bại:', result.error);
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      console.error('❌ Lỗi force migration:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Rollback về JSON storage
   */
  async rollbackToJSON() {
    try {
      console.log('🔄 Rollback về JSON storage...');
      const migration = new DataMigration();
      const result = await migration.rollback();
      if (result.success) {
        // Chuyển về JSON storage
        if (this.storage && typeof this.storage.close === 'function') {
          this.storage.close();
        }
        this.storage = new StorageManager();
        this.storageType = 'json';
        console.log('✅ Rollback thành công');
        return {
          success: true
        };
      } else {
        console.error('❌ Rollback thất bại:', result.error);
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      console.error('❌ Lỗi rollback:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper methods (nếu có trong cả 2 storage)
  extractUsername(accountInfo) {
    this.ensureInitialized();
    return this.storage.extractUsername(accountInfo);
  }
  extractProxyHost(proxyInfo) {
    this.ensureInitialized();
    return this.storage.extractProxyHost(proxyInfo);
  }
}

// Export class instead of singleton
module.exports = StorageAdapter;

/***/ }),

/***/ "./lib/storage/account-storage.js":
/*!****************************************!*\
  !*** ./lib/storage/account-storage.js ***!
  \****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const BaseStorage = __webpack_require__(/*! ./base-storage */ "./lib/storage/base-storage.js");
const {
  log,
  error
} = __webpack_require__(/*! ../logger */ "./lib/logger.js");
class AccountStorage extends BaseStorage {
  /**
   * Lấy tất cả accounts
   */
  async getAllAccounts() {
    try {
      log('🔄 Gọi getAllAccounts');
      const stmt = this.db.prepare(`
                SELECT a.*, f.name as folderName, f.color as folderColor
                FROM accounts a
                LEFT JOIN folders f ON a.folderId = f.id
                ORDER BY a.username ASC
            `);
      const accounts = stmt.all();
      log(`📊 Đọc được ${accounts.length} tài khoản từ database`);

      // Xử lý dữ liệu trả về
      const processedAccounts = accounts.map(account => {
        // Parse activeRooms từ JSON string
        let activeRooms = [];
        try {
          if (account.activeRooms) {
            activeRooms = JSON.parse(account.activeRooms);
          }
        } catch (e) {
          error('❌ Lỗi parse activeRooms:', e);
        }

        // Xử lý metadata
        let metadata = {};
        try {
          if (account.metadata) {
            metadata = JSON.parse(account.metadata);
          }
        } catch (e) {
          error('❌ Lỗi parse metadata:', e);
        }
        return {
          ...account,
          // Convert Boolean values
          isLive: Boolean(account.isLive),
          // Parse JSON fields
          activeRooms: activeRooms,
          metadata: metadata,
          // Keep ISO date strings
          lastActive: account.lastActive,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt
        };
      });
      log(`✅ Đã xử lý ${processedAccounts.length} tài khoản, trả về cho UI`);
      return this.serializeForIPC(processedAccounts);
    } catch (err) {
      error('❌ Error getting all accounts:', err);
      return [];
    }
  }

  /**
   * Lấy accounts theo folder
   */
  async getAccountsByFolder(folderId) {
    try {
      log(`🔄 Gọi getAccountsByFolder với folderId: ${folderId}`);
      const stmt = this.db.prepare(`
                SELECT a.*, f.name as folderName, f.color as folderColor
                FROM accounts a
                LEFT JOIN folders f ON a.folderId = f.id
                WHERE a.folderId = ?
                ORDER BY a.username ASC
            `);
      const accounts = stmt.all(folderId);
      log(`📊 Đọc được ${accounts.length} tài khoản với folderId: ${folderId}`);

      // Xử lý dữ liệu trả về
      const processedAccounts = accounts.map(account => {
        // Parse activeRooms từ JSON string
        let activeRooms = [];
        try {
          if (account.activeRooms) {
            activeRooms = JSON.parse(account.activeRooms);
          }
        } catch (e) {
          error('❌ Lỗi parse activeRooms:', e);
        }

        // Xử lý metadata
        let metadata = {};
        try {
          if (account.metadata) {
            metadata = JSON.parse(account.metadata);
          }
        } catch (e) {
          error('❌ Lỗi parse metadata:', e);
        }
        return {
          ...account,
          // Convert Boolean values
          isLive: Boolean(account.isLive),
          // Parse JSON fields
          activeRooms: activeRooms,
          metadata: metadata,
          // Keep ISO date strings
          lastActive: account.lastActive,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt
        };
      });
      log(`✅ Đã xử lý ${processedAccounts.length} tài khoản, trả về cho UI`);
      return this.serializeForIPC(processedAccounts);
    } catch (error) {
      error('❌ Error getting accounts by folder:', error);
      return [];
    }
  }

  /**
   * Thêm account mới
   */
  async addAccount(accountData) {
    try {
      const accountId = this.generateId();
      const now = new Date().toISOString();
      const username = this.extractUsername(accountData);

      // Debug info
      log(`📝 Adding account: ${username}`);
      log(`- SessionId: ${accountData.sessionId ? 'Yes (length: ' + accountData.sessionId.length + ')' : 'No'}`);
      log(`- FolderId: ${accountData.folderId || 'null'}`);
      log(`- Status: ${accountData.status || 'active'}`);
      log(`- Notes: ${accountData.notes ? 'Yes (length: ' + accountData.notes.length + ')' : 'No'}`);
      log(`- Has metadata: ${accountData.metadata ? 'Yes' : 'No'}`);

      // Chuyển đổi metadata thành chuỗi JSON
      let metadataJson = '{}';
      if (accountData.metadata) {
        try {
          if (typeof accountData.metadata === 'string') {
            // Kiểm tra xem đã là JSON chưa
            JSON.parse(accountData.metadata);
            metadataJson = accountData.metadata;
          } else {
            metadataJson = JSON.stringify(accountData.metadata);
          }
          log(`- Metadata parsed successfully`);
        } catch (err) {
          error(`❌ Error parsing metadata:`, err);
          metadataJson = JSON.stringify({});
        }
      }
      const stmt = this.db.prepare(`
                INSERT INTO accounts (
                    id, username, sessionId, password, email, emailPassword, cookie,
                    folderId, status, lastActive, lastUsed, currentRooms, avatarThumb, roomUsername, activeRooms,
                    viewerCount, followCount, shareCount, totalViews, totalShares, totalFollows, isLive,
                    proxyId, metadata, notes, createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
      stmt.run(accountId, username, accountData.sessionId || null, accountData.password || null, accountData.email || null, accountData.emailPassword || null, accountData.cookie || null, accountData.folderId || null, accountData.status || 'active', null, accountData.lastUsed || null, accountData.currentRooms || 0, accountData.avatarThumb || null, accountData.roomUsername || null, JSON.stringify(accountData.activeRooms || []), 0, 0, 0, 0, 0, 0, 0, accountData.proxyId || null, metadataJson, accountData.notes || '', now, now);
      const newAccount = {
        id: accountId,
        username: username,
        sessionId: accountData.sessionId || null,
        password: accountData.password || null,
        email: accountData.email || null,
        emailPassword: accountData.emailPassword || null,
        cookie: accountData.cookie || null,
        folderId: accountData.folderId || null,
        status: accountData.status || 'active',
        lastActive: null,
        lastUsed: accountData.lastUsed || null,
        currentRooms: accountData.currentRooms || 0,
        avatarThumb: accountData.avatarThumb || null,
        roomUsername: accountData.roomUsername || null,
        activeRooms: accountData.activeRooms || [],
        viewerCount: 0,
        followCount: 0,
        shareCount: 0,
        totalViews: 0,
        totalShares: 0,
        totalFollows: 0,
        isLive: 0,
        proxyId: accountData.proxyId || null,
        metadata: metadataJson,
        notes: accountData.notes || '',
        createdAt: now,
        updatedAt: now
      };
      log(`✅ Added account: ${username}`);
      return {
        success: true,
        account: this.serializeForIPC(newAccount)
      };
    } catch (err) {
      error('❌ Error adding account:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Xóa account
   */
  async deleteAccount(accountId) {
    try {
      // Xóa account khỏi rooms trước
      await this.clearAccountRooms(accountId);

      // Xóa account
      const stmt = this.db.prepare(`DELETE FROM accounts WHERE id = ?`);
      const result = stmt.run(accountId);
      if (result.changes > 0) {
        log(`✅ Deleted account ${accountId}`);
        return {
          success: true
        };
      } else {
        return {
          success: false,
          error: 'Account not found'
        };
      }
    } catch (error) {
      error('Error deleting account:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cập nhật account
   */
  async updateAccount(id, updates) {
    try {
      const now = new Date().toISOString();
      const setFields = [];
      const values = [];
      for (const [key, value] of Object.entries(updates)) {
        // Bỏ qua các giá trị undefined
        if (value === undefined) {
          log(`⚠️ Bỏ qua trường ${key} với giá trị undefined`);
          continue;
        }
        if (key === 'lastUpdated') {
          log('⚠️ Cột lastUpdated được thay đổi thành updatedAt');
          setFields.push(`updatedAt = ?`);
          values.push(String(value) || now);
          continue;
        }
        if (key === 'metadata') {
          setFields.push(`${key} = ?`);
          if (typeof value === 'string') {
            values.push(value);
          } else {
            try {
              values.push(JSON.stringify(value || {}));
            } catch (err) {
              error('❌ Lỗi khi chuyển đổi metadata thành JSON:', err);
              values.push('{}');
            }
          }
        } else if (key === 'lastActive' || key === 'startedAt' || key === 'endedAt' || key === 'lastTimeCheckViewers' || key === 'stoppedAt') {
          setFields.push(`${key} = ?`);
          values.push(value ? String(value) : null);
        } else if (key === 'avatarThumb' || key === 'roomUsername') {
          // Đảm bảo các trường string luôn là string hoặc null
          setFields.push(`${key} = ?`);
          values.push(value !== null && value !== undefined ? String(value) : null);
        } else if (key === 'currentRooms' || key === 'viewerCount' || key === 'followCount' || key === 'shareCount' || key === 'totalViews' || key === 'totalShares' || key === 'totalFollows' || key === 'isLive') {
          // Đảm bảo các trường số luôn là số
          setFields.push(`${key} = ?`);
          values.push(Number(value) || 0);
        } else if (key === 'activeRooms') {
          // Đảm bảo activeRooms luôn là JSON string
          setFields.push(`${key} = ?`);
          if (typeof value === 'string') {
            try {
              // Kiểm tra xem đã là JSON hợp lệ chưa
              JSON.parse(value);
              values.push(value);
            } catch (e) {
              error('❌ Lỗi khi parse activeRooms string:', e);
              values.push('[]');
            }
          } else if (Array.isArray(value)) {
            values.push(JSON.stringify(value));
          } else {
            values.push('[]');
          }
        } else {
          // Các trường khác
          setFields.push(`${key} = ?`);

          // Đảm bảo giá trị là kiểu SQLite hợp lệ
          if (value === null) {
            values.push(null);
          } else if (typeof value === 'object') {
            try {
              values.push(JSON.stringify(value));
            } catch (e) {
              error(`❌ Lỗi khi chuyển đổi ${key} thành JSON:`, e);
              values.push(String(value) || null);
            }
          } else {
            values.push(value);
          }
        }
      }
      if (setFields.length === 0) {
        return {
          success: true
        };
      }
      if (!updates.hasOwnProperty('updatedAt') && !updates.hasOwnProperty('lastUpdated')) {
        setFields.push('updatedAt = ?');
        values.push(now);
      }
      values.push(id);
      const sql = `UPDATE accounts SET ${setFields.join(', ')} WHERE id = ?`;
      const stmt = this.db.prepare(sql);
      log(`🔄 Updating account ${id} with fields: ${setFields.join(', ')}`);
      const result = stmt.run(...values);
      if (result.changes > 0) {
        log(`✅ Updated account ${id}`);
        return {
          success: true
        };
      } else {
        return {
          success: false,
          error: 'Account not found'
        };
      }
    } catch (err) {
      error('❌ Error updating account:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Cập nhật stats của account
   */
  async updateAccountStats(accountId, stats) {
    try {
      const stmt = this.db.prepare(`
                UPDATE accounts SET 
                    viewerCount = ?,
                    followCount = ?,
                    shareCount = ?,
                    totalViews = ?,
                    totalShares = ?,
                    totalFollows = ?,
                    isLive = ?,
                    lastActive = ?,
                    activeRooms = ?,
                    updatedAt = ?
                WHERE id = ?
            `);
      const result = stmt.run(stats.viewerCount || 0, stats.followCount || 0, stats.shareCount || 0, stats.totalViews || 0, stats.totalShares || 0, stats.totalFollows || 0, stats.isLive ? 1 : 0, new Date().toISOString(), stats.activeRooms ? JSON.stringify(stats.activeRooms) : '[]', new Date().toISOString(), accountId);
      return result.changes > 0;
    } catch (error) {
      error('Error updating account stats:', error);
      return false;
    }
  }

  /**
   * Xóa tất cả room relationships của account
   */
  async clearAccountRooms(accountId) {
    try {
      const stmt = this.db.prepare(`
                DELETE FROM account_rooms WHERE accountId = ?
            `);
      const now = new Date().toISOString();

      // Cập nhật trường activeRooms và currentRooms trong bảng accounts
      const updateStmt = this.db.prepare(`
                UPDATE accounts 
                SET activeRooms = '[]',
                    currentRooms = 0,
                    updatedAt = ?
                WHERE id = ?
            `);
      updateStmt.run(now, accountId);
      const result = stmt.run(accountId);
      log(`✅ Cleared ${result.changes} room relationships for account ${accountId}`);
      return result.changes;
    } catch (error) {
      error('Error clearing account rooms:', error);
      return 0;
    }
  }

  /**
   * Lấy active rooms của account từ trường activeRooms
   */
  async getAccountActiveRooms(accountId) {
    try {
      // Thử đầu tiên từ trường activeRooms
      const accountStmt = this.db.prepare(`
                SELECT activeRooms FROM accounts WHERE id = ?
            `);
      const accountData = accountStmt.get(accountId);
      if (accountData && accountData.activeRooms) {
        try {
          const activeRooms = JSON.parse(accountData.activeRooms);
          if (Array.isArray(activeRooms) && activeRooms.length > 0) {
            // Nếu có dữ liệu từ activeRooms, trả về
            return this.serializeForIPC(activeRooms);
          }
        } catch (e) {
          error('Error parsing activeRooms JSON:', e);
        }
      }

      // Fall back to relationship table
      const stmt = this.db.prepare(`
                SELECT r.* FROM rooms r
                INNER JOIN account_rooms ar ON r.uid = ar.roomId
                WHERE ar.accountId = ?
                ORDER BY r.createdAt DESC
            `);
      const rooms = stmt.all(accountId).map(room => ({
        ...room,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt
      }));

      // Cập nhật activeRooms trong account
      if (rooms.length > 0) {
        const updateStmt = this.db.prepare(`
                    UPDATE accounts SET activeRooms = ? WHERE id = ?
                `);
        updateStmt.run(JSON.stringify(rooms), accountId);
      }
      return this.serializeForIPC(rooms);
    } catch (error) {
      error('Error getting account active rooms:', error);
      return [];
    }
  }

  /**
   * Import accounts từ text (mỗi dòng một account)
   */
  async importAccountsFromText(text, folderId = null) {
    try {
      log(`📥 Importing accounts from text. Length: ${text.length}, FolderId: ${folderId || 'null'}, Type: ${typeof folderId}`);

      // Xử lý folderId nếu là 'default' hoặc null
      if (!folderId || folderId === 'default') {
        // Kiểm tra xem folder 'default' có tồn tại không
        const checkFolder = this.db.prepare(`
                    SELECT id FROM folders WHERE type = 'accounts' AND (id = 'default' OR name = 'Default')
                `).get();
        if (!checkFolder) {
          log('📁 Creating default accounts folder');
          // Tạo folder mặc định nếu chưa có
          const defaultFolderId = 'default';
          const now = new Date().toISOString();
          const folderStmt = this.db.prepare(`
                        INSERT INTO folders (id, name, type, color, description, createdAt, updatedAt)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `);
          folderStmt.run(defaultFolderId, 'Default', 'accounts', '#3B82F6',
          // Blue color
          'Default folder for accounts', now, now);
          log('✅ Created default accounts folder');
          folderId = defaultFolderId;
        } else {
          folderId = checkFolder.id;
          log(`📁 Using existing default folder: ${folderId}`);
        }
      } else {
        // Kiểm tra xem folder đã chọn có tồn tại không
        const checkFolder = this.db.prepare(`
                    SELECT id FROM folders WHERE id = ?
                `).get(folderId);
        if (!checkFolder) {
          error(`❌ Folder with ID ${folderId} does not exist`);
          return {
            success: false,
            error: `Folder with ID ${folderId} does not exist`,
            results: [],
            imported: 0,
            total: 0
          };
        }
      }
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      const results = [];
      for (const line of lines) {
        // Parse account info từ line
        const accountData = this.parseAccountLine(line);
        accountData.folderId = folderId;
        try {
          const result = await this.addAccount(accountData);
          results.push({
            username: accountData.username,
            success: result.success,
            error: result.error
          });
        } catch (error) {
          error(`❌ Error adding account ${accountData.username}:`, error);
          results.push({
            username: accountData.username,
            success: false,
            error: error.message
          });
        }
      }
      const successCount = results.filter(r => r.success).length;
      log(`✅ Imported ${successCount}/${results.length} accounts`);
      return {
        success: true,
        results: results,
        imported: successCount,
        total: results.length
      };
    } catch (error) {
      error('❌ Error importing accounts from text:', error);
      return {
        success: false,
        error: error.message,
        results: [],
        imported: 0,
        total: 0
      };
    }
  }

  /**
   * Parse account line từ text
   */
  parseAccountLine(line) {
    // Support multiple formats:
    // 1. Just username: "username123"
    // 2. Username:sessionId: "username123:session_token_here" 
    // 3. JSON format: {"username": "username123", "sessionId": "token", ...}
    // 4. Pipe-separated: "username|password|email|emailpass|cookie"

    try {
      // Try JSON format first
      const jsonData = JSON.parse(line);
      return {
        username: jsonData.username || jsonData.user || '',
        sessionId: jsonData.sessionId || jsonData.session || null,
        password: jsonData.password || null,
        email: jsonData.email || null,
        emailPassword: jsonData.emailPassword || null,
        cookie: jsonData.cookie || null,
        lastUsed: jsonData.lastUsed || null,
        currentRooms: jsonData.currentRooms || 0,
        avatarThumb: jsonData.avatarThumb || null,
        roomUsername: jsonData.roomUsername || null,
        activeRooms: jsonData.activeRooms || [],
        notes: jsonData.notes || '',
        status: jsonData.status || 'active',
        proxyId: jsonData.proxyId || null,
        metadata: jsonData.metadata || {}
      };
    } catch {
      // Thử format pipe-separated
      if (line.includes('|')) {
        const parts = line.split('|');
        // username|password|email|emailpass|cookie
        const username = parts[0]?.trim() || '';
        const password = parts[1]?.trim() || '';
        const email = parts[2]?.trim() || '';
        const emailPassword = parts[3]?.trim() || '';
        const cookie = parts[4]?.trim() || '';
        log(`📝 Parsed pipe-separated account: ${username}`);
        return {
          username,
          sessionId: cookie || null,
          // Có thể dùng cookie làm sessionId
          password,
          email,
          emailPassword,
          cookie,
          notes: `Email: ${email}`,
          status: 'active',
          proxyId: null,
          currentRooms: 0,
          metadata: {},
          activeRooms: []
        };
      }
      // Thử format colon-separated
      else if (line.includes(':')) {
        const parts = line.split(':');
        // Có thể có nhiều hơn 2 phần (username:sessionId:note:status...)
        if (parts.length >= 2) {
          return {
            username: parts[0].trim(),
            sessionId: parts[1].trim() || null,
            notes: parts[2] ? parts[2].trim() : '',
            status: parts[3] ? parts[3].trim() : 'active',
            proxyId: null,
            currentRooms: 0,
            metadata: {},
            activeRooms: []
          };
        }
      }

      // Just username
      return {
        username: line.trim(),
        sessionId: null,
        notes: '',
        status: 'active',
        proxyId: null,
        currentRooms: 0,
        metadata: {},
        activeRooms: []
      };
    }
  }
}
module.exports = AccountStorage;

/***/ }),

/***/ "./lib/storage/base-storage.js":
/*!*************************************!*\
  !*** ./lib/storage/base-storage.js ***!
  \*************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const Database = __webpack_require__(/*! better-sqlite3 */ "better-sqlite3");
const path = __webpack_require__(/*! path */ "path");
const fs = __webpack_require__(/*! fs */ "fs");
const {
  log,
  error
} = __webpack_require__(/*! ../logger */ "./lib/logger.js");
class BaseStorage {
  constructor() {
    this.db = null;
    this.dbPath = null;
    this.defaultSettings = {
      autoStart: false,
      minimizeToTray: true,
      theme: 'dark',
      notifications: true,
      autoUpdate: true,
      maxConcurrentConnections: 5,
      connectionTimeout: 30000,
      retryDelay: 5000,
      maxRetries: 3
    };
  }

  /**
   * Khởi tạo database connection
   */
  async init() {
    try {
      const {
        app
      } = __webpack_require__(/*! electron */ "electron");
      const userDataPath = app.getPath('userData');
      this.dbPath = path.join(userDataPath, 'tiktok-live.db');

      // Tạo thư mục nếu chưa có
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {
          recursive: true
        });
      }
      this.db = new Database(this.dbPath, {
        verbose:  true ? log : 0
      });

      // Enable WAL mode và foreign keys
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');
      this.db.pragma('synchronous = NORMAL');
      log('✅ SQLite database initialized:', this.dbPath);
      return true;
    } catch (err) {
      error('❌ Error initializing SQLite database:', err);
      throw err;
    }
  }

  /**
   * Đóng database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      log('✅ SQLite database closed');
    }
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Extract username từ account info
   */
  extractUsername(accountInfo) {
    if (typeof accountInfo === 'string') {
      return accountInfo;
    }
    return accountInfo?.username || accountInfo?.uniqueId || accountInfo?.user?.username || 'Unknown';
  }

  /**
   * Extract proxy host từ proxy info
   */
  extractProxyHost(proxyInfo) {
    if (typeof proxyInfo === 'string') {
      return proxyInfo.split(':')[0] || proxyInfo;
    }
    return proxyInfo?.host || proxyInfo?.ip || 'Unknown';
  }

  /**
   * Serialize object cho IPC compatibility
   */
  serializeForIPC(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
}
module.exports = BaseStorage;

/***/ }),

/***/ "./lib/storage/database-schema.js":
/*!****************************************!*\
  !*** ./lib/storage/database-schema.js ***!
  \****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const BaseStorage = __webpack_require__(/*! ./base-storage */ "./lib/storage/base-storage.js");
const {
  log,
  error
} = __webpack_require__(/*! ../logger */ "./lib/logger.js");
class DatabaseSchema extends BaseStorage {
  /**
   * Tạo tất cả tables
   */
  createTables() {
    log('🔧 Creating database tables...');

    // Folders table
    this.db.exec(`
            CREATE TABLE IF NOT EXISTS folders (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL CHECK (type IN ('accounts', 'proxies')),
                color TEXT DEFAULT '#007bff',
                description TEXT DEFAULT '',
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL,
                UNIQUE(name, type)
            )
        `);

    // Accounts table
    this.db.exec(`
            CREATE TABLE IF NOT EXISTS accounts (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL UNIQUE,
                sessionId TEXT,
                password TEXT,
                email TEXT,
                emailPassword TEXT,
                cookie TEXT,
                folderId TEXT,
                status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error', 'connecting')),
                lastActive TEXT,
                lastUsed TEXT,
                currentRooms INTEGER DEFAULT 0,
                avatarThumb TEXT,
                roomUsername TEXT,
                activeRooms TEXT DEFAULT '[]',
                viewerCount INTEGER DEFAULT 0,
                followCount INTEGER DEFAULT 0,
                shareCount INTEGER DEFAULT 0,
                totalViews INTEGER DEFAULT 0,
                totalShares INTEGER DEFAULT 0,
                totalFollows INTEGER DEFAULT 0,
                isLive INTEGER DEFAULT 0,
                proxyId TEXT,
                metadata TEXT DEFAULT '{}',
                notes TEXT DEFAULT '',
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL,
                FOREIGN KEY (folderId) REFERENCES folders(id) ON DELETE SET NULL,
                FOREIGN KEY (proxyId) REFERENCES proxies(id) ON DELETE SET NULL
            )
        `);

    // Proxies table  
    this.db.exec(`
            CREATE TABLE IF NOT EXISTS proxies (
                id TEXT PRIMARY KEY,
                host TEXT NOT NULL,
                port INTEGER NOT NULL,
                username TEXT,
                password TEXT,
                type TEXT DEFAULT 'http' CHECK (type IN ('http', 'https', 'socks4', 'socks5')),
                folderId TEXT,
                status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error', 'testing', 'unknown')),
                lastTested TEXT,
                responseTime INTEGER DEFAULT 0,
                notes TEXT DEFAULT '',
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL,
                FOREIGN KEY (folderId) REFERENCES folders(id) ON DELETE SET NULL,
                UNIQUE(host, port)
            )
        `);

    // Rooms table
    this.db.exec(`
            CREATE TABLE IF NOT EXISTS rooms (
                uid TEXT PRIMARY KEY,
                id TEXT,
                roomId TEXT,
                roomUrl TEXT,
                roomUsername TEXT,
                nickname TEXT,
                avatar TEXT,
                avatarThumb TEXT,
                title TEXT DEFAULT '',
                viewerCount INTEGER DEFAULT 0,
                currentViewers INTEGER DEFAULT 0,
                startCount INTEGER DEFAULT 0,
                targetViewers INTEGER DEFAULT 0,
                duration INTEGER DEFAULT 30,
                isLive INTEGER DEFAULT 0,
                lastViewed TEXT,
                notes TEXT DEFAULT '',
                status TEXT DEFAULT 'stopped',
                startedAt TEXT,
                endedAt TEXT,
                realViewers INTEGER DEFAULT 0,
                lastTimeCheckViewers TEXT,
                stoppedAt TEXT,
                stopReason TEXT,
                finalDuration INTEGER DEFAULT 0,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
        `);

    // Account-Room relationship table
    this.db.exec(`
            CREATE TABLE IF NOT EXISTS account_rooms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                accountId TEXT NOT NULL,
                roomId TEXT NOT NULL,
                createdAt TEXT NOT NULL,
                FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE,
                FOREIGN KEY (roomId) REFERENCES rooms(uid) ON DELETE CASCADE,
                UNIQUE(accountId, roomId)
            )
        `);

    // Viewer history table
    this.db.exec(`
            CREATE TABLE IF NOT EXISTS viewer_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                roomUid TEXT NOT NULL,
                viewerCount INTEGER NOT NULL,
                timestamp TEXT NOT NULL,
                FOREIGN KEY (roomUid) REFERENCES rooms(uid) ON DELETE CASCADE
            )
        `);

    // Settings table
    this.db.exec(`
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
        `);

    // Tasks table
    this.db.exec(`
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                handler TEXT NOT NULL,
                interval INTEGER NOT NULL,
                enabled INTEGER DEFAULT 1,
                status TEXT DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'completed', 'failed')),
                lastRun TEXT,
                nextRun TEXT,
                runCount INTEGER DEFAULT 0,
                errorCount INTEGER DEFAULT 0,
                lastError TEXT,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
        `);

    // Create indexes for better performance
    this.createIndexes();
    log('✅ Database tables created successfully');
  }

  /**
   * Tạo indexes
   */
  createIndexes() {
    try {
      // Folders indexes
      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_folders_type ON folders(type)`);

      // Accounts indexes
      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_accounts_username ON accounts(username)`);
      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_accounts_folder ON accounts(folderId)`);
      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status)`);
      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_accounts_proxy ON accounts(proxyId)`);

      // Proxies indexes
      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_proxies_folder ON proxies(folderId)`);
      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_proxies_status ON proxies(status)`);
      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_proxies_host_port ON proxies(host, port)`);

      // Rooms indexes
      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_rooms_roomUsername ON rooms(roomUsername)`);
      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_rooms_live ON rooms(isLive)`);

      // Account-rooms indexes
      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_account_rooms_account ON account_rooms(accountId)`);
      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_account_rooms_room ON account_rooms(roomId)`);

      // Viewer history indexes
      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_viewer_history_room ON viewer_history(roomUid)`);
      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_viewer_history_timestamp ON viewer_history(timestamp)`);

      // Tasks indexes
      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`);
      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_enabled ON tasks(enabled)`);
      log('✅ Database indexes created successfully');
    } catch (error) {
      error('❌ Error creating indexes:', error);
    }
  }

  /**
   * Insert default data
   */
  async insertDefaultData() {
    try {
      log('🔧 Inserting default data...');

      // Insert default settings
      const settingsStmt = this.db.prepare(`
                INSERT OR IGNORE INTO settings (key, value, updatedAt)
                VALUES (?, ?, ?)
            `);
      const now = new Date().toISOString();
      for (const [key, value] of Object.entries(this.defaultSettings)) {
        settingsStmt.run(key, JSON.stringify(value), now);
      }
      log('✅ Default data inserted successfully');
    } catch (error) {
      error('❌ Error inserting default data:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra database integrity
   */
  checkIntegrity() {
    try {
      const result = this.db.pragma('integrity_check');
      if (result[0].integrity_check === 'ok') {
        log('✅ Database integrity check passed');
        return true;
      } else {
        error('❌ Database integrity check failed:', result);
        return false;
      }
    } catch (error) {
      error('❌ Error checking database integrity:', error);
      return false;
    }
  }

  /**
   * Kiểm tra và cập nhật schema database
   */
  async migrateSchema() {
    try {
      log('🔧 Checking and migrating database schema...');

      // Kiểm tra và sửa bảng rooms nếu có vấn đề
      await this.fixRoomsTable();

      // Kiểm tra cột activeRooms trong bảng accounts
      if (!this.columnExists('accounts', 'activeRooms')) {
        log('➕ Adding column activeRooms to accounts table');
        this.db.exec(`ALTER TABLE accounts ADD COLUMN activeRooms TEXT DEFAULT '[]'`);
      }

      // Kiểm tra cột password trong bảng accounts
      if (!this.columnExists('accounts', 'password')) {
        log('➕ Adding column password to accounts table');
        this.db.exec(`ALTER TABLE accounts ADD COLUMN password TEXT`);
      }

      // Kiểm tra cột email trong bảng accounts
      if (!this.columnExists('accounts', 'email')) {
        log('➕ Adding column email to accounts table');
        this.db.exec(`ALTER TABLE accounts ADD COLUMN email TEXT`);
      }

      // Kiểm tra cột emailPassword trong bảng accounts
      if (!this.columnExists('accounts', 'emailPassword')) {
        log('➕ Adding column emailPassword to accounts table');
        this.db.exec(`ALTER TABLE accounts ADD COLUMN emailPassword TEXT`);
      }

      // Kiểm tra cột lastUsed trong bảng accounts
      if (!this.columnExists('accounts', 'lastUsed')) {
        log('➕ Adding column lastUsed to accounts table');
        this.db.exec(`ALTER TABLE accounts ADD COLUMN lastUsed TEXT`);
      }

      // Kiểm tra cột currentRooms trong bảng accounts
      if (!this.columnExists('accounts', 'currentRooms')) {
        log('➕ Adding column currentRooms to accounts table');
        this.db.exec(`ALTER TABLE accounts ADD COLUMN currentRooms INTEGER DEFAULT 0`);
      }

      // Kiểm tra cột avatarThumb trong bảng accounts
      if (!this.columnExists('accounts', 'avatarThumb')) {
        log('➕ Adding column avatarThumb to accounts table');
        this.db.exec(`ALTER TABLE accounts ADD COLUMN avatarThumb TEXT`);
      }

      // Kiểm tra cột roomUsername trong bảng accounts
      if (!this.columnExists('accounts', 'roomUsername')) {
        log('➕ Adding column roomUsername to accounts table');
        this.db.exec(`ALTER TABLE accounts ADD COLUMN roomUsername TEXT`);
      }
      // Kiểm tra cột cookie trong bảng accounts
      if (!this.columnExists('accounts', 'cookie')) {
        log('➕ Adding column cookie to accounts table');
        this.db.exec(`ALTER TABLE accounts ADD COLUMN cookie TEXT`);
      }

      // Kiểm tra xem có cột username trong bảng rooms không (lỗi schema cũ)
      if (this.columnExists('rooms', 'username') && !this.columnExists('rooms', 'roomUsername')) {
        log('🔄 Migrating from username to roomUsername in rooms table');
        // Thêm cột roomUsername mới
        this.db.exec(`ALTER TABLE rooms ADD COLUMN roomUsername TEXT`);

        // Sao chép dữ liệu từ username sang roomUsername
        this.db.exec(`UPDATE rooms SET roomUsername = username WHERE roomUsername IS NULL AND username IS NOT NULL`);

        // Thay đổi index
        this.db.exec(`DROP INDEX IF EXISTS idx_rooms_username`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_rooms_roomUsername ON rooms(roomUsername)`);
      }

      // Kiểm tra các trường bổ sung trong bảng rooms
      const additionalRoomColumns = [{
        name: 'id',
        type: 'TEXT'
      }, {
        name: 'roomId',
        type: 'TEXT'
      }, {
        name: 'roomUrl',
        type: 'TEXT'
      }, {
        name: 'roomUsername',
        type: 'TEXT'
      }, {
        name: 'avatarThumb',
        type: 'TEXT'
      }, {
        name: 'startCount',
        type: 'INTEGER DEFAULT 0'
      }, {
        name: 'targetViewers',
        type: 'INTEGER DEFAULT 0'
      }, {
        name: 'currentViewers',
        type: 'INTEGER DEFAULT 0'
      }, {
        name: 'duration',
        type: 'INTEGER DEFAULT 30'
      }, {
        name: 'status',
        type: 'TEXT DEFAULT "stopped"'
      }, {
        name: 'startedAt',
        type: 'TEXT'
      }, {
        name: 'endedAt',
        type: 'TEXT'
      }, {
        name: 'realViewers',
        type: 'INTEGER DEFAULT 0'
      }, {
        name: 'lastTimeCheckViewers',
        type: 'TEXT'
      }, {
        name: 'stoppedAt',
        type: 'TEXT'
      }, {
        name: 'stopReason',
        type: 'TEXT'
      }, {
        name: 'finalDuration',
        type: 'INTEGER DEFAULT 0'
      }];
      for (const column of additionalRoomColumns) {
        if (!this.columnExists('rooms', column.name)) {
          log(`➕ Adding column ${column.name} to rooms table`);
          this.db.exec(`ALTER TABLE rooms ADD COLUMN ${column.name} ${column.type}`);
        }
      }

      // Cập nhật các constraint cho trạng thái
      try {
        // Kiểm tra định nghĩa constraint status trong bảng proxies
        const proxyStatusInfo = this.db.prepare(`
                    SELECT sql FROM sqlite_master 
                    WHERE type='table' AND name='proxies'
                `).get();

        // Nếu không có constraint 'active' thì thêm vào
        if (proxyStatusInfo && proxyStatusInfo.sql && !proxyStatusInfo.sql.includes("'active'") && proxyStatusInfo.sql.includes("status TEXT")) {
          log('🔄 Recreating proxies table with updated status constraint');
          // Lưu dữ liệu hiện tại
          this.db.exec(`CREATE TABLE IF NOT EXISTS proxies_temp AS SELECT * FROM proxies`);
          // Xóa bảng cũ
          this.db.exec(`DROP TABLE proxies`);
          // Tạo lại bảng với constraint mới
          this.db.exec(`
                        CREATE TABLE IF NOT EXISTS proxies (
                            id TEXT PRIMARY KEY,
                            host TEXT NOT NULL,
                            port INTEGER NOT NULL,
                            username TEXT,
                            password TEXT,
                            type TEXT DEFAULT 'http' CHECK (type IN ('http', 'https', 'socks4', 'socks5')),
                            folderId TEXT,
                            status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error', 'testing', 'unknown')),
                            lastTested TEXT,
                            responseTime INTEGER DEFAULT 0,
                            notes TEXT DEFAULT '',
                            createdAt TEXT NOT NULL,
                            updatedAt TEXT NOT NULL,
                            FOREIGN KEY (folderId) REFERENCES folders(id) ON DELETE SET NULL,
                            UNIQUE(host, port)
                        )
                    `);
          // Khôi phục dữ liệu
          this.db.exec(`INSERT INTO proxies SELECT * FROM proxies_temp`);
          // Xóa bảng tạm
          this.db.exec(`DROP TABLE proxies_temp`);
        }

        // Kiểm tra định nghĩa constraint status trong bảng accounts
        const accountStatusInfo = this.db.prepare(`
                    SELECT sql FROM sqlite_master 
                    WHERE type='table' AND name='accounts'
                `).get();
        if (accountStatusInfo && accountStatusInfo.sql && !accountStatusInfo.sql.includes("'active'") && accountStatusInfo.sql.includes("status TEXT")) {
          log('🔄 Recreating accounts table with updated status constraint');
          // Lưu dữ liệu hiện tại
          this.db.exec(`CREATE TABLE IF NOT EXISTS accounts_temp AS SELECT * FROM accounts`);
          // Xóa bảng cũ
          this.db.exec(`DROP TABLE accounts`);
          // Tạo lại bảng với constraint mới
          this.createTables(); // Tạo lại tất cả tables
          // Khôi phục dữ liệu
          this.db.exec(`
                        INSERT OR IGNORE INTO accounts 
                        SELECT * FROM accounts_temp
                    `);
          // Xóa bảng tạm
          this.db.exec(`DROP TABLE accounts_temp`);
        }
      } catch (error) {
        error('❌ Error updating constraints:', error);
      }
      log('✅ Database schema migration completed successfully');
      return true;
    } catch (error) {
      error('❌ Error migrating database schema:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra xem cột có tồn tại trong bảng không
   */
  columnExists(table, column) {
    try {
      const result = this.db.prepare(`PRAGMA table_info(${table})`).all();
      return result.some(col => col.name === column);
    } catch (error) {
      error(`❌ Error checking if column ${column} exists in ${table}:`, error);
      return false;
    }
  }

  /**
   * Get database info
   */
  getDatabaseInfo() {
    try {
      const info = {
        path: this.dbPath,
        size: (__webpack_require__(/*! fs */ "fs").statSync)(this.dbPath).size,
        tables: [],
        version: this.db.pragma('user_version')[0].user_version
      };

      // Get table names và row counts
      const tables = this.db.prepare(`
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
            `).all();
      for (const table of tables) {
        const count = this.db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
        info.tables.push({
          name: table.name,
          rows: count.count
        });
      }
      return info;
    } catch (error) {
      error('Error getting database info:', error);
      return null;
    }
  }

  /**
   * Kiểm tra và sửa chữa bảng rooms nếu có lỗi schema
   */
  async fixRoomsTable() {
    try {
      log('🔧 Kiểm tra cấu trúc bảng rooms...');

      // Lấy thông tin về bảng rooms
      const tableInfo = this.db.prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'rooms'`).get();

      // Kiểm tra xem bảng có cột username bắt buộc không tồn tại trong schema
      if (tableInfo && tableInfo.sql && tableInfo.sql.includes('username TEXT NOT NULL')) {
        log('❌ Phát hiện schema lỗi: cột username NOT NULL trong bảng rooms');

        // Lưu dữ liệu hiện tại
        log('⏳ Sao lưu dữ liệu hiện tại...');
        this.db.exec(`CREATE TABLE IF NOT EXISTS rooms_backup AS SELECT * FROM rooms`);

        // Xóa index cũ
        log('⏳ Xóa index cũ...');
        this.db.exec(`DROP INDEX IF EXISTS idx_rooms_username`);
        this.db.exec(`DROP INDEX IF EXISTS idx_rooms_live`);

        // Xóa bảng cũ
        log('⏳ Xóa bảng cũ để tạo lại...');
        this.db.exec(`DROP TABLE rooms`);

        // Tạo lại bảng với schema đúng
        log('⏳ Tạo lại bảng với schema chính xác...');
        this.db.exec(`
                    CREATE TABLE IF NOT EXISTS rooms (
                        uid TEXT PRIMARY KEY,
                        id TEXT,
                        roomId TEXT,
                        roomUrl TEXT,
                        roomUsername TEXT,
                        nickname TEXT,
                        avatar TEXT,
                        avatarThumb TEXT,
                        title TEXT DEFAULT '',
                        viewerCount INTEGER DEFAULT 0,
                        currentViewers INTEGER DEFAULT 0,
                        startCount INTEGER DEFAULT 0,
                        targetViewers INTEGER DEFAULT 0,
                        duration INTEGER DEFAULT 30,
                        isLive INTEGER DEFAULT 0,
                        lastViewed TEXT,
                        notes TEXT DEFAULT '',
                        status TEXT DEFAULT 'stopped',
                        startedAt TEXT,
                        endedAt TEXT,
                        realViewers INTEGER DEFAULT 0,
                        lastTimeCheckViewers TEXT,
                        stoppedAt TEXT,
                        stopReason TEXT,
                        finalDuration INTEGER DEFAULT 0,
                        createdAt TEXT NOT NULL,
                        updatedAt TEXT NOT NULL
                    )
                `);

        // Tạo lại index
        log('⏳ Tạo lại index...');
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_rooms_roomUsername ON rooms(roomUsername)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_rooms_live ON rooms(isLive)`);

        // Khôi phục dữ liệu - sao chép từ username sang roomUsername
        log('⏳ Khôi phục dữ liệu từ bảng backup...');
        this.db.exec(`
                    INSERT INTO rooms 
                    SELECT 
                        uid, id, roomId, roomUrl, 
                        COALESCE(roomUsername, username) as roomUsername,
                        nickname, avatar, avatarThumb, title,
                        viewerCount, currentViewers, startCount, targetViewers, 
                        duration, isLive, lastViewed, notes, 
                        status, startedAt, endedAt, realViewers, 
                        lastTimeCheckViewers, stoppedAt, stopReason, finalDuration,
                        createdAt, updatedAt 
                    FROM rooms_backup
                `);

        // Xóa bảng backup
        log('⏳ Xóa bảng backup...');
        this.db.exec(`DROP TABLE rooms_backup`);
        log('✅ Đã sửa chữa bảng rooms thành công!');
      } else {
        log('✅ Cấu trúc bảng rooms OK');
      }
      return true;
    } catch (error) {
      error('❌ Error fixing rooms table:', error);
      return false;
    }
  }
}
module.exports = DatabaseSchema;

/***/ }),

/***/ "./lib/storage/folder-storage.js":
/*!***************************************!*\
  !*** ./lib/storage/folder-storage.js ***!
  \***************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const BaseStorage = __webpack_require__(/*! ./base-storage */ "./lib/storage/base-storage.js");
const {
  randomUUID
} = __webpack_require__(/*! crypto */ "crypto");
const {
  log,
  error
} = __webpack_require__(/*! ../logger */ "./lib/logger.js");
class FolderStorage extends BaseStorage {
  /**
   * Lấy tất cả folders theo type
   */
  async getAllFolders(type = 'accounts') {
    try {
      log(`🔍 Getting all folders for type: ${type}`);
      const stmt = this.db.prepare(`
                SELECT * FROM folders 
                WHERE type = ? 
                ORDER BY name ASC
            `);
      const folders = stmt.all(type).map(folder => ({
        ...folder,
        // Keep as ISO strings for IPC compatibility
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt
      }));
      log(`✅ Found ${folders.length} folders for type ${type}`);
      return this.serializeForIPC(folders);
    } catch (err) {
      error('❌ Error getting all folders:', err);
      return [];
    }
  }

  /**
   * Tạo folder mới
   */
  async createFolder(type, folderData) {
    try {
      log(`🔧 Creating new folder: ${folderData.name} (type: ${type})`);

      // Kiểm tra folder đã tồn tại chưa
      const existingFolder = await this.getFolderByName(type, folderData.name);
      if (existingFolder) {
        log(`⚠️ Folder already exists: ${folderData.name}`);
        return {
          success: false,
          error: `Folder '${folderData.name}' đã tồn tại trong ${type}`
        };
      }
      const id = randomUUID();
      const now = new Date().toISOString();
      const stmt = this.db.prepare(`
                INSERT INTO folders (
                    id, name, type, color, description,
                    createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
      stmt.run(id, folderData.name, type, folderData.color || '#007bff', folderData.description || '', now, now);
      const newFolder = {
        id,
        name: folderData.name,
        type,
        color: folderData.color || '#007bff',
        description: folderData.description || '',
        createdAt: now,
        updatedAt: now
      };
      log(`✅ Created new folder: ${folderData.name} (id: ${id})`);
      return {
        success: true,
        data: newFolder
      };
    } catch (err) {
      error('❌ Error creating folder:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Cập nhật folder
   */
  async updateFolder(type, folderId, updates) {
    try {
      const now = new Date().toISOString();
      const setFields = [];
      const values = [];
      for (const [key, value] of Object.entries(updates)) {
        setFields.push(`${key} = ?`);
        values.push(value);
      }
      if (setFields.length === 0) {
        return {
          success: true
        };
      }
      setFields.push('updatedAt = ?');
      values.push(now);
      values.push(folderId);
      const sql = `UPDATE folders SET ${setFields.join(', ')} WHERE id = ? AND type = ?`;
      values.push(type);
      const stmt = this.db.prepare(sql);
      const result = stmt.run(...values);
      if (result.changes > 0) {
        log(`✅ Updated ${type} folder ${folderId}`);
        return {
          success: true
        };
      } else {
        return {
          success: false,
          error: 'Folder not found'
        };
      }
    } catch (error) {
      error('Error updating folder:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Xóa folder
   */
  async deleteFolder(type, folderId) {
    try {
      // Kiểm tra xem folder có items không
      const checkTable = type === 'accounts' ? 'accounts' : 'proxies';
      const checkStmt = this.db.prepare(`
                SELECT COUNT(*) as count FROM ${checkTable} WHERE folderId = ?
            `);
      const result = checkStmt.get(folderId);
      if (result.count > 0) {
        return {
          success: false,
          error: `Cannot delete folder. It contains ${result.count} items.`
        };
      }

      // Xóa folder
      const deleteStmt = this.db.prepare(`
                DELETE FROM folders WHERE id = ? AND type = ?
            `);
      const deleteResult = deleteStmt.run(folderId, type);
      if (deleteResult.changes > 0) {
        log(`✅ Deleted ${type} folder ${folderId}`);
        return {
          success: true
        };
      } else {
        return {
          success: false,
          error: 'Folder not found'
        };
      }
    } catch (err) {
      error('Error deleting folder:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Get folder by ID
   */
  async getFolderById(type, folderId) {
    try {
      const stmt = this.db.prepare(`
                SELECT * FROM folders WHERE id = ? AND type = ?
            `);
      const folder = stmt.get(folderId, type);
      return folder ? this.serializeForIPC(folder) : null;
    } catch (error) {
      error('Error getting folder by ID:', error);
      return null;
    }
  }

  /**
   * Lấy folder theo tên
   */
  async getFolderByName(type, name) {
    try {
      log(`🔎 Looking for folder with name: "${name}" and type: "${type}"`);
      const stmt = this.db.prepare(`
                SELECT * FROM folders 
                WHERE type = ? AND name = ?
            `);
      const result = stmt.get(type, name);
      log(`🔍 Folder lookup result: ${result ? `Found folder with ID ${result.id}` : 'No folder found'}`);
      return result;
    } catch (err) {
      error('❌ Error getting folder by name:', err);
      return null;
    }
  }
}
module.exports = FolderStorage;

/***/ }),

/***/ "./lib/storage/proxy-storage.js":
/*!**************************************!*\
  !*** ./lib/storage/proxy-storage.js ***!
  \**************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const BaseStorage = __webpack_require__(/*! ./base-storage */ "./lib/storage/base-storage.js");
const {
  log,
  error
} = __webpack_require__(/*! ../../lib/logger */ "./lib/logger.js");
class ProxyStorage extends BaseStorage {
  /**
   * Lấy tất cả proxies
   */
  async getAllProxies() {
    try {
      const stmt = this.db.prepare(`
                SELECT p.*, f.name as folderName, f.color as folderColor
                FROM proxies p
                LEFT JOIN folders f ON p.folderId = f.id
                ORDER BY p.host ASC
            `);
      const proxies = stmt.all().map(proxy => ({
        ...proxy,
        port: parseInt(proxy.port),
        // Ensure port is integer for IPC
        lastTested: proxy.lastTested,
        createdAt: proxy.createdAt,
        updatedAt: proxy.updatedAt
      }));
      return this.serializeForIPC(proxies);
    } catch (error) {
      error('Error getting all proxies:', error);
      return [];
    }
  }

  /**
   * Lấy proxies theo folder
   */
  async getProxiesByFolder(folderId) {
    try {
      const stmt = this.db.prepare(`
                SELECT p.*, f.name as folderName, f.color as folderColor
                FROM proxies p
                LEFT JOIN folders f ON p.folderId = f.id
                WHERE p.folderId = ?
                ORDER BY p.host ASC
            `);
      const proxies = stmt.all(folderId).map(proxy => ({
        ...proxy,
        port: parseInt(proxy.port),
        lastTested: proxy.lastTested,
        createdAt: proxy.createdAt,
        updatedAt: proxy.updatedAt
      }));
      return this.serializeForIPC(proxies);
    } catch (error) {
      error('Error getting proxies by folder:', error);
      return [];
    }
  }

  /**
   * Thêm proxy mới
   */
  async addProxy(proxyData) {
    try {
      // Tạo ID mới nếu chưa có
      const proxyId = proxyData.id || this.generateId();
      const now = new Date().toISOString();

      // Host là bắt buộc
      if (!proxyData.host) {
        return {
          success: false,
          error: 'Host is required for proxy'
        };
      }

      // Validate port
      const port = parseInt(proxyData.port) || 8080;

      // Kiểm tra xem proxy đã tồn tại chưa
      const existingProxy = this.db.prepare(`
                SELECT id FROM proxies WHERE host = ? AND port = ?
            `).get(proxyData.host, port);
      if (existingProxy) {
        log(`⚠️ Proxy ${proxyData.host}:${port} đã tồn tại, sẽ cập nhật`);
        return this.updateProxy(existingProxy.id, {
          ...proxyData,
          updatedAt: now
        });
      }
      log(`📝 Adding proxy: ${proxyData.host}:${port}`);

      // Thêm proxy mới
      const stmt = this.db.prepare(`
                INSERT INTO proxies (
                    id, host, port, username, password, 
                    type, folderId, status, lastTested, 
                    responseTime, notes, createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
      stmt.run(proxyId, proxyData.host, port, proxyData.username || null, proxyData.password || null, proxyData.type || 'http', proxyData.folderId || null, proxyData.status || 'active',
      // Mặc định là active
      null, 0, proxyData.notes || '', now, now);
      const newProxy = {
        id: proxyId,
        host: proxyData.host,
        port: port,
        username: proxyData.username || null,
        password: proxyData.password || null,
        type: proxyData.type || 'http',
        folderId: proxyData.folderId || null,
        status: proxyData.status || 'active',
        // Mặc định là active
        lastTested: null,
        responseTime: 0,
        notes: proxyData.notes || '',
        createdAt: now,
        updatedAt: now
      };
      log(`✅ Added proxy: ${proxyData.host}:${port}`);
      return {
        success: true,
        proxy: this.serializeForIPC(newProxy)
      };
    } catch (error) {
      error('Error adding proxy:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Xóa proxy
   */
  async deleteProxy(proxyId) {
    try {
      // Update accounts using this proxy
      const updateAccountsStmt = this.db.prepare(`
                UPDATE accounts SET proxyId = NULL WHERE proxyId = ?
            `);
      updateAccountsStmt.run(proxyId);

      // Delete proxy
      const stmt = this.db.prepare(`DELETE FROM proxies WHERE id = ?`);
      const result = stmt.run(proxyId);
      if (result.changes > 0) {
        log(`✅ Deleted proxy ${proxyId}`);
        return {
          success: true
        };
      } else {
        return {
          success: false,
          error: 'Proxy not found'
        };
      }
    } catch (error) {
      error('Error deleting proxy:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cập nhật proxy
   */
  async updateProxy(id, updates) {
    try {
      const now = new Date().toISOString();
      const setFields = [];
      const values = [];
      for (const [key, value] of Object.entries(updates)) {
        // Sửa lỗi lastUpdated -> updatedAt
        if (key === 'lastUpdated') {
          log('⚠️ Cột lastUpdated được thay đổi thành updatedAt');
          setFields.push(`updatedAt = ?`);
          values.push(value);
          continue;
        }
        if (key === 'metadata') {
          setFields.push(`${key} = ?`);
          values.push(JSON.stringify(value));
        } else if (key === 'lastCheck') {
          setFields.push(`${key} = ?`);
          values.push(value ? value : null);
        } else {
          setFields.push(`${key} = ?`);
          values.push(value);
        }
      }
      if (setFields.length === 0) {
        return {
          success: true
        };
      }

      // Chỉ thêm updatedAt nếu không đã có trong updates
      if (!updates.hasOwnProperty('updatedAt') && !updates.hasOwnProperty('lastUpdated')) {
        setFields.push('updatedAt = ?');
        values.push(now);
      }
      values.push(id);
      const sql = `UPDATE proxies SET ${setFields.join(', ')} WHERE id = ?`;
      const stmt = this.db.prepare(sql);
      log(`🔄 Updating proxy ${id} with fields: ${setFields.join(', ')}`);
      const result = stmt.run(...values);
      if (result.changes > 0) {
        log(`✅ Updated proxy ${id}`);
        return {
          success: true
        };
      } else {
        return {
          success: false,
          error: 'Proxy not found'
        };
      }
    } catch (error) {
      error('Error updating proxy:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test proxy connection
   */
  async testProxy(proxyId) {
    try {
      const stmt = this.db.prepare(`SELECT * FROM proxies WHERE id = ?`);
      const proxy = stmt.get(proxyId);
      if (!proxy) {
        return {
          success: false,
          error: 'Proxy not found'
        };
      }

      // Update status to testing
      await this.updateProxy(proxyId, {
        status: 'testing'
      });
      const startTime = Date.now();
      let status = 'error';
      let responseTime = 0;
      try {
        // Test proxy bằng axios với timeout
        const axios = __webpack_require__(/*! axios */ "axios");
        const HttpsProxyAgent = __webpack_require__(/*! https-proxy-agent */ "https-proxy-agent");
        const proxyUrl = proxy.username && proxy.password ? `${proxy.type}://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}` : `${proxy.type}://${proxy.host}:${proxy.port}`;
        const agent = new HttpsProxyAgent(proxyUrl);
        await axios.get('https://httpbin.org/ip', {
          httpsAgent: agent,
          timeout: 10000
        });
        responseTime = Date.now() - startTime;
        status = 'active';
      } catch (error) {
        log(`Proxy test failed for ${proxy.host}:${proxy.port}:`, error.message);
        responseTime = Date.now() - startTime;
        status = 'error';
      }

      // Update proxy with test results
      await this.updateProxy(proxyId, {
        status: status,
        responseTime: responseTime,
        lastTested: new Date().toISOString()
      });
      log(`✅ Tested proxy ${proxy.host}:${proxy.port} - ${status} (${responseTime}ms)`);
      return {
        success: true,
        status: status,
        responseTime: responseTime
      };
    } catch (error) {
      error('Error testing proxy:', error);

      // Update status to failed on error
      await this.updateProxy(proxyId, {
        status: 'failed',
        lastTested: new Date().toISOString()
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get proxy by ID
   */
  async getProxyById(proxyId) {
    try {
      const stmt = this.db.prepare(`SELECT * FROM proxies WHERE id = ?`);
      const proxy = stmt.get(proxyId);
      if (!proxy) {
        log(`⚠️ Proxy not found with ID: ${proxyId}`);
        return null;
      }

      // Format proxyInfo để dễ sử dụng
      let proxyInfo;
      if (proxy.username && proxy.password) {
        proxyInfo = `${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
      } else {
        proxyInfo = `${proxy.host}:${proxy.port}`;
      }
      return {
        id: proxy.id,
        host: proxy.host,
        port: proxy.port,
        username: proxy.username,
        password: proxy.password,
        type: proxy.type,
        status: proxy.status,
        folderId: proxy.folderId,
        lastTested: proxy.lastTested,
        responseTime: proxy.responseTime,
        notes: proxy.notes,
        createdAt: proxy.createdAt,
        updatedAt: proxy.updatedAt,
        proxyInfo: proxyInfo
      };
    } catch (error) {
      error('Error getting proxy by ID:', error);
      return null;
    }
  }

  /**
   * Import proxies từ text (mỗi dòng một proxy)
   */
  async importProxiesFromText(text, folderId = null) {
    try {
      log(`📥 Importing proxies from text. Length: ${text.length}, FolderId: ${folderId || 'null'}`);

      // Xử lý folderId nếu là 'default' hoặc null
      if (!folderId || folderId === 'default') {
        // Kiểm tra xem folder 'default' có tồn tại không
        const checkFolder = this.db.prepare(`
                    SELECT id FROM folders WHERE type = 'proxies' AND (id = 'default' OR name = 'Default')
                `).get();
        if (!checkFolder) {
          log('📁 Creating default proxies folder');
          // Tạo folder mặc định nếu chưa có
          const defaultFolderId = 'default';
          const now = new Date().toISOString();
          const folderStmt = this.db.prepare(`
                        INSERT INTO folders (id, name, type, color, description, createdAt, updatedAt)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `);
          folderStmt.run(defaultFolderId, 'Default', 'proxies', '#3B82F6',
          // Blue color
          'Default folder for proxies', now, now);
          log('✅ Created default proxies folder');
          folderId = defaultFolderId;
        } else {
          folderId = checkFolder.id;
          log(`📁 Using existing default folder: ${folderId}`);
        }
      } else {
        // Kiểm tra xem folder đã chọn có tồn tại không
        const checkFolder = this.db.prepare(`
                    SELECT id FROM folders WHERE id = ?
                `).get(folderId);
        if (!checkFolder) {
          error(`❌ Folder with ID ${folderId} does not exist`);
          return {
            success: false,
            error: `Folder with ID ${folderId} does not exist`,
            results: [],
            imported: 0,
            total: 0
          };
        }
      }

      // Tách các dòng và lọc bỏ các dòng trống
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      const results = [];
      for (const line of lines) {
        try {
          // Parse thông tin proxy từ dòng text
          const proxyData = this.parseProxyLine(line);

          // Tạo proxy ID và thêm folderId
          const proxyId = this.generateId();
          proxyData.id = proxyId;
          proxyData.folderId = folderId;

          // Thêm proxy vào database
          const result = await this.addProxy(proxyData);
          results.push({
            proxy: line,
            success: result.success,
            id: result.success ? proxyId : null,
            error: result.error
          });
        } catch (error) {
          error('❌ Error parsing proxy line:', error);
          results.push({
            proxy: line,
            success: false,
            error: error.message
          });
        }
      }
      const successCount = results.filter(r => r.success).length;
      return {
        success: true,
        imported: successCount,
        total: lines.length,
        results: results
      };
    } catch (error) {
      error('❌ Error importing proxies from text:', error);
      return {
        success: false,
        error: error.message,
        imported: 0,
        total: 0,
        results: []
      };
    }
  }

  /**
   * Parse proxy info từ line text
   */
  parseProxyLine(line) {
    log('🔍 Parsing proxy line:', line);
    let host = '',
      port = 0,
      username = null,
      password = null,
      type = 'http';
    try {
      // Kiểm tra định dạng proxy
      if (line.includes('@')) {
        // Định dạng username:password@host:port
        const [auth, hostPort] = line.split('@');
        if (auth && auth.includes(':')) {
          [username, password] = auth.split(':');
        }
        if (hostPort && hostPort.includes(':')) {
          [host, port] = hostPort.split(':');
          port = parseInt(port, 10) || 8080;
        } else {
          host = hostPort || '';
          port = 8080;
        }
      } else if (line.includes(':')) {
        // Định dạng host:port hoặc host:port:username:password
        const parts = line.split(':');
        if (parts.length >= 2) {
          host = parts[0] || '';
          port = parseInt(parts[1], 10) || 8080;
          if (parts.length >= 4) {
            username = parts[2] || null;
            password = parts[3] || null;
          }
        }
      } else {
        // Chỉ có host
        host = line.trim();
        port = 8080; // Default port
      }

      // Kiểm tra xem có proxy type không (socks5://...)
      if (host.includes('://')) {
        const parts = host.split('://');
        type = parts[0] || 'http';
        host = parts[1] || '';
      }

      // Đảm bảo giá trị hợp lệ
      host = host.trim();
      port = parseInt(port, 10) || 8080;
      username = username ? username.trim() : null;
      password = password ? password.trim() : null;
      type = type.toLowerCase();
      if (!host) {
        throw new Error('Invalid proxy format: missing host');
      }
      const result = {
        host,
        port,
        username,
        password,
        type,
        status: 'active'
      };
      log('✅ Parsed proxy data:', result);
      return result;
    } catch (error) {
      error('❌ Error parsing proxy line:', error);
      // Fallback to basic proxy
      return {
        host: line.trim() || 'localhost',
        port: 8080,
        username: null,
        password: null,
        type: 'http',
        status: 'active'
      };
    }
  }

  /**
   * Di chuyển nhiều proxy vào một folder
   */
  async bulkMoveProxiesToFolder(proxyIds, folderId) {
    try {
      if (!Array.isArray(proxyIds) || proxyIds.length === 0) {
        return {
          success: false,
          error: 'Danh sách proxy không hợp lệ'
        };
      }
      log(`🔄 Di chuyển ${proxyIds.length} proxy vào folder ${folderId}`);
      const now = new Date().toISOString();
      const stmt = this.db.prepare(`
                UPDATE proxies 
                SET folderId = ?, updatedAt = ? 
                WHERE id IN (${proxyIds.map(() => '?').join(',')})
            `);
      const params = [folderId, now, ...proxyIds];
      const result = stmt.run(...params);
      if (result.changes > 0) {
        log(`✅ Đã di chuyển ${result.changes} proxy vào folder ${folderId}`);
        return {
          success: true,
          moved: result.changes,
          total: proxyIds.length
        };
      } else {
        return {
          success: true,
          moved: 0,
          total: proxyIds.length,
          message: 'Không có proxy nào được di chuyển'
        };
      }
    } catch (error) {
      error('Error moving proxies to folder:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test nhiều proxy cùng lúc
   */
  async bulkTestProxies(proxyIds) {
    try {
      if (!Array.isArray(proxyIds) || proxyIds.length === 0) {
        return {
          success: false,
          error: 'Danh sách proxy không hợp lệ'
        };
      }
      log(`🔄 Kiểm tra ${proxyIds.length} proxy`);
      const results = [];
      for (const proxyId of proxyIds) {
        try {
          const result = await this.testProxy(proxyId);
          results.push({
            id: proxyId,
            success: result.success,
            status: result.status,
            responseTime: result.responseTime
          });
        } catch (error) {
          results.push({
            id: proxyId,
            success: false,
            error: error.message
          });
        }
      }
      const successCount = results.filter(r => r.success && r.status === 'active').length;
      log(`✅ Đã kiểm tra ${results.length} proxy, ${successCount} hoạt động tốt`);
      return {
        success: true,
        results: results,
        working: successCount,
        total: results.length
      };
    } catch (error) {
      error('Error bulk testing proxies:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Xuất danh sách proxy theo định dạng
   */
  async exportProxies(format = 'ip_port_username_password', proxyIds = null) {
    try {
      let stmt;
      if (Array.isArray(proxyIds) && proxyIds.length > 0) {
        // Xuất proxy theo danh sách ID
        stmt = this.db.prepare(`
                    SELECT * FROM proxies 
                    WHERE id IN (${proxyIds.map(() => '?').join(',')})
                    ORDER BY host ASC
                `);
        stmt = stmt.all(...proxyIds);
      } else {
        // Xuất tất cả proxy
        stmt = this.db.prepare(`SELECT * FROM proxies ORDER BY host ASC`);
        stmt = stmt.all();
      }
      const proxies = stmt.map(proxy => ({
        ...proxy,
        port: parseInt(proxy.port) || 8080
      }));
      let exportData = '';
      for (const proxy of proxies) {
        let line = '';
        switch (format) {
          case 'ip_port':
            line = `${proxy.host}:${proxy.port}`;
            break;
          case 'ip_port_username':
            line = `${proxy.host}:${proxy.port}:${proxy.username || ''}`;
            break;
          case 'username_password_ip_port':
            if (proxy.username && proxy.password) {
              line = `${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
            } else {
              line = `${proxy.host}:${proxy.port}`;
            }
            break;
          case 'http_format':
            if (proxy.username && proxy.password) {
              line = `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
            } else {
              line = `http://${proxy.host}:${proxy.port}`;
            }
            break;
          default:
            // ip_port_username_password
            line = `${proxy.host}:${proxy.port}:${proxy.username || ''}:${proxy.password || ''}`;
            break;
        }
        exportData += line + '\n';
      }
      log(`✅ Đã xuất ${proxies.length} proxy với định dạng ${format}`);
      return {
        success: true,
        data: exportData,
        count: proxies.length,
        format: format
      };
    } catch (error) {
      error('Error exporting proxies:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
module.exports = ProxyStorage;

/***/ }),

/***/ "./lib/storage/room-storage.js":
/*!*************************************!*\
  !*** ./lib/storage/room-storage.js ***!
  \*************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const BaseStorage = __webpack_require__(/*! ./base-storage */ "./lib/storage/base-storage.js");
const {
  log,
  error
} = __webpack_require__(/*! ../logger */ "./lib/logger.js");
class RoomStorage extends BaseStorage {
  /**
   * Lấy tất cả rooms
   */
  async getAllRooms() {
    try {
      log('🔄 Gọi getAllRooms');
      const stmt = this.db.prepare(`
                SELECT * FROM rooms 
                ORDER BY lastViewed DESC, createdAt DESC
            `);
      const rooms = stmt.all();
      log(`📊 Đọc được ${rooms.length} phòng từ database`);

      // Xử lý dữ liệu trả về
      const processedRooms = rooms.map(room => {
        return {
          ...room,
          isLive: Boolean(room.isLive),
          // Chuyển đổi các trường số
          viewerCount: Number(room.viewerCount || 0),
          currentViewers: Number(room.currentViewers || 0),
          startCount: Number(room.startCount || 0),
          targetViewers: Number(room.targetViewers || 0),
          realViewers: Number(room.realViewers || 0),
          duration: Number(room.duration || 30),
          finalDuration: Number(room.finalDuration || 0),
          // Giữ nguyên các timestamp
          lastViewed: room.lastViewed,
          createdAt: room.createdAt,
          updatedAt: room.updatedAt,
          startedAt: room.startedAt,
          endedAt: room.endedAt,
          lastTimeCheckViewers: room.lastTimeCheckViewers,
          stoppedAt: room.stoppedAt
        };
      });
      log(`✅ Đã xử lý ${processedRooms.length} phòng, trả về cho UI`);
      return this.serializeForIPC(processedRooms);
    } catch (err) {
      error('❌ Error getting all rooms:', err);
      return [];
    }
  }

  /**
   * Thêm room mới
   */
  async addRoom(roomData) {
    try {
      log(`🔄 Thêm/cập nhật phòng ${roomData.roomUsername || roomData.uid}`);
      const now = new Date().toISOString();

      // Đảm bảo các trường số được chuyển đổi đúng
      const viewerCount = Number(roomData.viewerCount || 0);
      const currentViewers = Number(roomData.currentViewers || 0);
      const startCount = Number(roomData.startCount || 0);
      const targetViewers = Number(roomData.targetViewers || 0);
      const realViewers = Number(roomData.realViewers || 0);
      const duration = Number(roomData.duration || 30);
      const finalDuration = Number(roomData.finalDuration || 0);
      const isLive = roomData.isLive ? 1 : 0;
      const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO rooms (
                    uid, id, roomId, roomUrl, roomUsername, 
                    nickname, avatar, avatarThumb, title,
                    viewerCount, currentViewers, startCount, targetViewers, 
                    duration, isLive, status, 
                    startedAt, endedAt, realViewers, lastTimeCheckViewers,
                    stoppedAt, stopReason, finalDuration,
                    lastViewed, notes, createdAt, updatedAt
                ) VALUES (
                    ?, ?, ?, ?, ?, 
                    ?, ?, ?, ?, 
                    ?, ?, ?, ?,
                    ?, ?, ?, 
                    ?, ?, ?, ?,
                    ?, ?, ?,
                    ?, ?, ?, ?
                )
            `);
      stmt.run(roomData.uid, roomData.id || roomData.uid, roomData.roomId || null, roomData.roomUrl || null, roomData.roomUsername || null, roomData.nickname || null, roomData.avatar || null, roomData.avatarThumb || null, roomData.title || '', viewerCount, currentViewers, startCount, targetViewers, duration, isLive, roomData.status || 'stopped', roomData.startedAt || now, roomData.endedAt || null, realViewers, roomData.lastTimeCheckViewers || null, roomData.stoppedAt || null, roomData.stopReason || null, finalDuration, roomData.lastViewed || now, roomData.notes || roomData.note || '', roomData.createdAt || now, roomData.updatedAt || now);

      // Xử lý đúng kiểu dữ liệu cho dữ liệu trả về
      const newRoom = {
        uid: roomData.uid,
        id: roomData.id || roomData.uid,
        roomId: roomData.roomId || null,
        roomUrl: roomData.roomUrl || null,
        roomUsername: roomData.roomUsername || null,
        nickname: roomData.nickname || null,
        avatar: roomData.avatar || null,
        avatarThumb: roomData.avatarThumb || null,
        title: roomData.title || '',
        viewerCount: viewerCount,
        currentViewers: currentViewers,
        startCount: startCount,
        targetViewers: targetViewers,
        duration: duration,
        isLive: Boolean(isLive),
        status: roomData.status || 'stopped',
        startedAt: roomData.startedAt || null,
        endedAt: roomData.endedAt || null,
        realViewers: realViewers,
        lastTimeCheckViewers: roomData.lastTimeCheckViewers || null,
        stoppedAt: roomData.stoppedAt || null,
        stopReason: roomData.stopReason || null,
        finalDuration: finalDuration,
        lastViewed: roomData.lastViewed || now,
        notes: roomData.notes || roomData.note || '',
        createdAt: roomData.createdAt || now,
        updatedAt: roomData.updatedAt || now
      };
      log(`✅ Đã thêm/cập nhật phòng: ${roomData.roomUsername} (${roomData.uid})`);
      return {
        success: true,
        room: this.serializeForIPC(newRoom)
      };
    } catch (err) {
      error('❌ Error adding room:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Cập nhật room
   */
  async updateRoom(roomUid, updates) {
    try {
      // Kiểm tra roomUid không được null
      if (!roomUid) {
        error('❌ Không thể cập nhật room: roomUid là null');
        return {
          success: false,
          error: 'ROOM_UID_NULL'
        };
      }
      log(`🔄 Cập nhật room ${roomUid}`);
      const now = new Date().toISOString();
      const setFields = [];
      const values = [];
      for (const [key, value] of Object.entries(updates)) {
        // Bỏ qua các giá trị undefined
        if (value === undefined) {
          log(`⚠️ Bỏ qua trường ${key} với giá trị undefined`);
          continue;
        }
        if (key === 'isLive') {
          setFields.push(`${key} = ?`);
          values.push(value ? 1 : 0);
        } else if (key === 'lastViewed' || key === 'startedAt' || key === 'endedAt' || key === 'lastTimeCheckViewers' || key === 'stoppedAt') {
          setFields.push(`${key} = ?`);
          values.push(value ? String(value) : null);
        } else if (key === 'roomUsername' || key === 'nickname' || key === 'avatarThumb' || key === 'avatar' || key === 'roomUrl' || key === 'title' || key === 'stopReason' || key === 'status') {
          // Đảm bảo các trường string luôn là string hoặc null
          setFields.push(`${key} = ?`);
          values.push(value !== null && value !== undefined ? String(value) : null);
        } else if (key === 'viewerCount' || key === 'currentViewers' || key === 'startCount' || key === 'targetViewers' || key === 'duration' || key === 'realViewers' || key === 'finalDuration') {
          // Đảm bảo các trường số luôn là số
          setFields.push(`${key} = ?`);
          values.push(Number(value) || 0);
        } else {
          // Các trường khác
          setFields.push(`${key} = ?`);

          // Đảm bảo giá trị là kiểu SQLite hợp lệ
          if (value === null) {
            values.push(null);
          } else if (typeof value === 'object') {
            try {
              values.push(JSON.stringify(value));
            } catch (err) {
              error(`❌ Lỗi khi chuyển đổi ${key} thành JSON:`, err);
              values.push(String(value) || null);
            }
          } else {
            values.push(value);
          }
        }
      }
      if (setFields.length === 0) {
        return {
          success: true
        };
      }

      // Luôn cập nhật updatedAt khi có thay đổi
      setFields.push('updatedAt = ?');
      values.push(now);
      values.push(roomUid);
      const sql = `UPDATE rooms SET ${setFields.join(', ')} WHERE uid = ?`;
      const stmt = this.db.prepare(sql);
      log(`🔄 Updating room ${roomUid} with fields: ${setFields.join(', ')}`);
      const result = stmt.run(...values);
      if (result.changes > 0) {
        log(`✅ Updated room ${roomUid}`);
        return {
          success: true
        };
      } else {
        log(`⚠️ Room not found: ${roomUid}`);
        return {
          success: false,
          error: 'Room not found'
        };
      }
    } catch (err) {
      error('❌ Error updating room:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Xóa room
   */
  async deleteRoom(roomUid) {
    try {
      // Giải phóng tất cả accounts khỏi room
      await this.releaseAccountsFromRoom(roomUid);

      // Xóa viewer history
      const deleteHistoryStmt = this.db.prepare(`
                DELETE FROM viewer_history WHERE roomUid = ?
            `);
      deleteHistoryStmt.run(roomUid);

      // Xóa room
      const stmt = this.db.prepare(`DELETE FROM rooms WHERE uid = ?`);
      const result = stmt.run(roomUid);
      if (result.changes > 0) {
        log(`✅ Deleted room ${roomUid}`);
        return {
          success: true
        };
      } else {
        return {
          success: false,
          error: 'Room not found'
        };
      }
    } catch (error) {
      error('Error deleting room:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clear all account-room relationships
   */
  async clearAllAccountRooms() {
    try {
      // Trước tiên, lấy danh sách tất cả các accounts đang có trong account_rooms
      const accountsWithRooms = this.db.prepare(`
                SELECT DISTINCT accountId FROM account_rooms
            `).all();

      // Xóa tất cả các mối quan hệ
      const stmt = this.db.prepare(`DELETE FROM account_rooms`);
      const result = stmt.run();

      // Đặt lại currentRooms và activeRooms cho tất cả accounts có ít nhất một phòng
      if (accountsWithRooms.length > 0) {
        const now = new Date().toISOString();
        const resetStmt = this.db.prepare(`
                    UPDATE accounts 
                    SET currentRooms = 0,
                        activeRooms = '[]',
                        updatedAt = ?
                    WHERE id = ?
                `);
        for (const account of accountsWithRooms) {
          resetStmt.run(now, account.accountId);
        }
        log(`✅ Reset currentRooms and activeRooms for ${accountsWithRooms.length} accounts`);
      }
      log(`✅ Cleared ${result.changes} account-room relationships`);
      return result.changes;
    } catch (error) {
      error('Error clearing account rooms:', error);
      return 0;
    }
  }

  /**
   * Add account to room
   */
  async addAccountToRoom(accountId, roomId) {
    try {
      const stmt = this.db.prepare(`
                INSERT OR IGNORE INTO account_rooms (accountId, roomId, createdAt)
                VALUES (?, ?, ?)
            `);
      const now = new Date().toISOString();
      const result = stmt.run(accountId, roomId, now);
      if (result.changes > 0) {
        log(`✅ Added account ${accountId} to room ${roomId}`);

        // Cập nhật currentRooms trong bảng accounts
        const updateStmt = this.db.prepare(`
                    UPDATE accounts 
                    SET currentRooms = currentRooms + 1,
                        updatedAt = ?,
                        lastUsed = ?
                    WHERE id = ?
                `);
        updateStmt.run(now, now, accountId);

        // Lấy thông tin về room
        const roomStmt = this.db.prepare(`SELECT * FROM rooms WHERE uid = ?`);
        const roomInfo = roomStmt.get(roomId);
        if (roomInfo) {
          // Lấy danh sách activeRooms hiện tại của account
          const accountStmt = this.db.prepare(`SELECT activeRooms FROM accounts WHERE id = ?`);
          const accountData = accountStmt.get(accountId);

          // Parse activeRooms từ JSON string thành array
          let activeRooms = [];
          try {
            if (accountData && accountData.activeRooms) {
              activeRooms = JSON.parse(accountData.activeRooms);
            }
          } catch (e) {
            error(`❌ Lỗi khi parse activeRooms của account ${accountId}:`, e);
            activeRooms = [];
          }

          // Thêm room mới vào danh sách nếu chưa có
          const roomIdentifier = roomInfo.roomUsername || roomInfo.uid;
          if (!activeRooms.includes(roomIdentifier)) {
            activeRooms.push(roomIdentifier);

            // Cập nhật activeRooms trong database
            const updateActiveRoomsStmt = this.db.prepare(`
                            UPDATE accounts 
                            SET activeRooms = ?,
                                updatedAt = ?
                            WHERE id = ?
                        `);
            updateActiveRoomsStmt.run(JSON.stringify(activeRooms), now, accountId);
            log(`✅ Updated activeRooms for account ${accountId}: Added ${roomIdentifier}`);
          }
        }
        return {
          success: true
        };
      } else {
        return {
          success: false,
          error: 'Relationship already exists'
        };
      }
    } catch (error) {
      error('Error adding account to room:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Remove account from room
   */
  async removeAccountFromRoom(accountId, roomId) {
    try {
      const stmt = this.db.prepare(`
                DELETE FROM account_rooms WHERE accountId = ? AND roomId = ?
            `);
      const now = new Date().toISOString();
      const result = stmt.run(accountId, roomId);
      if (result.changes > 0) {
        log(`✅ Removed account ${accountId} from room ${roomId}`);

        // Giảm currentRooms trong bảng accounts
        const updateStmt = this.db.prepare(`
                    UPDATE accounts 
                    SET currentRooms = MAX(0, currentRooms - 1),
                        updatedAt = ?
                    WHERE id = ?
                `);
        updateStmt.run(now, accountId);

        // Lấy thông tin về room
        const roomStmt = this.db.prepare(`SELECT * FROM rooms WHERE uid = ?`);
        const roomInfo = roomStmt.get(roomId);
        if (roomInfo) {
          // Lấy danh sách activeRooms hiện tại của account
          const accountStmt = this.db.prepare(`SELECT activeRooms FROM accounts WHERE id = ?`);
          const accountData = accountStmt.get(accountId);

          // Parse activeRooms từ JSON string thành array
          let activeRooms = [];
          try {
            if (accountData && accountData.activeRooms) {
              activeRooms = JSON.parse(accountData.activeRooms);
            }
          } catch (e) {
            error(`❌ Lỗi khi parse activeRooms của account ${accountId}:`, e);
            activeRooms = [];
          }

          // Xóa room khỏi danh sách activeRooms
          const roomIdentifier = roomInfo.roomUsername || roomInfo.uid;
          const updatedActiveRooms = activeRooms.filter(room => room !== roomIdentifier);

          // Cập nhật activeRooms trong database
          const updateActiveRoomsStmt = this.db.prepare(`
                        UPDATE accounts 
                        SET activeRooms = ?,
                            updatedAt = ?
                        WHERE id = ?
                    `);
          updateActiveRoomsStmt.run(JSON.stringify(updatedActiveRooms), now, accountId);
          log(`✅ Updated activeRooms for account ${accountId}: Removed ${roomIdentifier}`);
        }
        return {
          success: true
        };
      } else {
        return {
          success: false,
          error: 'Relationship not found'
        };
      }
    } catch (error) {
      error('Error removing account from room:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get accounts in room
   */
  async getAccountsInRoom(roomId) {
    try {
      log(`🔍 Lấy danh sách accounts trong phòng ${roomId}`);
      const stmt = this.db.prepare(`
                SELECT a.*, ar.createdAt as joinedAt
                FROM accounts a
                INNER JOIN account_rooms ar ON a.id = ar.accountId
                WHERE ar.roomId = ?
                ORDER BY ar.createdAt DESC
            `);
      const accountsRaw = stmt.all(roomId);
      log(`📊 Tìm thấy ${accountsRaw.length} accounts trong phòng ${roomId}`);

      // Xử lý dữ liệu accounts
      const accounts = accountsRaw.map(account => {
        // Parse activeRooms từ JSON string thành array
        let activeRooms = [];
        try {
          if (account.activeRooms) {
            activeRooms = JSON.parse(account.activeRooms);
          }
        } catch (err) {
          error(`❌ Lỗi khi parse activeRooms của account ${account.id}:`, err);
          activeRooms = [];
        }
        return {
          ...account,
          // Convert Boolean
          isLive: Boolean(account.isLive),
          // Cấu trúc dữ liệu phức tạp
          activeRooms: activeRooms,
          // Convert số
          currentRooms: Number(account.currentRooms || 0),
          viewerCount: Number(account.viewerCount || 0),
          followCount: Number(account.followCount || 0),
          shareCount: Number(account.shareCount || 0),
          totalViews: Number(account.totalViews || 0),
          totalShares: Number(account.totalShares || 0),
          totalFollows: Number(account.totalFollows || 0),
          // Giữ nguyên timestamps
          lastActive: account.lastActive,
          lastUsed: account.lastUsed,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt,
          joinedAt: account.joinedAt
        };
      });
      return this.serializeForIPC(accounts);
    } catch (err) {
      error('❌ Error getting accounts in room:', err);
      return [];
    }
  }

  /**
   * Get room by UID
   */
  async getRoomByUid(roomUid) {
    try {
      log(`🔍 Lấy thông tin phòng ${roomUid}`);
      const stmt = this.db.prepare(`SELECT * FROM rooms WHERE uid = ?`);
      const room = stmt.get(roomUid);
      if (room) {
        // Xử lý dữ liệu trả về
        const processedRoom = {
          ...room,
          isLive: Boolean(room.isLive),
          // Chuyển đổi các trường số
          viewerCount: Number(room.viewerCount || 0),
          currentViewers: Number(room.currentViewers || 0),
          startCount: Number(room.startCount || 0),
          targetViewers: Number(room.targetViewers || 0),
          realViewers: Number(room.realViewers || 0),
          duration: Number(room.duration || 30),
          finalDuration: Number(room.finalDuration || 0),
          // Giữ nguyên các timestamp
          lastViewed: room.lastViewed,
          createdAt: room.createdAt,
          updatedAt: room.updatedAt,
          startedAt: room.startedAt,
          endedAt: room.endedAt,
          lastTimeCheckViewers: room.lastTimeCheckViewers,
          stoppedAt: room.stoppedAt
        };
        log(`✅ Đã tìm thấy phòng ${roomUid}`);
        return this.serializeForIPC(processedRoom);
      }
      log(`⚠️ Không tìm thấy phòng ${roomUid}`);
      return null;
    } catch (err) {
      error('❌ Error getting room by UID:', err);
      return null;
    }
  }

  // =================
  // VIEWER HISTORY
  // =================

  /**
   * Add viewer history entry
   */
  async addViewerHistoryEntry(roomUid, viewerData) {
    try {
      // Kiểm tra roomUid không được null
      if (!roomUid) {
        error('❌ Không thể thêm viewer history: roomUid là null');
        return {
          success: false,
          error: 'ROOM_UID_NULL'
        };
      }
      const stmt = this.db.prepare(`
                INSERT INTO viewer_history (roomUid, viewerCount, timestamp)
                VALUES (?, ?, ?)
            `);
      stmt.run(roomUid, viewerData.viewerCount || viewerData.viewers || 0, viewerData.timestamp || new Date().toISOString());
      return {
        success: true
      };
    } catch (error) {
      error('Error adding viewer history entry:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get room viewer history
   */
  async getRoomViewerHistory(roomUid, days = null) {
    try {
      let sql = `
                SELECT * FROM viewer_history 
                WHERE roomUid = ?
            `;
      const params = [roomUid];
      if (days) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        sql += ` AND timestamp >= ?`;
        params.push(cutoffDate.toISOString());
      }
      sql += ` ORDER BY timestamp DESC`;
      const stmt = this.db.prepare(sql);
      const history = stmt.all(...params).map(entry => ({
        ...entry,
        timestamp: entry.timestamp
      }));
      return this.serializeForIPC(history);
    } catch (error) {
      error('Error getting room viewer history:', error);
      return [];
    }
  }

  /**
   * Cleanup old viewer history
   */
  async cleanupViewerHistoryFiles() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      const stmt = this.db.prepare(`
                DELETE FROM viewer_history WHERE timestamp < ?
            `);
      const result = stmt.run(cutoffDate.toISOString());
      log(`✅ Cleaned up ${result.changes} old viewer history entries`);
      return result.changes;
    } catch (error) {
      error('Error cleaning up viewer history:', error);
      return 0;
    }
  }

  /**
   * Giải phóng tất cả accounts khỏi room (dùng khi stop hoặc delete room)
   * Hàm tiện ích để tránh lặp code
   */
  async releaseAccountsFromRoom(roomId) {
    try {
      // Lấy thông tin về room để biết roomUsername
      const roomStmt = this.db.prepare(`SELECT * FROM rooms WHERE uid = ?`);
      const roomInfo = roomStmt.get(roomId);
      if (!roomInfo) {
        log(`⚠️ Không tìm thấy room ${roomId} để giải phóng accounts`);
        return {
          success: false,
          error: 'Room not found'
        };
      }

      // Lấy danh sách các accounts trong room
      const accountsInRoomStmt = this.db.prepare(`
                SELECT accountId FROM account_rooms WHERE roomId = ?
            `);
      const accountsInRoom = accountsInRoomStmt.all(roomId);
      if (accountsInRoom.length === 0) {
        log(`ℹ️ Không có accounts nào trong room ${roomId} cần giải phóng`);
        return {
          success: true,
          message: 'No accounts to release'
        };
      }
      log(`🔄 Giải phóng ${accountsInRoom.length} accounts khỏi room ${roomId}`);

      // Thực hiện xóa các mối quan hệ account-room
      const deleteRelationsStmt = this.db.prepare(`
                DELETE FROM account_rooms WHERE roomId = ?
            `);
      deleteRelationsStmt.run(roomId);
      const now = new Date().toISOString();
      const roomIdentifier = roomInfo.roomUsername || roomInfo.uid;

      // Cập nhật thông tin các accounts
      for (const account of accountsInRoom) {
        const accountId = account.accountId;

        // Đếm lại số room hiện tại của account
        const countRoomsStmt = this.db.prepare(`
                    SELECT COUNT(*) as roomCount FROM account_rooms WHERE accountId = ?
                `);
        const {
          roomCount
        } = countRoomsStmt.get(accountId);

        // Cập nhật currentRooms với số phòng chính xác
        const updateCountStmt = this.db.prepare(`
                    UPDATE accounts 
                    SET currentRooms = ?,
                        updatedAt = ?
                    WHERE id = ?
                `);
        updateCountStmt.run(roomCount, now, accountId);

        // Cập nhật activeRooms
        const accountStmt = this.db.prepare(`SELECT activeRooms FROM accounts WHERE id = ?`);
        const accountData = accountStmt.get(accountId);

        // Parse activeRooms từ JSON string thành array
        let activeRooms = [];
        try {
          if (accountData && accountData.activeRooms) {
            activeRooms = JSON.parse(accountData.activeRooms);
          }
        } catch (e) {
          error(`❌ Lỗi khi parse activeRooms của account ${accountId}:`, e);
          activeRooms = [];
        }

        // Xóa room khỏi danh sách activeRooms
        const updatedActiveRooms = activeRooms.filter(room => room !== roomIdentifier);

        // Cập nhật activeRooms trong database
        const updateActiveRoomsStmt = this.db.prepare(`
                    UPDATE accounts 
                    SET activeRooms = ?,
                        updatedAt = ?
                    WHERE id = ?
                `);
        updateActiveRoomsStmt.run(JSON.stringify(updatedActiveRooms), now, accountId);
      }
      log(`✅ Đã giải phóng ${accountsInRoom.length} accounts khỏi room ${roomId}`);
      return {
        success: true,
        accountsReleased: accountsInRoom.length
      };
    } catch (err) {
      error(`❌ Lỗi khi giải phóng accounts khỏi room ${roomId}:`, err);
      return {
        success: false,
        error: err.message
      };
    }
  }
}
module.exports = RoomStorage;

/***/ }),

/***/ "./lib/storage/settings-storage.js":
/*!*****************************************!*\
  !*** ./lib/storage/settings-storage.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const {
  log,
  error
} = __webpack_require__(/*! ../logger */ "./lib/logger.js");
const BaseStorage = __webpack_require__(/*! ./base-storage */ "./lib/storage/base-storage.js");
class SettingsStorage extends BaseStorage {
  /**
   * Get all settings
   */
  async getSettings() {
    try {
      const stmt = this.db.prepare(`
                SELECT key, value FROM settings
            `);
      const settings = stmt.all();
      const result = {};
      for (const setting of settings) {
        try {
          result[setting.key] = JSON.parse(setting.value);
        } catch (error) {
          result[setting.key] = setting.value;
        }
      }

      // Merge với default settings
      const finalSettings = {
        ...this.defaultSettings,
        ...result
      };
      return this.serializeForIPC(finalSettings);
    } catch (error) {
      error('Error getting settings:', error);
      return this.serializeForIPC(this.defaultSettings);
    }
  }

  /**
   * Save settings
   */
  async saveSettings(settings) {
    try {
      const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO settings (key, value, updatedAt)
                VALUES (?, ?, ?)
            `);
      const now = new Date().toISOString();
      let savedCount = 0;
      for (const [key, value] of Object.entries(settings)) {
        stmt.run(key, JSON.stringify(value), now);
        savedCount++;
      }
      log(`✅ Saved ${savedCount} settings`);
      return {
        success: true,
        count: savedCount
      };
    } catch (error) {
      error('Error saving settings:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Save single setting
   */
  async saveSetting(key, value) {
    try {
      const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO settings (key, value, updatedAt)
                VALUES (?, ?, ?)
            `);
      stmt.run(key, JSON.stringify(value), new Date().toISOString());
      log(`✅ Saved setting: ${key}`);
      return {
        success: true
      };
    } catch (error) {
      error('Error saving setting:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get single setting
   */
  async getSetting(key) {
    try {
      const stmt = this.db.prepare(`
                SELECT value FROM settings WHERE key = ?
            `);
      const result = stmt.get(key);
      if (result) {
        try {
          return JSON.parse(result.value);
        } catch (error) {
          return result.value;
        }
      }

      // Return default value if exists
      return this.defaultSettings[key] || null;
    } catch (error) {
      error('Error getting setting:', error);
      return this.defaultSettings[key] || null;
    }
  }

  /**
   * Delete setting
   */
  async deleteSetting(key) {
    try {
      const stmt = this.db.prepare(`DELETE FROM settings WHERE key = ?`);
      const result = stmt.run(key);
      if (result.changes > 0) {
        log(`✅ Deleted setting: ${key}`);
        return {
          success: true
        };
      } else {
        return {
          success: false,
          error: 'Setting not found'
        };
      }
    } catch (error) {
      error('Error deleting setting:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Reset all settings to default
   */
  async resetSettings() {
    try {
      // Delete all current settings
      const deleteStmt = this.db.prepare(`DELETE FROM settings`);
      deleteStmt.run();

      // Insert default settings
      const insertStmt = this.db.prepare(`
                INSERT INTO settings (key, value, updatedAt)
                VALUES (?, ?, ?)
            `);
      const now = new Date().toISOString();
      let insertedCount = 0;
      for (const [key, value] of Object.entries(this.defaultSettings)) {
        insertStmt.run(key, JSON.stringify(value), now);
        insertedCount++;
      }
      log(`✅ Reset to ${insertedCount} default settings`);
      return {
        success: true,
        count: insertedCount
      };
    } catch (error) {
      error('Error resetting settings:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get settings with metadata
   */
  async getSettingsWithMetadata() {
    try {
      const stmt = this.db.prepare(`
                SELECT key, value, updatedAt FROM settings ORDER BY key ASC
            `);
      const settings = stmt.all();
      const result = [];
      for (const setting of settings) {
        try {
          result.push({
            key: setting.key,
            value: JSON.parse(setting.value),
            updatedAt: setting.updatedAt,
            isDefault: this.defaultSettings.hasOwnProperty(setting.key)
          });
        } catch (error) {
          result.push({
            key: setting.key,
            value: setting.value,
            updatedAt: setting.updatedAt,
            isDefault: this.defaultSettings.hasOwnProperty(setting.key)
          });
        }
      }
      return this.serializeForIPC(result);
    } catch (error) {
      error('Error getting settings with metadata:', error);
      return [];
    }
  }

  /**
   * Export settings to JSON
   */
  async exportSettings() {
    try {
      const settings = await this.getSettings();
      return {
        success: true,
        settings: settings,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
    } catch (error) {
      error('Error exporting settings:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Import settings from JSON
   */
  async importSettings(settingsData) {
    try {
      if (!settingsData || typeof settingsData !== 'object') {
        return {
          success: false,
          error: 'Invalid settings data'
        };
      }

      // Validate settings keys
      const validKeys = Object.keys(this.defaultSettings);
      const settingsToImport = {};
      for (const [key, value] of Object.entries(settingsData)) {
        if (validKeys.includes(key)) {
          settingsToImport[key] = value;
        }
      }
      if (Object.keys(settingsToImport).length === 0) {
        return {
          success: false,
          error: 'No valid settings to import'
        };
      }

      // Save imported settings
      const result = await this.saveSettings(settingsToImport);
      if (result.success) {
        log(`✅ Imported ${Object.keys(settingsToImport).length} settings`);
        return {
          success: true,
          imported: Object.keys(settingsToImport).length,
          skipped: Object.keys(settingsData).length - Object.keys(settingsToImport).length
        };
      }
      return result;
    } catch (error) {
      error('Error importing settings:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
module.exports = SettingsStorage;

/***/ }),

/***/ "./lib/storage/storage-manager.js":
/*!****************************************!*\
  !*** ./lib/storage/storage-manager.js ***!
  \****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const DatabaseSchema = __webpack_require__(/*! ./database-schema */ "./lib/storage/database-schema.js");
const FolderStorage = __webpack_require__(/*! ./folder-storage */ "./lib/storage/folder-storage.js");
const AccountStorage = __webpack_require__(/*! ./account-storage */ "./lib/storage/account-storage.js");
const ProxyStorage = __webpack_require__(/*! ./proxy-storage */ "./lib/storage/proxy-storage.js");
const RoomStorage = __webpack_require__(/*! ./room-storage */ "./lib/storage/room-storage.js");
const SettingsStorage = __webpack_require__(/*! ./settings-storage */ "./lib/storage/settings-storage.js");
const TaskStorage = __webpack_require__(/*! ./task-storage */ "./lib/storage/task-storage.js");
const {
  log,
  error
} = __webpack_require__(/*! ../logger */ "./lib/logger.js");
// Import thêm các modules khác khi tạo xong

class StorageManager extends DatabaseSchema {
  constructor() {
    super();

    // Khởi tạo các storage modules
    this.folderStorage = new FolderStorage();
    this.accountStorage = new AccountStorage();
    this.proxyStorage = new ProxyStorage();
    this.roomStorage = new RoomStorage();
    this.settingsStorage = new SettingsStorage();
    this.taskStorage = new TaskStorage();
    // Thêm các storage khác
  }

  /**
   * Khởi tạo toàn bộ storage system
   */
  async init() {
    try {
      // Khởi tạo base database connection
      await super.init();

      // Share database connection với tất cả modules
      this.folderStorage.db = this.db;
      this.accountStorage.db = this.db;
      this.proxyStorage.db = this.db;
      this.roomStorage.db = this.db;
      this.settingsStorage.db = this.db;
      this.taskStorage.db = this.db;

      // Tạo tables nếu chưa có
      this.createTables();

      // Cập nhật schema nếu có thay đổi
      await this.migrateSchema();

      // Insert default data
      await this.insertDefaultData();

      // Check integrity
      this.checkIntegrity();
      log('✅ Storage manager initialized successfully');
      return true;
    } catch (err) {
      error('❌ Error initializing storage manager:', err);
      throw err;
    }
  }

  // =================
  // FOLDER METHODS
  // =================

  async getAllFolders(type = null) {
    log(`📂 getAllFolders called with type: ${type}`);
    if (type) {
      // Nếu có type, trả về danh sách folder của type đó
      const folders = await this.folderStorage.getAllFolders(type);
      log(`📂 Retrieved ${folders.length} folders for type ${type}:`, folders);
      if (type === 'accounts') {
        log(`📂 Returning folders for accounts in format: { success: true, folders: { accounts: [...] } }`);
        return {
          success: true,
          folders: {
            accounts: folders
          }
        };
      } else if (type === 'proxies') {
        log(`📂 Returning folders for proxies in format: { success: true, folders: { proxies: [...] } }`);
        return {
          success: true,
          folders: {
            proxies: folders
          }
        };
      }
      log(`📂 Returning folders in simple format: { success: true, folders: [...] }`);
      return {
        success: true,
        folders
      };
    } else {
      // Không có type, lấy tất cả folder và nhóm theo type
      const accountFolders = await this.folderStorage.getAllFolders('accounts');
      const proxyFolders = await this.folderStorage.getAllFolders('proxies');
      log(`📂 Returning all folders: { accounts: ${accountFolders.length}, proxies: ${proxyFolders.length} }`);
      return {
        success: true,
        folders: {
          accounts: accountFolders,
          proxies: proxyFolders
        }
      };
    }
  }
  async createFolder(type, folderData) {
    return this.folderStorage.createFolder(type, folderData);
  }
  async updateFolder(type, folderId, updates) {
    return this.folderStorage.updateFolder(type, folderId, updates);
  }
  async deleteFolder(type, folderId) {
    return this.folderStorage.deleteFolder(type, folderId);
  }
  async getFolderById(type, folderId) {
    return this.folderStorage.getFolderById(type, folderId);
  }

  // =================
  // ACCOUNT METHODS
  // =================

  async getAllAccounts() {
    return this.accountStorage.getAllAccounts();
  }
  async getAccountsByFolder(folderId) {
    return this.accountStorage.getAccountsByFolder(folderId);
  }
  async addAccount(accountData) {
    return this.accountStorage.addAccount(accountData);
  }
  async deleteAccount(accountId) {
    return this.accountStorage.deleteAccount(accountId);
  }
  async updateAccount(id, updates) {
    return this.accountStorage.updateAccount(id, updates);
  }
  async updateAccountStats(accountId, stats) {
    return this.accountStorage.updateAccountStats(accountId, stats);
  }
  async clearAccountRooms(accountId) {
    return this.accountStorage.clearAccountRooms(accountId);
  }
  async getAccountActiveRooms(accountId) {
    return this.accountStorage.getAccountActiveRooms(accountId);
  }
  async importAccountsFromText(text, folderId = null) {
    return this.accountStorage.importAccountsFromText(text, folderId);
  }

  // =================
  // PROXY METHODS
  // =================

  async getAllProxies() {
    return this.proxyStorage.getAllProxies();
  }
  async getProxiesByFolder(folderId) {
    return this.proxyStorage.getProxiesByFolder(folderId);
  }
  async addProxy(proxyData) {
    return this.proxyStorage.addProxy(proxyData);
  }
  async deleteProxy(proxyId) {
    return this.proxyStorage.deleteProxy(proxyId);
  }
  async updateProxy(proxyId, updates) {
    return this.proxyStorage.updateProxy(proxyId, updates);
  }
  async testProxy(proxyId) {
    return this.proxyStorage.testProxy(proxyId);
  }
  async getProxyById(proxyId) {
    return this.proxyStorage.getProxyById(proxyId);
  }
  async importProxiesFromText(text, folderId = null) {
    return this.proxyStorage.importProxiesFromText(text, folderId);
  }
  async bulkMoveProxiesToFolder(proxyIds, folderId) {
    return this.proxyStorage.bulkMoveProxiesToFolder(proxyIds, folderId);
  }
  async bulkTestProxies(proxyIds) {
    return this.proxyStorage.bulkTestProxies(proxyIds);
  }
  async exportProxies(format = 'ip_port_username_password', proxyIds = null) {
    return this.proxyStorage.exportProxies(format, proxyIds);
  }

  // =================
  // ROOM METHODS
  // =================

  async getAllRooms() {
    return this.roomStorage.getAllRooms();
  }
  async addRoom(roomData) {
    return this.roomStorage.addRoom(roomData);
  }
  async updateRoom(roomUid, updates) {
    return this.roomStorage.updateRoom(roomUid, updates);
  }
  async deleteRoom(roomUid) {
    return this.roomStorage.deleteRoom(roomUid);
  }
  async clearAllAccountRooms() {
    return this.roomStorage.clearAllAccountRooms();
  }

  // Room relationships
  async addAccountToRoom(accountId, roomId) {
    return this.roomStorage.addAccountToRoom(accountId, roomId);
  }
  async removeAccountFromRoom(accountId, roomId) {
    return this.roomStorage.removeAccountFromRoom(accountId, roomId);
  }
  async getAccountsInRoom(roomId) {
    return this.roomStorage.getAccountsInRoom(roomId);
  }

  // Viewer history
  async addViewerHistoryEntry(roomUid, viewerData) {
    return this.roomStorage.addViewerHistoryEntry(roomUid, viewerData);
  }
  async getRoomViewerHistory(roomUid, days = null) {
    return this.roomStorage.getRoomViewerHistory(roomUid, days);
  }
  async cleanupViewerHistoryFiles() {
    return this.roomStorage.cleanupViewerHistoryFiles();
  }

  // =================
  // SETTINGS METHODS
  // =================

  async getSettings() {
    return this.settingsStorage.getSettings();
  }
  async saveSettings(settings) {
    return this.settingsStorage.saveSettings(settings);
  }
  async resetSettings() {
    return this.settingsStorage.resetSettings();
  }
  async getSetting(key) {
    return this.settingsStorage.getSetting(key);
  }
  async saveSetting(key, value) {
    return this.settingsStorage.saveSetting(key, value);
  }

  // =================
  // TASK METHODS
  // =================

  async getAllTasks() {
    return this.taskStorage.getAllTasks();
  }
  async addTask(taskData) {
    return this.taskStorage.addTask(taskData);
  }
  async updateTask(taskId, updates) {
    return this.taskStorage.updateTask(taskId, updates);
  }
  async deleteTask(taskId) {
    return this.taskStorage.deleteTask(taskId);
  }
  async getTaskById(taskId) {
    return this.taskStorage.getTaskById(taskId);
  }
  async updateTaskStatus(taskId, status, lastError = null) {
    try {
      const now = new Date().toISOString();
      const updates = {
        status,
        lastError,
        updatedAt: now
      };
      if (status === 'running') {
        updates.lastRun = now;
      }
      const result = await this.taskStorage.updateTask(taskId, updates);
      return result;
    } catch (error) {
      console.error('Error updating task status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async toggleTask(taskId, enabled) {
    return this.taskStorage.toggleTask(taskId, enabled);
  }
  async getTaskStats() {
    return this.taskStorage.getTaskStats();
  }

  // =================
  // UTILITY METHODS
  // =================

  /**
   * Lấy loại storage đang sử dụng
   * @returns {string} Loại storage ('sqlite')
   */
  getStorageType() {
    log('📦 getStorageType called');
    return 'sqlite';
  }

  /**
   * Kiểm tra xem có đang dùng SQLite không
   */
  isUsingSQLite() {
    return true;
  }

  /**
   * Extract username từ account info
   */
  extractUsername(accountInfo) {
    if (typeof accountInfo === 'string') {
      // If it's a string, it's probably the username
      return accountInfo.trim();
    }
    if (accountInfo && typeof accountInfo === 'object') {
      return accountInfo.username || accountInfo.user || accountInfo.name || '';
    }
    return '';
  }

  /**
   * Extract proxy host từ proxy info  
   */
  extractProxyHost(proxyInfo) {
    if (typeof proxyInfo === 'string') {
      // Format: host:port hoặc username:password@host:port
      const parts = proxyInfo.split('@');
      const hostPort = parts.length > 1 ? parts[1] : parts[0];
      return hostPort.split(':')[0];
    }
    if (proxyInfo && typeof proxyInfo === 'object') {
      return proxyInfo.host || proxyInfo.hostname || '';
    }
    return '';
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      log('🔒 SQLite connection closed');
    }
  }

  /**
   * Get database info
   */
  getDatabaseInfo() {
    return {
      type: 'sqlite',
      path: this.dbPath,
      size: this.getDatabaseSize(),
      tables: this.getTables()
    };
  }

  // =================
  // ACCOUNT BULK OPERATIONS
  // =================

  async bulkSetProxy(accountIds, proxyFolderId, accountsPerProxy = 1, selectedProxies = null) {
    try {
      log('=== BULK SET PROXY (STORAGE MANAGER) ===');
      log('Account IDs:', accountIds?.length);
      log('Proxy Folder ID:', proxyFolderId);
      log('Accounts per proxy:', accountsPerProxy);
      log('Selected proxies:', selectedProxies?.length || 0);

      // Lấy danh sách accounts và proxies
      const accounts = await this.accountStorage.getAllAccounts();

      // Lấy danh sách proxy
      let availableProxies = [];
      if (Array.isArray(selectedProxies) && selectedProxies.length > 0) {
        // Sử dụng danh sách proxy được chọn
        const allProxies = await this.proxyStorage.getAllProxies();
        availableProxies = allProxies.filter(proxy => selectedProxies.includes(proxy.id));
        log('Using selected proxies:', availableProxies.length);
      } else {
        // Sử dụng proxy từ folder
        availableProxies = await this.proxyStorage.getProxiesByFolder(proxyFolderId);
        log('Using proxies from folder:', availableProxies.length);
      }
      if (!availableProxies || availableProxies.length === 0) {
        return {
          success: false,
          error: 'Không có proxy khả dụng'
        };
      }

      // Lấy cài đặt
      const settings = await this.settingsStorage.getSettings();
      const maxAccountsPerProxy = settings.proxy?.maxAccountsPerProxy || 5;
      log('Max accounts per proxy from settings:', maxAccountsPerProxy);

      // Đếm số account hiện tại đã gán cho mỗi proxy
      const proxyUsageCount = {};
      accounts.forEach(account => {
        if (account.proxyId) {
          proxyUsageCount[account.proxyId] = (proxyUsageCount[account.proxyId] || 0) + 1;
        }
      });

      // Lọc và sắp xếp proxy có thể sử dụng
      const usableProxies = availableProxies.map(proxy => {
        const currentUsage = proxyUsageCount[proxy.id] || 0;
        const availableSlots = Math.max(0, maxAccountsPerProxy - currentUsage);
        return {
          ...proxy,
          availableSlots
        };
      }).filter(proxy => proxy.availableSlots > 0).sort((a, b) => b.availableSlots - a.availableSlots);
      log('Usable proxies after filtering:', usableProxies.length);
      if (usableProxies.length === 0) {
        return {
          success: false,
          error: 'Tất cả proxy đã đạt giới hạn số lượng tài khoản'
        };
      }

      // Gán proxy cho accounts
      let updated = 0;
      const results = [];
      let proxyIndex = 0;
      for (const accountId of accountIds) {
        if (proxyIndex >= usableProxies.length) {
          // Hết proxy khả dụng
          break;
        }

        // Lấy proxy hiện tại
        const currentProxy = usableProxies[proxyIndex];

        // Gán proxy cho account
        const result = await this.accountStorage.updateAccount(accountId, {
          proxyId: currentProxy.id,
          lastUpdated: new Date().toISOString()
        });
        if (result.success) {
          updated++;
          results.push({
            accountId,
            proxyId: currentProxy.id,
            host: currentProxy.host || currentProxy.proxyInfo
          });

          // Giảm số lượng slot còn lại của proxy hiện tại
          currentProxy.availableSlots--;

          // Nếu proxy đã hết slot, chuyển sang proxy tiếp theo
          if (currentProxy.availableSlots <= 0) {
            proxyIndex++;
          }
        }
      }
      return {
        success: updated > 0,
        message: `Đã gán proxy cho ${updated}/${accountIds.length} tài khoản`,
        updated,
        totalRequested: accountIds.length,
        results
      };
    } catch (error) {
      error('Error in bulkSetProxy (StorageManager):', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async bulkRemoveProxy(accountIds) {
    try {
      log(`Removing proxy from ${accountIds.length} accounts`);
      let updated = 0;
      const results = [];
      for (const accountId of accountIds) {
        const result = await this.accountStorage.updateAccount(accountId, {
          proxyId: null,
          lastUpdated: new Date().toISOString()
        });
        if (result.success) {
          updated++;
          results.push({
            accountId
          });
        }
      }
      return {
        success: updated > 0,
        message: `Đã xóa proxy khỏi ${updated}/${accountIds.length} tài khoản`,
        updated,
        totalRequested: accountIds.length,
        results
      };
    } catch (error) {
      error('Error removing proxy from accounts:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async bulkSetStatus(accountIds, status) {
    try {
      log(`Setting status "${status}" for ${accountIds.length} accounts`);
      let updated = 0;
      const results = [];
      for (const accountId of accountIds) {
        const result = await this.accountStorage.updateAccount(accountId, {
          status: status,
          lastUpdated: new Date().toISOString()
        });
        if (result.success) {
          updated++;
          results.push({
            accountId
          });
        }
      }
      return {
        success: updated > 0,
        message: `Đã cập nhật trạng thái cho ${updated}/${accountIds.length} tài khoản`,
        updated,
        totalRequested: accountIds.length,
        results
      };
    } catch (err) {
      error('Error setting status for accounts:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }
  async bulkMoveToFolder(accountIds, folderId) {
    try {
      log(`Moving ${accountIds.length} accounts to folder ${folderId}`);
      let updated = 0;
      const results = [];
      for (const accountId of accountIds) {
        const result = await this.accountStorage.updateAccount(accountId, {
          folderId: folderId,
          lastUpdated: new Date().toISOString()
        });
        if (result.success) {
          updated++;
          results.push({
            accountId
          });
        }
      }
      return {
        success: updated > 0,
        message: `Đã di chuyển ${updated}/${accountIds.length} tài khoản vào thư mục`,
        updated,
        totalRequested: accountIds.length,
        results
      };
    } catch (err) {
      error('Error moving accounts to folder:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }
  async exportAccountsToText(format = 'username_password', accountIds = null, folderId = null) {
    try {
      log(`Exporting accounts with format ${format}`);

      // Lấy danh sách accounts
      let accounts = await this.accountStorage.getAllAccounts();

      // Lọc theo accountIds nếu có
      if (Array.isArray(accountIds) && accountIds.length > 0) {
        accounts = accounts.filter(account => accountIds.includes(account.id));
      }

      // Lọc theo folderId nếu có
      if (folderId) {
        accounts = accounts.filter(account => account.folderId === folderId);
      }
      if (accounts.length === 0) {
        return {
          success: false,
          error: 'Không có tài khoản nào để xuất'
        };
      }

      // Format accounts
      let exportData = '';
      for (const account of accounts) {
        let line = '';
        switch (format) {
          case 'username':
            line = account.username || '';
            break;
          case 'username_password':
            line = `${account.username || ''}:${account.password || ''}`;
            break;
          case 'full':
            // username:password:proxy:cookieid
            let proxyInfo = '';
            if (account.proxyId) {
              const proxy = await this.proxyStorage.getProxyById(account.proxyId);
              if (proxy) {
                if (proxy.username && proxy.password) {
                  proxyInfo = `${proxy.host}:${proxy.port}:${proxy.username}:${proxy.password}`;
                } else {
                  proxyInfo = `${proxy.host}:${proxy.port}`;
                }
              }
            }
            line = `${account.username || ''}:${account.password || ''}:${proxyInfo}:${account.cookieId || ''}`;
            break;
          case 'json':
            // Chỉ thêm vào cuối file nếu không phải account đầu tiên
            if (exportData.length > 0) {
              exportData += ',\n';
            }
            line = JSON.stringify(account, null, 2);
            break;
          default:
            line = `${account.username || ''}:${account.password || ''}`;
            break;
        }
        if (format !== 'json') {
          exportData += line + '\n';
        }
      }

      // Nếu xuất dạng JSON, bọc trong array
      if (format === 'json') {
        exportData = `[\n${exportData}\n]`;
      }
      return {
        success: true,
        data: exportData,
        count: accounts.length,
        format: format
      };
    } catch (error) {
      error('Error exporting accounts:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
module.exports = StorageManager;

/***/ }),

/***/ "./lib/storage/task-storage.js":
/*!*************************************!*\
  !*** ./lib/storage/task-storage.js ***!
  \*************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const BaseStorage = __webpack_require__(/*! ./base-storage */ "./lib/storage/base-storage.js");
const {
  log,
  error
} = __webpack_require__(/*! ../logger */ "./lib/logger.js");
class TaskStorage extends BaseStorage {
  /**
   * Get all tasks
   */
  async getAllTasks() {
    try {
      log(`
                SELECT * FROM tasks 
                ORDER BY createdAt DESC
            `);
      const stmt = this.db.prepare(`
                SELECT * FROM tasks 
                ORDER BY createdAt DESC
            `);
      const tasks = stmt.all().map(task => ({
        ...task,
        enabled: Boolean(task.enabled),
        // Keep as ISO strings for IPC compatibility
        lastRun: task.lastRun,
        nextRun: task.nextRun,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }));
      log(`✅ Successfully read ${tasks.length} tasks from SQLite`);
      return {
        success: true,
        data: this.serializeForIPC(tasks)
      };
    } catch (err) {
      error('❌ Error reading tasks from SQLite:', err);
      return {
        success: false,
        error: err.message,
        data: []
      };
    }
  }

  /**
   * Add new task
   */
  async addTask(taskData) {
    try {
      const taskId = this.generateId();
      const now = new Date().toISOString();
      const stmt = this.db.prepare(`
                INSERT INTO tasks (
                    id, name, handler, interval, enabled, status,
                    lastRun, nextRun, runCount, errorCount, lastError,
                    createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
      stmt.run(taskId, taskData.name, taskData.handler, taskData.interval, taskData.enabled ? 1 : 0, 'idle', null, null, 0, 0, null, now, now);
      log(`✅ Added task: ${taskData.name}`);
      return {
        success: true,
        id: taskId
      };
    } catch (err) {
      error('Error adding task:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Update task
   */
  async updateTask(taskId, updates) {
    try {
      const now = new Date().toISOString();
      const setFields = [];
      const values = [];
      for (const [key, value] of Object.entries(updates)) {
        if (key === 'enabled') {
          setFields.push(`${key} = ?`);
          values.push(value ? 1 : 0);
        } else if (key === 'lastRun' || key === 'nextRun') {
          setFields.push(`${key} = ?`);
          values.push(value ? value : null);
        } else {
          setFields.push(`${key} = ?`);
          values.push(value);
        }
      }
      if (setFields.length === 0) {
        return {
          success: true
        };
      }
      setFields.push('updatedAt = ?');
      values.push(now);
      values.push(taskId);
      const sql = `UPDATE tasks SET ${setFields.join(', ')} WHERE id = ?`;
      const stmt = this.db.prepare(sql);
      const result = stmt.run(...values);
      if (result.changes > 0) {
        log(`✅ Updated task ${taskId}`);
        return {
          success: true
        };
      } else {
        return {
          success: false,
          error: 'Task not found'
        };
      }
    } catch (error) {
      error('Error updating task:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete task
   */
  async deleteTask(taskId) {
    try {
      const stmt = this.db.prepare(`DELETE FROM tasks WHERE id = ?`);
      const result = stmt.run(taskId);
      if (result.changes > 0) {
        log(`✅ Deleted task ${taskId}`);
        return {
          success: true
        };
      } else {
        return {
          success: false,
          error: 'Task not found'
        };
      }
    } catch (err) {
      error('Error deleting task:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Get task by ID
   */
  async getTaskById(taskId) {
    try {
      const stmt = this.db.prepare(`SELECT * FROM tasks WHERE id = ?`);
      const task = stmt.get(taskId);
      if (task) {
        return {
          ...task,
          enabled: Boolean(task.enabled),
          lastRun: task.lastRun,
          nextRun: task.nextRun,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt
        };
      }
      return null;
    } catch (err) {
      error('Error getting task by ID:', err);
      return null;
    }
  }

  /**
   * Get tasks by status
   */
  async getTasksByStatus(status) {
    try {
      const stmt = this.db.prepare(`
                SELECT * FROM tasks 
                WHERE status = ? 
                ORDER BY createdAt DESC
            `);
      const tasks = stmt.all(status).map(task => ({
        ...task,
        enabled: Boolean(task.enabled),
        lastRun: task.lastRun,
        nextRun: task.nextRun,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }));
      return this.serializeForIPC(tasks);
    } catch (err) {
      error('Error getting tasks by status:', err);
      return [];
    }
  }

  /**
   * Get enabled tasks
   */
  async getEnabledTasks() {
    try {
      const stmt = this.db.prepare(`
                SELECT * FROM tasks 
                WHERE enabled = 1 
                ORDER BY createdAt DESC
            `);
      const tasks = stmt.all().map(task => ({
        ...task,
        enabled: Boolean(task.enabled),
        lastRun: task.lastRun,
        nextRun: task.nextRun,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }));
      return this.serializeForIPC(tasks);
    } catch (error) {
      error('Error getting enabled tasks:', error);
      return [];
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId, status, lastError = null) {
    try {
      const updates = {
        status: status,
        lastRun: new Date().toISOString()
      };
      if (status === 'failed' && lastError) {
        updates.lastError = lastError;
        // Increment error count
        const task = await this.getTaskById(taskId);
        if (task) {
          updates.errorCount = (task.errorCount || 0) + 1;
        }
      } else if (status === 'completed') {
        // Increment run count
        const task = await this.getTaskById(taskId);
        if (task) {
          updates.runCount = (task.runCount || 0) + 1;
        }
      }
      return await this.updateTask(taskId, updates);
    } catch (err) {
      error('Error updating task status:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Set task next run time
   */
  async setTaskNextRun(taskId, nextRunTime) {
    try {
      return await this.updateTask(taskId, {
        nextRun: nextRunTime ? nextRunTime : null
      });
    } catch (err) {
      error('Error setting task next run:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Enable/disable task
   */
  async toggleTask(taskId, enabled) {
    try {
      const updates = {
        enabled: Boolean(enabled)
      };

      // If disabling, clear next run time
      if (!enabled) {
        updates.nextRun = null;
        updates.status = 'idle';
      }
      return await this.updateTask(taskId, updates);
    } catch (error) {
      error('Error toggling task:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get task statistics
   */
  async getTaskStats() {
    try {
      const stmt = this.db.prepare(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN enabled = 1 THEN 1 ELSE 0 END) as enabled,
                    SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running,
                    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                    SUM(runCount) as totalRuns,
                    SUM(errorCount) as totalErrors
                FROM tasks
            `);
      const stats = stmt.get();
      return this.serializeForIPC({
        total: stats.total || 0,
        enabled: stats.enabled || 0,
        disabled: (stats.total || 0) - (stats.enabled || 0),
        running: stats.running || 0,
        failed: stats.failed || 0,
        idle: (stats.total || 0) - (stats.running || 0) - (stats.failed || 0),
        totalRuns: stats.totalRuns || 0,
        totalErrors: stats.totalErrors || 0
      });
    } catch (error) {
      error('Error getting task stats:', error);
      return this.serializeForIPC({
        total: 0,
        enabled: 0,
        disabled: 0,
        running: 0,
        failed: 0,
        idle: 0,
        totalRuns: 0,
        totalErrors: 0
      });
    }
  }

  /**
   * Clear task errors
   */
  async clearTaskErrors(taskId) {
    try {
      return await this.updateTask(taskId, {
        errorCount: 0,
        lastError: null,
        status: 'idle'
      });
    } catch (err) {
      error('Error clearing task errors:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Reset task counters
   */
  async resetTaskCounters(taskId) {
    try {
      return await this.updateTask(taskId, {
        runCount: 0,
        errorCount: 0,
        lastError: null,
        lastRun: null,
        nextRun: null,
        status: 'idle'
      });
    } catch (err) {
      error('Error resetting task counters:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }
}
module.exports = TaskStorage;

/***/ }),

/***/ "./lib/task-handlers.js":
/*!******************************!*\
  !*** ./lib/task-handlers.js ***!
  \******************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const StorageAdapter = __webpack_require__(/*! ./storage-adapter */ "./lib/storage-adapter.js");
const helper = __webpack_require__(/*! ../main/businesses/helper */ "./main/businesses/helper.js");
const GroupView = __webpack_require__(/*! ../main/businesses/Viewer */ "./main/businesses/Viewer.js");
const {
  log,
  error
} = __webpack_require__(/*! ./logger */ "./lib/logger.js");
const notificationManager = __webpack_require__(/*! ./notification-manager */ "./lib/notification-manager.js");
/**
 * Các hàm xử lý tasks
 */
class TaskHandlers {
  constructor(storageManager) {
    this.storageManager = storageManager || new StorageAdapter();
  }

  /**
   * Kiểm tra sức khỏe accounts
   */
  async checkAccountHealth() {
    log('Đang kiểm tra sức khỏe accounts...');
    try {
      const accounts = await this.storageManager.getAllAccounts();
      let healthyCount = 0;
      let unhealthyCount = 0;
      for (const account of accounts) {
        // Logic kiểm tra account health
        // Ví dụ: kiểm tra xem account có bị ban không
        if (account.status === 'active') {
          healthyCount++;
        } else {
          unhealthyCount++;
        }
      }
      log(`Kết quả kiểm tra: ${healthyCount} khỏe mạnh, ${unhealthyCount} có vấn đề`);
    } catch (error) {
      error('Lỗi khi kiểm tra sức khỏe accounts:', error);
      throw error;
    }
  }

  /**
   * Cập nhật trạng thái proxy
   */
  async updateProxyStatus() {
    log('Đang cập nhật trạng thái proxies...');
    try {
      const proxies = await this.storageManager.getAllProxies();
      let activeCount = 0;
      let inactiveCount = 0;
      for (const proxy of proxies) {
        // Logic test proxy
        try {
          const result = await this.storageManager.testProxy(proxy.id);
          if (result.success) {
            activeCount++;
          } else {
            inactiveCount++;
          }
        } catch (error) {
          inactiveCount++;
        }
      }
      log(`Cập nhật proxy: ${activeCount} hoạt động, ${inactiveCount} không hoạt động`);
    } catch (error) {
      error('Lỗi khi cập nhật trạng thái proxies:', error);
      throw error;
    }
  }

  /**
   * Dọn dẹp dữ liệu cũ
   */
  async cleanupOldData() {
    log('Đang dọn dẹp dữ liệu cũ...');
    try {
      // Logic dọn dẹp dữ liệu cũ
      // Ví dụ: xóa logs cũ, dữ liệu tạm thời
      log('Hoàn thành dọn dẹp dữ liệu');
    } catch (error) {
      error('Lỗi khi dọn dẹp dữ liệu:', error);
      throw error;
    }
  }

  /**
   * Sao lưu dữ liệu
   */
  async backupData() {
    log('Đang sao lưu dữ liệu...');
    try {
      // Logic sao lưu
      const accounts = await this.storageManager.getAllAccounts();
      const proxies = await this.storageManager.getAllProxies();
      const folders = await this.storageManager.getAllFolders();

      // Tạo backup file với timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupData = {
        timestamp,
        accounts,
        proxies,
        folders
      };
      log(`Tạo backup thành công tại ${timestamp}`);
    } catch (error) {
      error('Lỗi khi sao lưu dữ liệu:', error);
      throw error;
    }
  }

  /**
   * Giám sát phòng live và cập nhật currentViewers
   * Tự động dừng phòng khi không còn live
   */
  async monitorRooms() {
    log('🔍 Checking realViewers for live rooms...');
    try {
      const rooms = await this.storageManager.getAllRooms();

      // Lấy tối đa 20 rooms đang chạy, sort theo lastTimeCheckViewers lâu nhất ưu tiên trước
      const watchingRooms = rooms.filter(room => room.status === 'watching' && room.id) // Đảm bảo room có id
      .sort((a, b) => {
        const aTime = a.lastTimeCheckViewers || '1970-01-01T00:00:00.000Z';
        const bTime = b.lastTimeCheckViewers || '1970-01-01T00:00:00.000Z';
        return new Date(aTime) - new Date(bTime);
      }).slice(0, 20);
      if (watchingRooms.length === 0) {
        log('📭 No watching rooms to check');
        return {
          success: true,
          code: 'noActiveRooms'
        };
      }
      log(`🎯 Checking ${watchingRooms.length} rooms...`);
      let successCount = 0;
      let errorCount = 0;
      let stoppedCount = 0; // Đếm số phòng bị dừng tự động
      let proxies = await helper.getProxySite();
      for (const room of watchingRooms) {
        try {
          // Kiểm tra room.id không được null
          if (!room.id) {
            error('❌ Bỏ qua room không có id');
            errorCount++;
            continue;
          }
          log(`🔍 Checking room: ${room.roomUsername || room.roomId}`);
          let proxy = proxies[Math.floor(Math.random() * proxies.length)];
          // Sử dụng helper.getRoomInfo4 như yêu cầu
          const roomInfo = await helper.getRoomInfo4({
            room_id: room.roomId,
            proxy: proxy
          });
          if (roomInfo.err || roomInfo.view_count === undefined) {
            log(`❌ Cannot get view_count for room ${room.roomId}:`, roomInfo);
            errorCount++;
            continue;
          }
          const now = new Date().toISOString();

          // ⭐ TÍNH NĂNG MỚI: Tự động dừng phòng khi không còn live
          if (!roomInfo.is_alive) {
            log(`🛑 Room ${room.roomUsername || room.roomId} is no longer live - Auto stopping...`);
            try {
              // Thực hiện đầy đủ workflow dừng phòng
              await this.storageManager.updateRoom(room.id, {
                status: 'stopped',
                stoppedAt: now,
                stopReason: 'auto_stopped_not_live' // Lý do dừng
              });
              notificationManager.notifyRoomStopped(room);
              // ✅ Sử dụng GroupView đã import sẵn
              await GroupView.stopViewers({
                task_id: room.id
              });

              // Giải phóng các accounts
              try {
                await this.storageManager.releaseAccountsFromRoom(room.id);
                log(`✅ Released accounts from auto-stopped room ${room.id}`);
              } catch (releaseError) {
                error(`❌ Error releasing accounts from room ${room.id}:`, releaseError);
              }
              log(`✅ Auto-stopped room ${room.roomUsername}: Not live anymore`);
              stoppedCount++;
            } catch (stopError) {
              error(`❌ Error auto-stopping room ${room.roomId}:`, stopError);
              errorCount++;
            }
            continue; // Skip việc cập nhật viewers cho phòng đã dừng
          }

          // Thêm vào file history riêng thay vì rooms.json
          await this.storageManager.addViewerHistoryEntry(room.id, {
            timestamp: now,
            viewers: roomInfo.view_count,
            isAlive: roomInfo.is_alive
          });

          // Chỉ update realViewers + lastTimeCheckViewers trong rooms.json
          // KHÔNG ghi đè currentViewers (đó là số account tool)
          await this.storageManager.updateRoom(room.id, {
            realViewers: roomInfo.view_count,
            // <-- Field mới cho viewer thực TikTok
            lastTimeCheckViewers: now
          });
          log(`✅ Updated room ${room.roomUsername}: ${roomInfo.view_count} real viewers`);
          successCount++;

          // Delay để tránh rate limit
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          error(`❌ Error checking room ${room.roomId}:`, error);
          errorCount++;
        }
      }
      log(`✅ Completed monitoring: ${successCount} updated, ${stoppedCount} auto-stopped, ${errorCount} errors`);
      return {
        success: true,
        code: 'roomMonitoringCompleted',
        params: {
          updated: successCount,
          autoStopped: stoppedCount,
          errors: errorCount
        }
      };
    } catch (error) {
      error('❌ Error monitoring rooms:', error);
      return {
        success: false,
        code: 'taskStartFailed'
      };
    }
  }

  /**
   * Cập nhật info cho accounts chưa có thông tin
   */
  async updateAccountsInfo() {
    log('Đang cập nhật info cho accounts...');
    try {
      // Lấy 10 accounts chưa có info, sort theo createdAt cũ nhất
      const accounts = await this.storageManager.getAllAccounts();

      // Filter accounts chưa có avatarThumb hoặc roomUsername
      const accountsNeedInfo = accounts.filter(account => !account.avatarThumb || !account.roomUsername).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).slice(0, 10); // Lấy 10 accounts đầu tiên

      if (accountsNeedInfo.length === 0) {
        log('✅ Tất cả accounts đã có thông tin đầy đủ');
        return;
      }
      log(`🔄 Tìm thấy ${accountsNeedInfo.length} accounts cần cập nhật info`);
      let successCount = 0;
      let errorCount = 0;
      let proxies = await helper.getProxySite();
      for (const account of accountsNeedInfo) {
        try {
          log(`🔄 Đang cập nhật info cho account: ${account.username}`);

          // Gọi getUserInfo
          let proxy = proxies[Math.floor(Math.random() * proxies.length)];
          log("🔄 Using proxy:", proxy);
          const result = await helper.getUserInfo({
            proxy: proxy,
            username: account.username
          });
          if (result.err || !result.avatarThumb) {
            log(`❌ Lỗi khi lấy info cho ${account.username}:`, result);
            errorCount++;
            continue;
          }

          // Cập nhật account với thông tin mới
          await this.storageManager.updateAccount(account.id, {
            avatarThumb: result.avatarThumb,
            roomUsername: result.roomUsername || account.username,
            updatedAt: new Date()
          });
          log(`✅ Cập nhật thành công cho ${account.username}: ${result.roomUsername}`);
          successCount++;

          // Delay giữa các request để tránh rate limit
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          error(`❌ Lỗi khi xử lý account ${account.username}:`, error);
          errorCount++;
        }
      }
      log(`✅ Hoàn thành cập nhật info: ${successCount} thành công, ${errorCount} lỗi`);
    } catch (error) {
      error('❌ Lỗi khi cập nhật account info:', error);
      throw error;
    }
  }

  /**
   * Tự động dừng rooms đã hết thời gian chạy
   * Task chạy ngầm như crontask
   */
  async autoStopExpiredRooms() {
    log('⏰ Checking for expired rooms to auto-stop...');
    try {
      const rooms = await this.storageManager.getAllRooms();

      // Lấy tất cả rooms đang watching
      const watchingRooms = rooms.filter(room => room.status === 'watching' && room.id);
      if (watchingRooms.length === 0) {
        log('📭 No watching rooms to check for expiration');
        return {
          success: true,
          code: 'noActiveRooms'
        };
      }

      // Shuffle và lấy tối đa 100 rooms ngẫu nhiên
      const shuffledRooms = watchingRooms.sort(() => Math.random() - 0.5);
      const roomsToCheck = shuffledRooms.slice(0, 100);
      log(`🎲 Checking ${roomsToCheck.length} random rooms for expiration...`);
      let expiredCount = 0;
      let errorCount = 0;
      let checkedCount = 0;
      const now = new Date();
      for (const room of roomsToCheck) {
        try {
          checkedCount++;

          // Kiểm tra room.id không được null
          if (!room.id) {
            error('❌ Bỏ qua room không có id');
            errorCount++;
            continue;
          }

          // Kiểm tra xem room có startedAt và duration không
          if (!room.startedAt || !room.duration) {
            log(`⚠️ Room ${room.roomUsername || room.roomId} missing startedAt or duration - skipping`);
            continue;
          }
          const startedAt = new Date(room.startedAt);
          const durationMs = room.duration * 60 * 1000; // Convert duration (phút) to milliseconds
          const runningTime = now - startedAt;

          // Kiểm tra nếu đã hết thời gian chạy
          if (runningTime >= durationMs) {
            const runningMinutes = Math.floor(runningTime / (60 * 1000));
            log(`⏰ Room ${room.roomUsername || room.roomId} expired (${runningMinutes}min >= ${room.duration}min) - Auto stopping...`);
            try {
              // Thực hiện đầy đủ workflow dừng phòng
              await this.storageManager.updateRoom(room.id, {
                status: 'stopped',
                stoppedAt: now.toISOString(),
                stopReason: 'auto_stopped_duration_expired',
                finalDuration: runningMinutes // Lưu thời gian chạy thực tế
              });
              notificationManager.notifyRoomStopped(room);
              // Dừng viewers
              await GroupView.stopViewers({
                task_id: room.id
              });

              // Giải phóng các accounts
              try {
                await this.storageManager.releaseAccountsFromRoom(room.id);
                log(`✅ Released accounts from auto-stopped expired room ${room.id}`);
              } catch (releaseError) {
                error(`❌ Error releasing accounts from room ${room.id}:`, releaseError);
              }
              log(`✅ Auto-stopped expired room ${room.roomUsername}: Ran for ${runningMinutes} minutes`);
              expiredCount++;
            } catch (stopError) {
              error(`❌ Error auto-stopping expired room ${room.roomId}:`, stopError);
              errorCount++;
            }
          } else {
            const remainingMinutes = Math.floor((durationMs - runningTime) / (60 * 1000));
            log(`⏳ Room ${room.roomUsername || room.roomId} still running (${remainingMinutes}min remaining)`);
          }

          // Delay nhỏ để không quá tải
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          error(`❌ Error checking room ${room.roomId}:`, error);
          errorCount++;
        }
      }
      log(`✅ Completed duration check: ${checkedCount} checked, ${expiredCount} auto-stopped, ${errorCount} errors`);
      return {
        success: true,
        code: 'expiredRoomsChecked',
        params: {
          checked: checkedCount,
          expired: expiredCount,
          errors: errorCount
        }
      };
    } catch (error) {
      error('❌ Error checking expired rooms:', error);
      return {
        success: false,
        code: 'taskStartFailed'
      };
    }
  }
}

// ⭐ Export class TaskHandlers để có thể khởi tạo với storageManager
module.exports = TaskHandlers;

/***/ }),

/***/ "./lib/task-manager.js":
/*!*****************************!*\
  !*** ./lib/task-manager.js ***!
  \*****************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const fs = (__webpack_require__(/*! fs */ "fs").promises);
const path = __webpack_require__(/*! path */ "path");
const {
  app
} = __webpack_require__(/*! electron */ "electron");
const {
  randomUUID
} = __webpack_require__(/*! crypto */ "crypto");
const {
  log,
  error
} = __webpack_require__(/*! ./logger */ "./lib/logger.js");

/**
 * Quản lý tasks tự động
 */
class TaskManager {
  constructor(storageManager = null) {
    this.dataDir = path.join(app.getPath('userData'), 'amac-data');

    // ⭐ Lưu reference tới storageManager  
    this.storageManager = storageManager;

    // Lưu trữ các timer đang chạy
    this.activeTimers = new Map();

    // Registry của các hàm xử lý
    this.taskHandlers = new Map();
    this.writeQueue = Promise.resolve(); // ✅ Write queue để serialize writes

    this.init();
  }

  /**
   * Khởi tạo task manager
   */
  async init() {
    try {
      await fs.mkdir(this.dataDir, {
        recursive: true
      });

      // ⭐ Không cần initFile nữa vì dùng SQLite

      // Đăng ký các hàm xử lý mặc định
      this.registerDefaultHandlers();

      // ✅ Tạo task ngầm tự động
      await this.ensureSystemTasks();

      // Khởi tạo lại các task đang kích hoạt
      await this.restoreActiveTasks();
      log('Task manager initialized');
    } catch (err) {
      error('Error initializing task manager:', err);
    }
  }

  /**
   * Đọc dữ liệu tasks từ SQLite
   */
  async readTasks() {
    try {
      if (!this.storageManager) {
        log('⚠️ No storage manager, falling back to empty tasks');
        return [];
      }
      const result = await this.storageManager.getAllTasks();
      if (result.success) {
        log(`📖 Successfully read ${result.data.length} tasks from SQLite`);
        return result.data;
      } else {
        log('❌ Error reading tasks from SQLite:', result.error);
        return [];
      }
    } catch (error) {
      log('❌ Error reading tasks:', error);
      return [];
    }
  }

  /**
   * Ghi dữ liệu tasks - KHÔNG CẦN THIẾT với SQLite vì auto-save
   */
  async writeTasks(tasks) {
    // ⭐ Với SQLite, không cần writeTasks vì mỗi operation tự động save
    // Chỉ log để theo dõi
    log(`📝 Tasks stored in SQLite: ${tasks.length} tasks`);
    return true;
  }

  /**
   * Đăng ký hàm xử lý cho task
   */
  registerHandler(handlerName, handlerFunction) {
    this.taskHandlers.set(handlerName, handlerFunction);
  }

  /**
   * Đăng ký các hàm xử lý mặc định
   */
  registerDefaultHandlers() {
    // ⭐ Import và khởi tạo task handlers với storageManager
    const TaskHandlers = __webpack_require__(/*! ./task-handlers */ "./lib/task-handlers.js");
    const taskHandlersInstance = new TaskHandlers(this.storageManager);
    this.registerHandler('checkAccountHealth', taskHandlersInstance.checkAccountHealth.bind(taskHandlersInstance));
    this.registerHandler('updateProxyStatus', taskHandlersInstance.updateProxyStatus.bind(taskHandlersInstance));
    this.registerHandler('cleanupOldData', taskHandlersInstance.cleanupOldData.bind(taskHandlersInstance));
    this.registerHandler('backupData', taskHandlersInstance.backupData.bind(taskHandlersInstance));
    this.registerHandler('monitorRooms', taskHandlersInstance.monitorRooms.bind(taskHandlersInstance));
    this.registerHandler('updateAccountsInfo', taskHandlersInstance.updateAccountsInfo.bind(taskHandlersInstance));
    this.registerHandler('autoStopExpiredRooms', taskHandlersInstance.autoStopExpiredRooms.bind(taskHandlersInstance));
  }

  /**
   * Lấy tất cả tasks
   */
  async getAllTasks() {
    return await this.readTasks();
  }

  /**
   * Đảm bảo các system tasks được tạo tự động
   */
  async ensureSystemTasks() {
    try {
      const tasks = await this.getAllTasks();

      // Kiểm tra xem đã có task autoStopExpiredRooms chưa
      const expiredRoomTask = tasks.find(t => t.handler === 'autoStopExpiredRooms');
      const updateAccountsInfoTask = tasks.find(t => t.handler === 'updateAccountsInfo');
      const monitorRoomsTask = tasks.find(t => t.handler === 'monitorRooms');

      // Tạo thời gian hiện tại và thời gian chạy tiếp theo
      const now = new Date().toISOString();
      const nextRunTime = new Date(Date.now() + 60000).toISOString(); // Một phút từ hiện tại

      if (!expiredRoomTask) {
        await this.addTask({
          name: 'Auto Stop Expired Rooms',
          handler: 'autoStopExpiredRooms',
          interval: 60000,
          // 1 phút
          enabled: true,
          status: 'idle',
          lastRun: null,
          nextRun: nextRunTime
        });
      }
      if (!updateAccountsInfoTask) {
        await this.addTask({
          name: 'Update Accounts Info',
          handler: 'updateAccountsInfo',
          interval: 60000,
          // 1 phút
          enabled: true,
          status: 'idle',
          lastRun: null,
          nextRun: nextRunTime
        });
      }
      if (!monitorRoomsTask) {
        await this.addTask({
          name: 'Monitor Rooms',
          handler: 'monitorRooms',
          interval: 60000,
          // 1 phút
          enabled: true,
          status: 'idle',
          lastRun: null,
          nextRun: nextRunTime
        });
      }
    } catch (error) {
      error('Error ensuring system tasks:', error);
    }
  }

  /**
   * Thêm task mới
   */
  async addTask(taskData) {
    if (!this.storageManager) {
      throw new Error('Storage manager not initialized');
    }

    // Validate handler exists
    if (!this.taskHandlers.has(taskData.handler)) {
      throw new Error(`Handler '${taskData.handler}' không tồn tại`);
    }

    // Thêm các trường mặc định
    const task = {
      ...taskData,
      id: randomUUID(),
      status: taskData.status || 'idle',
      runCount: 0,
      errorCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const result = await this.storageManager.addTask(task);
    if (!result.success) {
      throw new Error(result.error);
    }

    // Bắt đầu task nếu được kích hoạt
    if (task.enabled) {
      await this.startTask(task.id);
    }
    return task.id;
  }

  /**
   * Cập nhật task
   */
  async updateTask(taskId, updates) {
    if (!this.storageManager) {
      throw new Error('Storage manager not initialized');
    }
    const result = await this.storageManager.updateTask(taskId, updates);
    if (!result.success) {
      throw new Error(result.error);
    }

    // Restart task nếu enabled thay đổi
    if ('enabled' in updates) {
      if (updates.enabled) {
        await this.startTask(taskId);
      } else {
        this.stopTask(taskId);
      }
    }
    return true;
  }

  /**
   * Xóa task
   */
  async deleteTask(taskId) {
    if (!this.storageManager) {
      throw new Error('Storage manager not initialized');
    }

    // Stop task trước khi xóa
    this.stopTask(taskId);
    const result = await this.storageManager.deleteTask(taskId);
    if (!result.success) {
      throw new Error(result.error);
    }
    return true;
  }

  /**
   * Bắt đầu task trực tiếp (không check enabled)
   */
  async startTaskDirectly(taskId) {
    log(`🚀 Bắt đầu task trực tiếp ${taskId}`);
    const tasks = await this.getAllTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error('Task không tồn tại');
    }

    // Dừng timer cũ nếu có
    this.stopTask(taskId);

    // Tạo timer mới
    const timer = setInterval(async () => {
      await this.executeTask(taskId);
    }, task.interval);
    this.activeTimers.set(taskId, timer);

    // Tính toán thời gian chạy tiếp theo một cách chính xác
    const nextRunTime = new Date(Date.now() + task.interval).toISOString();

    // Cập nhật trạng thái task
    await this.storageManager.updateTask(taskId, {
      status: 'running',
      nextRun: nextRunTime
    });
    log(`Task '${task.name}' đã được bắt đầu, chạy tiếp theo vào: ${nextRunTime}`);
  }

  /**
   * Bắt đầu task (với validation)
   */
  async startTask(taskId) {
    const tasks = await this.getAllTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error('Task không tồn tại');
    }
    if (!task.enabled) {
      throw new Error('Task chưa được kích hoạt');
    }
    return await this.startTaskDirectly(taskId);
  }

  /**
   * Dừng task
   */
  stopTask(taskId) {
    log(`🛑 Attempting to stop task ${taskId}`);
    const timer = this.activeTimers.get(taskId);
    if (timer) {
      clearInterval(timer);
      this.activeTimers.delete(taskId);
      log(`✅ Task ${taskId} timer cleared successfully`);
    } else {
      log(`⚠️ No active timer found for task ${taskId}`);
    }

    // Debug: Show remaining active timers
    log(`🔍 Active timers after stop:`, Array.from(this.activeTimers.keys()));
  }

  /**
   * Thực thi task với improved checking
   */
  async executeTask(taskId) {
    log(`🚀 Executing task ${taskId}`);
    const tasks = await this.getAllTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      log(`❌ Task ${taskId} not found`);
      // ✅ CHỈ STOP TASK ĐÓ, KHÔNG STOP TẤT CẢ
      this.stopTask(taskId);
      return;
    }
    if (!task.enabled) {
      log(`❌ Task ${taskId} is disabled, stopping`);
      this.stopTask(taskId);
      return;
    }

    // TRIPLE CHECK: Timer có còn trong activeTimers không
    if (!this.activeTimers.has(taskId)) {
      log(`❌ Task ${taskId} timer not in activeTimers, stopping`);
      return;
    }
    try {
      log(`⏳ Task ${task.name} (${taskId}) starting execution`);

      // Cập nhật trạng thái running và lastRun
      const currentTime = new Date().toISOString();
      await this.storageManager.updateTask(taskId, {
        status: 'running',
        lastRun: currentTime
      });
      const handler = this.taskHandlers.get(task.handler);
      if (!handler) {
        throw new Error(`Handler '${task.handler}' không tồn tại`);
      }

      // ✅ WRAPPER với timeout để tránh hang
      await Promise.race([handler(), new Promise((_, reject) => setTimeout(() => reject(new Error('Task timeout after 5 minutes')), 5 * 60 * 1000))]);
      log(`✅ Task ${taskId} completed successfully`);

      // Tính toán nextRun mới
      const nextRunTime = new Date(Date.now() + task.interval).toISOString();

      // Cập nhật status, runCount, và nextRun
      await this.storageManager.updateTask(taskId, {
        status: 'completed',
        runCount: (task.runCount || 0) + 1,
        nextRun: nextRunTime
      });
    } catch (err) {
      error(`❌ Error executing task ${task.name}:`, err);

      // ✅ Không crash nếu updateTaskStatus fail
      try {
        // Tính toán nextRun mới ngay cả khi có lỗi
        const nextRunTime = new Date(Date.now() + task.interval).toISOString();
        await this.storageManager.updateTask(taskId, {
          status: 'error',
          lastError: err.message,
          errorCount: (task.errorCount || 0) + 1,
          nextRun: nextRunTime
        });
      } catch (updateErr) {
        error(`❌ Failed to update task status:`, updateErr);
      }
    }
  }

  /**
   * Cập nhật trạng thái task
   */
  async updateTaskStatus(taskId, status, lastError = null) {
    if (!this.storageManager) {
      log('⚠️ No storage manager, skipping status update');
      return;
    }
    try {
      // Lấy thông tin task hiện tại để cập nhật đúng
      const task = await this.storageManager.getTaskById(taskId);
      if (!task) {
        log(`⚠️ Cannot update status for non-existent task ${taskId}`);
        return;
      }
      const updates = {
        status,
        updatedAt: new Date().toISOString()
      };

      // Cập nhật lastRun nếu là running hoặc completed
      if (status === 'running' || status === 'completed') {
        updates.lastRun = new Date().toISOString();
      }

      // Cập nhật nextRun nếu task vẫn active
      if (task.enabled && (status === 'completed' || status === 'running')) {
        updates.nextRun = new Date(Date.now() + task.interval).toISOString();
      }

      // Cập nhật error nếu có
      if (lastError) {
        updates.lastError = lastError;
        updates.errorCount = (task.errorCount || 0) + 1;
      }

      // Cập nhật runCount nếu completed
      if (status === 'completed') {
        updates.runCount = (task.runCount || 0) + 1;
      }
      const result = await this.storageManager.updateTask(taskId, updates);
      if (!result.success) {
        error('❌ Error updating task status:', result.error);
      }
    } catch (err) {
      error('❌ Error updating task status:', err);
    }
  }

  /**
   * Khôi phục các task đang hoạt động sau khi restart
   */
  async restoreActiveTasks() {
    const tasks = await this.getAllTasks();
    const activeTasks = tasks.filter(t => t.enabled);
    for (const task of activeTasks) {
      try {
        await this.startTask(task.id);
      } catch (err) {
        error(`Error restoring task ${task.name}:`, err);
      }
    }
  }

  /**
   * Thực thi task ngay lập tức (manual run)
   */
  async runTaskNow(taskId) {
    await this.executeTask(taskId);
  }

  /**
   * Dọn dẹp tất cả timers khi shutdown
   */
  cleanup() {
    for (const [taskId, timer] of this.activeTimers) {
      clearInterval(timer);
    }
    this.activeTimers.clear();
  }

  /**
   * Lấy danh sách handlers có sẵn
   */
  getAvailableHandlers() {
    return Array.from(this.taskHandlers.keys());
  }

  /**
   * Debug method - Show active timers
   */
  debugActiveTimers() {
    log('🔍 Active Timers:', Array.from(this.activeTimers.keys()));
    log('🔍 Total active timers:', this.activeTimers.size);
  }
}
module.exports = TaskManager;

/***/ }),

/***/ "./main/background.js":
/*!****************************!*\
  !*** ./main/background.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const path = __webpack_require__(/*! path */ "path");
const {
  app,
  ipcMain,
  screen
} = __webpack_require__(/*! electron */ "electron");
const serve = __webpack_require__(/*! electron-serve */ "electron-serve");
const {
  createWindow
} = __webpack_require__(/*! ./helpers */ "./main/helpers/index.js");
const Viewer = __webpack_require__(/*! ./businesses/Viewer.js */ "./main/businesses/Viewer.js");
const {
  log,
  error
} = __webpack_require__(/*! ../lib/logger */ "./lib/logger.js");
const {
  createMenu,
  setupMenuLocalization
} = __webpack_require__(/*! ./menu */ "./main/menu.js");
const fs = __webpack_require__(/*! fs */ "fs");
const appState = __webpack_require__(/*! ../lib/app-state */ "./lib/app-state.js");
const isProd = "development" === 'production';

// Set app name
app.name = 'amac-tiktok-viewer';
if (process.platform === 'darwin') {
  const iconPath = isProd ? path.join(process.resourcesPath, 'icon.png') : path.join(__dirname, '../resources/icon.png');
  try {
    if ((__webpack_require__(/*! fs */ "fs").existsSync)(iconPath)) {
      app.dock.setIcon(iconPath);
    }
  } catch (e) {
    // Ignore icon errors
  }
}

// Hàm cập nhật tên ứng dụng theo ngôn ngữ
function updateAppName() {
  // Đọc file translation dựa trên ngôn ngữ hiện tại
  const currentLanguage = appState.language || 'vi';
  const isProd = "development" === 'production';

  // Đọc file translation từ thư mục locales
  try {
    let translationPath;
    if (isProd) {
      // Trong môi trường production, đường dẫn tới thư mục locales đã giải nén
      const appPath = app.getAppPath();
      const appDir = path.dirname(appPath);

      // Thử tìm trong thư mục locales giải nén ở cùng cấp với app.asar
      translationPath = path.join(appDir, 'locales', currentLanguage, 'common.json');

      // Trên macOS có thể có cấu trúc khác
      if (process.platform === 'darwin' && !fs.existsSync(translationPath)) {
        // Thử tìm trong Resources
        translationPath = path.join(process.resourcesPath, 'locales', currentLanguage, 'common.json');
      }
    } else {
      // Môi trường development
      translationPath = path.join(app.getAppPath(), 'renderer', 'locales', currentLanguage, 'common.json');
    }
    log(`🔍 App: Trying to load translations from: ${translationPath}`);
    if (fs.existsSync(translationPath)) {
      const data = fs.readFileSync(translationPath, 'utf8');
      const translations = JSON.parse(data);

      // Cập nhật tên ứng dụng nếu có
      if (translations && translations.app && translations.app.title) {
        app.name = translations.app.title;
        log(`✅ App: Updated app name to "${app.name}" (${currentLanguage})`);
      }
    } else {
      log(`❌ App: Translation file not found for ${currentLanguage} at ${translationPath}`);

      // Thử dùng tiếng Việt làm fallback
      let fallbackPath;
      if (isProd) {
        // Trong môi trường production
        const appPath = app.getAppPath();
        const appDir = path.dirname(appPath);

        // Thử tìm trong thư mục locales giải nén
        fallbackPath = path.join(appDir, 'locales', 'vi', 'common.json');

        // Trên macOS có thể có cấu trúc khác
        if (process.platform === 'darwin' && !fs.existsSync(fallbackPath)) {
          // Thử tìm trong Resources
          fallbackPath = path.join(process.resourcesPath, 'locales', 'vi', 'common.json');
        }
      } else {
        // Môi trường development
        fallbackPath = path.join(app.getAppPath(), 'renderer', 'locales', 'vi', 'common.json');
      }
      log(`🔍 App: Trying fallback at: ${fallbackPath}`);
      if (fs.existsSync(fallbackPath)) {
        const data = fs.readFileSync(fallbackPath, 'utf8');
        const translations = JSON.parse(data);

        // Cập nhật tên ứng dụng nếu có
        if (translations && translations.app && translations.app.title) {
          app.name = translations.app.title;
          log(`✅ App: Updated app name to "${app.name}" (fallback to vi)`);
        }
      } else {
        log(`❌ App: Fallback translation file not found at ${fallbackPath}`);
      }
    }
  } catch (err) {
    log(`❌ App: Error updating app name: ${err.message}`);
  }
}

// Đăng ký lắng nghe sự kiện thay đổi ngôn ngữ cho tên ứng dụng
function setupAppNameLocalization() {
  appState.addListener('language', language => {
    log(`🌐 App: Language changed to ${language}, updating app name`);
    updateAppName();
  });
}

// Hàm cập nhật About Panel với hỗ trợ đa ngôn ngữ
function setupAboutPanel() {
  // Đọc file translation dựa trên ngôn ngữ hiện tại
  const currentLanguage = appState.language || 'vi';
  const isProd = "development" === 'production';

  // Đọc file translation từ thư mục locales
  let translations = {};
  try {
    let translationPath;
    if (isProd) {
      // Trong môi trường production, đường dẫn tới thư mục locales đã giải nén
      const appPath = app.getAppPath();
      const appDir = path.dirname(appPath);

      // Thử tìm trong thư mục locales giải nén ở cùng cấp với app.asar
      translationPath = path.join(appDir, 'locales', currentLanguage, 'common.json');

      // Trên macOS có thể có cấu trúc khác
      if (process.platform === 'darwin' && !fs.existsSync(translationPath)) {
        // Thử tìm trong Resources
        translationPath = path.join(process.resourcesPath, 'locales', currentLanguage, 'common.json');
      }
    } else {
      // Môi trường development
      translationPath = path.join(app.getAppPath(), 'renderer', 'locales', currentLanguage, 'common.json');
    }
    log(`🔍 About Panel: Trying to load translations from: ${translationPath}`);
    if (fs.existsSync(translationPath)) {
      const data = fs.readFileSync(translationPath, 'utf8');
      translations = JSON.parse(data);
      log(`✅ About Panel: Loaded ${currentLanguage} translations successfully`);
    } else {
      log(`❌ About Panel: Translation file not found for ${currentLanguage} at ${translationPath}`);
      // Fallback to Vietnamese
      let fallbackPath;
      if (isProd) {
        // Trong môi trường production
        const appPath = app.getAppPath();
        const appDir = path.dirname(appPath);

        // Thử tìm trong thư mục locales giải nén
        fallbackPath = path.join(appDir, 'locales', 'vi', 'common.json');

        // Trên macOS có thể có cấu trúc khác
        if (process.platform === 'darwin' && !fs.existsSync(fallbackPath)) {
          // Thử tìm trong Resources
          fallbackPath = path.join(process.resourcesPath, 'locales', 'vi', 'common.json');
        }
      } else {
        // Môi trường development
        fallbackPath = path.join(app.getAppPath(), 'renderer', 'locales', 'vi', 'common.json');
      }
      log(`🔍 About Panel: Trying fallback at: ${fallbackPath}`);
      if (fs.existsSync(fallbackPath)) {
        const fallbackData = fs.readFileSync(fallbackPath, 'utf8');
        translations = JSON.parse(fallbackData);
        log(`✅ About Panel: Loaded fallback (vi) translations`);
      } else {
        log(`❌ About Panel: Fallback translation file not found at ${fallbackPath}`);
      }
    }
  } catch (err) {
    log(`❌ About Panel: Error loading translations: ${err.message}`);
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
      log(`❌ About Panel: Translation error for key ${key}: ${err.message}`);
      return key;
    }
  };

  // Cấu hình About panel với thông tin đa ngôn ngữ
  app.setAboutPanelOptions({
    applicationName: t('app.name'),
    applicationVersion: app.getVersion(),
    version: app.getVersion(),
    copyright: t('settings.about.licenseText'),
    credits: t('settings.about.teamMembers'),
    iconPath: isProd ? path.join(process.resourcesPath, 'icon.png') : path.join(__dirname, '../resources/icon.png')
  });
}

// Đăng ký lắng nghe sự kiện thay đổi ngôn ngữ
function setupAboutPanelLocalization() {
  appState.addListener('language', language => {
    log(`🌐 About Panel: Language changed to ${language}, updating about panel`);
    setupAboutPanel();
  });
}

// Import storage adapter for SQLite storage
const StorageAdapter = __webpack_require__(/*! ../lib/storage-adapter */ "./lib/storage-adapter.js");

// Import all handlers
const accountHandlers = __webpack_require__(/*! ./handlers/accountHandlers */ "./main/handlers/accountHandlers.js");
const proxyHandlers = __webpack_require__(/*! ./handlers/proxyHandlers */ "./main/handlers/proxyHandlers.js");
const roomHandlers = __webpack_require__(/*! ./handlers/roomHandlers */ "./main/handlers/roomHandlers.js");
const bulkOperationHandlers = __webpack_require__(/*! ./handlers/bulkOperationHandlers */ "./main/handlers/bulkOperationHandlers.js");
const settingsHandlers = __webpack_require__(/*! ./handlers/settingsHandlers */ "./main/handlers/settingsHandlers.js");
const folderHandlers = __webpack_require__(/*! ./handlers/folderHandlers */ "./main/handlers/folderHandlers.js");
const utilityHandlers = __webpack_require__(/*! ./handlers/utilityHandlers */ "./main/handlers/utilityHandlers.js");
const taskHandlers = __webpack_require__(/*! ./handlers/taskHandlers */ "./main/handlers/taskHandlers.js");
const notificationHandlers = __webpack_require__(/*! ./handlers/notificationHandlers */ "./main/handlers/notificationHandlers.js");

// Initialize data managers
let storageManager, accountManager, proxyManager, configManager;

// Initialize managers asynchronously
async function initializeManagers() {
  try {
    // Khởi tạo SQLite storage 
    storageManager = new StorageAdapter();
    await storageManager.init();
    log(`🗄️ Storage initialized: ${storageManager.getStorageType().toUpperCase()}`);
    log('✅ Using SQLite for better performance');

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
          return {
            success: false,
            error: err.message
          };
        }
      },
      async bulkMoveProxiesToFolder(proxyIds, folderId) {
        // Sửa lại để gọi qua storageManager
        try {
          log(`📦 Đang gọi bulkMoveProxiesToFolder với ${proxyIds.length} proxies và folder ${folderId}`);

          // Kiểm tra tham số đầu vào
          if (!proxyIds || !Array.isArray(proxyIds) || proxyIds.length === 0) {
            error('❌ Lỗi: proxyIds không hợp lệ:', proxyIds);
            return {
              success: false,
              error: 'Danh sách proxy không hợp lệ hoặc rỗng'
            };
          }
          if (!folderId || typeof folderId !== 'string') {
            error('❌ Lỗi: folderId không hợp lệ:', folderId);
            return {
              success: false,
              error: 'ID thư mục không hợp lệ'
            };
          }

          // Kiểm tra xem phương thức tồn tại không
          if (typeof storageManager.bulkMoveProxiesToFolder !== 'function') {
            error('❌ Lỗi: Phương thức bulkMoveProxiesToFolder không tồn tại trong storageManager');
            log('Các phương thức có sẵn:', Object.keys(storageManager));
            return {
              success: false,
              error: 'Phương thức không được hỗ trợ. Vui lòng cập nhật phiên bản app.'
            };
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
        } catch (error) {
          log('❌ Lỗi khi test proxies:', error);
          return {
            success: false,
            error: error.message
          };
        }
      },
      async exportProxies(format, proxyIds) {
        // Sửa lại để gọi qua storageManager
        try {
          log(`📤 Gọi exportProxies với format ${format}`);
          const result = await storageManager.exportProxies(format, proxyIds);
          return result;
        } catch (error) {
          log('❌ Lỗi khi export proxies:', error);
          return {
            success: false,
            error: error.message
          };
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
    log('Storage-based managers initialized successfully');
  } catch (err) {
    error('Error initializing managers:', err);

    // Ultimate fallback
    accountManager = {
      getAllAccounts: async () => [],
      addAccount: async () => ({
        success: true
      }),
      deleteAccount: async () => ({
        success: true
      })
    };
    proxyManager = {
      getAllProxies: async () => [],
      addProxy: async () => ({
        success: true
      }),
      deleteProxy: async () => ({
        success: true
      }),
      testProxy: async () => ({
        success: true,
        latency: '50ms'
      })
    };
    configManager = {
      getSettings: async () => ({
        theme: 'dark',
        language: 'vi'
      }),
      saveSettings: async () => ({
        success: true
      }),
      resetSettings: async () => ({
        success: true
      })
    };
  }
}
if (isProd) {
  serve({
    directory: 'app',
    scheme: 'app',
    hostname: 'localhost'
  });
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`);
}

// Cập nhật viewerManager để quản lý đúng số lượng viewers
let viewerManager = {
  isRunning: false,
  viewers: [],
  accounts: [],
  roomStats: new Map(),
  // Lưu stats cho từng room

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
      return {
        success: true,
        message: 'Viewer started successfully'
      };
    } catch (error) {
      log('Error starting viewer:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },
  async stop() {
    try {
      this.isRunning = false;
      this.viewers = [];
      this.accounts = [];
      this.roomStats.clear();
      log('TikTok viewer stopped');
      return {
        success: true,
        message: 'Viewer stopped successfully'
      };
    } catch (error) {
      log('Error stopping viewer:', error);
      return {
        success: false,
        message: error.message
      };
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
  const accountHandlerObj = accountHandlers(accountManager, storageManager);
  const proxyHandlerObj = proxyHandlers(proxyManager, storageManager);
  const roomHandlerObj = roomHandlers(storageManager, viewerManager);
  const bulkOpHandlerObj = bulkOperationHandlers(storageManager);
  const settingsHandlerObj = settingsHandlers(configManager);
  const folderHandlerObj = folderHandlers(storageManager);
  const utilityHandlerObj = utilityHandlers(storageManager, viewerManager);
  const taskHandlerObj = taskHandlers(storageManager);
  const notificationHandlerObj = notificationHandlers();

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
    ...notificationHandlerObj
  };

  // Register each handler with ipcMain
  Object.entries(allHandlers).forEach(([channel, handler]) => {
    ipcMain.handle(channel, handler);
  });
  log(`Registered ${Object.keys(allHandlers).length} IPC handlers`);
}
;
(async () => {
  await app.whenReady();

  // Initialize managers
  await initializeManagers();

  // Register all IPC handlers
  registerIPCHandlers();

  // Cập nhật tên ứng dụng theo ngôn ngữ
  updateAppName();
  setupAppNameLocalization();

  // Cài đặt About panel
  setupAboutPanel();
  setupAboutPanelLocalization();

  // Create and set up menu with localization support
  createMenu();
  setupMenuLocalization();
  const {
    width: screenWidth,
    height: screenHeight
  } = screen.getPrimaryDisplay().workAreaSize;
  const mainWindow = createWindow('main', {
    width: Math.floor(screenWidth * 0.9),
    // 90% chiều rộng màn hình
    height: Math.floor(screenHeight * 0.9),
    // 90% chiều cao màn hình
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
  });
  if (isProd) {
    await mainWindow.loadURL('app://./home');
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    mainWindow.webContents.openDevTools();
  }
})();
app.on('window-all-closed', () => {
  app.quit();
});

/***/ }),

/***/ "./main/businesses/Viewer.js":
/*!***********************************!*\
  !*** ./main/businesses/Viewer.js ***!
  \***********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


// const { exec } = require('child_process');
// const { promisify } = require('util');
// const fs = require('fs');
const path = __webpack_require__(/*! path */ "path");
const {
  delay,
  getString,
  getTime,
  getRandomInt,
  genheaderenter
} = __webpack_require__(/*! ./helper */ "./main/businesses/helper.js");
const axios = __webpack_require__(/*! axios */ "axios");
const https = __webpack_require__(/*! https */ "https");
const tunnel = __webpack_require__(/*! tunnel */ "tunnel"); // Thêm module tunnel
const querystring = __webpack_require__(/*! querystring */ "querystring");
const os = __webpack_require__(/*! os */ "os");
const request = __webpack_require__(/*! request */ "request"); // Thêm module request để lấy signature
const {
  log,
  error
} = __webpack_require__(/*! ../../lib/logger */ "./lib/logger.js");

// Tạo một instance của axios với các cài đặt mặc định
const axiosInstance = axios.create({
  timeout: 30000,
  httpsAgent: new https.Agent({
    keepAlive: false,
    rejectUnauthorized: false
  })
});

// Xác định OS và browser platform
let os_type = os.type();
let browser_platform = "";
let os_ver = "";
os_type = "Linux";
switch (os_type) {
  case "Linux":
    {
      os_ver = "X11; Ubuntu; Linux x86_64";
      browser_platform = encodeURIComponent("Linux x86_64");
      break;
    }
  case "Windows_NT":
    {
      os_ver = "Windows NT 10.0; Win64; x64";
      browser_platform = "Win32";
      break;
    }
  case "Darwin":
    {
      os_ver = "Macintosh; Intel Mac OS X 10_15_7";
      browser_platform = "MacIntel";
      break;
    }
  default:
    {
      os_ver = "X11; Ubuntu; Linux x86_64";
      browser_platform = encodeURIComponent("Linux x86_64");
    }
}
let userAgentDefault = `Mozilla/5.0 (${os_ver}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36`;
// userAgentDefault = `Mozilla/5.0 (X11; Ubuntu; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36`

const appVersionDefault = userAgentDefault.replace("Mozilla/", "");
log("userAgentDefault", userAgentDefault);
log("browser_platform", browser_platform);

// Dữ liệu chung
const data = {};
let data_local = {};
let list_403_total = [];
let list_die_total = [];
let is_running = true;
let intervalcheck;

// Class duy nhất cho cả viewer và logic clone
class GroupView {
  constructor({
    cookie_string,
    task_id,
    room_id,
    proxy,
    proxy_list,
    server_site
  } = {}) {
    if (cookie_string) {
      this.task_id = task_id;
      this.cookie_string = cookie_string;
      this.username = getString(cookie_string, 'username=', ';');
      this.session_id = getString(cookie_string, 'sessionid=', ';');
      this.room_id = room_id;
      this.proxy = proxy;
      this.proxy_list = proxy_list;
      this.failTime = 0;
      this.status = "running";
      this.browser_platform = browser_platform;
      let random_de = getRandomInt(187248723442, 934782374123);
      this.device_id = "7284943" + random_de;
      this.device_id = getString(cookie_string, ';wid=', ';');
      this.is_first = true;
      this.status_viewer = -1; // 3 - no login, 1 viewed, 2 - error, 4 - 403
      this.endpoint = "";
      this.imfetch_time = 0;
      this.delay_all_time = 5000;
      this.delay_10_time = 45000;
      this.delay = this.delay_all_time;
      this.url = "";
      this.is_10_time = true;
      this.server_site = server_site || "tt2";
    }
  }

  // =========== PHƯƠNG THỨC QUẢN LÝ TRẠNG THÁI CLONE ===========
  async run() {
    this.status = "running";
    // console.log("run",this.username)
    // return true;
    let is_join = await this.runJoin();
    if (is_join) {
      this.status = "running";
      this.runFetchs();
      return true;
    } else {
      this.status = "end";
      return false;
    }
  }
  async cancel() {
    this.status = "end";
  }
  async pause() {
    this.status = "pause";
  }
  async resume() {
    this.status = "running";
  }
  sign(options) {
    let {
      url,
      bodyEncoded,
      msToken,
      bodyJson
    } = options;
    const SERVER_URL = 'http://sign.amazingcpanel.com';
    return new Promise((resolve, reject) => {
      // Chuẩn bị dữ liệu request
      const requestData = {
        url: url,
        bodyEncoded: bodyEncoded,
        msToken: msToken,
        bodyJson
      };

      // Gửi request để lấy signature
      request({
        method: 'POST',
        url: `${SERVER_URL}/api/xbogus`,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      }, (error, response, body) => {
        if (error) {
          error("Lỗi khi lấy signature:", error);
          reject(error);
          return;
        }
        try {
          const data = JSON.parse(body);
          resolve(data);
        } catch (err) {
          error("Lỗi khi parse response:", err);
          reject(err);
        }
      });
    });
  }
  async runJoin() {
    // Bỏ đoạn test proxy
    // while(true){
    //     let options = {
    //         url: "https://jsonip.com/",
    //         method: 'GET',
    //         headers: {
    //             "User-Agent": userAgentDefault,
    //             "Accept": "application/json, text/plain, */*",
    //             "Accept-Language": "en-US,en;q=0.9",
    //         },
    //         responseType: 'json',
    //         isRetry: true,
    //         retryTime: 2
    //     };

    //     let data_ip = await this.makeRequest(options);
    //     await delay(this.delay_all_time);
    // }
    // console.log("data ip:", data_ip.bodyJson || data_ip.body);

    // await delay(10000000);
    // return false;
    // process.exit(1)
    // Sử dụng phương thức nội bộ thay vì gọi từ helper
    let cookie_status = await this.checkCookieLive();

    // if(!cookie_status.status || !cookie_status.live) {
    if (cookie_status.status && !cookie_status.live) {
      log(getTime(), this.username, `Cookie die`);
      this.status_viewer = 3;
      return false;
    }

    // Lưu thông tin user nếu có
    if (cookie_status.userId) {
      this.userId = cookie_status.userId;
      this.secUid = cookie_status.secUid;
    }
    let res1 = await this.callApi({
      type: "enter"
    });
    let is_good = false;
    if (res1 && res1.body && res1.body.includes('user_side_title')) {
      is_good = true;
    }
    if ([-1, 1].includes(this.status_viewer) && is_good) {
      return true;
    } else {
      log(getTime(), this.username, "enter", this.status_viewer, is_good);
      return false;
    }
  }

  // Thêm phương thức checkCookieLive nội bộ
  async checkCookieLive({
    username,
    cookie_string,
    proxy,
    proxy_list
  } = {}) {
    // Use instance variables instead of parameters
    username = username || this.username;
    cookie_string = cookie_string || this.cookie_string;
    proxy = proxy || this.proxy;
    proxy_list = proxy_list || this.proxy_list;

    // Lưu protocol của request hiện tại
    this.lastRequestProtocol = 'https:';

    // Sử dụng makeRequest để tận dụng các cấu hình proxy đã có
    var options = {
      url: `https://www.tiktok.com/passport/web/account/info/?aid=1459&app_language=en&app_name=tiktok_web&browser_platform=MacIntel&device_platform=web_pc&region=VN&tz_name=Asia%2FSaigon&webcast_language=en`,
      method: 'GET',
      headers: {
        "User-Agent": userAgentDefault,
        "cookie": cookie_string,
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive",
        "Referer": "https://www.tiktok.com/live",
        "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not?A_Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"'
      },
      responseType: 'json',
      timeout: 15000,
      isRetry: true,
      retryTime: 2
    };
    try {
      // Sử dụng makeRequest thay vì axios trực tiếp
      const response = await this.makeRequest(options);

      // Phân tích kết quả
      if (response.bodyJson && response.bodyJson.data && response.bodyJson.data.user_id) {
        return {
          status: true,
          live: true,
          username: response.bodyJson.data.username,
          userId: response.bodyJson.data.user_id,
          secUid: response.bodyJson.data.sec_user_id
        };
      } else if (response.body.includes("session_expired")) {
        return {
          status: true,
          live: false
        };
      } else {
        // 
        return {
          status: false,
          live: true
        };
      }
    } catch (error) {
      log(`Check cookie error for ${username}:`, error.message);
      return {
        status: false,
        live: true,
        error: error.message
      };
    }
  }
  async runFetchs() {
    let is_run = true;
    this.setCursor = true;
    while (is_run) {
      if (this.status == "running") {
        let r_enter = await this.fetch();
        if (r_enter.is_403) {
          is_run = false;
          this.status_viewer = 4;
        }
        await delay(this.delay);
        this.imfetch_time++;
      } else if (this.status == "pause") {
        await delay(1000);
      } else if (this.status == "resume") {
        this.status = "running";
        await delay(1000);
      } else if (this.status == "end") {
        is_run = false;
      }
    }
  }

  // =========== PHƯƠNG THỨC XỬ LÝ API ===========
  async callApi({
    type
  }) {
    let {
      cookie_string,
      room_id,
      msToken: cmsToken,
      session_id: csession_id,
      timeout,
      device_id
    } = this;
    timeout = timeout || 30000;
    var msToken = cmsToken || getString(cookie_string + ';', 'msToken=', ';');
    let session_id = csession_id || getString(cookie_string.replace(/ /g, '') + ';', 'sessionid=', ';');
    this.tt_csrf_token = getString(cookie_string.replace(/ /g, '') + ';', 'tt_csrf_token=', ';');
    this.s_v_web_id = getString(cookie_string.replace(/ /g, '') + ';', 's_v_web_id=', ';');
    this.session_id = session_id;
    let device_type = "web_h265";
    // let screen_height = 982;
    // let screen_width = 1512;
    let screen_height = 1107;
    let screen_width = 1710;
    try {
      if (session_id == "") {
        throw new Error("Cookie no session id");
      }
      let url = "";
      let verifyFp = getString(cookie_string.replace(/ /g, '') + ';', 's_v_web_id=', ';');
      let _bodyJson = null;
      switch (type) {
        case "leave":
          url = `https://webcast.tiktok.com/webcast/room/leave/?aid=1988&app_language=en&app_name=tiktok_web&browser_language=en-US&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=${this.encodeRFC3986URIComponent(appVersionDefault)}&channel=tiktok_web&cookie_enabled=true&device_id=${device_id}&device_platform=web_pc&device_type=web_h264&focus_state=true&from_page=user&history_len=4&is_fullscreen=false&is_page_visible=true&os=mac&priority_region=&referer=&region=VN&screen_height=900&screen_width=1440&tz_name=Asia%2FSaigon&webcast_language=en&msToken=${msToken}`;
          _bodyJson = {
            reason: 0,
            room_id: room_id
          };
          break;
        case "enter":
          url = `https://webcast.tiktok.com/webcast/room/enter/?aid=1988&app_language=vi-VN&app_name=tiktok_web&browser_language=vi&browser_name=Mozilla&browser_online=true&browser_platform=${browser_platform}&browser_version=${this.encodeRFC3986URIComponent(appVersionDefault)}&channel=tiktok_web&cookie_enabled=true&data_collection_enabled=true&device_id=${device_id}&device_platform=web_pc&device_type=${device_type}&focus_state=true&from_page=&history_len=0&is_fullscreen=false&is_page_visible=true&os=mac&priority_region=&referer=&region=VN&screen_height=${screen_height}&screen_width=${screen_width}&tz_name=Asia%2FBangkok&user_is_login=true&verifyFp=${verifyFp}&webcast_language=vi-VN`;
          _bodyJson = {
            enter_source: "others-others",
            room_id: room_id
          };
          break;
        case "name":
          url = `https://www.tiktok.com/api/update/profile/?WebIdLastTime=&aid=1988&app_language=vi-VN&app_name=tiktok_web&browser_language=vi&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=${this.encodeRFC3986URIComponent(appVersionDefault)}&channel=tiktok_web&cookie_enabled=true&data_collection_enabled=true&device_id=${device_id}&device_platform=web_pc&focus_state=true&from_page=user&history_len=3&is_fullscreen=false&is_page_visible=true&odinId=${this.userId}&os=mac&priority_region=&referer=&region=VN&screen_height=982&screen_width=1512&tz_name=Asia%2FSaigon&user_is_login=true&verifyFp=${this.s_v_web_id}&webcast_language=vi-VN&msToken=${msToken}`;
          _bodyJson = {
            'nickname': this.name,
            'tt_csrf_token': this.tt_csrf_token
          };
          break;
      }
      let bodyEncoded = querystring.stringify(_bodyJson);
      let {
        targetUrl
      } = await this.sign({
        url,
        bodyEncoded: bodyEncoded,
        msToken
      });
      let is_retry = false;
      if (is_retry) {
        await delay(500);
        return await this.callApi({
          type
        });
      }
      let target_url = targetUrl;
      let s_sdk_crypt_sdk = getString(cookie_string, 'crypt_sdk_b64=', ';');
      let s_sdk_sign_data_key = getString(cookie_string, 'sign_data_key_b64=', ';');
      let data_gen = genheaderenter({
        s_sdk_crypt_sdk,
        s_sdk_sign_data_key,
        path: '/webcast/room/enter/'
      });
      if (!data_gen || !data_gen["tt-ticket-guard-client-data"] || !data_gen["tt-ticket-guard-public-key"]) {
        throw new Error("No data gen");
      }
      var options = {
        url: target_url,
        method: 'POST',
        headers: {
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Connection': 'keep-alive',
          'Cookie': cookie_string,
          'Origin': 'https://www.tiktok.com',
          'Referer': 'https://www.tiktok.com',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'User-Agent': userAgentDefault,
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not?A_Brand";v="24"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
          'x-secsdk-csrf-token': 'DOWNGRADE',
          'tt-ticket-guard-client-data': data_gen["tt-ticket-guard-client-data"],
          'tt-ticket-guard-iteration-version': 0,
          'tt-ticket-guard-public-key': data_gen["tt-ticket-guard-public-key"],
          'tt-ticket-guard-version': 2,
          'tt-ticket-guard-web-version': 1
        },
        data: bodyEncoded,
        timeout: timeout,
        responseType: 'arraybuffer'
      };
      let data_page = await this.makeRequest(options);
      if (data_page.status == 403) {
        throw new Error("Request failed with status code 403");
      }
      if (data_page.error && data_page.error != "Request timeout") {
        log(data_page.error);
      }
      if (data_page.body) {
        let code = data_page.bodyJson.status_code;
        let message = (data_page.bodyJson || {}).data && (data_page.bodyJson || {}).data.message;
        let result = {
          is_403: false,
          is_dead: message === "User doesn't login" || code === 20003 ? true : false,
          body: data_page.body
        };
        return result;
      }
      let result = {
        is_403: false,
        data: data_page.body,
        body: data_page.body
      };
      return result;
    } catch (error) {
      log("error call api", this.session_id, error.message);
      let result = {
        is_403: error.message.includes("status code 403") ? true : false,
        error: error.message
      };
      return result;
    }
  }

  // Cấu hình proxy cho Axios với tunnel agents
  configureProxy(proxy) {
    if (!proxy) return undefined;
    try {
      // Parse proxy string nếu cần
      let parsedProxy = this.parseProxyString(proxy);
      if (!parsedProxy || !parsedProxy.host || !parsedProxy.port) {
        log("Invalid proxy format:", proxy);
        return undefined;
      }
      const {
        protocol,
        host,
        port,
        username,
        password
      } = parsedProxy;
      const auth = username && password ? `${username}:${password}` : '';

      // Trả về cấu hình proxy phù hợp với axios
      return {
        host,
        port: parseInt(port),
        protocol: `${protocol || "http"}:`,
        auth: auth ? {
          username: username,
          password: password
        } : undefined
      };
    } catch (error) {
      log("Error configuring proxy:", error.message);
      return undefined;
    }
  }

  // Parse proxy string helper
  parseProxyString(proxyStr) {
    if (!proxyStr) return null;

    // Nếu đã là object proxy, trả về luôn
    if (typeof proxyStr === 'object' && proxyStr.host) {
      return proxyStr;
    }
    try {
      // Xử lý trường hợp proxy đã là URL hoàn chỉnh
      if (proxyStr.includes("https://") || proxyStr.includes("http://")) {
        const proxyUrl = new URL(proxyStr);
        return {
          protocol: proxyUrl.protocol.replace(':', ''),
          host: proxyUrl.hostname,
          port: proxyUrl.port,
          username: proxyUrl.username,
          password: proxyUrl.password
        };
      }

      // Xử lý định dạng host:port hoặc host:port:user:pass
      const parts = proxyStr.split(':');
      if (parts.length >= 2) {
        return {
          host: parts[0],
          port: parts[1],
          username: parts.length > 2 ? parts[2] : undefined,
          password: parts.length > 3 ? parts[3] : undefined,
          protocol: 'http'
        };
      }
      return null;
    } catch (error) {
      log("Error parsing proxy string:", error.message);
      return null;
    }
  }

  // Tạo tunnel agent dựa vào protocol (http/https)
  createTunnelAgent(proxy, isHttps = true) {
    if (!proxy) return undefined;
    try {
      // Parse proxy string
      let parsedProxy = this.parseProxyString(proxy);
      if (!parsedProxy) {
        log("Invalid proxy format:", proxy);
        return undefined;
      }
      const {
        host,
        port,
        username,
        password
      } = parsedProxy;

      // Cấu hình tunnel options
      const tunnelOptions = {
        proxy: {
          host: host,
          port: parseInt(port),
          proxyAuth: username && password ? `${username}:${password}` : undefined
        },
        rejectUnauthorized: false // Bỏ qua lỗi chứng chỉ SSL
      };
      tunnelOptions.keepAlive = false;

      // Trả về tunnel agent phù hợp
      if (isHttps) {
        return tunnel.httpsOverHttp(tunnelOptions);
      } else {
        return tunnel.httpOverHttp(tunnelOptions);
      }
    } catch (error) {
      log("Error creating tunnel agent:", error.message);
      return undefined;
    }
  }
  safeDestroyAgent(agent) {
    try {
      agent?.destroy?.();
    } catch (e) {
      log('Destroy agent error:', e.message);
    }
  }
  async makeRequest(options) {
    let that = this;
    let {
      url,
      headers,
      method,
      proxy,
      retryCount,
      data,
      timeout,
      retryTime,
      proxy_list,
      form,
      preCheckRetry,
      name,
      retryAfter,
      httpsAgent,
      httpAgent
    } = options;
    if ((url.includes('webcast.tiktok.com/webcast/im/fetch/') || url.includes('webcast.tiktok.com/webcast/room/enter/') || url.includes('webcast.tiktok.com/webcast/room/leave/')) && !url.includes("X-Gnarly")) {
      return {
        error: "None sign" + that.proxy,
        body: "",
        headers: {},
        status: null
      };
    }
    method = method || "get";
    retryTime = retryTime || 2;
    retryAfter = retryAfter || 10000;
    let isGetBody = true;
    if (options.hasOwnProperty("isGetBody")) {
      isGetBody = options.isGetBody;
    }
    let isRetry = true;
    if (options.hasOwnProperty("isRetry")) {
      isRetry = options.isRetry;
    }
    let retry = retryCount || 0;
    try {
      // Xác định protocol của URL hiện tại (http hoặc https)
      const isHttps = url.startsWith("https");
      this.lastRequestProtocol = isHttps ? "https:" : "http:";

      // Quyết định sử dụng proxy dựa trên logic mới
      // Chỉ khi proxy là false rõ ràng thì mới không sử dụng proxy
      // Mặc định sẽ sử dụng this.proxy nếu không có proxy được truyền vào
      let proxyToUse = proxy;
      if (proxy !== false) {
        proxyToUse = proxy || this.proxy;
      }

      // Tạo custom agent dựa trên protocol nếu proxy tồn tại
      let customHttpsAgent = httpsAgent;
      let customHttpAgent = httpAgent;
      if (proxyToUse && !customHttpsAgent && !customHttpAgent) {
        if (isHttps) {
          customHttpsAgent = this.createTunnelAgent(proxyToUse, true);
        } else {
          customHttpAgent = this.createTunnelAgent(proxyToUse, false);
        }
      }
      const axiosOptions = {
        url,
        method: method.toUpperCase(),
        headers,
        timeout: timeout || 30000,
        responseType: options.responseType || "arraybuffer"
      };

      // Ưu tiên sử dụng agent đã được tạo trước
      if (isHttps) {
        axiosOptions.httpsAgent = customHttpsAgent;
      } else {
        axiosOptions.httpAgent = customHttpAgent;
      }

      // Không sử dụng proxy config nếu đã có agent hoặc proxy là false
      if (!customHttpsAgent && !customHttpAgent && proxyToUse) {
        // Chỉ sử dụng proxy config khi không có agent
        axiosOptions.proxy = this.configureProxy(proxyToUse);
      }
      if (data) axiosOptions.data = data;

      // Sử dụng Promise.race để handle timeout tùy chỉnh
      const requestPromise = axios(axiosOptions);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Request timeout " + proxyToUse));
        }, timeout || 30000);
      });
      const response = await Promise.race([requestPromise, timeoutPromise]);

      // Xử lý response
      let responseBody = "";
      let bodyBinary = null;
      if (response.data) {
        bodyBinary = response.data;
        if (Buffer.isBuffer(response.data)) {
          responseBody = response.data.toString("utf8");
        } else if (typeof response.data === "object") {
          responseBody = JSON.stringify(response.data);
        } else {
          responseBody = String(response.data);
        }
      }

      // Kiểm tra và cập nhật status_viewer dựa trên response
      if (!responseBody) {
        that.status_viewer = 6;
      }
      if (response.status === 403) {
        that.status_viewer = 4;
      } else if (url.includes("webcast/room/enter")) {
        if (responseBody && responseBody.includes('"status_code":20003')) {
          that.status_viewer = 3; // logout
        } else if (responseBody && responseBody.includes('"status_code":4003182')) {
          that.status_viewer = 2;
        } else if (responseBody && responseBody.includes("AnchorABMap")) {
          that.status_viewer = 1; // good
        } else if (responseBody && responseBody.includes('"status_code":30003')) {
          that.status_viewer = 5; // finish
        }
      }

      // Chuẩn bị kết quả trả về
      const head = {
        error: null,
        body: responseBody,
        bodyBinary: bodyBinary,
        headers: response.headers,
        status: response.status
      };

      // Kiểm tra nếu cần retry theo preCheckRetry
      let isRetryPreCheck = false;
      if (typeof preCheckRetry === "function") {
        try {
          isRetryPreCheck = await preCheckRetry(head.body || "", head);
        } catch (e) {
          log("err pre", e);
        }
      }

      // Parse JSON body nếu có thể
      let bodyJson = {};
      try {
        bodyJson = JSON.parse(head.body);
      } catch (e) {}
      head.bodyJson = bodyJson;

      // Xử lý retry nếu cần
      if (isRetryPreCheck ||