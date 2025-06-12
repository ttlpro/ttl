#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = 'ttlpro';
const GITHUB_REPO = 'ttl';

// Development repo: vanthinh129/amactiktoklive (current)
// Release repo: ttlpro/ttl (target for releases)
// Script will automatically push code from dev repo to release repo
const TEST_MODE = process.argv.includes('--test');

// GitHub API client (will be initialized dynamically)
let octokit;

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📋',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    build: '🔨',
    upload: '📤'
  }[type] || '📋';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function execCommand(command, description) {
  log(`Executing: ${description}`, 'info');
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: TEST_MODE ? 'pipe' : 'inherit',
      cwd: process.cwd()
    });
    log(`✅ ${description} completed`, 'success');
    return result;
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, 'error');
    throw error;
  }
}

// Version management functions
function getCurrentVersion() {
  try {
    // Try to get version from git tags
    const latestTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
    const cleanTag = latestTag.replace(/^v/, ''); // Remove 'v' prefix if exists
    
    // Validate that it's a proper semver format (x.y.z)
    const semverRegex = /^\d+\.\d+\.\d+$/;
    if (semverRegex.test(cleanTag)) {
      return cleanTag;
    } else {
      throw new Error(`Invalid semver format: ${cleanTag}`);
    }
  } catch (error) {
    // Fallback to package.json version
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return packageJson.version || '1.0.0';
  }
}

function parseVersion(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return { major, minor, patch };
}

function incrementVersion(version) {
  const { major, minor, patch } = parseVersion(version);
  
  if (patch < 9) {
    return `${major}.${minor}.${patch + 1}`;
  } else if (minor < 30) {
    return `${major}.${minor + 1}.0`;
  } else {
    return `${major + 1}.0.0`;
  }
}

function updatePackageVersion(newVersion) {
  log(`Updating package.json version to ${newVersion}`, 'info');
  
  // Update package.json
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  
  // Update app/package.json if exists
  const appPackagePath = path.join(process.cwd(), 'app', 'package.json');
  if (fs.existsSync(appPackagePath)) {
    const appPackageJson = JSON.parse(fs.readFileSync(appPackagePath, 'utf8'));
    appPackageJson.version = newVersion;
    fs.writeFileSync(appPackagePath, JSON.stringify(appPackageJson, null, 2) + '\n');
  }
  
  log(`Version updated to ${newVersion}`, 'success');
}

// Release notes generation
function generateReleaseNotes(previousVersion, newVersion) {
  log('Generating release notes...', 'info');
  
  try {
    // Get commits since last tag
    const gitLog = execSync(
      `git log v${previousVersion}..HEAD --pretty=format:"- %s (%h)" --no-merges`,
      { encoding: 'utf8' }
    ).trim();
    
    const commits = gitLog ? gitLog.split('\n') : ['- Initial release'];
    
    const releaseNotes = `# Release ${newVersion}

## 🚀 What's New

${commits.join('\n')}

## 📦 Assets

This release includes installers for:
- 🍎 **macOS**: \`TTL-${newVersion}.dmg\` (Universal Binary - Intel & Apple Silicon)
- 🍎 **macOS M-series**: \`TTL-${newVersion}-arm64.dmg\` (Apple Silicon optimized)
- 🪟 **Windows 64-bit**: \`TTL-Setup-${newVersion}.exe\`
- 🪟 **Windows 32-bit**: \`TTL-Setup-${newVersion}-ia32.exe\`
- 🐧 **Linux**: \`TTL-${newVersion}.AppImage\`

## 🔧 Installation

### macOS
1. Download the appropriate DMG file for your Mac
2. Open the DMG and drag TTL to Applications folder
3. Right-click and "Open" if prompted by Gatekeeper

### Windows
1. Download the EXE installer
2. Run as administrator if prompted
3. Follow the installation wizard

### Linux
1. Download the AppImage file
2. Make it executable: \`chmod +x TTL-${newVersion}.AppImage\`
3. Run directly or integrate with your desktop environment

## 🆕 Features & Improvements

✅ Full update system integration
✅ Multi-language support (7 languages)
✅ Enhanced UI/UX experience
✅ Improved stability and performance

---

**Full Changelog**: https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/compare/v${previousVersion}...v${newVersion}
`;

    return releaseNotes;
  } catch (error) {
    log(`Warning: Could not generate detailed release notes: ${error.message}`, 'warning');
    return `# Release ${newVersion}\n\nNew version with improvements and bug fixes.`;
  }
}

