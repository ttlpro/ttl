#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
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

async function testCleanPush() {
  const tempDir = path.join(__dirname, '..', 'temp-test-push');
  const originalDir = process.cwd();
  
  try {
    log('🧪 Testing Clean Push Approach (clone + copy)', 'info');
    
    if (!GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN environment variable not set');
    }
    
    // Clean temp directory if exists
    if (fs.existsSync(tempDir)) {
      execCommand(`rm -rf ${tempDir}`, 'Cleaning temp directory');
    }
    
    // Clone release repo fresh
    const releaseUrl = `https://${GITHUB_TOKEN}@github.com/${GITHUB_OWNER}/${GITHUB_REPO}.git`;
    execCommand(`git clone ${releaseUrl} ${tempDir}`, 'Cloning release repository');
    
    // Create a test file in current directory
    const testFile = 'test-clean-push.txt';
    fs.writeFileSync(testFile, `Clean push test at ${new Date().toISOString()}\nThis file was created to test clean push without token history.`);
    
    // Copy this test file to release repo
    execCommand(`cp ${testFile} ${tempDir}/`, 'Copying test file to release repo');
    
    // Navigate to temp directory
    process.chdir(tempDir);
    
    // Check what files are in release repo
    execCommand('ls -la', 'Listing files in release repo');
    
    // Add and commit test file
    execCommand(`git add ${testFile}`, 'Staging test file in release repo');
    execCommand(`git commit -m "Test clean push - will be deleted"`, 'Committing test file');
    
    // Try to push to test branch
    const testBranch = `test-clean-push-${Date.now()}`;
    execCommand(`git checkout -b ${testBranch}`, 'Creating test branch');
    execCommand(`git push origin ${testBranch}`, 'Pushing test branch');
    
    // Clean up remote branch
    execCommand(`git push origin --delete ${testBranch}`, 'Deleting remote test branch');
    
    // Return to original directory
    process.chdir(originalDir);
    
    // Clean up local files
    fs.unlinkSync(testFile);
    execCommand(`rm -rf ${tempDir}`, 'Cleaning up temp directory');
    
    log('🎉 Clean Push Test PASSED!', 'success');
    log('✅ Có thể push clean code mà không có token history', 'success');
    log('✅ Approach clone + copy hoạt động tốt', 'success');
    log('🚀 SẴN SÀNG CHẠY PRODUCTION RELEASE!', 'success');
    
  } catch (error) {
    log(`💥 Clean Push Test FAILED: ${error.message}`, 'error');
    
    // Clean up on error
    try {
      process.chdir(originalDir);
      const testFile = 'test-clean-push.txt';
      if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
      if (fs.existsSync(tempDir)) {
        execCommand(`rm -rf ${tempDir}`, 'Cleaning up temp directory after error');
      }
    } catch {
      // Ignore cleanup errors
    }
    
    log('❌ Clean push approach failed', 'error');
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testCleanPush();
} 