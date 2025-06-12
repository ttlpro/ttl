import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  FunnelIcon,
  Bars3BottomLeftIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

export default function FilterAndSortBar({ 
  filters, 
  onFiltersChange,
  sortConfig,
  onSortChange,
  accounts,
  folders = [],
  proxies = [],
  proxyFolders = []
}) {
  const { t } = useTranslation('common')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [selectedAccountsInput, setSelectedAccountsInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  // Status options
  const statusOptions = [
    { value: 'all', label: t('accounts.filters.status.all') },
    { value: 'active', label: t('accounts.filters.status.active') },
    { value: 'inactive', label: t('accounts.filters.status.inactive') },
    { value: 'suspended', label: t('accounts.filters.status.suspended') },
    { value: 'error', label: t('accounts.filters.status.error') },
    { value: 'connecting', label: t('accounts.filters.status.connecting') },
    { value: '403', label: t('accounts.filters.status.403') },
    { value: '403fetch', label: t('accounts.filters.status.403fetch') },
    { value: 'die', label: t('accounts.filters.status.die') },
    { value: 'diecookie', label: t('accounts.filters.status.diecookie') }
  ]

  // Sort options
  const sortOptions = [
    { value: 'activeRooms', label: t('accounts.filters.sort.activeRooms') },
    { value: 'createdAt', label: t('accounts.filters.sort.createdAt') },
    { value: 'updatedAt', label: t('accounts.filters.sort.updatedAt') },
    { value: 'lastUsed', label: t('accounts.filters.sort.lastUsed') },
    { value: 'username', label: t('accounts.filters.sort.username') }
  ]

  const handleFilterChange = (key, value) => {
    onFiltersChange(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleRangeChange = (key, index, value) => {
    onFiltersChange(prev => ({
      ...prev,
      [key]: prev[key].map((item, i) => i === index ? value : item)
    }))
  }

  const resetFilters = () => {
    onFiltersChange({
      folder: 'all',
      status: 'all',
      proxy: 'all',
      proxyFolder: 'all',
      noProxy: false,
      maxActiveRooms: [0, 10],
      selectedAccounts: [],
      searchText: ''
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.folder !== 'all') count++
    if (filters.status !== 'all') count++
    if (filters.proxy !== 'all') count++
    if (filters.proxyFolder !== 'all') count++
    if (filters.noProxy) count++
    if (filters.maxActiveRooms[0] > 0 || filters.maxActiveRooms[1] < 10) count++
    if (filters.searchText.trim()) count++
    return count
  }

  const getFolderDisplayName = (folder) => {
    if (folder.id === 'accounts-default' || folder.name === 'Mặc định') {
      return t('common.default')
    }
    return folder.name
  }

  useEffect(() => {
    if (filters.selectedAccounts.length > 0 && !selectedAccountsInput) {
      setSelectedAccountsInput(filters.selectedAccounts.join(', '))
    }
  }, [])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
      {/* Basic Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-64">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('accounts.filters.searchPlaceholder')}
            value={filters.searchText}
            onChange={(e) => handleFilterChange('searchText', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Folder Filter */}
        <select
          value={filters.folder}
          onChange={(e) => handleFilterChange('folder', e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white min-w-40"
        >
          <option value="all">{t('accounts.filters.folder.all')}</option>
          {folders.map(folder => (
            <option key={folder.id} value={folder.id}>
              {getFolderDisplayName(folder)}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white min-w-48"
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Sort */}
        <div className="flex items-center space-x-2">
          <Bars3BottomLeftIcon className="h-5 w-5 text-gray-400" />
          <select
            value={sortConfig.field}
            onChange={(e) => onSortChange({ field: e.target.value, direction: sortConfig.direction })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white min-w-48"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => onSortChange({ 
              field: sortConfig.field, 
              direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' 
            })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700 dark:text-white"
          >
            {sortConfig.direction === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700 dark:text-white"
        >
          <FunnelIcon className="h-5 w-5 mr-2" />
          {t('accounts.filters.advanced')}
          {getActiveFiltersCount() > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
              {getActiveFiltersCount()}
            </span>
          )}
          <ChevronDownIcon className={`h-4 w-4 ml-2 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
        </button>

        {/* Reset Filters */}
        {getActiveFiltersCount() > 0 && (
          <button
            onClick={resetFilters}
            className="flex items-center px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
          >
            <XMarkIcon className="h-5 w-5 mr-1" />
            {t('accounts.filters.reset')}
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Proxy Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('accounts.filters.proxy.title')}
            </label>
            <select
              value={filters.proxy}
              onChange={(e) => handleFilterChange('proxy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">{t('accounts.filters.proxy.all')}</option>
              <option value="none">{t('accounts.filters.proxy.none')}</option>
              {proxies.map(proxy => (
                <option key={proxy.id} value={proxy.id}>
                  {proxy.host}:{proxy.port}
                </option>
              ))}
            </select>
          </div>

          {/* Proxy Folder Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('accounts.filters.proxyFolder.title')}
            </label>
            <select
              value={filters.proxyFolder}
              onChange={(e) => handleFilterChange('proxyFolder', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">{t('accounts.filters.proxyFolder.all')}</option>
              {proxyFolders.map(folder => (
                <option key={folder.id} value={folder.id}>
                  {getFolderDisplayName(folder)}
                </option>
              ))}
            </select>
          </div>

          {/* No Proxy Checkbox */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.noProxy}
                onChange={(e) => handleFilterChange('noProxy', e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('accounts.filters.noProxy')}
              </span>
            </label>
          </div>

          {/* Active Rooms Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('accounts.filters.activeRooms.title')}: {filters.maxActiveRooms[0]} - {filters.maxActiveRooms[1]}
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{t('common.from')}:</span>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={filters.maxActiveRooms[0]}
                  onChange={(e) => handleRangeChange('maxActiveRooms', 0, parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{t('common.to')}:</span>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={filters.maxActiveRooms[1]}
                  onChange={(e) => handleRangeChange('maxActiveRooms', 1, parseInt(e.target.value) || 10)}
                  className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Selected Accounts Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('accounts.filters.selectedAccounts.title')}
            </label>
            <input
              type="text"
              placeholder={t('accounts.filters.selectedAccounts.placeholder')}
              value={selectedAccountsInput}
              onChange={(e) => {
                const value = e.target.value
                setSelectedAccountsInput(value)
                
                if (!value.trim()) {
                  handleFilterChange('selectedAccounts', [])
                  return
                }
                
                try {
                  const ranges = value.split(',').map(item => item.trim())
                  const selectedIds = []
                  
                  ranges.forEach(range => {
                    if (!range) return
                    
                    if (range.includes('-')) {
                      const parts = range.split('-')
                      if (parts.length === 2 && parts[0] && parts[1]) {
                        const [start, end] = parts.map(n => parseInt(n.trim()))
                        if (!isNaN(start) && !isNaN(end)) {
                          for (let i = start; i <= end; i++) {
                            selectedIds.push(i)
                          }
                        }
                      }
                    } else {
                      const num = parseInt(range)
                      if (!isNaN(num)) {
                        selectedIds.push(num)
                      }
                    }
                  })
                  
                  if (selectedIds.length > 0) {
                    handleFilterChange('selectedAccounts', [...new Set(selectedIds)].sort((a, b) => a - b))
                  } else {
                    handleFilterChange('selectedAccounts', [])
                  }
                } catch (error) {
                  handleFilterChange('selectedAccounts', [])
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('accounts.filters.selectedAccounts.description')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}