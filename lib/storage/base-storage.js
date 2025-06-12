const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { log, error } = require('../logger');

class BaseStorage {
    constructor(database = null) {
        // If external database provided, use it
        if (database) {
            this.db = database;
            this.dbPath = database.name || null;
            this.isExternalDb = true;
        } else {
            this.db = null;
            this.dbPath = null;
            this.isExternalDb = false;
        }
        
        this.defaultSettings = {
            autoStart: false,
            minimizeToTray: true,
            theme: 'dark',
            notifications: true,
            autoUpdate: true,
            maxConcurrentConnections: 5,
            connectionTimeout: 30000,
            retryDelay: 5000,
            maxRetries: 3
        };
    }

    /**
     * Khởi tạo database connection (skip nếu đã có external database)
     */
    async init() {
        // Skip init if using external database
        if (this.isExternalDb && this.db) {
            log('✅ Using external database:', this.db.name || 'unknown');
            return true;
        }
        
        try {
            const { app } = require('electron');
            const userDataPath = app.getPath('userData');
            this.dbPath = path.join(userDataPath, 'tiktok-live.db');
            log("dbPath", this.dbPath);
            // Tạo thư mục nếu chưa có
            const dir = path.dirname(this.dbPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            this.db = new Database(this.dbPath, {
                verbose: process.env.NODE_ENV === 'development' ? log : null
            });

            // Enable WAL mode và foreign keys
            this.db.pragma('journal_mode = WAL');
            this.db.pragma('foreign_keys = ON');
            this.db.pragma('synchronous = NORMAL');

            log('✅ SQLite database initialized:', this.dbPath);
            return true;
        } catch (err) {
            error('❌ Error initializing SQLite database:', err);
            throw err;
        }
    }

    /**
     * Đóng database connection (không đóng external database)
     */
    close() {
        if (this.db && !this.isExternalDb) {
            this.db.close();
            this.db = null;
            log('✅ SQLite database closed');
        } else if (this.isExternalDb) {
            log('⚠️ External database not closed (managed externally)');
            this.db = null;
        }
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Extract username từ account info
     */
    extractUsername(accountInfo) {
        if (typeof accountInfo === 'string') {
            return accountInfo;
        }
        return accountInfo?.username || accountInfo?.uniqueId || accountInfo?.user?.username || 'Unknown';
    }

    /**
     * Extract proxy host từ proxy info
     */
    extractProxyHost(proxyInfo) {
        if (typeof proxyInfo === 'string') {
            return proxyInfo.split(':')[0] || proxyInfo;
        }
        return proxyInfo?.host || proxyInfo?.ip || 'Unknown';
    }

    /**
     * Serialize object cho IPC compatibility
     */
    serializeForIPC(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
}

module.exports = BaseStorage; 