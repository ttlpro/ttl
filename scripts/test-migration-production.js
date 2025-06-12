const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Import các modules migration
const StorageAdapter = require('../lib/storage-adapter');
const DataMigration = require('../lib/migration-script');
const SQLiteStorageManager = require('../lib/sqlite-storage-manager');

/**
 * Test migration trong môi trường production với Electron
 */
class ProductionMigrationTest {
    constructor() {
        this.results = {};
    }
    
    async run() {
        console.log('🚀 Bắt đầu production migration test...\n');
        
        try {
            // Test 1: Kiểm tra tình trạng dữ liệu hiện tại
            console.log('1️⃣ Kiểm tra tình trạng dữ liệu hiện tại...');
            const migration = new DataMigration();
            const hasJsonData = await migration.checkJsonDataExists();
            console.log(`📊 Has JSON data: ${hasJsonData}`);
            
            const dataDir = path.join(app.getPath('userData'), 'amac-data');
            const dbPath = path.join(dataDir, 'amac-database.db');
            const hasDatabase = fs.existsSync(dbPath);
            console.log(`🗄️ Has SQLite database: ${hasDatabase}`);
            
            if (hasDatabase) {
                const stats = fs.statSync(dbPath);
                console.log(`📏 Database size: ${(stats.size / 1024).toFixed(2)} KB`);
            }
            
            // Test 2: StorageAdapter auto-detection
            console.log('\n2️⃣ Testing StorageAdapter auto-detection...');
            const adapter = new StorageAdapter();
            await adapter.init();
            
            console.log(`🔍 Detected storage type: ${adapter.getStorageType()}`);
            console.log(`✅ Is using SQLite: ${adapter.isUsingSQLite()}`);
            console.log(`📄 Is using JSON: ${adapter.isUsingJSON()}`);
            
            // Test 3: Basic operations
            console.log('\n3️⃣ Testing basic operations...');
            
            // Test folders
            const folders = await adapter.getAllFolders();
            console.log(`📂 Account folders: ${folders.accounts?.length || 0}`);
            console.log(`🔗 Proxy folders: ${folders.proxies?.length || 0}`);
            
            // Test accounts
            const accounts = await adapter.getAllAccounts();
            console.log(`👤 Total accounts: ${accounts.length}`);
            
            // Test proxies
            const proxies = await adapter.getAllProxies();
            console.log(`🌐 Total proxies: ${proxies.length}`);
            
            // Test rooms
            const rooms = await adapter.getAllRooms();
            console.log(`🏠 Total rooms: ${rooms.length}`);
            
            // Test settings
            const settings = await adapter.getSettings();
            console.log(`⚙️ Settings keys: ${Object.keys(settings).length}`);
            
            // Test 4: Performance test
            console.log('\n4️⃣ Performance test...');
            const startTime = Date.now();
            
            // Test multiple reads
            for (let i = 0; i < 10; i++) {
                await adapter.getAllAccounts();
                await adapter.getAllProxies();
                await adapter.getSettings();
            }
            
            const endTime = Date.now();
            const totalTime = endTime - startTime;
            console.log(`⚡ 30 operations in ${totalTime}ms (avg: ${(totalTime / 30).toFixed(2)}ms per operation)`);
            
            // Test 5: Force migration test (nếu có JSON data)
            if (hasJsonData && !adapter.isUsingSQLite()) {
                console.log('\n5️⃣ Testing force migration to SQLite...');
                const migrationResult = await adapter.forceMigrationToSQLite();
                
                if (migrationResult.success) {
                    console.log('✅ Force migration successful!');
                    console.log('📊 Results:', migrationResult.results);
                } else {
                    console.log('❌ Force migration failed:', migrationResult.error);
                }
            }
            
            // Test 6: Database integrity check (nếu dùng SQLite)
            if (adapter.isUsingSQLite()) {
                console.log('\n6️⃣ Database integrity check...');
                try {
                    const storage = adapter.getStorage();
                    const result = storage.db.pragma('integrity_check');
                    console.log(`🔍 Database integrity: ${result[0].integrity_check}`);
                    
                    // Table statistics
                    const accountCount = storage.db.prepare('SELECT COUNT(*) as count FROM accounts').get();
                    const proxyCount = storage.db.prepare('SELECT COUNT(*) as count FROM proxies').get();
                    const roomCount = storage.db.prepare('SELECT COUNT(*) as count FROM rooms').get();
                    const historyCount = storage.db.prepare('SELECT COUNT(*) as count FROM viewer_history').get();
                    
                    console.log(`📊 Database statistics:`);
                    console.log(`   - Accounts: ${accountCount.count}`);
                    console.log(`   - Proxies: ${proxyCount.count}`);
                    console.log(`   - Rooms: ${roomCount.count}`);
                    console.log(`   - History entries: ${historyCount.count}`);
                } catch (error) {
                    console.log('❌ Database check failed:', error.message);
                }
            }
            
            adapter.close();
            
            console.log('\n🎉 Production migration test completed successfully!');
            
            this.results = {
                success: true,
                hasJsonData,
                hasDatabase,
                storageType: adapter.getStorageType(),
                totalTime,
                dataStats: {
                    accounts: accounts.length,
                    proxies: proxies.length,
                    rooms: rooms.length,
                    folders: (folders.accounts?.length || 0) + (folders.proxies?.length || 0)
                }
            };
            
            return this.results;
            
        } catch (error) {
            console.error('❌ Production test failed:', error);
            console.error('Stack:', error.stack);
            
            this.results = {
                success: false,
                error: error.message
            };
            
            return this.results;
        }
    }
    
    /**
     * Generate báo cáo chi tiết
     */
    generateReport() {
        if (!this.results.success) {
            return `❌ Migration test failed: ${this.results.error}`;
        }
        
        return `
📋 MIGRATION TEST REPORT
========================

✅ Test Status: PASSED
🗄️ Storage Type: ${this.results.storageType.toUpperCase()}
📊 Data Source: ${this.results.hasJsonData ? 'JSON Files' : 'No JSON data'}
🗃️ Database: ${this.results.hasDatabase ? 'Exists' : 'Not found'}

📈 Performance:
   - Test duration: ${this.results.totalTime}ms
   - Average operation: ${(this.results.totalTime / 30).toFixed(2)}ms

📊 Data Statistics:
   - Accounts: ${this.results.dataStats.accounts}
   - Proxies: ${this.results.dataStats.proxies}
   - Rooms: ${this.results.dataStats.rooms}
   - Folders: ${this.results.dataStats.folders}

💡 Recommendations:
${this.results.storageType === 'sqlite' ? 
    '✅ SQLite is active - excellent performance expected' : 
    '⚠️ Using JSON files - consider migrating to SQLite for better performance'
}
        `;
    }
}

/**
 * Main function khi chạy script
 */
async function main() {
    try {
        // Khởi tạo Electron app nếu chưa ready
        if (!app.isReady()) {
            await app.whenReady();
        }
        
        const test = new ProductionMigrationTest();
        const results = await test.run();
        
        console.log('\n' + test.generateReport());
        
        // Ghi kết quả ra file
        const reportPath = path.join(app.getPath('userData'), 'migration-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
        
        app.quit();
        
    } catch (error) {
        console.error('❌ Main execution failed:', error);
        app.quit();
        process.exit(1);
    }
}

// Export cho sử dụng từ main process
module.exports = ProductionMigrationTest;

// Chạy nếu được gọi trực tiếp
if (require.main === module) {
    main();
} 