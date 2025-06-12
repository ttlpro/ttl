/**
 * Update handlers cho IPC communication
 */

const UpdateManager = require('../../lib/update-manager');

let updateManager = null;

// Function để init UpdateManager với database
const initUpdateManager = () => {
  if (!updateManager) {
    // Lấy database từ global hoặc initialize với null
    const database = global.database || null;
    console.log('🔍 UpdateHandlers: initUpdateManager called');
    console.log('🔍 global.database exists:', !!global.database);
    console.log('🔍 database type:', database ? typeof database : 'null');
    
    updateManager = new UpdateManager(database);
    console.log('🔄 UpdateManager initialized via IPC with database support');
    console.log('🔍 UpdateManager.updateStateStorage exists:', !!updateManager.updateStateStorage);
  }
  return updateManager;
};

const updateHandlers = {
  // Khởi tạo UpdateManager
  'update-init': async (event) => {
    try {
      initUpdateManager();
      return { success: true, message: 'UpdateManager initialized' };
    } catch (error) {
      console.error('❌ Error initializing UpdateManager:', error);
      return { success: false, error: error.message };
    }
  },

  // Kiểm tra update
  'update-check': async (event) => {
    try {
      const manager = initUpdateManager();
      
      console.log('🔍 Manual update check triggered');
      const result = await manager.checkForUpdates(false); // not silent
      
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Error checking for updates:', error);
      return { success: false, error: error.message };
    }
  },

  // Lấy trạng thái update
  'update-get-status': async (event) => {
    try {
      const manager = initUpdateManager();
      
      const status = manager.getStatus();
      // Ensure completely serializable response
      return { 
        success: true, 
        data: JSON.parse(JSON.stringify(status))
      };
    } catch (error) {
      console.error('❌ Error getting update status:', error);
      return { success: false, error: error.message };
    }
  },

  // Lấy update state từ database
  'update-get-state': async (event) => {
    try {
      const manager = initUpdateManager();
      
      // console.log('🔍 update-get-state: manager.updateStateStorage exists:', !!manager.updateStateStorage);
      const state = await manager.getUpdateState();
      // console.log('🔍 update-get-state: result:', state);
      return { 
        success: true, 
        data: state ? JSON.parse(JSON.stringify(state)) : null
      };
    } catch (error) {
      console.error('❌ Error getting update state:', error);
      return { success: false, error: error.message };
    }
  },

  // Kiểm tra có active update không
  'update-has-active': async (event) => {
    try {
      const manager = initUpdateManager();
      
      console.log('🔍 update-has-active: manager.updateStateStorage exists:', !!manager.updateStateStorage);
      const hasActive = await manager.hasActiveUpdate();
      console.log('🔍 update-has-active: result:', hasActive);
      return { 
        success: true, 
        data: hasActive
      };
    } catch (error) {
      console.error('❌ Error checking active update:', error);
      return { success: false, error: error.message };
    }
  },

  // Dismiss update
  'update-dismiss': async (event) => {
    try {
      const manager = initUpdateManager();
      
      console.log('🔍 update-dismiss: manager.updateStateStorage exists:', !!manager.updateStateStorage);
      const result = await manager.dismissUpdate();
      console.log('🔍 update-dismiss: result:', result);
      return { 
        success: true, 
        data: result
      };
    } catch (error) {
      console.error('❌ Error dismissing update:', error);
      return { success: false, error: error.message };
    }
  },

  // Download và install update
  'update-download-install': async (event, downloadUrl) => {
    try {
      const manager = initUpdateManager();

      if (!downloadUrl) {
        throw new Error('Download URL is required');
      }

      console.log('📥 Starting download and install process');
      
      // Progress callback để gửi updates về renderer
      const progressCallback = (progress) => {
        event.sender.send('update-download-progress', progress);
      };

      const result = await manager.downloadAndInstall(downloadUrl, progressCallback);
      
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Error downloading/installing update:', error);
      return { success: false, error: error.message };
    }
  },

  // Hủy download
  'update-cancel-download': async (event) => {
    try {
      const manager = initUpdateManager();

      manager.cancelDownload();
      console.log('📛 Download cancelled via IPC');
      
      return { success: true, message: 'Download cancelled' };
    } catch (error) {
      console.error('❌ Error cancelling download:', error);
      return { success: false, error: error.message };
    }
  },

  // Cập nhật cài đặt auto-check
  'update-set-auto-check': async (event, enabled, intervalMinutes) => {
    try {
      const manager = initUpdateManager();

      manager.updateAutoCheckSettings(enabled, intervalMinutes);
      console.log(`⚙️ Auto-check settings updated: enabled=${enabled}, interval=${intervalMinutes}min`);
      
      return { success: true, message: 'Auto-check settings updated' };
    } catch (error) {
      console.error('❌ Error updating auto-check settings:', error);
      return { success: false, error: error.message };
    }
  },

  // Lấy cài đặt auto-check hiện tại
  'update-get-settings': async (event) => {
    try {
      const manager = initUpdateManager();

      const status = manager.getStatus();
      const settings = {
        autoCheck: Boolean(status.autoCheckEnabled),
        checkInterval: Number(status.autoCheckInterval * 60 * 1000) || 60 * 60 * 1000, // Convert to milliseconds
        lastCheckTime: status.lastCheckTime
      };
      
      return { 
        success: true, 
        data: JSON.parse(JSON.stringify(settings))
      };
    } catch (error) {
      console.error('❌ Error getting update settings:', error);
      return { success: false, error: error.message };
    }
  },

  // Trigger silent check
  'update-check-silent': async (event) => {
    try {
      const manager = initUpdateManager();
      
      console.log('🔍 Silent update check triggered');
      const result = await manager.checkForUpdates(true); // silent
      
      // Nếu có update available, gửi notification về renderer
      if (result.available) {
        event.sender.send('update-available', result);
      }
      
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Error in silent update check:', error);
      return { success: false, error: error.message };
    }
  },

  // Restart application
  'update-restart-app': async (event) => {
    try {
      console.log('🔄 Restarting application...');
      
      const { app } = require('electron');
      setTimeout(() => {
        app.relaunch();
        app.exit(0);
      }, 1000);
      
      return { success: true, message: 'Application will restart in 1 second' };
    } catch (error) {
      console.error('❌ Error restarting application:', error);
      return { success: false, error: error.message };
    }
  },

  // Check specific version
  'update-check-version': async (event, targetVersion) => {
    try {
      const manager = initUpdateManager();

      const status = manager.getStatus();
      const isNewer = manager.isVersionNewer(targetVersion, status.currentVersion);
      
      return { 
        success: true, 
        data: {
          currentVersion: status.currentVersion,
          targetVersion: targetVersion,
          isNewer: isNewer
        }
      };
    } catch (error) {
      console.error('❌ Error checking version:', error);
      return { success: false, error: error.message };
    }
  },

  // Get GitHub repository info
  'update-get-repo-info': async (event) => {
    try {
      if (!updateManager) {
        updateManager = new UpdateManager();
      }

      return { 
        success: true, 
        data: {
          repo: updateManager.githubRepo,
          currentVersion: updateManager.currentVersion
        }
      };
    } catch (error) {
      console.error('❌ Error getting repo info:', error);
      return { success: false, error: error.message };
    }
  }
};

// Cleanup function
const destroyUpdateManager = () => {
  if (updateManager) {
    try {
      updateManager.destroy();
      updateManager = null;
      console.log('🧹 UpdateManager destroyed');
    } catch (error) {
      console.error('❌ Error destroying UpdateManager:', error);
    }
  }
};

module.exports = { updateHandlers, destroyUpdateManager }; 