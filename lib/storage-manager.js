const fs = require('fs').promises;
const path = require('path');
const { app } = require('electron');
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');
const SocksProxyAgent = require('socks-proxy-agent');
const helper = require('../main/businesses/helper');
/**
 * Quản lý lưu trữ dữ liệu local cho ứng dụng
 */
class StorageManager {
    constructor() {
        // Đường dẫn thư mục dữ liệu
        this.dataDir = path.join(app.getPath('userData'), 'amac-data');
        this.accountsFile = path.join(this.dataDir, 'accounts.json');
        this.proxiesFile = path.join(this.dataDir, 'proxies.json');
        this.foldersFile = path.join(this.dataDir, 'folders.json');
        this.settingsFile = path.join(this.dataDir, 'settings.json');
        
        // Dữ liệu mặc định
        this.defaultFolders = {
            accounts: [
                {
                    id: 'default',
                    name: 'Mặc định',
                    description: 'Thư mục mặc định cho accounts',
                    color: '#6B7280',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ],
            proxies: [
                {
                    id: 'default',
                    name: 'Mặc định',
                    description: 'Thư mục mặc định cho proxies',
                    color: '#6B7280',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: 'premium',
                    name: 'Premium',
                    description: 'Proxy premium chất lượng cao',
                    color: '#10B981',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: 'datacenter',
                    name: 'Datacenter',
                    description: 'Proxy datacenter tốc độ cao',
                    color: '#3B82F6',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ]
        };
        
        this.defaultSettings = {
            theme: 'dark',
            language: 'vi',
            pageSize: 20,
            defaultAccountFormat: 'username|password|email|emailpass|cookie',
            defaultProxyFormat: 'ip:port:username:password'
        };
        
        // Khởi tạo
        this.init();
    }
    
    /**
     * Khởi tạo thư mục và file dữ liệu
     */
    async init() {
        try {
            // Tạo thư mục data nếu chưa có
            await fs.mkdir(this.dataDir, { recursive: true });
            
            // Khởi tạo các file dữ liệu nếu chưa có
            await this.initFile(this.foldersFile, this.defaultFolders);
            await this.initFile(this.accountsFile, []);
            await this.initFile(this.proxiesFile, []);
            await this.initFile(this.settingsFile, this.defaultSettings);
            
            console.log('Storage manager initialized at:', this.dataDir);
        } catch (error) {
            console.error('Error initializing storage:', error);
        }
    }
    
    /**
     * Khởi tạo file với dữ liệu mặc định nếu chưa tồn tại
     */
    async initFile(filePath, defaultData) {
        try {
            await fs.access(filePath);
        } catch (error) {
            // File chưa tồn tại, tạo mới
            await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
        }
    }
    
    /**
     * Đọc dữ liệu từ file
     */
    async readData(filePath) {
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading data from', filePath, error);
            return null;
        }
    }
    
    /**
     * Ghi dữ liệu vào file
     */
    async writeData(filePath, data) {
        try {
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('Error writing data to', filePath, error);
            return false;
        }
    }
    
    // =================
    // HELPER FUNCTIONS
    // =================
    
    /**
     * Trích xuất username từ accountInfo
     */
    extractUsername(accountInfo) {
        if (!accountInfo) return 'Unknown';
        
        const parts = accountInfo.split('|');
        return parts[0] ? parts[0].trim() : 'Unknown';
    }
    
    /**
     * Trích xuất host từ proxyInfo
     */
    extractProxyHost(proxyInfo) {
        if (!proxyInfo) return 'Unknown';
        
        try {
            // Remove any whitespace
            const proxy = proxyInfo.trim();
            
            // Handle format: username:password@ip:port
            if (proxy.includes('@')) {
                const parts = proxy.split('@');
                if (parts.length >= 2) {
                    const hostPart = parts[1]; // Get part after @
                    const hostPortParts = hostPart.split(':');
                    return hostPortParts[0] ? hostPortParts[0].trim() : 'Unknown';
                }
            }
            
            // Handle format: ip:port (no auth)
            const parts = proxy.split(':');
            if (parts.length >= 2) {
                // Check if first part looks like an IP address
                const firstPart = parts[0].trim();
                if (/^\d+\.\d+\.\d+\.\d+$/.test(firstPart)) {
                    return firstPart;
                }
            }
            
            // Fallback: return first part
            return parts[0] ? parts[0].trim() : 'Unknown';
            
        } catch (error) {
            console.error('Error extracting proxy host:', error);
            return 'Unknown';
        }
    }
    
    // =================
    // QUẢN LÝ THỬ MỤC
    // =================
    
    /**
     * Lấy tất cả thư mục
     */
    async getAllFolders() {
        return await this.readData(this.foldersFile) || this.defaultFolders;
    }
    
    /**
     * Tạo thư mục mới
     */
    async createFolder(type, folderData) {
        const folders = await this.getAllFolders();
        
        const newFolder = {
            id: Date.now().toString(),
            name: folderData.name,
            description: folderData.description || '',
            color: folderData.color || '#6B7280',
            createdAt: new Date().toISOString(),
            isDefault: false
        };
        
        if (type === 'accounts') {
            folders.accounts.push(newFolder);
        } else if (type === 'proxies') {
            folders.proxies.push(newFolder);
        }
        
        const success = await this.writeData(this.foldersFile, folders);
        return success ? { success: true, folder: newFolder } : { success: false };
    }
    
    /**
     * Xóa thư mục
     */
    async deleteFolder(type, folderId) {
        if (folderId === 'default') {
            return { success: false, error: 'Không thể xóa thư mục mặc định' };
        }
        
        const folders = await this.getAllFolders();
        
        if (type === 'accounts') {
            folders.accounts = folders.accounts.filter(f => f.id !== folderId);
            
            // Di chuyển tài khoản trong thư mục bị xóa về thư mục mặc định
            const accounts = await this.getAllAccounts();
            accounts.forEach(account => {
                if (account.folderId === folderId) {
                    account.folderId = 'default';
                }
            });
            await this.writeData(this.accountsFile, accounts);
            
        } else if (type === 'proxies') {
            folders.proxies = folders.proxies.filter(f => f.id !== folderId);
            
            // Di chuyển proxy trong thư mục bị xóa về thư mục mặc định
            const proxies = await this.getAllProxies();
            proxies.forEach(proxy => {
                if (proxy.folderId === folderId) {
                    proxy.folderId = 'default';
                }
            });
            await this.writeData(this.proxiesFile, proxies);
        }
        
        const success = await this.writeData(this.foldersFile, folders);
        return { success };
    }
    
    // =================
    // QUẢN LÝ TÀI KHOẢN
    // =================
    
    /**
     * Lấy tất cả tài khoản
     */
    async getAllAccounts() {
        return await this.readData(this.accountsFile) || [];
    }
    
    /**
     * Lấy tài khoản theo thư mục
     */
    async getAccountsByFolder(folderId) {
        const accounts = await this.getAllAccounts();
        return accounts.filter(account => account.folderId === folderId);
    }
    
    /**
     * Thêm tài khoản
     */
    async addAccount(accountData) {
        const accounts = await this.getAllAccounts();
        
        const newAccount = {
            id: Date.now().toString(),
            accountInfo: accountData.accountInfo,
            folderId: accountData.folderId || 'default',
            username: this.extractUsername(accountData.accountInfo),
            status: 'active',
            createdAt: new Date().toISOString(),
            lastUsed: null,
            notes: accountData.notes || '',
            currentRooms: 0, // Số lượng rooms đang xem
            activeRooms: [] // Danh sách ID của các rooms đang xem
        };
        
        accounts.push(newAccount);
        const success = await this.writeData(this.accountsFile, accounts);
        return success ? { success: true, account: newAccount } : { success: false };
    }
    
    /**
     * Xóa tài khoản
     */
    async deleteAccount(accountId) {
        const accounts = await this.getAllAccounts();
        const filteredAccounts = accounts.filter(account => account.id !== accountId);
        
        if (filteredAccounts.length === accounts.length) {
            return { success: false, error: 'Tài khoản không tồn tại' };
        }
        
        const success = await this.writeData(this.accountsFile, filteredAccounts);
        return { success };
    }
    
    /**
     * Cập nhật tài khoản
     */
    async updateAccount(id, updates) {
        const accounts = await this.getAllAccounts();
        const index = accounts.findIndex(acc => acc.id === id);
        
        if (index === -1) {
            return { success: false, message: 'Account not found' };
        }
        
        // Đảm bảo activeRooms luôn tồn tại
        if (!accounts[index].activeRooms) {
            accounts[index].activeRooms = [];
        }
        
        accounts[index] = { ...accounts[index], ...updates };
        
        // Cập nhật currentRooms dựa trên activeRooms nếu có thay đổi
        if (updates.activeRooms !== undefined) {
            accounts[index].currentRooms = updates.activeRooms.length;
        }
        
        const success = await this.writeData(this.accountsFile, accounts);
        return success ? { success: true, account: accounts[index] } : { success: false };
    }
    
    /**
     * Cập nhật thống kê tài khoản
     */
    async updateAccountStats(accountId, stats) {
        const accounts = await this.getAllAccounts();
        const accountIndex = accounts.findIndex(acc => acc.id === accountId);
        
        if (accountIndex !== -1) {
            const account = accounts[accountIndex];
            
            // Cập nhật thông tin cơ bản
            if (stats.status !== undefined) account.status = stats.status;
            if (stats.lastUsed !== undefined) account.lastUsed = stats.lastUsed;
            if (stats.notes !== undefined) account.notes = stats.notes;
            
            // Cập nhật danh sách rooms đang xem
            if (stats.activeRooms !== undefined) {
                account.activeRooms = Array.isArray(stats.activeRooms) ? stats.activeRooms : [];
                account.currentRooms = account.activeRooms.length;
            }
            
            const success = await this.writeData(this.accountsFile, accounts);
            return success ? { success: true, account: account } : { success: false };
        }
        
        return { success: false, error: 'Account not found' };
    }

    /**
     * Thêm room vào danh sách đang xem của account
     */
    async addAccountToRoom(accountId, roomId) {
        const accounts = await this.getAllAccounts();
        const accountIndex = accounts.findIndex(acc => acc.id === accountId);
        
        if (accountIndex !== -1) {
            const account = accounts[accountIndex];
            
            // Khởi tạo activeRooms nếu chưa có
            if (!Array.isArray(account.activeRooms)) {
                account.activeRooms = [];
            }
            
            // Thêm room nếu chưa có trong danh sách
            if (!account.activeRooms.includes(roomId)) {
                account.activeRooms.push(roomId);
                account.currentRooms = account.activeRooms.length;
                account.lastUsed = new Date().toISOString();
                
                const success = await this.writeData(this.accountsFile, accounts);
                return success ? { success: true, account: account } : { success: false };
            }
            
            return { success: true, account: account, message: 'Room already in list' };
        }
        
        return { success: false, error: 'Account not found' };
    }

    /**
     * Xóa room khỏi danh sách đang xem của account
     */
    async removeAccountFromRoom(accountId, roomId) {
        const accounts = await this.getAllAccounts();
        const accountIndex = accounts.findIndex(acc => acc.id === accountId);
        
        if (accountIndex !== -1) {
            const account = accounts[accountIndex];
            
            // Khởi tạo activeRooms nếu chưa có
            if (!Array.isArray(account.activeRooms)) {
                account.activeRooms = [];
            }
            
            // Xóa room khỏi danh sách
            const roomIndex = account.activeRooms.indexOf(roomId);
            if (roomIndex !== -1) {
                account.activeRooms.splice(roomIndex, 1);
                account.currentRooms = account.activeRooms.length;
                
                const success = await this.writeData(this.accountsFile, accounts);
                return success ? { success: true, account: account } : { success: false };
            }
            
            return { success: true, account: account, message: 'Room not in list' };
        }
        
        return { success: false, error: 'Account not found' };
    }

    /**
     * Xóa tất cả rooms khỏi danh sách đang xem của account
     */
    async clearAccountRooms(accountId) {
        const accounts = await this.getAllAccounts();
        const accountIndex = accounts.findIndex(acc => acc.id === accountId);
        
        if (accountIndex !== -1) {
            const account = accounts[accountIndex];
            account.activeRooms = [];
            account.currentRooms = 0;
            
            const success = await this.writeData(this.accountsFile, accounts);
            return success ? { success: true, account: account } : { success: false };
        }
        
        return { success: false, error: 'Account not found' };
    }

    /**
     * Lấy danh sách rooms mà account đang xem
     */
    async getAccountActiveRooms(accountId) {
        const accounts = await this.getAllAccounts();
        const account = accounts.find(acc => acc.id === accountId);
        
        if (account) {
            return {
                success: true,
                activeRooms: account.activeRooms || [],
                currentRooms: account.currentRooms || 0
            };
        }
        
        return { success: false, error: 'Account not found' };
    }

    /**
     * Lấy tất cả accounts đang xem một room cụ thể
     */
    async getAccountsInRoom(roomId) {
        const accounts = await this.getAllAccounts();
        const accountsInRoom = accounts.filter(account => 
            Array.isArray(account.activeRooms) && account.activeRooms.includes(roomId)
        );
        
        return {
            success: true,
            accounts: accountsInRoom,
            count: accountsInRoom.length
        };
    }
    
    // =================
    // QUẢN LÝ PROXY
    // =================
    
    /**
     * Lấy tất cả proxy
     */
    async getAllProxies() {
        return await this.readData(this.proxiesFile) || [];
    }
    
    /**
     * Lấy proxy theo folder
     */
    async getProxiesByFolder(folderId) {
        const proxies = await this.getAllProxies();
        
        // DEBUG: Log để troubleshoot
        console.log(`getProxiesByFolder called with folderId: ${folderId}`);
        console.log(`Total proxies: ${proxies.length}`);
        console.log('Proxy folder distribution:', proxies.reduce((acc, p) => {
            const folder = p.folderId || 'undefined';
            acc[folder] = (acc[folder] || 0) + 1;
            return acc;
        }, {}));
        
        // Fix: Migrate proxies thiếu folderId về 'default'
        let needUpdate = false;
        const fixedProxies = proxies.map(proxy => {
            if (!proxy.folderId) {
                console.log(`Fixing proxy ${proxy.id} - setting folderId to 'default'`);
                needUpdate = true;
                return { ...proxy, folderId: 'default' };
            }
            return proxy;
        });
        
        // Save back nếu có proxies cần fix
        if (needUpdate) {
            console.log('Updating proxies with fixed folderIds...');
            await this.writeData(this.proxiesFile, fixedProxies);
        }
        
        const result = fixedProxies.filter(proxy => proxy.folderId === folderId);
        console.log(`Filtered proxies for folder ${folderId}: ${result.length}`);
        
        return result;
    }
    
    /**
     * Thêm proxy
     */
    async addProxy(proxyData) {
        const proxies = await this.getAllProxies();
        
        const newProxy = {
            id: Date.now().toString(),
            proxyInfo: proxyData.proxyInfo,
            folderId: proxyData.folderId || 'default',
            host: this.extractProxyHost(proxyData.proxyInfo),
            status: 'active',
            createdAt: new Date().toISOString(),
            lastTested: null,
            latency: null,
            notes: proxyData.notes || ''
        };
        
        proxies.push(newProxy);
        const success = await this.writeData(this.proxiesFile, proxies);
        return success ? { success: true, proxy: newProxy } : { success: false };
    }
    
    /**
     * Xóa proxy
     */
    async deleteProxy(proxyId) {
        try {
            console.log(`Deleting proxy: ${proxyId}`);
            
            const proxies = await this.getAllProxies();
            const proxyToDelete = proxies.find(proxy => proxy.id === proxyId);
            
            if (!proxyToDelete) {
                console.log(`Proxy ${proxyId} not found`);
                return { success: false, error: 'Proxy không tồn tại' };
            }
            
            // Remove proxy from proxies array
            const filteredProxies = proxies.filter(proxy => proxy.id !== proxyId);
            const success = await this.writeData(this.proxiesFile, filteredProxies);
            
            if (!success) {
                return { success: false, error: 'Không thể xóa proxy khỏi database' };
            }
            
            // Remove proxy from accounts that are using it
            const accounts = await this.getAllAccounts();
            let accountsUpdated = 0;
            
            for (let i = 0; i < accounts.length; i++) {
                let needUpdate = false;
                
                // Cleanup tất cả các field proxy có thể
                if (accounts[i].proxyId === proxyId) {
                    accounts[i].proxyId = null;
                    needUpdate = true;
                }
                
                if (accounts[i].proxy_id === proxyId) {
                    accounts[i].proxy_id = null;
                    needUpdate = true;
                }
                
                if (accounts[i].proxyID === proxyId) {
                    accounts[i].proxyID = null;
                    needUpdate = true;
                }
                
                // Nếu proxy field chứa thông tin của proxy này
                if (accounts[i].proxy && proxyToDelete) {
                    const proxyHost = proxyToDelete.host || proxyToDelete.proxyInfo?.split(':')[0];
                    const proxyPort = proxyToDelete.port || proxyToDelete.proxyInfo?.split(':')[1];
                    
                    if (proxyHost && proxyPort && accounts[i].proxy.includes(`${proxyHost}:${proxyPort}`)) {
                        accounts[i].proxy = null;
                        needUpdate = true;
                    }
                }
                
                if (needUpdate) {
                    accounts[i].lastUpdated = new Date().toISOString();
                    accountsUpdated++;
                }
            }
            
            // Save updated accounts if any were using this proxy
            if (accountsUpdated > 0) {
                const accountsSaveSuccess = await this.writeData(this.accountsFile, accounts);
                console.log(`Removed proxy from ${accountsUpdated} accounts`);
                
                if (!accountsSaveSuccess) {
                    console.warn('Failed to update accounts after proxy deletion');
                }
            }
            
            console.log(`Proxy ${proxyId} deleted successfully. Updated ${accountsUpdated} accounts.`);
            return { 
                success: true, 
                message: `Đã xóa proxy thành công${accountsUpdated > 0 ? ` và cập nhật ${accountsUpdated} tài khoản` : ''}`,
                accountsUpdated 
            };
            
        } catch (error) {
            console.error('Error deleting proxy:', error);
            return { success: false, error: `Lỗi khi xóa proxy: ${error.message}` };
        }
    }
    
    /**
     * Cập nhật proxy
     */
    async updateProxy(proxyId, updates) {
        const proxies = await this.getAllProxies();
        const proxyIndex = proxies.findIndex(proxy => proxy.id === proxyId);
        
        if (proxyIndex === -1) {
            return { success: false, error: 'Proxy không tồn tại' };
        }
        
        proxies[proxyIndex] = { ...proxies[proxyIndex], ...updates };
        const success = await this.writeData(this.proxiesFile, proxies);
        return success ? { success: true, proxy: proxies[proxyIndex] } : { success: false };
    }
    
    /**
     * Test proxy (thực tế, không random)
     */
    async testProxy(proxyId) {
        const proxies = await this.getAllProxies();
        const proxy = proxies.find(p => p.id === proxyId);
        if (!proxy) {
            return { success: false, error: 'Proxy không tồn tại' };
        }
        // Lấy thông tin proxy
        const { host, port, username, password, type = 'http' } = proxy;
        let proxyUrl = '';
        let agent = null;
        let protocol = (type || '').toLowerCase();
        if (!host || !port) {
            await this.updateProxy(proxyId, {
                lastTested: new Date().toISOString(),
                latency: null,
                status: 'inactive'
            });
            return { success: false, error: 'Proxy thiếu host hoặc port' };
        }
        // Xây dựng proxy url
        if (protocol.startsWith('socks')) {
            proxyUrl = `${protocol}://${username && password ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@` : ''}${host}:${port}`;
            agent = new SocksProxyAgent.SocksProxyAgent(proxyUrl);
        } else {
            // http, https
            proxyUrl = `${protocol}://${username && password ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@` : ''}${host}:${port}`;
            agent = new HttpsProxyAgent.HttpsProxyAgent(proxyUrl);
        }
        const testUrl = 'https://api.ipify.org?format=json';
        const start = Date.now();
        let status = 'inactive';
        let latency = null;
        let errorMsg = null;
        try {
            const response = await axios.get(testUrl, {
                httpAgent: agent,
                httpsAgent: agent,
                timeout: 8000,
                validateStatus: s => s >= 200 && s < 300
            });
            latency = Date.now() - start + 'ms';
            if (response && response.data && response.data.ip) {
                status = 'active';
            } else {
                status = 'inactive';
                errorMsg = 'Không nhận được IP từ proxy';
            }
        } catch (err) {
            status = 'inactive';
            errorMsg = err.message || 'Lỗi không xác định';
        }
        await this.updateProxy(proxyId, {
            lastTested: new Date().toISOString(),
            latency: status === 'active' ? latency : null,
            status
        });
        return {
            success: status === 'active',
            result: {
                latency,
                status,
                testTime: new Date().toISOString(),
                error: errorMsg
            }
        };
    }
    
