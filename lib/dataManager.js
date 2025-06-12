const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');

class DataManager {
    constructor() {
        // Thư mục chứa dữ liệu của ứng dụng
        this.dataDir = path.join(app.getPath('userData'), 'data');
        this.accountsDir = path.join(this.dataDir, 'accounts');
        this.proxiesDir = path.join(this.dataDir, 'proxies');
        this.configDir = path.join(this.dataDir, 'config');
        
        // File cấu hình
        this.accountFoldersFile = path.join(this.configDir, 'account_folders.json');
        this.proxyFoldersFile = path.join(this.configDir, 'proxy_folders.json');
        this.settingsFile = path.join(this.configDir, 'settings.json');
        
        // Khởi tạo các biến dữ liệu
        this.accountFolders = [];
        this.proxyFolders = [];
        this.settings = {};
        
        // Đảm bảo thư mục dữ liệu tồn tại
        this.ensureDataDirectories();
    }
    
    /**
     * Khởi tạo các thư mục dữ liệu
     */
    async ensureDataDirectories() {
        const dirs = [this.dataDir, this.accountsDir, this.proxiesDir, this.configDir];
        
        for (const dir of dirs) {
            try {
                await fs.access(dir);
            } catch (err) {
                // Thư mục không tồn tại, tạo mới
                await fs.mkdir(dir, { recursive: true });
            }
        }
        
        // Khởi tạo tệp cấu hình mặc định nếu chưa tồn tại
        await this.initConfigFiles();
    }
    
    /**
     * Khởi tạo các file cấu hình mặc định
     */
    async initConfigFiles() {
        // Khởi tạo danh sách thư mục tài khoản
        try {
            await fs.access(this.accountFoldersFile);
            // Đọc dữ liệu từ file nếu đã tồn tại
            this.accountFolders = JSON.parse(await fs.readFile(this.accountFoldersFile, 'utf8'));
        } catch (err) {
            // Tạo thư mục mặc định nếu chưa có file
            this.accountFolders = [{
                id: 'default',
                name: 'Mặc định',
                description: 'Thư mục mặc định',
                createdAt: new Date().toISOString(),
                isDefault: true
            }];
            await this.saveAccountFolders();
        }
        
        // Khởi tạo danh sách thư mục proxy
        try {
            await fs.access(this.proxyFoldersFile);
            this.proxyFolders = JSON.parse(await fs.readFile(this.proxyFoldersFile, 'utf8'));
        } catch (err) {
            this.proxyFolders = [{
                id: 'default',
                name: 'Mặc định',
                description: 'Thư mục proxy mặc định',
                createdAt: new Date().toISOString(),
                isDefault: true
            }];
            await this.saveProxyFolders();
        }
        
        // Khởi tạo cài đặt
        try {
            await fs.access(this.settingsFile);
            this.settings = JSON.parse(await fs.readFile(this.settingsFile, 'utf8'));
        } catch (err) {
            this.settings = {
                pageSize: 20,
                defaultAccountFormat: 'username|password|email|emailpass|cookie',
                defaultProxyFormat: 'ip:port:username:password'
            };
            await this.saveSettings();
        }
    }
    
    // =========================
    // QUẢN LÝ THƯ MỤC TÀI KHOẢN
    // =========================
    
    /**
     * Lấy danh sách thư mục tài khoản
     */
    getAccountFolders() {
        return [...this.accountFolders];
    }
    
    /**
     * Lấy thư mục tài khoản mặc định
     */
    getDefaultAccountFolder() {
        return this.accountFolders.find(folder => folder.isDefault) || this.accountFolders[0];
    }
    
