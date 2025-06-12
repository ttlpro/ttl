import { useTranslation } from 'react-i18next';
import i18n from '../i18n'

/**
 * Safe translation function with fallback
 * @param {string} key - Translation key
 * @param {object} options - Translation options (variables, defaultValue, etc.)
 * @returns {string} - Translated text or fallback
 */
export const useSafeTranslation = () => {
  const { t, i18n } = useTranslation();

  const safeT = (key, options = {}) => {
    try {
      // Check if i18n is initialized
      if (!i18n.isInitialized) {
        console.warn('i18n not initialized, returning key:', key)
        return key
      }
      
      const translation = i18n.t(key, options)
      // If translation is the same as key, it means the key wasn't found
      if (translation === key) {
        console.warn(`Translation not found for key: ${key}`)
        return key
      }
      return translation
    } catch (error) {
      console.warn(`Error translating key ${key}:`, error)
      return key
    }
  };

  return { t: safeT, i18n };
};

/**
 * Convert camelCase/snake_case key to human readable text
 * @param {string} key - Translation key
 * @returns {string} - Human readable text
 */
const humanizeKey = (key) => {
  if (!key) return '';
  
  // Get the last part of the key (after last dot)
  const lastPart = key.split('.').pop();
  
  // Convert camelCase to words
  return lastPart
    .replace(/([A-Z])/g, ' $1') // Add space before capitals
    .replace(/[_-]/g, ' ') // Replace underscores and dashes with spaces
    .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letter of each word
    .trim();
};

/**
 * Validate if all required translation keys exist
 * @param {string[]} keys - Array of translation keys to check
 * @param {string} language - Language to check (optional, defaults to current)
 * @returns {object} - Validation result with missing keys
 */
export const validateTranslations = (keys, language = null) => {
  const { i18n } = useTranslation();
  const lng = language || i18n.language;
  const missing = [];
  
  keys.forEach(key => {
    if (!i18n.exists(key, { lng })) {
      missing.push(key);
    }
  });
  
  return {
    isValid: missing.length === 0,
    missingKeys: missing,
    language: lng
  };
};

/**
 * Get available languages
 * @returns {object[]} - Array of language objects
 */
export const getAvailableLanguages = () => {
  return [
    {
      code: 'vi',
      name: 'Tiếng Việt',
      nativeName: 'Tiếng Việt',
      flag: '🇻🇳'
    },
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸'
    },
    {
      code: 'zh',
      name: '中文',
      nativeName: '中文',
      flag: '🇨🇳'
    },
    {
      code: 'ja',
      name: '日本語',
      nativeName: '日本語',
      flag: '🇯🇵'
    },
    {
      code: 'ko',
      name: '한국어',
      nativeName: '한국어',
      flag: '🇰🇷'
    },
    {
      code: 'th',
      name: 'ไทย',
      nativeName: 'ไทย',
      flag: '🇹🇭'
    },
    {
      code: 'fr',
      name: 'Français',
      nativeName: 'Français',
      flag: '🇫🇷'
    }
  ];
};

/**
 * Format number with locale
 * @param {number} value - Number to format
 * @param {string} locale - Locale code (optional)
 * @returns {string} - Formatted number
 */
export const formatNumber = (value, locale = null) => {
  const { i18n } = useTranslation();
  const lng = locale || i18n.language;
  
  // Map language codes to locale codes
  const localeMap = {
    'vi': 'vi-VN',
    'en': 'en-US'
  };
  
  try {
    return new Intl.NumberFormat(localeMap[lng] || lng).format(value);
  } catch (error) {
    return value.toString();
  }
};

/**
 * Get locale code from language code
 * @param {string} language - Language code
 * @returns {string} - Locale code
 */
export const getLocaleFromLanguage = (language = null) => {
  const lng = language || i18n.language;
  
  const localeMap = {
    'vi': 'vi-VN',
    'en': 'en-US',
    'zh': 'zh-CN',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'fr': 'fr-FR',
    'th': 'th-TH'
  };
  
  return localeMap[lng] || 'en-US';
};

/**
 * Format date with locale
 * @param {Date|string} date - Date to format
 * @param {string} locale - Locale code (optional)
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date
 */
export const formatDate = (date, locale = null, options = {}) => {
  if (!date) return 'N/A';
  
  const currentLocale = locale || getLocaleFromLanguage();
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  try {
    return new Intl.DateTimeFormat(currentLocale, defaultOptions).format(new Date(date));
  } catch (error) {
    return new Date(date).toLocaleDateString();
  }
};

/**
 * Format date and time with locale
 * @param {Date|string} dateTime - DateTime to format
 * @param {string} locale - Locale code (optional)
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date and time
 */
export const formatDateTime = (dateTime, locale = null, options = {}) => {
  if (!dateTime) return 'N/A';
  
  const currentLocale = locale || getLocaleFromLanguage();
  
  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options
  };
  
  try {
    return new Intl.DateTimeFormat(currentLocale, defaultOptions).format(new Date(dateTime));
  } catch (error) {
    return new Date(dateTime).toLocaleString();
  }
};

// Helper to translate folder names, especially default folder
export const translateFolderName = (folder) => {
  if (!folder) return ''
  
  // Special case for default folder
  if (folder.id === 'default' || folder.name === 'Mặc định' || folder.name === 'Default') {
    try {
      if (i18n.isInitialized) {
        return i18n.t('common.default')
      }
    } catch (error) {
      console.warn('Error translating default folder name:', error)
    }
    return folder.name
  }
  
  return folder.name
}

// Helper to translate folder description
export const translateFolderDescription = (folder) => {
  if (!folder) return ''
  
  // Special case for default folder descriptions
  if (folder.id === 'default') {
    try {
      if (i18n.isInitialized) {
        if (folder.description?.includes('proxy')) {
          return i18n.t('common.defaultProxyFolder')
        } else if (folder.description?.includes('account')) {
          return i18n.t('common.defaultAccountFolder')
        } else {
          return i18n.t('common.defaultDescription')
        }
      }
    } catch (error) {
      console.warn('Error translating default folder description:', error)
    }
  }
  
  return folder.description || ''
} 