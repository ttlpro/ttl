const BaseStorage = require('./base-storage');
const { log, error } = require('../logger');

class DatabaseSchema extends BaseStorage {
    /**
     * Tạo tất cả tables
     */

    resetRoomAccountsAndProxies(){
        try {
            // Kiểm tra database connection
            if (!this.db) {
                error('❌ Database connection not initialized');
                return false;
            }

            log('🔄 Resetting room accounts and proxies...');
            
            const now = new Date().toISOString();
            
            // Sử dụng transaction để đảm bảo consistency
            const resetTransaction = this.db.transaction(() => {
                // 1. Reset rooms status
                const resetRoomsStmt = this.db.prepare(`
                    UPDATE rooms 
                    SET status = 'stopped', 
                        stoppedAt = ?, 
                        endedAt = ?,
                        updatedAt = ?,
                        stopReason = 'reset_stopped'
                    WHERE status IN ('watching')
                `);
                const roomsResult = resetRoomsStmt.run(now, now, now);
                log(`🔄 Reset ${roomsResult.changes} rooms to stopped status`);
                
                // 2. Reset accounts activeRooms and currentRooms
                const resetAccountsStmt = this.db.prepare(`
                    UPDATE accounts 
                    SET activeRooms = '[]', 
                        currentRooms = 0, 
                        lastUsed = ?,
                        updatedAt = ?
                `);
                const accountsResult = resetAccountsStmt.run(now, now);
                log(`🔄 Reset ${accountsResult.changes} accounts active rooms`);
                
                // 3. Clear all account-room relationships
                const clearAccountRoomsStmt = this.db.prepare(`DELETE FROM account_rooms`);
                const accountRoomsResult = clearAccountRoomsStmt.run();
                log(`🔄 Cleared ${accountRoomsResult.changes} account-room relationships`);
                
                // 4. Reset tasks status
                const resetTasksStmt = this.db.prepare(`
                    UPDATE tasks 
                    SET status = 'idle',
                        updatedAt = ?
                    WHERE status = 'running'
                `);
                const tasksResult = resetTasksStmt.run(now);
                log(`🔄 Reset ${tasksResult.changes} tasks to idle status`);
                
                return {
                    roomsReset: roomsResult.changes,
                    accountsReset: accountsResult.changes,
                    relationshipsCleared: accountRoomsResult.changes,
                    tasksReset: tasksResult.changes
                };
            });
            
            // Thực hiện transaction
            const result = resetTransaction();
            
            log('✅ Reset room accounts and proxies successfully');
            log(`📊 Summary: ${result.roomsReset} rooms, ${result.accountsReset} accounts, ${result.relationshipsCleared} relationships, ${result.tasksReset} tasks`);
            
            return true;
            
        } catch (err) {
            error('❌ Error resetting room accounts and proxies:', err);
            return false;
        }
    }

