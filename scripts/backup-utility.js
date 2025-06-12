#!/usr/bin/env node

/**
 * Backup Utility Script
 * Sử dụng để test và thực hiện backup database
 */

const path = require('path');
const fs = require('fs');

// Mock app cho testing
const mockApp = {
    getPath: (type) => {
        if (type === 'userData') {
            return path.join(__dirname, '../temp-data');
        }
        return path.join(__dirname, '../');
    },
    getAppPath: () => path.join(__dirname, '../')
};

// Mock electron dependencies
global.require = require;
global.process = process;

// Mock electron module với đầy đủ methods
require.cache[require.resolve('electron')] = {
    exports: { 
        app: mockApp,
        Notification: {
            isSupported: () => false
        }
    }
};

// Mock Node.js để tránh lỗi
process.type = 'main';

const StorageManager = require('../lib/storage/storage-manager');

/**
 * Simple TaskHandlers chỉ cho backup (để tránh dependency issues)
 */
class SimpleBackupHandler {
    constructor(storageManager) {
        this.storageManager = storageManager;
    }

    async backupData() {
        console.log('📦 Đang sao lưu database...');
        
        try {
            const fs = require('fs');
            const path = require('path');
            
            // Đường dẫn database gốc
            const dbPath = path.join(mockApp.getPath('userData'), 'tiktok-live.db');
            
            // Tạo thư mục backup trong userData
            const backupDir = path.join(mockApp.getPath('userData'), 'backups');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }
            
            // Tạo tên file backup với timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFileName = `tiktok-live-backup-${timestamp}.db`;
            const backupPath = path.join(backupDir, backupFileName);
            
            // Kiểm tra file database gốc
            if (!fs.existsSync(dbPath)) {
                throw new Error(`Database file not found: ${dbPath}`);
            }
            
            console.log('📦 Tạo backup database với storage manager...');
            
            // Sử dụng file system copy an toàn
            await fs.promises.copyFile(dbPath, backupPath);
            
            // Verify backup file được tạo
            if (fs.existsSync(backupPath)) {
                const backupSize = fs.statSync(backupPath).size;
                const originalSize = fs.statSync(dbPath).size;
                
                if (backupSize === originalSize) {
                    console.log(`📦 Backup database thành công: ${backupFileName}`);
                    console.log(`📁 Đường dẫn: ${backupPath}`);
                    console.log(`📊 Kích thước: ${(backupSize / 1024 / 1024).toFixed(2)} MB`);
                    
                    return { 
                        success: true, 
                        backupPath, 
                        backupFileName,
                        size: backupSize 
                    };
                } else {
                    throw new Error(`Backup file size mismatch: expected ${originalSize}, got ${backupSize}`);
                }
            } else {
                throw new Error('Backup file was not created');
            }
            
        } catch (err) {
            console.error('❌ Lỗi khi sao lưu database:', err);
            throw err;
        }
    }

    async backupDataWithoutHistory() {
        console.log('📦 Đang sao lưu database (loại bỏ viewer_history)...');
        
        try {
            const fs = require('fs');
            const path = require('path');
            
            // Đường dẫn database gốc
            const dbPath = path.join(mockApp.getPath('userData'), 'tiktok-live.db');
            
            // Tạo thư mục backup trong userData
            const backupDir = path.join(mockApp.getPath('userData'), 'backups');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }
            
            // Tạo tên file backup với timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFileName = `tiktok-live-backup-no-history-${timestamp}.db`;
            const backupPath = path.join(backupDir, backupFileName);
            
            // Kiểm tra file database gốc
            if (!fs.existsSync(dbPath)) {
                throw new Error(`Database file not found: ${dbPath}`);
            }
            
            console.log('📦 Export data từ storage manager...');
            
            // Lấy tất cả data trừ viewer_history
            const accounts = await this.storageManager.getAllAccounts();
            const proxies = await this.storageManager.getAllProxies();
            const folders = await this.storageManager.getAllFolders();
            const rooms = await this.storageManager.getAllRooms();
            const settings = await this.storageManager.getSettings();
            
            // Tạo database backup mới và import data
            const Database = require('better-sqlite3');
            const backupDb = new Database(backupPath);
            
            // Copy schema từ database gốc (trừ viewer_history)
            const sourceDb = new Database(dbPath, { readonly: true });
            const tables = sourceDb.prepare(`
                SELECT name, sql FROM sqlite_master 
                WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'viewer_history'
            `).all();
            
            // Tạo tables
            for (const table of tables) {
                if (table.sql) {
                    backupDb.exec(table.sql);
                }
            }
            
            sourceDb.close();
            
            // Import settings
            if (settings) {
                const stmt = backupDb.prepare(`
                    INSERT INTO settings VALUES (?, ?, ?)
                `);
                for (const [key, value] of Object.entries(settings)) {
                    stmt.run(key, JSON.stringify(value), new Date().toISOString());
                }
            }
            
            backupDb.close();
            
            // Verify backup file được tạo
            if (fs.existsSync(backupPath)) {
                const backupSize = fs.statSync(backupPath).size;
                const originalSize = fs.statSync(dbPath).size;
                
                console.log(`📦 Backup database thành công (không có viewer_history): ${backupFileName}`);
                console.log(`📁 Đường dẫn: ${backupPath}`);
                console.log(`📊 Kích thước backup: ${(backupSize / 1024 / 1024).toFixed(2)} MB`);
                console.log(`📊 Kích thước gốc: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
                console.log(`💾 Tiết kiệm: ${(((originalSize - backupSize) / originalSize) * 100).toFixed(1)}%`);
                
                return { 
                    success: true, 
                    backupPath, 
                    backupFileName,
                    size: backupSize,
                    originalSize,
                    spaceSaved: originalSize - backupSize
                };
            } else {
                throw new Error('Backup file was not created');
            }
            
        } catch (err) {
            console.error('❌ Lỗi khi sao lưu database (no history):', err);
            throw err;
        }
    }
}

/**
 * Main backup utility
 */
class BackupUtility {
    constructor() {
        this.storageManager = null;
        this.taskHandlers = null;
    }

    async init() {
        try {
            console.log('🔧 Initializing backup utility...');
            
            this.storageManager = new StorageManager();
            await this.storageManager.init();
            
            this.taskHandlers = new SimpleBackupHandler(this.storageManager);
            
            console.log('✅ Backup utility initialized');
        } catch (error) {
            console.error('❌ Error initializing backup utility:', error);
            throw error;
        }
    }

    async testFullBackup() {
        try {
            console.log('\n📦 Testing full database backup...');
            const result = await this.taskHandlers.backupData();
            
            if (result.success) {
                console.log('✅ Full backup successful:');
                console.log(`   File: ${result.backupFileName}`);
                console.log(`   Size: ${(result.size / 1024 / 1024).toFixed(2)} MB`);
                console.log(`   Path: ${result.backupPath}`);
            } else {
                console.error('❌ Full backup failed:', result.error);
            }
            
            return result;
        } catch (error) {
            console.error('❌ Error testing full backup:', error);
            return { success: false, error: error.message };
        }
    }

    async testBackupWithoutHistory() {
        try {
            console.log('\n📦 Testing backup without viewer history...');
            const result = await this.taskHandlers.backupDataWithoutHistory();
            
            if (result.success) {
                console.log('✅ Backup without history successful:');
                console.log(`   File: ${result.backupFileName}`);
                console.log(`   Backup size: ${(result.size / 1024 / 1024).toFixed(2)} MB`);
                console.log(`   Original size: ${(result.originalSize / 1024 / 1024).toFixed(2)} MB`);
                console.log(`   Space saved: ${(result.spaceSaved / 1024 / 1024).toFixed(2)} MB`);
                console.log(`   Path: ${result.backupPath}`);
            } else {
                console.error('❌ Backup without history failed:', result.error);
            }
            
            return result;
        } catch (error) {
            console.error('❌ Error testing backup without history:', error);
            return { success: false, error: error.message };
        }
    }

    async showBackupList() {
        try {
            console.log('\n📋 Listing existing backups...');
            
            const backupDir = path.join(mockApp.getPath('userData'), 'backups');
            
            if (!fs.existsSync(backupDir)) {
                console.log('📂 No backup directory found');
                return;
            }
            
            const files = fs.readdirSync(backupDir)
                .filter(file => file.startsWith('tiktok-live-backup-') && file.endsWith('.db'))
                .map(file => {
                    const filePath = path.join(backupDir, file);
                    const stats = fs.statSync(filePath);
                    return {
                        name: file,
                        size: stats.size,
                        modified: stats.mtime,
                        type: file.includes('no-history') ? 'Without History' : 'Full Backup'
                    };
                })
                .sort((a, b) => b.modified - a.modified);
            
            if (files.length === 0) {
                console.log('📂 No backup files found');
                return;
            }
            
            console.log(`📂 Found ${files.length} backup files:`);
            files.forEach((file, index) => {
                console.log(`   ${index + 1}. ${file.name}`);
                console.log(`      Type: ${file.type}`);
                console.log(`      Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
                console.log(`      Modified: ${file.modified.toLocaleString()}`);
                console.log('');
            });
            
        } catch (error) {
            console.error('❌ Error listing backups:', error);
        }
    }

    async cleanup() {
        if (this.storageManager && typeof this.storageManager.close === 'function') {
            this.storageManager.close();
        }
    }
}

