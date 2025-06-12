#!/usr/bin/env node

/**
 * Test UpdateManager trực tiếp với patched version
 */

const axios = require('axios');

async function testUpdateManagerDirect() {
  console.log('🧪 Testing UpdateManager Direct with Patched Version');
  console.log('===================================================');
  
  // Check mock server
  try {
    console.log('\n1️⃣ Checking mock server...');
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log(`✅ Mock server status: ${healthResponse.data.status}`);
    console.log(`📊 Available releases: ${healthResponse.data.mockReleases.join(', ')}`);
  } catch (error) {
    console.error('❌ Mock server not available:', error.message);
    console.log('💡 Please start it with: node scripts/mock-github-server.js');
    return;
  }
  
  // Test UpdateManager
  try {
    console.log('\n2️⃣ Testing UpdateManager...');
    
    // Clear require cache to ensure fresh load
    delete require.cache[require.resolve('../lib/update-manager.js')];
    const UpdateManager = require('../lib/update-manager.js');
    
    const updateManager = new UpdateManager();
    console.log(`📊 Current version: ${updateManager.currentVersion}`);
    console.log(`📊 GitHub repo: ${updateManager.githubRepo}`);
    
    // Test checkForUpdates
    console.log('\n3️⃣ Checking for updates...');
    const updateInfo = await updateManager.checkForUpdates(false);
    
    console.log('✅ Update check completed!');
    console.log(`📊 Update available: ${updateInfo.available}`);
    
    if (updateInfo.available) {
      console.log(`🆕 Update found!`);
      console.log(`📊 Current: ${updateInfo.currentVersion}`);
      console.log(`📊 Latest: ${updateInfo.latestVersion}`);
      console.log(`📁 Download URL: ${updateInfo.downloadUrl}`);
      console.log(`📏 File size: ${(updateInfo.fileSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`📅 Published: ${new Date(updateInfo.publishedAt).toLocaleString()}`);
      console.log(`📝 Release notes preview: ${updateInfo.releaseNotes.substring(0, 200)}...`);
    } else {
      console.log('ℹ️  No update available');
    }
    
    // Test getStatus
    console.log('\n4️⃣ Testing getStatus...');
    const status = updateManager.getStatus();
    console.log('📊 Status:', JSON.stringify(status, null, 2));
    
    // Cleanup
    updateManager.destroy();
    console.log('\n✅ UpdateManager testing completed successfully!');
    
  } catch (error) {
    console.error('\n❌ UpdateManager test failed:', error);
    console.log('\nStack trace:', error.stack);
  }
}

if (require.main === module) {
  testUpdateManagerDirect().catch(console.error);
}

module.exports = { testUpdateManagerDirect }; 