const DatabaseSchema = require('./database-schema');
const FolderStorage = require('./folder-storage');
const AccountStorage = require('./account-storage');
const ProxyStorage = require('./proxy-storage');
const RoomStorage = require('./room-storage');
const SettingsStorage = require('./settings-storage');
const TaskStorage = require('./task-storage');
const AuthStorage = require('./auth-storage');
const LicenseStorage = require('./license-storage');
const { log, error } = require('../logger');

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
        this.authStorage = new AuthStorage();
        this.licenseStorage = new LicenseStorage();
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
            this.authStorage.db = this.db;
            this.licenseStorage.db = this.db;
            
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

    /**
     * Helper function để map 'default' thành id thực tế
     */
    getDefaultFolderId(type) {
        return type === 'accounts' ? 'accounts-default' : 'proxies-default';
    }

    /**
     * Helper function để map id thực tế thành 'default' cho frontend
     */
    mapFolderIdForFrontend(folderId, type) {
        const defaultId = this.getDefaultFolderId(type);
        return folderId === defaultId ? 'default' : folderId;
    }

    /**
     * Helper function để map 'default' từ frontend thành id thực tế
     */
    mapFolderIdFromFrontend(folderId, type) {
        return folderId === 'default' ? this.getDefaultFolderId(type) : folderId;
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
                return { success: true, folders: { accounts: folders } };
            } else if (type === 'proxies') {
                log(`📂 Returning folders for proxies in format: { success: true, folders: { proxies: [...] } }`);
                return { success: true, folders: { proxies: folders } };
            }
            log(`📂 Returning folders in simple format: { success: true, folders: [...] }`);
            return { success: true, folders };
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

    async updateAccountStatus(username, status) {
        return this.accountStorage.updateAccountStatus(username, status);
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
        } catch (err) {
            console.error('Error updating task status:', err);
            return {
                success: false,
                error: err.message
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
            const maxAccountsPerProxy = settings.proxy?.maxAccountsPerProxy || 1;
            
            log('Max accounts per proxy from settings:', maxAccountsPerProxy);
            
            // Đếm số account hiện tại đã gán cho mỗi proxy
            const proxyUsageCount = {};
            accounts.forEach(account => {
                if (account.proxyId) {
                    proxyUsageCount[account.proxyId] = (proxyUsageCount[account.proxyId] || 0) + 1;
                }
            });
            
            // Lọc và sắp xếp proxy có thể sử dụng
            const usableProxies = availableProxies
                .map(proxy => {
                    const currentUsage = proxyUsageCount[proxy.id] || 0;
                    const availableSlots = Math.max(0, maxAccountsPerProxy - currentUsage);
                    return {
                        ...proxy,
                        availableSlots
                    };
                })
                .filter(proxy => proxy.availableSlots > 0)
                .sort((a, b) => b.availableSlots - a.availableSlots);
            
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
        } catch (err) {
            error('Error in bulkSetProxy (StorageManager):', err);
            return { success: false, error: err.message };
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
                    results.push({ accountId });
                }
            }
            
            return {
                success: updated > 0,
                message: `Đã xóa proxy khỏi ${updated}/${accountIds.length} tài khoản`,
                updated,
                totalRequested: accountIds.length,
                results
            };
        } catch (err) {
            error('Error removing proxy from accounts:', err);
            return { success: false, error: err.message };
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
                    results.push({ accountId });
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
            return { success: false, error: err.message };
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
                    results.push({ accountId });
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
            return { success: false, error: err.message };
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
        } catch (err) {
            error('Error exporting accounts:', err);
            return { success: false, error: err.message };
        }
    }

    // =================
    // AUTH METHODS
    // =================

    async saveAuthData(authData) {
        return this.authStorage.saveAuthData(authData);
    }

    async getCurrentAuth() {
        return this.authStorage.getCurrentAuth();
    }

    async updateToken(newToken, refreshToken = null) {
        return this.authStorage.updateToken(newToken, refreshToken);
    }

    async updateLastChecked() {
        return this.authStorage.updateLastChecked();
    }

    async clearAuthData() {
        return this.authStorage.clearAuthData();
    }

    async isAuthenticated() {
        return this.authStorage.isAuthenticated();
    }

    async getCurrentToken() {
        return this.authStorage.getCurrentToken();
    }

    async updateAuthStatus(status) {
        return this.authStorage.updateAuthStatus(status);
    }

    async getCurrentUser() {
        return this.authStorage.getCurrentUser();
    }

    // =================
    // LICENSE METHODS
    // =================

    async saveLicenseData(licenseData) {
        return this.licenseStorage.saveLicenseData(licenseData);
    }

    async getCurrentLicense() {
        return this.licenseStorage.getCurrentLicense();
    }

    async isLicenseActive() {
        return this.licenseStorage.isLicenseActive();
    }

    async getLicenseLimits() {
        return this.licenseStorage.getLicenseLimits();
    }

    async checkAccountLimit(newAccountCount = 0) {
        const currentAccounts = await this.getAllAccounts();
        return this.licenseStorage.checkAccountLimit(currentAccounts.length + newAccountCount);
    }

    async checkRoomLimit(newRoomCount = 0) {
        const allRooms = await this.getAllRooms();
        const watchingRooms = allRooms.filter(room => room.status === 'watching');
        return this.licenseStorage.checkRoomLimit(watchingRooms.length + newRoomCount);
    }

    async updateLicenseStatus(status) {
        return this.licenseStorage.updateLicenseStatus(status);
    }

    async updateLicenseLastChecked() {
        return this.licenseStorage.updateLastChecked();
    }

    async clearLicenseData() {
        return this.licenseStorage.clearLicenseData();
    }

    async getLicenseInfo() {
        return this.licenseStorage.getLicenseInfo();
    }

    async updateLicenseFromAPI(licenseData) {
        return this.licenseStorage.updateLicenseFromAPI(licenseData);
    }
}

module.exports = StorageManager; 