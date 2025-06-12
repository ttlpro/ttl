import '../i18n';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';
import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import LanguageProvider from '../components/LanguageProvider';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Kiểm tra xem electronAPI có tồn tại không
    if (!window.electronAPI || typeof window.electronAPI.on !== 'function') {
      console.warn('electronAPI not available, skipping event listeners setup');
      return;
    }
    
    // Set up listeners for app events from the menu
    const unsubscribeOpenAddRoomModal = window.electronAPI.on('app:open-add-room-modal', () => {
      // Implement function to open add room modal
      if (typeof window.openAddRoomModal === 'function') {
        window.openAddRoomModal();
      } else {
        // Chuyển hướng đến trang /rooms với tham số mở modal
        window.location.href = '/rooms?action=add';
      }
    });
    
    const unsubscribeOpenAddAccountModal = window.electronAPI.on('app:open-add-account-modal', () => {
      // Implement function to open add account modal
      if (typeof window.openAddAccountModal === 'function') {
        window.openAddAccountModal();
      } else {
        // Chuyển hướng đến trang /accounts với tham số mở modal
        window.location.href = '/accounts?action=add';
      }
    });
    
    const unsubscribeOpenAddProxyModal = window.electronAPI.on('app:open-add-proxy-modal', () => {
      // Implement function to open add proxy modal
      if (typeof window.openAddProxyModal === 'function') {
        window.openAddProxyModal();
      } else {
        // Chuyển hướng đến trang /proxies với tham số mở modal
        window.location.href = '/proxies?action=add';
      }
    });
    
    const unsubscribeExportData = window.electronAPI.on('app:export-data', () => {
      // Implement function to export data
      console.log('Export data triggered from menu');
    });
    
    const unsubscribeImportData = window.electronAPI.on('app:import-data', () => {
      // Implement function to import data
      console.log('Import data triggered from menu');
    });
    
    const unsubscribeCheckForUpdates = window.electronAPI.on('app:check-for-updates', () => {
      // Implement function to check for updates
      console.log('Check for updates triggered from menu');
    });
    
    const unsubscribeShowAbout = window.electronAPI.on('app:show-about', () => {
      // Hiển thị About panel từ main process
      console.log('Show about dialog triggered from menu');
      if (window.electronAPI && typeof window.electronAPI.invoke === 'function') {
        window.electronAPI.invoke('show-about-panel');
      }
    });
    
    const unsubscribeCheckAllAccounts = window.electronAPI.on('app:check-all-accounts', () => {
      console.log('Check all accounts triggered from menu');
      // Gọi API kiểm tra tất cả tài khoản
      if (window.tiktokAPI && typeof window.tiktokAPI.checkAllAccounts === 'function') {
        window.tiktokAPI.checkAllAccounts();
      } else {
        // Chuyển hướng đến trang tài khoản với tham số hành động
        window.location.href = '/accounts?action=check-all';
      }
    });
    
    const unsubscribeCheckAllProxies = window.electronAPI.on('app:check-all-proxies', () => {
      console.log('Check all proxies triggered from menu');
      // Gọi API kiểm tra tất cả proxy
      if (window.tiktokAPI && typeof window.tiktokAPI.bulkTestProxies === 'function') {
        window.tiktokAPI.bulkTestProxies([]);
      } else {
        // Chuyển hướng đến trang proxy với tham số hành động
        window.location.href = '/proxies?action=check-all';
      }
    });
    
    // Handler cho việc thêm tài khoản từ text
    const unsubscribeOpenAddAccountTextModal = window.electronAPI.on('app:open-add-account-text-modal', () => {
      console.log('Open add account from text modal triggered');
      if (typeof window.openAddAccountTextModal === 'function') {
        window.openAddAccountTextModal();
      } else {
        // Đặt biến toàn cục để biết cần mở modal nào
        window.SHOW_ACCOUNT_IMPORT_TEXT_MODAL = true;
        
        // Chuyển hướng đến trang accounts
        if (window.location.pathname !== '/accounts') {
          window.location.href = '/accounts';
        } else {
          // Nếu đã ở trang accounts, kích hoạt sự kiện tùy chỉnh
          const event = new CustomEvent('open-account-import-text-modal');
          window.dispatchEvent(event);
        }
      }
    });
    
    // Handler cho việc thêm proxy từ text
    const unsubscribeOpenAddProxyTextModal = window.electronAPI.on('app:open-add-proxy-text-modal', () => {
      console.log('Open add proxy from text modal triggered');
      if (typeof window.openAddProxyTextModal === 'function') {
        window.openAddProxyTextModal();
      } else {
        // Đặt biến toàn cục để biết cần mở modal nào
        window.SHOW_PROXY_IMPORT_TEXT_MODAL = true;
        
        // Chuyển hướng đến trang proxies
        if (window.location.pathname !== '/proxies') {
          window.location.href = '/proxies';
        } else {
          // Nếu đã ở trang proxies, kích hoạt sự kiện tùy chỉnh
          const event = new CustomEvent('open-proxy-import-text-modal');
          window.dispatchEvent(event);
        }
      }
    });
    
    // Define global functions for menu to use with improved implementation
    window.openAddRoomModal = () => {
      console.log('Open add room modal triggered from global function');
      window.location.href = '/rooms?action=add';
    };
    
    window.openAddAccountModal = () => {
      console.log('Open add account modal triggered from global function');
      window.location.href = '/accounts?action=add';
    };
    
    window.openAddProxyModal = () => {
      console.log('Open add proxy modal triggered from global function');
      window.location.href = '/proxies?action=add';
    };
    
    window.openAddAccountTextModal = () => {
      console.log('Open add account from text modal triggered from global function');
      window.location.href = '/accounts?action=import-text';
    };
    
    window.openAddProxyTextModal = () => {
      console.log('Open add proxy from text modal triggered from global function');
      window.location.href = '/proxies?action=import-text';
    };
    
    // Thêm xử lý cho các trang cụ thể dựa trên URL hiện tại và localStorage
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const action = searchParams.get('action');
    
    // Xử lý cho trang accounts
    if (pathname === '/accounts') {
      const shouldOpenImportModal = localStorage.getItem('OPEN_ACCOUNT_IMPORT_TEXT_MODAL');
      if (shouldOpenImportModal === 'true' || action === 'import-text') {
        // Xóa flag để tránh mở lại modal khi refresh
        localStorage.removeItem('OPEN_ACCOUNT_IMPORT_TEXT_MODAL');
        
        // Kích hoạt sự kiện để trang accounts có thể bắt được
        setTimeout(() => {
          const event = new CustomEvent('open-account-import-text-modal');
          window.dispatchEvent(event);
          console.log('Dispatched open-account-import-text-modal event');
        }, 500);
      } else if (action === 'add') {
        setTimeout(() => {
          const event = new CustomEvent('open-account-add-modal');
          window.dispatchEvent(event);
          console.log('Dispatched open-account-add-modal event');
        }, 500);
      }
    }
    
    // Xử lý cho trang proxies
    if (pathname === '/proxies') {
      const shouldOpenImportModal = localStorage.getItem('OPEN_PROXY_IMPORT_TEXT_MODAL');
      if (shouldOpenImportModal === 'true' || action === 'import-text') {
        // Xóa flag để tránh mở lại modal khi refresh
        localStorage.removeItem('OPEN_PROXY_IMPORT_TEXT_MODAL');
        
        // Kích hoạt sự kiện để trang proxies có thể bắt được
        setTimeout(() => {
          const event = new CustomEvent('open-proxy-import-text-modal');
          window.dispatchEvent(event);
          console.log('Dispatched open-proxy-import-text-modal event');
        }, 500);
      } else if (action === 'add') {
        setTimeout(() => {
          const event = new CustomEvent('open-proxy-add-modal');
          window.dispatchEvent(event);
          console.log('Dispatched open-proxy-add-modal event');
        }, 500);
      }
    }
    
    // Xử lý cho trang rooms
    if (pathname === '/rooms' && action === 'add') {
      setTimeout(() => {
        const event = new CustomEvent('open-room-add-modal');
        window.dispatchEvent(event);
        console.log('Dispatched open-room-add-modal event');
      }, 500);
    }
    
    // Hàm openModal để xử lý các yêu cầu mở modal từ menu
    window.openModal = (modalType) => {
      console.log(`Opening modal type: ${modalType}`);
      
      // Dựa vào loại modal, thực hiện các hành động khác nhau
      switch (modalType) {
        case 'ADD_ROOM':
          // Chuyển hướng đến trang rooms
          router.push('/rooms?action=add');
          break;
          
        case 'ADD_ACCOUNT':
          // Chuyển hướng đến trang accounts
          router.push('/accounts?action=add');
          break;
          
        case 'IMPORT_ACCOUNT_TEXT':
          // Chuyển hướng đến trang accounts
          router.push('/accounts?action=import-text');
          break;
          
        case 'ADD_PROXY':
          // Chuyển hướng đến trang proxies
          router.push('/proxies?action=add');
          break;
          
        case 'IMPORT_PROXY_TEXT':
          // Chuyển hướng đến trang proxies
          router.push('/proxies?action=import-text');
          break;
          
        default:
          console.log(`Unknown modal type: ${modalType}`);
      }
    };
    
    return () => {
      // Clean up listeners
      unsubscribeOpenAddRoomModal();
      unsubscribeOpenAddAccountModal();
      unsubscribeOpenAddProxyModal();
      unsubscribeOpenAddAccountTextModal();
      unsubscribeOpenAddProxyTextModal();
      unsubscribeExportData();
      unsubscribeImportData();
      unsubscribeCheckForUpdates();
      unsubscribeShowAbout();
      unsubscribeCheckAllAccounts();
      unsubscribeCheckAllProxies();
    };
  }, [router.pathname]);

  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <Component {...pageProps} />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)'
              }
            }}
          />
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Disable automatic static optimization for all pages
MyApp.getInitialProps = async () => {
  return { pageProps: {} };
};

export default MyApp; 