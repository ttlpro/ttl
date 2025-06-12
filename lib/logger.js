/**
 * Logger module cho ứng dụng TTL TikTok Live Viewer
 * Mặc định tắt tất cả console.log, chỉ bật khi cần debug
 */

// Mặc định là false - không hiển thị log
let LOG_ENABLED = false;
if (process.env.NODE_ENV === 'development') {
    LOG_ENABLED = true;
}

/**
 * Hàm log thay thế cho console.log, chỉ hiển thị khi LOG_ENABLED = true
 * @param  {...any} args Các tham số giống như console.log
 */
function log(...args) {
    if (LOG_ENABLED) {
        console.log(...args);
    }
}

/**
 * Hàm error luôn hiển thị (không bị ảnh hưởng bởi LOG_ENABLED)
 * @param  {...any} args Các tham số giống như console.error
 */
function error(...args) {
    console.error(...args);
}

/**
 * Hàm warn luôn hiển thị (không bị ảnh hưởng bởi LOG_ENABLED)
 * @param  {...any} args Các tham số giống như console.warn
 */
function warn(...args) {
    console.warn(...args);
}

/**
 * Bật/tắt log
 * @param {boolean} enabled true để bật, false để tắt
 */
function setLogEnabled(enabled) {
    global.LOG_ENABLED = enabled;
}

module.exports = {
    log,
    error,
    warn,
    setLogEnabled,
    LOG_ENABLED
}; 