    // =================
    // QUẢN LÝ CÀI ĐẶT
    // =================
    
    /**
     * Lấy cài đặt
     */
    async getSettings() {
        return await this.readData(this.settingsFile) || this.defaultSettings;
    }
    
    /**
     * Lưu cài đặt
     */
    async saveSettings(settings) {
        const success = await this.writeData(this.settingsFile, settings);
        return { success };
    }
    
    /**
     * Reset cài đặt về mặc định
     */
    async resetSettings() {
        const success = await this.writeData(this.settingsFile, this.defaultSettings);
        return { success };
    }
    
    // =================
    // QUẢN LÝ PHÒNG LIVE
    // =================
    
    /**
     * Lấy tất cả phòng live
     */
    async getAllRooms() {
        const roomsFile = path.join(this.dataDir, 'rooms.json');
        await this.initFile(roomsFile, []);
        return await this.readData(roomsFile) || [];
    }
    
    /**
     * Thêm phòng live
     */
    async addRoom(roomData) {
        const roomsFile = path.join(this.dataDir, 'rooms.json');
        const rooms = await this.getAllRooms();
        
        // Extract room ID từ input
        let roomId = roomData.roomUrl.trim();
        
        // Nếu là URL TikTok, chỉ lấy username
        if (roomData.roomUrl.includes('tiktok.com')) {
            // Extract từ format @username/live
            const usernameMatch = roomData.roomUrl.match(/@([^\/]+)\/live/);
            if (usernameMatch) {
                roomId = usernameMatch[1]; // Chỉ lấy username
            } else {
                // Fallback: extract từ các format khác nếu có
                const urlMatch = roomData.roomUrl.match(/\/live\/(\w+)/);
                if (urlMatch) {
                    roomId = urlMatch[1];
                }
            }
        }
        // Nếu không phải URL, giữ nguyên input (đó chính là room_id)
        let avatarThumb = null;
        let roomUsername = roomId;
        let roomStatus = 2;
        let startCount = 0;
        if(!helper.isNumeric(roomId)){
            let dataUser = await helper.getRoomId3({name: roomId})
            console.log(dataUser.data.user.avatarThumb)
            console.log(dataUser.data.user.roomId)
            console.log(dataUser.data.user.status)
            if(dataUser && dataUser.data && dataUser.data.user && dataUser.data.user.roomId){
                roomId = dataUser.data.user.roomId;
            }
            if(dataUser && dataUser.data && dataUser.data.user && dataUser.data.user.status){
                roomStatus = dataUser.data.user.status;
            }
            if(dataUser && dataUser.data && dataUser.data.user && dataUser.data.user.avatarThumb){
                avatarThumb = dataUser.data.user.avatarThumb;
            }
        }
        let dataRoom = await helper.getRoomInfo4({room_id: roomId})
        if(dataRoom && dataRoom.display_id){
            roomUsername = dataRoom.display_id;
        }
        if(dataRoom && !dataRoom.is_alive){
            roomStatus = 4;
        }
        if(dataRoom && dataRoom.view_count){
            startCount = dataRoom.view_count;
        }
        if(dataRoom && dataRoom.avatarThumb){
            avatarThumb = dataRoom.avatarThumb;
        }
        
        if(roomStatus != 2){
            return { success: false, error: 'Phòng live đã kết thúc' };
        }
        const newRoom = {
            id: Date.now().toString(), // UID duy nhất cho mỗi room
            roomId: roomId, // room_id có thể trùng nhau - lưu chuỗi thuần hoặc username
            roomUrl: roomData.roomUrl, // Lưu nguyên input của user
            avatarThumb: avatarThumb,
            roomUsername: roomUsername,
            startCount: startCount,
            targetViewers: roomData.accountCount || 1,
            currentViewers: 0,
            duration: roomData.duration || 5,
            note: roomData.note || '',
            accounts: roomData.accounts || [],
            status: 'watching',
            createdAt: new Date().toISOString(),
            startedAt: new Date().toISOString(),
            endedAt: null
        };
        
        rooms.push(newRoom);
        const success = await this.writeData(roomsFile, rooms);
        
        // Cập nhật activeRooms cho các accounts được chọn
        if (success && roomData.accounts && roomData.accounts.length > 0) {
            const accounts = await this.getAllAccounts();
            const selectedAccountIds = roomData.accounts.map(acc => acc.id);
            
            for (const accountId of selectedAccountIds) {
                const accountIndex = accounts.findIndex(acc => acc.id === accountId);
                if (accountIndex !== -1) {
                    // Khởi tạo activeRooms nếu chưa có
                    if (!Array.isArray(accounts[accountIndex].activeRooms)) {
                        accounts[accountIndex].activeRooms = [];
                    }
                    
                    // Thêm room_id (chuỗi thuần hoặc username) vào activeRooms nếu chưa có
                    if (!accounts[accountIndex].activeRooms.includes(roomId)) {
                        accounts[accountIndex].activeRooms.push(roomId);
                    }
                    
                    // Cập nhật currentRooms và lastUsed
                    accounts[accountIndex].currentRooms = accounts[accountIndex].activeRooms.length;
                    accounts[accountIndex].lastUsed = new Date().toISOString();
                }
            }
            
            // Lưu lại thông tin accounts đã cập nhật
            await this.writeData(this.accountsFile, accounts);
        }
        
        return success ? { success: true, room: newRoom, roomId: newRoom.id } : { success: false };
    }
    