// Build functions
async function buildApplication(version) {
  log(`Starting build process for version ${version}`, 'build');
  
  if (TEST_MODE) {
    log('TEST MODE: Skipping actual build', 'warning');
    return [];
  }
  
  // Clean previous builds
  execCommand('rm -rf dist/', 'Cleaning previous builds');
  
  // Install dependencies
  execCommand('npm ci', 'Installing dependencies');
  
  // Build Next.js
  execCommand('npm run build', 'Building Next.js application');
  
  // Build Electron for all platforms
  const platforms = [
    'mac --universal', // macOS Universal (Intel + Apple Silicon)
    'mac --arm64',     // macOS Apple Silicon only
    'win --x64',       // Windows 64-bit
    'win --ia32',      // Windows 32-bit
    'linux --x64'      // Linux 64-bit
  ];
  
  const builtFiles = [];
  
  for (const platform of platforms) {
    try {
      log(`Building for ${platform}...`, 'build');
      execCommand(`npx electron-builder --${platform} --publish never`, `Building ${platform}`);
      
      // Collect built files
      const distDir = path.join(process.cwd(), 'dist');
      if (fs.existsSync(distDir)) {
        const files = fs.readdirSync(distDir);
        files.forEach(file => {
          if (file.includes(version) && (file.endsWith('.dmg') || file.endsWith('.exe') || file.endsWith('.AppImage'))) {
            builtFiles.push(path.join(distDir, file));
          }
        });
      }
    } catch (error) {
      log(`Failed to build ${platform}: ${error.message}`, 'error');
      // Continue with other platforms
    }
  }
  
  log(`Build completed. Generated ${builtFiles.length} files:`, 'success');
  builtFiles.forEach(file => log(`  📦 ${path.basename(file)}`, 'info'));
  
  return builtFiles;
}

// GitHub functions
async function createGitTag(version) {
  log(`Creating Git tag v${version}`, 'info');
  
  if (TEST_MODE) {
    log('TEST MODE: Skipping Git tag creation', 'warning');
    return;
  }
  
  // First commit to current repo (development)
  execCommand(`git add .`, 'Staging changes');
  execCommand(`git commit -m "Release v${version}"`, 'Committing version bump');
  execCommand(`git tag v${version}`, 'Creating Git tag');
  
  // Push to current repo
  execCommand(`git push origin sqlite-migration`, 'Pushing to development repo');
  
  // For release repo, use clean approach to avoid token in history
  const tempDir = path.join(__dirname, '..', 'temp-release');
  
  try {
    // Clean temp directory if exists
    if (fs.existsSync(tempDir)) {
      execCommand(`rm -rf ${tempDir}`, 'Cleaning temp directory');
    }
    
    // Clone release repo fresh
    const releaseUrl = `https://${GITHUB_TOKEN}@github.com/${GITHUB_OWNER}/${GITHUB_REPO}.git`;
    execCommand(`git clone ${releaseUrl} ${tempDir}`, 'Cloning release repository');
    
    // Copy current project files to release repo (excluding git history)
    const currentDir = process.cwd();
    const excludePatterns = ['.git', 'node_modules', 'dist', 'temp-release', '.DS_Store'];
    
    // Create rsync exclude pattern
    const excludeArgs = excludePatterns.map(pattern => `--exclude=${pattern}`).join(' ');
    execCommand(`rsync -av ${excludeArgs} ${currentDir}/ ${tempDir}/`, 'Copying project files to release repo');
    
    // Navigate to temp directory and commit
    process.chdir(tempDir);
    
    execCommand(`git add .`, 'Staging all changes in release repo');
    execCommand(`git commit -m "Release v${version}" --allow-empty`, 'Committing to release repo');
    execCommand(`git tag v${version}`, 'Creating tag in release repo');
    execCommand(`git push origin main`, 'Pushing to release repo');
    execCommand(`git push origin v${version}`, 'Pushing tag to release repo');
    
    // Return to original directory
    process.chdir(currentDir);
    
    // Clean up temp directory
    execCommand(`rm -rf ${tempDir}`, 'Cleaning up temp directory');
    
    log(`✅ Successfully pushed v${version} to release repo without token history`, 'success');
    
  } catch (error) {
    // Ensure we're back in the original directory
    process.chdir(process.cwd());
    
    // Clean up on error
    if (fs.existsSync(tempDir)) {
      try {
        execCommand(`rm -rf ${tempDir}`, 'Cleaning up temp directory after error');
      } catch {
        // Ignore cleanup errors
      }
    }
    
    log(`Failed to push to release repo: ${error.message}`, 'error');
    throw error;
  }
}

