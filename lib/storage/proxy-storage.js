const BaseStorage = require('./base-storage');
const { log, error } = require('../../lib/logger');
class ProxyStorage extends BaseStorage {
    /**
     * Lấy tất cả proxies
     */
    async getAllProxies() {
        try {
            const stmt = this.db.prepare(`
                SELECT p.*, f.name as folderName, f.color as folderColor
                FROM proxies p
                LEFT JOIN folders f ON p.folderId = f.id
                ORDER BY p.host ASC
            `);
            
            const proxies = stmt.all().map(proxy => ({
                ...proxy,
                port: parseInt(proxy.port), // Ensure port is integer for IPC
                lastTested: proxy.lastTested,
                createdAt: proxy.createdAt,
                updatedAt: proxy.updatedAt
            }));
            
            return this.serializeForIPC(proxies);
        } catch (err) {
            error('Error getting all proxies:', err);
            return [];
        }
    }

    /**
     * Lấy proxies theo folder
     */
    async getProxiesByFolder(folderId) {
        try {
            const stmt = this.db.prepare(`
                SELECT p.*, f.name as folderName, f.color as folderColor
                FROM proxies p
                LEFT JOIN folders f ON p.folderId = f.id
                WHERE p.folderId = ?
                ORDER BY p.host ASC
            `);
            
            const proxies = stmt.all(folderId).map(proxy => ({
                ...proxy,
                port: parseInt(proxy.port),
                lastTested: proxy.lastTested,
                createdAt: proxy.createdAt,
                updatedAt: proxy.updatedAt
            }));
            
            return this.serializeForIPC(proxies);
        } catch (err) {
            error('Error getting proxies by folder:', err);
            return [];
        }
    }

