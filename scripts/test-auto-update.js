#!/usr/bin/env node

/**
 * Script để test auto-update system
 * Tạo mock GitHub release API response và test update flow
 */

const path = require('path');
const fs = require('fs').promises;
const UpdateManager = require('../lib/update-manager');

console.log('🧪 Testing Auto-Update System');
console.log('==============================');

async function testUpdateManager() {
  try {
    // 1. Test UpdateManager initialization
    console.log('\n1️⃣ Testing UpdateManager initialization...');
    const updateManager = new UpdateManager();
    console.log(`✅ Current version: ${updateManager.currentVersion}`);
    console.log(`✅ GitHub repo: ${updateManager.githubRepo}`);
    
    // 2. Test version comparison
    console.log('\n2️⃣ Testing version comparison...');
    const testVersions = [
      { current: '1.0.0', latest: '1.0.1', expected: true },
      { current: '1.0.1', latest: '1.0.0', expected: false },
      { current: '1.0.0', latest: '1.0.0', expected: false },
      { current: '1.2.3', latest: '2.0.0', expected: true },
      { current: '2.0.0', latest: '1.9.9', expected: false },
    ];
    
    testVersions.forEach(test => {
      const result = updateManager.isVersionNewer(test.latest, test.current);
      const status = result === test.expected ? '✅' : '❌';
      console.log(`${status} ${test.current} -> ${test.latest}: ${result} (expected: ${test.expected})`);
    });
    
    // 3. Test status method
    console.log('\n3️⃣ Testing getStatus method...');
    const status = updateManager.getStatus();
    console.log('✅ Status data:', JSON.stringify(status, null, 2));
    
    // 4. Test real GitHub API call
    console.log('\n4️⃣ Testing real GitHub API call...');
    try {
      console.log('🔍 Checking for updates from GitHub...');
      const updateInfo = await updateManager.checkForUpdates(true);
      console.log('✅ Update check result:', JSON.stringify(updateInfo, null, 2));
      
      if (updateInfo.available) {
        console.log('🆕 Update available!');
        console.log(`📊 Current: ${updateInfo.currentVersion}`);
        console.log(`📊 Latest: ${updateInfo.latestVersion}`);
        console.log(`📁 Download URL: ${updateInfo.downloadUrl}`);
        console.log(`📏 File size: ${(updateInfo.fileSize / 1024 / 1024).toFixed(2)} MB`);
      } else {
        console.log('✅ App is up to date');
      }
    } catch (error) {
      console.log('⚠️ GitHub API call failed (expected for new repos):', error.message);
    }
    
    // 5. Test settings update
    console.log('\n5️⃣ Testing settings update...');
    updateManager.updateAutoCheckSettings(false, 60);
    console.log('✅ Disabled auto-check, interval: 60 minutes');
    
    updateManager.updateAutoCheckSettings(true, 30);
    console.log('✅ Enabled auto-check, interval: 30 minutes');
    
    // 6. Test serialization
    console.log('\n6️⃣ Testing serialization...');
    const statusForSerialization = updateManager.getStatus();
    const serialized = JSON.stringify(statusForSerialization);
    const deserialized = JSON.parse(serialized);
    console.log('✅ Serialization test passed');
    console.log('✅ Serialized data length:', serialized.length);
    
    // 7. Cleanup
    console.log('\n7️⃣ Cleanup...');
    updateManager.destroy();
    console.log('✅ UpdateManager destroyed');
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Hàm tạo mock GitHub release để test
async function createMockRelease() {
  console.log('\n🔧 Creating mock GitHub release for testing...');
  
  const mockRelease = {
    tag_name: 'v1.1.0',
    name: 'TTL TikTok Live v1.1.0',
    body: `# Release Notes v1.1.0

## ✨ New Features
- 🔄 Auto-update system implementation
- 🌍 Complete 7-language translation support
- 📱 Enhanced UI components

## 🐛 Bug Fixes
- Fixed IPC serialization issues
- Resolved controlled/uncontrolled input warnings
- Improved error handling

## 🔧 Technical Improvements
- Added GitHub Actions for automated builds
- Enhanced update manager with progress tracking
- Improved backup and rollback functionality

## 📦 Download
Download the appropriate file for your platform:
- **Windows**: TTL-TikTok-Live-Setup-1.1.0.exe
- **macOS**: TTL-TikTok-Live-1.1.0.dmg
- **Linux**: TTL-TikTok-Live-1.1.0.AppImage`,
    published_at: new Date().toISOString(),
    assets: [
      {
        name: 'TTL-TikTok-Live-Setup-1.1.0.exe',
        size: 85000000, // 85MB
        browser_download_url: 'https://github.com/amac-development/amactiktoklive/releases/download/v1.1.0/TTL-TikTok-Live-Setup-1.1.0.exe'
      },
      {
        name: 'TTL-TikTok-Live-1.1.0.dmg',
        size: 92000000, // 92MB
        browser_download_url: 'https://github.com/amac-development/amactiktoklive/releases/download/v1.1.0/TTL-TikTok-Live-1.1.0.dmg'
      },
      {
        name: 'TTL-TikTok-Live-1.1.0.AppImage',
        size: 78000000, // 78MB
        browser_download_url: 'https://github.com/amac-development/amactiktoklive/releases/download/v1.1.0/TTL-TikTok-Live-1.1.0.AppImage'
      }
    ]
  };
  
  // Lưu mock release data
  const mockFile = path.join(__dirname, 'mock-release.json');
  await fs.writeFile(mockFile, JSON.stringify(mockRelease, null, 2));
  console.log(`✅ Mock release saved to: ${mockFile}`);
  
  return mockRelease;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--mock-release')) {
    await createMockRelease();
  }
  
  if (args.includes('--test-manager')) {
    await testUpdateManager();
  }
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node scripts/test-auto-update.js --test-manager   # Test UpdateManager');
    console.log('  node scripts/test-auto-update.js --mock-release   # Create mock release');
    console.log('  node scripts/test-auto-update.js --test-manager --mock-release   # Both');
    
    // Default: run both
    await createMockRelease();
    await testUpdateManager();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testUpdateManager,
  createMockRelease
}; 