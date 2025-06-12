const BaseStorage = require('./base-storage');
const { log, error } = require('../logger');

class AccountStorage extends BaseStorage {
    /**
     * Lấy tất cả accounts
     */
    async getAllAccounts() {
        try {
            log('🔄 Gọi getAllAccounts');
            const stmt = this.db.prepare(`
                SELECT a.*, f.name as folderName, f.color as folderColor
                FROM accounts a
                LEFT JOIN folders f ON a.folderId = f.id
                ORDER BY a.username ASC
            `);
            
            const accounts = stmt.all();
            log(`📊 Đọc được ${accounts.length} tài khoản từ database`);
            
            // Xử lý dữ liệu trả về
            const processedAccounts = accounts.map(account => {
                // Parse activeRooms từ JSON string
                let activeRooms = [];
                try {
                    if (account.activeRooms) {
                        activeRooms = JSON.parse(account.activeRooms);
                    }
                } catch (e) {
                    error('❌ Lỗi parse activeRooms:', e);
                }
                
                // Xử lý metadata
                let metadata = {};
                try {
                    if (account.metadata) {
                        metadata = JSON.parse(account.metadata);
                    }
                } catch (e) {
                    error('❌ Lỗi parse metadata:', e);
                }
                
                return {
                    ...account,
                    // Convert Boolean values
                    isLive: Boolean(account.isLive),
                    // Parse JSON fields
                    activeRooms: activeRooms,
                    metadata: metadata,
                    // Keep ISO date strings
                    lastActive: account.lastActive,
                    createdAt: account.createdAt,
                    updatedAt: account.updatedAt
                };
            });
            
            log(`✅ Đã xử lý ${processedAccounts.length} tài khoản, trả về cho UI`);
            return this.serializeForIPC(processedAccounts);
        } catch (err) {
            error('❌ Error getting all accounts:', err);
            return [];
        }
    }

    /**
     * Lấy accounts theo folder
     */
    async getAccountsByFolder(folderId) {
        try {
            log(`🔄 Gọi getAccountsByFolder với folderId: ${folderId}`);
            const stmt = this.db.prepare(`
                SELECT a.*, f.name as folderName, f.color as folderColor
                FROM accounts a
                LEFT JOIN folders f ON a.folderId = f.id
                WHERE a.folderId = ?
                ORDER BY a.username ASC
            `);
            
            const accounts = stmt.all(folderId);
            log(`📊 Đọc được ${accounts.length} tài khoản với folderId: ${folderId}`);
            
            // Xử lý dữ liệu trả về
            const processedAccounts = accounts.map(account => {
                // Parse activeRooms từ JSON string
                let activeRooms = [];
                try {
                    if (account.activeRooms) {
                        activeRooms = JSON.parse(account.activeRooms);
                    }
                } catch (e) {
                    error('❌ Lỗi parse activeRooms:', e);
                }
                
                // Xử lý metadata
                let metadata = {};
                try {
                    if (account.metadata) {
                        metadata = JSON.parse(account.metadata);
                    }
                } catch (e) {
                    error('❌ Lỗi parse metadata:', e);
                }
                
                return {
                    ...account,
                    // Convert Boolean values
                    isLive: Boolean(account.isLive),
                    // Parse JSON fields
                    activeRooms: activeRooms,
                    metadata: metadata,
                    // Keep ISO date strings
                    lastActive: account.lastActive,
                    createdAt: account.createdAt,
                    updatedAt: account.updatedAt
                };
            });
            
            log(`✅ Đã xử lý ${processedAccounts.length} tài khoản, trả về cho UI`);
            return this.serializeForIPC(processedAccounts);
        } catch (err) {
            error('❌ Error getting accounts by folder:', err);
            return [];
        }
    }

