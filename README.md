# TTL TikTok Live Viewer

TTL - Tool TikTok Live Viewer Booster with SQLite Database

## 🆕 SQLite Migration

Dự án đã được upgrade từ JSON files sang SQLite database để cải thiện hiệu suất và độ tin cậy.

### ✨ New Features:
- ⚡ **10-50x faster** data operations
- 🗄️ **SQLite database** with ACID transactions  
- 🔄 **Auto-migration** từ JSON files
- 💾 **Safe backup** và rollback capability
- 🔍 **Advanced queries** support

### 🛠️ Migration Commands:

```bash
# Kiểm tra database info
npm run db:info

# Test migration (development)
npm run test:migration
npm run test:migration:perf

# Force migration to SQLite
npm run migration:force

# Rollback to JSON storage
npm run migration:rollback

# Production test with Electron
npm run db:check
```

### 📊 Storage Information:

Migration sẽ tự động chạy khi:
- ✅ Có JSON files từ version cũ
- ✅ Chưa có SQLite database
- ✅ User mở app lần đầu sau update

Dữ liệu được backup an toàn tại: `amac-data/json-backup/`

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

For more details, see [SQLITE_MIGRATION.md](SQLITE_MIGRATION.md)
If error database:
npm rebuild better-sqlite3
npx electron-rebuild -f -w better-sqlite3