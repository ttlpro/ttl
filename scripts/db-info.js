const path = require('path');
const fs = require('fs');

// Mock electron app cho Node.js environment
const mockApp = {
    getPath: (name) => {
        if (name === 'userData') {
            // Sử dụng thư mục thực tế của development app
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
 * Database info checker cho Node.js environment
 */
async function checkDatabaseInfo() {
    console.log('🔍 Checking database information...\n');
    
    try {
        const dataDir = mockApp.getPath('userData') + '/amac-data';
        const dbPath = path.join(dataDir, 'amac-database.db');
        
        // Check file existence
        console.log('📁 Data directory:', dataDir);
        console.log('📄 Directory exists:', fs.existsSync(dataDir));
        
        const hasDatabase = fs.existsSync(dbPath);
        console.log('🗄️ SQLite database exists:', hasDatabase);
        
        if (hasDatabase) {
            const stats = fs.statSync(dbPath);
            console.log('📏 Database size:', (stats.size / 1024).toFixed(2) + ' KB');
            console.log('📅 Last modified:', stats.mtime.toISOString());
        }
        
        // Check JSON files
        const jsonFiles = ['accounts.json', 'proxies.json', 'folders.json', 'settings.json'];
        console.log('\n📋 JSON Files status:');
        
        for (const file of jsonFiles) {
            const filePath = path.join(dataDir, file);
            const exists = fs.existsSync(filePath);
            
            if (exists) {
                const stats = fs.statSync(filePath);
                console.log(`   ${file}: ${(stats.size / 1024).toFixed(2)} KB`);
            } else {
                console.log(`   ${file}: Not found`);
            }
        }
        
        // Check backup directory
        const backupDir = path.join(dataDir, 'json-backup');
        const hasBackup = fs.existsSync(backupDir);
        console.log('\n💾 Backup directory exists:', hasBackup);
        
        if (hasBackup) {
            const backupFiles = fs.readdirSync(backupDir);
            console.log('📦 Backup files:', backupFiles.length);
        }
        
        // Try to initialize StorageAdapter
        console.log('\n🔧 Attempting to initialize StorageAdapter...');
        
        const adapter = new StorageAdapter();
        await adapter.init();
        
        console.log('✅ Storage Type:', adapter.getStorageType().toUpperCase());
        console.log('🗃️ Using SQLite:', adapter.isUsingSQLite());
        console.log('📄 Using JSON:', adapter.isUsingJSON());
        
        // Quick data check
        try {
            const accounts = await adapter.getAllAccounts();
            const proxies = await adapter.getAllProxies();
            const folders = await adapter.getAllFolders();
            const settings = await adapter.getSettings();
            
            console.log('\n📊 Data Statistics:');
            console.log('   👤 Accounts:', accounts.length);
            console.log('   🌐 Proxies:', proxies.length);
            console.log('   📂 Account folders:', folders.accounts?.length || 0);
            console.log('   🔗 Proxy folders:', folders.proxies?.length || 0);
            console.log('   ⚙️ Settings keys:', Object.keys(settings).length);
            
        } catch (dataError) {
            console.log('⚠️ Could not read data:', dataError.message);
        }
        
        adapter.close();
        
        console.log('\n✅ Database info check completed!');
        
    } catch (error) {
        console.error('❌ Error checking database info:', error.message);
        console.log('\n💡 Possible solutions:');
        console.log('   - Make sure app has been run at least once');
        console.log('   - Check file permissions');
        console.log('   - Run migration test: npm run test:migration');
    }
}

// Main execution
if (require.main === module) {
    checkDatabaseInfo().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
}

module.exports = checkDatabaseInfo; 