async function createGitHubRelease(version, releaseNotes, assetPaths) {
  log(`Creating GitHub release v${version}`, 'upload');
  
  if (TEST_MODE) {
    log('TEST MODE: Would create GitHub release with:', 'warning');
    log(`Version: ${version}`, 'info');
    log(`Assets: ${assetPaths.length} files`, 'info');
    log(`Release notes preview:\n${releaseNotes.substring(0, 200)}...`, 'info');
    return;
  }
  
  // Initialize Octokit dynamically
  if (!octokit) {
    const { Octokit } = await import('@octokit/rest');
    octokit = new Octokit({
      auth: GITHUB_TOKEN,
    });
  }
  
  try {
    // Create the release
    const release = await octokit.rest.repos.createRelease({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      tag_name: `v${version}`,
      name: `TTL v${version}`,
      body: releaseNotes,
      draft: false,
      prerelease: false,
    });
    
    log(`GitHub release created: ${release.data.html_url}`, 'success');
    
    // Upload assets
    for (const assetPath of assetPaths) {
      if (fs.existsSync(assetPath)) {
        log(`Uploading asset: ${path.basename(assetPath)}`, 'upload');
        
        const assetData = fs.readFileSync(assetPath);
        await octokit.rest.repos.uploadReleaseAsset({
          owner: GITHUB_OWNER,
          repo: GITHUB_REPO,
          release_id: release.data.id,
          name: path.basename(assetPath),
          data: assetData,
        });
        
        log(`✅ Uploaded: ${path.basename(assetPath)}`, 'success');
      }
    }
    
    log(`🎉 Release v${version} published successfully!`, 'success');
    log(`🔗 Release URL: ${release.data.html_url}`, 'info');
    
  } catch (error) {
    log(`Failed to create GitHub release: ${error.message}`, 'error');
    throw error;
  }
}

// Pre-flight checks
function performPreflightChecks() {
  log('Performing pre-flight checks...', 'info');
  
  // Check if we're in a git repository
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'pipe' });
  } catch {
    throw new Error('Not in a Git repository');
  }
  
  // Check if working directory is clean
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim() && !TEST_MODE) {
      throw new Error('Working directory is not clean. Please commit or stash changes first.');
    }
  } catch (error) {
    if (!TEST_MODE) throw error;
  }
  
  // Check if package.json exists
  if (!fs.existsSync('package.json')) {
    throw new Error('package.json not found');
  }
  
  // Check GitHub token
  if (!GITHUB_TOKEN) {
    throw new Error('GitHub token not configured');
  }
  
  log('✅ Pre-flight checks passed', 'success');
}

// Main function
async function main() {
  try {
    log('🚀 Starting TTL Release Automation Script', 'info');
    log(`Mode: ${TEST_MODE ? 'TEST' : 'PRODUCTION'}`, TEST_MODE ? 'warning' : 'info');
    
    // Pre-flight checks
    performPreflightChecks();
    
    // Get current version and calculate next version
    const currentVersion = getCurrentVersion();
    const newVersion = incrementVersion(currentVersion);
    
    log(`Current version: ${currentVersion}`, 'info');
    log(`New version: ${newVersion}`, 'info');
    
    // Generate release notes
    const releaseNotes = generateReleaseNotes(currentVersion, newVersion);
    
    // Update version in package files
    updatePackageVersion(newVersion);
    
    // Build application
    const assetPaths = await buildApplication(newVersion);
    
    // Create Git tag
    await createGitTag(newVersion);
    
    // Create GitHub release
    await createGitHubRelease(newVersion, releaseNotes, assetPaths);
    
    log(`🎉 Release automation completed successfully!`, 'success');
    log(`📦 Version ${newVersion} has been built and released`, 'success');
    
  } catch (error) {
    log(`💥 Release automation failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  getCurrentVersion,
  incrementVersion,
  generateReleaseNotes,
  buildApplication,
  createGitHubRelease
}; 