    /**
     * Tạo thư mục tài khoản mới
     * @param {Object} folderData Thông tin thư mục
     * @returns {Object} Thư mục đã tạo
     */
    async createAccountFolder(folderData) {
        const id = folderData.id || `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Nếu đặt làm mặc định, bỏ mặc định các thư mục khác
        if (folderData.isDefault) {
            this.accountFolders.forEach(folder => {
                folder.isDefault = false;
            });
        }
        
        // Tạo thư mục mới
        const newFolder = {
            id,
            name: folderData.name,
            description: folderData.description || '',
            createdAt: new Date().toISOString(),
            isDefault: folderData.isDefault || false
        };
        
        this.accountFolders.push(newFolder);
        
        // Tạo thư mục vật lý trên ổ cứng
        const folderPath = path.join(this.accountsDir, id);
        try {
            await fs.mkdir(folderPath, { recursive: true });
        } catch (err) {
            // Thư mục có thể đã tồn tại
        }
        
        await this.saveAccountFolders();
        return newFolder;
    }
    
    /**
     * Cập nhật thư mục tài khoản
     * @param {String} id ID thư mục
     * @param {Object} folderData Thông tin cập nhật
     * @returns {Object} Thư mục đã cập nhật
     */
    async updateAccountFolder(id, folderData) {
        const folderIndex = this.accountFolders.findIndex(f => f.id === id);
        if (folderIndex === -1) {
            throw new Error('Không tìm thấy thư mục');
        }
        
        // Nếu đặt làm mặc định, bỏ mặc định các thư mục khác
        if (folderData.isDefault) {
            this.accountFolders.forEach(folder => {
                folder.isDefault = false;
            });
        }
        
        // Cập nhật thông tin thư mục
        const updatedFolder = {
            ...this.accountFolders[folderIndex],
            name: folderData.name || this.accountFolders[folderIndex].name,
            description: folderData.description !== undefined 
                ? folderData.description 
                : this.accountFolders[folderIndex].description,
            isDefault: folderData.isDefault !== undefined 
                ? folderData.isDefault 
                : this.accountFolders[folderIndex].isDefault
        };
        
        this.accountFolders[folderIndex] = updatedFolder;
        await this.saveAccountFolders();
        
        return updatedFolder;
    }
    
    /**
     * Xóa thư mục tài khoản
     * @param {String} id ID thư mục cần xóa
     * @returns {Boolean} Kết quả xóa
     */
    async deleteAccountFolder(id) {
        // Không cho phép xóa thư mục đang là mặc định
        const folder = this.accountFolders.find(f => f.id === id);
        if (!folder) {
            throw new Error('Không tìm thấy thư mục');
        }
        
        if (folder.isDefault) {
            throw new Error('Không thể xóa thư mục mặc định');
        }
        
        // Xóa thư mục khỏi danh sách
        this.accountFolders = this.accountFolders.filter(f => f.id !== id);
        
        // Di chuyển tất cả tài khoản sang thư mục mặc định
        const defaultFolder = this.getDefaultAccountFolder();
        const accounts = await this.getAccounts(id);
        
        for (const account of accounts) {
            account.folderId = defaultFolder.id;
            await this.saveAccount(account);
        }
        
        await this.saveAccountFolders();
        return true;
    }
    
    /**
     * Lưu danh sách thư mục tài khoản
     */
    async saveAccountFolders() {
        await fs.writeFile(
            this.accountFoldersFile, 
            JSON.stringify(this.accountFolders, null, 2), 
            'utf8'
        );
    }
    
    // =========================
    // QUẢN LÝ TÀI KHOẢN
    // =========================
    
    /**
     * Lấy danh sách tài khoản trong thư mục
     * @param {String} folderId ID thư mục (không bắt buộc)
     * @param {Object} filters Các bộ lọc (không bắt buộc)
     * @param {Object} pagination Phân trang (không bắt buộc)
     * @returns {Array} Danh sách tài khoản
     */
    async getAccounts(folderId, filters = {}, pagination = {}) {
        // Nếu không chỉ định thư mục, lấy từ thư mục mặc định
        if (!folderId) {
            folderId = this.getDefaultAccountFolder().id;
        }
        
        const folderPath = path.join(this.accountsDir, folderId);
        
        // Đảm bảo thư mục tồn tại
        try {
            await fs.access(folderPath);
        } catch (err) {
            await fs.mkdir(folderPath, { recursive: true });
            return { accounts: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
        }
        
        // Tìm tên thư mục để thêm vào thông tin tài khoản
        const currentFolder = this.accountFolders.find(folder => folder.id === folderId);
        const folderName = currentFolder ? currentFolder.name : 'Unknown';
        
        // Đọc danh sách file trong thư mục
        const files = await fs.readdir(folderPath);
        const accountFiles = files.filter(file => file.endsWith('.json'));
        
        // Đọc thông tin từng tài khoản
        const accounts = [];
        for (const file of accountFiles) {
            try {
                const accountData = JSON.parse(
                    await fs.readFile(path.join(folderPath, file), 'utf8')
                );
                // Thêm thông tin tên thư mục
                accountData.folderName = folderName;
                accounts.push(accountData);
            } catch (err) {
                console.error(`Lỗi khi đọc file tài khoản ${file}:`, err);
                // Bỏ qua file lỗi
            }
        }
        
        // Lọc tài khoản theo các điều kiện
        let filteredAccounts = accounts;
        
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filteredAccounts = filteredAccounts.filter(acc => 
                acc.username?.toLowerCase().includes(searchTerm) ||
                acc.email?.toLowerCase().includes(searchTerm)
            );
        }
        
        if (filters.status && filters.status !== 'all') {
            filteredAccounts = filteredAccounts.filter(acc => 
                acc.status === filters.status
            );
        }
        
        // Sắp xếp tài khoản
        const sortField = filters.sortBy || 'createdAt';
        const sortOrder = filters.sortOrder || 'desc';
        
        filteredAccounts.sort((a, b) => {
            if (sortOrder === 'asc') {
                return a[sortField] > b[sortField] ? 1 : -1;
            } else {
                return a[sortField] < b[sortField] ? 1 : -1;
            }
        });
        
        // Phân trang
        const page = pagination.page || 1;
        const pageSize = pagination.pageSize || this.settings.pageSize || 20;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        
        const paginatedAccounts = filteredAccounts.slice(startIndex, endIndex);
        
        return {
            accounts: paginatedAccounts,
            total: filteredAccounts.length,
            page,
            pageSize,
            totalPages: Math.ceil(filteredAccounts.length / pageSize)
        };
    }
    
    /**
     * Lấy thông tin một tài khoản
     * @param {String} id ID tài khoản
     * @returns {Object} Thông tin tài khoản
     */
    async getAccount(id) {
        // Tìm thư mục chứa tài khoản
        for (const folder of this.accountFolders) {
            const filePath = path.join(this.accountsDir, folder.id, `${id}.json`);
            try {
                await fs.access(filePath);
                // Nếu tìm thấy file, đọc và trả về thông tin tài khoản
                return JSON.parse(await fs.readFile(filePath, 'utf8'));
            } catch (err) {
                // File không tồn tại trong thư mục này, tiếp tục tìm
            }
        }
        
        throw new Error('Không tìm thấy tài khoản');
    }
    
    /**
     * Lưu thông tin tài khoản
     * @param {Object} account Thông tin tài khoản cần lưu
     * @returns {Object} Tài khoản đã lưu
     */
    async saveAccount(account) {
        // Đảm bảo tài khoản có ID
        if (!account.id) {
            account.id = crypto.randomUUID();
        }
        
        // Đảm bảo tài khoản có folderId
        if (!account.folderId) {
            account.folderId = this.getDefaultAccountFolder().id;
        }
        
        // Đảm bảo các trường cơ bản tồn tại
        account.status = account.status || 'new';
        account.createdAt = account.createdAt || new Date().toISOString();
        account.updatedAt = new Date().toISOString();
        
        // Lưu tài khoản vào file
        const folderPath = path.join(this.accountsDir, account.folderId);
        try {
            await fs.access(folderPath);
        } catch (err) {
            // Nếu thư mục không tồn tại, tạo mới
            await fs.mkdir(folderPath, { recursive: true });
        }
        
        const filePath = path.join(folderPath, `${account.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(account, null, 2), 'utf8');
        
        return account;
    }
    
