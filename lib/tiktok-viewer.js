const EventEmitter = require('events');
const axios = require('axios');
const { ProxyAgent } = require('proxy-agent');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { deepClone, generateUniqueId } = require('./utils');
const { log, error } = require('./logger');

// Thêm plugin Stealth để tránh bị phát hiện là bot
puppeteer.use(StealthPlugin());

/**
 * Lớp quản lý tài khoản tăng mắt TikTok
 */
class TiktokAccount {
    constructor(accountInfo, proxy, roomId, options = {}) {
        this.accountInfo = accountInfo;
        this.proxy = proxy;
        this.roomId = roomId;
        this.options = {
            headless: true,
            timeout: 60000,
            ...options
        };

        // Parse thông tin đăng nhập
        const [username, password] = accountInfo.split('|');
        this.username = username.trim();
        this.password = password.trim();

        this.browser = null;
        this.page = null;
        this.isRunning = false;
        this.isLoggedIn = false;
    }

    /**
     * Bắt đầu phiên xem TikTok
     */
    async start() {
        try {
            await this._setupBrowser();
            await this._loginToTikTok();
            await this._joinLiveRoom();
            return true;
        } catch (error) {
            console.error(`[${this.username}] Lỗi khi bắt đầu phiên xem:`, error.message);
            await this.stop();
            throw error;
        }
    }

    /**
     * Dừng phiên xem TikTok
     */
    async stop() {
        this.isRunning = false;
        
        try {
            if (this.page) {
                await this.page.close().catch(() => {});
                this.page = null;
            }
            
            if (this.browser) {
                await this.browser.close().catch(() => {});
                this.browser = null;
            }
        } catch (error) {
            console.error(`[${this.username}] Lỗi khi dừng phiên xem:`, error.message);
        }
    }

    /**
     * Thiết lập trình duyệt Puppeteer với proxy
     */
    async _setupBrowser() {
        let proxyServer = null;
        if (this.proxy) {
            const proxyParts = this.proxy.split(':');
            
            if (proxyParts.length >= 2) {
                // IP:PORT
                if (proxyParts.length === 2) {
                    proxyServer = `http://${this.proxy}`;
                }
                // IP:PORT:USER:PASS
                else if (proxyParts.length === 4) {
                    const [ip, port, user, pass] = proxyParts;
                    proxyServer = `http://${user}:${pass}@${ip}:${port}`;
                }
            }
        }

        // Thiết lập tham số cho trình duyệt
        const args = [
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-setuid-sandbox',
            '--no-sandbox',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-extensions',
            '--window-size=1280,720'
        ];

        if (proxyServer) {
            args.push(`--proxy-server=${proxyServer}`);
        }

        // Khởi tạo trình duyệt
        this.browser = await puppeteer.launch({
            headless: this.options.headless ? 'new' : false,
            args,
            ignoreHTTPSErrors: true
        });

        this.page = await this.browser.newPage();
        
        // Thiết lập User-Agent giống người dùng thực
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
        
        // Thiết lập timeout
        await this.page.setDefaultNavigationTimeout(this.options.timeout);
        await this.page.setDefaultTimeout(this.options.timeout);
        
        this.isRunning = true;
    }

    /**
     * Đăng nhập vào TikTok
     */
    async _loginToTikTok() {
        await this.page.goto('https://www.tiktok.com/login', {
            waitUntil: 'networkidle2'
        });

        // Đợi trang đăng nhập tải
        await this.page.waitForSelector('input[name="username"], input[name="email"]', { timeout: this.options.timeout });
        
        // Chuyển sang đăng nhập bằng username & mật khẩu nếu cần
        const loginMethodButton = await this.page.$('a[href="/login/phone-or-email"]');
        if (loginMethodButton) {
            await loginMethodButton.click();
            await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
        }

        // Điền thông tin đăng nhập
        await this.page.type('input[name="username"], input[name="email"]', this.username, { delay: 100 });
        await this.page.type('input[name="password"], input[type="password"]', this.password, { delay: 100 });

        // Click nút đăng nhập
        await Promise.all([
            this.page.click('button[type="submit"]'),
            this.page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {})
        ]);

        // Xác minh đăng nhập thành công
        const isLoggedIn = await this._checkLogin();
        if (!isLoggedIn) {
            // Kiểm tra xem có captcha không
            const hasCaptcha = await this.page.$('div[class*="captcha"], iframe[title*="Captcha"]');
            if (hasCaptcha) {
                throw new Error('Gặp Captcha khi đăng nhập');
            }

            throw new Error('Đăng nhập thất bại');
        }

