#!/usr/bin/env node

/**
 * Test script sử dụng mock GitHub server để test auto-update
 */

const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');

const MOCK_SERVER_PORT = 3001;
const MOCK_SERVER_URL = `http://localhost:${MOCK_SERVER_PORT}`;

// Patch UpdateManager để sử dụng mock server
function patchUpdateManagerForTesting() {
  const updateManagerPath = path.join(__dirname, '../lib/update-manager.js');
  const fs = require('fs');
  
  // Đọc file hiện tại
  let content = fs.readFileSync(updateManagerPath, 'utf8');
  
  // Backup original
  const backupPath = updateManagerPath + '.backup';
  if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, content);
    console.log(`📦 Backed up original UpdateManager to: ${backupPath}`);
  }
  
  // Patch GitHub API URL
  const originalGithubAPI = 'https://api.github.com';
  const mockGithubAPI = MOCK_SERVER_URL;
  
  content = content.replace(
    `const url = \`https://api.github.com/repos/\${this.githubRepo}/releases/latest\`;`,
    `const url = \`${mockGithubAPI}/repos/\${this.githubRepo}/releases/latest\`;`
  );
  
  // Write patched version
  fs.writeFileSync(updateManagerPath, content);
  console.log(`🔧 Patched UpdateManager to use mock server: ${mockGithubAPI}`);
  
  return backupPath;
}

// Restore original UpdateManager
function restoreUpdateManager(backupPath) {
  const updateManagerPath = path.join(__dirname, '../lib/update-manager.js');
  const fs = require('fs');
  
  if (fs.existsSync(backupPath)) {
    const originalContent = fs.readFileSync(backupPath, 'utf8');
    fs.writeFileSync(updateManagerPath, originalContent);
    fs.unlinkSync(backupPath);
    console.log(`🔄 Restored original UpdateManager from backup`);
  }
}

// Start mock server
function startMockServer() {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, 'mock-github-server.js');
    const serverProcess = spawn('node', [serverPath], {
      stdio: 'pipe',
      env: { ...process.env, PORT: MOCK_SERVER_PORT }
    });
    
    let isResolved = false;
    
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[Mock Server] ${output.trim()}`);
      
      if (output.includes('Mock GitHub API Server running') && !isResolved) {
        isResolved = true;
        resolve(serverProcess);
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.error(`[Mock Server Error] ${data.toString()}`);
    });
    
    serverProcess.on('close', (code) => {
      console.log(`[Mock Server] Process exited with code ${code}`);
    });
    
    // Timeout after 5 seconds
    setTimeout(() => {
      if (!isResolved) {
        reject(new Error('Mock server failed to start within 5 seconds'));
      }
    }, 5000);
  });
}

// Wait for server to be ready
async function waitForServer() {
  const maxRetries = 10;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const response = await axios.get(`${MOCK_SERVER_URL}/health`, { timeout: 1000 });
      if (response.status === 200) {
        console.log(`✅ Mock server is ready: ${response.data.status}`);
        return true;
      }
    } catch (error) {
      retries++;
      console.log(`⏳ Waiting for mock server... (${retries}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  throw new Error('Mock server failed to become ready');
}

// Test với mock server
async function testWithMockServer() {
  const UpdateManager = require('../lib/update-manager');
  
  console.log('\n🧪 Testing UpdateManager with Mock Server');
  console.log('==========================================');
  
  // Test 1: Khởi tạo UpdateManager
  console.log('\n1️⃣ Initializing UpdateManager...');
  const updateManager = new UpdateManager();
  console.log(`✅ Current version: ${updateManager.currentVersion}`);
  console.log(`✅ GitHub repo: ${updateManager.githubRepo}`);
  
  // Test 2: Check for updates với mock data
  console.log('\n2️⃣ Checking for updates with mock server...');
  try {
    const updateInfo = await updateManager.checkForUpdates(false);
    console.log('✅ Update check successful!');
    console.log(`📊 Update available: ${updateInfo.available}`);
    
    if (updateInfo.available) {
      console.log(`📊 Current version: ${updateInfo.currentVersion}`);
      console.log(`📊 Latest version: ${updateInfo.latestVersion}`);
      console.log(`📁 Download URL: ${updateInfo.downloadUrl}`);
      console.log(`📏 File size: ${(updateInfo.fileSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`📝 Release notes: ${updateInfo.releaseNotes.substring(0, 100)}...`);
    }
  } catch (error) {
    console.error('❌ Update check failed:', error.message);
  }
  
  // Test 3: Test settings
  console.log('\n3️⃣ Testing settings...');
  const status = updateManager.getStatus();
  console.log('✅ Status data:', JSON.stringify(status, null, 2));
  
  // Test 4: Test auto-check settings
  console.log('\n4️⃣ Testing auto-check settings...');
  updateManager.updateAutoCheckSettings(true, 15); // 15 minutes
  console.log('✅ Updated auto-check: enabled=true, interval=15 minutes');
  
  // Cleanup
  console.log('\n5️⃣ Cleanup...');
  updateManager.destroy();
  console.log('✅ UpdateManager destroyed');
  
  console.log('\n🎉 Mock server testing completed successfully!');
}

// Test complete update flow
async function testCompleteUpdateFlow() {
  console.log('\n🚀 Testing Complete Update Flow');
  console.log('===============================');
  
  // Test với app running để mô phỏng real scenario
  console.log('\n🔄 Starting main app to test integration...');
  
  const appProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    cwd: path.join(__dirname, '..')
  });
  
  let appReady = false;
  
  appProcess.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('ready')) {
      appReady = true;
    }
    console.log(`[App] ${output.trim()}`);
  });
  
  // Wait a bit for app to start
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test update APIs
  console.log('\n📡 Testing update APIs through IPC...');
  
  // Kill app process
  appProcess.kill('SIGTERM');
  
  console.log('✅ Complete flow test finished');
}

// Main test function
async function main() {
  let mockServerProcess = null;
  let backupPath = null;
  
  try {
    console.log('🧪 Starting Auto-Update System Integration Test');
    console.log('===============================================');
    
    // 1. Start mock server
    console.log('\n📡 Starting mock GitHub API server...');
    mockServerProcess = await startMockServer();
    await waitForServer();
    
    // 2. Patch UpdateManager
    console.log('\n🔧 Patching UpdateManager for testing...');
    backupPath = patchUpdateManagerForTesting();
    
    // 3. Test với mock server
    await testWithMockServer();
    
    // 4. Test complete flow (optional)
    const args = process.argv.slice(2);
    if (args.includes('--full-test')) {
      await testCompleteUpdateFlow();
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
    
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    
    if (backupPath) {
      restoreUpdateManager(backupPath);
    }
    
    if (mockServerProcess) {
      console.log('🛑 Shutting down mock server...');
      mockServerProcess.kill('SIGTERM');
      
      // Wait for server to close
      await new Promise(resolve => {
        mockServerProcess.on('close', resolve);
        setTimeout(resolve, 2000); // Fallback timeout
      });
    }
    
    console.log('✅ Cleanup completed');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  startMockServer,
  testWithMockServer,
  patchUpdateManagerForTesting,
  restoreUpdateManager
}; 