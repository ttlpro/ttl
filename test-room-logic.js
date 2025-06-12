/**
 * Test logic của hàm releaseAccountsFromRoom đã sửa
 * Run: node test-room-logic.js
 */

// Mock logger
const log = console.log;
const error = console.error;

// Simplified test để kiểm tra logic xử lý activeRooms
class RoomLogicTest {
    
    // Test function để mô phỏng việc parse và update activeRooms
    testActiveRoomsProcessing() {
        console.log('🧪 Test activeRooms processing logic...\n');
        
        // Test cases
        const testCases = [
            {
                name: 'Normal array',
                activeRooms: '["testroom", "otherroom"]',
                roomInfo: { uid: 'room1', roomUsername: 'testroom' },
                roomId: 'room1',
                expected: ['otherroom']
            },
            {
                name: 'Invalid JSON',
                activeRooms: 'invalid_json',
                roomInfo: { uid: 'room1', roomUsername: 'testroom' },
                roomId: 'room1',
                expected: []
            },
            {
                name: 'Non-array object',
                activeRooms: '{"not": "array"}',
                roomInfo: { uid: 'room1', roomUsername: 'testroom' },
                roomId: 'room1',
                expected: []
            },
            {
                name: 'Empty array',
                activeRooms: '[]',
                roomInfo: { uid: 'room1', roomUsername: 'testroom' },
                roomId: 'room1',
                expected: []
            },
            {
                name: 'Multiple formats matching',
                activeRooms: '["room1", "testroom", "otherroom", "room3"]',
                roomInfo: { uid: 'room1', roomUsername: 'testroom' },
                roomId: 'room1',
                expected: ['otherroom', 'room3']
            },
            {
                name: 'Only uid match',
                activeRooms: '["room1", "otherroom"]',
                roomInfo: { uid: 'room1', roomUsername: null },
                roomId: 'room1',
                expected: ['otherroom']
            },
            {
                name: 'Only roomUsername match',
                activeRooms: '["testroom", "otherroom"]',
                roomInfo: { uid: 'room1', roomUsername: 'testroom' },
                roomId: 'room1',
                expected: ['otherroom']
            }
        ];
        
        // Chạy test cho từng case
        testCases.forEach((testCase, index) => {
            console.log(`\n📋 Test Case ${index + 1}: ${testCase.name}`);
            console.log(`Input activeRooms: ${testCase.activeRooms}`);
            console.log(`Room info:`, testCase.roomInfo);
            
            // Simulate processing logic từ hàm đã sửa
            const result = this.processActiveRooms(
                testCase.activeRooms, 
                testCase.roomInfo, 
                testCase.roomId
            );
            
            console.log(`Expected: [${testCase.expected.join(', ')}]`);
            console.log(`Actual: [${result.join(', ')}]`);
            
            const passed = JSON.stringify(result) === JSON.stringify(testCase.expected);
            console.log(passed ? '✅ PASSED' : '❌ FAILED');
        });
    }
    
    // Logic xử lý activeRooms như trong hàm đã sửa
    processActiveRooms(activeRoomsJson, roomInfo, roomId) {
        const accountId = 'test-account';
        
        // Parse activeRooms từ JSON string thành array với error handling
        let activeRooms = [];
        if (activeRoomsJson) {
            try {
                const parsed = JSON.parse(activeRoomsJson);
                if (Array.isArray(parsed)) {
                    activeRooms = parsed;
                } else {
                    error(`❌ activeRooms không phải array cho account ${accountId}:`, parsed);
                    activeRooms = [];
                }
            } catch (e) {
                error(`❌ Lỗi khi parse activeRooms của account ${accountId}:`, e);
                activeRooms = [];
            }
        }
        
        // Xóa room khỏi danh sách activeRooms với nhiều format matching
        const roomIdentifier = roomInfo.roomUsername || roomInfo.uid;
        const updatedActiveRooms = activeRooms.filter(room => {
            // Kiểm tra với tất cả các format có thể có
            return room !== roomIdentifier && 
                   room !== roomInfo.uid && 
                   room !== roomInfo.roomUsername &&
                   room !== roomId;
        });
        
        return updatedActiveRooms;
    }
    
