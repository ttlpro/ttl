/**
 * Các hàm tiện ích cho ứng dụng tăng mắt TikTok
 */

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function generateUniqueId() {
    return 'id-' + Math.random().toString(36).substr(2, 16);
}

function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

module.exports = {
    formatDate,
    generateUniqueId,
    isEmpty,
    deepClone
};