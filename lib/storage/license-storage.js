const BaseStorage = require('./base-storage');
const { log, error } = require('../logger');
const { nanoid } = require('nanoid');

class LicenseStorage extends BaseStorage {
    /**
     * Lưu license data từ API
     */
    async saveLicenseData(licenseData) {
        try {
            const now = new Date().toISOString();
            const licenseId = nanoid();

            // Xóa license cũ nếu có
            await this.clearLicenseData();

            const stmt = this.db.prepare(`
                INSERT INTO license (
                    id, licenseId, type, name, accounts, rooms, duration, price,
                    description, status, startDate, expiresAt, lastChecked,
                    createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            // Handle both licenseType (từ data.licenses) và licenseTypeId (từ data.user.license)
            const licenseTypeData = licenseData.licenseType || licenseData.licenseTypeId;
            
            const result = stmt.run(
                licenseId,
                licenseData._id,
                licenseData.type,
                licenseTypeData?.name || licenseData.type,
                licenseTypeData?.accounts || 0,
                licenseTypeData?.rooms || 0,
                licenseTypeData?.duration || 0,
                licenseTypeData?.price || 0,
                licenseTypeData?.description || '',
                licenseData.status,
                licenseData.startDate,
                licenseData.expiresAt,
                now,
                now,
                now
            );

            log(`✅ License data saved: ${licenseData.type} - ${licenseData.status}`);
            return { success: true, licenseId };
        } catch (err) {
            error('❌ Error saving license data:', err);
            throw err;
        }
    }

    /**
     * Lấy license hiện tại
     */
    async getCurrentLicense() {
        try {
            const stmt = this.db.prepare(`
                SELECT * FROM license ORDER BY createdAt DESC LIMIT 1
            `);
            const license = stmt.get();
            
            if (license) {
                // Kiểm tra license có hết hạn không
                const now = new Date();
                const expiresAt = new Date(license.expiresAt);
                
                if (now > expiresAt && license.status === 'active') {
                    // Cập nhật status thành expired
                    await this.updateLicenseStatus('expired');
                    license.status = 'expired';
                }
                
                log(`📋 Found license: ${license.type} - ${license.status}`);
            }
            
            return license;
        } catch (err) {
            error('❌ Error getting current license:', err);
            return null;
        }
    }

    /**
     * Kiểm tra license có active không
     */
    async isLicenseActive() {
        try {
            const license = await this.getCurrentLicense();
            if (!license) return false;

            const now = new Date();
            const expiresAt = new Date(license.expiresAt);
            
            return license.status === 'active' && now <= expiresAt;
        } catch (err) {
            error('❌ Error checking license status:', err);
            return false;
        }
    }

    /**
     * Lấy giới hạn của license
     */
    async getLicenseLimits() {
        try {
            const license = await this.getCurrentLicense();
            if (!license) {
                return {
                    accounts: 0,
                    rooms: 0,
                    hasValidLicense: false
                };
            }

            const isActive = await this.isLicenseActive();
            
            const result = {
                accounts: license.accounts,
                rooms: license.rooms,
                hasValidLicense: isActive,
                type: license.type,
                expiresAt: license.expiresAt,
                status: license.status
            };
            
            return result;
        } catch (err) {
            error('❌ Error getting license limits:', err);
            return {
                accounts: 0,
                rooms: 0,
                hasValidLicense: false
            };
        }
    }

    /**
     * Kiểm tra có vượt quá giới hạn accounts không
     */
    async checkAccountLimit(currentCount) {
        try {
            const limits = await this.getLicenseLimits();
            if (!limits.hasValidLicense) {
                return { allowed: false, reason: 'no_valid_license' };
            }

            if (currentCount >= limits.accounts) {
                return { 
                    allowed: false, 
                    reason: 'account_limit_exceeded',
                    limit: limits.accounts,
                    current: currentCount
                };
            }

            return { allowed: true };
        } catch (err) {
            error('❌ Error checking account limit:', err);
            return { allowed: false, reason: 'error' };
        }
    }

    /**
     * Kiểm tra có vượt quá giới hạn rooms không
     */
    async checkRoomLimit(currentCount) {
        try {
            const limits = await this.getLicenseLimits();
            if (!limits.hasValidLicense) {
                return { allowed: false, reason: 'no_valid_license' };
            }

            if (currentCount >= limits.rooms) {
                return { 
                    allowed: false, 
                    reason: 'room_limit_exceeded',
                    limit: limits.rooms,
                    current: currentCount
                };
            }

            return { allowed: true };
        } catch (err) {
            error('❌ Error checking room limit:', err);
            return { allowed: false, reason: 'error' };
        }
    }

    /**
     * Cập nhật trạng thái license
     */
    async updateLicenseStatus(status) {
        try {
            const now = new Date().toISOString();
            const stmt = this.db.prepare(`
                UPDATE license 
                SET status = ?, updatedAt = ?
                ORDER BY createdAt DESC
                LIMIT 1
            `);

            const result = stmt.run(status, now);
            
            if (result.changes > 0) {
                log(`✅ License status updated to: ${status}`);
                return { success: true };
            } else {
                return { success: false, error: 'No license found' };
            }
        } catch (err) {
            error('❌ Error updating license status:', err);
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
                UPDATE license 
                SET lastChecked = ?, updatedAt = ?
                ORDER BY createdAt DESC
                LIMIT 1
            `);

            const result = stmt.run(now, now);
            return result.changes > 0;
        } catch (err) {
            error('❌ Error updating last checked:', err);
            throw err;
        }
    }

    /**
     * Xóa license data
     */
    async clearLicenseData() {
        try {
            const stmt = this.db.prepare(`DELETE FROM license`);
            const result = stmt.run();
            
            log('✅ License data cleared');
            return { success: true, deletedCount: result.changes };
        } catch (err) {
            error('❌ Error clearing license data:', err);
            throw err;
        }
    }

    /**
     * Lấy thông tin chi tiết license để hiển thị
     */
    async getLicenseInfo() {
        try {
            const license = await this.getCurrentLicense();
            if (!license) return null;

            const now = new Date();
            const expiresAt = new Date(license.expiresAt);
            const startDate = new Date(license.startDate);
            
            const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
            const isExpired = now > expiresAt;
            const isActive = license.status === 'active' && !isExpired;

            return {
                id: license.licenseId,
                type: license.type,
                name: license.name,
                accounts: license.accounts,
                rooms: license.rooms,
                duration: license.duration,
                price: license.price,
                description: license.description,
                status: license.status,
                startDate: license.startDate,
                expiresAt: license.expiresAt,
                daysRemaining,
                isExpired,
                isActive,
                lastChecked: license.lastChecked
            };
        } catch (err) {
            error('❌ Error getting license info:', err);
            return null;
        }
    }

    /**
     * Cập nhật toàn bộ license data từ API
     */
    async updateLicenseFromAPI(licenseData) {
        try {
            // Tìm license active từ danh sách
            const activeLicense = licenseData.find(license => license.status === 'active');
            
            if (activeLicense) {
                await this.saveLicenseData(activeLicense);
                log('✅ Active license updated from API');
                return { success: true, license: activeLicense };
            } else {
                // Không có license active, xóa license hiện tại
                await this.clearLicenseData();
                log('⚠️ No active license found, cleared current license');
                return { success: true, license: null };
            }
        } catch (err) {
            error('❌ Error updating license from API:', err);
            throw err;
        }
    }
}

module.exports = LicenseStorage; 