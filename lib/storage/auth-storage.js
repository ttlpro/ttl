const BaseStorage = require('./base-storage');
const { log, error } = require('../logger');
const { nanoid } = require('nanoid');

class AuthStorage extends BaseStorage {
    /**
     * Lưu thông tin user sau khi đăng nhập/đăng ký thành công
     */
    async saveAuthData(authData) {
        try {
            const now = new Date().toISOString();
            const authId = nanoid();

            // Xóa auth data cũ nếu có
            await this.clearAuthData();

            const stmt = this.db.prepare(`
                INSERT INTO auth (
                    id, userId, username, email, name, token, refreshToken,
                    status, loginAt, lastChecked, createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const result = stmt.run(
                authId,
                authData.user._id || authData.user.userId,
                authData.user.username,
                authData.user.email,
                authData.user.name,
                authData.token,
                authData.refreshToken || null,
                authData.user.status || 'active',
                now,
                now,
                now,
                now
            );

            log(`✅ Auth data saved for user: ${authData.user.username}`);
            return { success: true, authId };
        } catch (err) {
            error('❌ Error saving auth data:', err);
            throw err;
        }
    }

    /**
     * Lấy thông tin auth hiện tại
     */
    async getCurrentAuth() {
        try {
            const stmt = this.db.prepare(`
                SELECT * FROM auth WHERE status = 'active' ORDER BY loginAt DESC LIMIT 1
            `);
            const auth = stmt.get();
            
            if (auth) {
                log(`📋 Found auth data for user: ${auth.username}`);
            }
            
            return auth;
        } catch (err) {
            error('❌ Error getting current auth:', err);
            return null;
        }
    }

    /**
     * Cập nhật token
     */
    async updateToken(newToken, refreshToken = null) {
        try {
            const now = new Date().toISOString();
            const stmt = this.db.prepare(`
                UPDATE auth 
                SET token = ?, refreshToken = ?, lastChecked = ?, updatedAt = ?
                WHERE status = 'active'
            `);

            const result = stmt.run(newToken, refreshToken, now, now);
            
            if (result.changes > 0) {
                log('✅ Token updated successfully');
                return { success: true };
            } else {
                error('❌ No active auth found to update token');
                return { success: false, error: 'No active auth found' };
            }
        } catch (err) {
            error('❌ Error updating token:', err);
            throw err;
        }
    }

    /**
     * Cập nhật thời gian check cuối
     */
    async updateLastChecked() {
        try {
            const now = new Date().toISOString();
            const stmt = this.db.prepare(`
                UPDATE auth 
                SET lastChecked = ?, updatedAt = ?
                WHERE status = 'active'
            `);

            const result = stmt.run(now, now);
            return result.changes > 0;
        } catch (err) {
            error('❌ Error updating last checked:', err);
            throw err;
        }
    }

    /**
     * Xóa auth data (logout)
     */
    async clearAuthData() {
        try {
            const stmt = this.db.prepare(`DELETE FROM auth`);
            const result = stmt.run();
            
            log('✅ Auth data cleared');
            return { success: true, deletedCount: result.changes };
        } catch (err) {
            error('❌ Error clearing auth data:', err);
            throw err;
        }
    }

    /**
     * Kiểm tra user có đăng nhập không
     */
    async isAuthenticated() {
        try {
            const auth = await this.getCurrentAuth();
            if(auth && typeof auth.status !== 'undefined' && auth.status === 'active') {
                return true;
            }
            return false;
        } catch (err) {
            error('❌ Error checking authentication:', err);
            return false;
        }
    }

    /**
     * Lấy token hiện tại
     */
    async getCurrentToken() {
        try {
            const auth = await this.getCurrentAuth();
            return auth ? auth.token : null;
        } catch (err) {
            error('❌ Error getting current token:', err);
            return null;
        }
    }

    /**
     * Cập nhật trạng thái auth
     */
    async updateAuthStatus(status) {
        try {
            const now = new Date().toISOString();
            const stmt = this.db.prepare(`
                UPDATE auth 
                SET status = ?, updatedAt = ?
                WHERE status = 'active'
            `);

            const result = stmt.run(status, now);
            
            if (result.changes > 0) {
                log(`✅ Auth status updated to: ${status}`);
                return { success: true };
            } else {
                return { success: false, error: 'No active auth found' };
            }
        } catch (err) {
            error('❌ Error updating auth status:', err);
            throw err;
        }
    }

    /**
     * Lấy thông tin user hiện tại
     */
    async getCurrentUser() {
        try {
            const auth = await this.getCurrentAuth();
            if (!auth) return null;

            return {
                id: auth.userId,
                username: auth.username,
                email: auth.email,
                name: auth.name,
                status: auth.status,
                loginAt: auth.loginAt,
                lastChecked: auth.lastChecked
            };
        } catch (err) {
            error('❌ Error getting current user:', err);
            return null;
        }
    }
}

module.exports = AuthStorage; 