import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="vi">
      <Head />
      <body>
        {/* Script để ngăn flash dark mode - phải chạy trước khi React hydrate */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function getTheme() {
                  // Kiểm tra localStorage trước
                  const saved = localStorage.getItem('amac-theme');
                  if (saved && ['light', 'dark', 'auto'].includes(saved)) {
                    return saved;
                  }
                  
                  // Fallback về system preference
                  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    return 'dark';
                  }
                  
                  return 'light';
                }
                
                function applyTheme(theme) {
                  const root = document.documentElement;
                  
                  if (theme === 'dark') {
                    root.classList.add('dark');
                  } else if (theme === 'light') {
                    root.classList.remove('dark');
                  } else if (theme === 'auto') {
                    // Auto theme theo system preference
                    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                      root.classList.add('dark');
                    } else {
                      root.classList.remove('dark');
                    }
                  }
                }
                
                try {
                  const theme = getTheme();
                  applyTheme(theme);
                } catch (e) {
                  // Fallback an toàn
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
        
        {/* Script để ngăn flash ngôn ngữ - phải chạy trước khi React hydrate */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function getLanguage() {
                  // Kiểm tra localStorage trước
                  const saved = localStorage.getItem('amac-language');
                  if (saved && ['vi', 'en'].includes(saved)) {
                    return saved;
                  }
                  
                  // Fallback về browser language
                  const browserLang = navigator.language || navigator.languages[0];
                  if (browserLang.startsWith('vi')) return 'vi';
                  if (browserLang.startsWith('en')) return 'en';
                  
                  return 'vi';
                }
                
                function setInitialLanguage(lang) {
                  // Đặt lang attribute cho html element
                  document.documentElement.setAttribute('lang', lang);
                  
                  // Lưu vào global variable để i18n có thể đọc
                  window.__INITIAL_LANGUAGE__ = lang;
                }
                
                try {
                  const language = getLanguage();
                  setInitialLanguage(language);
                } catch (e) {
                  // Fallback an toàn
                  setInitialLanguage('vi');
                }
              })();
            `,
          }}
        />
        
        <Main />
        <NextScript />
      </body>
    </Html>
  )
} 