    /**
     * Xóa phòng live
     */
    async deleteRoom(roomUid) {
        const roomsFile = path.join(this.dataDir, 'rooms.json');
        const rooms = await this.getAllRooms();
        
        // Tìm room cần xóa để lấy thông tin room_id
        const roomToDelete = rooms.find(room => room.id === roomUid);
        
        const updatedRooms = rooms.filter(room => room.id !== roomUid);
        const success = await this.writeData(roomsFile, updatedRooms);
        
        // Xóa room_id khỏi activeRooms của các accounts đã tham gia
        if (success && roomToDelete && roomToDelete.accounts && roomToDelete.accounts.length > 0) {
            const accounts = await this.getAllAccounts();
            const roomAccountIds = roomToDelete.accounts.map(acc => acc.id);
            
            for (const accountId of roomAccountIds) {
                const accountIndex = accounts.findIndex(acc => acc.id === accountId);
                if (accountIndex !== -1) {
                    // Xóa room_id khỏi activeRooms
                    if (Array.isArray(accounts[accountIndex].activeRooms)) {
                        accounts[accountIndex].activeRooms = accounts[accountIndex].activeRooms.filter(
                            rId => rId !== roomToDelete.roomId
                        );
                        accounts[accountIndex].currentRooms = accounts[accountIndex].activeRooms.length;
                    }
                }
            }
            
            // Lưu lại thông tin accounts đã cập nhật
            await this.writeData(this.accountsFile, accounts);
        }
        
        return success;
    }
    
