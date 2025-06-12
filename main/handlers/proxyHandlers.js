const { log, error } = require('../../lib/logger');

const proxyHandlers = (proxyManager, storageManager) => {
  return {
    'get-proxies': async () => {
      try {
        return await proxyManager.getAllProxies()
      } catch (err) {
        console.error('Error getting proxies:', err)
        return []
      }
    },

    'add-proxy': async (event, proxy) => {
      try {
        return await proxyManager.addProxy(proxy)
      } catch (err) {
        console.error('Error adding proxy:', err)
        return { success: false, error: err.message }
      }
    },

    'delete-proxy': async (event, proxyId) => {
      try {
        return await proxyManager.deleteProxy(proxyId)
      } catch (err) {
        console.error('Error deleting proxy:', err)
        return { success: false, error: err.message }
      }
    },

    'test-proxy': async (event, proxyId) => {
      try {
        const result = await proxyManager.testProxy(proxyId)
        return { success: true, result }
      } catch (err) {
        console.error('Error testing proxy:', err)
        return { success: false, error: err.message }
      }
    },

    'get-proxies-by-folder': async (event, folderId) => {
      try {
        const proxies = await proxyManager.getProxiesByFolder(folderId)
        return { success: true, proxies }
      } catch (err) {
        console.error('Error getting proxies by folder:', err)
        return { success: false, error: err.message }
      }
    },

    'get-proxies-with-filter': async (event, filterOptions, sortOptions) => {
      try {
        const proxies = await proxyManager.getAllProxies()
        let filtered = [...proxies]

        // Apply filters
        if (filterOptions.folder && filterOptions.folder !== 'all') {
          filtered = filtered.filter(proxy => proxy.folderId === filterOptions.folder)
        }

        if (filterOptions.status && filterOptions.status !== 'all') {
          filtered = filtered.filter(proxy => proxy.status === filterOptions.status)
        }

        if (filterOptions.type && filterOptions.type !== 'all') {
          filtered = filtered.filter(proxy => proxy.type === filterOptions.type)
        }

        if (filterOptions.searchTerm) {
          const searchTerm = filterOptions.searchTerm.toLowerCase()
          filtered = filtered.filter(proxy => 
            (proxy.host && proxy.host.toLowerCase().includes(searchTerm)) ||
            (proxy.proxyInfo && proxy.proxyInfo.toLowerCase().includes(searchTerm)) ||
            (proxy.description && proxy.description.toLowerCase().includes(searchTerm))
          )
        }

        // Apply sorting
        if (sortOptions && sortOptions.sortBy) {
          filtered.sort((a, b) => {
            let aVal, bVal
            switch (sortOptions.sortBy) {
              case 'createdAt':
                aVal = new Date(a.createdAt || 0)
                bVal = new Date(b.createdAt || 0)
                break
              case 'status':
                const statusOrder = { 'active': 1, 'error': 2, 'untested': 3 }
                aVal = statusOrder[a.status] || 4
                bVal = statusOrder[b.status] || 4
                break
              case 'lastTested':
                aVal = new Date(a.lastTested || 0)
                bVal = new Date(b.lastTested || 0)
                break
              case 'host':
                aVal = a.host || ''
                bVal = b.host || ''
                break
              default:
                return 0
            }
            
            if (sortOptions.sortOrder === 'desc') {
              return bVal > aVal ? 1 : bVal < aVal ? -1 : 0
            } else {
              return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
            }
          })
        }

        // Apply pagination
        const page = filterOptions.page || 1
        const pageSize = filterOptions.pageSize || 20
        const startIndex = (page - 1) * pageSize
        const endIndex = startIndex + pageSize
        const paginatedProxies = filtered.slice(startIndex, endIndex)

        return {
          success: true,
          proxies: paginatedProxies,
          totalCount: filtered.length,
          totalPages: Math.ceil(filtered.length / pageSize),
          currentPage: page
        }
      } catch (err) {
        console.error('Error getting filtered proxies:', err)
        return { success: false, error: err.message, proxies: [], totalCount: 0, totalPages: 0 }
      }
    },

    'import-proxies-from-text': async (event, text, folderId = 'default') => {
      try {
        log(`📥 Importing proxies from text. Length: ${text.length}, FolderId: ${folderId}`);
        
        if (!folderId || folderId === '') {
          folderId = 'default';
          log('📥 FolderId was empty, using default folder');
        }
        
        // Gọi qua proxyManager thay vì storageManager
        const result = await proxyManager.importFromText(text, folderId);
        log('📥 Import result:', JSON.stringify(result));
        
        if (!result.success) {
          error('📥 Import failed:', result.error);
          return { success: false, error: result.error };
        }
        
        return { 
          success: true, 
          message: `Đã nhập ${result.imported || 0} proxy thành công`, 
          imported: result.imported || 0,
          total: result.total || 0,
          results: result.results || []
        };
      } catch (err) {
        error('Error importing proxies from text:', err);
        return { success: false, error: err.message };
      }
    },

    'import-proxies': async (event, folderId = 'default') => {
      try {
        // Mở file dialog để người dùng chọn file
        const { dialog } = require('electron')
        const fs = require('fs').promises
        
        const result = await dialog.showOpenDialog({
          title: 'Import Proxies',
          filters: [
            { name: 'Text Files', extensions: ['txt'] },
            { name: 'All Files', extensions: ['*'] }
          ],
          properties: ['openFile']
        })

        if (result.canceled || !result.filePaths.length) {
          return { success: false, error: 'No file selected' }
        }

        // Đọc nội dung file
        const filePath = result.filePaths[0]
        const fileContent = await fs.readFile(filePath, 'utf8')
        
        // Import từ nội dung file
        const importResult = await proxyManager.importFromText(fileContent, folderId)
        return { 
          success: true, 
          message: `Imported ${importResult.imported} proxies successfully`, 
          count: importResult.imported,
          total: importResult.total,
          proxies: importResult.proxies
        }
      } catch (err) {
        console.error('Error importing proxies from file:', err)
        return { success: false, error: err.message }
      }
    },

    'import-proxies-from-file': async (event, filePath, folderId = 'default') => {
      try {
        // Validate filePath
        if (!filePath || typeof filePath !== 'string') {
          return { 
            success: false, 
            error: 'Invalid file path provided. File path must be a valid string.' 
          }
        }

        const fs = require('fs').promises
        const fileContent = await fs.readFile(filePath, 'utf8')
        const result = await proxyManager.importFromText(fileContent, folderId)
        return { 
          success: true, 
          message: `Imported ${result.imported} proxies successfully`, 
          count: result.imported,
          total: result.total,
          proxies: result.proxies
        }
      } catch (err) {
        console.error('Error importing proxies from file:', err)
        return { success: false, error: err.message }
      }
    },

    'bulk-move-proxies-to-folder': async (event, proxyIds, folderId) => {
      try {
        console.log(`📤 Bulk moving ${proxyIds.length} proxies to folder ${folderId}`);
        const result = await proxyManager.bulkMoveProxiesToFolder(proxyIds, folderId);
        console.log(`📤 Bulk move result:`, result);
        return result;
      } catch (err) {
        console.error('Error bulk moving proxies to folder:', err);
        return { success: false, error: err.message };
      }
    },

    'bulk-test-proxies': async (event, proxyIds) => {
      try {
        console.log(`🔍 Bulk testing ${proxyIds.length} proxies`);
        const result = await proxyManager.bulkTestProxies(proxyIds);
        console.log(`🔍 Bulk test result:`, result);
        return result;
      } catch (err) {
        console.error('Error bulk testing proxies:', err);
        return { success: false, error: err.message };
      }
    },

    'export-proxies': async (event, format, proxyIds) => {
      try {
        console.log(`📤 Exporting proxies with format ${format}`);
        const result = await proxyManager.exportProxies(format, proxyIds);
        console.log(`📤 Export result:`, result);
        return result;
      } catch (err) {
        console.error('Error exporting proxies:', err);
        return { success: false, error: err.message };
      }
    }
  }
}

module.exports = proxyHandlers