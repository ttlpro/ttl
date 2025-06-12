const GroupView = require('./main/businesses/Viewer.js');
const { getTime } = require('./main/businesses/helper.js');

/**
 * Hàm đơn giản để khởi động viewer
 * @param {Array} accounts - Danh sách tài khoản (format: username|password hoặc cookie string)
 * @param {string} room_id - ID phòng live TikTok
 * @param {number} duration - Thời gian xem (milliseconds)
 * @param {Object} options - Các tùy chọn bổ sung
 * @returns {Promise<Object>} Kết quả khởi động
 */
async function startSimpleViewer(accounts, room_id, duration = 300000, options = {}) {
    try {
        // Validate đầu vào
        if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
            throw new Error('Danh sách tài khoản không hợp lệ');
        }
        
        if (!room_id) {
            throw new Error('Room ID không hợp lệ');
        }

        // Tạo task_id duy nhất
        const task_id = options.task_id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        console.log(`[${getTime()}] === BẮT ĐẦU VIEWER ===`);
        console.log(`[${getTime()}] Task ID: ${task_id}`);
        console.log(`[${getTime()}] Room ID: ${room_id}`);
        console.log(`[${getTime()}] Số tài khoản: ${accounts.length}`);
        console.log(`[${getTime()}] Thời gian xem: ${duration}ms (${Math.round(duration/1000/60)} phút)`);
        console.log(`[${getTime()}] Proxy: ${options.proxy || 'Không sử dụng'}`);
        
        // Log danh sách tài khoản (chỉ hiển thị một phần để bảo mật)
        console.log(`[${getTime()}] === DANH SÁCH TÀI KHOẢN ===`);
        accounts.forEach((account, index) => {
            // Chỉ hiển thị 50 ký tự đầu để bảo mật
            const accountPreview = account.length > 50 ? account.substring(0, 50) + '...' : account;
            console.log(`[${getTime()}] Tài khoản ${index + 1}: ${accountPreview}`);
        });

        // Khởi động viewer sử dụng GroupView
        await GroupView.startViewers({
            accounts: accounts,
            task_id: task_id,
            room_id: room_id,
            proxy: options.proxy || null
        });

        console.log(`[${getTime()}] ✅ Đã khởi động thành công ${accounts.length} viewer`);

        // Tự động dừng sau khoảng thời gian đã định
        if (duration > 0) {
            console.log(`[${getTime()}] ⏰ Đặt timer tự động dừng sau ${duration}ms`);
            setTimeout(async () => {
                console.log(`[${getTime()}] ⏰ Thời gian xem đã hết - Tự động dừng viewer`);
                await stopSimpleViewer(task_id);
            }, duration);
        }

        return {
            success: true,
            task_id: task_id,
            message: `Đã khởi động ${accounts.length} viewer cho room ${room_id}`,
            duration: duration,
            accounts_count: accounts.length
        };

    } catch (error) {
        console.error(`[${getTime()}] ❌ LỖI khi khởi động viewer:`, error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Hàm dừng viewer theo task_id
 * @param {string} task_id - ID của task cần dừng
 * @returns {Promise<Object>} Kết quả dừng
 */
async function stopSimpleViewer(task_id) {
    try {
        console.log(`[${getTime()}] === DỪNG VIEWER ===`);
        console.log(`[${getTime()}] Task ID: ${task_id}`);
        
        await GroupView.stopViewers({ task_id });
        
        console.log(`[${getTime()}] ✅ Đã dừng viewer cho task ${task_id}`);
        
        return {
            success: true,
            message: `Đã dừng viewer cho task ${task_id}`
        };
    } catch (error) {
        console.error(`[${getTime()}] ❌ LỖI khi dừng viewer:`, error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Hàm lấy thống kê viewer
 * @param {string} task_id - ID của task cần kiểm tra (optional)
 * @returns {Object} Thống kê viewer
 */
function getViewerStats(task_id = null) {
    try {
        console.log(`[${getTime()}] === THỐNG KÊ VIEWER ===`);
        
        let stats = {
            total_tasks: Object.keys(GroupView.data).length,
            total_viewers: 0,
            running_viewers: 0,
            tasks: {}
        };

        for (let id in GroupView.data) {
            if (task_id && id !== task_id) continue;
            
            const task = GroupView.data[id];
            const sockets = task.sockets || [];
            
            stats.total_viewers += sockets.length;
            stats.running_viewers += sockets.filter(s => s.status === 'running').length;
            
            stats.tasks[id] = {
                total: sockets.length,
                running: sockets.filter(s => s.status === 'running').length,
                stopped: sockets.filter(s => s.status === 'end').length,
                paused: sockets.filter(s => s.status === 'pause').length,
                statuses: sockets.reduce((acc, s) => {
                    const status = s.status || 'unknown';
                    acc[status] = (acc[status] || 0) + 1;
                    return acc;
                }, {})
            };
            
            console.log(`[${getTime()}] Task ${id}:`, stats.tasks[id]);
        }

        console.log(`[${getTime()}] Tổng số task: ${stats.total_tasks}`);
        console.log(`[${getTime()}] Tổng số viewer: ${stats.total_viewers}`);
        console.log(`[${getTime()}] Viewer đang chạy: ${stats.running_viewers}`);

        return stats;
    } catch (error) {
        console.error(`[${getTime()}] ❌ LỖI khi lấy thống kê viewer:`, error.message);
        return { error: error.message };
    }
}

// === TEST EXAMPLE ===
async function testViewer() {
    console.log(`[${getTime()}] === BẮT ĐẦU TEST VIEWER ===`);
    
    // Dữ liệu test
    const testAccounts = [
        'username1|password1|email1@gmail.com|emailpass1|cookie_data_1',
        'username2|password2|email2@gmail.com|emailpass2|cookie_data_2',
        'username3|password3|email3@gmail.com|emailpass3|cookie_data_3'
    ];
    
    const testRoomId = '7444176449977658117';
    const testDuration = 10000; // 10 giây để test
    
    // Test khởi động viewer
    const result = await startSimpleViewer(testAccounts, testRoomId, testDuration, {
        proxy: '123.45.67.89:8080:username:password'
    });
    
    console.log(`[${getTime()}] Kết quả khởi động:`, result);
    
    // Đợi 3 giây rồi check stats
    setTimeout(() => {
        console.log(`[${getTime()}] === CHECK STATS SAU 3 GIÂY ===`);
        const stats = getViewerStats();
    }, 3000);
    
    // Đợi 6 giây rồi check stats lần nữa
    setTimeout(() => {
        console.log(`[${getTime()}] === CHECK STATS SAU 6 GIÂY ===`);
        const stats = getViewerStats();
    }, 6000);
}

// Export các hàm để sử dụng
module.exports = {
    startSimpleViewer,
    stopSimpleViewer,
    getViewerStats,
    testViewer
};

// Chạy test nếu file được execute trực tiếp
if (require.main === module) {
    console.log(`[${getTime()}] === KHỞI ĐỘNG TEST ===`);
    testViewer().catch(console.error);
}