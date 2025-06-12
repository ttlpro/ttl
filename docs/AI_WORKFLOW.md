# AI Assistant Workflow & Patterns

## 🏗️ Project Architecture

### Electron App Structure:

## 🌍 Đa ngôn ngữ (I18n)

**LUÔN LÀM KHI THÊM CHỨC NĂNG MỚI:**

### Ngôn ngữ hỗ trợ:
- 🇻🇳 Tiếng Việt (vi) 
- 🇺🇸 Tiếng Anh (en)
- 🇨🇳 Tiếng Trung (zh) 
- 🇯🇵 Tiếng Nhật (ja)
- 🇰🇷 Tiếng Hàn (ko)
- 🇹🇭 Tiếng Thái (th)
- 🇫🇷 Tiếng Pháp (fr)

### Workflow tự động:
1. **Khi tạo UI mới** → Identify text cần translate
2. **Tự động tạo translation keys** cho tất cả 7 ngôn ngữ
3. **Update files:** `renderer/locales/{lang}/common.json`
4. **Sử dụng:** `t('key')` thay vì hardcode text

### File locations:
```
renderer/
├── locales/
│   ├── vi/common.json
│   ├── en/common.json  
│   ├── zh/common.json
│   ├── ja/common.json
│   ├── ko/common.json
│   ├── th/common.json
│   └── fr/common.json
└── i18n.js
```

## 🔧 Task System

### Existing Task System:
- **TaskManager** (`lib/task-manager.js`) - Quản lý lifecycle của tasks
- **Task Handlers** (`lib/task-handlers.js`) - Implementation các task functions
- **IPC Handlers** (`main/handlers/taskHandlers.js`) - Bridge cho UI
- **Auto-restore** - Tasks tự khôi phục sau restart

### Available Handlers:
- `checkAccountHealth` - Kiểm tra sức khỏe accounts
- `monitorRooms` - **CẬP NHẬT** check currentViewers cho rooms
- `updateProxyStatus` - Update proxy status  
- `cleanupOldData` - Dọn dẹp data cũ
- `backupData` - Backup dữ liệu
- `updateAccountsInfo` - Cập nhật avatar/info cho accounts

### Khi thêm task handler mới:
1. **Add function** trong `lib/task-handlers.js`
2. **Register handler** trong `lib/task-manager.js` constructor  
3. **Update UI translations** cho tất cả ngôn ngữ
4. **Test với UI** trong tasks.jsx

### Pattern:
```javascript
// lib/task-handlers.js
async newHandler() {
  console.log('🔄 Starting new task...');
  
  try {
    // Get data from storageManager
    const data = await this.storageManager.getSomeData();
    
    // Process data
    for (const item of data) {
      // Do something
      await this.processItem(item);
      
      // Delay để tránh rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('✅ Task completed successfully');
  } catch (error) {
    console.error('❌ Task error:', error);
    throw error; // TaskManager sẽ handle error tracking
  }
}

// Export
module.exports = {
  // ... existing handlers
  newHandler: () => taskHandlers.newHandler()
};
```

## 🌍 Đa ngôn ngữ (I18n)

**LUÔN LÀM KHI THÊM CHỨC NĂNG MỚI:**

### Ngôn ngữ hỗ trợ:
- 🇻🇳 Tiếng Việt (vi) 
- 🇺🇸 Tiếng Anh (en)
- 🇨🇳 Tiếng Trung (zh) 
- 🇯🇵 Tiếng Nhật (ja)
- 🇰🇷 Tiếng Hàn (ko)
- 🇹🇭 Tiếng Thái (th)
- 🇫🇷 Tiếng Pháp (fr)

### Workflow tự động:
1. **Khi tạo UI mới** → Identify text cần translate
2. **Tự động tạo translation keys** cho tất cả 7 ngôn ngữ
3. **Update files:** `renderer/locales/{lang}/common.json`
4. **Sử dụng:** `t('key')` thay vì hardcode text

### File locations:
```
renderer/
├── locales/
│   ├── vi/common.json
│   ├── en/common.json  
│   ├── zh/common.json
│   ├── ja/common.json
│   ├── ko/common.json
│   ├── th/common.json
│   └── fr/common.json
└── i18n.js
```

## 🔧 Task System

### Khi thêm task handler mới:
1. **Add function** trong `lib/task-handlers.js`
2. **Register handler** trong `lib/task-manager.js`
3. **Update UI translations** cho tất cả ngôn ngữ
4. **Test với UI** trong tasks.jsx