    /**
     * Di chuyển tài khoản sang thư mục khác
     * @param {String} accountId ID tài khoản
     * @param {String} targetFolderId ID thư mục đích
     * @returns {Object} Tài khoản đã cập nhật
     */
    async moveAccount(accountId, targetFolderId) {
        // Kiểm tra thư mục đích có tồn tại
        const targetFolder = this.accountFolders.find(f => f.id === targetFolderId);
        if (!targetFolder) {
            throw new Error('Thư mục đích không tồn tại');
        }
        
        // Tìm và đọc thông tin tài khoản
        const account = await this.getAccount(accountId);
        
        // Xóa file cũ
        const oldFilePath = path.join(this.accountsDir, account.folderId, `${account.id}.json`);
        await fs.unlink(oldFilePath);
        
        // Cập nhật folderId và lưu lại
        account.folderId = targetFolderId;
        return await this.saveAccount(account);
    }
    
    /**
     * Xóa một tài khoản
     * @param {String} id ID tài khoản cần xóa
     * @returns {Boolean} Kết quả xóa
     */
    async deleteAccount(id) {
        // Tìm thư mục chứa tài khoản
        for (const folder of this.accountFolders) {
            const filePath = path.join(this.accountsDir, folder.id, `${id}.json`);
            try {
                await fs.access(filePath);
                // Nếu tìm thấy file, xóa nó
                await fs.unlink(filePath);
                return true;
            } catch (err) {
                // File không tồn tại trong thư mục này, tiếp tục tìm
            }
        }
        
        throw new Error('Không tìm thấy tài khoản');
    }
    
