import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import commonVi from './locales/vi/common.json';
import commonEn from './locales/en/common.json';
import commonTh from './locales/th/common.json';
import commonFr from './locales/fr/common.json';
import commonJa from './locales/ja/common.json';
import commonKo from './locales/ko/common.json';
import commonZh from './locales/zh/common.json';
import apiVi from './locales/vi/api.json';
import apiEn from './locales/en/api.json';
import apiTh from './locales/th/api.json';
import apiFr from './locales/fr/api.json';
import apiJa from './locales/ja/api.json';
import apiKo from './locales/ko/api.json';
import apiZh from './locales/zh/api.json';
// Import notification files
import notificationVi from './locales/vi/notification.json';
import notificationEn from './locales/en/notification.json';
import notificationTh from './locales/th/notification.json';
import notificationFr from './locales/fr/notification.json';
import notificationJa from './locales/ja/notification.json';
import notificationKo from './locales/ko/notification.json';
import notificationZh from './locales/zh/notification.json';

const FALLBACK_LNG = 'vi';

// Khởi tạo i18n
i18n.use(initReactI18next).init({
  resources: {
    vi: {
      common: commonVi,
      api: apiVi,
      notification: notificationVi
    },
    en: {
      common: commonEn,
      api: apiEn,
      notification: notificationEn
    },
    th: {
      common: commonTh,
      api: apiTh,
      notification: notificationTh
    },
    fr: {
      common: commonFr,
      api: apiFr,
      notification: notificationFr
    },
    ja: {
      common: commonJa,
      api: apiJa,
      notification: notificationJa
    },
    ko: {
      common: commonKo,
      api: apiKo,
      notification: notificationKo
    },
    zh: {
      common: commonZh,
      api: apiZh,
      notification: notificationZh
    }
  },
  
  // SSR luôn render với ngôn ngữ mặc định
  lng: FALLBACK_LNG,
  fallbackLng: FALLBACK_LNG,
  
  ns: ['common', 'api', 'notification'],
  defaultNS: 'common',
  
  interpolation: {
    escapeValue: false
  },
  
  react: {
    useSuspense: false,
    bindI18n: 'languageChanged',
    bindI18nStore: 'added removed',
    transEmptyNodeValue: '',
    transSupportBasicHtmlNodes: true,
    transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em'],
    defaultTransParent: 'div'
  }
});

// Lưu ngôn ngữ vào localStorage khi thay đổi (chỉ ở client-side)
if (typeof window !== 'undefined') {
  i18n.on('languageChanged', (lng) => {
    try {
      localStorage.setItem('amac-language', lng);
      document.documentElement.setAttribute('lang', lng);
      
      // Thông báo cho main process về thay đổi ngôn ngữ
      if (window.electron && window.electron.ipcRenderer) {
        window.electron.ipcRenderer.invoke('settings:change-language', lng);
      }
    } catch (e) {
      console.warn('Could not save language to localStorage:', e);
    }
  });
}

export default i18n; 