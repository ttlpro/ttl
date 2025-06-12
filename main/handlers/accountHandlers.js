const { log, error } = require('../../lib/logger');

const accountHandlers = (accountManager, storageManager) => {
  return {
    'get-accounts': async () => {
      try {
        return await accountManager.getAllAccounts()
      } catch (err) {
        console.error('Error getting accounts:', err)
        return []
      }
    },

    'add-account': async (event, account) => {
      try {
        log('📥 Gọi add-account');
        
        // Kiểm tra license trước khi thêm account
        const licenseActive = await storageManager.isLicenseActive();
        if (!licenseActive) {
          return {
            success: false,
            error: 'License not active - Account management feature is disabled'
          };
        }

        // Kiểm tra license limits
        const currentAccounts = await storageManager.getAllAccounts();
        const limitResult = await storageManager.checkAccountLimit(currentAccounts.length + 1);
        
        if (!limitResult.allowed) {
          return {
            success: false,
            error: limitResult.message || 'Cannot add account - license limit exceeded'
          };
        }
        
        const result = await accountManager.addAccount(account);
        return result;
      } catch (err) {
        error('❌ Lỗi khi thêm account:', err);
        return { success: false, error: err.message };
      }
    },

    'delete-account': async (event, accountId) => {
      try {
        return await accountManager.deleteAccount(accountId)
      } catch (err) {
        console.error('Error deleting account:', err)
        return { success: false, error: err.message }
      }
    },

    'update-account': async (event, accountId, data) => {
      try {
        const result = await storageManager.updateAccount(accountId, data)
        return result
      } catch (err) {
        console.error('Error updating account:', err)
        return { success: false, error: err.message }
      }
    },

    'get-accounts-by-folder': async (event, folderId) => {
      try {
        const accounts = await accountManager.getAccountsByFolder(folderId)
        return { success: true, accounts }
      } catch (err) {
        console.error('Error getting accounts by folder:', err)
        return { success: false, error: err.message }
      }
    },

    'get-accounts-with-filter': async (event, filterOptions, sortOptions) => {
      try {
        const accounts = await storageManager.getAllAccounts()
        let filtered = [...accounts]

        // Apply filters
        if (filterOptions.folder && filterOptions.folder !== 'all') {
          filtered = filtered.filter(acc => acc.folderId === filterOptions.folder)
        }

        if (filterOptions.status && filterOptions.status !== 'all') {
          filtered = filtered.filter(acc => acc.status === filterOptions.status)
        }

        if (filterOptions.proxy) {
          if (filterOptions.proxy === 'with-proxy') {
            filtered = filtered.filter(acc => acc.proxy)
          } else if (filterOptions.proxy === 'without-proxy') {
            filtered = filtered.filter(acc => !acc.proxy)
          }
        }

        if (filterOptions.maxCurrentRooms !== undefined) {
          filtered = filtered.filter(acc => (acc.currentRooms || 0) <= filterOptions.maxCurrentRooms)
        }

        // Apply sorting
        if (sortOptions && sortOptions.sortBy) {
          filtered.sort((a, b) => {
            let aVal, bVal
            switch (sortOptions.sortBy) {
              case 'currentRooms':
                aVal = a.currentRooms || 0
                bVal = b.currentRooms || 0
                break
              case 'createdAt':
                aVal = new Date(a.createdAt || 0)
                bVal = new Date(b.createdAt || 0)
                break
              case 'lastViewed':
                aVal = new Date(a.lastViewed || 0)
                bVal = new Date(b.lastViewed || 0)
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

        return { success: true, accounts: filtered }
      } catch (err) {
        console.error('Error getting filtered accounts:', err)
        return { success: false, error: err.message, accounts: [] }
      }
    },

    'import-accounts-from-text': async (event, importText, folderId = null) => {
      try {
        log(`📥 Gọi import-accounts-from-text với text dài ${importText.length} và folder ${folderId}`);
        
        // Kiểm tra license trước khi import
        const licenseActive = await storageManager.isLicenseActive();
        if (!licenseActive) {
          return {
            success: false,
            error: 'License not active - Account management feature is disabled'
          };
        }

        // Đếm số accounts sẽ được import
        const lines = importText.trim().split('\n').filter(line => line.trim());
        const accountCount = lines.length;
        
        // Kiểm tra license limits
        const currentAccounts = await storageManager.getAllAccounts();
        const limitResult = await storageManager.checkAccountLimit(currentAccounts.length + accountCount);
        
        if (!limitResult.allowed) {
          return {
            success: false,
            error: limitResult.message || `Cannot import ${accountCount} accounts - license limit exceeded`
          };
        }
        
        const result = await storageManager.importAccountsFromText(importText, folderId);
        return result;
      } catch (err) {
        error('❌ Lỗi khi import accounts từ text:', err);
        return { success: false, error: err.message };
      }
    },

    'import-accounts-with-proxy-from-text': async (event, text, folderId = 'default') => {
      try {
        const result = await storageManager.importAccountsWithProxyFromText(text, folderId)
        return { 
          success: true, 
          message: `Imported ${result.imported} accounts and ${result.proxies.length} proxies successfully`, 
          accountCount: result.imported,
          proxyCount: result.proxies.length,
          total: result.total,
          accounts: result.accounts,
          proxies: result.proxies,
          errors: result.errors
        }
      } catch (err) {
        console.error('Error importing accounts with proxy from text:', err)
        return { success: false, error: err.message }
      }
    },

    'export-accounts-to-text': async (event, format, accountIds, folderId) => {
      try {
        const result = await storageManager.exportAccountsToText(format, accountIds, folderId)
        return result
      } catch (err) {
        console.error('Error exporting accounts to text:', err)
        return { success: false, error: err.message }
      }
    },

    'import-accounts': async (event, folderId = 'default') => {
      try {
        // Mở file dialog để người dùng chọn file
        const { dialog } = require('electron')
        const fs = require('fs').promises
        
        const result = await dialog.showOpenDialog({
          title: 'Import Accounts',
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
        
        // Kiểm tra filePath có phải là string không
        if (typeof filePath !== 'string') {
          console.error('Invalid filePath type:', typeof filePath, filePath);
          return { success: false, error: 'Invalid file path type. Expected string.' };
        }
        
        const fileContent = await fs.readFile(filePath, 'utf8')
        
        // Import từ nội dung file
        const importResult = await storageManager.importAccountsFromText(fileContent, folderId)
        return importResult
      } catch (err) {
        console.error('Error importing accounts from file:', err)
        return { success: false, error: err.message }
      }
    },

    'import-accounts-from-file': async (event, filePath, folderId = 'default') => {
      try {
        // Kiểm tra filePath có phải là string không
        if (typeof filePath !== 'string') {
          error('Invalid filePath type:', typeof filePath, filePath);
          return { success: false, error: 'Invalid file path type. Expected string.' };
        }

        const fs = require('fs').promises
        const fileContent = await fs.readFile(filePath, 'utf8')
        const result = await storageManager.importAccountsFromText(fileContent, folderId)
        return result
      } catch (err) {
        error('Error importing accounts from file:', err)
        return { success: false, error: error.message }
      }
    },

    'set-proxy-for-accounts': async (event, data) => {
      try {
        log('Setting proxy for accounts:', data);
        const { accountIds, proxyId, folderId, proxyFolderId, accountsPerProxy = 1, selectedProxies } = data;
        
        // Fix: Use proxyFolderId if folderId is not provided
        const targetFolderId = folderId || proxyFolderId;
        
        // Lấy cài đặt để sử dụng maxAccountsPerProxy
        const settings = await storageManager.getSettings();
        const maxAccountsPerProxy = settings.proxy?.maxAccountsPerProxy || 1;
        
        // DEBUG: Thêm logging chi tiết
        log('=== SET PROXY DEBUG INFO ===');
        log('Input parameters:', {
          accountIds: accountIds?.length || 0,
          proxyId,
          folderId,
          proxyFolderId,
          targetFolderId,
          accountsPerProxy,
          maxAccountsPerProxy,
          selectedProxies: selectedProxies?.length || 0
        });
        
        // Nếu có proxyId cụ thể, gán proxy đó
        if (proxyId && proxyId !== 'none') {
          log('Assigning specific proxy:', proxyId);
          let assignedCount = 0;
          const errors = [];
          const assignments = [];
          
          // Kiểm tra số lượng tài khoản đã gán cho proxy này
          const accounts = await storageManager.getAllAccounts();
          const accountsWithThisProxy = accounts.filter(acc => acc.proxyId === proxyId).length;
          
          if (accountsWithThisProxy + accountIds.length > maxAccountsPerProxy) {
            return {
              success: false,
              error: `Proxy này đã có ${accountsWithThisProxy} tài khoản, vượt quá giới hạn ${maxAccountsPerProxy} khi thêm ${accountIds.length} tài khoản mới`
            };
          }
          
          for (const accountId of accountIds) {
            try {
              const result = await storageManager.updateAccount(accountId, {
                proxyId: proxyId,
                updatedAt: new Date().toISOString()
              });
              
              if (result.success) {
                assignedCount++;
                assignments.push({ accountId, proxyId });
              } else {
                errors.push(`Account ${accountId}: ${result.error}`);
              }
            } catch (err) {
              errors.push(`Account ${accountId}: ${err.message}`);
            }
          }
          
          return {
            success: assignedCount > 0,
            message: `Đã gán proxy cho ${assignedCount}/${accountIds.length} tài khoản`,
            assignedCount,
            totalCount: accountIds.length,
            assignments,
            errors: errors.length > 0 ? errors : undefined
          };
        }
        
        // Nếu proxyId là 'none', xóa proxy khỏi accounts
        if (proxyId === 'none') {
          log('Removing proxy from accounts');
          let removedCount = 0;
          const errors = [];
          
          for (const accountId of accountIds) {
            try {
              const result = await storageManager.updateAccount(accountId, {
                proxyId: null,
                updatedAt: new Date().toISOString()
              });
              
              if (result.success) {
                removedCount++;
              } else {
                errors.push(`Account ${accountId}: ${result.error}`);
              }
            } catch (err) {
              errors.push(`Account ${accountId}: ${err.message}`);
            }
          }
          
          return {
            success: removedCount > 0,
            message: `Đã xóa proxy khỏi ${removedCount}/${accountIds.length} tài khoản`,
            removedCount,
            totalCount: accountIds.length,
            errors: errors.length > 0 ? errors : undefined
          };
        }
        
        // Nếu có folderId hoặc selectedProxies, sử dụng bulk assignment logic
        if (targetFolderId || selectedProxies) {
          log('Using bulk assignment with targetFolderId:', targetFolderId, 'selectedProxies:', selectedProxies?.length || 0);
          
          // DEBUG: Kiểm tra proxies trong folder trước khi gọi bulkSetProxy
          if (targetFolderId) {
            const folderProxies = await storageManager.getProxiesByFolder(targetFolderId);
            log(`DEBUG - Proxies in folder ${targetFolderId}:`, folderProxies.length);
            log('Proxy details:', folderProxies.map(p => ({
              id: p.id,
              folderId: p.folderId,
              host: p.host || p.proxyInfo,
              status: p.status
            })));
            
            if (folderProxies.length === 0) {
              // Get all proxies to debug folder distribution
              const allProxies = await storageManager.getAllProxies();
              log('DEBUG - All proxies folder distribution:', allProxies.reduce((acc, p) => {
                const folderIdKey = p.folderId || 'undefined';
                acc[folderIdKey] = (acc[folderIdKey] || 0) + 1;
                return acc;
              }, {}));
              
              log('DEBUG - Sample proxies:', allProxies.slice(0, 3).map(p => ({
                id: p.id,
                folderId: p.folderId,
                host: p.host || p.proxyInfo
              })));
            }
          }
          
          // Sử dụng maxAccountsPerProxy từ settings thay vì accountsPerProxy từ input
          return await storageManager.bulkSetProxy(accountIds, targetFolderId, maxAccountsPerProxy, selectedProxies);
        }
        
        log('ERROR: Invalid proxy assignment parameters');
        return { success: false, error: 'Invalid proxy assignment parameters' };
      } catch (err) {
        console.error('Error setting proxy for accounts:', err);
        return { success: false, error: err.message };
      }
    }
  }
}

module.exports = accountHandlers