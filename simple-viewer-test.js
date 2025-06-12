/**
 * File test viewer - CHỈ CONSOLE LOG, KHÔNG THỰC THI
 * Hàm nhận vào: accounts[], room_id, duration (ms)
 */

function startSimpleViewer(accounts, room_id, duration) {
    console.log('=== BẮT ĐẦU VIEWER ===');
    console.log('Danh sách accounts:', accounts);
    console.log('Room ID:', room_id);
    console.log('Thời gian xem (ms):', duration);
    console.log('Thời gian xem (phút):', Math.round(duration / 1000 / 60));
    console.log('Số lượng accounts:', accounts.length);
    console.log('======================');
    
    // Chỉ return thông tin, không làm gì cả
    return {
        success: true,
        message: `Sẽ khởi động ${accounts.length} viewer cho room ${room_id} trong ${Math.round(duration/1000/60)} phút`
    };
}

// Test với dữ liệu mẫu
const testAccounts = [
    'username1|password1|email1@gmail.com|emailpass1',
    'username2|password2|email2@gmail.com|emailpass2', 
    'username3|password3|email3@gmail.com|emailpass3'
];

const testRoomId = '7444176449977658117';
const testDuration = 300000; // 5 phút

// Chạy test
console.log('TEST VIEWER FUNCTION:');
const result = startSimpleViewer(testAccounts, testRoomId, testDuration);
console.log('Kết quả:', result);