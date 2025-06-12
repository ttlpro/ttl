const path = require('path');
const fs = require('fs');

// Mock electron app cho Node.js environment
const mockApp = {
    getPath: (name) => {
        if (name === 'userData') {
            return path.join(require('os').homedir(), 'Library', 'Application Support', 'amac-tiktok-viewer (development)');
        }
        return __dirname;
    }
};

// Set global app mock
global.app = mockApp;

// Mock electron module
const electron = {
    app: mockApp
};
require.cache[require.resolve('electron')] = {
    exports: electron
};

const StorageAdapter = require('../lib/storage-adapter');

/**
 * Force migration từ JSON sang SQLite
 */
async function forceMigration() {
    console.log('🔄 Force migration từ JSON sang SQLite...\n');
    
    try {
        const adapter = new StorageAdapter();
        await adapter.init();
        
        console.log('📊 Current storage type:', adapter.getStorageType());
        
        if (adapter.isUsingSQLite()) {
            console.log('✅ Already using SQLite storage');
            return;
        }
        
        console.log('🚀 Starting migration...');
        const result = await adapter.forceMigrationToSQLite();
        
        if (result.success) {
            console.log('✅ Migration successful!');
            console.log('📊 Results:', JSON.stringify(result.results, null, 2));
        } else {
            console.log('❌ Migration failed:', result.error);
        }
        
        adapter.close();
        
    } catch (error) {
        console.error('❌ Error during migration:', error.message);
    }
}

/**
 * Rollback về JSON storage
 */
async function rollbackToJSON() {
    console.log('🔄 Rollback về JSON storage...\n');
    
    try {
        const adapter = new StorageAdapter();
        await adapter.init();
        
        console.log('📊 Current storage type:', adapter.getStorageType());
        
        if (adapter.isUsingJSON()) {
            console.log('✅ Already using JSON storage');
            return;
        }
        
        console.log('🚀 Starting rollback...');
        const result = await adapter.rollbackToJSON();
        
        if (result.success) {
            console.log('✅ Rollback successful!');
        } else {
            console.log('❌ Rollback failed:', result.error);
        }
        
        adapter.close();
        
    } catch (error) {
        console.error('❌ Error during rollback:', error.message);
    }
}

/**
 * Quick storage info
 */
async function quickInfo() {
    try {
        const adapter = new StorageAdapter();
        await adapter.init();
        
        console.log('Storage:', adapter.getStorageType(), '| SQLite:', adapter.isUsingSQLite());
        
        adapter.close();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Command line interface
const command = process.argv[2];

switch (command) {
    case 'force':
        forceMigration().then(() => process.exit(0));
        break;
        
    case 'rollback':
        rollbackToJSON().then(() => process.exit(0));
        break;
        
    case 'info':
        quickInfo().then(() => process.exit(0));
        break;
        
    default:
        console.log(`
🛠️ Migration Tools

Usage:
  node scripts/migration-tools.js <command>

Commands:
  force     - Force migration từ JSON sang SQLite
  rollback  - Rollback về JSON storage
  info      - Quick storage info

Examples:
  npm run migration:force
  npm run migration:rollback
  npm run db:info
        `);
        process.exit(1);
}

module.exports = {
    forceMigration,
    rollbackToJSON,
    quickInfo
}; 