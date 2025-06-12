#!/usr/bin/env node

/**
 * Mock GitHub API Server để test auto-update
 * Mô phỏng GitHub Releases API response
 */

const http = require('http');
const url = require('url');

const MOCK_RELEASES = {
  'amac-development/amactiktoklive': {
    tag_name: 'v1.0.1',
    name: 'TTL TikTok Live v1.0.1',
          body: `# Release Notes v1.0.1

## ✨ New Features
- 🔄 Auto-update system implementation
- 🌍 Complete 7-language translation support
- 📱 Enhanced UI components
- 🔧 Advanced update manager with progress tracking

## 🐛 Bug Fixes
- Fixed IPC serialization issues ("An object could not be cloned")
- Resolved controlled/uncontrolled input warnings
- Improved error handling and fallback mechanisms
- Enhanced serialization for all IPC communications

## 🔧 Technical Improvements
- Added GitHub Actions for automated multi-platform builds
- Enhanced update manager with backup and rollback functionality
- Improved download progress tracking with SHA256 verification
- Platform-specific installation handling (Windows/macOS/Linux)

## 🌍 Translations
- Complete translation support for 7 languages: Vietnamese, English, Chinese, Japanese, Korean, Thai, French
- All update system UI components fully translated

## 📦 Download
Download the appropriate file for your platform:
- **Windows**: TTL-TikTok-Live-Setup-1.0.1.exe (85 MB)
- **macOS**: TTL-TikTok-Live-1.0.1.dmg (92 MB)  
- **Linux**: TTL-TikTok-Live-1.0.1.AppImage (78 MB)

## 🔧 System Requirements
- Windows 10 or later / macOS 10.14 or later / Ubuntu 18.04 or later
- 4GB RAM minimum, 8GB recommended
- 500MB free disk space
- Internet connection for TikTok Live streaming

## ⚠️ Important Notes
- Backup your data before updating
- Close all TikTok Live sessions before installation
- Administrator/sudo privileges required for installation

---
**Full Changelog**: https://github.com/amac-development/amactiktoklive/compare/v1.0.0...v1.0.1`,
    published_at: new Date().toISOString(),
    assets: [
      {
        name: 'TTL-TikTok-Live-Setup-1.0.1.exe',
        size: 89123456, // ~85MB
        browser_download_url: 'https://github.com/amac-development/amactiktoklive/releases/download/v1.0.1/TTL-TikTok-Live-Setup-1.0.1.exe',
        content_type: 'application/octet-stream',
        download_count: 1247
      },
      {
        name: 'TTL-TikTok-Live-1.0.1.dmg',
        size: 96468992, // ~92MB
        browser_download_url: 'https://github.com/amac-development/amactiktoklive/releases/download/v1.0.1/TTL-TikTok-Live-1.0.1.dmg',
        content_type: 'application/octet-stream',
        download_count: 823
      },
      {
        name: 'TTL-TikTok-Live-1.0.1.AppImage',
        size: 81788928, // ~78MB
        browser_download_url: 'https://github.com/amac-development/amactiktoklive/releases/download/v1.0.1/TTL-TikTok-Live-1.0.1.AppImage',
        content_type: 'application/octet-stream',
        download_count: 456
      },
      {
        name: 'latest-mac.yml',
        size: 342,
        browser_download_url: 'https://github.com/amac-development/amactiktoklive/releases/download/v1.0.1/latest-mac.yml',
        content_type: 'text/yaml',
        download_count: 12
      },
      {
        name: 'latest.yml',
        size: 356,
        browser_download_url: 'https://github.com/amac-development/amactiktoklive/releases/download/v1.0.1/latest.yml',
        content_type: 'text/yaml',
        download_count: 8
      }
    ],
    author: {
      login: 'amac-development',
      avatar_url: 'https://github.com/amac-development.png'
    },
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    html_url: 'https://github.com/amac-development/amactiktoklive/releases/tag/v1.0.1',
    tarball_url: 'https://api.github.com/repos/amac-development/amactiktoklive/tarball/v1.0.1',
    zipball_url: 'https://api.github.com/repos/amac-development/amactiktoklive/zipball/v1.0.1'
  },
  
  // Test với version mới hơn
  'test-repo/newer-version': {
    tag_name: 'v2.0.0',
    name: 'TTL TikTok Live v2.0.0 - Major Update',
    body: `# 🎉 Major Release v2.0.0

## 🚀 Breaking Changes
- Complete UI overhaul with modern design
- New authentication system
- Improved performance (3x faster)

## ✨ New Features  
- Real-time collaboration
- Advanced analytics dashboard
- Multi-account management

## 📦 Download
This is a major update with significant improvements!`,
    published_at: new Date().toISOString(),
    assets: [
      {
        name: 'TTL-TikTok-Live-Setup-2.0.0.exe',
        size: 95000000,
        browser_download_url: 'https://github.com/test-repo/newer-version/releases/download/v2.0.0/TTL-TikTok-Live-Setup-2.0.0.exe'
      }
    ]
  }
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  console.log(`📡 ${req.method} ${path}`);
  
  // Mock GitHub API /repos/{owner}/{repo}/releases/latest
  const releaseMatch = path.match(/^\/repos\/([^\/]+)\/([^\/]+)\/releases\/latest$/);
  if (releaseMatch && req.method === 'GET') {
    const owner = releaseMatch[1];
    const repo = releaseMatch[2];
    const repoKey = `${owner}/${repo}`;
    
    console.log(`🔍 Looking for release: ${repoKey}`);
    
    if (MOCK_RELEASES[repoKey]) {
      const release = MOCK_RELEASES[repoKey];
      console.log(`✅ Found release: ${release.tag_name}`);
      
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': '5000',
        'X-RateLimit-Remaining': '4999'
      });
      res.end(JSON.stringify(release, null, 2));
      return;
    } else {
      console.log(`❌ Release not found for: ${repoKey}`);
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        message: 'Not Found',
        documentation_url: 'https://docs.github.com/rest/reference/repos#get-the-latest-release'
      }));
      return;
    }
  }
  
  // Mock health check
  if (path === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      mockReleases: Object.keys(MOCK_RELEASES),
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  // Mock list all releases for debugging
  if (path === '/releases' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(MOCK_RELEASES, null, 2));
    return;
  }
  
  // 404 cho các endpoints khác
  console.log(`❌ 404: ${path}`);
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    message: 'Not Found',
    availableEndpoints: [
      '/repos/{owner}/{repo}/releases/latest',
      '/health',
      '/releases'
    ]
  }));
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Mock GitHub API Server running on http://localhost:${PORT}`);
  console.log('📡 Available endpoints:');
  console.log(`   GET http://localhost:${PORT}/health`);
  console.log(`   GET http://localhost:${PORT}/releases`);
  console.log(`   GET http://localhost:${PORT}/repos/amac-development/amactiktoklive/releases/latest`);
  console.log('');
  console.log('🧪 Mock releases available:');
  Object.keys(MOCK_RELEASES).forEach(repo => {
    const release = MOCK_RELEASES[repo];
    console.log(`   📦 ${repo}: ${release.tag_name}`);
  });
  console.log('');
  console.log('💡 To test, update UpdateManager githubRepo to point to localhost API');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down mock server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = { server, MOCK_RELEASES }; 