/**
 * CLI Interface
 */
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'help';
    
    console.log('🗄️ TTL TikTok Live Backup Utility');
    console.log('==================================\n');
    
    const utility = new BackupUtility();
    
    try {
        await utility.init();
        
        switch (command) {
            case 'full':
                await utility.testFullBackup();
                break;
                
            case 'compact':
            case 'no-history':
                await utility.testBackupWithoutHistory();
                break;
                
            case 'list':
                await utility.showBackupList();
                break;
                
            case 'both':
                await utility.testFullBackup();
                await utility.testBackupWithoutHistory();
                break;
                
            case 'help':
            default:
                console.log('Usage: node backup-utility.js [command]');
                console.log('');
                console.log('Commands:');
                console.log('  full        - Create full database backup');
                console.log('  compact     - Create backup without viewer history');
                console.log('  no-history  - Same as compact');
                console.log('  both        - Create both types of backup');
                console.log('  list        - List existing backups');
                console.log('  help        - Show this help');
                console.log('');
                console.log('Examples:');
                console.log('  npm run backup:full');
                console.log('  npm run backup:compact');
                console.log('  npm run backup:list');
                break;
        }
        
    } catch (error) {
        console.error('❌ Backup utility error:', error.message);
        process.exit(1);
    } finally {
        await utility.cleanup();
    }
}

// Export for use as module
module.exports = BackupUtility;

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
} 