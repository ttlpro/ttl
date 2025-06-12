const { app, BrowserWindow } = require('electron');
const path = require('path');

async function testAllFunctions() {
    const mainWindow = new BrowserWindow({
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'main', 'preload.js')
        }
    });

    // Load the main page
    await mainWindow.loadFile('renderer/pages/index.html');

    console.log('🧪 Starting function tests...');

    try {
        // Test 1: Get folders
        console.log('\n📁 Testing getFolders...');
        const accountFolders = await mainWindow.webContents.executeJavaScript(`
            window.tiktokAPI.getFolders('accounts')
        `);
        console.log('✅ Account folders:', accountFolders?.accounts?.length || 0);

        const proxyFolders = await mainWindow.webContents.executeJavaScript(`
            window.tiktokAPI.getFolders('proxies')
        `);
        console.log('✅ Proxy folders:', proxyFolders?.proxies?.length || 0);

        // Test 2: Create account folder
        console.log('\n📁 Testing createFolder (accounts)...');
        const newAccountFolder = await mainWindow.webContents.executeJavaScript(`
            window.tiktokAPI.createFolder('accounts', {
                name: 'Test Account Folder',
                description: 'Test folder for accounts',
                color: '#FF5722'
            })
        `);
        console.log('✅ Created account folder:', newAccountFolder);

        // Test 3: Create proxy folder
        console.log('\n📁 Testing createFolder (proxies)...');
        const newProxyFolder = await mainWindow.webContents.executeJavaScript(`
            window.tiktokAPI.createFolder('proxies', {
                name: 'Test Proxy Folder',
                description: 'Test folder for proxies',
                color: '#4CAF50'
            })
        `);
        console.log('✅ Created proxy folder:', newProxyFolder);

        // Test 4: Add account
        console.log('\n👤 Testing addAccount...');
        const newAccount = await mainWindow.webContents.executeJavaScript(`
            window.tiktokAPI.addAccount({
                accountInfo: 'testuser123|password123|test@email.com|emailpass123',
                folderId: '${newAccountFolder.folder?.id || 'default'}'
            })
        `);
        console.log('✅ Created account:', newAccount);

        // Test 5: Add proxy
        console.log('\n🔗 Testing addProxy...');
        const newProxy = await mainWindow.webContents.executeJavaScript(`
            window.tiktokAPI.addProxy({
                proxyInfo: '1.2.3.4:8080:user:pass',
                folderId: '${newProxyFolder.folder?.id || 'default'}'
            })
        `);
        console.log('✅ Created proxy:', newProxy);

        // Test 6: Get accounts
        console.log('\n👥 Testing getAllAccounts...');
        const accounts = await mainWindow.webContents.executeJavaScript(`
            window.tiktokAPI.getAccounts()
        `);
        console.log('✅ Total accounts:', accounts?.length || 0);

        // Test 7: Get proxies
        console.log('\n🔗 Testing getAllProxies...');
        const proxies = await mainWindow.webContents.executeJavaScript(`
            window.tiktokAPI.getProxies()
        `);
        console.log('✅ Total proxies:', proxies?.length || 0);

        // Test 8: Set proxy for account (if both exist)
        if (accounts?.length > 0 && proxies?.length > 0) {
            console.log('\n🔗 Testing setProxyForAccounts...');
            const setProxyResult = await mainWindow.webContents.executeJavaScript(`
                window.tiktokAPI.setProxyForAccounts({
                    accountIds: ['${accounts[0].id}'],
                    selectedProxies: ['${proxies[0].id}'],
                    accountsPerProxy: 1
                })
            `);
            console.log('✅ Set proxy result:', setProxyResult);
        }

        // Test 9: Get settings
        console.log('\n⚙️ Testing getSettings...');
        const settings = await mainWindow.webContents.executeJavaScript(`
            window.tiktokAPI.getSettings()
        `);
        console.log('✅ Settings loaded:', Object.keys(settings || {}).length, 'items');

        // Test 10: Get rooms
        console.log('\n🏠 Testing getRooms...');
        const rooms = await mainWindow.webContents.executeJavaScript(`
            window.tiktokAPI.getRooms()
        `);
        console.log('✅ Total rooms:', rooms?.length || 0);

        console.log('\n🎉 All function tests completed successfully!');
        
        return {
            success: true,
            results: {
                accountFolders: accountFolders?.accounts?.length || 0,
                proxyFolders: proxyFolders?.proxies?.length || 0,
                accounts: accounts?.length || 0,
                proxies: proxies?.length || 0,
                rooms: rooms?.length || 0,
                settings: Object.keys(settings || {}).length
            }
        };

    } catch (error) {
        console.error('❌ Function test failed:', error);
        return { success: false, error: error.message };
    } finally {
        mainWindow.close();
    }
}

// Run tests if called directly
if (require.main === module) {
    app.whenReady().then(async () => {
        const result = await testAllFunctions();
        console.log('\n📊 Test Summary:', result);
        app.quit();
    });
}

module.exports = { testAllFunctions }; 