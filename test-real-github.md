# Hướng dẫn Test Auto-Update với Real GitHub

## Bước 1: Setup GitHub Repository (5 phút)

### 1.1 Tạo Repository
```bash
# Trên GitHub.com, tạo repository mới:
# Tên: amactiktoklive-releases
# Visibility: Public
# README: Yes
```

### 1.2 Tạo Release v1.0.1
1. Vào repository → Releases → "Create a new release"
2. Tag version: `v1.0.1`
3. Release title: `TTL TikTok Live v1.0.1`
4. Description: Copy từ mock server (lines 17-67 trong mock-github-server.js)
5. **QUAN TRỌNG**: Upload files:
   - `latest.yml` (nội dung fake)
   - `latest-mac.yml` (nội dung fake)
   - `TTL-TikTok-Live-Setup-1.0.1.exe` (file fake ~1KB)

## Bước 2: Update UpdateManager (2 phút)

Sửa file `lib/update-manager.js`:

```javascript
constructor() {
  this.githubRepo = 'YOUR_USERNAME/amactiktoklive-releases'  // Thay YOUR_USERNAME
  this.githubApiUrl = 'https://api.github.com'              // Real GitHub API
  // ... rest unchanged
}
```

## Bước 3: Test Ngay (1 phút)

```bash
# 1. Start app
npm run dev

# 2. Mở browser: http://localhost:8888
# 3. Vào Settings page
# 4. Tìm "Update Manager" section
# 5. Click "Check for Updates"
# 6. Should show: v1.0.0 → v1.0.1 available update
```

## Bước 4: Verify Results

✅ **Expected Results:**
- Update detected: v1.0.0 → v1.0.1
- Release notes displayed
- Download URL points to real GitHub
- No errors in console

❌ **Troubleshooting:**
- 404 Error: Kiểm tra repo name và visibility
- No updates: Kiểm tra current version vs release tag
- Network error: Kiểm tra GitHub API limits 