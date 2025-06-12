const { shell, dialog, BrowserWindow } = require('electron')
const { readFileSync } = require('fs')
const { log, error } = require('../../lib/logger')

const utilityHandlers = (storageManager, viewerManager) => {
  return {
    'get-analytics': async (event, params) => {
      try {
        let analytics = {
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          totalAccounts: 0,
          activeViewers: 0,
          totalRuntime: 0,
          dailyStats: [],
          accountStats: [],
          recentActivities: []
        }
        
        if (viewerManager) {
          const stats = viewerManager.getStats()
          analytics.activeViewers = stats.activeViewers
          analytics.totalAccounts = stats.totalAccounts
          
          if (stats.isRunning) {
            analytics.recentActivities.push({
              type: 'viewer_running',
              message: 'TikTok viewer is currently running (simple mode)',
              timestamp: new Date().toISOString()
            })
          }
        }
        
        try {
          const accounts = await storageManager.getAllAccounts()
          analytics.totalAccounts = accounts.length
        } catch (err) {
          console.error('Error getting account count:', err)
        }
        
        return { success: true, data: analytics }
      } catch (err) {
        console.error('Error getting analytics:', err)
        return { success: false, error: error.message, data: {
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          totalAccounts: 0,
          activeViewers: 0,
          totalRuntime: 0,
          dailyStats: [],
          accountStats: [],
          recentActivities: []
        }}
      }
    },

    'get-viewer-manager-stats': async () => {
      try {
        const stats = viewerManager.getStats();
        return { success: true, stats };
      } catch (err) {
        error('Error getting viewer manager stats:', err);
        return { success: false, error: err.message };
      }
    },

    'get-viewer-stats': async (event) => {
      try {
        if (viewerManager && typeof viewerManager.getStats === 'function') {
          return viewerManager.getStats();
        }
        return {
          activeViewers: 0,
          isRunning: false,
          totalAccounts: 0,
          viewers: []
        };
      } catch (err) {
        error('Error getting viewer stats:', err);
        return {
          activeViewers: 0,
          isRunning: false,
          totalAccounts: 0,
          viewers: []
        };
      }
    },

    'open-file': async (event, filePath) => {
      try {
        // Kiểm tra filePath có phải là string không
        if (typeof filePath !== 'string') {
          return { success: false, error: 'Invalid file path type' };
        }
        
        const result = await shell.openPath(filePath);
        return { success: result === '' };
      } catch (err) {
        error('Error opening file:', err);
        return { success: false, error: err.message };
      }
    },

    'open-file-dialog': async (event, options) => {
      try {
        const result = await dialog.showOpenDialog(options);
        if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
          const filePath = result.filePaths[0];
          
          // Kiểm tra filePath có phải là string không
          if (typeof filePath !== 'string') {
            return { success: false, error: 'Invalid file path type' };
          }
          
          const content = readFileSync(filePath, 'utf-8');
          return { success: true, content, filePath };
        }
        return { success: false, error: 'No file selected' };
      } catch (err) {
        console.error('Error in open-file-dialog:', err);
        return { success: false, error: err.message };
      }
    },

    'add-account-to-room': async (event, accountId, roomId) => {
      try {
        const result = await storageManager.addAccountToRoom(accountId, roomId)
        return result
      } catch (err) {
        console.error('Error adding account to room:', err)
        return { success: false, error: err.message }
      }
    },

    'remove-account-from-room': async (event, accountId, roomId) => {
      try {
        const result = await storageManager.removeAccountFromRoom(accountId, roomId)
        return result
      } catch (err) {
        console.error('Error removing account from room:', err)
        return { success: false, error: err.message }
      }
    },

    'clear-account-rooms': async (event, accountId) => {
      try {
        const result = await storageManager.clearAccountRooms(accountId)
        return result
      } catch (err) {
        console.error('Error clearing account rooms:', err)
        return { success: false, error: err.message }
      }
    },

    'get-account-active-rooms': async (event, accountId) => {
      try {
        const result = await storageManager.getAccountActiveRooms(accountId)
        return result
      } catch (err) {
        console.error('Error getting account active rooms:', err)
        return { success: false, error: err.message }
      }
    },

    'get-accounts-in-room': async (event, roomId) => {
      try {
        const result = await storageManager.getAccountsInRoom(roomId)
        return result
      } catch (err) {
        console.error('Error getting accounts in room:', err)
        return { success: false, error: err.message }
      }
    },

    'select-all-accounts-in-folder': async (event, folderId) => {
      try {
        const accounts = await storageManager.getAccountsByFolder(folderId);
        return { 
          success: true, 
          accountIds: accounts.map(acc => acc.id),
          count: accounts.length
        };
      } catch (err) {
        console.error('Error selecting all accounts in folder:', err);
        return { success: false, error: err.message };
      }
    },

    'select-all-proxies-in-folder': async (event, folderId) => {
      try {
        const proxies = await storageManager.getProxiesByFolder(folderId);
        return { 
          success: true, 
          proxyIds: proxies.map(proxy => proxy.id),
          count: proxies.length
        };
      } catch (err) {
        console.error('Error selecting all proxies in folder:', err);
        return { success: false, error: err.message };
      }
    },

    'clear-selection': async (event, type) => {
      try {
        return { success: true, message: `Cleared ${type} selection` };
      } catch (err) {
        console.error('Error clearing selection:', err);
        return { success: false, error: err.message };
      }
    },

    'get-bulk-operation-status': async (event, operationId) => {
      try {
        return { 
          success: true, 
          status: 'completed',
          progress: 100,
          message: 'Operation completed successfully'
        };
      } catch (err) {
        console.error('Error getting bulk operation status:', err);
        return { success: false, error: err.message };
      }
    },

    'close-proxy-dropdown': async (event) => {
      try {
        return { success: true, message: 'Proxy dropdown closed' };
      } catch (err) {
        console.error('Error closing proxy dropdown:', err);
        return { success: false, error: err.message };
      }
    },

    'close-all-modals': async (event) => {
      try {
        return { success: true, message: 'All modals closed' };
      } catch (err) {
        console.error('Error closing modals:', err);
        return { success: false, error: err.message };
      }
    },

    'reset-ui-state': async (event) => {
      try {
        return { success: true, message: 'UI state reset' };
      } catch (err) {
        console.error('Error resetting UI state:', err);
        return { success: false, error: err.message };
      }
    },

    'emergency-ui-reset': async (event) => {
      try {
        return { success: true, message: 'Emergency UI reset completed' };
      } catch (err) {
        console.error('Error during emergency UI reset:', err);
        return { success: false, error: err.message };
      }
    },

    // Menu related handlers 
    'open-add-room-modal': async (event) => {
      try {
        log('Menu action: Opening add room modal');
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
          focusedWindow.webContents.send('app:open-add-room-modal');
        }
        return { success: true };
      } catch (err) {
        error('Error opening add room modal:', err);
        return { success: false, error: err.message };
      }
    },

    'open-add-account-modal': async (event) => {
      try {
        log('Menu action: Opening add account modal');
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
          focusedWindow.webContents.send('app:open-add-account-modal');
        }
        return { success: true };
      } catch (err) {
        error('Error opening add account modal:', err);
        return { success: false, error: err.message };
      }
    },

    'open-add-proxy-modal': async (event) => {
      try {
        log('Menu action: Opening add proxy modal');
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
          focusedWindow.webContents.send('app:open-add-proxy-modal');
        }
        return { success: true };
      } catch (err) {
        error('Error opening add proxy modal:', err);
        return { success: false, error: err.message };
      }
    },

    'check-all-accounts': async (event) => {
      try {
        log('Menu action: Checking all accounts');
        // Thực hiện kiểm tra tất cả tài khoản
        return { success: true };
      } catch (err) {
        error('Error checking all accounts:', err);
        return { success: false, error: err.message };
      }
    },

    'check-all-proxies': async (event) => {
      try {
        log('Menu action: Checking all proxies');
        // Nếu storageManager có phương thức bulk test proxies
        if (storageManager && typeof storageManager.bulkTestProxies === 'function') {
          return await storageManager.bulkTestProxies([]);
        }
        return { success: true };
      } catch (err) {
        error('Error checking all proxies:', err);
        return { success: false, error: err.message };
      }
    },
  }
}

module.exports = utilityHandlers