    /**
     * Thêm proxy mới
     */
    async addProxy(proxyData) {
        try {
            // Tạo ID mới nếu chưa có
            const proxyId = proxyData.id || this.generateId();
            const now = new Date().toISOString();
            
            // Host là bắt buộc
            if (!proxyData.host) {
                return { 
                    success: false, 
                    error: 'Host is required for proxy' 
                };
            }
            
            // Validate port
            const port = parseInt(proxyData.port) || 8080;
            
            // Kiểm tra xem proxy đã tồn tại chưa
            const existingProxy = this.db.prepare(`
                SELECT id FROM proxies WHERE host = ? AND port = ?
            `).get(proxyData.host, port);
            
            if (existingProxy) {
                log(`⚠️ Proxy ${proxyData.host}:${port} đã tồn tại, sẽ cập nhật`);
                return this.updateProxy(existingProxy.id, {
                    ...proxyData,
                    updatedAt: now
                });
            }
            
            log(`📝 Adding proxy: ${proxyData.host}:${port}`);
            
            // Thêm proxy mới
            const stmt = this.db.prepare(`
                INSERT INTO proxies (
                    id, host, port, username, password, 
                    type, folderId, status, lastTested, 
                    responseTime, notes, createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            stmt.run(
                proxyId,
                proxyData.host,
                port,
                proxyData.username || null,
                proxyData.password || null,
                proxyData.type || 'http',
                proxyData.folderId || null,
                proxyData.status || 'active', // Mặc định là active
                null,
                0,
                proxyData.notes || '',
                now,
                now
            );
            
            const newProxy = {
                id: proxyId,
                host: proxyData.host,
                port: port,
                username: proxyData.username || null,
                password: proxyData.password || null,
                type: proxyData.type || 'http',
                folderId: proxyData.folderId || null,
                status: proxyData.status || 'active', // Mặc định là active
                lastTested: null,
                responseTime: 0,
                notes: proxyData.notes || '',
                createdAt: now,
                updatedAt: now
            };
            
            log(`✅ Added proxy: ${proxyData.host}:${port}`);
            return { success: true, proxy: this.serializeForIPC(newProxy) };
        } catch (err) {
            error('Error adding proxy:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Xóa proxy
     */
    async deleteProxy(proxyId) {
        try {
            // Update accounts using this proxy
            const updateAccountsStmt = this.db.prepare(`
                UPDATE accounts SET proxyId = NULL WHERE proxyId = ?
            `);
            updateAccountsStmt.run(proxyId);
            
            // Delete proxy
            const stmt = this.db.prepare(`DELETE FROM proxies WHERE id = ?`);
            const result = stmt.run(proxyId);
            
            if (result.changes > 0) {
                log(`✅ Deleted proxy ${proxyId}`);
                return { success: true };
            } else {
                return { success: false, error: 'Proxy not found' };
            }
        } catch (err) {
            error('Error deleting proxy:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Cập nhật proxy
     */
    async updateProxy(id, updates) {
        try {
            const now = new Date().toISOString();
            
            const setFields = [];
            const values = [];
            
            for (const [key, value] of Object.entries(updates)) {
                // Sửa lỗi lastUpdated -> updatedAt
                if (key === 'lastUpdated') {
                    log('⚠️ Cột lastUpdated được thay đổi thành updatedAt');
                    setFields.push(`updatedAt = ?`);
                    values.push(value);
                    continue;
                }
                
                if (key === 'metadata') {
                    setFields.push(`${key} = ?`);
                    values.push(JSON.stringify(value));
                } else if (key === 'lastCheck') {
                    setFields.push(`${key} = ?`);
                    values.push(value ? value : null);
                } else {
                    setFields.push(`${key} = ?`);
                    values.push(value);
                }
            }
            
            if (setFields.length === 0) {
                return { success: true };
            }
            
            // Chỉ thêm updatedAt nếu không đã có trong updates
            if (!updates.hasOwnProperty('updatedAt') && !updates.hasOwnProperty('lastUpdated')) {
                setFields.push('updatedAt = ?');
                values.push(now);
            }
            
            values.push(id);
            
            const sql = `UPDATE proxies SET ${setFields.join(', ')} WHERE id = ?`;
            const stmt = this.db.prepare(sql);
            
            log(`🔄 Updating proxy ${id} with fields: ${setFields.join(', ')}`);
            const result = stmt.run(...values);
            
            if (result.changes > 0) {
                log(`✅ Updated proxy ${id}`);
                return { success: true };
            } else {
                return { success: false, error: 'Proxy not found' };
            }
        } catch (err) {
            error('Error updating proxy:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Test proxy connection
     */
    async testProxy(proxyId) {
        try {
            const stmt = this.db.prepare(`SELECT * FROM proxies WHERE id = ?`);
            const proxy = stmt.get(proxyId);
            
            if (!proxy) {
                return { success: false, error: 'Proxy not found' };
            }

            // Update status to testing
            await this.updateProxy(proxyId, { status: 'testing' });

            const startTime = Date.now();
            let status = 'error';
            let responseTime = 0;

            try {
                // Test proxy bằng axios với timeout
                const axios = require('axios');
                const HttpsProxyAgent = require('https-proxy-agent');
                
                const proxyUrl = proxy.username && proxy.password 
                    ? `${proxy.type}://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`
                    : `${proxy.type}://${proxy.host}:${proxy.port}`;

                const agent = new HttpsProxyAgent(proxyUrl);
                
                await axios.get('https://httpbin.org/ip', {
                    httpsAgent: agent,
                    timeout: 10000
                });

                responseTime = Date.now() - startTime;
                status = 'active';
            } catch (err) {
                log(`Proxy test failed for ${proxy.host}:${proxy.port}:`, err.message);
                responseTime = Date.now() - startTime;
                status = 'error';
            }

            // Update proxy with test results
            await this.updateProxy(proxyId, {
                status: status,
                responseTime: responseTime,
                lastTested: new Date().toISOString()
            });

            log(`✅ Tested proxy ${proxy.host}:${proxy.port} - ${status} (${responseTime}ms)`);
            return { 
                success: true, 
                status: status, 
                responseTime: responseTime 
            };

        } catch (err) {
            error('Error testing proxy:', err);
            
            // Update status to failed on error
            await this.updateProxy(proxyId, { 
                status: 'failed',
                lastTested: new Date().toISOString()
            });
            
            return { success: false, error: error.message };
        }
    }

