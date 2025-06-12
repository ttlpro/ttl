const axios = require('axios');
const { log, error } = require('./logger');
const DeviceFingerprint = require('./device-fingerprint');
class AuthAPI {
    constructor() {
        this.baseURL = process.env.AUTH_API_URL || 'https://licensedb.amazingcpanel.com/api/app';
        // this.baseURL = process.env.AUTH_API_URL || 'http://localhost:5553/api/app';
        this.timeout = 30000; // 30 seconds
    }

    /**
     * Tạo axios instance với config chung
     */
    async createAxiosInstance(token = null) {
        const deviceData = await DeviceFingerprint.getDeviceInfo();
        log("deviceData",deviceData.deviceId)
        const config = {
            baseURL: this.baseURL,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json',
                'x-device-id': deviceData.deviceId
            }
        };

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        return axios.create(config);
    }

    /**
     * Đăng ký tài khoản mới
     */
    async register(userData) {
        try {
            log('🔐 Attempting to register user:', userData.username);

            const api = await this.createAxiosInstance();
            const response = await api.post('/register', {
                username: userData.username,
                password: userData.password,
                email: userData.email,
                name: userData.name
            });

            if (response.data.success) {
                log('✅ Registration successful for user:', userData.username);
                return {
                    success: true,
                    data: response.data.data,
                    message: response.data.message
                };
            } else {
                error('❌ Registration failed:', response.data.message);
                return {
                    success: false,
                    error: response.data.message || 'Registration failed'
                };
            }
        } catch (err) {
            error('❌ Registration error:', err.message);
            
            if (err.response?.data?.message) {
                return {
                    success: false,
                    error: err.response.data.message
                };
            }

            return {
                success: false,
                error: err.code === 'ECONNREFUSED' 
                    ? 'Cannot connect to authentication server' 
                    : 'Registration failed'
            };
        }
    }

    /**
     * Đăng nhập
     */
    async login(credentials) {
        try {
            log('🔐 Attempting to login user:', credentials.username);

            const api = await this.createAxiosInstance();
            const response = await api.post('/login', {
                username: credentials.username,
                password: credentials.password
            });

            if (response.data.success) {
                log('✅ Login successful for user:', credentials.username);
                return {
                    success: true,
                    data: response.data.data,
                    message: response.data.message
                };
            } else {
                error('❌ Login failed:', response.data.message);
                return {
                    success: false,
                    error: response.data.message || 'Login failed'
                };
            }
        } catch (err) {
            error('❌ Login error:', err.message);
            
            if (err.response?.data?.message) {
                return {
                    success: false,
                    error: err.response.data.message
                };
            }

            return {
                success: false,
                error: err.code === 'ECONNREFUSED' 
                    ? 'Cannot connect to authentication server' 
                    : 'Login failed'
            };
        }
    }

    /**
     * Lấy thông tin user và license
     */
    async getUserInfo(token) {
        try {
            log('📋 Fetching user info and license data');

            const api = await this.createAxiosInstance(token);
            const response = await api.get('/info');

            if (response.data.success) {
                log('✅ User info fetched successfully');
                return {
                    success: true,
                    data: response.data.data
                };
            } else {
                error('❌ Failed to fetch user info:', response.data.message);
                return {
                    success: false,
                    error: response.data.message || 'Failed to fetch user info'
                };
            }
        } catch (err) {
            error('❌ User info fetch error:', err.message);
            
            if (err.response?.status === 401) {
                return {
                    success: false,
                    error: 'Authentication expired',
                    needReauth: true
                };
            }

            if (err.response?.data?.message) {
                return {
                    success: false,
                    error: err.response.data.message
                };
            }

            return {
                success: false,
                error: err.code === 'ECONNREFUSED' 
                    ? 'Cannot connect to authentication server' 
                    : 'Failed to fetch user info'
            };
        }
    }

    /**
     * Kiểm tra token có còn valid không
     */
    async validateToken(token) {
        try {
            const result = await this.getUserInfo(token);
            return result.success;
        } catch (err) {
            error('❌ Token validation error:', err.message);
            return false;
        }
    }

    /**
     * Refresh token (nếu API hỗ trợ)
     */
    async refreshToken(refreshToken) {
        try {
            log('🔄 Attempting to refresh token');

            const api = await this.createAxiosInstance();
            const response = await api.post('/refresh', {
                refreshToken: refreshToken
            });

            if (response.data.success) {
                log('✅ Token refreshed successfully');
                return {
                    success: true,
                    data: response.data.data
                };
            } else {
                error('❌ Token refresh failed:', response.data.message);
                return {
                    success: false,
                    error: response.data.message || 'Token refresh failed'
                };
            }
        } catch (err) {
            error('❌ Token refresh error:', err.message);
            
            if (err.response?.data?.message) {
                return {
                    success: false,
                    error: err.response.data.message
                };
            }

            return {
                success: false,
                error: 'Token refresh failed'
            };
        }
    }

    /**
     * Logout (nếu API có endpoint logout)
     */
    async logout(token) {
        try {
            log('👋 Attempting to logout');

            const api = await this.createAxiosInstance(token);
            const response = await api.post('/logout');

            log('✅ Logout completed');
            return { success: true };
        } catch (err) {
            // Logout failure is not critical, just log it
            error('⚠️ Logout API call failed:', err.message);
            return { success: true }; // Still return success for local logout
        }
    }

    /**
     * Test connection đến auth server
     */
    async testConnection() {
        try {
            const api = await this.createAxiosInstance();
            // Thử gọi endpoint đơn giản để test connection
            await api.get('/health').catch(() => {
                // Nếu không có endpoint health, thử endpoint khác
                throw new Error('Health check failed');
            });
            
            return { success: true };
        } catch (err) {
            return { 
                success: false, 
                error: err.code === 'ECONNREFUSED' 
                    ? 'Cannot connect to authentication server' 
                    : 'Connection test failed'
            };
        }
    }

    /**
     * Cập nhật base URL (cho setting)
     */
    setBaseURL(url) {
        this.baseURL = url;
        log(`🔧 Auth API base URL updated to: ${url}`);
    }

    /**
     * Lấy current base URL
     */
    getBaseURL() {
        return this.baseURL;
    }
}

module.exports = AuthAPI; 