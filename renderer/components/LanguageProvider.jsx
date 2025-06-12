import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function LanguageProvider({ children }) {
  const [mounted, setMounted] = useState(false);
  const { i18n } = useTranslation();

  useEffect(() => {
    // Đồng bộ với backend (ưu tiên database settings)
    const syncWithBackend = async () => {
      try {
        if (window.tiktokAPI?.getSettings) {
          const result = await window.tiktokAPI.getSettings();
          if (result.success && result.settings?.language) {
            const backendLang = result.settings.language;
            if (['vi', 'en', 'zh', 'ja', 'ko', 'th', 'fr'].includes(backendLang) && backendLang !== i18n.language) {
              await i18n.changeLanguage(backendLang);
            }
          }
        }
      } catch (error) {
        console.error('Failed to sync language with backend:', error);
      }
    };

    // Đồng bộ với localStorage (chỉ khi backend không có hoặc chưa đăng nhập)
    const syncWithLocalStorage = () => {
      try {
        const storedLang = localStorage.getItem('amac-language');
        if (storedLang && ['vi', 'en', 'zh', 'ja', 'ko', 'th', 'fr'].includes(storedLang) && storedLang !== i18n.language) {
          i18n.changeLanguage(storedLang);
        }
      } catch (error) {
        console.error('Failed to sync language with localStorage:', error);
      }
    };

    // Lắng nghe sự kiện storage change
    const handleStorageChange = (e) => {
      if (e.key === 'amac-language') {
        const newLang = e.newValue;
        if (newLang && ['vi', 'en', 'zh', 'ja', 'ko', 'th', 'fr'].includes(newLang) && newLang !== i18n.language) {
          i18n.changeLanguage(newLang);
        }
      }
    };

    // Thêm event listener
    window.addEventListener('storage', handleStorageChange);

    // Thực hiện đồng bộ và đánh dấu đã mount
    const init = async () => {
      syncWithLocalStorage();
      await syncWithBackend();
      setMounted(true);
    };

    init();

    // Cleanup event listener
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [i18n]);

  // Nếu chưa mount, return null để tránh hydration mismatch
  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-xl">
          <div className="w-8 h-8 border-4 border-tiktok-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return children;
} 