        this.isLoggedIn = true;
    }

    /**
     * Kiểm tra xem đã đăng nhập thành công chưa
     */
    async _checkLogin() {
        // Kiểm tra các phần tử xuất hiện sau khi đăng nhập
        const userIconSelector = 'span[data-e2e="profile-icon"], a[data-e2e="profile-icon"]';
        const hasUserIcon = await this.page.$(userIconSelector) !== null;

        // Kiểm tra URL sau khi đăng nhập
        const currentUrl = this.page.url();
        const isOnHomePage = currentUrl.includes('tiktok.com/') && !currentUrl.includes('login');

        return hasUserIcon || isOnHomePage;
    }

    /**
     * Tham gia phòng live TikTok
     */
    async _joinLiveRoom() {
        // Định dạng URL phòng live
        let roomUrl = this.roomId;
        if (!roomUrl.startsWith('http')) {
            // Nếu chỉ là ID, tạo URL đầy đủ
            roomUrl = `https://www.tiktok.com/@${this.roomId}/live`;
        }

        // Truy cập phòng live
        await this.page.goto(roomUrl, {
            waitUntil: 'networkidle2'
        });

        // Kiểm tra xem phòng live có tồn tại không
        const liveIndicator = await this.page.$('div[class*="LiveContainer"], div[data-e2e="live-container"]');
        if (!liveIndicator) {
            throw new Error('Không thể tìm thấy phòng live hoặc phòng không hoạt động');
        }

        // Thiết lập lắng nghe sự kiện network để phát hiện các yêu cầu xác thực phòng live
        await this.page.setRequestInterception(true);
        this.page.on('request', request => {
            // Đảm bảo các yêu cầu liên quan đến API live được thông qua
            request.continue();
        });

        // Đợi một thời gian để đảm bảo kết nối vào phòng
        await this.page.waitForTimeout(5000);
        
        // Thực hiện tương tác cơ bản để được tính là người xem
        await this._interactWithLiveRoom();
    }

    /**
     * Tương tác với phòng live để tăng thời gian xem
     */
    async _interactWithLiveRoom() {
        // Lặp tương tác để duy trì kết nối
        while (this.isRunning) {
            try {
                // Di chuyển chuột ngẫu nhiên để giả lập người dùng
                const viewportSize = await this.page.viewport();
                const randomX = Math.floor(Math.random() * viewportSize.width);
                const randomY = Math.floor(Math.random() * viewportSize.height);
                
                await this.page.mouse.move(randomX, randomY);
                
                // Cuộn trang một chút
                await this.page.evaluate(() => {
                    window.scrollBy(0, Math.random() * 50 - 25);
                });
                
                // Đợi một thời gian trước khi tương tác tiếp
                await this.page.waitForTimeout(30000 + Math.random() * 10000);
            } catch (error) {
                console.error(`[${this.username}] Lỗi khi tương tác với phòng live:`, error.message);
                if (!this.isRunning) break;
            }
        }
    }
}

/**
 * Lớp quản lý tiến trình tăng mắt TikTok
 */
class TiktokViewerManager extends EventEmitter {
    constructor() {
        super();
        this.accounts = [];
        this.proxies = [];
        this.roomId = '';
        this.accountsPerProxy = 1;
        this.viewers = [];
        this.isRunning = false;
        this.options = {
            maxConcurrent: 5,
            delayBetweenStarts: 5000
        };
        this.roomStats = new Map();
    }

    /**
     * Bắt đầu tiến trình tăng mắt
     */
    async start(config) {
        if (this.isRunning) {
            this.emit('log', 'Tiến trình đang chạy, hãy dừng trước khi bắt đầu lại', 'error');
            return;
        }

        try {
            // Thiết lập cấu hình
            this.roomId = config.room;
            this.accounts = this._parseAccounts(config.accounts);
            this.proxies = this._parseProxies(config.proxies);
            this.accountsPerProxy = config.accountsPerProxy || 1;
            
            // Kiểm tra đầu vào
            if (!this.roomId) {
                throw new Error('ID hoặc URL phòng TikTok không hợp lệ');
            }
            
            if (this.accounts.length === 0) {
                throw new Error('Không có tài khoản hợp lệ');
            }
            
            if (this.proxies.length === 0) {
                throw new Error('Không có proxy hợp lệ');
            }

            this.isRunning = true;
            this.emit('log', `Bắt đầu tiến trình tăng mắt cho room: ${this.roomId}`, 'info');
            
            // Khởi động các viewer
            await this._startViewers();
            
        } catch (err) {
            this.emit('log', `Lỗi khi bắt đầu tiến trình: ${err.message}`, 'error');
            this.stopAll();
        }
    }