    /**
     * Import danh sách tài khoản
     * @param {String} folderId Thư mục lưu tài khoản
     * @param {String} accountsText Danh sách tài khoản dạng text
     * @param {Object} options Tùy chọn import
     * @returns {Object} Kết quả import
     */
    async importAccounts(folderId, accountsText, options = {}) {
        // Mặc định là bỏ qua các tài khoản trùng lặp
        const skipDuplicates = options.skipDuplicates !== false;
        const format = options.format || this.settings.defaultAccountFormat;
        
        // Kiểm tra thư mục có tồn tại
        const folder = this.accountFolders.find(f => f.id === folderId);
        if (!folder) {
            throw new Error('Thư mục không tồn tại');
        }
        
        // Phân tích danh sách tài khoản
        const lines = accountsText.split(/\r?\n/).filter(line => line.trim() !== '');
        
        // Xác định vị trí của các trường trong mỗi dòng
        let fieldPositions;
        
        if (format === 'username|password|email|emailpass|cookie') {
            fieldPositions = {
                username: 0,
                password: 1,
                email: 2,
                emailPassword: 3,
                cookie: 4
            };
        } else if (format === 'username|password|email|emailpass|cookie|proxy') {
            fieldPositions = {
                username: 0,
                password: 1,
                email: 2,
                emailPassword: 3,
                cookie: 4,
                proxy: 5
            };
        } else if (format === 'username|password') {
            fieldPositions = {
                username: 0,
                password: 1
            };
        } else if (options.customFormat) {
            fieldPositions = options.customFormat;
        } else {
            throw new Error('Định dạng không hợp lệ');
        }
        
        // Kết quả import
        const results = {
            total: lines.length,
            imported: 0,
            skipped: 0,
            failed: 0,
            details: []
        };
        
        // Lấy tất cả tài khoản hiện có trong thư mục để kiểm tra trùng lặp
        const existingAccounts = (await this.getAccounts(folderId)).accounts;
        const existingUsernames = new Set(existingAccounts.map(acc => acc.username));
        
        // Xử lý từng dòng
        for (const line of lines) {
            try {
                const fields = line.split('|');
                
                // Đảm bảo có đủ các trường bắt buộc
                if (fields.length < 2 || !fields[fieldPositions.username] || !fields[fieldPositions.password]) {
                    results.failed++;
                    results.details.push({
                        line,
                        status: 'failed',
                        reason: 'Thiếu username hoặc password'
                    });
                    continue;
                }
                
                const username = fields[fieldPositions.username].trim();
                
                // Kiểm tra trùng lặp
                if (skipDuplicates && existingUsernames.has(username)) {
                    results.skipped++;
                    results.details.push({
                        line,
                        status: 'skipped',
                        reason: 'Tài khoản đã tồn tại'
                    });
                    continue;
                }
                
                // Tạo đối tượng tài khoản mới
                const account = {
                    id: crypto.randomUUID(),
                    folderId,
                    username,
                    password: fields[fieldPositions.password],
                    status: 'new',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                // Thêm các trường khác nếu có
                if (fieldPositions.email !== undefined && fields[fieldPositions.email]) {
                    account.email = fields[fieldPositions.email].trim();
                }
                
                if (fieldPositions.emailPassword !== undefined && fields[fieldPositions.emailPassword]) {
                    account.emailPassword = fields[fieldPositions.emailPassword].trim();
                }
                
                if (fieldPositions.cookie !== undefined && fields[fieldPositions.cookie]) {
                    account.cookie = fields[fieldPositions.cookie].trim();
                }
                
                if (fieldPositions.proxy !== undefined && fields[fieldPositions.proxy]) {
                    account.proxy = fields[fieldPositions.proxy].trim();
                }
                
                // Lưu tài khoản
                await this.saveAccount(account);
                
                // Cập nhật kết quả
                results.imported++;
                results.details.push({
                    line,
                    status: 'imported',
                    accountId: account.id
                });
                
                // Thêm vào danh sách username đã tồn tại để kiểm tra trùng lặp
                existingUsernames.add(username);
                
            } catch (error) {
                results.failed++;
                results.details.push({
                    line,
                    status: 'failed',
                    reason: error.message
                });
            }
        }
        
        return results;
    }
    
    // =========================
    // QUẢN LÝ THƯ MỤC PROXY
    // =========================
    
    /**
     * Lấy danh sách thư mục proxy
     */
    getProxyFolders() {
        return [...this.proxyFolders];
    }
    
    /**
     * Lấy thư mục proxy mặc định
     */
    getDefaultProxyFolder() {
        return this.proxyFolders.find(folder => folder.isDefault) || this.proxyFolders[0];
    }
    
    /**
     * Tạo thư mục proxy mới
     * @param {Object} folderData Thông tin thư mục
     * @returns {Object} Thư mục đã tạo
     */
    async createProxyFolder(folderData) {
        const id = folderData.id || `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Nếu đặt làm mặc định, bỏ mặc định các thư mục khác
        if (folderData.isDefault) {
            this.proxyFolders.forEach(folder => {
                folder.isDefault = false;
            });
        }
        
        // Tạo thư mục mới
        const newFolder = {
            id,
            name: folderData.name,
            description: folderData.description || '',
            createdAt: new Date().toISOString(),
            isDefault: folderData.isDefault || false
        };
        
        this.proxyFolders.push(newFolder);
        
        // Tạo thư mục vật lý trên ổ cứng
        const folderPath = path.join(this.proxiesDir, id);
        try {
            await fs.mkdir(folderPath, { recursive: true });
        } catch (err) {
            // Thư mục có thể đã tồn tại
        }
        
        await this.saveProxyFolders();
        return newFolder;
    }
    
    /**
     * Cập nhật thư mục proxy
     * @param {String} id ID thư mục
     * @param {Object} folderData Thông tin cập nhật
     * @returns {Object} Thư mục đã cập nhật
     */
    async updateProxyFolder(id, folderData) {
        const folderIndex = this.proxyFolders.findIndex(f => f.id === id);
        if (folderIndex === -1) {
            throw new Error('Không tìm thấy thư mục');
        }
        
        // Nếu đặt làm mặc định, bỏ mặc định các thư mục khác
        if (folderData.isDefault) {
            this.proxyFolders.forEach(folder => {
                folder.isDefault = false;
            });
        }
        
        // Cập nhật thông tin thư mục
        const updatedFolder = {
            ...this.proxyFolders[folderIndex],
            name: folderData.name || this.proxyFolders[folderIndex].name,
            description: folderData.description !== undefined 
                ? folderData.description 
                : this.proxyFolders[folderIndex].description,
            isDefault: folderData.isDefault !== undefined 
                ? folderData.isDefault 
                : this.proxyFolders[folderIndex].isDefault
        };
        
        this.proxyFolders[folderIndex] = updatedFolder;
        await this.saveProxyFolders();
        
        return updatedFolder;
    }
    
    /**
     * Xóa thư mục proxy
     * @param {String} id ID thư mục cần xóa
     * @returns {Boolean} Kết quả xóa
     */
    async deleteProxyFolder(id) {
        // Không cho phép xóa thư mục đang là mặc định
        const folder = this.proxyFolders.find(f => f.id === id);
        if (!folder) {
            throw new Error('Không tìm thấy thư mục');
        }
        
        if (folder.isDefault) {
            throw new Error('Không thể xóa thư mục mặc định');
        }
        
        // Xóa thư mục khỏi danh sách
        this.proxyFolders = this.proxyFolders.filter(f => f.id !== id);
        
        // Di chuyển tất cả proxy sang thư mục mặc định
        const defaultFolder = this.getDefaultProxyFolder();
        const proxies = await this.getProxies(id);
        
        for (const proxy of proxies.proxies) {
            proxy.folderId = defaultFolder.id;
            await this.saveProxy(proxy);
        }
        
        await this.saveProxyFolders();
        return true;
    }
    
    /**
     * Lưu danh sách thư mục proxy
     */
    async saveProxyFolders() {
        await fs.writeFile(
            this.proxyFoldersFile, 
            JSON.stringify(this.proxyFolders, null, 2), 
            'utf8'
        );
    }
    
    // =========================
    // QUẢN LÝ PROXY
    // =========================
    
    /**
     * Lấy danh sách proxy trong thư mục
     * @param {String} folderId ID thư mục (không bắt buộc)
     * @param {Object} filters Các bộ lọc (không bắt buộc)
     * @param {Object} pagination Phân trang (không bắt buộc)
     * @returns {Array} Danh sách proxy
     */
    async getProxies(folderId, filters = {}, pagination = {}) {
        // Nếu không chỉ định thư mục, lấy từ thư mục mặc định
        if (!folderId) {
            folderId = this.getDefaultProxyFolder().id;
        }
        
        const folderPath = path.join(this.proxiesDir, folderId);
        
        // Đảm bảo thư mục tồn tại
        try {
            await fs.access(folderPath);
        } catch (err) {
            await fs.mkdir(folderPath, { recursive: true });
            return { proxies: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
        }
        
        // Đọc danh sách file trong thư mục
        const files = await fs.readdir(folderPath);
        const proxyFiles = files.filter(file => file.endsWith('.json'));
        
        // Đọc thông tin từng proxy
        const proxies = [];
        for (const file of proxyFiles) {
            try {
                const proxyData = JSON.parse(
                    await fs.readFile(path.join(folderPath, file), 'utf8')
                );
                proxies.push(proxyData);
            } catch (err) {
                console.error(`Lỗi khi đọc file proxy ${file}:`, err);
                // Bỏ qua file lỗi
            }
        }
        
        // Lọc proxy theo các điều kiện
        let filteredProxies = proxies;
        
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filteredProxies = filteredProxies.filter(proxy => 
                proxy.value?.toLowerCase().includes(searchTerm) ||
                proxy.description?.toLowerCase().includes(searchTerm)
            );
        }
        
        if (filters.status && filters.status !== 'all') {
            filteredProxies = filteredProxies.filter(proxy => 
                proxy.status === filters.status
            );
        }
        
        // Sắp xếp proxy
        const sortField = filters.sortBy || 'createdAt';
        const sortOrder = filters.sortOrder || 'desc';
        
        filteredProxies.sort((a, b) => {
            if (sortOrder === 'asc') {
                return a[sortField] > b[sortField] ? 1 : -1;
            } else {
                return a[sortField] < b[sortField] ? 1 : -1;
            }
        });
        
        // Phân trang
        const page = pagination.page || 1;
        const pageSize = pagination.pageSize || this.settings.pageSize || 20;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        
        const paginatedProxies = filteredProxies.slice(startIndex, endIndex);
        
        return {
            proxies: paginatedProxies,
            total: filteredProxies.length,
            page,
            pageSize,
            totalPages: Math.ceil(filteredProxies.length / pageSize)
        };
    }
    
    /**
     * Lấy thông tin một proxy
     * @param {String} id ID proxy
     * @returns {Object} Thông tin proxy
     */
    async getProxy(id) {
        // Tìm thư mục chứa proxy
        for (const folder of this.proxyFolders) {
            const filePath = path.join(this.proxiesDir, folder.id, `${id}.json`);
            try {
                await fs.access(filePath);
                // Nếu tìm thấy file, đọc và trả về thông tin proxy
                return JSON.parse(await fs.readFile(filePath, 'utf8'));
            } catch (err) {
                // File không tồn tại trong thư mục này, tiếp tục tìm
            }
        }
        
        throw new Error('Không tìm thấy proxy');
    }
    
    /**
     * Lưu thông tin proxy
     * @param {Object} proxy Thông tin proxy cần lưu
     * @returns {Object} Proxy đã lưu
     */
    async saveProxy(proxy) {
        // Đảm bảo proxy có ID
        if (!proxy.id) {
            proxy.id = crypto.randomUUID();
        }
        
        // Đảm bảo proxy có folderId
        if (!proxy.folderId) {
            proxy.folderId = this.getDefaultProxyFolder().id;
        }
        
        // Đảm bảo các trường cơ bản tồn tại
        proxy.status = proxy.status || 'active';
        proxy.createdAt = proxy.createdAt || new Date().toISOString();
        proxy.updatedAt = new Date().toISOString();
        
        // Lưu proxy vào file
        const folderPath = path.join(this.proxiesDir, proxy.folderId);
        try {
            await fs.access(folderPath);
        } catch (err) {
            // Nếu thư mục không tồn tại, tạo mới
            await fs.mkdir(folderPath, { recursive: true });
        }
        
        const filePath = path.join(folderPath, `${proxy.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(proxy, null, 2), 'utf8');
        
        return proxy;
    }
    
    /**
     * Di chuyển proxy sang thư mục khác
     * @param {String} proxyId ID proxy
     * @param {String} targetFolderId ID thư mục đích
     * @returns {Object} Proxy đã cập nhật
     */
    async moveProxy(proxyId, targetFolderId) {
        // Kiểm tra thư mục đích có tồn tại
        const targetFolder = this.proxyFolders.find(f => f.id === targetFolderId);
        if (!targetFolder) {
            throw new Error('Thư mục đích không tồn tại');
        }
        
        // Tìm và đọc thông tin proxy
        const proxy = await this.getProxy(proxyId);
        
        // Xóa file cũ
        const oldFilePath = path.join(this.proxiesDir, proxy.folderId, `${proxy.id}.json`);
        await fs.unlink(oldFilePath);
        
        // Cập nhật folderId và lưu lại
        proxy.folderId = targetFolderId;
        return await this.saveProxy(proxy);
    }
    
    /**
     * Xóa một proxy
     * @param {String} id ID proxy cần xóa
     * @returns {Boolean} Kết quả xóa
     */
    async deleteProxy(id) {
        // Tìm thư mục chứa proxy
        for (const folder of this.proxyFolders) {
            const filePath = path.join(this.proxiesDir, folder.id, `${id}.json`);
            try {
                await fs.access(filePath);
                // Nếu tìm thấy file, xóa nó
                await fs.unlink(filePath);
                return true;
            } catch (err) {
                // File không tồn tại trong thư mục này, tiếp tục tìm
            }
        }
        
        throw new Error('Không tìm thấy proxy');
    }
    
    /**
     * Import danh sách proxy
     * @param {String} folderId Thư mục lưu proxy
     * @param {String} proxiesText Danh sách proxy dạng text
     * @param {Object} options Tùy chọn import
     * @returns {Object} Kết quả import
     */
    async importProxies(folderId, proxiesText, options = {}) {
        // Mặc định là bỏ qua các proxy trùng lặp
        const skipDuplicates = options.skipDuplicates !== false;
        const format = options.format || this.settings.defaultProxyFormat;
        
        // Kiểm tra thư mục có tồn tại
        const folder = this.proxyFolders.find(f => f.id === folderId);
        if (!folder) {
            throw new Error('Thư mục không tồn tại');
        }
        
        // Phân tích danh sách proxy
        const lines = proxiesText.split(/\r?\n/).filter(line => line.trim() !== '');
        
        // Kết quả import
        const results = {
            total: lines.length,
            imported: 0,
            skipped: 0,
            failed: 0,
            details: []
        };
        
        // Lấy tất cả proxy hiện có trong thư mục để kiểm tra trùng lặp
        const existingProxies = (await this.getProxies(folderId)).proxies;
        const existingValues = new Set(existingProxies.map(p => p.value));
        
        // Import từng proxy
        for (const line of lines) {
            try {
                const proxyValue = line.trim();
                
                // Kiểm tra proxy hợp lệ
                if (!proxyValue) {
                    results.failed++;
                    results.details.push({
                        value: line,
                        status: 'failed',
                        message: 'Giá trị proxy trống'
                    });
                    continue;
                }
                
                // Kiểm tra trùng lặp
                if (skipDuplicates && existingValues.has(proxyValue)) {
                    results.skipped++;
                    results.details.push({
                        value: proxyValue,
                        status: 'skipped',
                        message: 'Proxy đã tồn tại'
                    });
                    continue;
                }
                
                // Tạo đối tượng proxy mới
                const proxy = {
                    id: crypto.randomUUID(),
                    value: proxyValue,
                    folderId: folderId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    status: 'active',
                    lastChecked: null,
                    checkResult: null
                };
                
                // Phân tích thông tin proxy nếu cần
                if (format === 'ip:port:username:password') {
                    const parts = proxyValue.split(':');
                    if (parts.length >= 2) {
                        proxy.ip = parts[0];
                        proxy.port = parts[1];
                        proxy.username = parts[2] || '';
                        proxy.password = parts[3] || '';
                    }
                }
                
                // Lưu proxy
                await this.saveProxy(proxy);
                existingValues.add(proxyValue); // Thêm vào danh sách hiện có
                
                results.imported++;
                results.details.push({
                    value: proxyValue,
                    status: 'imported',
                    id: proxy.id
                });
            } catch (err) {
                results.failed++;
                results.details.push({
                    value: line,
                    status: 'failed',
                    message: err.message
                });
            }
        }
        
        return results;
    }
    
    // =========================
    // QUẢN LÝ CÀI ĐẶT
    // =========================
    
    /**
     * Lưu cài đặt
     */
    async saveSettings() {
        await fs.writeFile(
            this.settingsFile, 
            JSON.stringify(this.settings, null, 2), 
            'utf8'
        );
        return this.settings;
    }
    
    /**
     * Test proxy connection
     */
    async testProxy(proxyId) {
        try {
            const proxies = await this.getProxies();
            const proxy = proxies.find(p => p.id === proxyId);
            
            if (!proxy) {
                throw new Error('Proxy not found');
            }

            // Simple proxy test - you can enhance this with actual HTTP requests
            const axios = require('axios');
            const ProxyAgent = require('proxy-agent');
            
            const proxyUrl = `${proxy.type}://${proxy.username ? proxy.username + ':' + proxy.password + '@' : ''}${proxy.host}:${proxy.port}`;
            const agent = new ProxyAgent(proxyUrl);
            
            const response = await axios.get('https://httpbin.org/ip', {
                httpsAgent: agent,
                timeout: proxy.timeout || 10000
            });
            
            // Update proxy status
            proxy.status = 'active';
            proxy.lastTested = new Date().toISOString();
            await this.updateProxy(proxy.id, proxy);
            
            return { success: true, ip: response.data.origin };
        } catch (error) {
            // Update proxy status to error
            const proxies = await this.getProxies();
            const proxy = proxies.find(p => p.id === proxyId);
            if (proxy) {
                proxy.status = 'error';
                proxy.lastTested = new Date().toISOString();
                await this.updateProxy(proxy.id, proxy);
            }
            
            return { success: false, error: error.message };
        }
    }

    /**
     * Get analytics data
     */
    async getAnalytics(params = {}) {
        const { timeRange = '7days' } = params;
        
        // Mock analytics data - replace with actual data collection
        const mockData = {
            totalViews: Math.floor(Math.random() * 100000),
            totalLikes: Math.floor(Math.random() * 10000),
            totalComments: Math.floor(Math.random() * 5000),
            totalAccounts: (await this.getAccounts()).length,
            activeViewers: Math.floor(Math.random() * 10),
            totalRuntime: Math.floor(Math.random() * 86400), // seconds
            dailyStats: [],
            accountStats: [],
            recentActivities: []
        };

        // Generate mock daily stats
        const days = timeRange === '24h' ? 1 : timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            mockData.dailyStats.push({
                date: date.toISOString(),
                views: Math.floor(Math.random() * 1000),
                likes: Math.floor(Math.random() * 100),
                comments: Math.floor(Math.random() * 50)
            });
        }

        // Generate mock account stats
        const accounts = await this.getAccounts();
        mockData.accountStats = accounts.slice(0, 5).map(account => ({
            username: account.username,
            platform: account.platform,
            totalViews: Math.floor(Math.random() * 5000),
            totalLikes: Math.floor(Math.random() * 500)
        }));

        // Generate mock recent activities
        const activities = [
            'Bắt đầu viewer cho livestream',
            'Dừng viewer',
            'Thêm tài khoản mới',
            'Thêm proxy mới',
            'Lỗi kết nối proxy',
            'Hoàn thành session xem'
        ];

        for (let i = 0; i < 10; i++) {
            const date = new Date();
            date.setMinutes(date.getMinutes() - Math.floor(Math.random() * 1440)); // Random within last day
            
            mockData.recentActivities.push({
                timestamp: date.toISOString(),
                type: ['start', 'stop', 'add', 'add', 'error', 'complete'][Math.floor(Math.random() * 6)],
                message: activities[Math.floor(Math.random() * activities.length)],
                account: accounts.length > 0 ? accounts[Math.floor(Math.random() * accounts.length)].username : 'Unknown'
            });
        }

        return mockData;
    }

