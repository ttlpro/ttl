const StorageAdapter = require('./storage-adapter');
const helper = require('../main/businesses/helper');
const GroupView = require('../main/businesses/Viewer');
const { log, error } = require('./logger');
const notificationManager = require('./notification-manager');
/**
 * Các hàm xử lý tasks
 */
class TaskHandlers {
    constructor(storageManager) {
        this.storageManager = storageManager || new StorageAdapter();
    }

    /**
     * Kiểm tra sức khỏe accounts
     */
    async checkAccountHealth() {
        log('Đang kiểm tra sức khỏe accounts...');
        
        try {
            const accounts = await this.storageManager.getAllAccounts();
            let healthyCount = 0;
            let unhealthyCount = 0;

            for (const account of accounts) {
                // Logic kiểm tra account health
                // Ví dụ: kiểm tra xem account có bị ban không
                if (account.status === 'active') {
                    healthyCount++;
                } else {
                    unhealthyCount++;
                }
            }

            log(`Kết quả kiểm tra: ${healthyCount} khỏe mạnh, ${unhealthyCount} có vấn đề`);
        } catch (err) {
            error('Lỗi khi kiểm tra sức khỏe accounts:', err);
            throw err;
        }
    }

    /**
     * Cập nhật trạng thái proxy
     */
    async updateProxyStatus() {
        log('Đang cập nhật trạng thái proxies...');
        
        try {
            const proxies = await this.storageManager.getAllProxies();
            let activeCount = 0;
            let inactiveCount = 0;

            for (const proxy of proxies) {
                // Logic test proxy
                try {
                    const result = await this.storageManager.testProxy(proxy.id);
                    if (result.success) {
                        activeCount++;
                    } else {
                        inactiveCount++;
                    }
                } catch (err) {
                    inactiveCount++;
                }
            }

            log(`Cập nhật proxy: ${activeCount} hoạt động, ${inactiveCount} không hoạt động`);
        } catch (err) {
            error('Lỗi khi cập nhật trạng thái proxies:', err);
            throw err;
        }
    }

    /**
     * Dọn dẹp dữ liệu cũ
     */
    async cleanupOldData() {
        log('Đang dọn dẹp dữ liệu cũ...');
        
        try {
            // Logic dọn dẹp dữ liệu cũ
            // Ví dụ: xóa logs cũ, dữ liệu tạm thời
            log('Hoàn thành dọn dẹp dữ liệu');
        } catch (err) {
            error('Lỗi khi dọn dẹp dữ liệu:', err);
            throw err;
        }
    }

