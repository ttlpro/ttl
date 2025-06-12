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
  log(`Executing: ${description}`, 'info');
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

async function createVerificationPush() {
  const tempDir = path.join(__dirname, '..', 'temp-verify-push');
  const originalDir = process.cwd();
  const testBranch = `verification-test-${Date.now()}`;
  
  try {
    log('🔍 Creating Verification Push to ttlpro/ttl', 'info');
    log(`Branch name: ${testBranch}`, 'info');
    
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
    
    // Navigate to temp directory
    process.chdir(tempDir);
    
    // Create verification file with current project info
    const verificationFile = 'VERIFICATION-TEST.md';
    const verificationContent = `# Release Automation Verification Test

## Test Information
- **Date**: ${new Date().toISOString()}
- **Branch**: ${testBranch}
- **Purpose**: Verify that release automation can successfully push to ttlpro/ttl

## Project Details
- **Development Repo**: vanthinh129/amactiktoklive
- **Release Repo**: ttlpro/ttl
- **Current Version**: 1.0.1

## Test Results
✅ Successfully cloned release repository
✅ Successfully created and pushed branch without token history
✅ GitHub Push Protection did not block this push

## Next Steps
If you can see this file on GitHub at:
https://github.com/ttlpro/ttl/tree/${testBranch}

Then the release automation is ready for production use!

---
*This is a test file and can be safely deleted.*
`;

    fs.writeFileSync(verificationFile, verificationContent);
    
    // Add and commit verification file
    execCommand(`git add ${verificationFile}`, 'Staging verification file');
    execCommand(`git commit -m "Add verification test file - can be deleted"`, 'Committing verification file');
    
    // Create and push test branch (DO NOT DELETE)
    execCommand(`git checkout -b ${testBranch}`, 'Creating verification branch');
    execCommand(`git push origin ${testBranch}`, 'Pushing verification branch');
    
    // Return to original directory
    process.chdir(originalDir);
    
    // Clean up temp directory
    execCommand(`rm -rf ${tempDir}`, 'Cleaning up temp directory');
    
    log('🎉 Verification Push SUCCESSFUL!', 'success');
    log('', 'info');
    log('📋 VERIFICATION INSTRUCTIONS:', 'info');
    log('', 'info');
    log(`1. Open: https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/tree/${testBranch}`, 'info');
    log(`2. You should see file: VERIFICATION-TEST.md`, 'info');
    log(`3. If you can see the file, release automation is working!`, 'info');
    log('', 'info');
    log('🗑️ TO CLEAN UP AFTER VERIFICATION:', 'warning');
    log(`   git push origin --delete ${testBranch}`, 'warning');
    log('', 'info');
    log('🚀 READY FOR PRODUCTION RELEASE!', 'success');
    
  } catch (error) {
    log(`💥 Verification Push FAILED: ${error.message}`, 'error');
    
    // Clean up on error
    try {
      process.chdir(originalDir);
      if (fs.existsSync(tempDir)) {
        execCommand(`rm -rf ${tempDir}`, 'Cleaning up temp directory after error');
      }
    } catch {
      // Ignore cleanup errors
    }
    
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  createVerificationPush();
} 