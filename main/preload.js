const { contextBridge, ipcRenderer } = require('electron')

// Helper function để ensure serialization
const ensureSerializable = (data) => {
  try {
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.error('❌ Serialization error:', error);
    return { success: false, error: 'Data serialization failed' };
  }
};

// Wrapper cho ipcRenderer.invoke để ensure serialization
const safeInvoke = async (channel, ...args) => {
  try {
    const result = await ipcRenderer.invoke(channel, ...args);
    return ensureSerializable(result);
  } catch (error) {
    console.error(`❌ IPC error for ${channel}:`, error);
    return { success: false, error: error.message };
  }
};

const handler = {
  send(channel, value) {
    ipcRenderer.send(channel, value)
  },
  on(channel, callback) {
    const subscription = (_event, ...args) => callback(...args)
    ipcRenderer.on(channel, subscription)

    return () => {
      ipcRenderer.removeListener(channel, subscription)
    }
  },
}

// TikTok Viewer API
const tiktokAPI = {
  // Account management
  getAccounts: () => safeInvoke('get-accounts'),
  addAccount: (account) => safeInvoke('add-account', account),
  deleteAccount: (accountId) => safeInvoke('delete-account', accountId),
  updateAccount: (accountId, data) => safeInvoke('update-account', accountId, data),
  setAccountProxy: (accountId, proxyId) => safeInvoke('set-account-proxy', accountId, proxyId),
  removeAccountProxy: (accountId) => safeInvoke('remove-account-proxy', accountId),
  setAccountStatus: (accountId, status) => safeInvoke('set-account-status', accountId, status),
  moveAccountToFolder: (accountId, folderId) => safeInvoke('move-account-to-folder', accountId, folderId),
  getAccountsByFolder: (folderId) => safeInvoke('get-accounts-by-folder', folderId),
  checkAccountActivity: (accountIds) => safeInvoke('check-account-activity', accountIds),
  bulkSetProxy: (accountIds, folderId, accountsPerProxy, selectedProxies) => safeInvoke('bulk-set-proxy', accountIds, folderId, accountsPerProxy, selectedProxies),
  setProxyForAccounts: (data) => safeInvoke('set-proxy-for-accounts', data),
  bulkSetStatus: (accountIds, status) => safeInvoke('bulk-set-status', accountIds, status),
  bulkRemoveProxy: (accountIds) => safeInvoke('bulk-remove-proxy', accountIds),
  bulkMoveToFolder: (accountIds, folderId) => safeInvoke('bulk-move-to-folder', accountIds, folderId),
  
  // Bulk delete operations - THÊM MỚI
  bulkDeleteAccounts: (accountIds) => safeInvoke('bulk-delete-accounts', accountIds),
  bulkDeleteProxies: (proxyIds) => safeInvoke('bulk-delete-proxies', proxyIds),
  
  // Bulk export operations - THÊM MỚI
  bulkExportAccounts: (accountIds, format) => safeInvoke('bulk-export-accounts', accountIds, format),
  bulkExportProxies: (proxyIds, format) => safeInvoke('bulk-export-proxies', proxyIds, format),
  
  // Selection management - THÊM MỚI
  selectAllAccountsInFolder: (folderId) => safeInvoke('select-all-accounts-in-folder', folderId),
  selectAllProxiesInFolder: (folderId) => safeInvoke('select-all-proxies-in-folder', folderId),
  clearSelection: (type) => safeInvoke('clear-selection', type),
  
  // Operation status tracking - THÊM MỚI
  getBulkOperationStatus: (operationId) => safeInvoke('get-bulk-operation-status', operationId),
  
  importAccounts: (folderId) => safeInvoke('import-accounts', folderId),
  importAccountsFromText: (text, folderId) => safeInvoke('import-accounts-from-text', text, folderId),
  importAccountsWithProxyFromText: (text, folderId) => safeInvoke('import-accounts-with-proxy-from-text', text, folderId),
  importAccountsFromFile: (filePath, folderId) => safeInvoke('import-accounts-from-file', filePath, folderId),
  exportAccountsToText: (format, accountIds, folderId) => safeInvoke('export-accounts-to-text', format, accountIds, folderId),
  openFileDialog: (options) => safeInvoke('open-file-dialog', options),
  
  // ActiveRooms management
  addAccountToRoom: (accountId, roomId) => safeInvoke('add-account-to-room', accountId, roomId),
  removeAccountFromRoom: (accountId, roomId) => safeInvoke('remove-account-from-room', accountId, roomId),
  clearAccountRooms: (accountId) => safeInvoke('clear-account-rooms', accountId),
  getAccountActiveRooms: (accountId) => safeInvoke('get-account-active-rooms', accountId),
  getAccountsInRoom: (roomId) => safeInvoke('get-accounts-in-room', roomId),
  
  // Enhanced filtering and sorting for accounts
  getAccountsWithFilter: (filterOptions, sortOptions) => safeInvoke('get-accounts-with-filter', filterOptions, sortOptions),
  filterAccounts: (filterOptions) => safeInvoke('filter-accounts', filterOptions),
  
  // Folder management
  getFolders: (type) => safeInvoke('get-folders', type),
  createFolder: (type, folderData) => safeInvoke('create-folder', type, folderData),
  addFolder: (type, folderData) => safeInvoke('create-folder', type, folderData),
  deleteFolder: (type, folderId) => safeInvoke('delete-folder', type, folderId),
  
  // Proxy management
  getProxies: () => safeInvoke('get-proxies'),
  addProxy: (proxy) => safeInvoke('add-proxy', proxy),
  deleteProxy: (proxyId) => safeInvoke('delete-proxy', proxyId),
  updateProxy: (proxyId, data) => safeInvoke('update-proxy', proxyId, data),
  testProxy: (proxyId) => safeInvoke('test-proxy', proxyId),
  bulkTestProxies: (proxyIds) => safeInvoke('bulk-test-proxies', proxyIds),
  exportProxies: (format, proxyIds) => safeInvoke('export-proxies', format, proxyIds),
  moveProxyToFolder: (proxyId, folderId) => safeInvoke('move-proxy-to-folder', proxyId, folderId),
  bulkMoveProxiesToFolder: (proxyIds, folderId) => safeInvoke('bulk-move-proxies-to-folder', proxyIds, folderId),
  importProxies: (folderId) => safeInvoke('import-proxies', folderId),
  importProxiesFromText: (text, folderId) => safeInvoke('import-proxies-from-text', text, folderId),
  getProxiesByFolder: (folderId) => safeInvoke('get-proxies-by-folder', folderId),
  
  // Enhanced filtering and sorting for proxies
  getProxiesWithFilter: (filterOptions, sortOptions) => safeInvoke('get-proxies-with-filter', filterOptions, sortOptions),
  filterProxies: (filterOptions) => safeInvoke('filter-proxies', filterOptions),
  
  // Room management
  getRooms: () => safeInvoke('get-rooms'),
  addRoom: (roomData) => safeInvoke('add-room', roomData),
  deleteRoom: (roomId) => safeInvoke('delete-room', roomId),
  stopRoom: (roomId) => safeInvoke('stop-room', roomId),
  updateRoom: (roomId, data) => safeInvoke('update-room', roomId, data),
  duplicateRoom: (roomId, newData) => safeInvoke('duplicate-room', roomId, newData),
  addRoomAndStartViewer: (roomData, accounts) => safeInvoke('add-room-and-start-viewer', roomData, accounts),
  
  // Real-time viewers management
  getRealTimeViewers: () => safeInvoke('get-real-time-viewers'),
  updateRoomViewers: (roomId, viewerCount) => safeInvoke('update-room-viewers', roomId, viewerCount),
  startRoomViewer: (config) => safeInvoke('startRoomViewer', config),
  
  // Room viewer history - THÊM MỚI
  getRoomViewerHistory: (roomId, days) => safeInvoke('get-room-viewer-history', roomId, days),
  
  // Enhanced filtering and sorting for rooms
  getRoomsWithFilter: (filterOptions, sortOptions) => safeInvoke('get-rooms-with-filter', filterOptions, sortOptions),
  filterRooms: (filterOptions) => safeInvoke('filter-rooms', filterOptions),
  
  // Viewer operations
  startViewer: (config) => safeInvoke('start-viewer', config),
  stopViewer: () => safeInvoke('stop-viewer'),
  
  // Analytics
  getAnalytics: (params) => safeInvoke('get-analytics', params),
  
  // Settings
  getSettings: () => safeInvoke('get-settings'),
  saveSettings: (settings) => safeInvoke('save-settings', settings),
  resetSettings: () => safeInvoke('reset-settings'),
  changeLanguage: (language) => safeInvoke('change-language', language),
  changeTheme: (theme) => safeInvoke('change-theme', theme),
  getAvailableLanguages: () => safeInvoke('get-available-languages'),
  getAvailableThemes: () => safeInvoke('get-available-themes'),
  
  // Clear all account rooms
  clearAllAccountRooms: () => safeInvoke('clear-all-account-rooms'),
  
  // Emergency UI handlers để fix proxy dropdown overflow
  closeProxyDropdown: () => safeInvoke('close-proxy-dropdown'),
  closeAllModals: () => safeInvoke('close-all-modals'),
  resetUIState: () => safeInvoke('reset-ui-state'),
  emergencyUIReset: () => safeInvoke('emergency-ui-reset'),
  forceRefreshData: (dataType) => safeInvoke('force-refresh-data', dataType),
  clearUICache: () => safeInvoke('clear-ui-cache'),
  
  // Enhanced proxy assignment handlers
  getAccountProxyDetails: (accountId) => safeInvoke('get-account-proxy-details', accountId),
  validateProxyAssignment: (accountIds, proxyId) => safeInvoke('validate-proxy-assignment', accountIds, proxyId),

  // Auth APIs
  authLogin: (credentials) => safeInvoke('auth-login', credentials),
  authRegister: (userData) => safeInvoke('auth-register', userData),
  authLogout: () => safeInvoke('auth-logout'),
  authCheckStatus: () => safeInvoke('auth-check-status'),
  authGetCurrentUser: () => safeInvoke('auth-get-current-user'),
  authRefreshLicense: () => safeInvoke('auth-refresh-license'),
  authTestConnection: () => safeInvoke('auth-test-connection'),
  authSetApiUrl: (url) => safeInvoke('auth-set-api-url', url),
  authGetApiUrl: () => safeInvoke('auth-get-api-url'),
  authGetSummary: () => safeInvoke('auth-get-summary'),

  // License APIs
  licenseGetInfo: () => safeInvoke('license-get-info'),
  licenseGetLimits: () => safeInvoke('license-get-limits'),
  licenseIsActive: () => safeInvoke('license-is-active'),
  licenseCheckAccountLimit: (newAccountCount) => safeInvoke('license-check-account-limit', newAccountCount),
  licenseCheckRoomLimit: (newRoomCount) => safeInvoke('license-check-room-limit', newRoomCount),

  // Device Info API
  getDeviceInfo: () => safeInvoke('get-device-info'),

  // Task APIs
  getAllTasks: () => safeInvoke('get-all-tasks'),
  addTask: (taskData) => safeInvoke('add-task', taskData),
  updateTask: (taskId, updates) => safeInvoke('update-task', taskId, updates),
  deleteTask: (taskId) => safeInvoke('delete-task', taskId),
  startTask: (taskId) => safeInvoke('start-task', taskId),
  stopTask: (taskId) => safeInvoke('stop-task', taskId),
  runTaskNow: (taskId) => safeInvoke('run-task-now', taskId),
  getAvailableHandlers: () => safeInvoke('get-available-handlers'),

  // Notification APIs
  toggleNotifications: async (enabled) => {
    return await safeInvoke('toggle-notifications', enabled);
  },
  toggleNotificationSound: async (enabled) => {
    return await safeInvoke('toggle-notification-sound', enabled);
  },
  getNotificationSettings: async () => {
    return await safeInvoke('get-notification-settings');
  },
  getNotificationHistory: async () => {
    return await safeInvoke('get-notification-history');
  },
  sendTestNotification: async () => {
    return await safeInvoke('send-test-notification');
  },

  // Thêm các helper functions để menu có thể gọi
  openAddRoomModal: () => safeInvoke('open-add-room-modal'),
  openAddAccountModal: () => safeInvoke('open-add-account-modal'),
  openAddProxyModal: () => safeInvoke('open-add-proxy-modal'),
  checkAllAccounts: () => safeInvoke('check-all-accounts'),
  checkAllProxies: () => safeInvoke('check-all-proxies'),

  // Update System APIs
  updateInit: () => safeInvoke('update-init'),
  updateCheck: () => safeInvoke('update-check'),
  updateGetStatus: () => safeInvoke('update-get-status'),
  updateGetState: () => safeInvoke('update-get-state'),
  hasActiveUpdate: () => safeInvoke('update-has-active'),
  dismissUpdate: () => safeInvoke('update-dismiss'),
  updateDownloadInstall: (downloadUrl) => safeInvoke('update-download-install', downloadUrl),
  updateCancelDownload: () => safeInvoke('update-cancel-download'),
  updateSetAutoCheck: (enabled, intervalMinutes) => safeInvoke('update-set-auto-check', enabled, intervalMinutes),
  updateGetSettings: () => safeInvoke('update-get-settings'),
  updateCheckSilent: () => safeInvoke('update-check-silent'),
  updateRestartApp: () => safeInvoke('update-restart-app'),
  updateCheckVersion: (targetVersion) => safeInvoke('update-check-version', targetVersion),
  updateGetRepoInfo: () => safeInvoke('update-get-repo-info'),

  // Update APIs (legacy compatibility)
  checkForUpdates: () => safeInvoke('update-check'),
  getUpdateStatus: () => safeInvoke('update-get-status'),
  getUpdateState: () => safeInvoke('update-get-state'),
  downloadAndInstall: (downloadUrl) => safeInvoke('update-download-install', downloadUrl),
  downloadAndInstallUpdate: (updateInfo) => safeInvoke('update-download-install', updateInfo),
  updateUpdateSettings: (settings) => safeInvoke('update-settings', settings),
  restartApp: () => safeInvoke('update-restart-app'),
  skipUpdateVersion: (version) => safeInvoke('update-skip-version', version),

  // Update event listeners
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', callback);
    return () => ipcRenderer.removeListener('update-available', callback);
  },
  
  onUpdateNotAvailable: (callback) => {
    ipcRenderer.on('update-not-available', callback);
    return () => ipcRenderer.removeListener('update-not-available', callback);
  },
  
  onUpdateError: (callback) => {
    ipcRenderer.on('update-error', callback);
    return () => ipcRenderer.removeListener('update-error', callback);
  },
  
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', callback);
    return () => ipcRenderer.removeListener('download-progress', callback);
  },
  
  onDownloadCompleted: (callback) => {
    ipcRenderer.on('download-completed', callback);
    return () => ipcRenderer.removeListener('download-completed', callback);
  },
  
  onInstallCompleted: (callback) => {
    ipcRenderer.on('install-completed', callback);
    return () => ipcRenderer.removeListener('install-completed', callback);
  },

  removeUpdateListeners: () => {
    ipcRenderer.removeAllListeners('update-available');
    ipcRenderer.removeAllListeners('update-not-available');
    ipcRenderer.removeAllListeners('update-error');
    ipcRenderer.removeAllListeners('download-progress');
    ipcRenderer.removeAllListeners('download-completed');
    ipcRenderer.removeAllListeners('install-completed');
  },
}

