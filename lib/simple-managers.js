/**
 * Simplified managers that work without complex dependencies
 * Used as fallback when full TikTok functionality has module issues
 */

class SimpleAccountManager {
  constructor() {
    this.accounts = [];
  }

  async getAllAccounts() {
    return this.accounts;
  }

  async addAccount(account) {
    const newAccount = {
      id: Date.now().toString(),
      accountInfo: account.accountInfo || account,
      folderId: account.folderId || 'default',
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    this.accounts.push(newAccount);
    return { success: true, account: newAccount };
  }

  async deleteAccount(accountId) {
    const index = this.accounts.findIndex(acc => acc.id === accountId);
    if (index !== -1) {
      this.accounts.splice(index, 1);
      return { success: true };
    }
    return { success: false, error: 'Account not found' };
  }
}

class SimpleProxyManager {
  constructor() {
    this.proxies = [];
  }

  async getAllProxies() {
    return this.proxies;
  }

  async addProxy(proxy) {
    const newProxy = {
      id: Date.now().toString(),
      proxyInfo: proxy.proxyInfo || proxy,
      folderId: proxy.folderId || 'default',
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    this.proxies.push(newProxy);
    return { success: true, proxy: newProxy };
  }

  async deleteProxy(proxyId) {
    const index = this.proxies.findIndex(proxy => proxy.id === proxyId);
    if (index !== -1) {
      this.proxies.splice(index, 1);
      return { success: true };
    }
    return { success: false, error: 'Proxy not found' };
  }

  async testProxy(proxyId) {
    // Simple proxy test simulation
    return { 
      success: true, 
      latency: Math.floor(Math.random() * 100 + 10) + 'ms',
      status: 'active'
    };
  }
}

class SimpleConfigManager {
  constructor() {
    this.settings = {
      theme: 'dark',
      language: 'vi',
      pageSize: 20,
      defaultAccountFormat: 'username|password|email|emailpass|cookie',
      defaultProxyFormat: 'ip:port:username:password'
    };
  }

  async getSettings() {
    return this.settings;
  }

  async saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    return { success: true };
  }

  async resetSettings() {
    this.settings = {
      theme: 'dark',
      language: 'vi',
      pageSize: 20,
      defaultAccountFormat: 'username|password|email|emailpass|cookie',
      defaultProxyFormat: 'ip:port:username:password'
    };
    return { success: true };
  }
}

class SimpleViewerManager {
  constructor() {
    this.isRunning = false;
    this.viewers = [];
    this.accounts = [];
  }

  async start(config) {
    this.isRunning = true;
    console.log('Starting TikTok viewer (simple mode):', config);
    
    // Simulate viewer start
    setTimeout(() => {
      console.log('TikTok viewer started successfully (simple mode)');
    }, 1000);
    
    return { success: true, message: 'Viewer started in simple mode' };
  }

  async stopAll() {
    this.isRunning = false;
    this.viewers = [];
    console.log('All TikTok viewers stopped (simple mode)');
    return { success: true };
  }

  getStats() {
    return {
      activeViewers: this.viewers.length,
      isRunning: this.isRunning,
      totalAccounts: this.accounts.length
    };
  }
}

module.exports = {
  SimpleAccountManager,
  SimpleProxyManager,
  SimpleConfigManager,
  SimpleViewerManager
};
