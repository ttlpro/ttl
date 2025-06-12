const path = require('path');

// Mock electron app trước khi import bất kỳ module nào
const mockApp = {
    getPath: (name) => {
        if (name === 'userData') {
            return path.join(__dirname, 'test-data');
        }
        return __dirname;
    }
};

// Set global app
global.app = mockApp;

// Mock electron module
const electron = {
    app: mockApp
};
require.cache[require.resolve('electron')] = {
    exports: electron
};

const DataMigration = require('./lib/migration-script');
const StorageAdapter = require('./lib/storage-adapter');
const SQLiteStorageManager = require('./lib/sqlite-storage-manager');

/**
 * Test script cho migration
 */
async function testMigration() {
    console.log('🧪 Bắt đầu test migration...\n');
    
    try {
        // 1. Test SQLite Storage Manager cơ bản
        console.log('1️⃣ Testing SQLite Storage Manager...');
        const sqliteStorage = new SQLiteStorageManager();
        await sqliteStorage.init();
        
        // Test thêm folder
        const newFolder = await sqliteStorage.createFolder('accounts', {
            name: 'Test Folder',
            description: 'Folder test',
            color: '#FF0000'
        });
        console.log('✅ Created test folder:', newFolder.name);
        
        // Test thêm account
        const newAccount = await sqliteStorage.addAccount({
            accountInfo: 'testuser|testpass|test@email.com||',
            folderId: newFolder.id
        });
        console.log('✅ Created test account:', newAccount.username);
        
        // Test lấy accounts
        const accounts = await sqliteStorage.getAllAccounts();
        console.log('✅ Got accounts count:', accounts.length);
        
        // Test thêm proxy
        const newProxy = await sqliteStorage.addProxy({
            proxyInfo: '192.168.1.1:8080:user:pass',
            folderId: 'default'
        });
        console.log('✅ Created test proxy:', newProxy.host);
        
        // Test settings
        await sqliteStorage.saveSettings({
            testSetting: 'testValue',
            theme: 'light'
        });
        const settings = await sqliteStorage.getSettings();
        console.log('✅ Settings saved and retrieved:', Object.keys(settings).length, 'settings');
        
        sqliteStorage.close();
        console.log('✅ SQLite basic tests passed!\n');
        
        // 2. Test Migration Script
        console.log('2️⃣ Testing Migration Script...');
        const migration = new DataMigration();
        
        // Kiểm tra có dữ liệu JSON không
        const hasJsonData = await migration.checkJsonDataExists();
        console.log('📊 Has JSON data to migrate:', hasJsonData);
        
        if (hasJsonData) {
            console.log('🔄 Running migration...');
            const result = await migration.run();
            
            if (result.success) {
                console.log('✅ Migration successful!');
                console.log('📊 Results:', result.results);
            } else {
                console.log('❌ Migration failed:', result.error);
            }
        } else {
            console.log('ℹ️ No JSON data to migrate');
        }
        
        console.log('✅ Migration tests completed!\n');
        
        // 3. Test Storage Adapter
        console.log('3️⃣ Testing Storage Adapter...');
        const adapter = new StorageAdapter();
        await adapter.init();
        
        console.log('🔍 Storage type:', adapter.getStorageType());
        console.log('🗃️ Using SQLite:', adapter.isUsingSQLite());
        console.log('📄 Using JSON:', adapter.isUsingJSON());
        
        // Test một số operations thông qua adapter
        const adapterFolders = await adapter.getAllFolders();
        console.log('✅ Adapter getAllFolders:', adapterFolders.accounts?.length || 0, 'account folders');
        
        const adapterSettings = await adapter.getSettings();
        console.log('✅ Adapter getSettings:', Object.keys(adapterSettings).length, 'settings');
        
        adapter.close();
        console.log('✅ Storage Adapter tests passed!\n');
        
        console.log('🎉 Tất cả tests đều thành công!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack:', error.stack);
    }
}

/**
 * Test Performance so sánh JSON vs SQLite
 */
async function testPerformance() {
    console.log('⚡ Bắt đầu performance test...\n');
    
    try {
        const iterations = 100;
        
        // Test SQLite
        console.log('Testing SQLite performance...');
        const sqliteStorage = new SQLiteStorageManager();
        await sqliteStorage.init();
        
        const sqliteStart = Date.now();
        
        for (let i = 0; i < iterations; i++) {
            await sqliteStorage.addAccount({
                accountInfo: `perftest${i}|pass${i}|test${i}@email.com||`,
                folderId: 'default'
            });
        }
        
        const allAccounts = await sqliteStorage.getAllAccounts();
        
        const sqliteEnd = Date.now();
        const sqliteTime = sqliteEnd - sqliteStart;
        
        console.log(`✅ SQLite: ${iterations} inserts + 1 select = ${sqliteTime}ms`);
        console.log(`📊 SQLite: Retrieved ${allAccounts.length} accounts`);
        
        sqliteStorage.close();
        
        console.log(`\n🏆 SQLite Performance: ${sqliteTime}ms for ${iterations} operations`);
        
    } catch (error) {
        console.error('❌ Performance test failed:', error);
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--perf')) {
        await testPerformance();
    } else {
        await testMigration();
    }
    
    process.exit(0);
}

// Chạy nếu được gọi trực tiếp
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Main execution failed:', error);
        process.exit(1);
    });
}

module.exports = {
    testMigration,
    testPerformance
}; 