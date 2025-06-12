#!/usr/bin/env node

/**
 * Test auto-update với live app
 * Patch UpdateManager để sử dụng mock server và test UI
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const MOCK_SERVER_URL = 'http://localhost:3001';

async function waitForMockServer() {
  console.log('⏳ Waiting for mock server...');
  let retries = 0;
  const maxRetries = 20;
  
  while (retries < maxRetries) {
    try {
      const response = await axios.get(`${MOCK_SERVER_URL}/health`, { timeout: 1000 });
      if (response.status === 200) {
        console.log(`✅ Mock server is ready: ${response.data.status}`);
        console.log(`📊 Available releases: ${response.data.mockReleases.join(', ')}`);
        return true;
      }
    } catch (error) {
      retries++;
      console.log(`⏳ Waiting for mock server... (${retries}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error('Mock server not available. Please start it with: node scripts/mock-github-server.js');
}

function patchUpdateManagerForLive() {
  const updateManagerPath = path.join(__dirname, '../lib/update-manager.js');
  
  // Đọc file hiện tại
  let content = fs.readFileSync(updateManagerPath, 'utf8');
  
  // Backup nếu chưa có
  const backupPath = updateManagerPath + '.live-backup';
  if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, content);
    console.log(`📦 Backed up UpdateManager to: ${backupPath}`);
  }
  
  // Check if already patched
  if (content.includes('localhost:3001')) {
    console.log('🔧 UpdateManager already patched for mock server');
    return backupPath;
  }
  
  // Patch GitHub API URL
  content = content.replace(
    /const url = `https:\/\/api\.github\.com\/repos\/\${this\.githubRepo}\/releases\/latest`;/g,
    `const url = \`${MOCK_SERVER_URL}/repos/\${this.githubRepo}/releases/latest\`;`
  );
  
  // Write patched version
  fs.writeFileSync(updateManagerPath, content);
  console.log(`🔧 Patched UpdateManager to use mock server: ${MOCK_SERVER_URL}`);
  
  return backupPath;
}

function restoreUpdateManager(backupPath) {
  const updateManagerPath = path.join(__dirname, '../lib/update-manager.js');
  
  if (fs.existsSync(backupPath)) {
    const originalContent = fs.readFileSync(backupPath, 'utf8');
    fs.writeFileSync(updateManagerPath, originalContent);
    fs.unlinkSync(backupPath);
    console.log(`🔄 Restored original UpdateManager`);
  }
}

async function testLiveApp() {
  try {
    console.log('🚀 Testing Auto-Update with Live App');
    console.log('====================================');
    
    // 1. Wait for mock server
    await waitForMockServer();
    
    // 2. Patch UpdateManager
    console.log('\n🔧 Patching UpdateManager for live testing...');
    const backupPath = patchUpdateManagerForLive();
    
    console.log('\n📱 Live App Testing Instructions:');
    console.log('1. App should be running on http://localhost:8888');
    console.log('2. Go to Settings page');
    console.log('3. Look for Update Manager section');
    console.log('4. Click "Check for Updates"');
    console.log('5. Should show update available: v1.0.0 → v1.0.1');
    console.log('6. You can see release notes and download options');
    
    console.log('\n🧪 Mock Release Data:');
    try {
      const response = await axios.get(`${MOCK_SERVER_URL}/repos/amac-development/amactiktoklive/releases/latest`);
      const release = response.data;
      console.log(`📦 Version: ${release.tag_name}`);
      console.log(`📝 Name: ${release.name}`);
      console.log(`📊 Assets: ${release.assets.length}`);
      console.log(`📅 Published: ${new Date(release.published_at).toLocaleString()}`);
    } catch (error) {
      console.error('❌ Failed to fetch release data:', error.message);
    }
    
    console.log('\n⏱️  Testing will run for 60 seconds...');
    console.log('💡 Press Ctrl+C to stop and restore original UpdateManager');
    
    // Wait for testing
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    // Cleanup
    console.log('\n🧹 Auto-cleanup after 60 seconds...');
    restoreUpdateManager(backupPath);
    console.log('✅ Testing completed and files restored');
    
  } catch (error) {
    console.error('\n❌ Live test failed:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Interrupted by user');
  
  // Try to restore if backup exists
  const backupPath = path.join(__dirname, '../lib/update-manager.js.live-backup');
  if (fs.existsSync(backupPath)) {
    restoreUpdateManager(backupPath);
  }
  
  console.log('✅ Cleanup completed');
  process.exit(0);
});

if (require.main === module) {
  testLiveApp().catch(console.error);
}

module.exports = {
  testLiveApp,
  patchUpdateManagerForLive,
  restoreUpdateManager
}; 