    /**
     * Get application settings
     */
    async getSettings() {
        try {
            const data = await fs.readFile(this.settingsFile, 'utf8');
            const settings = JSON.parse(data);
            
            // Merge with default settings
            const defaultSettings = {
                viewDuration: 30,
                viewInterval: 5,
                maxConcurrentViewers: 5,
                randomizeViewTime: true,
                useProxies: true,
                headless: true,
                userAgent: 'random',
                enableImages: false,
                enableCSS: false,
                enableJavaScript: true,
                proxyRotation: true,
                proxyTimeout: 10,
                maxProxyRetries: 3,
                enableStealth: true,
                blockWebRTC: true,
                fakeTimezone: true,
                notifyOnStart: true,
                notifyOnError: true,
                notifyOnComplete: false,
                debugMode: false,
                logLevel: 'info',
                autoUpdate: true,
                maxAccountsPerProxy: 10,  // **FIX**: Thêm setting mặc định
                maxRoomsPerAccount: 10    // **FIX**: Thêm setting mặc định
            };

            return { ...defaultSettings, ...settings };
        } catch (error) {
            // Return default settings if file doesn't exist
            return {
                viewDuration: 30,
                viewInterval: 5,
                maxConcurrentViewers: 5,
                randomizeViewTime: true,
                useProxies: true,
                headless: true,
                userAgent: 'random',
                enableImages: false,
                enableCSS: false,
                enableJavaScript: true,
                proxyRotation: true,
                proxyTimeout: 10,
                maxProxyRetries: 3,
                enableStealth: true,
                blockWebRTC: true,
                fakeTimezone: true,
                notifyOnStart: true,
                notifyOnError: true,
                notifyOnComplete: false,
                debugMode: false,
                logLevel: 'info',
                autoUpdate: true,
                maxAccountsPerProxy: 10,  // **FIX**: Thêm setting mặc định
                maxRoomsPerAccount: 10    // **FIX**: Thêm setting mặc định
            };
        }
    }

