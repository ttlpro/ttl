const path = require('path');
const fs = require('fs');

// Mock electron app
const mockApp = {
    getPath: (name) => {
        if (name === 'userData') {
            return path.join(require('os').homedir(), 'Library', 'Application Support', 'amac-tiktok-viewer');
        }
        return __dirname;
    }
};

global.app = mockApp;
require.cache[require.resolve('electron')] = { exports: { app: mockApp } };

const StorageAdapter = require('../lib/storage-adapter');
const SQLiteStorageManager = require('../lib/sqlite-storage-manager');

/**
 * Comprehensive migration verification
 */
class MigrationVerifier {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            tests: []
        };
    }
    
    async runTest(name, testFn) {
        console.log(`🧪 Testing: ${name}`);
        
        try {
            await testFn();
            console.log(`✅ PASS: ${name}`);
            this.results.passed++;
            this.results.tests.push({ name, status: 'PASS' });
        } catch (error) {
            console.log(`❌ FAIL: ${name} - ${error.message}`);
            this.results.failed++;
            this.results.tests.push({ name, status: 'FAIL', error: error.message });
        }
    }
    
    async verifyAll() {
        console.log('🔍 Starting comprehensive migration verification...\n');
        
        // Test 1: SQLite Storage Manager Basic Operations
        await this.runTest('SQLite Storage Manager Initialization', async () => {
            const storage = new SQLiteStorageManager();
            await storage.init();
            storage.close();
        });
        
        // Test 2: StorageAdapter Auto-Detection
        await this.runTest('StorageAdapter Auto-Detection', async () => {
            const adapter = new StorageAdapter();
            await adapter.init();
            
            if (!adapter.getStorageType() || !['json', 'sqlite'].includes(adapter.getStorageType())) {
                throw new Error('Invalid storage type detected');
            }
            
            adapter.close();
        });
        
        // Test 3: Database CRUD Operations
        await this.runTest('Database CRUD Operations', async () => {
            const adapter = new StorageAdapter();
            await adapter.init();
            
            // Test folder creation
            const testFolder = await adapter.createFolder('accounts', {
                name: 'Test Folder',
                description: 'Verification test',
                color: '#FF0000'
            });
            
            if (!testFolder.id) {
                throw new Error('Failed to create folder');
            }
            
            // Test account creation
            const testAccount = await adapter.addAccount({
                accountInfo: 'verifyuser|pass|email@test.com||',
                folderId: testFolder.id
            });
            
            if (!testAccount.username || testAccount.username !== 'verifyuser') {
                throw new Error('Failed to create account');
            }
            
            // Test proxy creation
            const testProxy = await adapter.addProxy({
                proxyInfo: '127.0.0.1:8080:user:pass',
                folderId: 'default'
            });
            
            if (!testProxy.host || testProxy.host !== '127.0.0.1') {
                throw new Error('Failed to create proxy');
            }
            
            // Test settings
            await adapter.saveSettings({
                testKey: 'testValue',
                verificationTime: new Date().toISOString()
            });
            
            const settings = await adapter.getSettings();
            if (!settings.testKey || settings.testKey !== 'testValue') {
                throw new Error('Failed to save/retrieve settings');
            }
            
            adapter.close();
        });
        
        // Test 4: Data Retrieval Performance
        await this.runTest('Data Retrieval Performance', async () => {
            const adapter = new StorageAdapter();
            await adapter.init();
            
            const startTime = Date.now();
            
            // Perform multiple operations
            await adapter.getAllAccounts();
            await adapter.getAllProxies();
            await adapter.getAllFolders();
            await adapter.getSettings();
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            console.log(`    Performance: ${duration}ms for 4 operations`);
            
            if (duration > 1000) { // More than 1 second is concerning
                throw new Error(`Performance too slow: ${duration}ms`);
            }
            
            adapter.close();
        });
        
        // Test 5: Database Integrity (if SQLite)
        await this.runTest('Database Integrity Check', async () => {
            const adapter = new StorageAdapter();
            await adapter.init();
            
            if (adapter.isUsingSQLite()) {
                const storage = adapter.getStorage();
                const integrity = storage.db.pragma('integrity_check');
                
                if (integrity[0].integrity_check !== 'ok') {
                    throw new Error('Database integrity check failed');
                }
                
                console.log(`    Database integrity: ${integrity[0].integrity_check}`);
            } else {
                console.log('    Skipping (using JSON storage)');
            }
            
            adapter.close();
        });
        
        // Test 6: File System Check
        await this.runTest('File System Structure', async () => {
            const dataDir = mockApp.getPath('userData') + '/amac-data';
            
            if (!fs.existsSync(dataDir)) {
                throw new Error('Data directory does not exist');
            }
            
            const adapter = new StorageAdapter();
            await adapter.init();
            
            if (adapter.isUsingSQLite()) {
                const dbPath = path.join(dataDir, 'amac-database.db');
                if (!fs.existsSync(dbPath)) {
                    throw new Error('SQLite database file not found');
                }
                
                const stats = fs.statSync(dbPath);
                console.log(`    Database size: ${(stats.size / 1024).toFixed(2)} KB`);
            }
            
            adapter.close();
        });
        
        // Test 7: Migration Scripts Functionality
        await this.runTest('Migration Scripts Available', async () => {
            const migrationTools = require('./migration-tools');
            const dbInfo = require('./db-info');
            
            if (!migrationTools.forceMigration || !migrationTools.rollbackToJSON) {
                throw new Error('Migration tools not properly exported');
            }
            
            if (!dbInfo || typeof dbInfo !== 'function') {
                throw new Error('DB info script not properly exported');
            }
        });
        
        // Generate report
        this.generateReport();
    }
    
    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📋 MIGRATION VERIFICATION REPORT');
        console.log('='.repeat(60));
        
        const total = this.results.passed + this.results.failed;
        const passRate = ((this.results.passed / total) * 100).toFixed(1);
        
        console.log(`✅ Tests Passed: ${this.results.passed}`);
        console.log(`❌ Tests Failed: ${this.results.failed}`);
        console.log(`📊 Pass Rate: ${passRate}%`);
        
        if (this.results.failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.results.tests
                .filter(t => t.status === 'FAIL')
                .forEach(test => {
                    console.log(`   - ${test.name}: ${test.error}`);
                });
        }
        
        console.log('\n' + '='.repeat(60));
        
        if (this.results.failed === 0) {
            console.log('🎉 All tests passed! Migration is working perfectly.');
        } else {
            console.log('⚠️ Some tests failed. Please check the issues above.');
        }
        
        console.log('='.repeat(60));
    }
}

// Main execution
async function main() {
    const verifier = new MigrationVerifier();
    await verifier.verifyAll();
    
    process.exit(verifier.results.failed > 0 ? 1 : 0);
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    });
}

module.exports = MigrationVerifier; 