    /**
     * Cập nhật phòng live
     */
    async updateRoom(roomUid, updates) {
        const roomsFile = path.join(this.dataDir, 'rooms.json');
        const rooms = await this.getAllRooms();
        const roomIndex = rooms.findIndex(room => room.id === roomUid);
        
        if (roomIndex === -1) {
            return { success: false, error: 'Phòng live không tồn tại' };
        }
        
        const currentRoom = rooms[roomIndex];
        
        // Nếu dừng room, set ended time và xóa room_id khỏi activeRooms của accounts
        if (updates.status === 'stopped' && currentRoom.status === 'watching') {
            updates.endedAt = new Date().toISOString();
            
            // Xóa room_id khỏi activeRooms của các accounts trong room bị dừng
            if (currentRoom.accounts && currentRoom.accounts.length > 0) {
                const accounts = await this.getAllAccounts();
                const roomAccountIds = currentRoom.accounts.map(acc => acc.id);
                
                for (const accountId of roomAccountIds) {
                    const accountIndex = accounts.findIndex(acc => acc.id === accountId);
                    if (accountIndex !== -1) {
                        // Xóa room_id khỏi activeRooms
                        if (Array.isArray(accounts[accountIndex].activeRooms)) {
                            accounts[accountIndex].activeRooms = accounts[accountIndex].activeRooms.filter(
                                rId => rId !== currentRoom.roomId
                            );
                            accounts[accountIndex].currentRooms = accounts[accountIndex].activeRooms.length;
                        }
                    }
                }
                
                // Lưu lại thông tin accounts đã cập nhật
                await this.writeData(this.accountsFile, accounts);
            }
        }
        
        rooms[roomIndex] = { ...rooms[roomIndex], ...updates };
        const success = await this.writeData(roomsFile, rooms);
        return success ? { success: true, room: rooms[roomIndex] } : { success: false };
    }

