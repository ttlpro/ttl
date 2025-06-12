// Import các handlers
const accountHandlers = require('./accountHandlers');
const folderHandlers = require('./folderHandlers');
const roomHandlers = require('./roomHandlers');
const taskHandlers = require('./taskHandlers');
const systemHandlers = require('./systemHandlers');
const proxyHandlers = require('./proxyHandlers');
const notificationHandlers = require('./notificationHandlers');
const authHandlers = require('./authHandlers');
const settingsHandlers = require('./settingsHandlers');
const updateHandlers = require('./updateHandlers');

// Export tất cả handlers
module.exports = (storageManager, viewerManager, authManager, updateManager) => {
  const handlers = {
    ...accountHandlers(storageManager),
    ...folderHandlers(storageManager),
    ...roomHandlers(storageManager, viewerManager),
    ...taskHandlers(storageManager),
    ...systemHandlers(storageManager),
    ...proxyHandlers(storageManager),
    ...notificationHandlers(), // Notification handlers không cần tham số
    ...authHandlers(authManager, storageManager), // Auth handlers cần authManager
    ...settingsHandlers(storageManager),
    ...updateHandlers(updateManager)
  };

  return handlers;
}; 