// Electron API for file operations
const electronAPI = {
  openFile: (options) => ipcRenderer.invoke('open-file', options),
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  send: (channel, ...args) => ipcRenderer.send(channel, ...args),
  on: (channel, callback) => {
    const subscription = (event, ...args) => {
      // console.log(`[Preload] IPC Event received: ${channel}`, { event, args });
      callback(...args);
    }
    ipcRenderer.on(channel, subscription)
    return () => {
      ipcRenderer.removeListener(channel, subscription)
    }
  },
  // Special handlers for window functions from menu
  // Thêm xử lý trực tiếp cho các sự kiện từ menu
  handleMenuActions() {
    // Xử lý sự kiện mở modal phòng mới
    ipcRenderer.on('app:open-add-room-modal', () => {
      console.log('[Preload] Received open-add-room-modal event');
      if (typeof window.openAddRoomModal === 'function') {
        window.openAddRoomModal();
      } else {
        window.location.href = '/rooms?action=add';
      }
    });

    // Xử lý sự kiện mở modal tài khoản mới
    ipcRenderer.on('app:open-add-account-modal', () => {
      console.log('[Preload] Received open-add-account-modal event');
      if (typeof window.openAddAccountModal === 'function') {
        window.openAddAccountModal();
      } else {
        window.location.href = '/accounts?action=add';
      }
    });

    // Xử lý sự kiện mở modal nhập tài khoản từ text
    ipcRenderer.on('app:open-add-account-text-modal', () => {
      console.log('[Preload] Received open-add-account-text-modal event');
      
      // Lưu state trong localStorage để đảm bảo nó vẫn tồn tại sau khi điều hướng
      localStorage.setItem('OPEN_ACCOUNT_IMPORT_TEXT_MODAL', 'true');
      
      // Kiểm tra xem có phải ở trang accounts không
      const currentPath = window.location.pathname;
      if (currentPath === '/accounts') {
        // Đã ở trang accounts, gọi hàm trực tiếp nếu có
        if (typeof window.openAddAccountTextModal === 'function') {
          window.openAddAccountTextModal();
        } else {
          // Tạo và kích hoạt sự kiện để page hiện tại bắt được
          const event = new CustomEvent('renderer:open-account-import-text');
          window.dispatchEvent(event);
          // Nếu không có xử lý sự kiện, tải lại trang với tham số
          setTimeout(() => {
            window.location.href = '/accounts?action=import-text';
          }, 200);
        }
      } else {
        // Chưa ở trang accounts, chuyển hướng
        window.location.href = '/accounts?action=import-text';
      }
    });

    // Xử lý sự kiện mở modal proxy mới
    ipcRenderer.on('app:open-add-proxy-modal', () => {
      console.log('[Preload] Received open-add-proxy-modal event');
      if (typeof window.openAddProxyModal === 'function') {
        window.openAddProxyModal();
      } else {
        window.location.href = '/proxies?action=add';
      }
    });

    // Xử lý sự kiện mở modal nhập proxy từ text
    ipcRenderer.on('app:open-add-proxy-text-modal', () => {
      console.log('[Preload] Received open-add-proxy-text-modal event');
      
      // Lưu state trong localStorage để đảm bảo nó vẫn tồn tại sau khi điều hướng
      localStorage.setItem('OPEN_PROXY_IMPORT_TEXT_MODAL', 'true');
      
      // Kiểm tra xem có phải ở trang proxies không
      const currentPath = window.location.pathname;
      if (currentPath === '/proxies') {
        // Đã ở trang proxies, gọi hàm trực tiếp nếu có
        if (typeof window.openAddProxyTextModal === 'function') {
          window.openAddProxyTextModal();
        } else {
          // Tạo và kích hoạt sự kiện để page hiện tại bắt được
          const event = new CustomEvent('renderer:open-proxy-import-text');
          window.dispatchEvent(event);
          // Nếu không có xử lý sự kiện, tải lại trang với tham số
          setTimeout(() => {
            window.location.href = '/proxies?action=import-text';
          }, 200);
        }
      } else {
        // Chưa ở trang proxies, chuyển hướng
        window.location.href = '/proxies?action=import-text';
      }
    });
  }
};


contextBridge.exposeInMainWorld('ipc', handler)
contextBridge.exposeInMainWorld('tiktokAPI', tiktokAPI)
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// Khởi động handler cho menu
electronAPI.handleMenuActions();
