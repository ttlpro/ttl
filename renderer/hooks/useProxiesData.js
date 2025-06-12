import { useState, useEffect } from 'react'

export function useProxiesData() {
  const [proxies, setProxies] = useState([])
  const [folders, setFolders] = useState([])
  const [selectedFolder, setSelectedFolder] = useState('default')
  const [loading, setLoading] = useState(false)
  const [folderStats, setFolderStats] = useState({})
  const [filteredData, setFilteredData] = useState({
    proxies: [],
    totalCount: 0,
    totalPages: 0
  })

  useEffect(() => {
    // Wait for the component to be fully hydrated before calling APIs
    const initializeData = async () => {
      if (typeof window !== 'undefined') {
        // Wait a bit for the preload script to be ready
        let retryCount = 0
        const maxRetries = 10
        
        while (retryCount < maxRetries && (!window.tiktokAPI || typeof window.tiktokAPI.getFolders !== 'function')) {
          await new Promise(resolve => setTimeout(resolve, 100))
          retryCount++
        }
        
        if (window.tiktokAPI) {
          await loadFolders()
        } else {
          console.warn('TikTok API not available after retries, using fallback data')
          setFolders([{ id: 'default', name: 'Mặc định', color: '#6B7280', description: 'Thư mục proxy mặc định' }])
        }
      }
    }

    initializeData()
  }, [])

  useEffect(() => {
    // Load folder stats when folders are loaded
    if (folders.length > 0) {
      loadFolderStats()
    }
  }, [folders])

  const loadFolders = async () => {
    try {
      if (typeof window !== 'undefined' && window.tiktokAPI && typeof window.tiktokAPI.getFolders === 'function') {
        // console.log('📂 Requesting proxy folders from API...');
        const result = await window.tiktokAPI.getFolders('proxies');
        // console.log('📂 Received proxy folders response:', JSON.stringify(result));
        
        if (result && result.success) {
          // Kiểm tra tất cả các trường hợp cấu trúc dữ liệu có thể nhận được
          let proxyFoldersData = [];
          
          if (result.folders && result.folders.proxies && Array.isArray(result.folders.proxies)) {
            // Trường hợp: { success: true, folders: { proxies: [...] } }
            // console.log(`📂 Found ${result.folders.proxies.length} proxy folders in nested format`);
            proxyFoldersData = [...result.folders.proxies];
          } else if (result.folders && Array.isArray(result.folders)) {
            // Trường hợp: { success: true, folders: [...] }
            // console.log(`📂 Found ${result.folders.length} proxy folders in flat array format`);
            proxyFoldersData = [...result.folders];
          } else if (typeof result.folders === 'object' && result.folders !== null) {
            // console.log('📂 Folders is an object but not an array:', result.folders);
            // Try to convert to array if possible
            if (Object.keys(result.folders).length > 0) {
              const values = Object.values(result.folders);
              if (Array.isArray(values[0])) {
                proxyFoldersData = [...values[0]];
                // console.log('📂 Extracted array from object:', proxyFoldersData);
              }
            }
          } else {
            // console.log('📂 Unexpected folders data structure:', result.folders);
            // Fallback to empty array
            proxyFoldersData = [];
          }
          
          // Ensure array is valid
          if (!Array.isArray(proxyFoldersData)) {
            // console.log('📂 proxyFoldersData is not an array, resetting to empty array');
            proxyFoldersData = [];
          }
          
          // Luôn có thư mục mặc định
          // console.log('📂 Checking for default folder in:', proxyFoldersData);
          const hasDefault = Array.isArray(proxyFoldersData) && proxyFoldersData.some(folder => folder.id === 'default');
          if (!hasDefault) {
            const defaultFolder = { 
              id: 'default', 
              name: 'Mặc định', 
              color: '#6B7280', 
              description: 'Thư mục proxy mặc định' 
            };
            // console.log('📂 Adding default folder:', defaultFolder);
            proxyFoldersData.unshift(defaultFolder);
          }
          
          // console.log('📂 Final proxy folders data:', JSON.stringify(proxyFoldersData));
          setFolders(proxyFoldersData);
          
          // Load folder stats
          const stats = {};
          for (const folder of proxyFoldersData) {
            try {
              // console.log(`📊 Loading stats for proxy folder: ${folder.name} (${folder.id})`);
              const proxiesResult = await window.tiktokAPI.getProxiesByFolder(folder.id);
              if (Array.isArray(proxiesResult.proxies)) {
                stats[folder.id] = proxiesResult.proxies.length;
                // console.log(`📊 Proxy folder ${folder.name}: ${stats[folder.id]} proxies`);
              } else {
                stats[folder.id] = 0;
                // console.log(`📊 Proxy folder ${folder.name}: 0 proxies (no success response)`);
              }
            } catch (err) {
              console.warn(`❌ Error loading stats for proxy folder ${folder.id}:`, err);
              stats[folder.id] = 0;
            }
          }
          setFolderStats(stats);
        } else {
          // console.log('📂 Invalid response from API for proxy folders, using default folder');
          const defaultFolder = { 
            id: 'default', 
            name: 'Mặc định', 
            color: '#6B7280', 
            description: 'Thư mục proxy mặc định' 
          };
          setFolders([defaultFolder]);
          setFolderStats({ 'default': 0 });
        }
      } else {
        // console.log('📂 API not available for proxy folders, using default folder');
        const defaultFolder = { 
          id: 'default', 
          name: 'Mặc định', 
          color: '#6B7280', 
          description: 'Thư mục proxy mặc định' 
        };
        setFolders([defaultFolder]);
        setFolderStats({ 'default': 0 });
      }
    } catch (error) {
      console.error('❌ Error loading proxy folders:', error);
      const defaultFolder = { 
        id: 'default', 
        name: 'Mặc định', 
        color: '#6B7280', 
        description: 'Thư mục proxy mặc định' 
      };
      setFolders([defaultFolder]);
      setFolderStats({ 'default': 0 });
    }
  }

  const loadFolderStats = async () => {
    try {
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        // Get all proxies to count by folder
        const allProxies = await window.tiktokAPI.getProxies()
        const stats = {}
        
        // Kiểm tra folders là array trước khi gọi forEach
        if (Array.isArray(folders)) {
          // Count proxies for each folder
          folders.forEach(folder => {
            const count = allProxies.filter(proxy => proxy.folderId === folder.id).length
            stats[folder.id] = count
          })
        }
        
        setFolderStats(stats)
      }
    } catch (error) {
      console.error('Error loading folder stats:', error)
      // Fallback: count from current proxies data
      const stats = {}
      
      // Kiểm tra folders là array trước khi gọi forEach
      if (Array.isArray(folders)) {
        folders.forEach(folder => {
          const count = proxies.filter(proxy => proxy.folderId === folder.id).length
          stats[folder.id] = count
        })
      }
      
      setFolderStats(stats)
    }
  }

  const loadFilteredProxies = async (filterOptions = {}, sortOptions = {}) => {
    try {
      setLoading(true)
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        const result = await window.tiktokAPI.getProxiesWithFilter(filterOptions, sortOptions)
        if (result && result.success) {
          const data = {
            proxies: result.proxies || [],
            totalCount: result.totalCount || 0,
            totalPages: result.totalPages || 0
          }
          setFilteredData(data)
          setProxies(result.proxies || [])
          return data
        }
      }
    } catch (error) {
      console.error('Error loading filtered proxies:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProxiesForFolder = async (folderId = selectedFolder) => {
    try {
      setLoading(true)
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        const result = await window.tiktokAPI.getProxiesByFolder(folderId)
        if (result && result.success) {
          setProxies(result.proxies || [])
        }
      }
    } catch (error) {
      console.error('Error loading proxies for folder:', error)
    } finally {
      setLoading(false)
    }
  }

  const addProxy = async (proxyData) => {
    try {
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        const result = await window.tiktokAPI.addProxy(proxyData)
        if (result && result.success) {
          // Reload data after adding
          await loadFolderStats()
          return result
        }
      }
    } catch (error) {
      console.error('Error adding proxy:', error)
      throw error
    }
  }

  const deleteProxy = async (proxyId) => {
    try {
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        const result = await window.tiktokAPI.deleteProxy(proxyId)
        if (result && result.success) {
          // Remove from local state
          setProxies(prev => prev.filter(p => p.id !== proxyId))
          // Reload folder stats
          await loadFolderStats()
          return result
        }
      }
    } catch (error) {
      console.error('Error deleting proxy:', error)
      throw error
    }
  }

  const addFolder = async (folderData) => {
    try {
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        const result = await window.tiktokAPI.addProxyFolder(folderData)
        if (result && result.success) {
          // Reload folders
          await loadFolders()
          return result
        }
      }
    } catch (error) {
      console.error('Error adding folder:', error)
      throw error
    }
  }

  const deleteFolder = async (folderId) => {
    try {
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        const result = await window.tiktokAPI.deleteProxyFolder(folderId)
        if (result && result.success) {
          // Reload folders
          await loadFolders()
          return result
        }
      }
    } catch (error) {
      console.error('Error deleting folder:', error)
      throw error
    }
  }

  const testProxy = async (proxy) => {
    try {
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        const result = await window.tiktokAPI.testProxy(proxy)
        return result
      }
    } catch (error) {
      console.error('Error testing proxy:', error)
      throw error
    }
  }

  const importProxies = async (proxiesText, folderId) => {
    try {
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        const result = await window.tiktokAPI.importProxies(proxiesText, folderId)
        if (result && result.success) {
          // Reload data after import
          await loadFolderStats()
          return result
        }
      }
    } catch (error) {
      console.error('Error importing proxies:', error)
      throw error
    }
  }

  return {
    // State
    proxies,
    folders,
    selectedFolder,
    loading,
    folderStats,
    filteredData,
    
    // Actions
    setSelectedFolder,
    loadFolders,
    loadFolderStats,
    loadFilteredProxies,
    loadProxiesForFolder,
    addProxy,
    deleteProxy,
    addFolder,
    deleteFolder,
    testProxy,
    importProxies
  }
} 