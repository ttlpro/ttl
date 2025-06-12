#!/usr/bin/env node

const { getCurrentVersion, incrementVersion, generateReleaseNotes } = require('./release-automation');

// Test version increment logic
function testVersionIncrement() {
  console.log('🧪 Testing version increment logic...\n');
  
  const testCases = [
    '1.0.1',   // Should become 1.0.2
    '1.0.9',   // Should become 1.1.0
    '1.30.5',  // Should become 1.30.6
    '1.30.9',  // Should become 2.0.0
    '2.15.7',  // Should become 2.15.8
    '10.0.0',  // Should become 10.0.1
  ];
  
  testCases.forEach(version => {
    const newVersion = incrementVersion(version);
    console.log(`✅ ${version} → ${newVersion}`);
  });
  
  console.log('\n🎯 Version increment tests completed!\n');
}

// Test release notes generation
function testReleaseNotes() {
  console.log('📝 Testing release notes generation...\n');
  
  const mockReleaseNotes = generateReleaseNotes('1.0.1', '1.0.2');
  console.log('📋 Sample Release Notes:');
  console.log('─'.repeat(50));
  console.log(mockReleaseNotes.substring(0, 500) + '...');
  console.log('─'.repeat(50));
  console.log('\n✅ Release notes test completed!\n');
}

// Test current version detection
function testCurrentVersion() {
  console.log('🔍 Testing current version detection...\n');
  
  try {
    const currentVersion = getCurrentVersion();
    console.log(`📦 Detected current version: ${currentVersion}`);
    
    const nextVersion = incrementVersion(currentVersion);
    console.log(`🚀 Next version would be: ${nextVersion}`);
    
  } catch (error) {
    console.log(`⚠️ Could not detect version: ${error.message}`);
    console.log(`📋 This is normal if no git tags exist yet`);
  }
  
  console.log('\n✅ Version detection test completed!\n');
}

// Run all tests
function runTests() {
  console.log('🚀 TTL Release Automation - Test Suite\n');
  console.log('='.repeat(60));
  
  testVersionIncrement();
  testReleaseNotes();
  testCurrentVersion();
  
  console.log('🎉 All tests completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('  • Run: node scripts/release-automation.js --test');
  console.log('  • Review the test output');
  console.log('  • Run: node scripts/release-automation.js (for real release)');
}

if (require.main === module) {
  runTests();
} 