    /**
     * Xóa tất cả activeRooms của tất cả accounts
     */
    async clearAllAccountRooms() {
        try {
            const accounts = await this.getAllAccounts();
            let affectedAccounts = 0;
            
            for (const account of accounts) {
                if (Array.isArray(account.activeRooms) && account.activeRooms.length > 0) {
                    account.activeRooms = [];
                    account.currentRooms = 0;
                    affectedAccounts++;
                }
            }
            
            const success = await this.writeData(this.accountsFile, accounts);
            return { 
                success: success, 
                affectedAccounts: affectedAccounts,
                message: `Cleared activeRooms for ${affectedAccounts} accounts`
            };
        } catch (error) {
            console.error('Error clearing all account rooms:', error);
            return { success: false, error: error.message };
        }
    }

    // =================
    // BULK OPERATIONS
    // =================
    
    /**
     * Debug function để kiểm tra proxy data
     */
    async debugProxyData(proxyFolderId) {
        try {
            console.log('=== DEBUG PROXY DATA ===');
            console.log('Requested folder ID:', proxyFolderId);
            
            const allProxies = await this.getAllProxies();
            console.log('Total proxies in database:', allProxies.length);
            console.log('All proxies:', allProxies);
            
            const folderProxies = await this.getProxiesByFolder(proxyFolderId);
            console.log('Proxies in folder:', folderProxies.length);
            console.log('Folder proxies:', folderProxies);
            
            const folders = await this.getAllFolders();
            console.log('Available proxy folders:', folders.proxies);
            
            return {
                totalProxies: allProxies.length,
                folderProxies: folderProxies.length,
                allProxies,
                folderProxies,
                folders: folders.proxies
            };
        } catch (error) {
            console.error('Debug error:', error);
            return { error: error.message };
        }
    }