    createTables() {
        log('🔧 Creating database tables...');

        // Folders table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS folders (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL CHECK (type IN ('accounts', 'proxies')),
                color TEXT DEFAULT '#007bff',
                description TEXT DEFAULT '',
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL,
                UNIQUE(name, type)
            )
        `);

        // Accounts table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS accounts (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL UNIQUE,
                sessionId TEXT,
                password TEXT,
                email TEXT,
                emailPassword TEXT,
                cookie TEXT,
                folderId TEXT,
                status TEXT DEFAULT 'inactive',
                lastActive TEXT,
                lastUsed TEXT,
                currentRooms INTEGER DEFAULT 0,
                avatarThumb TEXT,
                roomUsername TEXT,
                activeRooms TEXT DEFAULT '[]',
                viewerCount INTEGER DEFAULT 0,
                followCount INTEGER DEFAULT 0,
                shareCount INTEGER DEFAULT 0,
                totalViews INTEGER DEFAULT 0,
                totalShares INTEGER DEFAULT 0,
                totalFollows INTEGER DEFAULT 0,
                isLive INTEGER DEFAULT 0,
                proxyId TEXT,
                metadata TEXT DEFAULT '{}',
                notes TEXT DEFAULT '',
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL,
                FOREIGN KEY (folderId) REFERENCES folders(id) ON DELETE SET NULL,
                FOREIGN KEY (proxyId) REFERENCES proxies(id) ON DELETE SET NULL
            )
        `);

        // Proxies table  
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS proxies (
                id TEXT PRIMARY KEY,
                host TEXT NOT NULL,
                port INTEGER NOT NULL,
                username TEXT,
                password TEXT,
                type TEXT DEFAULT 'http' CHECK (type IN ('http', 'https', 'socks4', 'socks5')),
                folderId TEXT,
                status TEXT DEFAULT 'active',
                lastTested TEXT,
                responseTime INTEGER DEFAULT 0,
                notes TEXT DEFAULT '',
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL,
                FOREIGN KEY (folderId) REFERENCES folders(id) ON DELETE SET NULL,
                UNIQUE(host, port)
            )
        `);

        // Rooms table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS rooms (
                uid TEXT PRIMARY KEY,
                id TEXT,
                roomId TEXT,
                roomUrl TEXT,
                roomUsername TEXT,
                nickname TEXT,
                avatar TEXT,
                avatarThumb TEXT,
                title TEXT DEFAULT '',
                viewerCount INTEGER DEFAULT 0,
                currentViewers INTEGER DEFAULT 0,
                startCount INTEGER DEFAULT 0,
                targetViewers INTEGER DEFAULT 0,
                duration INTEGER DEFAULT 30,
                isLive INTEGER DEFAULT 0,
                lastViewed TEXT,
                notes TEXT DEFAULT '',
                status TEXT DEFAULT 'stopped',
                startedAt TEXT,
                endedAt TEXT,
                realViewers INTEGER DEFAULT 0,
                lastTimeCheckViewers TEXT,
                stoppedAt TEXT,
                stopReason TEXT,
                finalDuration INTEGER DEFAULT 0,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
        `);

        // Account-Room relationship table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS account_rooms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                accountId TEXT NOT NULL,
                roomId TEXT NOT NULL,
                createdAt TEXT NOT NULL,
                FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE,
                FOREIGN KEY (roomId) REFERENCES rooms(uid) ON DELETE CASCADE,
                UNIQUE(accountId, roomId)
            )
        `);

        // Update state table for auto-update system
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS update_state (
                id INTEGER PRIMARY KEY DEFAULT 1,
                currentVersion TEXT NOT NULL,
                latestVersion TEXT,
                hasUpdateAvailable INTEGER DEFAULT 0,
                updateInfo TEXT,
                lastCheckTime TEXT,
                updateDismissed INTEGER DEFAULT 0,
                updateDownloaded INTEGER DEFAULT 0,
                updateInstalled INTEGER DEFAULT 0,
                releaseNotes TEXT,
                downloadUrl TEXT,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL,
                CHECK (id = 1)
            )
        `);

        // Viewer history table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS viewer_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                roomUid TEXT NOT NULL,
                viewerCount INTEGER NOT NULL,
                timestamp TEXT NOT NULL,
                FOREIGN KEY (roomUid) REFERENCES rooms(uid) ON DELETE CASCADE
            )
        `);

        // Settings table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
        `);

        // Tasks table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                handler TEXT NOT NULL,
                interval INTEGER NOT NULL,
                enabled INTEGER DEFAULT 1,
                status TEXT DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'completed', 'failed')),
                lastRun TEXT,
                nextRun TEXT,
                runCount INTEGER DEFAULT 0,
                errorCount INTEGER DEFAULT 0,
                lastError TEXT,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
        `);

        // Auth table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS auth (
                id TEXT PRIMARY KEY,
                userId TEXT NOT NULL UNIQUE,
                username TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL,
                name TEXT NOT NULL,
                token TEXT NOT NULL,
                refreshToken TEXT,
                status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
                loginAt TEXT NOT NULL,
                lastChecked TEXT,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
        `);

        // License table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS license (
                id TEXT PRIMARY KEY,
                licenseId TEXT NOT NULL UNIQUE,
                type TEXT NOT NULL,
                name TEXT NOT NULL,
                accounts INTEGER NOT NULL DEFAULT 0,
                rooms INTEGER NOT NULL DEFAULT 0,
                duration INTEGER NOT NULL DEFAULT 0,
                price INTEGER DEFAULT 0,
                description TEXT DEFAULT '',
                status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'suspended')),
                startDate TEXT NOT NULL,
                expiresAt TEXT NOT NULL,
                lastChecked TEXT,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
        `);

        // Create indexes for better performance
        this.createIndexes();

        log('✅ Database tables created successfully');
    }

    /**
     * Tạo indexes
     */
    createIndexes() {
        try {
            // Folders indexes
            this.db.exec(`CREATE INDEX IF NOT EXISTS idx_folders_type ON folders(type)`);
            
            // Accounts indexes
            this.db.exec(`CREATE INDEX IF NOT EXISTS idx_accounts_username ON accounts(username)`);
            this.db.exec(`CREATE INDEX IF NOT EXISTS idx_accounts_folder ON accounts(folderId)`);
            this.db.exec(`CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status)`);
            this.db.exec(`CREATE INDEX IF NOT EXISTS idx_accounts_proxy ON accounts(proxyId)`);
            
            // Proxies indexes
            this.db.exec(`CREATE INDEX IF NOT EXISTS idx_proxies_folder ON proxies(folderId)`);
            this.db.exec(`CREATE INDEX IF NOT EXISTS idx_proxies_status ON proxies(status)`);
            this.db.exec(`CREATE INDEX IF NOT EXISTS idx_proxies_host_port ON proxies(host, port)`);
            
            // Rooms indexes
            this.db.exec(`CREATE INDEX IF NOT EXISTS idx_rooms_roomUsername ON rooms(roomUsername)`);
            this.db.exec(`CREATE INDEX IF NOT EXISTS idx_rooms_live ON rooms(isLive)`);
            
            // Account-rooms indexes
            this.db.exec(`CREATE INDEX IF NOT EXISTS idx_account_rooms_account ON account_rooms(accountId)`);
            this.db.exec(`CREATE INDEX IF NOT EXISTS idx_account_rooms_room ON account_rooms(roomId)`);
            
            // Viewer history indexes
            this.db.exec(`CREATE INDEX IF NOT EXISTS idx_viewer_history_room ON viewer_history(roomUid)`);
            this.db.exec(`CREATE INDEX IF NOT EXISTS idx_viewer_history_timestamp ON viewer_history(timestamp)`);
            
            // Auth indexes
            this.db.exec(`CREATE INDEX IF NOT EXISTS idx_auth_userId ON auth(userId)`);
            this.db.exec(`CREATE INDEX IF NOT EXISTS idx_auth_username ON auth(username)`);
            this.db.exec(`CREATE INDEX IF NOT EXISTS idx_auth_status ON auth(status)`);
            
            // License indexes
            this.db.exec(`CREATE INDEX IF NOT EXISTS idx_license_licenseId ON license(licenseId)`);
            this.db.exec(`CREATE INDEX IF NOT EXISTS idx_license_status ON license(status)`);
            this.db.exec(`CREATE INDEX IF NOT EXISTS idx_license_expiresAt ON license(expiresAt)`);
            
            // Tasks indexes
            this.db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`);
            this.db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_enabled ON tasks(enabled)`);
            
            log('✅ Database indexes created successfully');
        } catch (err) {
            error('❌ Error creating indexes:', err);
        }
    }

    /**
     * Insert default data
     */
    async insertDefaultData() {
        try {
            log('🔧 Inserting default data...');
            
            // Insert default settings
            const settingsStmt = this.db.prepare(`
                INSERT OR IGNORE INTO settings (key, value, updatedAt)
                VALUES (?, ?, ?)
            `);
            
            const now = new Date().toISOString();
            for (const [key, value] of Object.entries(this.defaultSettings)) {
                settingsStmt.run(key, JSON.stringify(value), now);
            }
            
            // ✅ TẠO THỜI MỤC DEFAULT CHO ACCOUNTS VÀ PROXIES
            const folderStmt = this.db.prepare(`
                INSERT OR IGNORE INTO folders (id, name, type, color, description, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            
            // Tạo thư mục default cho accounts
            folderStmt.run(
                'accounts-default',
                'Mặc định',
                'accounts',
                '#6B7280',
                'Thư mục mặc định cho tài khoản',
                now,
                now
            );
            
            // Tạo thư mục default cho proxies  
            folderStmt.run(
                'proxies-default',
                'Mặc định',
                'proxies',
                '#6B7280',
                'Thư mục mặc định cho proxy',
                now,
                now
            );
            
            log('✅ Default data inserted successfully');
        } catch (err) {
            error('❌ Error inserting default data:', err);
            throw error;
        }
    }

    /**
     * Kiểm tra database integrity
     */
    checkIntegrity() {
        try {
            const result = this.db.pragma('integrity_check');
            if (result[0].integrity_check === 'ok') {
                log('✅ Database integrity check passed');
                return true;
            } else {
                error('❌ Database integrity check failed:', result);
                return false;
            }
        } catch (err) {
            error('❌ Error checking database integrity:', err);
            return false;
        }
    }

    /**
     * Kiểm tra và cập nhật schema database
     */
    async migrateSchema() {
        try {
            log('🔧 Checking and migrating database schema...');
            
            // Kiểm tra và sửa bảng rooms nếu có vấn đề
            await this.fixRoomsTable();
            
            // Kiểm tra cột activeRooms trong bảng accounts
            if (!this.columnExists('accounts', 'activeRooms')) {
                log('➕ Adding column activeRooms to accounts table');
                this.db.exec(`ALTER TABLE accounts ADD COLUMN activeRooms TEXT DEFAULT '[]'`);
            }
            
            // Kiểm tra cột password trong bảng accounts
            if (!this.columnExists('accounts', 'password')) {
                log('➕ Adding column password to accounts table');
                this.db.exec(`ALTER TABLE accounts ADD COLUMN password TEXT`);
            }
            
            // Kiểm tra cột email trong bảng accounts
            if (!this.columnExists('accounts', 'email')) {
                log('➕ Adding column email to accounts table');
                this.db.exec(`ALTER TABLE accounts ADD COLUMN email TEXT`);
            }
            
            // Kiểm tra cột emailPassword trong bảng accounts
            if (!this.columnExists('accounts', 'emailPassword')) {
                log('➕ Adding column emailPassword to accounts table');
                this.db.exec(`ALTER TABLE accounts ADD COLUMN emailPassword TEXT`);
            }
            
            // Kiểm tra cột lastUsed trong bảng accounts
            if (!this.columnExists('accounts', 'lastUsed')) {
                log('➕ Adding column lastUsed to accounts table');
                this.db.exec(`ALTER TABLE accounts ADD COLUMN lastUsed TEXT`);
            }
            
            // Kiểm tra cột currentRooms trong bảng accounts
            if (!this.columnExists('accounts', 'currentRooms')) {
                log('➕ Adding column currentRooms to accounts table');
                this.db.exec(`ALTER TABLE accounts ADD COLUMN currentRooms INTEGER DEFAULT 0`);
            }
            
            // Kiểm tra cột avatarThumb trong bảng accounts
            if (!this.columnExists('accounts', 'avatarThumb')) {
                log('➕ Adding column avatarThumb to accounts table');
                this.db.exec(`ALTER TABLE accounts ADD COLUMN avatarThumb TEXT`);
            }
            
            // Kiểm tra cột roomUsername trong bảng accounts
            if (!this.columnExists('accounts', 'roomUsername')) {
                log('➕ Adding column roomUsername to accounts table');
                this.db.exec(`ALTER TABLE accounts ADD COLUMN roomUsername TEXT`);
            }
            // Kiểm tra cột cookie trong bảng accounts
            if (!this.columnExists('accounts', 'cookie')) {
                log('➕ Adding column cookie to accounts table');
                this.db.exec(`ALTER TABLE accounts ADD COLUMN cookie TEXT`);
            }
            
            // Kiểm tra xem có cột username trong bảng rooms không (lỗi schema cũ)
            if (this.columnExists('rooms', 'username') && !this.columnExists('rooms', 'roomUsername')) {
                log('🔄 Migrating from username to roomUsername in rooms table');
                // Thêm cột roomUsername mới
                this.db.exec(`ALTER TABLE rooms ADD COLUMN roomUsername TEXT`);
                
                // Sao chép dữ liệu từ username sang roomUsername
                this.db.exec(`UPDATE rooms SET roomUsername = username WHERE roomUsername IS NULL AND username IS NOT NULL`);
                
                // Thay đổi index
                this.db.exec(`DROP INDEX IF EXISTS idx_rooms_username`);
                this.db.exec(`CREATE INDEX IF NOT EXISTS idx_rooms_roomUsername ON rooms(roomUsername)`);
            }
            
            // Kiểm tra các trường bổ sung trong bảng rooms
            const additionalRoomColumns = [
                { name: 'id', type: 'TEXT' },
                { name: 'roomId', type: 'TEXT' },
                { name: 'roomUrl', type: 'TEXT' },
                { name: 'roomUsername', type: 'TEXT' },
                { name: 'avatarThumb', type: 'TEXT' },
                { name: 'startCount', type: 'INTEGER DEFAULT 0' },
                { name: 'targetViewers', type: 'INTEGER DEFAULT 0' },
                { name: 'currentViewers', type: 'INTEGER DEFAULT 0' },
                { name: 'duration', type: 'INTEGER DEFAULT 30' },
                { name: 'status', type: 'TEXT DEFAULT "stopped"' },
                { name: 'startedAt', type: 'TEXT' },
                { name: 'endedAt', type: 'TEXT' },
                { name: 'realViewers', type: 'INTEGER DEFAULT 0' },
                { name: 'lastTimeCheckViewers', type: 'TEXT' },
                { name: 'stoppedAt', type: 'TEXT' },
                { name: 'stopReason', type: 'TEXT' },
                { name: 'finalDuration', type: 'INTEGER DEFAULT 0' }
            ];
            
            for (const column of additionalRoomColumns) {
                if (!this.columnExists('rooms', column.name)) {
                    log(`➕ Adding column ${column.name} to rooms table`);
                    this.db.exec(`ALTER TABLE rooms ADD COLUMN ${column.name} ${column.type}`);
                }
            }
            
            // Cập nhật các constraint cho trạng thái
            try {
                // Kiểm tra định nghĩa constraint status trong bảng proxies
                const proxyStatusInfo = this.db.prepare(`
                    SELECT sql FROM sqlite_master 
                    WHERE type='table' AND name='proxies'
                `).get();
                
                // Nếu không có constraint 'active' thì thêm vào
                if (proxyStatusInfo && proxyStatusInfo.sql && 
                    !proxyStatusInfo.sql.includes("'active'") && 
                    proxyStatusInfo.sql.includes("status TEXT")) {
                    log('🔄 Recreating proxies table with updated status constraint');
                    // Lưu dữ liệu hiện tại
                    this.db.exec(`CREATE TABLE IF NOT EXISTS proxies_temp AS SELECT * FROM proxies`);
                    // Xóa bảng cũ
                    this.db.exec(`DROP TABLE proxies`);
                    // Tạo lại bảng với constraint mới
                    this.db.exec(`
                        CREATE TABLE IF NOT EXISTS proxies (
                            id TEXT PRIMARY KEY,
                            host TEXT NOT NULL,
                            port INTEGER NOT NULL,
                            username TEXT,
                            password TEXT,
                            type TEXT DEFAULT 'http' CHECK (type IN ('http', 'https', 'socks4', 'socks5')),
                            folderId TEXT,
                            status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error', 'testing', 'unknown')),
                            lastTested TEXT,
                            responseTime INTEGER DEFAULT 0,
                            notes TEXT DEFAULT '',
                            createdAt TEXT NOT NULL,
                            updatedAt TEXT NOT NULL,
                            FOREIGN KEY (folderId) REFERENCES folders(id) ON DELETE SET NULL,
                            UNIQUE(host, port)
                        )
                    `);
                    // Khôi phục dữ liệu
                    this.db.exec(`INSERT INTO proxies SELECT * FROM proxies_temp`);
                    // Xóa bảng tạm
                    this.db.exec(`DROP TABLE proxies_temp`);
                }
                
                // Kiểm tra định nghĩa constraint status trong bảng accounts
                const accountStatusInfo = this.db.prepare(`
                    SELECT sql FROM sqlite_master 
                    WHERE type='table' AND name='accounts'
                `).get();
                
                if (accountStatusInfo && accountStatusInfo.sql && 
                    !accountStatusInfo.sql.includes("'active'") && 
                    accountStatusInfo.sql.includes("status TEXT")) {
                    log('🔄 Recreating accounts table with updated status constraint');
                    // Lưu dữ liệu hiện tại
                    this.db.exec(`CREATE TABLE IF NOT EXISTS accounts_temp AS SELECT * FROM accounts`);
                    // Xóa bảng cũ
                    this.db.exec(`DROP TABLE accounts`);
                    // Xóa folder default cũ trước khi tạo lại
                    this.db.exec(`DELETE FROM folders WHERE id = 'default' AND type = 'accounts'`);
                    
                    // Tạo lại bảng với constraint mới
                    this.createTables(); // Tạo lại tất cả tables
                    // Reset room accounts và task
                    this.resetRoomAccountsAndProxies();
                    // Khôi phục dữ liệu
                    this.db.exec(`
                        INSERT OR IGNORE INTO accounts 
                        SELECT * FROM accounts_temp
                    `);
                    // Xóa bảng tạm
                    this.db.exec(`DROP TABLE accounts_temp`);
                }
            } catch (err) {
                error('❌ Error updating constraints:', err);
            }
            
            log('✅ Database schema migration completed successfully');
            return true;
        } catch (err) {
            error('❌ Error migrating database schema:', err);
            throw error;
        }
    }
    /**
     * Kiểm tra xem cột có tồn tại trong bảng không
     */
    columnExists(table, column) {
        try {
            const result = this.db.prepare(`PRAGMA table_info(${table})`).all();
            return result.some(col => col.name === column);
        } catch (err) {
            error(`❌ Error checking if column ${column} exists in ${table}:`, err);
            return false;
        }
    }

    /**
     * Get database info
     */
    getDatabaseInfo() {
        try {
            const info = {
                path: this.dbPath,
                size: require('fs').statSync(this.dbPath).size,
                tables: [],
                version: this.db.pragma('user_version')[0].user_version
            };

            // Get table names và row counts
            const tables = this.db.prepare(`
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
            `).all();

            for (const table of tables) {
                const count = this.db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
                info.tables.push({
                    name: table.name,
                    rows: count.count
                });
            }

            return info;
        } catch (err) {
            error('Error getting database info:', err);
            return null;
        }
    }

    /**
     * Kiểm tra và sửa chữa bảng rooms nếu có lỗi schema
     */
    async fixRoomsTable() {
        try {
            log('🔧 Kiểm tra cấu trúc bảng rooms...');
            
            // Lấy thông tin về bảng rooms
            const tableInfo = this.db.prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'rooms'`).get();
            
            // Kiểm tra xem bảng có cột username bắt buộc không tồn tại trong schema
            if (tableInfo && tableInfo.sql && tableInfo.sql.includes('username TEXT NOT NULL')) {
                log('❌ Phát hiện schema lỗi: cột username NOT NULL trong bảng rooms');
                
                // Lưu dữ liệu hiện tại
                log('⏳ Sao lưu dữ liệu hiện tại...');
                this.db.exec(`CREATE TABLE IF NOT EXISTS rooms_backup AS SELECT * FROM rooms`);
                
                // Xóa index cũ
                log('⏳ Xóa index cũ...');
                this.db.exec(`DROP INDEX IF EXISTS idx_rooms_username`);
                this.db.exec(`DROP INDEX IF EXISTS idx_rooms_live`);
                
                // Xóa bảng cũ
                log('⏳ Xóa bảng cũ để tạo lại...');
                this.db.exec(`DROP TABLE rooms`);
                
                // Tạo lại bảng với schema đúng
                log('⏳ Tạo lại bảng với schema chính xác...');
                this.db.exec(`
                    CREATE TABLE IF NOT EXISTS rooms (
                        uid TEXT PRIMARY KEY,
                        id TEXT,
                        roomId TEXT,
                        roomUrl TEXT,
                        roomUsername TEXT,
                        nickname TEXT,
                        avatar TEXT,
                        avatarThumb TEXT,
                        title TEXT DEFAULT '',
                        viewerCount INTEGER DEFAULT 0,
                        currentViewers INTEGER DEFAULT 0,
                        startCount INTEGER DEFAULT 0,
                        targetViewers INTEGER DEFAULT 0,
                        duration INTEGER DEFAULT 30,
                        isLive INTEGER DEFAULT 0,
                        lastViewed TEXT,
                        notes TEXT DEFAULT '',
                        status TEXT DEFAULT 'stopped',
                        startedAt TEXT,
                        endedAt TEXT,
                        realViewers INTEGER DEFAULT 0,
                        lastTimeCheckViewers TEXT,
                        stoppedAt TEXT,
                        stopReason TEXT,
                        finalDuration INTEGER DEFAULT 0,
                        createdAt TEXT NOT NULL,
                        updatedAt TEXT NOT NULL
                    )
                `);
                
                // Tạo lại index
                log('⏳ Tạo lại index...');
                this.db.exec(`CREATE INDEX IF NOT EXISTS idx_rooms_roomUsername ON rooms(roomUsername)`);
                this.db.exec(`CREATE INDEX IF NOT EXISTS idx_rooms_live ON rooms(isLive)`);
                
                // Khôi phục dữ liệu - sao chép từ username sang roomUsername
                log('⏳ Khôi phục dữ liệu từ bảng backup...');
                this.db.exec(`
                    INSERT INTO rooms 
                    SELECT 
                        uid, id, roomId, roomUrl, 
                        COALESCE(roomUsername, username) as roomUsername,
                        nickname, avatar, avatarThumb, title,
                        viewerCount, currentViewers, startCount, targetViewers, 
                        duration, isLive, lastViewed, notes, 
                        status, startedAt, endedAt, realViewers, 
                        lastTimeCheckViewers, stoppedAt, stopReason, finalDuration,
                        createdAt, updatedAt 
                    FROM rooms_backup
                `);
                
                // Xóa bảng backup
                log('⏳ Xóa bảng backup...');
                this.db.exec(`DROP TABLE rooms_backup`);
                
                log('✅ Đã sửa chữa bảng rooms thành công!');
            } else {
                log('✅ Cấu trúc bảng rooms OK');
            }
            return true;
        } catch (err) {
            error('❌ Error fixing rooms table:', err);
            return false;
        }
    }
}

module.exports = DatabaseSchema; 