    /**
     * Save application settings
     */
    async saveSettings(settings) {
        try {
            await fs.writeFile(this.settingsFile, JSON.stringify(settings, null, 2));
            this.settings = settings;
            return { success: true };
        } catch (error) {
            throw new Error(`Failed to save settings: ${error.message}`);
        }
    }

    /**
     * Reset settings to defaults
     */
    async resetSettings() {
        const defaultSettings = {
            viewDuration: 30,
            viewInterval: 5,
            maxConcurrentViewers: 5,
            randomizeViewTime: true,
            useProxies: true,
            headless: true,
            userAgent: 'random',
            enableImages: false,
            enableCSS: false,
            enableJavaScript: true,
            proxyRotation: true,
            proxyTimeout: 10,
            maxProxyRetries: 3,
            enableStealth: true,
            blockWebRTC: true,
            fakeTimezone: true,
            notifyOnStart: true,
            notifyOnError: true,
            notifyOnComplete: false,
            debugMode: false,
            logLevel: 'info',
            autoUpdate: true,
            maxAccountsPerProxy: 10,  // **FIX**: Thêm setting mặc định
            maxRoomsPerAccount: 10    // **FIX**: Thêm setting mặc định
        };

        await this.saveSettings(defaultSettings);
        return { success: true };
    }

