const BaseStorage = require('./base-storage');
const { log, error } = require('../logger');

class RoomStorage extends BaseStorage {
    /**
     * Lấy tất cả rooms
     */
    async getAllRooms() {
        try {
            log('🔄 Gọi getAllRooms');
            const stmt = this.db.prepare(`
                SELECT * FROM rooms 
                ORDER BY lastViewed DESC, createdAt DESC
            `);
            
            const rooms = stmt.all();
            log(`📊 Đọc được ${rooms.length} phòng từ database`);
            
            // Xử lý dữ liệu trả về
            const processedRooms = rooms.map(room => {
                return {
                    ...room,
                    isLive: Boolean(room.isLive),
                    // Chuyển đổi các trường số
                    viewerCount: Number(room.viewerCount || 0),
                    currentViewers: Number(room.currentViewers || 0),
                    startCount: Number(room.startCount || 0),
                    targetViewers: Number(room.targetViewers || 0),
                    realViewers: Number(room.realViewers || 0),
                    duration: Number(room.duration || 30),
                    finalDuration: Number(room.finalDuration || 0),
                    // Giữ nguyên các timestamp
                    lastViewed: room.lastViewed,
                    createdAt: room.createdAt,
                    updatedAt: room.updatedAt,
                    startedAt: room.startedAt,
                    endedAt: room.endedAt,
                    lastTimeCheckViewers: room.lastTimeCheckViewers,
                    stoppedAt: room.stoppedAt
                };
            });
            
            log(`✅ Đã xử lý ${processedRooms.length} phòng, trả về cho UI`);
            return this.serializeForIPC(processedRooms);
        } catch (err) {
            error('❌ Error getting all rooms:', err);
            return [];
        }
    }

