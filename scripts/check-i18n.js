#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const LANGUAGES = ['vi', 'en', 'zh', 'ja', 'ko', 'th', 'fr'];
const LOCALES_DIR = path.join(__dirname, '../renderer/locales');

/**
 * Kiểm tra missing translations
 */
function checkMissingTranslations() {
    const allKeys = new Set();
    const translations = {};
    
    // Đọc tất cả translation files
    LANGUAGES.forEach(lang => {
        const filePath = path.join(LOCALES_DIR, lang, 'common.json');
        if (fs.existsSync(filePath)) {
            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            translations[lang] = content;
            
            // Extract all keys recursively
            extractKeys(content, '', allKeys);
        }
    });
    
    // Check missing keys
    const missing = {};
    LANGUAGES.forEach(lang => {
        missing[lang] = [];
        allKeys.forEach(key => {
            if (!hasKey(translations[lang], key)) {
                missing[lang].push(key);
            }
        });
    });
    
    return missing;
}

/**
 * Extract keys từ object recursively
 */
function extractKeys(obj, prefix, keySet) {
    Object.keys(obj).forEach(key => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            extractKeys(obj[key], fullKey, keySet);
        } else {
            keySet.add(fullKey);
        }
    });
}

/**
 * Check xem key có tồn tại không
 */
function hasKey(obj, key) {
    const keys = key.split('.');
    let current = obj;
    
    for (const k of keys) {
        if (!current || typeof current !== 'object' || !(k in current)) {
            return false;
        }
        current = current[k];
    }
    
    return true;
}

/**
 * Main function
 */
function main() {
    console.log('🔍 Checking translations...\n');
    
    const missing = checkMissingTranslations();
    let hasIssues = false;
    
    LANGUAGES.forEach(lang => {
        if (missing[lang].length > 0) {
            hasIssues = true;
            console.log(`❌ ${lang.toUpperCase()}: Missing ${missing[lang].length} keys`);
            missing[lang].forEach(key => console.log(`   - ${key}`));
            console.log();
        } else {
            console.log(`✅ ${lang.toUpperCase()}: Complete`);
        }
    });
    
    if (!hasIssues) {
        console.log('\n🎉 All translations are complete!');
    } else {
        console.log('\n🚨 Please add missing translations');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { checkMissingTranslations }; 