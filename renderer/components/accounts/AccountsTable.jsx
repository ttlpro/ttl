import React from 'react'
import { useTranslation } from 'react-i18next'
import { 
  UserIcon,
  TrashIcon,
  PencilIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'

export default function AccountsTable({
  accounts,
  selectedAccountIds,
  handleSelectAccount,
  handleSelectAll,
  handleDeleteAccount,
  proxies = [],
  setIsAddModalOpen,
  sortConfig,
  onSortChange
}) {
  const { t } = useTranslation('common')

  const handleSort = (field) => {
    if (onSortChange) {
      const direction = 
        sortConfig?.field === field && sortConfig?.direction === 'asc' 
          ? 'desc' 
          : 'asc'
      onSortChange({ field, direction })
    }
  }

  const getSortIcon = (field) => {
    if (sortConfig?.field !== field) {
      return <ChevronUpIcon className="w-4 h-4 text-gray-400" />
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUpIcon className="w-4 h-4 text-blue-600" />
      : <ChevronDownIcon className="w-4 h-4 text-blue-600" />
  }

  const getProxyDisplay = (account) => {
    // Check multiple possible proxy field names and find the associated proxy
    const proxyId = account.proxyId || account.proxy_id || account.proxyID;
    const proxyInfo = account.proxy; // Direct proxy string like "host:port" or "user:pass@host:port"
    
    if (proxyId) {
      // Find proxy details from proxies array
      const proxyDetails = proxies.find(p => p.id === proxyId);
      if (proxyDetails) {
        let host, port;
        
        // Extract host:port from different possible formats
        if (proxyDetails.host && proxyDetails.port) {
          host = proxyDetails.host;
          port = proxyDetails.port;
        } else if (proxyDetails.proxyInfo) {
          // Handle formats like "user:pass@host:port" or "host:port:user:pass" or "host:port"
          const info = proxyDetails.proxyInfo;
          if (info.includes('@')) {
            // Format: user:pass@host:port
            const [, hostPort] = info.split('@');
            [host, port] = hostPort.split(':');
          } else {
            // Format: host:port:user:pass or host:port
            const parts = info.split(':');
            host = parts[0];
            port = parts[1];
          }
        }
        
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
            {host}:{port || t('common.unknown')}
          </span>
        );
      } else {
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
            {t('accounts.table.proxyId', { proxyId })}
          </span>
        );
      }
    } else if (proxyInfo) {
      // Direct proxy string - extract only host:port
      let host, port;
      
      if (proxyInfo.includes('@')) {
        // Format: user:pass@host:port
        const [, hostPort] = proxyInfo.split('@');
        [host, port] = hostPort.split(':');
      } else {
        // Format: host:port:user:pass or host:port
        const parts = proxyInfo.split(':');
        host = parts[0];
        port = parts[1];
      }
      
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
          {host}:{port}
        </span>
      );
    } else {
      return (
        <span className="text-gray-400 dark:text-gray-500">{t('accounts.table.noProxy')}</span>
      );
    }
  }

  const getStatusDisplay = (status) => {
    const statusConfig = {
      active: { text: t('accounts.status.active'), class: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' },
      inactive: { text: t('accounts.status.inactive'), class: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' },
      suspended: { text: t('accounts.status.suspended'), class: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' },
      error: { text: t('accounts.status.error'), class: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' },
      connecting: { text: t('accounts.status.connecting'), class: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' },
      '403': { text: t('accounts.status.403'), class: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' },
      '403fetch': { text: t('accounts.status.403fetch'), class: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' },
      die: { text: t('accounts.status.die'), class: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' },
      diecookie: { text: t('accounts.status.diecookie'), class: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' },
      cookiedie: { text: t('accounts.status.cookiedie'), class: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' }
    }
    
    const config = statusConfig[status] || { text: t('accounts.status.unknown'), class: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' }
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.class}`}>
        {config.text}
      </span>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="card flex-1 min-h-0 flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('accounts.table.title')}</h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {accounts.length} {t('accounts.folders.accountCount')}
            </div>
          </div>
        </div>
        
        <div className="p-12 text-center flex-1 flex flex-col justify-center">
          <UserIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('accounts.empty.title')}</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{t('accounts.empty.description')}</p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary"
          >
            {t('accounts.empty.addFirst')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card flex-1 min-h-0 flex flex-col">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('accounts.table.title')}</h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {accounts.length} {t('accounts.folders.accountCount')}
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedAccountIds.length === accounts.length && accounts.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div className="flex items-center cursor-pointer" onClick={() => handleSort('username')}>
                  {t('accounts.table.username')}
                  {getSortIcon('username')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div className="flex items-center cursor-pointer" onClick={() => handleSort('status')}>
                  {t('accounts.table.status')}
                  {getSortIcon('status')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div className="flex items-center cursor-pointer" onClick={() => handleSort('proxyId')}>
                  {t('accounts.table.proxy')}
                  {getSortIcon('proxyId')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('accounts.table.currentRooms')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('accounts.table.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {accounts.map((account) => (
              <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 theme-transition">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedAccountIds.includes(account.id)}
                    onChange={(e) => handleSelectAccount(account.id, e.target.checked)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-tiktok-primary rounded-lg flex items-center justify-center overflow-hidden">
                      {account.avatarThumb ? (
                        <img 
                          src={account.avatarThumb} 
                          alt={account.username}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <UserIcon className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{account.username}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {account.roomUsername || '***'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusDisplay(account.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {getProxyDisplay(account)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                    {account.currentRooms || 0}/5
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => console.log('Edit account:', account.id)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors duration-200"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(account.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors duration-200"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}