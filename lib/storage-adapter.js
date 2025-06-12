const path = require('path');
const fs = require('fs');

// Import new modular storage system
const StorageManager = require('./storage/storage-manager');

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

    // Expose database object for external use (e.g., UpdateManager)
    get db() {
        if (this.storage && this.storage.db) {
            return this.storage.db;
        }
        return null;
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
        if (this.storage && this.storage.roomStorage && 
            typeof this.storage.roomStorage.releaseAccountsFromRoom === 'function') {
            return this.storage.roomStorage.releaseAccountsFromRoom(roomId);
        } else {
            console.error('❌ Cannot release accounts: storage.roomStorage not available');
            return { success: false, error: 'storage.roomStorage not available' };
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

    async getSetting(key) {
        this.ensureInitialized();
        return this.storage.getSetting(key);
    }

    async saveSetting(key, value) {
        this.ensureInitialized();
        return this.storage.saveSetting(key, value);
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
                return { success: true, results: result.results };
            } else {
                console.error('❌ Force migration thất bại:', result.error);
                return { success: false, error: result.error };
            }
            
        } catch (error) {
            console.error('❌ Lỗi force migration:', error);
            return { success: false, error: error.message };
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
                return { success: true };
            } else {
                console.error('❌ Rollback thất bại:', result.error);
                return { success: false, error: result.error };
            }
            
        } catch (error) {
            console.error('❌ Lỗi rollback:', error);
            return { success: false, error: error.message };
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

    // =================
    // AUTH METHODS
    // =================

    async saveAuthData(authData) {
        this.ensureInitialized();
        return this.storage.saveAuthData(authData);
    }

    async getCurrentAuth() {
        this.ensureInitialized();
        return this.storage.getCurrentAuth();
    }

    async updateToken(newToken, refreshToken = null) {
        this.ensureInitialized();
        return this.storage.updateToken(newToken, refreshToken);
    }

    async updateLastChecked() {
        this.ensureInitialized();
        return this.storage.updateLastChecked();
    }

    async clearAuthData() {
        this.ensureInitialized();
        return this.storage.clearAuthData();
    }

    async isAuthenticated() {
        this.ensureInitialized();
        return this.storage.isAuthenticated();
    }

    async getCurrentToken() {
        this.ensureInitialized();
        return this.storage.getCurrentToken();
    }

    async updateAuthStatus(status) {
        this.ensureInitialized();
        return this.storage.updateAuthStatus(status);
    }

    async getCurrentUser() {
        this.ensureInitialized();
        return this.storage.getCurrentUser();
    }

    // =================
    // LICENSE METHODS
    // =================

    async saveLicenseData(licenseData) {
        this.ensureInitialized();
        return this.storage.saveLicenseData(licenseData);
    }

    async getCurrentLicense() {
        this.ensureInitialized();
        return this.storage.getCurrentLicense();
    }

    async isLicenseActive() {
        this.ensureInitialized();
        return this.storage.isLicenseActive();
    }

    async getLicenseLimits() {
        this.ensureInitialized();
        return this.storage.getLicenseLimits();
    }

    async checkAccountLimit(currentCount) {
        this.ensureInitialized();
        return this.storage.checkAccountLimit(currentCount);
    }

    async checkRoomLimit(currentCount) {
        this.ensureInitialized();
        return this.storage.checkRoomLimit(currentCount);
    }

    async updateLicenseStatus(status) {
        this.ensureInitialized();
        return this.storage.updateLicenseStatus(status);
    }

    async updateLicenseLastChecked() {
        this.ensureInitialized();
        return this.storage.updateLicenseLastChecked();
    }

    async clearLicenseData() {
        this.ensureInitialized();
        return this.storage.clearLicenseData();
    }

    async getLicenseInfo() {
        this.ensureInitialized();
        return this.storage.getLicenseInfo();
    }

    async updateLicenseFromAPI(licenseData) {
        this.ensureInitialized();
        return this.storage.updateLicenseFromAPI(licenseData);
    }
}

// Export class instead of singleton
module.exports = StorageAdapter; 