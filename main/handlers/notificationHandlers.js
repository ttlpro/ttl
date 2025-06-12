const { log, error } = require('../../lib/logger');
const notificationManager = require('../../lib/notification-manager');
const { dialog, BrowserWindow } = require('electron');

const notificationHandlers = () => {
  return {
    /**
     * Lấy trạng thái thông báo
     */
    'get-notification-settings': async () => {
      try {
        return {
          success: true,
          data: {
            enabled: notificationManager.enabled,
            soundEnabled: notificationManager.soundEnabled
          }
        };
      } catch (err) {
        error('Error getting notification settings:', err);
        return { success: false, error: err.message };
      }
    },

    /**
     * Bật/tắt thông báo
     */
    'toggle-notifications': async (event, enabled) => {
      try {
        notificationManager.setEnabled(Boolean(enabled));
        log(`📢 Thông báo đã được ${enabled ? 'bật' : 'tắt'}`);
        return {
          success: true,
          enabled: notificationManager.enabled
        };
      } catch (err) {
        error('Error toggling notifications:', err);
        return { success: false, error: err.message };
      }
    },

    /**
     * Bật/tắt âm thanh thông báo
     */
    'toggle-notification-sound': async (event, enabled) => {
      try {
        notificationManager.setSoundEnabled(Boolean(enabled));
        log(`🔊 Âm thanh thông báo đã được ${enabled ? 'bật' : 'tắt'}`);
        return {
          success: true,
          soundEnabled: notificationManager.soundEnabled
        };
      } catch (err) {
        error('Error toggling notification sound:', err);
        return { success: false, error: err.message };
      }
    },

    /**
     * Lấy lịch sử thông báo
     */
    'get-notification-history': async () => {
      try {
        const history = notificationManager.getHistory();
        return {
          success: true,
          data: history
        };
      } catch (err) {
        error('Error getting notification history:', err);
        return { success: false, error: err.message };
      }
    },

    /**
     * Gửi thông báo test
     */
    'send-test-notification': async (event) => {
      try {
        log('📢 Gửi thông báo test');
        
        // Sử dụng phương thức notifyTest của notificationManager
        const notification = notificationManager.notifyTest();
        
        // Hiển thị dialog bất kể kết quả của Notification API
        // try {
        //   const focusedWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
          
        //   dialog.showMessageBox(focusedWindow, {
        //     type: 'info',
        //     title: 'Thông báo thử nghiệm',
        //     message: 'Đây là thông báo thử nghiệm sử dụng dialog.',
        //     detail: 'Nếu bạn thấy thông báo này, tính năng dialog đang hoạt động tốt.',
        //     buttons: ['OK']
        //   });
          
        //   log('📢 Đã hiển thị dialog thông báo thử nghiệm');
        // } catch (dialogErr) {
        //   error('❌ Lỗi khi hiển thị dialog thông báo thử nghiệm:', dialogErr);
        // }
        
        return {
          success: true,
          sent: true
        };
      } catch (err) {
        error('Error sending test notification:', err);
        return { success: false, error: err.message };
      }
    }
  };
};

module.exports = notificationHandlers; 