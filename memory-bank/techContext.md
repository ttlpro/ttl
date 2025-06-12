# Công nghệ & Môi trường phát triển - TTL TikTok Live

## Stack công nghệ

### Frontend
- **Framework**: Next.js 14.x
- **UI Library**: React 18.x
- **Styling**: Tailwind CSS 3.x
- **State Management**: React Context API + Custom Hooks
- **Internationalization**: i18next

### Backend
- **Runtime**: Node.js 18.x
- **Framework**: Electron 28.x
- **Database**: SQLite 3.x (better-sqlite3)
- **ORM**: Custom SQL wrapper

### Utilities
- **Build Tools**: Webpack, Babel
- **Task Runner**: npm scripts
- **Bundler**: nextron (Next.js + Electron)

## Môi trường phát triển

### Cài đặt môi trường

```bash
# Yêu cầu
Node.js 18.x hoặc cao hơn
npm 9.x hoặc cao hơn

# Clone repository
git clone <repository-url>
cd amactiktoklive

# Cài đặt dependencies
npm install

# Chạy ứng dụng trong chế độ phát triển
npm run dev
```

### Cấu trúc thư mục

```
amactiktoklive/
├── lib/                  # Shared libraries
│   ├── storage/          # Storage modules
│   └── storage-adapter.js # Database adapter
├── main/                 # Electron main process
│   ├── background.js     # Main entry point
│   ├── preload.js        # Preload script
│   ├── handlers/         # IPC handlers
│   ├── helpers/          # Helper functions
│   └── businesses/       # Business logic
├── renderer/             # Next.js frontend
│   ├── pages/            # Application pages
│   ├── components/       # React components
│   ├── contexts/         # Context providers
│   ├── hooks/            # Custom hooks
│   ├── styles/           # CSS styles
│   └── public/           # Static assets
├── resources/            # App resources
├── electron-builder.yml  # Electron build config
├── package.json          # Project manifest
└── README.md             # Documentation
```

## Công cụ phát triển

### Lệnh phát triển chính

```bash
# Chạy ứng dụng trong chế độ phát triển
npm run dev

# Build ứng dụng cho production
npm run build

# Chạy tests
npm run test

# Lint code
npm run lint
```

### Môi trường phát triển đề xuất

- **IDE**: Visual Studio Code với các extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - SQLite Viewer
  - JavaScript Debugger

- **Debugging**: Sử dụng Chrome DevTools cho cả Main và Renderer process
  - Renderer: http://localhost:8888
  - Main: Cổng debug 9292

## Quy trình làm việc

### Git Flow

- **main**: Branch production, luôn ổn định
- **develop**: Branch phát triển chính
- **feature/xxx**: Các branch tính năng
- **bugfix/xxx**: Các branch sửa lỗi

### Coding Standards

- **JavaScript/TypeScript**: ESLint + Prettier
- **CSS**: Tailwind conventions
- **Commits**: Conventional Commits format
- **Documentation**: JSDoc cho các hàm chính

## Thư viện & Dependencies chính

### Electron & Next.js

```json
"dependencies": {
  "electron": "^28.0.0",
  "electron-serve": "^1.1.0",
  "next": "^14.0.0",
  "nextron": "^8.5.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0"
}
```

### Database & Storage

```json
"dependencies": {
  "better-sqlite3": "^8.5.0",
  "nanoid": "^4.0.2",
  "https-proxy-agent": "^5.0.1"
}
```

### UI Components

```json
"dependencies": {
  "tailwindcss": "^3.3.0",
  "@heroicons/react": "^2.0.18",
  "i18next": "^23.4.1",
  "react-i18next": "^13.0.2"
}
```

## API & Integrations

### TikTok Live API

Ứng dụng tương tác với TikTok Live thông qua một API wrapper tùy chỉnh:

```javascript
class TikTokLiveAPI {
  // Kết nối đến phòng live
  async connectToRoom(roomId, accountCredentials, proxyConfig) { /* ... */ }
  
  // Ngắt kết nối
  async disconnect(connectionId) { /* ... */ }
  
  // Lấy thông tin phòng
  async getRoomInfo(roomId) { /* ... */ }
  
  // Lắng nghe sự kiện
  onViewerCountUpdate(callback) { /* ... */ }
}
```

### Proxy Testing

Ứng dụng kiểm tra proxy bằng cách kết nối đến TikTok hoặc các dịch vụ bên thứ ba:

```javascript
async testProxy(proxy) {
  try {
    const proxyUrl = `${proxy.type}://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
    const agent = new HttpsProxyAgent(proxyUrl);
    
    const response = await axios.get('https://httpbin.org/ip', {
      httpsAgent: agent,
      timeout: 10000
    });
    
    return { success: true, responseTime: elapsed, ip: response.data.origin };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

## Quy trình build & deployment

### Build Process

1. Frontend (Next.js) build
2. Electron build
3. Packaging với electron-builder

### Supported Platforms

- **Windows**: Windows 10 trở lên, x64
- **macOS**: macOS 10.15 trở lên, universal (x64 + arm64)
- **Linux**: Ubuntu 20.04 trở lên, x64

### Packaging Configuration

```yaml
appId: com.amac.tiktok-live-viewer
productName: TTL TikTok Live Viewer
copyright: Copyright © 2023 TTL

directories:
  output: dist
  buildResources: resources

files:
  - from: .
    filter:
      - package.json
      - app

win:
  target: nsis
  artifactName: ${productName}-${version}.${ext}

mac:
  target: dmg
  category: public.app-category.utilities

linux:
  target: AppImage
  category: Utility
```

## Khả năng mở rộng

Ứng dụng được thiết kế với khả năng mở rộng cao:

1. **Plugin System**: Hỗ trợ thêm plugins bằng cách đăng ký handlers
2. **Module Independence**: Các module độc lập, dễ dàng thay thế
3. **API Abstraction**: Trừu tượng hóa các API bên thứ ba
4. **Storage Layer**: Khả năng thay đổi database backend 