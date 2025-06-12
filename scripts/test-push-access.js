#!/usr/bin/env node

const { execSync } = require('child_process');

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = 'ttlpro';
const GITHUB_REPO = 'ttl';

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📋',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  }[type] || '📋';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function execCommand(command, description) {
  log(`Testing: ${description}`, 'info');
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    log(`✅ ${description} - SUCCESS`, 'success');
    return result;
  } catch (error) {
    log(`❌ ${description} - FAILED: ${error.message}`, 'error');
    throw error;
  }
}

async function testPushAccess() {
  const testBranch = `test-push-${Date.now()}`;
  
  try {
    log('🔍 Testing Push Access to ttlpro/ttl', 'info');
    
    // Clean up any existing remote
    try {
      execCommand('git remote remove ttl-push-test', 'Removing existing test remote');
    } catch {
      // Ignore if doesn't exist
    }
    
    // Save current branch
    const currentBranch = execCommand('git branch --show-current', 'Getting current branch').trim();
    
    // Add test remote with token
    const remoteUrl = `https://${GITHUB_TOKEN}@github.com/${GITHUB_OWNER}/${GITHUB_REPO}.git`;
    execCommand(`git remote add ttl-push-test ${remoteUrl}`, 'Adding test remote with token');
    
    // Create a test branch
    execCommand(`git checkout -b ${testBranch}`, 'Creating test branch');
    
    // Create a small test file
    const fs = require('fs');
    const testFile = 'test-push-access.txt';
    fs.writeFileSync(testFile, `Push test at ${new Date().toISOString()}\n`);
    
    // Add and commit test file
    execCommand(`git add ${testFile}`, 'Adding test file');
    execCommand(`git commit -m "Test push access - will be deleted"`, 'Committing test file');
    
    // Try to push
    execCommand(`git push ttl-push-test ${testBranch}`, 'Testing push access');
    
    // Clean up remote branch
    execCommand(`git push ttl-push-test --delete ${testBranch}`, 'Deleting remote test branch');
    
    // Clean up local
    execCommand(`git checkout ${currentBranch}`, 'Switching back to original branch');
    execCommand(`git branch -D ${testBranch}`, 'Deleting local test branch');
    fs.unlinkSync(testFile);
    
    // Clean up remote
    execCommand('git remote remove ttl-push-test', 'Cleaning up test remote');
    
    log('🎉 Push Access Test PASSED!', 'success');
    log('✅ Token có quyền write repository', 'success');
    log('✅ Có thể push code lên ttlpro/ttl', 'success');
    log('🚀 SẴN SÀNG CHẠY PRODUCTION RELEASE!', 'success');
    
  } catch (error) {
    log(`💥 Push Access Test FAILED: ${error.message}`, 'error');
    
    // Clean up on error
    try {
      const currentBranch = execCommand('git branch --show-current', 'Getting current branch').trim();
      if (currentBranch === testBranch) {
        execCommand('git checkout sqlite-migration', 'Switching back to sqlite-migration');
        execCommand(`git branch -D ${testBranch}`, 'Deleting test branch');
      }
      execCommand('git remote remove ttl-push-test', 'Cleaning up test remote');
      const fs = require('fs');
      const testFile = 'test-push-access.txt';
      if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
    } catch {
      // Ignore cleanup errors
    }
    
    log('❌ Token không có quyền write hoặc repository access bị hạn chế', 'error');
    log('💡 Kiểm tra lại permissions của GitHub token', 'warning');
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testPushAccess();
} 