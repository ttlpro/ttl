import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function useLanguageSync() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Đồng bộ với backend khi component mount
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

    syncWithBackend();
  }, [i18n]);

  return null;
} 