    /**
     * Bulk set proxy cho nhiều accounts
     */
    async bulkSetProxy(accountIds, proxyFolderId, accountsPerProxy = 1) {
        try {
            console.log('=== BULK SET PROXY DEBUG ===');
            console.log('Account IDs:', accountIds);
            console.log('Proxy Folder ID:', proxyFolderId);
            console.log('Accounts per proxy:', accountsPerProxy);
            
            const accounts = await this.getAllAccounts();
            const allProxies = await this.getProxiesByFolder(proxyFolderId);
            const settings = await this.getSettings();
            const maxAccountsPerProxy = settings.maxAccountsPerProxy || 10;
            
            console.log('Total accounts:', accounts.length);
            console.log('Proxies in folder:', allProxies.length);
            console.log('Max accounts per proxy:', maxAccountsPerProxy);
            
            if (allProxies.length === 0) {
                // Debug thêm thông tin
                const debugInfo = await this.debugProxyData(proxyFolderId);
                console.log('Debug proxy data:', debugInfo);
                
                return { 
                    success: false, 
                    error: 'Không có proxy trong thư mục được chọn. Hãy kiểm tra console để xem debug info.',
                    debug: debugInfo
                };
            }
            
            // Đếm số account hiện tại đã gán cho mỗi proxy
            const proxyUsageCount = {};
            accounts.forEach(account => {
                if (account.proxyId) {
                    proxyUsageCount[account.proxyId] = (proxyUsageCount[account.proxyId] || 0) + 1;
                }
            });
            
            // Lọc ra những proxy có thể sử dụng (chưa đạt giới hạn tối đa)
            const availableProxies = allProxies.filter(proxy => {
                const currentUsage = proxyUsageCount[proxy.id] || 0;
                const remainingSlots = maxAccountsPerProxy - currentUsage;
                return remainingSlots > 0;
            });
            
            if (availableProxies.length === 0) {
                return { 
                    success: false, 
                    error: `Tất cả proxy trong thư mục đã đạt giới hạn tối đa ${maxAccountsPerProxy} account` 
                };
            }
            
            // Sắp xếp proxy theo số lượng account hiện tại (ưu tiên proxy ít account nhất)
            availableProxies.sort((a, b) => {
                const usageA = proxyUsageCount[a.id] || 0;
                const usageB = proxyUsageCount[b.id] || 0;
                return usageA - usageB;
            });
            
            let updated = 0;
            let proxyIndex = 0;
            let accountsAssignedToCurrentProxy = 0;
            const maxAccountsCanAssign = accountsPerProxy;
            
            // Tính toán proxy hiện tại có thể nhận bao nhiều account nữa
            let currentProxyRemainingSlots = maxAccountsPerProxy - (proxyUsageCount[availableProxies[proxyIndex].id] || 0);
            
            for (const accountId of accountIds) {
                console.log(`🔄 Processing account: ${accountId}`);
                
                const accountIndex = accounts.findIndex(acc => acc.id === accountId);
                if (accountIndex === -1) {
                    console.log(`❌ Account not found: ${accountId}`);
                    continue;
                }
                
                console.log(`✅ Found account ${accountId}, assigning proxy...`);
                
                // Kiểm tra proxy capacity
                if (accountsAssignedToCurrentProxy >= maxAccountsCanAssign || 
                    accountsAssignedToCurrentProxy >= currentProxyRemainingSlots) {
                    console.log(`❌ Proxy full! Moving to next proxy...`);
                    // Logic chuyển proxy
                    proxyIndex++;
                    if (proxyIndex >= availableProxies.length) {
                        // Hết proxy khả dụng, dừng lại
                        break;
                    }
                    
                    accountsAssignedToCurrentProxy = 0;
                    currentProxyRemainingSlots = maxAccountsPerProxy - (proxyUsageCount[availableProxies[proxyIndex].id] || 0);
                }
                
                // Assignment
                const oldProxyId = accounts[accountIndex].proxyId;
                accounts[accountIndex].proxyId = availableProxies[proxyIndex].id;
                console.log(`✅ Assigned proxy ${availableProxies[proxyIndex].id} to account ${accountId}`);
                
                accountsAssignedToCurrentProxy++;
                updated++;
                console.log(`📊 Total assigned so far: ${updated}`);
            }
            
            const success = await this.writeData(this.accountsFile, accounts);
            
            // Tạo báo cáo chi tiết
            const report = {
                success,
                updated,
                totalRequested: accountIds.length,
                availableProxies: availableProxies.length,
                totalProxies: allProxies.length,
                maxAccountsPerProxy,
                accountsPerProxy: maxAccountsCanAssign
            };
            
            if (updated < accountIds.length) {
                report.warning = `Chỉ gán được ${updated}/${accountIds.length} account do giới hạn proxy`;
            }
            
            report.message = `Đã gán proxy cho ${updated}/${accountIds.length} tài khoản`;
            
            return report;
        } catch (error) {
            console.error('Error in bulkSetProxy:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Bulk remove proxy từ nhiều accounts
     */
    async bulkRemoveProxy(accountIds) {
        try {
            const accounts = await this.getAllAccounts();
            let updated = 0;
            
            for (const accountId of accountIds) {
                const accountIndex = accounts.findIndex(acc => acc.id === accountId);
                if (accountIndex !== -1) {
                    accounts[accountIndex].proxyId = null;
                    updated++;
                }
            }
            
            const success = await this.writeData(this.accountsFile, accounts);
            return { 
                success, 
                updated,
                message: `Đã xóa proxy khỏi ${updated} tài khoản`
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Bulk set status cho nhiều accounts
     */
    async bulkSetStatus(accountIds, status) {
        try {
            const accounts = await this.getAllAccounts();
            let updated = 0;
            
            for (const accountId of accountIds) {
                const accountIndex = accounts.findIndex(acc => acc.id === accountId);
                if (accountIndex !== -1) {
                    accounts[accountIndex].status = status;
                    updated++;
                }
            }
            
            const success = await this.writeData(this.accountsFile, accounts);
            return { 
                success, 
                updated,
                message: `Đã cập nhật trạng thái cho ${updated} tài khoản`
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Bulk move accounts to folder
     */
    async bulkMoveToFolder(accountIds, folderId) {
        try {
            const accounts = await this.getAllAccounts();
            let updated = 0;
            
            for (const accountId of accountIds) {
                const accountIndex = accounts.findIndex(acc => acc.id === accountId);
                if (accountIndex !== -1) {
                    accounts[accountIndex].folderId = folderId;
                    updated++;
                }
            }
            
            const success = await this.writeData(this.accountsFile, accounts);
            return { 
                success, 
                updated,
                message: `Đã chuyển ${updated} tài khoản sang thư mục mới`
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Bulk test proxies
     */
    async bulkTestProxies(proxyIds) {
        try {
            const results = [];
            let successful = 0;
            let failed = 0;
            
            for (const proxyId of proxyIds) {
                const result = await this.testProxy(proxyId);
                results.push({
                    proxyId,
                    success: result.success,
                    result: result.result
                });
                
                if (result.success) {
                    successful++;
                } else {
                    failed++;
                }
            }
            
            return {
                success: true,
                results,
                summary: {
                    total: proxyIds.length,
                    successful,
                    failed
                },
                message: `Đã test ${proxyIds.length} proxy: ${successful} thành công, ${failed} thất bại`
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Bulk move proxies to folder
     */
    async bulkMoveProxiesToFolder(proxyIds, folderId) {
        try {
            const proxies = await this.getAllProxies();
            let updated = 0;
            
            for (const proxyId of proxyIds) {
                const proxyIndex = proxies.findIndex(proxy => proxy.id === proxyId);
                if (proxyIndex !== -1) {
                    proxies[proxyIndex].folderId = folderId;
                    updated++;
                }
            }
            
            const success = await this.writeData(this.proxiesFile, proxies);
            return { 
                success, 
                updated,
                message: `Đã chuyển ${updated} proxy sang thư mục mới`
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Check account activity status
     */
    async checkAccountActivity(accountIds) {
        try {
            const accounts = await this.getAllAccounts();
            const results = [];
            
            for (const accountId of accountIds) {
                const account = accounts.find(acc => acc.id === accountId);
                if (account) {
                    results.push({
                        accountId,
                        username: account.username,
                        status: account.status,
                        currentRooms: account.currentRooms || 0,
                        activeRooms: account.activeRooms || [],
                        lastUsed: account.lastUsed
                    });
                }
            }
            
            return {
                success: true,
                results,
                message: `Đã kiểm tra hoạt động của ${results.length} tài khoản`            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Export accounts to text
     */
    async exportAccountsToText(format, accountIds, folderId) {
        try {
            let accounts = [];
            
            if (accountIds && accountIds.length > 0) {
                // Export selected accounts
                const allAccounts = await this.getAllAccounts();
                accounts = allAccounts.filter(acc => accountIds.includes(acc.id));
            } else if (folderId) {
                // Export all accounts in folder
                accounts = await this.getAccountsByFolder(folderId);
            } else {
                // Export all accounts
                accounts = await this.getAllAccounts();
            }
            
            let exportData = '';
            
            for (const account of accounts) {
                switch (format) {
                    case 'username_password':
                        const parts = account.accountInfo.split('|');
                        exportData += `${parts[0] || ''}|${parts[1] || ''}\n`;
                        break;
                    case 'full_info':
                        exportData += `${account.accountInfo}\n`;
                        break;
                    case 'username_only':
                        exportData += `${account.username}\n`;
                        break;
                    default:
                        exportData += `${account.accountInfo}\n`;
                }
            }
            
            return {
                success: true,
                data: exportData.trim(),
                count: accounts.length,
                message: `Đã export ${accounts.length} tài khoản`
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Export proxies to text
     */
    async exportProxies(format, proxyIds) {
        try {
            let proxies = [];
            
            if (proxyIds && proxyIds.length > 0) {
                // Export selected proxies
                const allProxies = await this.getAllProxies();
                proxies = allProxies.filter(proxy => proxyIds.includes(proxy.id));
            } else {
                // Export all proxies
                proxies = await this.getAllProxies();
            }
            
            let exportData = '';
            
            for (const proxy of proxies) {
                switch (format) {
                    case 'ip_port':
                        const parts = proxy.proxyInfo.split(':');
                        exportData += `${parts[0] || ''}:${parts[1] || ''}\n`;
                        break;
                    case 'full_info':
                        exportData += `${proxy.proxyInfo}\n`;
                        break;
                    case 'host_only':
                        exportData += `${proxy.host}\n`;
                        break;
                    default:
                        exportData += `${proxy.proxyInfo}\n`;
                }
            }
            
            return {
                success: true,
                data: exportData.trim(),
                count: proxies.length,
                message: `Đã export ${proxies.length} proxy`
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Parse account info thành từng field riêng biệt
     */
    parseAccountInfo(accountInfo) {
        const parts = accountInfo.split('|');
        return {
            username: parts[0] ? parts[0].trim() : '',
            password: parts[1] ? parts[1].trim() : '',
            email: parts[2] ? parts[2].trim() : '',
            emailPassword: parts[3] ? parts[3].trim() : '',
            cookie: parts[4] ? parts[4].trim() : ''
        };
    }

    /**
     * Import accounts từ text
     */
    async importAccountsFromText(text, folderId = 'default') {
        const lines = text.split('\n').filter(line => line.trim());
        const accounts = await this.getAllAccounts();
        let imported = 0;
        
        for (const line of lines) {
            const accountInfo = line.trim();
            if (accountInfo) {
                // Parse từng field riêng biệt
                const parsed = this.parseAccountInfo(accountInfo);
                
                const newAccount = {
                    id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
                    accountInfo: accountInfo, // Giữ lại chuỗi gốc để tương thích
                    folderId: folderId,
                    // Các field riêng biệt được parse
                    username: parsed.username,
                    password: parsed.password,
                    email: parsed.email,
                    emailPassword: parsed.emailPassword,
                    cookie: parsed.cookie,
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    lastUsed: null,
                    notes: '',
                    currentRooms: 0,
                    activeRooms: []
                };
                
                accounts.push(newAccount);
                imported++;
            }
        }
        
        const success = await this.writeData(this.accountsFile, accounts);
        return {
            success: success,
            imported: imported,
            total: lines.length
        };
    }
    
    /**
     * Import proxies từ text
     */
    async importProxiesFromText(text, folderId = 'default') {
        const lines = text.split('\n').filter(line => line.trim());
        const proxies = await this.getAllProxies();
        let imported = 0;
        
        for (const line of lines) {
            const proxyInfo = line.trim();
            if (proxyInfo) {
                const newProxy = {
                    id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
                    proxyInfo: proxyInfo,
                    folderId: folderId,
                    host: this.extractProxyHost(proxyInfo),
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    lastTested: null,
                    latency: null,
                    notes: ''
                };
                
                proxies.push(newProxy);
                imported++;
            }
        }
        
        const success = await this.writeData(this.proxiesFile, proxies);
        return {
            success: success,
            imported: imported,
            total: lines.length
        };
    }

    // Force reset folders data
    async resetFoldersData() {
        try {
            await this.ensureDataDirectory();
            const foldersPath = path.join(this.dataDir, 'folders.json');
            await fs.writeFile(foldersPath, JSON.stringify(this.defaultFolders, null, 2), 'utf8');
            console.log('✅ Folders data reset successfully');
            return this.defaultFolders;
        } catch (error) {
            console.error('❌ Error resetting folders data:', error);
            throw error;
        }
    }

    /**
     * Thêm entry vào viewer history của room
     */
    async addViewerHistoryEntry(roomUid, viewerData) {
        try {
            const historyDir = path.join(this.dataDir, 'room-viewer-history');
            await fs.mkdir(historyDir, { recursive: true });
            
            const historyFile = path.join(historyDir, `${roomUid}.json`);
            
            // Đọc file history hiện tại hoặc tạo mới
            let historyData;
            try {
                const data = await fs.readFile(historyFile, 'utf8');
                historyData = JSON.parse(data);
            } catch (error) {
                // File chưa tồn tại, tạo mới
                const rooms = await this.getAllRooms();
                const room = rooms.find(r => r.id === roomUid);
                
                historyData = {
                    roomInfo: {
                        roomUid: roomUid,
                        roomId: room?.roomId || '',
                        roomUsername: room?.roomUsername || ''
                    },
                    settings: {
                        retentionDays: 7 // Default 7 ngày
                    },
                    history: []
                };
                
                // Thêm điểm bắt đầu từ startCount
                if (room?.startCount !== undefined && room?.startedAt) {
                    historyData.history.push({
                        timestamp: room.startedAt,
                        viewers: room.startCount,
                        isAlive: true,
                        note: 'start_point'
                    });
                }
            }
            
            // Thêm entry mới
            historyData.history.push({
                timestamp: viewerData.timestamp,
                viewers: viewerData.viewers,
                isAlive: viewerData.isAlive || true
            });
            
            // Cleanup records cũ hơn X ngày
            const retentionMs = historyData.settings.retentionDays * 24 * 60 * 60 * 1000;
            const cutoffDate = new Date(Date.now() - retentionMs);
            
            historyData.history = historyData.history.filter(entry => 
                new Date(entry.timestamp) > cutoffDate
            );
            
            // Ghi file
            await fs.writeFile(historyFile, JSON.stringify(historyData, null, 2));
            
            return { success: true, totalEntries: historyData.history.length };
            
        } catch (error) {
            console.error('Error adding viewer history entry:', error);
            return { success: false, errorCode: 'WRITE_FAILED', error: error.message };
        }
    }

    /**
     * Lấy lịch sử viewers của room
     */
    async getRoomViewerHistory(roomUid, days = null) {
        try {
            const historyFile = path.join(this.dataDir, 'room-viewer-history', `${roomUid}.json`);
            
            try {
                const data = await fs.readFile(historyFile, 'utf8');
                const historyData = JSON.parse(data);
                
                let history = historyData.history || [];
                
                // Filter theo số ngày nếu có
                if (days) {
                    const cutoffDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
                    history = history.filter(entry => new Date(entry.timestamp) > cutoffDate);
                }
                
                return {
                    success: true,
                    roomInfo: historyData.roomInfo,
                    settings: historyData.settings,
                    history: history,
                    totalEntries: history.length
                };
                
            } catch (error) {
                // File không tồn tại
                return { 
                    success: true, 
                    history: [], 
                    totalEntries: 0,
                    roomInfo: { roomUid }
                };
            }
            
        } catch (error) {
            console.error('Error getting room viewer history:', error);
            return { success: false, errorCode: 'READ_FAILED', error: error.message };
        }
    }

    /**
     * Cleanup viewer history files cho rooms đã bị xóa
     */
    async cleanupViewerHistoryFiles() {
        try {
            const historyDir = path.join(this.dataDir, 'room-viewer-history');
            const rooms = await this.getAllRooms();
            const activeRoomUids = new Set(rooms.map(r => r.id));
            
            const files = await fs.readdir(historyDir);
            let cleanedCount = 0;
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const roomUid = file.replace('.json', '');
                    if (!activeRoomUids.has(roomUid)) {
                        await fs.unlink(path.join(historyDir, file));
                        cleanedCount++;
                    }
                }
            }
            
            return { success: true, cleanedFiles: cleanedCount };
            
        } catch (error) {
            console.error('Error cleaning up viewer history files:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = StorageManager;