    /**
     * Get proxy by ID
     */
    async getProxyById(proxyId) {
        try {
            const stmt = this.db.prepare(`SELECT * FROM proxies WHERE id = ?`);
            const proxy = stmt.get(proxyId);
            
            if (!proxy) {
                log(`⚠️ Proxy not found with ID: ${proxyId}`);
                return null;
            }
            
            // Format proxyInfo để dễ sử dụng
            let proxyInfo;
            if (proxy.username && proxy.password) {
                proxyInfo = `${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
            } else {
                proxyInfo = `${proxy.host}:${proxy.port}`;
            }
            
            return {
                id: proxy.id,
                host: proxy.host,
                port: proxy.port,
                username: proxy.username,
                password: proxy.password,
                type: proxy.type,
                status: proxy.status,
                folderId: proxy.folderId,
                lastTested: proxy.lastTested,
                responseTime: proxy.responseTime,
                notes: proxy.notes,
                createdAt: proxy.createdAt,
                updatedAt: proxy.updatedAt,
                proxyInfo: proxyInfo
            };
        } catch (err) {
            error('Error getting proxy by ID:', err);
            return null;
        }
    }

    /**
     * Import proxies từ text (mỗi dòng một proxy)
     */
    async importProxiesFromText(text, folderId = null) {
        try {
            log(`📥 Importing proxies from text. Length: ${text.length}, FolderId: ${folderId || 'null'}`);
            
            // Xử lý folderId nếu là 'default' hoặc null
            if (!folderId || folderId === 'default') {
                // Kiểm tra xem folder 'proxies-default' có tồn tại không
                const checkFolder = this.db.prepare(`
                    SELECT id FROM folders WHERE type = 'proxies' AND (id = 'proxies-default' OR name = 'Mặc định')
                `).get();
                
                if (!checkFolder) {
                    log('📁 Creating default proxies folder');
                    // Tạo folder mặc định nếu chưa có
                    const defaultFolderId = 'proxies-default';
                    const now = new Date().toISOString();
                    const folderStmt = this.db.prepare(`
                        INSERT INTO folders (id, name, type, color, description, createdAt, updatedAt)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `);
                    
                    folderStmt.run(
                        defaultFolderId,
                        'Mặc định',
                        'proxies',
                        '#6B7280',
                        'Thư mục mặc định cho proxy',
                        now,
                        now
                    );
                    
                    log('✅ Created default proxies folder');
                    folderId = defaultFolderId;
                } else {
                    folderId = checkFolder.id;
                    log(`📁 Using existing default folder: ${folderId}`);
                }
            } else {
                // Kiểm tra xem folder đã chọn có tồn tại không
                const checkFolder = this.db.prepare(`
                    SELECT id FROM folders WHERE id = ?
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
            }
            
            // Tách các dòng và lọc bỏ các dòng trống
            const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            const results = [];
            
            for (const line of lines) {
                try {
                    // Parse thông tin proxy từ dòng text
                    const proxyData = this.parseProxyLine(line);
                    
                    // Tạo proxy ID và thêm folderId
                    const proxyId = this.generateId();
                    proxyData.id = proxyId;
                    proxyData.folderId = folderId;
                    
                    // Thêm proxy vào database
                    const result = await this.addProxy(proxyData);
                    
                    results.push({
                        proxy: line,
                        success: result.success,
                        id: result.success ? proxyId : null,
                        error: result.error
                    });
                } catch (err) {
                    error('❌ Error parsing proxy line:', err);
                    results.push({
                        proxy: line,
                        success: false,
                        error: error.message
                    });
                }
            }
            
            const successCount = results.filter(r => r.success).length;
            
            return {
                success: true,
                imported: successCount,
                total: lines.length,
                results: results
            };
        } catch (err) {
            error('❌ Error importing proxies from text:', err);
            return {
                success: false,
                error: error.message,
                imported: 0,
                total: 0,
                results: []
            };
        }
    }

    /**
     * Parse proxy info từ line text
     */
    parseProxyLine(line) {
        log('🔍 Parsing proxy line:', line);
        let host = '', port = 0, username = null, password = null, type = 'http';

        try {
            // Kiểm tra định dạng proxy
            if (line.includes('@')) {
                // Định dạng username:password@host:port
                const [auth, hostPort] = line.split('@');
                if (auth && auth.includes(':')) {
                    [username, password] = auth.split(':');
                }
                if (hostPort && hostPort.includes(':')) {
                    [host, port] = hostPort.split(':');
                    port = parseInt(port, 10) || 8080;
                } else {
                    host = hostPort || '';
                    port = 8080;
                }
            } else if (line.includes(':')) {
                // Định dạng host:port hoặc host:port:username:password
                const parts = line.split(':');
                if (parts.length >= 2) {
                    host = parts[0] || '';
                    port = parseInt(parts[1], 10) || 8080;
                    
                    if (parts.length >= 4) {
                        username = parts[2] || null;
                        password = parts[3] || null;
                    }
                }
            } else {
                // Chỉ có host
                host = line.trim();
                port = 8080; // Default port
            }

            // Kiểm tra xem có proxy type không (socks5://...)
            if (host.includes('://')) {
                const parts = host.split('://');
                type = parts[0] || 'http';
                host = parts[1] || '';
            }

            // Đảm bảo giá trị hợp lệ
            host = host.trim();
            port = parseInt(port, 10) || 8080;
            username = username ? username.trim() : null;
            password = password ? password.trim() : null;
            type = type.toLowerCase();

            if (!host) {
                throw new Error('Invalid proxy format: missing host');
            }

            const result = { host, port, username, password, type, status: 'active' };
            log('✅ Parsed proxy data:', result);
            return result;
        } catch (err) {
            error('❌ Error parsing proxy line:', err);
            // Fallback to basic proxy
            return { 
                host: line.trim() || 'localhost', 
                port: 8080, 
                username: null, 
                password: null, 
                type: 'http',
                status: 'active'
            };
        }
    }

