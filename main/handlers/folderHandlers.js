const { log, error } = require('../../lib/logger');
const folderHandlers = (storageManager) => {
  return {
    'get-folders': async (event, type) => {
      try {
        log(`📬 get-folders handler called with type: ${type}`);
        const result = await storageManager.getAllFolders(type)
        log('📬 get-folders result:', JSON.stringify(result));

        // Ensure we return the correct structure
        if (result && result.success) {
          if (type === 'proxies' && result.folders && result.folders.proxies) {
            // Convert to simple array format for easier handling in frontend
            log('📬 Simplifying response for proxies:', 
              Array.isArray(result.folders.proxies) ? result.folders.proxies.length : 'not array');
            return {
              success: true,
              folders: Array.isArray(result.folders.proxies) ? result.folders.proxies : []
            };
          }
        }
        
        return result
      } catch (err) {
        error('Error getting folders:', err)
        return { success: false, error: err.message }
      }
    },

    'create-folder': async (event, type, folderData) => {
      try {
        const result = await storageManager.createFolder(type, folderData)
        return result
      } catch (err) {
        error('Error creating folder:', err)
        return { success: false, error: err.message }
      }
    },

    'delete-folder': async (event, type, folderId) => {
      try {
        const result = await storageManager.deleteFolder(type, folderId)
        return result
      } catch (err) {
        error('Error deleting folder:', err)
        return { success: false, error: err.message }
      }
    },

    // Reset folders data to default
    'reset-folders': async () => {
      try {
        const defaultFolders = await storageManager.resetFoldersData()
        return { success: true, data: defaultFolders }
      } catch (err) {
        error('Error resetting folders:', err)
        return { success: false, error: err.message }
      }
    },

    // Reset folders to default
    'reset-folders-to-default': async () => {
      try {
        const result = await storageManager.resetFoldersToDefault()
        return result
      } catch (err) {
        error('Error resetting folders to default:', err)
        return { success: false, error: err.message }
      }
    }
  }
}

module.exports = folderHandlers