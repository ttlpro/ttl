const AuthAPI = require('./auth-api');
const DeviceFingerprint = require('./device-fingerprint');
const { log, error } = require('./logger');

class AuthManager {
    constructor(storageManager) {
        this.storageManager = storageManager;
        this.authAPI = new AuthAPI();
        this.checkIntervalId = null;
        this.isCheckingLicense = false;
    }

    /**
     * Đăng ký tài khoản mới
     */
    async register(userData) {
        try {
            log('🔐 Starting registration process for:', userData.username);

            // Gọi API đăng ký
            const result = await this.authAPI.register(userData);
            
            if (result.success) {
                // Lưu auth data vào database
                await this.storageManager.saveAuthData(result.data);
                
                // Lấy thông tin license từ API
                await this.updateLicenseFromAPI(result.data.token);
                
                // Bắt đầu schedule check license
                this.startLicenseCheck();
                
                log('✅ Registration completed successfully');
                return {
                    success: true,
                    user: result.data.user,
                    message: result.message
                };
            } else {
                return result;
            }
        } catch (err) {
            error('❌ Registration error:', err);
            return {
                success: false,
                error: 'Registration failed: ' + err.message
            };
        }
    }

    /**
     * Đăng nhập
     */
    async login(credentials) {
        try {
            const deviceData = await DeviceFingerprint.getDeviceInfo();
            credentials.deviceId = deviceData.deviceId;
            // log("deviceData",deviceData)
            log('🔐 Starting login process for:', credentials.username);

            // Gọi API đăng nhập
            const result = await this.authAPI.login(credentials);
            
            if (result.success) {
                // Lưu auth data vào database
                await this.storageManager.saveAuthData(result.data);
                
                // Lấy thông tin license từ API
                await this.updateLicenseFromAPI(result.data.token);
                
                // Bắt đầu schedule check license
                this.startLicenseCheck();
                
                log('✅ Login completed successfully');
                return {
                    success: true,
                    user: result.data.user,
                    message: result.message
                };
            } else {
                return result;
            }
        } catch (err) {
            error('❌ Login error:', err);
            return {
                success: false,
                error: 'Login failed: ' + err.message
            };
        }
    }

    /**
     * Đăng xuất
     */
    async logout() {
        try {
            log('👋 Starting logout process');

            // Lấy token hiện tại
            const token = await this.storageManager.getCurrentToken();
            
            // Gọi API logout nếu có token
            if (token) {
                await this.authAPI.logout(token);
            }
            
            // Xóa auth data local
            await this.storageManager.clearAuthData();
            
            // Xóa license data
            await this.storageManager.clearLicenseData();
            
            // Stop license check
            this.stopLicenseCheck();
            
            log('✅ Logout completed successfully');
            return { success: true };
        } catch (err) {
            error('❌ Logout error:', err);
            // Vẫn clear local data dù API call fail
            await this.storageManager.clearAuthData();
            await this.storageManager.clearLicenseData();
            this.stopLicenseCheck();
            
            return { success: true };
        }
    }

    /**
     * Kiểm tra trạng thái đăng nhập
     */
    async checkAuthStatus() {
        try {
            const isAuthenticated = await this.storageManager.isAuthenticated();
            const hasValidLicense = await this.storageManager.isLicenseActive();
            
            if (!isAuthenticated) {
                return {
                    authenticated: false,
                    hasValidLicense: false,
                    needLogin: true
                };
            }
            
            // Kiểm tra token có còn valid không
            const token = await this.storageManager.getCurrentToken();
            const isTokenValid = await this.authAPI.validateToken(token);
            
            if (!isTokenValid) {
                // Token hết hạn, logout
                await this.logout();
                return {
                    authenticated: false,
                    hasValidLicense: false,
                    needLogin: true,
                    reason: 'token_expired'
                };
            }
            
            return {
                authenticated: true,
                hasValidLicense,
                user: await this.storageManager.getCurrentUser(),
                license: await this.storageManager.getLicenseInfo()
            };
        } catch (err) {
            error('❌ Error checking auth status:', err);
            return {
                authenticated: false,
                hasValidLicense: false,
                needLogin: true,
                error: err.message
            };
        }
    }