    /**
     * Di chuyển nhiều proxy vào một folder
     */
    async bulkMoveProxiesToFolder(proxyIds, folderId) {
        try {
            if (!Array.isArray(proxyIds) || proxyIds.length === 0) {
                return { success: false, error: 'Danh sách proxy không hợp lệ' };
            }
            
            log(`🔄 Di chuyển ${proxyIds.length} proxy vào folder ${folderId}`);
            
            const now = new Date().toISOString();
            const stmt = this.db.prepare(`
                UPDATE proxies 
                SET folderId = ?, updatedAt = ? 
                WHERE id IN (${proxyIds.map(() => '?').join(',')})
            `);
            
            const params = [folderId, now, ...proxyIds];
            const result = stmt.run(...params);
            
            if (result.changes > 0) {
                log(`✅ Đã di chuyển ${result.changes} proxy vào folder ${folderId}`);
                return { 
                    success: true, 
                    moved: result.changes,
                    total: proxyIds.length
                };
            } else {
                return { 
                    success: true, 
                    moved: 0,
                    total: proxyIds.length,
                    message: 'Không có proxy nào được di chuyển'
                };
            }
        } catch (err) {
            error('Error moving proxies to folder:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Test nhiều proxy cùng lúc
     */
    async bulkTestProxies(proxyIds) {
        try {
            if (!Array.isArray(proxyIds) || proxyIds.length === 0) {
                return { success: false, error: 'Danh sách proxy không hợp lệ' };
            }
            
            log(`🔄 Kiểm tra ${proxyIds.length} proxy`);
            
            const results = [];
            for (const proxyId of proxyIds) {
                try {
                    const result = await this.testProxy(proxyId);
                    results.push({ 
                        id: proxyId, 
                        success: result.success, 
                        status: result.status,
                        responseTime: result.responseTime
                    });
                } catch (err) {
                    results.push({ id: proxyId, success: false, error: err.message });
                }
            }
            
            const successCount = results.filter(r => r.success && r.status === 'active').length;
            log(`✅ Đã kiểm tra ${results.length} proxy, ${successCount} hoạt động tốt`);
            
            return {
                success: true,
                results: results,
                working: successCount,
                total: results.length
            };
        } catch (err) {
            error('Error bulk testing proxies:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Xuất danh sách proxy theo định dạng
     */
    async exportProxies(format = 'ip_port_username_password', proxyIds = null) {
        try {
            let stmt;
            
            if (Array.isArray(proxyIds) && proxyIds.length > 0) {
                // Xuất proxy theo danh sách ID
                stmt = this.db.prepare(`
                    SELECT * FROM proxies 
                    WHERE id IN (${proxyIds.map(() => '?').join(',')})
                    ORDER BY host ASC
                `);
                stmt = stmt.all(...proxyIds);
            } else {
                // Xuất tất cả proxy
                stmt = this.db.prepare(`SELECT * FROM proxies ORDER BY host ASC`);
                stmt = stmt.all();
            }
            
            const proxies = stmt.map(proxy => ({
                ...proxy,
                port: parseInt(proxy.port) || 8080
            }));
            
            let exportData = '';
            
            for (const proxy of proxies) {
                let line = '';
                
                switch (format) {
                    case 'ip_port':
                        line = `${proxy.host}:${proxy.port}`;
                        break;
                    case 'ip_port_username':
                        line = `${proxy.host}:${proxy.port}:${proxy.username || ''}`;
                        break;
                    case 'username_password_ip_port':
                        if (proxy.username && proxy.password) {
                            line = `${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
                        } else {
                            line = `${proxy.host}:${proxy.port}`;
                        }
                        break;
                    case 'http_format':
                        if (proxy.username && proxy.password) {
                            line = `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
                        } else {
                            line = `http://${proxy.host}:${proxy.port}`;
                        }
                        break;
                    default: // ip_port_username_password
                        line = `${proxy.host}:${proxy.port}:${proxy.username || ''}:${proxy.password || ''}`;
                        break;
                }
                
                exportData += line + '\n';
            }
            
            log(`✅ Đã xuất ${proxies.length} proxy với định dạng ${format}`);
            
            return {
                success: true,
                data: exportData,
                count: proxies.length,
                format: format
            };
        } catch (err) {
            error('Error exporting proxies:', err);
            return { success: false, error: err.message };
        }
    }
}

module.exports = ProxyStorage; 