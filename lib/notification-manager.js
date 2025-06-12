const { Notification, app, dialog } = require('electron');
const path = require('path');
const { log, error } = require('./logger');
const fs = require('fs');
const appState = require('./app-state');

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
        appState.addListener('language', (language) => {
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
        if (process.platform === 'win32' || process.platform === 'win64') {
            try {
                // app.setAppUserModelId(app.getName() || 'TTL TikTok Live');
                app.setAppUserModelId('com.amac.tiktoklive');
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
            const isProd = process.env.NODE_ENV === 'production';
            let translationPath;
            
            if (isProd) {
                // Trong môi trường production, đường dẫn tới thư mục locales trong extraResources
                translationPath = path.join(process.resourcesPath, 'locales', lang, 'notification.json');
                
                log(`🔍 Notification: Extra resources path: ${path.join(process.resourcesPath, 'locales')}`);
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
            
            const notificationOptions = { ...defaultOptions, ...options };
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
        this.activeNotifications = this.activeNotifications.filter(
            notification => notification !== notificationToDelete
        );
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
            body: this.t('notifications.roomStopped.body', {roomIdentifier}),
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
            body: this.t('notifications.newRoom.body', {roomIdentifier}),
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