    /**
     * Cập nhật license từ API
     */
    async updateLicenseFromAPI(token = null) {
        try {
            if (this.isCheckingLicense) {
                log('📋 License check already in progress, skipping...');
                return;
            }

            this.isCheckingLicense = true;
            
            if (!token) {
                token = await this.storageManager.getCurrentToken();
            }
            
            if (!token) {
                log('⚠️ No token available for license check');
                this.isCheckingLicense = false;
                return;
            }

            log('📋 Updating license from API...');
            
            // Lấy license hiện tại để so sánh
            const oldLicense = await this.storageManager.getLicenseInfo();
            const oldLimits = await this.storageManager.getLicenseLimits();
            
            const result = await this.authAPI.getUserInfo(token);
            
            if (result.success) {
                let hasChanges = false;
                
                // Cập nhật license
                if (result.data.user && result.data.user.license) {
                    // Parse license từ data.user.license thay vì data.licenses
                    const userLicense = result.data.user.license;
                    await this.storageManager.saveLicenseData(userLicense);
                    log('✅ License updated successfully from user data');
                    
                    // Kiểm tra có thay đổi không
                    const newLicense = await this.storageManager.getLicenseInfo();
                    const newLimits = await this.storageManager.getLicenseLimits();
                    
                    hasChanges = this.hasLicenseChanged(oldLicense, newLicense, oldLimits, newLimits);
                    
                    if (hasChanges) {
                        log('🔔 License has changed, notifying frontend...');
                        await this.notifyLicenseChange('updated', {
                            license: newLicense,
                            limits: newLimits
                        });
                    }
                } else {
                    log('⚠️ No license found in user data');
                    await this.storageManager.clearLicenseData();
                    
                    // License bị xóa - luôn notify
                    hasChanges = true;
                    log('🔔 License cleared, notifying frontend...');
                    await this.notifyLicenseChange('cleared', {
                        license: null,
                        limits: {
                            accounts: 0,
                            rooms: 0,
                            hasValidLicense: false
                        }
                    });
                }
                
                // Cập nhật thời gian check
                await this.storageManager.updateLicenseLastChecked();
                
                return { success: true, hasChanges };
                
            } else if (result.needReauth) {
                log('⚠️ Token expired, need re-authentication');
                await this.logout();
                return { success: false, needReauth: true };
            } else {
                error('❌ Failed to update license:', result.error);
                return { success: false, error: result.error };
            }
        } catch (err) {
            error('❌ Error updating license from API:', err);
            return { success: false, error: err.message };
        } finally {
            this.isCheckingLicense = false;
        }
    }

    /**
     * Kiểm tra license có thay đổi không
     */
    hasLicenseChanged(oldLicense, newLicense, oldLimits, newLimits) {
        // Nếu một trong hai null và một không null
        if (!oldLicense && newLicense) return true;
        if (oldLicense && !newLicense) return true;
        if (!oldLicense && !newLicense) return false;
        
        // So sánh các trường quan trọng
        const fieldsToCompare = ['status', 'type', 'expiresAt'];
        for (const field of fieldsToCompare) {
            if (oldLicense[field] !== newLicense[field]) {
                return true;
            }
        }
        
        // So sánh limits
        if (oldLimits.accounts !== newLimits.accounts) return true;
        if (oldLimits.rooms !== newLimits.rooms) return true;
        if (oldLimits.hasValidLicense !== newLimits.hasValidLicense) return true;
        
        return false;
    }

    /**
     * Notify frontend về license changes
     */
    async notifyLicenseChange(changeType, data) {
        try {
            // Serialize data để tránh IPC errors
            const serializedData = JSON.parse(JSON.stringify({
                type: changeType,
                data: data,
                timestamp: new Date().toISOString()
            }));
            
            log(`🔔 Sending license change: ${JSON.stringify(serializedData)}`);
            
            // Broadcast trực tiếp to all renderer processes
            const { BrowserWindow } = require('electron');
            const windows = BrowserWindow.getAllWindows();
            
            windows.forEach(window => {
                if (!window.isDestroyed()) {
                    try {
                        window.webContents.send('license-changed', serializedData);
                        log(`✅ Sent to window: ${window.id}`);
                    } catch (err) {
                        error(`❌ Failed to send to window ${window.id}:`, err);
                    }
                }
            });
            
            log(`🔔 License change notification sent: ${changeType}`);
        } catch (err) {
            error('❌ Error notifying license change:', err);
        }
    }

    /**
     * Bắt đầu kiểm tra license định kỳ
     */
    startLicenseCheck() {
        if (this.checkIntervalId) {
            clearInterval(this.checkIntervalId);
        }
        
        // Check mỗi 2 phút
        const checkInterval = 2 * 60 * 1000;
        
        this.checkIntervalId = setInterval(() => {
            this.updateLicenseFromAPI();
        }, checkInterval);
        
        log('✅ License check scheduled every 2 minutes');
    }

