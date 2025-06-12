import { useState, useEffect } from 'react'

export function useAccountsData() {
  const [accounts, setAccounts] = useState([])
  const [folders, setFolders] = useState([])
  const [proxies, setProxies] = useState([])
  const [proxyFolders, setProxyFolders] = useState([])
  const [selectedFolder, setSelectedFolderInternal] = useState('accounts-default')
  const [loading, setLoading] = useState(false)
  const [folderStats, setFolderStats] = useState({})
  const [settings, setSettings] = useState(null)

  // Wrapper for setSelectedFolder
  const setSelectedFolder = (newFolder) => {
    setSelectedFolderInternal(newFolder);
  }

  useEffect(() => {
    // Wait for the component to be fully hydrated before calling APIs
    const initializeData = async () => {
      // Check if we're in the browser environment and API is available
      if (typeof window !== 'undefined') {
        // Wait a bit for the preload script to be ready
        let retryCount = 0
        const maxRetries = 10
        
        while (retryCount < maxRetries && (!window.tiktokAPI || typeof window.tiktokAPI.getFolders !== 'function')) {
          await new Promise(resolve => setTimeout(resolve, 100))
          retryCount++
        }
        
        if (window.tiktokAPI) {
          await Promise.all([
            loadFolders(),
            loadProxies(),
            loadProxyFolders(),
            loadSettings()
          ])
        } else {
          console.warn('TikTok API not available after retries, using fallback data')
          setFolders([])
        }
      }
    }

    initializeData()
  }, [])

  useEffect(() => {
    loadAccountsForFolder()
  }, [selectedFolder])

  const loadFolders = async () => {
    try {
      if (typeof window !== 'undefined' && window.tiktokAPI && typeof window.tiktokAPI.getFolders === 'function') {
        // console.log('📂 Requesting folders from API...');
        const result = await window.tiktokAPI.getFolders('accounts');
        // console.log('📂 Received folders response:', result);
        
        if (result && result.success && result.folders) {
          // Kiểm tra xem API có trả về folders.accounts hay không
          let accountFolders = [];
          if (result.folders.accounts && Array.isArray(result.folders.accounts)) {
            // console.log(`📂 Found ${result.folders.accounts.length} account folders in response`);
            accountFolders = result.folders.accounts;
          } else if (Array.isArray(result.folders)) {
            // console.log(`📂 Found ${result.folders.length} account folders in response (flat array)`);
            accountFolders = result.folders;
          }
          
          // ✅ KHÔNG CẦN TỰ TẠO DEFAULT FOLDER NỮA
          // Database đã có accounts-default folder rồi
          
          setFolders(accountFolders);
          
          // Load folder stats
          const stats = {};
          for (const folder of accountFolders) {
            try {
              // console.log(`📊 Loading stats for folder: ${folder.name} (${folder.id})`);
              const accountsResult = await window.tiktokAPI.getAccountsByFolder(folder.id);
              if (accountsResult && accountsResult.success && Array.isArray(accountsResult.accounts)) {
                stats[folder.id] = accountsResult.accounts.length;
                // console.log(`📊 Folder ${folder.name}: ${stats[folder.id]} accounts`);
              } else {
                stats[folder.id] = 0;
                // console.log(`📊 Folder ${folder.name}: 0 accounts (no success response)`);
              }
            } catch (err) {
              console.warn(`❌ Error loading stats for folder ${folder.id}:`, err);
              stats[folder.id] = 0;
            }
          }
          setFolderStats(stats);
        } else {
          // console.log('📂 Invalid response from API, using empty folders');
          setFolders([]);
          setFolderStats({});
        }
      } else {
        // console.log('📂 API not available, using empty folders');
        setFolders([]);
        setFolderStats({});
      }
    } catch (error) {
      console.error('❌ Error loading folders:', error);
      setFolders([]);
      setFolderStats({});
    }
  }

  const loadProxies = async () => {
    try {
      if (typeof window !== 'undefined' && window.tiktokAPI && typeof window.tiktokAPI.getProxies === 'function') {
        const result = await window.tiktokAPI.getProxies()
        
        if (Array.isArray(result)) {
          setProxies(result)
        } else {
          setProxies([])
        }
      } else {
        setProxies([])
      }
    } catch (error) {
      console.error('Error loading proxies:', error)
      setProxies([])
    }
  }

  const loadProxyFolders = async () => {
    try {
      if (typeof window !== 'undefined' && window.tiktokAPI && typeof window.tiktokAPI.getFolders === 'function') {
        const result = await window.tiktokAPI.getFolders('proxies')
        
        if (result && result.success && result.folders) {
          let proxyFoldersData = []
          
          if (result.folders.proxies && Array.isArray(result.folders.proxies)) {
            proxyFoldersData = result.folders.proxies
          } else if (Array.isArray(result.folders)) {
            proxyFoldersData = result.folders
          }
          
          // ✅ KHÔNG CẦN TỰ TẠO DEFAULT FOLDER CHO PROXIES NỮA
          // Database đã có proxies-default folder rồi
          
          setProxyFolders(proxyFoldersData)
        } else {
          setProxyFolders([{ 
            id: 'default', 
            name: 'Mặc định', 
            color: '#6B7280', 
            description: 'Thư mục proxy mặc định' 
          }])
        }
      }
    } catch (error) {
      console.error('Error loading proxy folders:', error)
      setProxyFolders([{ 
        id: 'default', 
        name: 'Mặc định', 
        color: '#6B7280', 
        description: 'Thư mục proxy mặc định' 
      }])
    }
  }

  const loadAccountsForFolder = async () => {
    try {
      if (typeof window !== 'undefined' && window.tiktokAPI && typeof window.tiktokAPI.getAccountsByFolder === 'function') {
        const result = await window.tiktokAPI.getAccountsByFolder(selectedFolder)
        if (result && result.success) {
          setAccounts(result.accounts || [])
        }
      }
    } catch (error) {
      console.error('Error loading accounts for folder:', error)
    }
  }

  const loadSettings = async () => {
    try {
      if (typeof window !== 'undefined' && window.tiktokAPI && typeof window.tiktokAPI.getSettings === 'function') {
        // console.log('Loading settings from API...');
        const result = await window.tiktokAPI.getSettings();
        // console.log('Settings loaded:', result);
        
        if (result.success && result.settings) {
          // console.log('maxAccountsPerProxy value:', result.settings.proxy?.maxAccountsPerProxy);
          setSettings(result.settings);
          return result.settings;
        } else {
          console.warn('Invalid settings format from API:', result);
          const defaultSettings = { proxy: { maxAccountsPerProxy: 1 } };
          setSettings(defaultSettings);
          return defaultSettings;
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      const defaultSettings = { proxy: { maxAccountsPerProxy: 1 } };
      setSettings(defaultSettings);
      return defaultSettings;
    }
  }

  const getProxyStatistics = (proxyFolderId) => {
    if (!Array.isArray(proxies) || proxies.length === 0) {
      return []
    }

    let filteredProxies = []
    const folderId = proxyFolderId
    
    if (folderId && folderId !== 'default') {
      filteredProxies = proxies.filter(proxy => {
        const proxyFolderId = proxy.folderId || proxy.folder_id || proxy.folderid || proxy.category || proxy.group
        return proxyFolderId === folderId
      })
    } else {
      filteredProxies = proxies.filter(proxy => {
        const proxyFolderId = proxy.folderId || proxy.folder_id || proxy.folderid || proxy.category || proxy.group
        return !proxyFolderId || proxyFolderId === 'default' || proxyFolderId === ''
      })
    }

    // Lấy giá trị maxAccountsPerProxy từ settings.proxy
    const maxAccountsPerProxy = settings?.proxy?.maxAccountsPerProxy || 1

    return filteredProxies.map(proxy => {
      const status = proxy.status || proxy.state || proxy.connection_status || proxy.connectionStatus || 'unknown'
      const isOnline = status === 'online' || status === 'connected' || status === 'active'
      
      const assignedCount = accounts.filter(account => {
        const accountProxyId = account.proxyId || account.proxy_id || account.proxyID
        return accountProxyId === proxy.id
      }).length

      // Sử dụng maxAccountsPerProxy từ settings.proxy
      const availableSlots = Math.max(0, maxAccountsPerProxy - assignedCount)
      const canAssign = isOnline && availableSlots > 0

      return {
        id: proxy.id,
        host: proxy.host || proxy.proxyInfo?.split(':')[0] || 'unknown',
        port: proxy.port || proxy.proxyInfo?.split(':')[1] || 'unknown',
        status: status,
        isOnline: isOnline,
        assignedCount: assignedCount,
        availableSlots: availableSlots,
        canAssign: canAssign,
        maxAccountsPerProxy: maxAccountsPerProxy
      }
    })
  }

  return {
    // State
    accounts,
    folders,
    proxies,
    proxyFolders,
    selectedFolder,
    loading,
    folderStats,
    settings,
    
    // Actions
    setAccounts,
    setSelectedFolder,
    setLoading,
    loadFolders,
    loadAccountsForFolder,
    getProxyStatistics,
    loadSettings
  }
}