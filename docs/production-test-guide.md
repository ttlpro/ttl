# Production Build Testing Guide

## 🚨 Code Signing Issue với Better-SQLite3

Khi build production có thể gặp lỗi code signing cho better-sqlite3 native module:

```
codesign --sign ... better_sqlite3.node: A timestamp was expected but was not found.
```

## 🔧 Giải pháp Testing

### Option 1: Build không code signing (Để test)
```bash
npm run build:mac:nosign
```

### Option 2: Build với environment variable
```bash
CSC_IDENTITY_AUTO_DISCOVERY=false npm run build:mac
```

### Option 3: Build với skip code signing
```bash
export CSC_IDENTITY_AUTO_DISCOVERY=false
npm run build:mac
```

## 📋 Testing Checklist

### 1. Build thành công
```bash
npm run build:mac:nosign
```
Kiểm tra:
- ✅ Build completed without errors
- ✅ App được tạo trong `dist/mac-arm64/`
- ✅ better-sqlite3.node được unpack đúng

### 2. Test hàm releaseAccountsFromRoom

#### Chuẩn bị test data:
1. Tạo 2-3 accounts
2. Tạo 1 room và assign accounts vào room
3. Kiểm tra `currentRooms` và `activeRooms` trước khi xóa

#### Test scenario:
1. **Stop room** (call `releaseAccountsFromRoom`)
2. **Kiểm tra kết quả:**
   - `currentRooms` giảm đúng số lượng
   - `activeRooms` không còn room đã xóa
   - Không có relationships orphan trong `account_rooms`

#### Expected logs:
```
🔄 Giải phóng 2 accounts khỏi room room123
✅ Updated account acc1: currentRooms=1, activeRooms removed testroom
✅ Updated account acc2: currentRooms=0, activeRooms removed testroom
✅ Đã giải phóng 2 accounts khỏi room room123, xóa 2 relationships
```

### 3. Edge Cases Testing

#### Test với corrupted activeRooms:
```sql
UPDATE accounts SET activeRooms = 'invalid_json' WHERE id = 'test-acc';
```
Expected: Hàm vẫn hoạt động, activeRooms được reset thành `[]`

#### Test với null roomId:
```javascript
await releaseAccountsFromRoom(null);
```
Expected: Return `{ success: false, error: 'ROOM_ID_NULL' }`

#### Test với room không tồn tại:
```javascript
await releaseAccountsFromRoom('nonexistent-room');
```
Expected: Return `{ success: false, error: 'Room not found' }`

## 🔍 Debug Production Issues

### 1. Check native modules:
```bash
ls -la "dist/mac-arm64/TikTok Live Viewer.app/Contents/Resources/app.asar.unpacked/node_modules/better-sqlite3/"
```

### 2. Check app console logs:
- Open Developer Tools trong app
- Xem Console tab khi thực hiện operations
- Tìm error logs liên quan đến SQLite

### 3. Database integrity check:
```bash
# Trong app console
console.log(window.tiktokAPI.getDatabaseInfo());
```

## 🚀 Deploy Production

### Sau khi test thành công:

1. **Re-enable code signing** (production):
   ```bash
   npm run build:mac
   ```

2. **Test signed app**:
   - Install app từ DMG
   - Test core functions
   - Verify không có permission errors

3. **Distribution**:
   - Upload DMG to distribution platform
   - Document known issues (nếu có)
   - Prepare rollback plan

## 🐛 Troubleshooting

### If build fails with code signing:
1. Check certificate validity
2. Try building on different machine
3. Use `build:mac:nosign` for testing
4. Contact development team for certificate issues

### If better-sqlite3 not working:
1. Check if .node file exists in unpacked folder
2. Verify app permissions
3. Check Console for native module errors
4. Try rebuilding dependencies:
   ```bash
   npm run postinstall
   npm run build:mac:nosign
   ```

### If activeRooms still buggy:
1. Check database schema version
2. Verify all migrations applied
3. Test with fresh database
4. Enable debug logging in storage classes

## 📊 Performance Monitoring

Sau khi deploy production:

1. Monitor error rates
2. Check memory usage
3. Database operation performance
4. User feedback về room management

## 🔄 Rollback Plan

Nếu production có issue nghiêm trọng:

1. Revert code changes
2. Build với previous working version
3. Test rollback build
4. Deploy rollback version
5. Investigate issues offline 