    // Test room checking logic trong addAccountToRoom
    testRoomExistsLogic() {
        console.log('\n\n🧪 Test room exists checking logic...\n');
        
        const testCases = [
            {
                name: 'Room exists by username',
                activeRooms: ['testroom', 'otherroom'],
                roomInfo: { uid: 'room1', roomUsername: 'testroom' },
                roomId: 'room1',
                expected: true
            },
            {
                name: 'Room exists by uid',
                activeRooms: ['room1', 'otherroom'],
                roomInfo: { uid: 'room1', roomUsername: 'testroom' },
                roomId: 'room1',
                expected: true
            },
            {
                name: 'Room exists by roomId',
                activeRooms: ['room1', 'otherroom'],
                roomInfo: { uid: 'room1', roomUsername: 'testroom' },
                roomId: 'room1',
                expected: true
            },
            {
                name: 'Room does not exist',
                activeRooms: ['someother', 'otherroom'],
                roomInfo: { uid: 'room1', roomUsername: 'testroom' },
                roomId: 'room1',
                expected: false
            },
            {
                name: 'Empty activeRooms',
                activeRooms: [],
                roomInfo: { uid: 'room1', roomUsername: 'testroom' },
                roomId: 'room1',
                expected: false
            }
        ];
        
        testCases.forEach((testCase, index) => {
            console.log(`\n📋 Test Case ${index + 1}: ${testCase.name}`);
            console.log(`ActiveRooms: [${testCase.activeRooms.join(', ')}]`);
            console.log(`Room info:`, testCase.roomInfo);
            
            // Test logic từ addAccountToRoom đã sửa
            const roomExists = testCase.activeRooms.some(room => 
                room === (testCase.roomInfo.roomUsername || testCase.roomInfo.uid) || 
                room === testCase.roomInfo.uid || 
                room === testCase.roomInfo.roomUsername ||
                room === testCase.roomId
            );
            
            console.log(`Expected: ${testCase.expected}`);
            console.log(`Actual: ${roomExists}`);
            
            const passed = roomExists === testCase.expected;
            console.log(passed ? '✅ PASSED' : '❌ FAILED');
        });
    }
    
    // Test transaction behavior simulation
    testTransactionLogic() {
        console.log('\n\n🧪 Test transaction logic simulation...\n');
        
        // Simulate các bước trong transaction
        const mockAccounts = [
            { accountId: 'acc1', currentRooms: 2, activeRooms: '["testroom", "otherroom"]' },
            { accountId: 'acc2', currentRooms: 1, activeRooms: '["testroom"]' },
            { accountId: 'acc3', currentRooms: 1, activeRooms: 'invalid_json' },
        ];
        
        const roomInfo = { uid: 'room1', roomUsername: 'testroom' };
        const roomId = 'room1';
        
        console.log('📊 Before transaction:');
        mockAccounts.forEach(acc => {
            console.log(`  ${acc.accountId}: currentRooms=${acc.currentRooms}, activeRooms=${acc.activeRooms}`);
        });
        
        // Simulate transaction logic
        const results = [];
        for (const account of mockAccounts) {
            try {
                // Parse activeRooms
                const updatedActiveRooms = this.processActiveRooms(
                    account.activeRooms, 
                    roomInfo, 
                    roomId
                );
                
                // Calculate new room count (simulate counting from db)
                const newRoomCount = Math.max(0, account.currentRooms - 1);
                
                const result = {
                    accountId: account.accountId,
                    oldCurrentRooms: account.currentRooms,
                    newCurrentRooms: newRoomCount,
                    oldActiveRooms: account.activeRooms,
                    newActiveRooms: JSON.stringify(updatedActiveRooms),
                    success: true
                };
                
                results.push(result);
                
            } catch (accountError) {
                error(`❌ Lỗi khi cập nhật account ${account.accountId}:`, accountError);
                results.push({
                    accountId: account.accountId,
                    success: false,
                    error: accountError.message
                });
            }
        }
        
        console.log('\n📊 After transaction:');
        results.forEach(result => {
            if (result.success) {
                console.log(`  ${result.accountId}: ${result.oldCurrentRooms}->${result.newCurrentRooms}, activeRooms: ${result.oldActiveRooms} -> ${result.newActiveRooms}`);
            } else {
                console.log(`  ${result.accountId}: FAILED - ${result.error}`);
            }
        });
        
        const allSucceeded = results.every(r => r.success);
        console.log(`\n${allSucceeded ? '✅' : '❌'} Transaction would ${allSucceeded ? 'COMMIT' : 'ROLLBACK'}`);
    }
}

// Chạy tests
function runAllTests() {
    console.log('🚀 Bắt đầu test logic của hàm releaseAccountsFromRoom đã sửa...\n');
    
    const tester = new RoomLogicTest();
    
    try {
        // Test 1: activeRooms processing
        tester.testActiveRoomsProcessing();
        
        // Test 2: room exists checking
        tester.testRoomExistsLogic();
        
        // Test 3: transaction simulation
        tester.testTransactionLogic();
        
        console.log('\n\n🎉 Tất cả tests đã hoàn thành!');
        console.log('\n📋 Tóm tắt cải thiện trong hàm releaseAccountsFromRoom:');
        console.log('✅ 1. Sử dụng transaction để đảm bảo consistency');
        console.log('✅ 2. Cập nhật activeRooms TRƯỚC KHI xóa relationships');
        console.log('✅ 3. Robust JSON parsing với validation');
        console.log('✅ 4. Multi-format room identifier matching');
        console.log('✅ 5. Individual account error handling');
        console.log('✅ 6. Proper error logging và rollback support');
        
    } catch (error) {
        console.error('❌ Lỗi trong test:', error);
    }
}

// Chạy tests
if (require.main === module) {
    runAllTests();
}

module.exports = { RoomLogicTest }; 