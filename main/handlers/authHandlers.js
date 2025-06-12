const { log, error } = require('../../lib/logger');

/**
 * Auth Handlers - Xử lý các IPC calls liên quan đến authentication và license
 */
const authHandlers = (authManager, storageManager) => {
  return {
    // =================
    // AUTH OPERATIONS
    // =================

    /**
     * Đăng ký tài khoản mới
     */
    'auth-register': async (event, userData) => {
      try {
        log('🔐 IPC: auth-register called');
        
        // Validate input
        if (!userData.username || !userData.password || !userData.email || !userData.name) {
          return {
            success: false,
            error: 'Missing required fields'
          };
        }

        const result = await authManager.register(userData);
        return result;
      } catch (err) {
        error('❌ Error in auth-register handler:', err);
        return {
          success: false,
          error: err.message || 'Registration failed'
        };
      }
    },

    /**
     * Đăng nhập
     */
    'auth-login': async (event, credentials) => {
      try {
        log('🔐 IPC: auth-login called');
        
        // Validate input
        if (!credentials.username || !credentials.password) {
          return {
            success: false,
            error: 'Username and password are required'
          };
        }

        const result = await authManager.login(credentials);
        return result;
      } catch (err) {
        error('❌ Error in auth-login handler:', err);
        return {
          success: false,
          error: err.message || 'Login failed'
        };
      }
    },

    /**
     * Đăng xuất
     */
    'auth-logout': async (event) => {
      try {
        log('👋 IPC: auth-logout called');
        const result = await authManager.logout();
        return result;
      } catch (err) {
        error('❌ Error in auth-logout handler:', err);
        return {
          success: false,
          error: err.message || 'Logout failed'
        };
      }
    },

    /**
     * Kiểm tra trạng thái đăng nhập
     */
    'auth-check-status': async (event) => {
      try {
        log('📋 IPC: auth-check-status called');
        const result = await authManager.checkAuthStatus();
        return result;
      } catch (err) {
        error('❌ Error in auth-check-status handler:', err);
        return {
          authenticated: false,
          hasValidLicense: false,
          needLogin: true,
          error: err.message
        };
      }
    },

    /**
     * Lấy thông tin user hiện tại
     */
    'auth-get-current-user': async (event) => {
      try {
        log('👤 IPC: auth-get-current-user called');
        const user = await storageManager.getCurrentUser();
        return { success: true, user };
      } catch (err) {
        error('❌ Error in auth-get-current-user handler:', err);
        return {
          success: false,
          error: err.message || 'Failed to get current user'
        };
      }
    },

    /**
     * Refresh license từ API
     */
    'auth-refresh-license': async (event) => {
      try {
        log('🔄 IPC: auth-refresh-license called');
        await authManager.updateLicenseFromAPI();
        return { success: true };
      } catch (err) {
        error('❌ Error in auth-refresh-license handler:', err);
        return {
          success: false,
          error: err.message || 'Failed to refresh license'
        };
      }
    },

    // =================
    // LICENSE OPERATIONS
    // =================

    /**
     * Lấy thông tin license hiện tại
     */
    'license-get-info': async (event) => {
      try {
        log('📋 IPC: license-get-info called');
        const license = await storageManager.getLicenseInfo();
        return { success: true, license };
      } catch (err) {
        error('❌ Error in license-get-info handler:', err);
        return {
          success: false,
          error: err.message || 'Failed to get license info'
        };
      }
    },

    /**
     * Lấy giới hạn license
     */
    'license-get-limits': async (event) => {
      try {
        log('📊 IPC: license-get-limits called');
        const limits = await storageManager.getLicenseLimits();
        return { success: true, limits };
      } catch (err) {
        error('❌ Error in license-get-limits handler:', err);
        return {
          success: false,
          error: err.message || 'Failed to get license limits'
        };
      }
    },

    /**
     * Kiểm tra license có active không
     */
    'license-is-active': async (event) => {
      try {
        log('✅ IPC: license-is-active called');
        const isActive = await storageManager.isLicenseActive();
        return { success: true, isActive };
      } catch (err) {
        error('❌ Error in license-is-active handler:', err);
        return {
          success: false,
          isActive: false,
          error: err.message
        };
      }
    },



    /**
     * Kiểm tra giới hạn account trước import
     */
    'license-check-account-limit': async (event, newAccountCount) => {
      try {
        log(`📊 IPC: license-check-account-limit called for ${newAccountCount} accounts`);
        const result = await authManager.checkAccountImportLimit(newAccountCount);
        return { success: true, ...result };
      } catch (err) {
        error('❌ Error in license-check-account-limit handler:', err);
        return {
          success: false,
          allowed: false,
          error: err.message
        };
      }
    },

    /**
     * Kiểm tra giới hạn room trước start
     */
    'license-check-room-limit': async (event, newRoomCount = 1) => {
      try {
        log(`📊 IPC: license-check-room-limit called for ${newRoomCount} rooms`);
        const result = await authManager.checkRoomStartLimit(newRoomCount);
        return { success: true, ...result };
      } catch (err) {
        error('❌ Error in license-check-room-limit handler:', err);
        return {
          success: false,
          allowed: false,
          error: err.message
        };
      }
    },

    // =================
    // AUTH SUMMARY & STATS
    // =================

    /**
     * Lấy tổng quan auth và license
     */
    'auth-get-summary': async (event) => {
      try {
        log('📋 IPC: auth-get-summary called');
        const summary = await authManager.getAuthSummary();
        return { success: true, summary };
      } catch (err) {
        error('❌ Error in auth-get-summary handler:', err);
        return {
          success: false,
          error: err.message || 'Failed to get auth summary'
        };
      }
    },

    // =================
    // SETTINGS & CONFIG
    // =================

    /**
     * Test connection tới auth server
     */
    'auth-test-connection': async (event) => {
      try {
        log('🔗 IPC: auth-test-connection called');
        const result = await authManager.testConnection();
        return result;
      } catch (err) {
        error('❌ Error in auth-test-connection handler:', err);
        return {
          success: false,
          error: err.message || 'Connection test failed'
        };
      }
    },

    /**
     * Cập nhật Auth API URL
     */
    'auth-set-api-url': async (event, url) => {
      try {
        log(`🔧 IPC: auth-set-api-url called with URL: ${url}`);
        authManager.setAuthAPIURL(url);
        
        // Lưu vào settings
        await storageManager.saveSetting('authApiUrl', url);
        
        return { success: true };
      } catch (err) {
        error('❌ Error in auth-set-api-url handler:', err);
        return {
          success: false,
          error: err.message || 'Failed to set API URL'
        };
      }
    },

    /**
     * Lấy Auth API URL hiện tại
     */
    'auth-get-api-url': async (event) => {
      try {
        log('🔧 IPC: auth-get-api-url called');
        const url = authManager.authAPI.getBaseURL();
        return { success: true, url };
      } catch (err) {
        error('❌ Error in auth-get-api-url handler:', err);
        return {
          success: false,
          error: err.message || 'Failed to get API URL'
        };
      }
    }
  };
};

module.exports = authHandlers; 