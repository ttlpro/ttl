const { log, error } = require('../logger');
const BaseStorage = require('./base-storage');

class SettingsStorage extends BaseStorage {
    /**
     * Get all settings
     */
    async getSettings() {
        try {
            const stmt = this.db.prepare(`
                SELECT key, value FROM settings
            `);
            const settings = stmt.all();
            
            const result = {};
            for (const setting of settings) {
                try {
                    result[setting.key] = JSON.parse(setting.value);
                } catch (err) {
                    result[setting.key] = setting.value;
                }
            }
            
            // Merge với default settings
            const finalSettings = { ...this.defaultSettings, ...result };
            return this.serializeForIPC(finalSettings);
        } catch (err) {
            error('Error getting settings:', err);
            return this.serializeForIPC(this.defaultSettings);
        }
    }

    /**
     * Save settings
     */
    async saveSettings(settings) {
        try {
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO settings (key, value, updatedAt)
                VALUES (?, ?, ?)
            `);
            
            const now = new Date().toISOString();
            let savedCount = 0;
            
            for (const [key, value] of Object.entries(settings)) {
                stmt.run(
                    key,
                    JSON.stringify(value),
                    now
                );
                savedCount++;
            }
            
            log(`✅ Saved ${savedCount} settings`);
            return { success: true, count: savedCount };
        } catch (err) {
            error('Error saving settings:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Save single setting
     */
    async saveSetting(key, value) {
        try {
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO settings (key, value, updatedAt)
                VALUES (?, ?, ?)
            `);
            
            stmt.run(
                key,
                JSON.stringify(value),
                new Date().toISOString()
            );
            
            log(`✅ Saved setting: ${key}`);
            return { success: true };
        } catch (err) {
            error('Error saving setting:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Get single setting
     */
    async getSetting(key) {
        try {
            const stmt = this.db.prepare(`
                SELECT value FROM settings WHERE key = ?
            `);
            const result = stmt.get(key);
            
            if (result) {
                try {
                    return JSON.parse(result.value);
                } catch (err) {
                    return result.value;
                }
            }
            
            // Return default value if exists
            return this.defaultSettings[key] || null;
        } catch (err) {
            error('Error getting setting:', err);
            return this.defaultSettings[key] || null;
        }
    }

    /**
     * Delete setting
     */
    async deleteSetting(key) {
        try {
            const stmt = this.db.prepare(`DELETE FROM settings WHERE key = ?`);
            const result = stmt.run(key);
            
            if (result.changes > 0) {
                log(`✅ Deleted setting: ${key}`);
                return { success: true };
            } else {
                return { success: false, error: 'Setting not found' };
            }
        } catch (err) {
            error('Error deleting setting:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Reset all settings to default
     */
    async resetSettings() {
        try {
            // Delete all current settings
            const deleteStmt = this.db.prepare(`DELETE FROM settings`);
            deleteStmt.run();
            
            // Insert default settings
            const insertStmt = this.db.prepare(`
                INSERT INTO settings (key, value, updatedAt)
                VALUES (?, ?, ?)
            `);
            
            const now = new Date().toISOString();
            let insertedCount = 0;
            
            for (const [key, value] of Object.entries(this.defaultSettings)) {
                insertStmt.run(
                    key,
                    JSON.stringify(value),
                    now
                );
                insertedCount++;
            }
            
            log(`✅ Reset to ${insertedCount} default settings`);
            return { success: true, count: insertedCount };
        } catch (err) {
            error('Error resetting settings:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Get settings with metadata
     */
    async getSettingsWithMetadata() {
        try {
            const stmt = this.db.prepare(`
                SELECT key, value, updatedAt FROM settings ORDER BY key ASC
            `);
            const settings = stmt.all();
            
            const result = [];
            for (const setting of settings) {
                try {
                    result.push({
                        key: setting.key,
                        value: JSON.parse(setting.value),
                        updatedAt: setting.updatedAt,
                        isDefault: this.defaultSettings.hasOwnProperty(setting.key)
                    });
                } catch (err) {
                    result.push({
                        key: setting.key,
                        value: setting.value,
                        updatedAt: setting.updatedAt,
                        isDefault: this.defaultSettings.hasOwnProperty(setting.key)
                    });
                }
            }
            
            return this.serializeForIPC(result);
        } catch (err) {
            error('Error getting settings with metadata:', err);
            return [];
        }
    }

    /**
     * Export settings to JSON
     */
    async exportSettings() {
        try {
            const settings = await this.getSettings();
            return {
                success: true,
                settings: settings,
                exportedAt: new Date().toISOString(),
                version: '1.0'
            };
        } catch (err) {
            error('Error exporting settings:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Import settings from JSON
     */
    async importSettings(settingsData) {
        try {
            if (!settingsData || typeof settingsData !== 'object') {
                return { success: false, error: 'Invalid settings data' };
            }

            // Validate settings keys
            const validKeys = Object.keys(this.defaultSettings);
            const settingsToImport = {};
            
            for (const [key, value] of Object.entries(settingsData)) {
                if (validKeys.includes(key)) {
                    settingsToImport[key] = value;
                }
            }

            if (Object.keys(settingsToImport).length === 0) {
                return { success: false, error: 'No valid settings to import' };
            }

            // Save imported settings
            const result = await this.saveSettings(settingsToImport);
            if (result.success) {
                log(`✅ Imported ${Object.keys(settingsToImport).length} settings`);
                return { 
                    success: true, 
                    imported: Object.keys(settingsToImport).length,
                    skipped: Object.keys(settingsData).length - Object.keys(settingsToImport).length
                };
            }

            return result;
        } catch (err) {
            error('Error importing settings:', err);
            return { success: false, error: err.message };
        }
    }
}

module.exports = SettingsStorage; 