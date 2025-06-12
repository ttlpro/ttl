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

async function testGitAuthentication() {
  try {
    log('🔍 Testing Git Authentication to ttlpro/ttl', 'info');
    
    // Clean up any existing remote
    try {
      execCommand('git remote remove ttl-test', 'Removing existing test remote');
    } catch {
      // Ignore if doesn't exist
    }
    
    // Add test remote with token
    const remoteUrl = `https://${GITHUB_TOKEN}@github.com/${GITHUB_OWNER}/${GITHUB_REPO}.git`;
    execCommand(`git remote add ttl-test ${remoteUrl}`, 'Adding test remote with token');
    
    // Test fetch to verify read access
    execCommand('git fetch ttl-test --dry-run', 'Testing read access (fetch)');
    
    // Test if we can see the repository structure
    execCommand('git ls-remote ttl-test', 'Listing remote branches');
    
    // Clean up
    execCommand('git remote remove ttl-test', 'Cleaning up test remote');
    
    log('🎉 Git Authentication Test PASSED!', 'success');
    log('✅ Token có quyền read repository', 'success');
    log('✅ Có thể kết nối được với ttlpro/ttl', 'success');
    log('🚀 Sẵn sàng chạy production release!', 'success');
    
  } catch (error) {
    log(`💥 Git Authentication Test FAILED: ${error.message}`, 'error');
    log('❌ Cần kiểm tra lại GitHub token hoặc permissions', 'error');
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testGitAuthentication();
} 