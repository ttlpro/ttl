const { screen, BrowserWindow } = require('electron')
const path = require('path')

const createWindow = (windowName, options) => {
  const defaultSize = {
    width: options.width,
    height: options.height,
  }
  
  // Get screen bounds để tính center
  const bounds = screen.getPrimaryDisplay().bounds
  const defaultPosition = {
    x: (bounds.width - defaultSize.width) / 2,
    y: (bounds.height - defaultSize.height) / 2,
  }

  // Determine icon path based on environment
  const isProd = process.env.NODE_ENV === 'production'
  const iconPath = isProd 
    ? path.join(process.resourcesPath, 'icon.png')
    : path.join(__dirname, '../resources/icon.png')

  const win = new BrowserWindow({
    ...defaultSize,
    ...defaultPosition,
    ...options,
    title: 'TTL TikTok Live',
    icon: require('fs').existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      ...options.webPreferences,
    },
    enableWebSQL: true,
    enablePreferredSizeMode: true,
    enableLargerThanScreen: true,
  })

  win.webContents.on('dom-ready', () => {
    win.webContents.executeJavaScript(`
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'ime-mode');
      meta.setAttribute('content', 'auto');
      document.head.appendChild(meta);
    `);
  });

  return win
}

module.exports = { createWindow }