    // =========================
    // Account Management Methods
    // =========================

    /**
     * Lấy tất cả thư mục tài khoản
     */
    getAllFolders() {
        return this.getAccountFolders();
    }

    /**
     * Tạo thư mục mới
     */
    createFolder(name, description) {
        return this.createAccountFolder({
            name,
            description,
            isDefault: false
        });
    }

    /**
     * Cập nhật thư mục
     */
    updateFolder(folderId, data) {
        return this.updateAccountFolder(folderId, data);
    }

    /**
     * Xóa thư mục
     */
    deleteFolder(folderId) {
        return this.deleteAccountFolder(folderId);
    }

    /**
     * Lấy tất cả tài khoản
     */
    getAllAccounts() {
        return this.getAccounts(null, {}, {});
    }

    /**
     * Lấy tài khoản theo thư mục
     */
    getAccountsByFolder(folderId) {
        return this.getAccounts(folderId, {}, {});
    }

    /**
     * Thêm tài khoản
     */
    addAccount(accountData, folderId) {
        accountData.folderId = folderId;
        return this.saveAccount(accountData);
    }

    /**
     * Cập nhật tài khoản
     */
    updateAccount(accountId, data) {
        return this.getAccount(accountId)
            .then(account => {
                const updatedAccount = { ...account, ...data };
                return this.saveAccount(updatedAccount);
            });
    }

    /**
     * Import tài khoản từ text
     */
    importFromText(text, folderId) {
        return this.importAccounts(folderId, text);
    }

    /**
     * Export tài khoản sang text
     */
    async exportToText(folderId) {
        const { accounts } = await this.getAccounts(folderId, {}, {});
        const format = this.settings.defaultAccountFormat || 'username|password|email|emailpass|cookie';
        
        let result = '';
        for (const account of accounts) {
            const fields = format.split('|');
            const values = fields.map(field => account[field] || '');
            result += values.join('|') + '\n';
        }
        
        return result;
    }

    /**
     * Cập nhật cài đặt
     */
    async updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        return this.saveSettings();
    }
}

// Export the DataManager class
module.exports = DataManager;