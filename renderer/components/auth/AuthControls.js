import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  LanguageIcon, 
  SunIcon, 
  MoonIcon,
  ComputerDesktopIcon 
} from '@heroicons/react/24/outline';

const AuthControls = () => {
  const { i18n, t } = useTranslation();
  const { theme, changeTheme } = useTheme();

  const languages = [
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'th', name: 'ไทย', flag: '🇹🇭' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];

  const handleLanguageChange = async (langCode) => {
    try {
      await i18n.changeLanguage(langCode);
      
      // Lưu vào database thông qua API
      if (window.tiktokAPI?.changeLanguage) {
        try {
          await window.tiktokAPI.changeLanguage(langCode);
        } catch (backendError) {
          console.log('Backend language change not available yet (user not logged in)');
          // Fallback: lưu vào localStorage tạm thời
          localStorage.setItem('amac-language', langCode);
        }
      } else {
        // Fallback: lưu vào localStorage nếu API chưa sẵn sàng
        localStorage.setItem('amac-language', langCode);
      }
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const handleThemeChange = async (newTheme) => {
    try {
      await changeTheme(newTheme);
      // Theme đã được lưu vào backend bởi ThemeContext.changeTheme()
    } catch (error) {
      console.error('Error changing theme:', error);
    }
  };

  return (
    <div className="fixed top-4 right-4 flex items-center space-x-2 z-50">
      {/* Language Selector */}
      <div className="relative">
        <select
          value={i18n.language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 pr-8 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>
        <LanguageIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Theme Toggle */}
      <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-1">
        <button
          onClick={() => handleThemeChange('light')}
          className={`p-1.5 rounded ${
            theme === 'light'
              ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
          title={t('settings.theme.light')}
        >
          <SunIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleThemeChange('dark')}
          className={`p-1.5 rounded ${
            theme === 'dark'
              ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
          title={t('settings.theme.dark')}
        >
          <MoonIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleThemeChange('system')}
          className={`p-1.5 rounded ${
            theme === 'system'
              ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
          title={t('settings.theme.system')}
        >
          <ComputerDesktopIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AuthControls; 