    /**
     * Dừng kiểm tra license định kỳ
     */
    stopLicenseCheck() {
        if (this.checkIntervalId) {
            clearInterval(this.checkIntervalId);
            this.checkIntervalId = null;
            log('⏹️ License check stopped');
        }
    }

    /**
     * Kiểm tra giới hạn account trước khi import
     */
    async checkAccountImportLimit(newAccountCount) {
        try {
            const currentAccounts = await this.storageManager.getAllAccounts();
            const totalAfterImport = currentAccounts.length + newAccountCount;
            
            const result = await this.storageManager.checkAccountLimit(totalAfterImport);
            
            if (!result.allowed) {
                const limits = await this.storageManager.getLicenseLimits();
                return {
                    allowed: false,
                    reason: result.reason,
                    current: currentAccounts.length,
                    newCount: newAccountCount,
                    totalAfter: totalAfterImport,
                    limit: limits.accounts,
                    message: this.getLimitMessage(result.reason, {
                        current: currentAccounts.length,
                        limit: limits.accounts,
                        requested: newAccountCount
                    })
                };
            }
            
            return { allowed: true };
        } catch (err) {
            error('❌ Error checking account import limit:', err);
            return { allowed: false, reason: 'error', error: err.message };
        }
    }

    /**
     * Kiểm tra giới hạn room trước khi start
     */
    async checkRoomStartLimit(newRoomCount = 1) {
        try {
            // Đếm số room đang active
            const rooms = await this.storageManager.getAllRooms();
            const activeRooms = rooms.filter(room => room.status === 'running' || room.isLive).length;
            const totalAfterStart = activeRooms + newRoomCount;
            
            const result = await this.storageManager.checkRoomLimit(totalAfterStart);
            
            if (!result.allowed) {
                const limits = await this.storageManager.getLicenseLimits();
                return {
                    allowed: false,
                    reason: result.reason,
                    current: activeRooms,
                    newCount: newRoomCount,
                    totalAfter: totalAfterStart,
                    limit: limits.rooms,
                    message: this.getLimitMessage(result.reason, {
                        current: activeRooms,
                        limit: limits.rooms,
                        requested: newRoomCount
                    }, 'rooms')
                };
            }
            
            return { allowed: true };
        } catch (err) {
            error('❌ Error checking room start limit:', err);
            return { allowed: false, reason: 'error', error: err.message };
        }
    }

    /**
     * Tạo message cho limit error
     */
    getLimitMessage(reason, data, type = 'accounts') {
        switch (reason) {
            case 'no_valid_license':
                return 'Không có license hợp lệ. Vui lòng kiểm tra lại license của bạn.';
            case 'account_limit_exceeded':
                return `Vượt quá giới hạn tài khoản. Hiện tại: ${data.current}, Yêu cầu thêm: ${data.requested}, Giới hạn: ${data.limit}`;
            case 'room_limit_exceeded':
                return `Vượt quá giới hạn phòng live. Hiện tại: ${data.current}, Yêu cầu thêm: ${data.requested}, Giới hạn: ${data.limit}`;
            default:
                return 'Đã xảy ra lỗi khi kiểm tra giới hạn license.';
        }
    }

    /**
     * Lấy thông tin tổng quan auth và license
     */
    async getAuthSummary() {
        try {
            const user = await this.storageManager.getCurrentUser();
            const license = await this.storageManager.getLicenseInfo();
            const limits = await this.storageManager.getLicenseLimits();
            
            // Đếm usage hiện tại
            const accounts = await this.storageManager.getAllAccounts();
            const rooms = await this.storageManager.getAllRooms();
            const activeRooms = rooms.filter(room => room.status === 'running' || room.isLive);
            
            return {
                user,
                license,
                limits,
                usage: {
                    accounts: accounts.length,
                    activeRooms: activeRooms.length
                },
                canImportAccounts: limits.hasValidLicense && accounts.length < limits.accounts,
                canStartRooms: limits.hasValidLicense && activeRooms.length < limits.rooms
            };
        } catch (err) {
            error('❌ Error getting auth summary:', err);
            return null;
        }
    }

    /**
     * Test connection tới auth server
     */
    async testConnection() {
        return this.authAPI.testConnection();
    }

    /**
     * Cập nhật auth API URL
     */
    setAuthAPIURL(url) {
        this.authAPI.setBaseURL(url);
    }

    /**
     * Cleanup khi app đóng
     */
    cleanup() {
        this.stopLicenseCheck();
    }
}

module.exports = AuthManager; 