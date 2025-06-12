const fs = require('fs').promises;
const path = require('path');
const { app } = require('electron');
// Import không cần thiết nữa - migration đã hoàn thành
// const StorageManager = require('./storage-manager'); // JSON Storage  
// const SQLiteStorageManager = require('./sqlite-storage-manager'); // SQLite Storage

/**
 * Migration script đã hoàn thành - giữ lại để reference
 * Không sử dụng nữa vì đã chuyển hoàn toàn sang SQLite modular system
 */
class DataMigration {
    constructor() {
        // Disable migration functionality
        console.log('⚠️ Migration is disabled - using modular SQLite system');
    }
    
    /**
     * Migration đã hoàn thành - return success
     */
    async run() {
        console.log('✅ Migration skipped - using modular SQLite system');
        return { success: true, message: 'Migration not needed - using modular SQLite' };
    }
    
    async checkJsonDataExists() {
        return false; // Always return false to skip migration
    }
    
    // Disable all other methods
    async migrateFolders() { return { accountFolders: 0, proxyFolders: 0 }; }
    async migrateAccounts() { return { migratedCount: 0, errorCount: 0 }; }
    async migrateProxies() { return { migratedCount: 0, errorCount: 0 }; }
    async migrateRooms() { return { migratedCount: 0, errorCount: 0 }; }
    async migrateSettings() { return { migratedCount: 0 }; }
    async migrateViewerHistory() { return { roomCount: 0, entryCount: 0 }; }
    async backupJsonFiles() { return true; }
    async rollback() { return { success: false, error: 'Rollback disabled' }; }
    async cleanup() { return true; }
}

module.exports = DataMigration; 