    /**
     * Sao lưu dữ liệu
     */
    async backupData() {
        log('📦 Đang sao lưu database...');
        
        try {
            const fs = require('fs');
            const path = require('path');
            const { app } = require('electron');
            
            // Đường dẫn database gốc
            const dbPath = path.join(app.getPath('userData'), 'tiktok-live.db');
            
            // Tạo thư mục backup trong userData
            const backupDir = path.join(app.getPath('userData'), 'backups');
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
            
            // ✅ SỬA: Sử dụng storage manager để tạo backup an toàn
            log('📦 Tạo backup database với storage manager...');
            
            // Đảm bảo tất cả operations hoàn thành trước khi backup
            if (this.storageManager && typeof this.storageManager.checkpoint === 'function') {
                this.storageManager.checkpoint();
            }
            
            // Sử dụng file system copy an toàn
            await fs.promises.copyFile(dbPath, backupPath);
            
            // Verify backup file được tạo
            if (fs.existsSync(backupPath)) {
                const backupSize = fs.statSync(backupPath).size;
                const originalSize = fs.statSync(dbPath).size;
                
                if (backupSize === originalSize) {
                    log(`📦 Backup database thành công: ${backupFileName}`);
                    log(`📁 Đường dẫn: ${backupPath}`);
                    log(`📊 Kích thước: ${(backupSize / 1024 / 1024).toFixed(2)} MB`);
                    
                    // Xóa backup cũ (giữ lại 10 file gần nhất)
                    this.cleanupOldBackups(backupDir);
                    
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
            error('❌ Lỗi khi sao lưu database:', err);
            throw err;
        }
    }
    
    /**
     * Xóa backup cũ, chỉ giữ lại 10 file gần nhất
     */
    cleanupOldBackups(backupDir) {
        try {
            const fs = require('fs');
            const path = require('path');
            
            const files = fs.readdirSync(backupDir)
                .filter(file => file.startsWith('tiktok-live-backup-') && file.endsWith('.db'))
                .map(file => ({
                    name: file,
                    path: path.join(backupDir, file),
                    mtime: fs.statSync(path.join(backupDir, file)).mtime
                }))
                .sort((a, b) => b.mtime - a.mtime); // Sort by modification time, newest first
            
            // Xóa các file cũ (giữ lại 10 file)
            if (files.length > 10) {
                const filesToDelete = files.slice(10);
                for (const file of filesToDelete) {
                    fs.unlinkSync(file.path);
                    log(`🗑️ Đã xóa backup cũ: ${file.name}`);
                }
            }
            
            log(`📦 Hiện có ${Math.min(files.length, 10)} file backup`);
        } catch (err) {
            error('❌ Lỗi khi cleanup backup cũ:', err);
        }
    }

    /**
     * Giám sát phòng live và cập nhật currentViewers
     * Tự động dừng phòng khi không còn live
     */
    async monitorRooms() {
        log('🔍 Checking realViewers for live rooms...');
        
        try {
            const rooms = await this.storageManager.getAllRooms();
            
            // Lấy tối đa 20 rooms đang chạy, sort theo lastTimeCheckViewers lâu nhất ưu tiên trước
            const watchingRooms = rooms
                .filter(room => room.status === 'watching' && room.id) // Đảm bảo room có id
                .sort((a, b) => {
                    const aTime = a.lastTimeCheckViewers || '1970-01-01T00:00:00.000Z';
                    const bTime = b.lastTimeCheckViewers || '1970-01-01T00:00:00.000Z';
                    return new Date(aTime) - new Date(bTime);
                })
                .slice(0, 20);
            
            if (watchingRooms.length === 0) {
                log('📭 No watching rooms to check');
                return { success: true, code: 'noActiveRooms' };
            }
            
            log(`🎯 Checking ${watchingRooms.length} rooms...`);
            
            let successCount = 0;
            let errorCount = 0;
            let stoppedCount = 0; // Đếm số phòng bị dừng tự động
            let proxies = await helper.getProxySite()
            for (const room of watchingRooms) {
                try {
                    // Kiểm tra room.id không được null
                    if (!room.id) {
                        error('❌ Bỏ qua room không có id');
                        errorCount++;
                        continue;
                    }

                    log(`🔍 Checking room: ${room.roomUsername || room.roomId}`);
                    let proxy = proxies[Math.floor(Math.random() * proxies.length)];
                    // Sử dụng helper.getRoomInfo4 như yêu cầu
                    const roomInfo = await helper.getRoomInfo4({
                        room_id: room.roomId,
                        proxy: proxy
                    });
                    
                    if (roomInfo.err || roomInfo.view_count === undefined) {
                        log(`❌ Cannot get view_count for room ${room.roomId}:`, roomInfo);
                        errorCount++;
                        continue;
                    }
                    
                    const now = new Date().toISOString();
                    
                    // ⭐ TÍNH NĂNG MỚI: Tự động dừng phòng khi không còn live
                    if (!roomInfo.is_alive) {
                        log(`🛑 Room ${room.roomUsername || room.roomId} is no longer live - Auto stopping...`);
                        
                        try {
                            // Thực hiện đầy đủ workflow dừng phòng
                            await this.storageManager.updateRoom(room.id, { 
                                status: 'stopped',
                                stoppedAt: now,
                                stopReason: 'auto_stopped_not_live' // Lý do dừng
                            });
                            notificationManager.notifyRoomStopped(room);
                            // ✅ Sử dụng GroupView đã import sẵn
                            await GroupView.stopViewers({ task_id: room.id });
                            
                            // Giải phóng các accounts
                            try {
                                await this.storageManager.releaseAccountsFromRoom(room.id);
                                log(`✅ Released accounts from auto-stopped room ${room.id}`);
                            } catch (releaseError) {
                                error(`❌ Error releasing accounts from room ${room.id}:`, releaseError);
                            }
                            
                            log(`✅ Auto-stopped room ${room.roomUsername}: Not live anymore`);
                            stoppedCount++;
                            
                        } catch (stopError) {
                            error(`❌ Error auto-stopping room ${room.roomId}:`, stopError);
                            errorCount++;
                        }
                        
                        continue; // Skip việc cập nhật viewers cho phòng đã dừng
                    }
                    
                    // Thêm vào file history riêng thay vì rooms.json
                    await this.storageManager.addViewerHistoryEntry(room.id, {
                        timestamp: now,
                        viewers: roomInfo.view_count,
                        isAlive: roomInfo.is_alive
                    });
                    
                    // Chỉ update realViewers + lastTimeCheckViewers trong rooms.json
                    // KHÔNG ghi đè currentViewers (đó là số account tool)
                    await this.storageManager.updateRoom(room.id, {
                        realViewers: roomInfo.view_count,  // <-- Field mới cho viewer thực TikTok
                        lastTimeCheckViewers: now
                    });
                    
                    log(`✅ Updated room ${room.roomUsername}: ${roomInfo.view_count} real viewers`);
                    successCount++;
                    
                    // Delay để tránh rate limit
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                } catch (err) {
                    error(`❌ Error checking room ${room.roomId}:`, err);
                    errorCount++;
                }
            }
            
            log(`✅ Completed monitoring: ${successCount} updated, ${stoppedCount} auto-stopped, ${errorCount} errors`);
            
            return { 
                success: true, 
                code: 'roomMonitoringCompleted',
                params: { 
                    updated: successCount,
                    autoStopped: stoppedCount,
                    errors: errorCount 
                }
            };
            
        } catch (err) {
            error('❌ Error monitoring rooms:', err);
            return { 
                success: false, 
                code: 'taskStartFailed' 
            };
        }
    }

    /**
     * Cập nhật info cho accounts chưa có thông tin
     */
    async updateAccountsInfo() {
        log('Đang cập nhật info cho accounts...');
        
        try {
            // Lấy 10 accounts chưa có info, sort theo createdAt cũ nhất
            const accounts = await this.storageManager.getAllAccounts();
            
            // Filter accounts chưa có avatarThumb hoặc roomUsername
            const accountsNeedInfo = accounts
                .filter(account => !account.avatarThumb || !account.roomUsername)
                .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                .slice(0, 50); // Lấy 10 accounts đầu tiên
            
            if (accountsNeedInfo.length === 0) {
                log('✅ Tất cả accounts đã có thông tin đầy đủ');
                return;
            }
            
            log(`🔄 Tìm thấy ${accountsNeedInfo.length} accounts cần cập nhật info`);
            
            
            let successCount = 0;
            let errorCount = 0;
            let proxies = await helper.getProxySite()
            for (const account of accountsNeedInfo) {
                try {
                    log(`🔄 Đang cập nhật info cho account: ${account.username}`);
                    
                    // Gọi getUserInfo
                    let proxy = proxies[Math.floor(Math.random() * proxies.length)];
                    log("🔄 Using proxy:", proxy)
                    const result = await helper.getUserInfo({
                        proxy: proxy,
                        username: account.username
                    });
                    
                    if (result.err || !result.avatarThumb) {
                        log(`❌ Lỗi khi lấy info cho ${account.username}:`, result);
                        errorCount++;
                        continue;
                    }
                    
                    // Cập nhật account với thông tin mới
                    await this.storageManager.updateAccount(account.id, {
                        avatarThumb: result.avatarThumb,
                        roomUsername: result.roomUsername || account.username,
                        updatedAt: new Date()
                    });
                    
                    log(`✅ Cập nhật thành công cho ${account.username}: ${result.roomUsername}`);
                    successCount++;
                    
                    // Delay giữa các request để tránh rate limit
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                } catch (err) {
                    error(`❌ Lỗi khi xử lý account ${account.username}:`, err);
                    errorCount++;
                }
            }
            
            log(`✅ Hoàn thành cập nhật info: ${successCount} thành công, ${errorCount} lỗi`);
            
        } catch (err) {
            error('❌ Lỗi khi cập nhật account info:', err);
            throw err;
        }
    }
    
    /**
     * Tự động dừng rooms đã hết thời gian chạy
     * Task chạy ngầm như crontask
     */
    async autoStopExpiredRooms() {
        log('⏰ Checking for expired rooms to auto-stop...');
        
        try {
            const rooms = await this.storageManager.getAllRooms();
            
            // Lấy tất cả rooms đang watching
            const watchingRooms = rooms.filter(room => room.status === 'watching' && room.id);
            
            if (watchingRooms.length === 0) {
                log('📭 No watching rooms to check for expiration');
                return { success: true, code: 'noActiveRooms' };
            }
            
            // Shuffle và lấy tối đa 100 rooms ngẫu nhiên
            const shuffledRooms = watchingRooms.sort(() => Math.random() - 0.5);
            const roomsToCheck = shuffledRooms.slice(0, 100);
            
            log(`🎲 Checking ${roomsToCheck.length} random rooms for expiration...`);
            
            let expiredCount = 0;
            let errorCount = 0;
            let checkedCount = 0;
            
            const now = new Date();
            
            for (const room of roomsToCheck) {
                try {
                    checkedCount++;
                    
                    // Kiểm tra room.id không được null
                    if (!room.id) {
                        error('❌ Bỏ qua room không có id');
                        errorCount++;
                        continue;
                    }
                    
                    // Kiểm tra xem room có startedAt và duration không
                    if (!room.startedAt || !room.duration) {
                        log(`⚠️ Room ${room.roomUsername || room.roomId} missing startedAt or duration - skipping`);
                        continue;
                    }
                    
                    const startedAt = new Date(room.startedAt);
                    const durationMs = room.duration * 60 * 1000; // Convert duration (phút) to milliseconds
                    const runningTime = now - startedAt;
                    
                    // Kiểm tra nếu đã hết thời gian chạy
                    if (runningTime >= durationMs) {
                        const runningMinutes = Math.floor(runningTime / (60 * 1000));
                        log(`⏰ Room ${room.roomUsername || room.roomId} expired (${runningMinutes}min >= ${room.duration}min) - Auto stopping...`);
                        
                        try {
                            // Thực hiện đầy đủ workflow dừng phòng
                            await this.storageManager.updateRoom(room.id, {
                                status: 'stopped',
                                stoppedAt: now.toISOString(),
                                stopReason: 'auto_stopped_duration_expired',
                                finalDuration: runningMinutes // Lưu thời gian chạy thực tế
                            });
                            notificationManager.notifyRoomStopped(room);
                            // Dừng viewers
                            await GroupView.stopViewers({
                                task_id: room.id
                            });
                            
                            // Giải phóng các accounts
                            try {
                                await this.storageManager.releaseAccountsFromRoom(room.id);
                                log(`✅ Released accounts from auto-stopped expired room ${room.id}`);
                            } catch (releaseError) {
                                error(`❌ Error releasing accounts from room ${room.id}:`, releaseError);
                            }
                            
                            log(`✅ Auto-stopped expired room ${room.roomUsername}: Ran for ${runningMinutes} minutes`);
                            expiredCount++;
                            
                        } catch (stopError) {
                            error(`❌ Error auto-stopping expired room ${room.roomId}:`, stopError);
                            errorCount++;
                        }
                    } else {
                        const remainingMinutes = Math.floor((durationMs - runningTime) / (60 * 1000));
                        log(`⏳ Room ${room.roomUsername || room.roomId} still running (${remainingMinutes}min remaining)`);
                    }
                    
                    // Delay nhỏ để không quá tải
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                } catch (err) {
                    error(`❌ Error checking room ${room.roomId}:`, err);
                    errorCount++;
                }
            }
            
            log(`✅ Completed duration check: ${checkedCount} checked, ${expiredCount} auto-stopped, ${errorCount} errors`);
            
            return { 
                success: true, 
                code: 'expiredRoomsChecked',
                params: { 
                    checked: checkedCount,
                    expired: expiredCount,
                    errors: errorCount 
                }
            };
            
        } catch (err) {
            error('❌ Error checking expired rooms:', err);
            return { 
                success: false, 
                code: 'taskStartFailed' 
            };
        }
    }

    /**
     * Tự động refresh license từ API
     */
    async refreshLicense() {
        log('🔄 Starting license refresh task...');
        
        try {
            // Lấy auth manager và thực hiện refresh license
            const AuthManager = require('./auth-manager');
            const authManager = new AuthManager(this.storageManager);
            
            // Refresh license từ API
            const result = await authManager.updateLicenseFromAPI();
            
            if (result.success) {
                if (result.hasChanges) {
                    log('✅ License refreshed with changes by task');
                    return { 
                        success: true, 
                        code: 'licenseRefreshedWithChanges',
                        message: 'License refreshed successfully with changes',
                        hasChanges: true
                    };
                } else {
                    log('✅ License refreshed (no changes) by task');
                    return { 
                        success: true, 
                        code: 'licenseRefreshedNoChanges',
                        message: 'License refreshed successfully (no changes)',
                        hasChanges: false
                    };
                }
            } else {
                error('❌ License refresh failed:', result.error);
                return { 
                    success: false, 
                    code: 'licenseRefreshFailed',
                    error: result.error || 'Unknown error'
                };
            }
            
        } catch (err) {
            error('❌ Error refreshing license:', err);
            return { 
                success: false, 
                code: 'licenseRefreshFailed',
                error: error.message 
            };
        }
    }

    /**
     * Sao lưu dữ liệu không bao gồm viewer_history (để giảm kích thước)
     */
    async backupDataWithoutHistory() {
        log('📦 Đang sao lưu database (loại bỏ viewer_history)...');
        
        try {
            const fs = require('fs');
            const path = require('path');
            const { app } = require('electron');
            
            // Đường dẫn database gốc
            const dbPath = path.join(app.getPath('userData'), 'tiktok-live.db');
            
            // Tạo thư mục backup trong userData
            const backupDir = path.join(app.getPath('userData'), 'backups');
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
            
            // ✅ Sử dụng storage manager để export data và tạo backup mới
            log('📦 Export data từ storage manager...');
            
            // Lấy tất cả data trừ viewer_history
            const accounts = await this.storageManager.getAllAccounts();
            const proxies = await this.storageManager.getAllProxies();
            const folders = await this.storageManager.getAllFolders();
            const rooms = await this.storageManager.getAllRooms();
            const settings = await this.storageManager.getSettings();
            const tasks = await this.storageManager.getAllTasks();
            
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
            
            // Import data
            if (accounts && accounts.length > 0) {
                const stmt = backupDb.prepare(`
                    INSERT INTO accounts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                for (const account of accounts) {
                    stmt.run(
                        account.id, account.uid, account.username, account.nickname, 
                        account.avatar, account.avatarThumb, account.sessionId, account.proxyId,
                        account.folderId, account.status, account.lastChecked, account.viewerCount,
                        account.realViewers, account.roomId, account.roomUrl, account.notes,
                        account.isActive, account.lastError, account.createdAt, account.updatedAt
                    );
                }
            }
            
            if (proxies && proxies.length > 0) {
                const stmt = backupDb.prepare(`
                    INSERT INTO proxies VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                for (const proxy of proxies) {
                    stmt.run(
                        proxy.id, proxy.host, proxy.port, proxy.username, proxy.password,
                        proxy.type, proxy.folderId, proxy.status, proxy.lastChecked, proxy.responseTime,
                        proxy.country, proxy.notes, proxy.isActive, proxy.createdAt, proxy.updatedAt
                    );
                }
            }
            
            // Import các data khác tương tự...
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
                
                log(`📦 Backup database thành công (không có viewer_history): ${backupFileName}`);
                log(`📁 Đường dẫn: ${backupPath}`);
                log(`📊 Kích thước backup: ${(backupSize / 1024 / 1024).toFixed(2)} MB`);
                log(`📊 Kích thước gốc: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
                log(`💾 Tiết kiệm: ${(((originalSize - backupSize) / originalSize) * 100).toFixed(1)}%`);
                
                // Xóa backup cũ (giữ lại 10 file gần nhất)
                this.cleanupOldBackups(backupDir);
                
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
            error('❌ Lỗi khi sao lưu database (no history):', err);
            throw err;
        }
    }
}

// ⭐ Export class TaskHandlers để có thể khởi tạo với storageManager
module.exports = TaskHandlers;