    /**
     * Thêm account mới
     */
    async addAccount(accountData) {
        try {
            const accountId = this.generateId();
            const now = new Date().toISOString();
            const username = this.extractUsername(accountData);

            // Debug info
            log(`📝 Adding account: ${username}`);
            log(`- SessionId: ${accountData.sessionId ? 'Yes (length: ' + accountData.sessionId.length + ')' : 'No'}`);
            log(`- FolderId: ${accountData.folderId || 'null'}`);
            log(`- Status: ${accountData.status || 'active'}`);
            log(`- Notes: ${accountData.notes ? 'Yes (length: ' + accountData.notes.length + ')' : 'No'}`);
            log(`- Has metadata: ${accountData.metadata ? 'Yes' : 'No'}`);
            
            // Chuyển đổi metadata thành chuỗi JSON
            let metadataJson = '{}';
            if (accountData.metadata) {
                try {
                    if (typeof accountData.metadata === 'string') {
                        // Kiểm tra xem đã là JSON chưa
                        JSON.parse(accountData.metadata);
                        metadataJson = accountData.metadata;
                    } else {
                        metadataJson = JSON.stringify(accountData.metadata);
                    }
                    log(`- Metadata parsed successfully`);
                } catch (err) {
                    error(`❌ Error parsing metadata:`, err);
                    metadataJson = JSON.stringify({});
                }
            }else{
                metadataJson = JSON.stringify({
                    "email": accountData.email,
                    "emailPassword": accountData.emailPassword,
                    "password": accountData.password,
                    "cookie": accountData.cookie
                });
            }

            const stmt = this.db.prepare(`
                INSERT INTO accounts (
                    id, username, sessionId, password, email, emailPassword, cookie,
                    folderId, status, lastActive, lastUsed, currentRooms, avatarThumb, roomUsername, activeRooms,
                    viewerCount, followCount, shareCount, totalViews, totalShares, totalFollows, isLive,
                    proxyId, metadata, notes, createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
                accountId,
                username,
                accountData.sessionId || null,
                accountData.password || null,
                accountData.email || null,
                accountData.emailPassword || null,
                accountData.cookie || null,
                accountData.folderId || null,
                accountData.status || 'active',
                null,
                accountData.lastUsed || null,
                accountData.currentRooms || 0,
                accountData.avatarThumb || null,
                accountData.roomUsername || null,
                JSON.stringify(accountData.activeRooms || []),
                0, 0, 0, 0, 0, 0, 0,
                accountData.proxyId || null,
                metadataJson,
                accountData.notes || '',
                now,
                now
            );

            const newAccount = {
                id: accountId,
                username: username,
                sessionId: accountData.sessionId || null,
                password: accountData.password || null,
                email: accountData.email || null,
                emailPassword: accountData.emailPassword || null,
                cookie: accountData.cookie || null,
                folderId: accountData.folderId || null,
                status: accountData.status || 'active',
                lastActive: null,
                lastUsed: accountData.lastUsed || null,
                currentRooms: accountData.currentRooms || 0,
                avatarThumb: accountData.avatarThumb || null,
                roomUsername: accountData.roomUsername || null,
                activeRooms: accountData.activeRooms || [],
                viewerCount: 0,
                followCount: 0,
                shareCount: 0,
                totalViews: 0,
                totalShares: 0,
                totalFollows: 0,
                isLive: 0,
                proxyId: accountData.proxyId || null,
                metadata: metadataJson,
                notes: accountData.notes || '',
                createdAt: now,
                updatedAt: now
            };

            log(`✅ Added account: ${username}`);
            return { success: true, account: this.serializeForIPC(newAccount) };
        } catch (err) {
            error('❌ Error adding account:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Xóa account
     */
    async deleteAccount(accountId) {
        try {
            // Xóa account khỏi rooms trước
            await this.clearAccountRooms(accountId);
            
            // Xóa account
            const stmt = this.db.prepare(`DELETE FROM accounts WHERE id = ?`);
            const result = stmt.run(accountId);
            
            if (result.changes > 0) {
                log(`✅ Deleted account ${accountId}`);
                return { success: true };
            } else {
                return { success: false, error: 'Account not found' };
            }
        } catch (err) {
            error('Error deleting account:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Cập nhật account
     */
    async updateAccount(id, updates) {
        try {
            const now = new Date().toISOString();
            
            const setFields = [];
            const values = [];
            
            for (const [key, value] of Object.entries(updates)) {
                // Bỏ qua các giá trị undefined
                if (value === undefined) {
                    log(`⚠️ Bỏ qua trường ${key} với giá trị undefined`);
                    continue;
                }
                
                if (key === 'lastUpdated') {
                    log('⚠️ Cột lastUpdated được thay đổi thành updatedAt');
                    setFields.push(`updatedAt = ?`);
                    values.push(String(value) || now);
                    continue;
                }
                
                if (key === 'metadata') {
                    setFields.push(`${key} = ?`);
                    if (typeof value === 'string') {
                        values.push(value);
                    } else {
                        try {
                            values.push(JSON.stringify(value || {}));
                        } catch (err) {
                            error('❌ Lỗi khi chuyển đổi metadata thành JSON:', err);
                            values.push('{}');
                        }
                    }
                } else if (key === 'lastActive' || key === 'startedAt' || key === 'endedAt' || key === 'lastTimeCheckViewers' || key === 'stoppedAt') {
                    setFields.push(`${key} = ?`);
                    values.push(value ? String(value) : null);
                } else if (key === 'avatarThumb' || key === 'roomUsername') {
                    // Đảm bảo các trường string luôn là string hoặc null
                    setFields.push(`${key} = ?`);
                    values.push(value !== null && value !== undefined ? String(value) : null);
                } else if (key === 'currentRooms' || key === 'viewerCount' || key === 'followCount' || key === 'shareCount' || key === 'totalViews' || key === 'totalShares' || key === 'totalFollows' || key === 'isLive') {
                    // Đảm bảo các trường số luôn là số
                    setFields.push(`${key} = ?`);
                    values.push(Number(value) || 0);
                } else if (key === 'activeRooms') {
                    // Đảm bảo activeRooms luôn là JSON string
                    setFields.push(`${key} = ?`);
                    if (typeof value === 'string') {
                        try {
                            // Kiểm tra xem đã là JSON hợp lệ chưa
                            JSON.parse(value);
                            values.push(value);
                        } catch (e) {
                            error('❌ Lỗi khi parse activeRooms string:', e);
                            values.push('[]');
                        }
                    } else if (Array.isArray(value)) {
                        values.push(JSON.stringify(value));
                    } else {
                        values.push('[]');
                    }
                } else {
                    // Các trường khác
                    setFields.push(`${key} = ?`);
                    
                    // Đảm bảo giá trị là kiểu SQLite hợp lệ
                    if (value === null) {
                        values.push(null);
                    } else if (typeof value === 'object') {
                        try {
                            values.push(JSON.stringify(value));
                        } catch (e) {
                            error(`❌ Lỗi khi chuyển đổi ${key} thành JSON:`, e);
                            values.push(String(value) || null);
                        }
                    } else {
                        values.push(value);
                    }
                }
            }
            
            if (setFields.length === 0) {
                return { success: true };
            }
            
            if (!updates.hasOwnProperty('updatedAt') && !updates.hasOwnProperty('lastUpdated')) {
                setFields.push('updatedAt = ?');
                values.push(now);
            }
            
            values.push(id);
            
            const sql = `UPDATE accounts SET ${setFields.join(', ')} WHERE id = ?`;
            const stmt = this.db.prepare(sql);
            
            log(`🔄 Updating account ${id} with fields: ${setFields.join(', ')}`);
            const result = stmt.run(...values);
            
            if (result.changes > 0) {
                log(`✅ Updated account ${id}`);
                return { success: true };
            } else {
                return { success: false, error: 'Account not found' };
            }
        } catch (err) {
            error('❌ Error updating account:', err);
            return { success: false, error: err.message };
        }
    }
    /**
     * Cập nhật status account
     */
    async updateAccountStatus(username, status) {
        try {
            console.log("updateAccountStatus", username, status);
            const stmt = this.db.prepare(`UPDATE accounts SET status = ? WHERE username = ?`);
            const result = stmt.run(status, username);
            return result.changes > 0;
        } catch (err) {
            error('Error updating account status:', err);
            return false;
        }
    }
    /**
     * Cập nhật stats của account
     */
    async updateAccountStats(accountId, stats) {
        try {
            const stmt = this.db.prepare(`
                UPDATE accounts SET 
                    viewerCount = ?,
                    followCount = ?,
                    shareCount = ?,
                    totalViews = ?,
                    totalShares = ?,
                    totalFollows = ?,
                    isLive = ?,
                    lastActive = ?,
                    activeRooms = ?,
                    updatedAt = ?
                WHERE id = ?
            `);
            
            const result = stmt.run(
                stats.viewerCount || 0,
                stats.followCount || 0,
                stats.shareCount || 0,
                stats.totalViews || 0,
                stats.totalShares || 0,
                stats.totalFollows || 0,
                stats.isLive ? 1 : 0,
                new Date().toISOString(),
                stats.activeRooms ? JSON.stringify(stats.activeRooms) : '[]',
                new Date().toISOString(),
                accountId
            );
            
            return result.changes > 0;
        } catch (err) {
            error('Error updating account stats:', err);
            return false;
        }
    }

    /**
     * Xóa tất cả room relationships của account
     */
    async clearAccountRooms(accountId) {
        try {
            const stmt = this.db.prepare(`
                DELETE FROM account_rooms WHERE accountId = ?
            `);
            
            const now = new Date().toISOString();
            
            // Cập nhật trường activeRooms và currentRooms trong bảng accounts
            const updateStmt = this.db.prepare(`
                UPDATE accounts 
                SET activeRooms = '[]',
                    currentRooms = 0,
                    updatedAt = ?
                WHERE id = ?
            `);
            updateStmt.run(now, accountId);
            
            const result = stmt.run(accountId);
            log(`✅ Cleared ${result.changes} room relationships for account ${accountId}`);
            
            return result.changes;
        } catch (err) {
            error('Error clearing account rooms:', err);
            return 0;
        }
    }

    /**
     * Lấy active rooms của account từ trường activeRooms
     */
    async getAccountActiveRooms(accountId) {
        try {
            // Thử đầu tiên từ trường activeRooms
            const accountStmt = this.db.prepare(`
                SELECT activeRooms FROM accounts WHERE id = ?
            `);
            
            const accountData = accountStmt.get(accountId);
            if (accountData && accountData.activeRooms) {
                try {
                    const activeRooms = JSON.parse(accountData.activeRooms);
                    if (Array.isArray(activeRooms) && activeRooms.length > 0) {
                        // Nếu có dữ liệu từ activeRooms, trả về
                        return this.serializeForIPC(activeRooms);
                    }
                } catch (e) {
                    error('Error parsing activeRooms JSON:', e);
                }
            }
            
            // Fall back to relationship table
            const stmt = this.db.prepare(`
                SELECT r.* FROM rooms r
                INNER JOIN account_rooms ar ON r.uid = ar.roomId
                WHERE ar.accountId = ?
                ORDER BY r.createdAt DESC
            `);
            
            const rooms = stmt.all(accountId).map(room => ({
                ...room,
                createdAt: room.createdAt,
                updatedAt: room.updatedAt
            }));
            
            // Cập nhật activeRooms trong account
            if (rooms.length > 0) {
                const updateStmt = this.db.prepare(`
                    UPDATE accounts SET activeRooms = ? WHERE id = ?
                `);
                updateStmt.run(JSON.stringify(rooms), accountId);
            }
            
            return this.serializeForIPC(rooms);
        } catch (err) {
            error('Error getting account active rooms:', err);
            return [];
        }
    }

    /**
     * Import accounts từ text (mỗi dòng một account)
     */
    async importAccountsFromText(text, folderId = null) {
        try {
            log(`📥 Importing accounts from text. Length: ${text.length}, FolderId: ${folderId || 'null'}, Type: ${typeof folderId}`);
            
            // Nếu không có folderId hoặc là 'default', sử dụng 'accounts-default'
            if (!folderId || folderId === 'default') {
                folderId = 'accounts-default';
                log(`📁 Using default folder for import`);
            } else {
                // Kiểm tra xem folder đã chọn có tồn tại không
                const checkFolder = this.db.prepare(`
                    SELECT id FROM folders WHERE id = ? AND type = 'accounts'
                `).get(folderId);
                
                if (!checkFolder) {
                    error(`❌ Folder with ID ${folderId} does not exist`);
                    return {
                        success: false,
                        error: `Folder with ID ${folderId} does not exist`,
                        results: [],
                        imported: 0,
                        total: 0
                    };
                }
                log(`✅ Using existing folder: ${folderId}`);
            }
            
            const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            const results = [];
            
            for (const line of lines) {
                // Parse account info từ line
                const accountData = this.parseAccountLine(line);
                accountData.folderId = folderId;
                
                try {
                    const result = await this.addAccount(accountData);
                    results.push({
                        username: accountData.username,
                        success: result.success,
                        error: result.error
                    });
                } catch (err) {
                    error(`❌ Error adding account ${accountData.username}:`, err);
                    results.push({
                        username: accountData.username,
                        success: false,
                        error: error.message
                    });
                }
            }
            
            const successCount = results.filter(r => r.success).length;
            log(`✅ Imported ${successCount}/${results.length} accounts`);
            
            return {
                success: true,
                results: results,
                imported: successCount,
                total: results.length
            };
        } catch (err) {
            error('❌ Error importing accounts from text:', err);
            return {
                success: false,
                error: error.message,
                results: [],
                imported: 0,
                total: 0
            };
        }
    }

    /**
     * Parse account line từ text
     */
    parseAccountLine(line) {
        // Support multiple formats:
        // 1. Just username: "username123"
        // 2. Username:sessionId: "username123:session_token_here" 
        // 3. JSON format: {"username": "username123", "sessionId": "token", ...}
        // 4. Pipe-separated: "username|password|email|emailpass|cookie"
        
        try {
            // Try JSON format first
            const jsonData = JSON.parse(line);
            return {
                username: jsonData.username || jsonData.user || '',
                sessionId: jsonData.sessionId || jsonData.session || null,
                password: jsonData.password || null,
                email: jsonData.email || null,
                emailPassword: jsonData.emailPassword || null,
                cookie: jsonData.cookie || null,
                lastUsed: jsonData.lastUsed || null,
                currentRooms: jsonData.currentRooms || 0,
                avatarThumb: jsonData.avatarThumb || null,
                roomUsername: jsonData.roomUsername || null,
                activeRooms: jsonData.activeRooms || [],
                notes: jsonData.notes || '',
                status: jsonData.status || 'active',
                proxyId: jsonData.proxyId || null,
                metadata: jsonData.metadata || {}
            };
        } catch {
            // Thử format pipe-separated
            if (line.includes('|')) {
                const parts = line.split('|');
                // username|password|email|emailpass|cookie
                const username = parts[0]?.trim() || '';
                const password = parts[1]?.trim() || '';
                const email = parts[2]?.trim() || '';
                const emailPassword = parts[3]?.trim() || '';
                const cookie = parts[4]?.trim() || '';
                
                log(`📝 Parsed pipe-separated account: ${username}`);
                
                return {
                    username,
                    sessionId: cookie || null, // Có thể dùng cookie làm sessionId
                    password,
                    email,
                    emailPassword,
                    cookie,
                    notes: `Email: ${email}`,
                    status: 'active',
                    proxyId: null,
                    currentRooms: 0,
                    metadata: {},
                    activeRooms: []
                };
            }
            // Thử format colon-separated
            else if (line.includes(':')) {
                const parts = line.split(':');
                // Có thể có nhiều hơn 2 phần (username:sessionId:note:status...)
                if (parts.length >= 2) {
                    return {
                        username: parts[0].trim(),
                        sessionId: parts[1].trim() || null,
                        notes: parts[2] ? parts[2].trim() : '',
                        status: parts[3] ? parts[3].trim() : 'active',
                        proxyId: null,
                        currentRooms: 0,
                        metadata: {},
                        activeRooms: []
                    };
                }
            }
            
            // Just username
            return {
                username: line.trim(),
                sessionId: null,
                notes: '',
                status: 'active',
                proxyId: null,
                currentRooms: 0,
                metadata: {},
                activeRooms: []
            };
        }
    }
}

module.exports = AccountStorage; 