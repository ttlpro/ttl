const fs = require('fs').promises;
const path = require('path');
const { app } = require('electron');
const { randomUUID } = require('crypto');
const { log, error } = require('./logger');

/**
 * Quản lý tasks tự động
 */
class TaskManager {
    constructor(storageManager = null) {
        this.dataDir = path.join(app.getPath('userData'), 'amac-data');
        
        // ⭐ Lưu reference tới storageManager  
        this.storageManager = storageManager;
        
        // Lưu trữ các timer đang chạy
        this.activeTimers = new Map();
        
        // Registry của các hàm xử lý
        this.taskHandlers = new Map();
        
        this.writeQueue = Promise.resolve(); // ✅ Write queue để serialize writes
        
        this.init();
    }

    /**
     * Khởi tạo task manager
     */
    async init() {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
            
            // ⭐ Không cần initFile nữa vì dùng SQLite
            
            // Đăng ký các hàm xử lý mặc định
            this.registerDefaultHandlers();
            
            // ✅ Tạo task ngầm tự động
            await this.ensureSystemTasks();
            
            // Khởi tạo lại các task đang kích hoạt
            await this.restoreActiveTasks();
            
            log('Task manager initialized');
        } catch (err) {
            error('Error initializing task manager:', err);
        }
    }

    /**
     * Đọc dữ liệu tasks từ SQLite
     */
    async readTasks() {
        try {
            if (!this.storageManager) {
                log('⚠️ No storage manager, falling back to empty tasks');
                return [];
            }
            
            const result = await this.storageManager.getAllTasks();
            if (result.success) {
                log(`📖 Successfully read ${result.data.length} tasks from SQLite`);
                return result.data;
            } else {
                log('❌ Error reading tasks from SQLite:', result.error);
                return [];
            }
        } catch (err) {
            log('❌ Error reading tasks:', err);
            return [];
        }
    }

    /**
     * Ghi dữ liệu tasks - KHÔNG CẦN THIẾT với SQLite vì auto-save
     */
    async writeTasks(tasks) {
        // ⭐ Với SQLite, không cần writeTasks vì mỗi operation tự động save
        // Chỉ log để theo dõi
        log(`📝 Tasks stored in SQLite: ${tasks.length} tasks`);
        return true;
    }

    /**
     * Đăng ký hàm xử lý cho task
     */
    registerHandler(handlerName, handlerFunction) {
        this.taskHandlers.set(handlerName, handlerFunction);
    }

    /**
     * Đăng ký các hàm xử lý mặc định
     */
    registerDefaultHandlers() {
        // ⭐ Import và khởi tạo task handlers với storageManager
        const TaskHandlers = require('./task-handlers');
        const taskHandlersInstance = new TaskHandlers(this.storageManager);
        
        this.registerHandler('checkAccountHealth', taskHandlersInstance.checkAccountHealth.bind(taskHandlersInstance));
        this.registerHandler('updateProxyStatus', taskHandlersInstance.updateProxyStatus.bind(taskHandlersInstance));
        this.registerHandler('cleanupOldData', taskHandlersInstance.cleanupOldData.bind(taskHandlersInstance));
        this.registerHandler('backupData', taskHandlersInstance.backupData.bind(taskHandlersInstance));
        this.registerHandler('backupDataWithoutHistory', taskHandlersInstance.backupDataWithoutHistory.bind(taskHandlersInstance));
        this.registerHandler('monitorRooms', taskHandlersInstance.monitorRooms.bind(taskHandlersInstance));
        this.registerHandler('updateAccountsInfo', taskHandlersInstance.updateAccountsInfo.bind(taskHandlersInstance));
        this.registerHandler('autoStopExpiredRooms', taskHandlersInstance.autoStopExpiredRooms.bind(taskHandlersInstance));
        this.registerHandler('refreshLicense', taskHandlersInstance.refreshLicense.bind(taskHandlersInstance));
    }

    /**
     * Lấy tất cả tasks
     */
    async getAllTasks() {
        return await this.readTasks();
    }

    /**
     * Đảm bảo các system tasks được tạo tự động
     */
    async ensureSystemTasks() {
        try {
            const tasks = await this.getAllTasks();
            
            // Kiểm tra xem đã có task autoStopExpiredRooms chưa
            const expiredRoomTask = tasks.find(t => t.handler === 'autoStopExpiredRooms');
            const updateAccountsInfoTask = tasks.find(t => t.handler === 'updateAccountsInfo');
            const monitorRoomsTask = tasks.find(t => t.handler === 'monitorRooms');
            const refreshLicenseTask = tasks.find(t => t.handler === 'refreshLicense');
            
            // Tạo thời gian hiện tại và thời gian chạy tiếp theo
            const now = new Date().toISOString();
            const nextRunTime = new Date(Date.now() + 60000).toISOString(); // Một phút từ hiện tại
            const licenseNextRunTime = new Date(Date.now() + 60000).toISOString(); // 30 phút từ hiện tại
            
            if (!expiredRoomTask) {
                await this.addTask({
                    name: 'Auto Stop Expired Rooms',
                    handler: 'autoStopExpiredRooms',
                    interval: 60000, // 1 phút
                    enabled: true,
                    status: 'idle',
                    lastRun: null,
                    nextRun: nextRunTime
                });
            }

            if (!updateAccountsInfoTask) {
                await this.addTask({
                    name: 'Update Accounts Info',
                    handler: 'updateAccountsInfo',
                    interval: 60000, // 1 phút
                    enabled: true,
                    status: 'idle',
                    lastRun: null,
                    nextRun: nextRunTime
                });
            }

            if (!monitorRoomsTask) {
                await this.addTask({
                    name: 'Monitor Rooms',
                    handler: 'monitorRooms',
                    interval: 60000, // 1 phút
                    enabled: true,
                    status: 'idle',
                    lastRun: null,
                    nextRun: nextRunTime
                });
            }

            if (!refreshLicenseTask) {
                await this.addTask({
                    name: 'Auto Refresh License',
                    handler: 'refreshLicense',
                    interval: 60000, // 1 phút = 1 * 60 * 1000ms
                    enabled: true,
                    status: 'idle',
                    lastRun: null,
                    nextRun: licenseNextRunTime
                });
            }
        } catch (err) {
            error('Error ensuring system tasks:', err);
        }
    }

    /**
     * Thêm task mới
     */
    async addTask(taskData) {
        if (!this.storageManager) {
            throw new Error('Storage manager not initialized');
        }
        
        // Validate handler exists
        if (!this.taskHandlers.has(taskData.handler)) {
            throw new Error(`Handler '${taskData.handler}' không tồn tại`);
        }

        // Thêm các trường mặc định
        const task = {
            ...taskData,
            id: randomUUID(),
            status: taskData.status || 'idle',
            runCount: 0,
            errorCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // ✅ THÊM: Tính nextRun ngay khi tạo task nếu enabled
            nextRun: taskData.enabled ? new Date(Date.now() + (taskData.interval || 60000)).toISOString() : null
        };

        const result = await this.storageManager.addTask(task);
        
        if (!result.success) {
            throw new Error(result.error);
        }

        // ✅ SỬA: Bắt đầu task nếu được kích hoạt (nhưng không chạy ngay), không nên cho await kẻo ảnh hưởng đến việc tạo task
        if (task.enabled) {
            this.startTask(task.id);
        }

        return task.id;
    }

    /**
     * Cập nhật task
     */
    async updateTask(taskId, updates) {
        if (!this.storageManager) {
            throw new Error('Storage manager not initialized');
        }

        const result = await this.storageManager.updateTask(taskId, updates);
        
        if (!result.success) {
            throw new Error(result.error);
        }

        // Restart task nếu enabled thay đổi
        if ('enabled' in updates) {
            if (updates.enabled) {
                await this.startTask(taskId);
            } else {
                this.stopTask(taskId);
            }
        }

        return true;
    }

    /**
     * Xóa task
     */
    async deleteTask(taskId) {
        if (!this.storageManager) {
            throw new Error('Storage manager not initialized');
        }

        // Stop task trước khi xóa
        this.stopTask(taskId);

        const result = await this.storageManager.deleteTask(taskId);
        
        if (!result.success) {
            throw new Error(result.error);
        }

        return true;
    }

    /**
     * Bắt đầu task trực tiếp (không check enabled)
     */
    async startTaskDirectly(taskId) {
        log(`🚀 Bắt đầu task trực tiếp ${taskId}`);
        const tasks = await this.getAllTasks();
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) {
            throw new Error('Task không tồn tại');
        }

        // Dừng timer cũ nếu có
        this.stopTask(taskId);

        // ✅ SỬA: Tạo timer với setTimeout để chạy lần đầu sau interval
        // Thay vì setInterval chạy ngay lập tức
        const timer = setTimeout(async () => {
            // Chạy lần đầu tiên sau interval
            await this.executeTask(taskId);
            
            // Sau đó tạo interval cho các lần tiếp theo
            const intervalTimer = setInterval(async () => {
                await this.executeTask(taskId);
            }, task.interval);
            
            // Cập nhật timer trong activeTimers
            this.activeTimers.set(taskId, intervalTimer);
        }, task.interval);

        this.activeTimers.set(taskId, timer);
        
        // Tính toán thời gian chạy tiếp theo một cách chính xác
        const nextRunTime = new Date(Date.now() + task.interval).toISOString();
        
        // Cập nhật trạng thái task
        await this.storageManager.updateTask(taskId, { 
            status: 'idle', // Đổi từ 'running' thành 'scheduled'
            nextRun: nextRunTime
        });

        log(`Task '${task.name}' đã được lên lịch, chạy lần đầu vào: ${nextRunTime}`);
    }

    /**
     * Bắt đầu task (với validation)
     */
    async startTask(taskId) {
        const tasks = await this.getAllTasks();
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) {
            throw new Error('Task không tồn tại');
        }

        if (!task.enabled) {
            throw new Error('Task chưa được kích hoạt');
        }

        return await this.startTaskDirectly(taskId);
    }

    /**
     * Dừng task
     */
    stopTask(taskId) {
        log(`🛑 Attempting to stop task ${taskId}`);
        
        const timer = this.activeTimers.get(taskId);
        if (timer) {
            // ✅ SỬA: Clear cả setTimeout và setInterval
            clearTimeout(timer);
            clearInterval(timer);
            this.activeTimers.delete(taskId);
            log(`✅ Task ${taskId} timer cleared successfully`);
        } else {
            log(`⚠️ No active timer found for task ${taskId}`);
        }
        
        // Debug: Show remaining active timers
        log(`🔍 Active timers after stop:`, Array.from(this.activeTimers.keys()));
    }

    /**
     * Thực thi task với improved checking
     */
    async executeTask(taskId) {
        log(`🚀 Executing task ${taskId}`);
        
        const tasks = await this.getAllTasks();
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) {
            log(`❌ Task ${taskId} not found`);
            // ✅ CHỈ STOP TASK ĐÓ, KHÔNG STOP TẤT CẢ
            this.stopTask(taskId);
            return;
        }
        
        if (!task.enabled) {
            log(`❌ Task ${taskId} is disabled, stopping`);
            this.stopTask(taskId);
            return;
        }

        // TRIPLE CHECK: Timer có còn trong activeTimers không
        if (!this.activeTimers.has(taskId)) {
            log(`❌ Task ${taskId} timer not in activeTimers, stopping`);
            return;
        }

        try {
            log(`⏳ Task ${task.name} (${taskId}) starting execution`);
            
            // Cập nhật trạng thái running và lastRun
            const currentTime = new Date().toISOString();
            await this.storageManager.updateTask(taskId, {
                status: 'running',
                lastRun: currentTime
            });

            const handler = this.taskHandlers.get(task.handler);
            if (!handler) {
                throw new Error(`Handler '${task.handler}' không tồn tại`);
            }

            // ✅ WRAPPER với timeout để tránh hang
            await Promise.race([
                handler(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Task timeout after 5 minutes')), 5 * 60 * 1000)
                )
            ]);

            log(`✅ Task ${taskId} completed successfully`);
            
            // Tính toán nextRun mới
            const nextRunTime = new Date(Date.now() + task.interval).toISOString();
            
            // Cập nhật status, runCount, và nextRun
            await this.storageManager.updateTask(taskId, {
                status: 'completed',
                runCount: (task.runCount || 0) + 1,
                nextRun: nextRunTime
            });

        } catch (err) {
            error(`❌ Error executing task ${task.name}:`, err);
            
            // ✅ Không crash nếu updateTaskStatus fail
            try {
                // Tính toán nextRun mới ngay cả khi có lỗi
                const nextRunTime = new Date(Date.now() + task.interval).toISOString();
                
                await this.storageManager.updateTask(taskId, {
                    status: 'error',
                    lastError: err.message,
                    errorCount: (task.errorCount || 0) + 1,
                    nextRun: nextRunTime
                });
            } catch (updateErr) {
                error(`❌ Failed to update task status:`, updateErr);
            }
        }
    }

    /**
     * Cập nhật trạng thái task
     */
    async updateTaskStatus(taskId, status, lastError = null) {
        if (!this.storageManager) {
            log('⚠️ No storage manager, skipping status update');
            return;
        }

        try {
            // Lấy thông tin task hiện tại để cập nhật đúng
            const task = await this.storageManager.getTaskById(taskId);
            if (!task) {
                log(`⚠️ Cannot update status for non-existent task ${taskId}`);
                return;
            }

            const updates = {
                status,
                updatedAt: new Date().toISOString()
            };

            // Cập nhật lastRun nếu là running hoặc completed
            if (status === 'running' || status === 'completed') {
                updates.lastRun = new Date().toISOString();
            }

            // Cập nhật nextRun nếu task vẫn active
            if (task.enabled && (status === 'completed' || status === 'running')) {
                updates.nextRun = new Date(Date.now() + task.interval).toISOString();
            }

            // Cập nhật error nếu có
            if (lastError) {
                updates.lastError = lastError;
                updates.errorCount = (task.errorCount || 0) + 1;
            }

            // Cập nhật runCount nếu completed
            if (status === 'completed') {
                updates.runCount = (task.runCount || 0) + 1;
            }

            const result = await this.storageManager.updateTask(taskId, updates);

            if (!result.success) {
                error('❌ Error updating task status:', result.error);
            }
        } catch (err) {
            error('❌ Error updating task status:', err);
        }
    }

    /**
     * Khôi phục các task đang hoạt động sau khi restart
     */
    async restoreActiveTasks() {
        const tasks = await this.getAllTasks();
        const activeTasks = tasks.filter(t => t.enabled);
        
        for (const task of activeTasks) {
            try {
                await this.startTask(task.id);
            } catch (err) {
                error(`Error restoring task ${task.name}:`, err);
            }
        }
    }

    /**
     * Thực thi task ngay lập tức (manual run)
     */
    async runTaskNow(taskId) {
        await this.executeTask(taskId);
    }

    /**
     * Dọn dẹp tất cả timers khi shutdown
     */
    cleanup() {
        for (const [taskId, timer] of this.activeTimers) {
            clearInterval(timer);
        }
        this.activeTimers.clear();
    }

    /**
     * Lấy danh sách handlers có sẵn
     */
    getAvailableHandlers() {
        return Array.from(this.taskHandlers.keys());
    }

    /**
     * Debug method - Show active timers
     */
    debugActiveTimers() {
        log('🔍 Active Timers:', Array.from(this.activeTimers.keys()));
        log('🔍 Total active timers:', this.activeTimers.size);
    }
}

module.exports = TaskManager; 