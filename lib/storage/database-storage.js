const BaseStorage = require('./base-storage');
const { log, error } = require('../../lib/logger');
class DatabaseStorage extends BaseStorage {
    /**
     * Lấy danh sách accounts trong một room
     * @param {string} roomId - ID của room
     * @returns {Promise<Array>} - Danh sách accounts
     */
    async getAccountsInRoom(roomId) {
        try {
            // Lấy trực tiếp accounts từ bảng account_rooms
            const accounts = this.db.prepare(`
                SELECT a.* 
                FROM accounts a
                INNER JOIN account_rooms ar ON a.id = ar.accountId
                WHERE ar.roomId = ? AND a.status = 'active'
            `).all(roomId);

            return accounts;
        } catch (err) {
            error('❌ Error getting accounts in room:', err);
            return [];
        }
    }

    /**
     * Thêm room mới
     * @param {Object} roomData - Dữ liệu room
     * @param {Array<string>} accountIds - Danh sách account IDs
     * @returns {Promise<Object>} - Room đã thêm
     */
    async addRoom(roomData, accountIds = []) {
        try {
            // Bắt đầu transaction
            this.db.exec('BEGIN TRANSACTION');

            try {
                // Thêm room
                const now = new Date().toISOString();
                const room = {
                    ...roomData,
                    createdAt: now,
                    updatedAt: now
                };

                const stmt = this.db.prepare(`
                    INSERT INTO rooms (
                        uid, id, roomId, roomUrl, roomUsername, nickname, 
                        avatar, avatarThumb, title, viewerCount, currentViewers,
                        startCount, targetViewers, duration, isLive, lastViewed,
                        notes, status, startedAt, endedAt, realViewers,
                        lastTimeCheckViewers, stoppedAt, stopReason, finalDuration,
                        createdAt, updatedAt
                    ) VALUES (
                        @uid, @id, @roomId, @roomUrl, @roomUsername, @nickname,
                        @avatar, @avatarThumb, @title, @viewerCount, @currentViewers,
                        @startCount, @targetViewers, @duration, @isLive, @lastViewed,
                        @notes, @status, @startedAt, @endedAt, @realViewers,
                        @lastTimeCheckViewers, @stoppedAt, @stopReason, @finalDuration,
                        @createdAt, @updatedAt
                    )
                `);

                stmt.run(room);

                // Thêm accounts vào room
                if (accountIds.length > 0) {
                    const accountRoomStmt = this.db.prepare(`
                        INSERT INTO account_rooms (accountId, roomId, createdAt)
                        VALUES (?, ?, ?)
                    `);

                    for (const accountId of accountIds) {
                        accountRoomStmt.run(accountId, room.uid, now);
                    }
                }

                // Commit transaction
                this.db.exec('COMMIT');

                return room;
            } catch (err) {
                // Rollback nếu có lỗi
                this.db.exec('ROLLBACK');
                throw err;
            }
        } catch (err) {
            error('❌ Error adding room:', err);
            throw error;
        }
    }
}

module.exports = DatabaseStorage; 