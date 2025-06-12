const BaseStorage = require('./base-storage');
const { log, error } = require('../logger');

class UpdateStateStorage extends BaseStorage {
    constructor(database) {
        super(database);
    }

    /**
     * Lấy update state hiện tại
     */
    async getUpdateState() {
        try {
            const stmt = this.db.prepare(`
                SELECT * FROM update_state WHERE id = 1
            `);
            
            const state = stmt.get();
            
            if (state) {
                // Parse JSON fields
                if (state.updateInfo) {
                    try {
                        state.updateInfo = JSON.parse(state.updateInfo);
                    } catch (e) {
                        state.updateInfo = null;
                    }
                }
                return state;
            }
            
            return null;
            
        } catch (err) {
            error('❌ Error getting update state:', err);
            throw err;
        }
    }

    /**
     * Cập nhật hoặc tạo update state
     */
    async saveUpdateState(updateData) {
        try {
            const now = new Date().toISOString();
            
            // Serialize updateInfo if it's an object
            let updateInfoStr = null;
            if (updateData.updateInfo && typeof updateData.updateInfo === 'object') {
                updateInfoStr = JSON.stringify(updateData.updateInfo);
            } else if (updateData.updateInfo) {
                updateInfoStr = updateData.updateInfo;
            }

            const existingState = await this.getUpdateState();
            
            if (existingState) {
                // Update existing record
                const stmt = this.db.prepare(`
                    UPDATE update_state 
                    SET currentVersion = ?,
                        latestVersion = ?,
                        hasUpdateAvailable = ?,
                        updateInfo = ?,
                        lastCheckTime = ?,
                        updateDismissed = ?,
                        updateDownloaded = ?,
                        updateInstalled = ?,
                        releaseNotes = ?,
                        downloadUrl = ?,
                        updatedAt = ?
                    WHERE id = 1
                `);
                
                const result = stmt.run(
                    updateData.currentVersion || existingState.currentVersion,
                    updateData.latestVersion || existingState.latestVersion,
                    updateData.hasUpdateAvailable !== undefined ? updateData.hasUpdateAvailable : existingState.hasUpdateAvailable,
                    updateInfoStr || existingState.updateInfo,
                    updateData.lastCheckTime || existingState.lastCheckTime,
                    updateData.updateDismissed !== undefined ? updateData.updateDismissed : existingState.updateDismissed,
                    updateData.updateDownloaded !== undefined ? updateData.updateDownloaded : existingState.updateDownloaded,
                    updateData.updateInstalled !== undefined ? updateData.updateInstalled : existingState.updateInstalled,
                    updateData.releaseNotes || existingState.releaseNotes,
                    updateData.downloadUrl || existingState.downloadUrl,
                    now
                );
                
                log(`✅ Updated update state: ${result.changes} rows`);
                return result.changes > 0;
                
            } else {
                // Insert new record
                const stmt = this.db.prepare(`
                    INSERT INTO update_state (
                        id, currentVersion, latestVersion, hasUpdateAvailable,
                        updateInfo, lastCheckTime, updateDismissed,
                        updateDownloaded, updateInstalled, releaseNotes,
                        downloadUrl, createdAt, updatedAt
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                
                const result = stmt.run(
                    1, // Fixed ID
                    updateData.currentVersion,
                    updateData.latestVersion || null,
                    updateData.hasUpdateAvailable || 0,
                    updateInfoStr,
                    updateData.lastCheckTime || now,
                    updateData.updateDismissed || 0,
                    updateData.updateDownloaded || 0,
                    updateData.updateInstalled || 0,
                    updateData.releaseNotes || null,
                    updateData.downloadUrl || null,
                    now,
                    now
                );
                
                log(`✅ Created update state: ${result.changes} rows`);
                return result.changes > 0;
            }
            
        } catch (err) {
            error('❌ Error saving update state:', err);
            throw err;
        }
    }

    /**
     * Đánh dấu update đã được dismiss
     */
    async dismissUpdate() {
        try {
            const result = await this.saveUpdateState({
                updateDismissed: 1,
                hasUpdateAvailable: 0
            });
            
            log('✅ Update dismissed');
            return result;
            
        } catch (err) {
            error('❌ Error dismissing update:', err);
            throw err;
        }
    }

    /**
     * Reset update state khi có version mới
     */
    async resetUpdateState(currentVersion) {
        try {
            const result = await this.saveUpdateState({
                currentVersion: currentVersion,
                latestVersion: null,
                hasUpdateAvailable: 0,
                updateInfo: null,
                updateDismissed: 0,
                updateDownloaded: 0,
                updateInstalled: 0,
                releaseNotes: null,
                downloadUrl: null
            });
            
            log(`✅ Reset update state for version ${currentVersion}`);
            return result;
            
        } catch (err) {
            error('❌ Error resetting update state:', err);
            throw err;
        }
    }

    /**
     * Kiểm tra có update available không (không bị dismiss)
     */
    async hasActiveUpdate() {
        try {
            const state = await this.getUpdateState();
            
            if (!state) {
                return false;
            }
            
            return state.hasUpdateAvailable && !state.updateDismissed;
            
        } catch (err) {
            error('❌ Error checking active update:', err);
            return false;
        }
    }
}

module.exports = UpdateStateStorage; 