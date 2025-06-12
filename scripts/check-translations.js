#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Translation Checker Script
 * Validates translation files and reports missing keys
 */

const LOCALES_DIR = path.join(__dirname, '../renderer/locales');
const SUPPORTED_LANGUAGES = ['vi', 'en','zh','ja','ko','fr','th'];
const NAMESPACES = ['common', 'api'];

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

/**
 * Load translation file
 */
function loadTranslation(language, namespace) {
  const filePath = path.join(LOCALES_DIR, language, `${namespace}.json`);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Translation file not found: ${filePath}`);
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Error parsing ${filePath}: ${error.message}`);
  }
}

/**
 * Get all translation keys from an object (nested)
 */
function getAllKeys(obj, prefix = '') {
  let keys = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys = keys.concat(getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

/**
 * Compare translation coverage between languages
 */
function compareTranslations() {
  const report = {
    summary: {
      totalKeys: 0,
      missingKeys: 0,
      languages: SUPPORTED_LANGUAGES.length,
      namespaces: NAMESPACES.length
    },
    details: {}
  };

  // Load base language (Vietnamese) as reference
  const baseLanguage = 'vi';
  const baseTranslations = {};
  
  for (const namespace of NAMESPACES) {
    baseTranslations[namespace] = loadTranslation(baseLanguage, namespace);
  }

  // Get all keys from base language
  const allBaseKeys = {};
  for (const namespace of NAMESPACES) {
    allBaseKeys[namespace] = getAllKeys(baseTranslations[namespace]);
    report.summary.totalKeys += allBaseKeys[namespace].length;
  }

  log(`🔍 Checking translation coverage...`, 'blue');
  log(`📊 Reference language: ${baseLanguage}`, 'blue');
  log(`🌍 Checking languages: ${SUPPORTED_LANGUAGES.join(', ')}`, 'blue');
  log(`📁 Namespaces: ${NAMESPACES.join(', ')}`, 'blue');
  console.log('');

  // Check each language against base
  for (const language of SUPPORTED_LANGUAGES) {
    report.details[language] = {
      missing: {},
      extra: {},
      total: 0,
      coverage: 0
    };

    for (const namespace of NAMESPACES) {
      const translation = loadTranslation(language, namespace);
      const translationKeys = getAllKeys(translation);
      const baseKeys = allBaseKeys[namespace];
      
      // Find missing keys
      const missingKeys = baseKeys.filter(key => !translationKeys.includes(key));
      const extraKeys = translationKeys.filter(key => !baseKeys.includes(key));
      
      report.details[language].missing[namespace] = missingKeys;
      report.details[language].extra[namespace] = extraKeys;
      report.details[language].total += baseKeys.length;
      
      if (missingKeys.length > 0) {
        report.summary.missingKeys += missingKeys.length;
      }
    }
    
    // Calculate coverage percentage
    const totalMissing = Object.values(report.details[language].missing)
      .reduce((sum, keys) => sum + keys.length, 0);
    report.details[language].coverage = 
      Math.round(((report.details[language].total - totalMissing) / report.details[language].total) * 100);
  }

  return report;
}

/**
 * Print detailed report
 */
function printReport(report) {
  log('📋 TRANSLATION COVERAGE REPORT', 'bold');
  log('================================', 'bold');
  console.log('');
  
  // Summary
  log('📊 SUMMARY:', 'yellow');
  log(`   Total keys: ${report.summary.totalKeys}`, 'blue');
  log(`   Languages: ${report.summary.languages}`, 'blue');
  log(`   Namespaces: ${report.summary.namespaces}`, 'blue');
  console.log('');
  
  // Coverage by language
  log('🌍 COVERAGE BY LANGUAGE:', 'yellow');
  let allComplete = true;
  
  for (const [language, details] of Object.entries(report.details)) {
    const totalMissing = Object.values(details.missing)
      .reduce((sum, keys) => sum + keys.length, 0);
    
    if (totalMissing === 0) {
      log(`   ${language.toUpperCase()}: ${details.coverage}% ✅ COMPLETE`, 'green');
    } else {
      log(`   ${language.toUpperCase()}: ${details.coverage}% ❌ Missing ${totalMissing} keys`, 'red');
      allComplete = false;
    }
  }
  console.log('');
  
  // Detailed missing keys
  let hasDetails = false;
  for (const [language, details] of Object.entries(report.details)) {
    for (const [namespace, missingKeys] of Object.entries(details.missing)) {
      if (missingKeys.length > 0) {
        if (!hasDetails) {
          log('❌ MISSING TRANSLATIONS:', 'red');
          hasDetails = true;
        }
        log(`   ${language.toUpperCase()} - ${namespace}:`, 'yellow');
        missingKeys.forEach(key => {
          log(`     • ${key}`, 'red');
        });
        console.log('');
      }
    }
  }
  
  // Extra keys (keys not in base language)
  let hasExtra = false;
  for (const [language, details] of Object.entries(report.details)) {
    for (const [namespace, extraKeys] of Object.entries(details.extra)) {
      if (extraKeys.length > 0) {
        if (!hasExtra) {
          log('➕ EXTRA TRANSLATIONS:', 'blue');
          hasExtra = true;
        }
        log(`   ${language.toUpperCase()} - ${namespace}:`, 'yellow');
        extraKeys.forEach(key => {
          log(`     • ${key}`, 'blue');
        });
        console.log('');
      }
    }
  }
  
  // Final status
  if (allComplete) {
    log('🎉 ALL TRANSLATIONS COMPLETE! 🎉', 'green');
  } else {
    log('⚠️  TRANSLATIONS INCOMPLETE', 'yellow');
    log('   Please add missing translations before deployment.', 'yellow');
  }
  
  return allComplete;
}

/**
 * Main function
 */
function main() {
  try {
    const report = compareTranslations();
    const isComplete = printReport(report);
    
    // Exit with error code if incomplete
    process.exit(isComplete ? 0 : 1);
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { compareTranslations, printReport }; 