    /**
     * Thêm room mới
     */
    async addRoom(roomData) {
        try {
            log(`🔄 Thêm/cập nhật phòng ${roomData.roomUsername || roomData.uid}`);
            
            const now = new Date().toISOString();
            
            // Đảm bảo các trường số được chuyển đổi đúng
            const viewerCount = Number(roomData.viewerCount || 0);
            const currentViewers = Number(roomData.currentViewers || 0);
            const startCount = Number(roomData.startCount || 0);
            const targetViewers = Number(roomData.targetViewers || 0);
            const realViewers = Number(roomData.realViewers || 0);
            const duration = Number(roomData.duration || 30);
            const finalDuration = Number(roomData.finalDuration || 0);
            const isLive = roomData.isLive ? 1 : 0;
            
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO rooms (
                    uid, id, roomId, roomUrl, roomUsername, 
                    nickname, avatar, avatarThumb, title,
                    viewerCount, currentViewers, startCount, targetViewers, 
                    duration, isLive, status, 
                    startedAt, endedAt, realViewers, lastTimeCheckViewers,
                    stoppedAt, stopReason, finalDuration,
                    lastViewed, notes, createdAt, updatedAt
                ) VALUES (
                    ?, ?, ?, ?, ?, 
                    ?, ?, ?, ?, 
                    ?, ?, ?, ?,
                    ?, ?, ?, 
                    ?, ?, ?, ?,
                    ?, ?, ?,
                    ?, ?, ?, ?
                )
            `);

            stmt.run(
                roomData.uid,
                roomData.id || roomData.uid,
                roomData.roomId || null,
                roomData.roomUrl || null,
                roomData.roomUsername || null,
                roomData.nickname || null,
                roomData.avatar || null,
                roomData.avatarThumb || null,
                roomData.title || '',
                viewerCount,
                currentViewers,
                startCount,
                targetViewers,
                duration,
                isLive,
                roomData.status || 'stopped',
                roomData.startedAt || now,
                roomData.endedAt || null,
                realViewers,
                roomData.lastTimeCheckViewers || null,
                roomData.stoppedAt || null,
                roomData.stopReason || null,
                finalDuration,
                roomData.lastViewed || now,
                roomData.notes || roomData.note || '',
                roomData.createdAt || now,
                roomData.updatedAt || now
            );

            // Xử lý đúng kiểu dữ liệu cho dữ liệu trả về
            const newRoom = {
                uid: roomData.uid,
                id: roomData.id || roomData.uid,
                roomId: roomData.roomId || null,
                roomUrl: roomData.roomUrl || null,
                roomUsername: roomData.roomUsername || null,
                nickname: roomData.nickname || null,
                avatar: roomData.avatar || null,
                avatarThumb: roomData.avatarThumb || null,
                title: roomData.title || '',
                viewerCount: viewerCount,
                currentViewers: currentViewers,
                startCount: startCount,
                targetViewers: targetViewers,
                duration: duration,
                isLive: Boolean(isLive),
                status: roomData.status || 'stopped',
                startedAt: roomData.startedAt || null,
                endedAt: roomData.endedAt || null,
                realViewers: realViewers,
                lastTimeCheckViewers: roomData.lastTimeCheckViewers || null,
                stoppedAt: roomData.stoppedAt || null,
                stopReason: roomData.stopReason || null,
                finalDuration: finalDuration,
                lastViewed: roomData.lastViewed || now,
                notes: roomData.notes || roomData.note || '',
                createdAt: roomData.createdAt || now,
                updatedAt: roomData.updatedAt || now
            };

            log(`✅ Đã thêm/cập nhật phòng: ${roomData.roomUsername} (${roomData.uid})`);
            return { success: true, room: this.serializeForIPC(newRoom) };
        } catch (err) {
            error('❌ Error adding room:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Cập nhật room
     */
    async updateRoom(roomUid, updates) {
        try {
            // Kiểm tra roomUid không được null
            if (!roomUid) {
                error('❌ Không thể cập nhật room: roomUid là null');
                return { success: false, error: 'ROOM_UID_NULL' };
            }

            log(`🔄 Cập nhật room ${roomUid}`);
            const now = new Date().toISOString();
            
            const setFields = [];
            const values = [];
            
            for (const [key, value] of Object.entries(updates)) {
                // Bỏ qua các giá trị undefined
                if (value === undefined) {
                    log(`⚠️ Bỏ qua trường ${key} với giá trị undefined`);
                    continue;
                }
                
                if (key === 'isLive') {
                    setFields.push(`${key} = ?`);
                    values.push(value ? 1 : 0);
                } else if (key === 'lastViewed' || key === 'startedAt' || key === 'endedAt' || 
                          key === 'lastTimeCheckViewers' || key === 'stoppedAt') {
                    setFields.push(`${key} = ?`);
                    values.push(value ? String(value) : null);
                } else if (key === 'roomUsername' || key === 'nickname' || key === 'avatarThumb' || 
                          key === 'avatar' || key === 'roomUrl' || key === 'title' || 
                          key === 'stopReason' || key === 'status') {
                    // Đảm bảo các trường string luôn là string hoặc null
                    setFields.push(`${key} = ?`);
                    values.push(value !== null && value !== undefined ? String(value) : null);
                } else if (key === 'viewerCount' || key === 'currentViewers' || key === 'startCount' || 
                          key === 'targetViewers' || key === 'duration' || key === 'realViewers' || 
                          key === 'finalDuration') {
                    // Đảm bảo các trường số luôn là số
                    setFields.push(`${key} = ?`);
                    values.push(Number(value) || 0);
                } else {
                    // Các trường khác
                    setFields.push(`${key} = ?`);
                    
                    // Đảm bảo giá trị là kiểu SQLite hợp lệ
                    if (value === null) {
                        values.push(null);
                    } else if (typeof value === 'object') {
                        try {
                            values.push(JSON.stringify(value));
                        } catch (err) {
                            error(`❌ Lỗi khi chuyển đổi ${key} thành JSON:`, err);
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
            
            // Luôn cập nhật updatedAt khi có thay đổi
            setFields.push('updatedAt = ?');
            values.push(now);
            values.push(roomUid);
            
            const sql = `UPDATE rooms SET ${setFields.join(', ')} WHERE uid = ?`;
            const stmt = this.db.prepare(sql);
            
            log(`🔄 Updating room ${roomUid} with fields: ${setFields.join(', ')}`);
            const result = stmt.run(...values);
            
            if (result.changes > 0) {
                log(`✅ Updated room ${roomUid}`);
                return { success: true };
            } else {
                log(`⚠️ Room not found: ${roomUid}`);
                return { success: false, error: 'Room not found' };
            }
        } catch (err) {
            error('❌ Error updating room:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Xóa room
     */
    async deleteRoom(roomUid) {
        try {
            // Giải phóng tất cả accounts khỏi room
            await this.releaseAccountsFromRoom(roomUid);
            
            // Xóa viewer history
            const deleteHistoryStmt = this.db.prepare(`
                DELETE FROM viewer_history WHERE roomUid = ?
            `);
            deleteHistoryStmt.run(roomUid);
            
            // Xóa room
            const stmt = this.db.prepare(`DELETE FROM rooms WHERE uid = ?`);
            const result = stmt.run(roomUid);
            
            if (result.changes > 0) {
                log(`✅ Deleted room ${roomUid}`);
                return { success: true };
            } else {
                return { success: false, error: 'Room not found' };
            }
        } catch (err) {
            error('Error deleting room:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Clear all account-room relationships
     */
    async clearAllAccountRooms() {
        try {
            // Trước tiên, lấy danh sách tất cả các accounts đang có trong account_rooms
            const accountsWithRooms = this.db.prepare(`
                SELECT DISTINCT accountId FROM account_rooms
            `).all();
            
            // Xóa tất cả các mối quan hệ
            const stmt = this.db.prepare(`DELETE FROM account_rooms`);
            const result = stmt.run();
            
            // Đặt lại currentRooms và activeRooms cho tất cả accounts có ít nhất một phòng
            if (accountsWithRooms.length > 0) {
                const now = new Date().toISOString();
                const resetStmt = this.db.prepare(`
                    UPDATE accounts 
                    SET currentRooms = 0,
                        activeRooms = '[]',
                        updatedAt = ?
                    WHERE id = ?
                `);
                
                for (const account of accountsWithRooms) {
                    resetStmt.run(now, account.accountId);
                }
                
                log(`✅ Reset currentRooms and activeRooms for ${accountsWithRooms.length} accounts`);
            }
            
            log(`✅ Cleared ${result.changes} account-room relationships`);
            return result.changes;
        } catch (err) {
            error('Error clearing account rooms:', err);
            return 0;
        }
    }

    /**
     * Add account to room
     */
    async addAccountToRoom(accountId, roomId) {
        try {
            const stmt = this.db.prepare(`
                INSERT OR IGNORE INTO account_rooms (accountId, roomId, createdAt)
                VALUES (?, ?, ?)
            `);
            
            const now = new Date().toISOString();
            const result = stmt.run(accountId, roomId, now);
            
            if (result.changes > 0) {
                log(`✅ Added account ${accountId} to room ${roomId}`);
                
                // Cập nhật currentRooms trong bảng accounts
                const updateStmt = this.db.prepare(`
                    UPDATE accounts 
                    SET currentRooms = currentRooms + 1,
                        updatedAt = ?,
                        lastUsed = ?
                    WHERE id = ?
                `);
                updateStmt.run(now, now, accountId);
                
                // Lấy thông tin về room
                const roomStmt = this.db.prepare(`SELECT * FROM rooms WHERE uid = ?`);
                const roomInfo = roomStmt.get(roomId);
                
                if (roomInfo) {
                    // Lấy danh sách activeRooms hiện tại của account
                    const accountStmt = this.db.prepare(`SELECT activeRooms FROM accounts WHERE id = ?`);
                    const accountData = accountStmt.get(accountId);
                    
                    // Parse activeRooms từ JSON string thành array
                    let activeRooms = [];
                    try {
                        if (accountData && accountData.activeRooms) {
                            activeRooms = JSON.parse(accountData.activeRooms);
                        }
                    } catch (e) {
                        error(`❌ Lỗi khi parse activeRooms của account ${accountId}:`, e);
                        activeRooms = [];
                    }
                    
                    // Thêm room mới vào danh sách nếu chưa có
                    const roomIdentifier = roomInfo.roomUsername || roomInfo.uid;
                    if (!activeRooms.includes(roomIdentifier)) {
                        activeRooms.push(roomIdentifier);
                        
                        // Cập nhật activeRooms trong database
                        const updateActiveRoomsStmt = this.db.prepare(`
                            UPDATE accounts 
                            SET activeRooms = ?,
                                updatedAt = ?
                            WHERE id = ?
                        `);
                        updateActiveRoomsStmt.run(JSON.stringify(activeRooms), now, accountId);
                        log(`✅ Updated activeRooms for account ${accountId}: Added ${roomIdentifier}`);
                    }
                }
                
                return { success: true };
            } else {
                return { success: false, error: 'Relationship already exists' };
            }
        } catch (err) {
            error('Error adding account to room:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Remove account from room
     */
    async removeAccountFromRoom(accountId, roomId) {
        try {
            const stmt = this.db.prepare(`
                DELETE FROM account_rooms WHERE accountId = ? AND roomId = ?
            `);
            
            const now = new Date().toISOString();
            const result = stmt.run(accountId, roomId);
            
            if (result.changes > 0) {
                log(`✅ Removed account ${accountId} from room ${roomId}`);
                
                // Giảm currentRooms trong bảng accounts
                const updateStmt = this.db.prepare(`
                    UPDATE accounts 
                    SET currentRooms = MAX(0, currentRooms - 1),
                        updatedAt = ?
                    WHERE id = ?
                `);
                updateStmt.run(now, accountId);
                
                // Lấy thông tin về room
                const roomStmt = this.db.prepare(`SELECT * FROM rooms WHERE uid = ?`);
                const roomInfo = roomStmt.get(roomId);
                
                if (roomInfo) {
                    // Lấy danh sách activeRooms hiện tại của account
                    const accountStmt = this.db.prepare(`SELECT activeRooms FROM accounts WHERE id = ?`);
                    const accountData = accountStmt.get(accountId);
                    
                    // Parse activeRooms từ JSON string thành array
                    let activeRooms = [];
                    try {
                        if (accountData && accountData.activeRooms) {
                            activeRooms = JSON.parse(accountData.activeRooms);
                        }
                    } catch (e) {
                        error(`❌ Lỗi khi parse activeRooms của account ${accountId}:`, e);
                        activeRooms = [];
                    }
                    
                    // Xóa room khỏi danh sách activeRooms
                    const roomIdentifier = roomInfo.roomUsername || roomInfo.uid;
                    const updatedActiveRooms = activeRooms.filter(room => room !== roomIdentifier);
                    
                    // Cập nhật activeRooms trong database
                    const updateActiveRoomsStmt = this.db.prepare(`
                        UPDATE accounts 
                        SET activeRooms = ?,
                            updatedAt = ?
                        WHERE id = ?
                    `);
                    updateActiveRoomsStmt.run(JSON.stringify(updatedActiveRooms), now, accountId);
                    log(`✅ Updated activeRooms for account ${accountId}: Removed ${roomIdentifier}`);
                }
                
                return { success: true };
            } else {
                return { success: false, error: 'Relationship not found' };
            }
        } catch (err) {
            error('Error removing account from room:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Get accounts in room
     */
    async getAccountsInRoom(roomId) {
        try {
            log(`🔍 Lấy danh sách accounts trong phòng ${roomId}`);
            const stmt = this.db.prepare(`
                SELECT a.*, ar.createdAt as joinedAt
                FROM accounts a
                INNER JOIN account_rooms ar ON a.id = ar.accountId
                WHERE ar.roomId = ?
                ORDER BY ar.createdAt DESC
            `);
            
            const accountsRaw = stmt.all(roomId);
            log(`📊 Tìm thấy ${accountsRaw.length} accounts trong phòng ${roomId}`);
            
            // Xử lý dữ liệu accounts
            const accounts = accountsRaw.map(account => {
                // Parse activeRooms từ JSON string thành array
                let activeRooms = [];
                try {
                    if (account.activeRooms) {
                        activeRooms = JSON.parse(account.activeRooms);
                    }
                } catch (err) {
                    error(`❌ Lỗi khi parse activeRooms của account ${account.id}:`, err);
                    activeRooms = [];
                }
                
                return {
                    ...account,
                    // Convert Boolean
                    isLive: Boolean(account.isLive),
                    // Cấu trúc dữ liệu phức tạp
                    activeRooms: activeRooms,
                    // Convert số
                    currentRooms: Number(account.currentRooms || 0),
                    viewerCount: Number(account.viewerCount || 0),
                    followCount: Number(account.followCount || 0),
                    shareCount: Number(account.shareCount || 0),
                    totalViews: Number(account.totalViews || 0),
                    totalShares: Number(account.totalShares || 0),
                    totalFollows: Number(account.totalFollows || 0),
                    // Giữ nguyên timestamps
                    lastActive: account.lastActive,
                    lastUsed: account.lastUsed,
                    createdAt: account.createdAt,
                    updatedAt: account.updatedAt,
                    joinedAt: account.joinedAt
                };
            });
            
            return this.serializeForIPC(accounts);
        } catch (err) {
            error('❌ Error getting accounts in room:', err);
            return [];
        }
    }

    /**
     * Get room by UID
     */
    async getRoomByUid(roomUid) {
        try {
            log(`🔍 Lấy thông tin phòng ${roomUid}`);
            const stmt = this.db.prepare(`SELECT * FROM rooms WHERE uid = ?`);
            const room = stmt.get(roomUid);
            
            if (room) {
                // Xử lý dữ liệu trả về
                const processedRoom = {
                    ...room,
                    isLive: Boolean(room.isLive),
                    // Chuyển đổi các trường số
                    viewerCount: Number(room.viewerCount || 0),
                    currentViewers: Number(room.currentViewers || 0),
                    startCount: Number(room.startCount || 0),
                    targetViewers: Number(room.targetViewers || 0),
                    realViewers: Number(room.realViewers || 0),
                    duration: Number(room.duration || 30),
                    finalDuration: Number(room.finalDuration || 0),
                    // Giữ nguyên các timestamp
                    lastViewed: room.lastViewed,
                    createdAt: room.createdAt,
                    updatedAt: room.updatedAt,
                    startedAt: room.startedAt,
                    endedAt: room.endedAt,
                    lastTimeCheckViewers: room.lastTimeCheckViewers,
                    stoppedAt: room.stoppedAt
                };

                log(`✅ Đã tìm thấy phòng ${roomUid}`);
                return this.serializeForIPC(processedRoom);
            }
            
            log(`⚠️ Không tìm thấy phòng ${roomUid}`);
            return null;
        } catch (err) {
            error('❌ Error getting room by UID:', err);
            return null;
        }
    }

    // =================
    // VIEWER HISTORY
    // =================

    /**
     * Add viewer history entry
     */
    async addViewerHistoryEntry(roomUid, viewerData) {
        try {
            // Kiểm tra roomUid không được null
            if (!roomUid) {
                error('❌ Không thể thêm viewer history: roomUid là null');
                return { success: false, error: 'ROOM_UID_NULL' };
            }
            
            const stmt = this.db.prepare(`
                INSERT INTO viewer_history (roomUid, viewerCount, timestamp)
                VALUES (?, ?, ?)
            `);
            
            stmt.run(
                roomUid,
                viewerData.viewerCount || viewerData.viewers || 0,
                viewerData.timestamp || new Date().toISOString()
            );
            
            return { success: true };
        } catch (err) {
            error('Error adding viewer history entry:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Get room viewer history
     */
    async getRoomViewerHistory(roomUid, days = null) {
        try {
            let sql = `
                SELECT * FROM viewer_history 
                WHERE roomUid = ?
            `;
            const params = [roomUid];
            
            if (days) {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - days);
                sql += ` AND timestamp >= ?`;
                params.push(cutoffDate.toISOString());
            }
            
            sql += ` ORDER BY timestamp DESC`;
            
            const stmt = this.db.prepare(sql);
            const history = stmt.all(...params).map(entry => ({
                ...entry,
                timestamp: entry.timestamp
            }));
            
            return this.serializeForIPC(history);
        } catch (err) {
            error('Error getting room viewer history:', err);
            return [];
        }
    }

    /**
     * Cleanup old viewer history
     */
    async cleanupViewerHistoryFiles() {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 30);
            
            const stmt = this.db.prepare(`
                DELETE FROM viewer_history WHERE timestamp < ?
            `);
            
            const result = stmt.run(cutoffDate.toISOString());
            log(`✅ Cleaned up ${result.changes} old viewer history entries`);
            
            return result.changes;
        } catch (err) {
            error('Error cleaning up viewer history:', err);
            return 0;
        }
    }

    /**
     * Giải phóng tất cả accounts khỏi room (dùng khi stop hoặc delete room)
     * Hàm tiện ích để tránh lặp code - PRODUCTION SAFE VERSION
     */
    async releaseAccountsFromRoom(roomId) {
        // Kiểm tra roomId không được null
        if (!roomId) {
            error('❌ Không thể giải phóng accounts: roomId là null');
            return { success: false, error: 'ROOM_ID_NULL' };
        }
        
        try {
            // Lấy thông tin về room để biết roomUsername
            const roomStmt = this.db.prepare(`SELECT * FROM rooms WHERE uid = ?`);
            const roomInfo = roomStmt.get(roomId);
            
            if (!roomInfo) {
                log(`⚠️ Không tìm thấy room ${roomId} để giải phóng accounts`);
                return { success: false, error: 'Room not found' };
            }
            
            // Lấy danh sách các accounts trong room
            const accountsInRoomStmt = this.db.prepare(`
                SELECT accountId FROM account_rooms WHERE roomId = ?
            `);
            const accountsInRoom = accountsInRoomStmt.all(roomId);
            
            if (accountsInRoom.length === 0) {
                log(`ℹ️ Không có accounts nào trong room ${roomId} cần giải phóng`);
                return { success: true, message: 'No accounts to release' };
            }
            
            log(`🔄 Giải phóng ${accountsInRoom.length} accounts khỏi room ${roomId}`);
            
            const now = new Date().toISOString();
            const roomIdentifier = roomInfo.roomUsername || roomInfo.uid;
            
            // Chuẩn bị các prepared statements để tối ưu hiệu suất
            const deleteRelationsStmt = this.db.prepare(`
                DELETE FROM account_rooms WHERE roomId = ?
            `);
            const countRoomsStmt = this.db.prepare(`
                SELECT COUNT(*) as roomCount FROM account_rooms WHERE accountId = ?
            `);
            const accountStmt = this.db.prepare(`
                SELECT activeRooms FROM accounts WHERE id = ?
            `);
            const updateAccountStmt = this.db.prepare(`
                UPDATE accounts 
                SET currentRooms = ?,
                    activeRooms = ?,
                    updatedAt = ?
                WHERE id = ?
            `);
            
            // BƯỚC 1: Cập nhật activeRooms cho từng account TRƯỚC KHI xóa relationships
            for (const account of accountsInRoom) {
                const accountId = account.accountId;
                
                try {
                    // Lấy danh sách activeRooms hiện tại
                    const accountData = accountStmt.get(accountId);
                    
                    // Parse activeRooms từ JSON string thành array với robust error handling
                    let activeRooms = [];
                    if (accountData && accountData.activeRooms) {
                        try {
                            const parsed = JSON.parse(accountData.activeRooms);
                            if (Array.isArray(parsed)) {
                                activeRooms = parsed;
                            } else {
                                error(`❌ activeRooms không phải array cho account ${accountId}:`, parsed);
                                activeRooms = [];
                            }
                        } catch (e) {
                            error(`❌ Lỗi khi parse activeRooms của account ${accountId}:`, e);
                            activeRooms = [];
                        }
                    }
                    
                    // Xóa room khỏi danh sách activeRooms với nhiều format matching
                    const updatedActiveRooms = activeRooms.filter(room => {
                        // Kiểm tra với tất cả các format có thể có
                        return room !== roomIdentifier && 
                               room !== roomInfo.uid && 
                               room !== roomInfo.roomUsername &&
                               room !== roomId;
                    });
                    
                    // Đếm số room còn lại SAU KHI xóa relationship này
                    const currentRoomCount = countRoomsStmt.get(accountId).roomCount;
                    const newRoomCount = Math.max(0, currentRoomCount - 1);
                    
                    // Cập nhật account với dữ liệu mới
                    updateAccountStmt.run(
                        newRoomCount,
                        JSON.stringify(updatedActiveRooms),
                        now,
                        accountId
                    );
                    
                    log(`✅ Updated account ${accountId}: currentRooms=${newRoomCount}, activeRooms removed ${roomIdentifier}`);
                    
                } catch (accountError) {
                    error(`❌ Lỗi khi cập nhật account ${accountId}:`, accountError);
                    // Tiếp tục với account khác thay vì dừng toàn bộ
                    continue;
                }
            }
            
            // BƯỚC 2: Xóa tất cả các mối quan hệ account-room SAU KHI đã cập nhật
            const deleteResult = deleteRelationsStmt.run(roomId);
            
            log(`✅ Đã giải phóng ${accountsInRoom.length} accounts khỏi room ${roomId}, xóa ${deleteResult.changes} relationships`);
            
            return { 
                success: true, 
                accountsReleased: accountsInRoom.length,
                relationshipsDeleted: deleteResult.changes
            };
            
        } catch (err) {
            error(`❌ Lỗi khi giải phóng accounts khỏi room ${roomId}:`, err);
            return { success: false, error: err.message };
        }
    }
}

module.exports = RoomStorage; 