### Pattern:
```javascript
// lib/task-handlers.js
async newHandler() {
  console.log('🔄 Starting new task...');
  // Implementation
  console.log('✅ Task completed');
}

// Export
module.exports = {
  // ... existing handlers
  newHandler: () => taskHandlers.newHandler()
};
```

## 📋 Checklist cho mọi chức năng mới:

- [ ] UI component tạo xong
- [ ] Backend/logic implemented  
- [ ] Translations cho 7 ngôn ngữ
- [ ] Test functionality
- [ ] Update navigation nếu cần

## 🚨 QUAN TRỌNG:
**KHÔNG BAO GIỜ hardcode text trong UI - luôn dùng translation!** 

### Key Data Models:
```javascript
// Room structure
{
  id: "unique_uid",
  roomId: "actual_tiktok_room_id", 
  currentViewers: 0,
  lastTimeCheckViewers: "ISO_timestamp",
  viewerHistory: [{ timestamp, viewers, isAlive }],
  status: "watching|stopped|completed",
  // ... other fields
}

// Account structure  
{
  id: "unique_id",
  username: "tiktok_username",
  activeRooms: ["room_id1", "room_id2"],
  currentRooms: 2,
  // ... other fields
}
```

## 🔍 Helper Functions

### Key Helper Functions (`main/businesses/helper.js`):
- `getRoomInfo4({room_id})` - **QUAN TRỌNG** lấy thông tin room, trả về `{view_count, is_alive, ...}`
- `getRoomId3({name})` - Lấy room_id từ username
- `getUserInfo({username})` - Lấy thông tin user (avatar, etc.)

### Pattern sử dụng:
```javascript
const helper = require('../main/businesses/helper');

// Lấy viewer count hiện tại
const roomInfo = await helper.getRoomInfo4({room_id: 'some_room_id'});
if (!roomInfo.err && roomInfo.view_count !== undefined) {
  // Use roomInfo.view_count
}
```

## 💾 Storage Manager

### Key Methods (`lib/storage-manager.js`):
- `getAllRooms()` - Lấy tất cả rooms
- `updateRoom(roomId, updates)` - Cập nhật room
- `updateRoomViewerStats(roomId, viewerData)` - **MỚI** cập nhật viewer stats + history
- `getRoomViewerHistory(roomId)` - **MỚI** lấy lịch sử viewers
- `getAllAccounts()` - Lấy tất cả accounts
- `addAccountToRoom(accountId, roomId)` - Thêm account vào room

### Data Persistence:
- **JSON files** trong `data/` folder
- **Auto-backup** và **error handling**
- **Transactional updates** để tránh corruption

## 📋 Checklist cho mọi chức năng mới:

- [ ] Backend logic implemented trong appropriate handler
- [ ] Storage methods created/updated nếu cần
- [ ] IPC handlers added trong `main/handlers/`
- [ ] UI component tạo xong với proper React patterns
- [ ] Translations cho **TẤT CẢ 7 ngôn ngữ**
- [ ] Error handling và user feedback  
- [ ] Test functionality thoroughly
- [ ] Update navigation nếu cần

## 🚨 QUAN TRỌNG:

### DO:
- **LUÔN** dùng `t('translation.key')` thay vì hardcode text
- **LUÔN** thêm error handling và user feedback
- **LUÔN** test với multiple languages
- **LUÔN** follow existing patterns trong codebase
- **LUÔN** add console.log với emoji để dễ debug

### DON'T:  
- **KHÔNG** hardcode text trong UI
- **KHÔNG** bỏ qua translation cho bất kỳ ngôn ngữ nào
- **KHÔNG** tạo new patterns khi đã có sẵn
- **KHÔNG** commit code chưa test

## 🎯 Current Implementation: Check Room Viewers

### Task: `monitorRooms` handler đã được nâng cấp để:
1. Lấy max 20 rooms `status='watching'`, sort theo `lastTimeCheckViewers` cũ nhất
2. Gọi `helper.getRoomInfo4({room_id})` cho mỗi room  
3. Update `currentViewers`, `lastTimeCheckViewers`, và `viewerHistory`
4. UI hiển thị last check time với color coding

### Files Modified:
- `lib/task-handlers.js` - Enhanced `monitorRooms()`
- `lib/storage-manager.js` - Added `updateRoomViewerStats()`, `getRoomViewerHistory()`
- `main/handlers/roomHandlers.js` - Added viewer history IPC handlers
- `renderer/pages/rooms.jsx` - Added lastTimeCheckViewers column
- `main/handlers/utilityHandlers.js` - Added auto-setup task function

### Auto-Setup:
Task "Check Room Viewers" tự động được tạo với interval 1 phút khi app khởi động. 