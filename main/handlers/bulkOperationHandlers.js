const { log, error } = require('../../lib/logger');

const bulkOperationHandlers = (storageManager) => {
  return {
    'set-account-proxy': async (event, accountId, proxyId) => {
      try {
        log(`Setting proxy ${proxyId} for account ${accountId}`);
        
        // Kiểm tra proxy có tồn tại không
        const allProxies = await storageManager.getAllProxies();
        const proxy = allProxies.find(p => p.id === proxyId);
        
        if (proxyId && !proxy) {
          return { success: false, error: 'Proxy không tồn tại' };
        }
        
        const result = await storageManager.updateAccount(accountId, { 
          proxyId: proxyId || null,
          updatedAt: new Date().toISOString()
        });
        
        log(`Proxy assignment result:`, result);
        return result;
      } catch (err) {
        error('Error setting account proxy:', err);
        return { success: false, error: err.message };
      }
    },

    'bulk-set-proxy': async (event, accountIds, proxyFolderId, accountsPerProxy, selectedProxies = null) => {
      try {
        log(`Bulk setting proxy for ${accountIds.length} accounts`);
        log('RAW PARAMETERS:', { accountIds, proxyFolderId, accountsPerProxy, selectedProxies });
        log('selectedProxies type:', typeof selectedProxies, 'isArray:', Array.isArray(selectedProxies));
        
        let availableProxies = [];
        
        if (selectedProxies && selectedProxies.length > 0) {
          log('Using selected proxies:', selectedProxies);
          const allProxies = await storageManager.getAllProxies();
          availableProxies = allProxies.filter(proxy => selectedProxies.includes(proxy.id));
          log('Filtered to selected proxies:', availableProxies.length);
        } else {
          log('selectedProxies is empty/null, using all proxies from folder');
          // Fix: Đảm bảo getProxiesByFolder luôn trả về mảng hợp lệ
          const proxiesResult = await storageManager.getProxiesByFolder(proxyFolderId);
          availableProxies = Array.isArray(proxiesResult) ? proxiesResult : [];
          
          log(`Found ${availableProxies.length} proxies in folder ${proxyFolderId}`);
          log('Proxies details:', availableProxies.map(p => ({
            id: p.id,
            host: p.host || p.proxyInfo,
            folderId: p.folderId,
            status: p.status
          })));
          
          if (!availableProxies || availableProxies.length === 0) {
            // Thêm debug info để hiểu tại sao không có proxy
            const allProxies = await storageManager.getAllProxies();
            log(`Total proxies in system: ${allProxies.length}`);
            log('All proxies folder distribution:', allProxies.reduce((acc, p) => {
              const folderId = p.folderId || 'undefined';
              acc[folderId] = (acc[folderId] || 0) + 1;
              return acc;
            }, {}));
            
            return { success: false, error: 'Không tìm thấy proxy trong thư mục đã chọn' };
          }
        }
        
        if (availableProxies.length === 0) {
          return { success: false, error: 'Không có proxy khả dụng để gán' };
        }
        
        const settings = await storageManager.getSettings();
        const maxAccountsPerProxy = settings.maxAccountsPerProxy || accountsPerProxy || 1;
        
        const allAccounts = await storageManager.getAllAccounts();
        
        const proxiesWithSlots = availableProxies.map(proxy => {
          const assignedAccountsCount = allAccounts.filter(acc => acc.proxyId === proxy.id).length;
          const availableSlots = Math.max(0, maxAccountsPerProxy - assignedAccountsCount);
          return {
            ...proxy,
            availableSlots: Math.min(availableSlots, accountsPerProxy)
          };
        });
        
        const usableProxies = proxiesWithSlots.filter(proxy => proxy.availableSlots > 0);
        
        if (usableProxies.length === 0) {
          return { 
            success: false, 
            error: 'Tất cả proxy đã đạt giới hạn số lượng tài khoản' 
          };
        }
        
        usableProxies.sort((a, b) => b.availableSlots - a.availableSlots);
        
        const totalAvailableSlots = usableProxies.reduce((sum, proxy) => sum + proxy.availableSlots, 0);
        if (totalAvailableSlots < accountIds.length) {
          return { 
            success: false, 
            error: `Không đủ proxy khả dụng! Cần ${accountIds.length} slot nhưng chỉ có ${totalAvailableSlots} slot khả dụng.` 
          };
        }
        
        let assignedCount = 0;
        let accountIndex = 0;
        const errors = [];
        const assignments = [];
        
        for (const proxy of usableProxies) {
          if (accountIndex >= accountIds.length) break;
          
          for (let i = 0; i < proxy.availableSlots && accountIndex < accountIds.length; i++) {
            const accountId = accountIds[accountIndex];
            
            try {
              const result = await storageManager.updateAccount(accountId, {
                proxyId: proxy.id,
                updatedAt: new Date().toISOString()
              });
              
              if (result.success) {
                assignedCount++;
                assignments.push({
                  accountId,
                  proxyId: proxy.id,
                  proxyHost: proxy.host || proxy.proxyInfo
                });
              } else {
                errors.push(`Account ${accountId}: ${result.error}`);
              }
            } catch (err) {
              errors.push(`Account ${accountId}: ${err.message}`);
            }
            
            accountIndex++;
          }
        }
        
        return {
          success: assignedCount > 0,
          code: 'proxyAssigned',
          params: { assigned: assignedCount, total: accountIds.length },
          assignedCount,
          totalCount: accountIds.length,
          assignments,
          errors: errors.length > 0 ? errors : undefined
        };
      } catch (err) {
        log('Error in bulk-set-proxy:', err);
        return { success: false, error: err.message };
      }
    },

    'bulk-set-status': async (event, data) => {
      try {
        const { accountIds, status } = data;
        
        // Cập nhật trạng thái cho từng account
        let updateCount = 0;
        const errors = [];
        
        for (const accountId of accountIds) {
          try {
            const result = await storageManager.updateAccount(accountId, {
              status: status,
              updatedAt: new Date().toISOString()
            });
            
            if (result.success) {
              updateCount++;
            } else {
              errors.push(`Account ${accountId}: ${result.error}`);
            }
          } catch (err) {
            errors.push(`Account ${accountId}: ${err.message}`);
          }
        }
        
        return {
          success: updateCount > 0,
          message: `Đã cập nhật trạng thái ${updateCount}/${accountIds.length} tài khoản`,
          updateCount,
          totalCount: accountIds.length,
          errors: errors.length > 0 ? errors : undefined
        };
      } catch (err) {
        log('Error in bulk set status:', err);
        return { success: false, error: err.message };
      }
    },

    'bulk-remove-proxy': async (event, accountIds) => {
      try {
        const result = await storageManager.bulkRemoveProxy(accountIds)
        return result
      } catch (err) {
        log('Error bulk removing proxy:', err)
        return { success: false, error: err.message }
      }
    },

    'bulk-move-to-folder': async (event, accountIds, folderId) => {
      try {
        const result = await storageManager.bulkMoveToFolder(accountIds, folderId)
        return result
      } catch (err) {
        log('Error bulk moving to folder:', err)
        return { success: false, error: err.message }
      }
    },

    'bulk-delete-accounts': async (event, accountIds) => {
      try {
        let deleted = 0;
        for (const accountId of accountIds) {
          const result = await storageManager.deleteAccount(accountId);
          if (result.success) deleted++;
        }
        return { 
          success: true, 
          deleted,
          message: `Đã xóa ${deleted} tài khoản`
        };
      } catch (err) {
        log('Error bulk deleting accounts:', err);
        return { success: false, error: err.message };
      }
    },

    'bulk-delete-proxies': async (event, proxyIds) => {
      try {
        let deleted = 0;
        for (const proxyId of proxyIds) {
          const result = await storageManager.deleteProxy(proxyId);
          if (result.success) deleted++;
        }
        return { 
          success: true, 
          deleted,
          message: `Đã xóa ${deleted} proxy`
        };
      } catch (err) {
        log('Error bulk deleting proxies:', err);
        return { success: false, error: err.message };
      }
    },

    'bulk-export-accounts': async (event, accountIds, format) => {
      try {
        const result = await storageManager.exportAccountsToText(format, accountIds);
        return result;
      } catch (err) {
        log('Error bulk exporting accounts:', err);
        return { success: false, error: err.message };
      }
    },

    'bulk-export-proxies': async (event, proxyIds, format) => {
      try {
        const result = await storageManager.exportProxies(format, proxyIds);
        return result;
      } catch (err) {
        log('Error bulk exporting proxies:', err);
        return { success: false, error: err.message };
      }
    },

    'validate-proxy-assignment': async (event, accountIds, proxyId) => {
      try {
        const allProxies = await storageManager.getAllProxies();
        const proxy = allProxies.find(p => p.id === proxyId);
        
        if (!proxy) {
          return { success: false, error: 'Proxy không tồn tại' };
        }
        
        const allAccounts = await storageManager.getAllAccounts();
        const validAccountIds = accountIds.filter(id => 
          allAccounts.find(acc => acc.id === id)
        );
        
        if (validAccountIds.length !== accountIds.length) {
          return { 
            success: false, 
            error: `${accountIds.length - validAccountIds.length} tài khoản không tồn tại` 
          };
        }
        
        return { 
          success: true, 
          validAccountIds,
          proxy: {
            id: proxy.id,
            host: proxy.host,
            port: proxy.port,
            status: proxy.status
          }
        };
      } catch (err) {
        log('Error validating proxy assignment:', err);
        return { success: false, error: err.message };
      }
    },

    'get-account-proxy-details': async (event, accountId) => {
      try {
        const accounts = await storageManager.getAllAccounts();
        const account = accounts.find(acc => acc.id === accountId);
        
        if (!account || !account.proxyId) {
          return { success: true, proxy: null };
        }
        
        const proxies = await storageManager.getAllProxies();
        const proxy = proxies.find(p => p.id === account.proxyId);
        
        return { success: true, proxy };
      } catch (err) {
        log('Error getting account proxy details:', err);
        return { success: false, error: err.message };
      }
    },

    'bulk-move-accounts-to-folder': async (event, data) => {
      try {
        const { accountIds, folderId } = data;
        
        // Kiểm tra xem folder tồn tại không
        const folder = await storageManager.getFolderById(folderId);
        if (!folder) {
          return { success: false, error: 'Folder not found' };
        }
        
        // Chuyển từng account vào folder
        let moveCount = 0;
        const errors = [];
        
        for (const accountId of accountIds) {
          try {
            const result = await storageManager.updateAccount(accountId, {
              folderId: folderId,
              updatedAt: new Date().toISOString()
            });
            
            if (result.success) {
              moveCount++;
            } else {
              errors.push(`Account ${accountId}: ${result.error}`);
            }
          } catch (err) {
            errors.push(`Account ${accountId}: ${err.message}`);
          }
        }
        
        return {
          success: moveCount > 0,
          message: `Đã chuyển ${moveCount}/${accountIds.length} tài khoản`,
          moveCount,
          totalCount: accountIds.length,
          errors: errors.length > 0 ? errors : undefined
        };
      } catch (err) {
        log('Error in bulk move accounts to folder:', err);
        return { success: false, error: err.message };
      }
    }
  }
}

module.exports = bulkOperationHandlers