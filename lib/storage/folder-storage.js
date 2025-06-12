const BaseStorage = require('./base-storage');
const { randomUUID } = require('crypto');
const { log, error } = require('../logger');

class FolderStorage extends BaseStorage {
    /**
     * Lấy tất cả folders theo type
     */
    async getAllFolders(type = 'accounts') {
        try {
            log(`🔍 Getting all folders for type: ${type}`);
            const stmt = this.db.prepare(`
                SELECT * FROM folders 
                WHERE type = ? 
                ORDER BY name ASC
            `);
            
            const folders = stmt.all(type).map(folder => ({
                ...folder,
                // Keep as ISO strings for IPC compatibility
                createdAt: folder.createdAt,
                updatedAt: folder.updatedAt
            }));
            
            log(`✅ Found ${folders.length} folders for type ${type}`);
            return this.serializeForIPC(folders);
        } catch (err) {
            error('❌ Error getting all folders:', err);
            return [];
        }
    }

    /**
     * Tạo folder mới
     */
    async createFolder(type, folderData) {
        try {
            log(`🔧 Creating new folder: ${folderData.name} (type: ${type})`);
            
            // Kiểm tra folder đã tồn tại chưa
            const existingFolder = await this.getFolderByName(type, folderData.name);
            if (existingFolder) {
                log(`⚠️ Folder already exists: ${folderData.name}`);
                return {
                    success: false,
                    error: `Folder '${folderData.name}' đã tồn tại trong ${type}`
                };
            }

            const id = randomUUID();
            const now = new Date().toISOString();
            
            const stmt = this.db.prepare(`
                INSERT INTO folders (
                    id, name, type, color, description,
                    createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            
            stmt.run(
                id,
                folderData.name,
                type,
                folderData.color || '#007bff',
                folderData.description || '',
                now,
                now
            );
            
            const newFolder = {
                id,
                name: folderData.name,
                type,
                color: folderData.color || '#007bff',
                description: folderData.description || '',
                createdAt: now,
                updatedAt: now
            };
            
            log(`✅ Created new folder: ${folderData.name} (id: ${id})`);
            return {
                success: true,
                data: newFolder
            };
        } catch (err) {
            error('❌ Error creating folder:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Cập nhật folder
     */
    async updateFolder(type, folderId, updates) {
        try {
            const now = new Date().toISOString();
            
            const setFields = [];
            const values = [];
            
            for (const [key, value] of Object.entries(updates)) {
                setFields.push(`${key} = ?`);
                values.push(value);
            }
            
            if (setFields.length === 0) {
                return { success: true };
            }
            
            setFields.push('updatedAt = ?');
            values.push(now);
            values.push(folderId);
            
            const sql = `UPDATE folders SET ${setFields.join(', ')} WHERE id = ? AND type = ?`;
            values.push(type);
            
            const stmt = this.db.prepare(sql);
            const result = stmt.run(...values);
            
            if (result.changes > 0) {
                log(`✅ Updated ${type} folder ${folderId}`);
                return { success: true };
            } else {
                return { success: false, error: 'Folder not found' };
            }
        } catch (err) {
            error('Error updating folder:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Xóa folder
     */
    async deleteFolder(type, folderId) {
        try {
            // Kiểm tra xem folder có items không
            const checkTable = type === 'accounts' ? 'accounts' : 'proxies';
            const checkStmt = this.db.prepare(`
                SELECT COUNT(*) as count FROM ${checkTable} WHERE folderId = ?
            `);
            const result = checkStmt.get(folderId);
            
            if (result.count > 0) {
                return { 
                    success: false, 
                    error: `Cannot delete folder. It contains ${result.count} items.` 
                };
            }
            
            // Xóa folder
            const deleteStmt = this.db.prepare(`
                DELETE FROM folders WHERE id = ? AND type = ?
            `);
            const deleteResult = deleteStmt.run(folderId, type);
            
            if (deleteResult.changes > 0) {
                log(`✅ Deleted ${type} folder ${folderId}`);
                return { success: true };
            } else {
                return { success: false, error: 'Folder not found' };
            }
        } catch (err) {
            error('Error deleting folder:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Get folder by ID
     */
    async getFolderById(type, folderId) {
        try {
            const stmt = this.db.prepare(`
                SELECT * FROM folders WHERE id = ? AND type = ?
            `);
            const folder = stmt.get(folderId, type);
            
            return folder ? this.serializeForIPC(folder) : null;
        } catch (err) {
            error('Error getting folder by ID:', err);
            return null;
        }
    }

    /**
     * Lấy folder theo tên
     */
    async getFolderByName(type, name) {
        try {
            log(`🔎 Looking for folder with name: "${name}" and type: "${type}"`);
            const stmt = this.db.prepare(`
                SELECT * FROM folders 
                WHERE type = ? AND name = ?
            `);
            
            const result = stmt.get(type, name);
            log(`🔍 Folder lookup result: ${result ? `Found folder with ID ${result.id}` : 'No folder found'}`);
            
            return result;
        } catch (err) {
            error('❌ Error getting folder by name:', err);
            return null;
        }
    }
}

module.exports = FolderStorage; 