    /**
     * Dừng tất cả các viewer
     */
    async stopAll() {
        this.isRunning = false;
        this.emit('log', 'Đang dừng tất cả các phiên xem...', 'info');

        const stopPromises = this.viewers.map(viewer => {
            return new Promise(resolve => {
                viewer.stop()
                    .then(() => resolve())
                    .catch(() => resolve());
            });
        });

        await Promise.all(stopPromises);
        this.viewers = [];
        
        this.emit('log', 'Đã dừng tất cả các phiên xem', 'info');
    }

    /**
     * Khởi động các viewer theo nhóm
     */
    async _startViewers() {
        // Lập danh sách các tài khoản và proxy để sử dụng
        const assignments = this._assignProxiesToAccounts();
        let runningCount = 0;

        for (let i = 0; i < assignments.length; i++) {
            if (!this.isRunning) break;

            const { account, proxy } = assignments[i];
            
            // Kiểm tra số phiên đang chạy, nếu đạt tối đa, đợi một phiên hoàn tất
            if (runningCount >= this.options.maxConcurrent) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                i--; // Lặp lại vòng hiện tại
                continue;
            }

            // Khởi tạo một viewer mới
            try {
                this.emit('account-status', {
                    account,
                    status: 'running',
                    message: 'Đang bắt đầu phiên xem'
                });
                
                const viewer = new TiktokAccount(account, proxy, this.roomId, {
                    headless: true,
                    timeout: 60000
                });
                
                runningCount++;
                this.viewers.push(viewer);
                
                // Bắt đầu viewer trong một promise riêng biệt
                viewer.start()
                    .then(() => {
                        this.emit('account-status', {
                            account,
                            status: 'success',
                            message: 'Đã kết nối vào phòng live thành công'
                        });
                    })
                    .catch(error => {
                        this.emit('account-status', {
                            account,
                            status: 'failed',
                            message: `Lỗi: ${error.message}`
                        });
                        
                        // Loại bỏ viewer khỏi danh sách
                        const index = this.viewers.indexOf(viewer);
                        if (index !== -1) {
                            this.viewers.splice(index, 1);
                        }
                    })
                    .finally(() => {
                        runningCount--;
                    });
                
                // Đợi để tránh gửi quá nhiều request cùng lúc
                await new Promise(resolve => setTimeout(resolve, this.options.delayBetweenStarts));
            } catch (error) {
                this.emit('account-status', {
                    account,
                    status: 'failed',
                    message: `Lỗi khởi tạo: ${error.message}`
                });
            }
        }
    }

    /**
     * Phân tích cú pháp tài khoản từ mảng hoặc chuỗi
     */
    _parseAccounts(accounts) {
        if (!accounts) return [];
        
        if (Array.isArray(accounts)) {
            return accounts;
        }
        
        return accounts
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && line.includes('|'));
    }

    /**
     * Phân tích cú pháp proxy từ mảng hoặc chuỗi
     */
    _parseProxies(proxies) {
        if (!proxies) return [];
        
        if (Array.isArray(proxies)) {
            return proxies;
        }
        
        return proxies
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && (line.includes(':') || line.includes('.')));
    }

    /**
     * Gán proxy cho từng tài khoản
     */
    _assignProxiesToAccounts() {
        const assignments = [];
        
        // Đảm bảo tối thiểu là 1 tài khoản/proxy
        const accountsPerProxy = Math.max(1, this.accountsPerProxy);
        
        // Lặp qua từng proxy và gán nhiều tài khoản cho nó
        for (let i = 0; i < this.proxies.length; i++) {
            const proxy = this.proxies[i];
            
            // Tính số lượng tài khoản có thể được gán cho proxy này
            const startIndex = i * accountsPerProxy;
            const endIndex = Math.min(startIndex + accountsPerProxy, this.accounts.length);
            
            // Gán tài khoản cho proxy
            for (let j = startIndex; j < endIndex; j++) {
                if (j >= this.accounts.length) break;
                
                assignments.push({
                    account: this.accounts[j],
                    proxy: proxy
                });
            }
            
            // Nếu đã sử dụng hết tài khoản, thoát khỏi vòng lặp
            if (endIndex >= this.accounts.length) {
                break;
            }
        }
        
        return assignments;
    }
}

module.exports = {
    TiktokViewerManager,
    TiktokAccount
};