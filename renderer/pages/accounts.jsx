import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import StaticLayout from '../components/StaticLayout'
import ClientOnly from '../components/ClientOnly'
import BulkActionsModal from '../components/accounts/BulkActionsModal'
import SetProxyModal from '../components/accounts/SetProxyModal'
import FolderSidebar from '../components/accounts/FolderSidebar'
import AccountStats from '../components/accounts/AccountStats'
import AccountsTable from '../components/accounts/AccountsTable'
import AccountModals from '../components/accounts/AccountModals'
import FilterAndSortBar from '../components/accounts/FilterAndSortBar'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { ProtectedRoute, AuthPage } from '../components/auth'
import { useAccountsData } from '../hooks/useAccountsData'
import { useTranslation } from 'react-i18next'
import { 
  PlusIcon, 
  DocumentArrowUpIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export default function AccountsPage() {
  const { t, i18n } = useTranslation('common')
  const { isDarkMode } = useTheme()
  const { hasValidLicense, limits } = useAuth()
  
  // Client state
  const [isClient, setIsClient] = useState(false)
  
  // Use custom hook for data management
  const {
    accounts,
    folders,
    proxies,
    proxyFolders,
    selectedFolder,
    loading,
    folderStats,
    settings,
    setAccounts,
    setSelectedFolder,
    setLoading,
    loadFolders,
    loadAccountsForFolder,
    getProxyStatistics,
    loadSettings
  } = useAccountsData()

  // Local state for UI
  const [selectedAccountIds, setSelectedAccountIds] = useState([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isAddFolderModalOpen, setIsAddFolderModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isImportFileModalOpen, setIsImportFileModalOpen] = useState(false)
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false)
  const [isSetProxyModalOpen, setIsSetProxyModalOpen] = useState(false)
  const [newAccount, setNewAccount] = useState({ username: '', password: '', folderId: 'default' })
  const [newFolder, setNewFolder] = useState({ name: '', description: '', color: '#3B82F6' })
  const [importFileData, setImportFileData] = useState({
    folderId: selectedFolder || 'default'
  })

  // Cập nhật folderId mặc định khi selectedFolder thay đổi
  React.useEffect(() => {
    setImportFileData(prev => ({
      ...prev,
      folderId: selectedFolder || 'default'
    }))
  }, [selectedFolder])

  const [setProxyData, setSetProxyData] = useState({
    proxyFolderId: 'default',
    accountsPerProxy: 1,
    selectedProxies: []
  })

  // Filter and Sort State - Hệ thống mới thống nhất
  const [filters, setFilters] = useState({
    folder: 'all',
    status: 'all',
    proxy: 'all',
    proxyFolder: 'all',
    noProxy: false,
    maxActiveRooms: [0, 10],
    selectedAccounts: [],
    searchText: ''
  })

  const [sortBy, setSortBy] = useState('activeRooms')
  const [sortOrder, setSortOrder] = useState('desc')

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    totalCount: 0,
    totalPages: 0
  })

  // State for total accounts
  const [totalAccounts, setTotalAccounts] = useState(0)

  const getFilteredAndSortedAccounts = React.useMemo(() => {
    // Đảm bảo accounts là array
    let filteredAccounts = Array.isArray(accounts) ? [...accounts] : []

    // Apply search filter
    if (filters.searchText.trim()) {
      const searchTerm = filters.searchText.toLowerCase()
      filteredAccounts = filteredAccounts.filter(acc => {
        const matchUsername = acc.username.toLowerCase().includes(searchTerm)
        const matchProxy = acc.proxyId && Array.isArray(proxies) && proxies.find(p => p.id === acc.proxyId)?.proxyInfo?.toLowerCase().includes(searchTerm)
        return matchUsername || matchProxy
      })
    }

    // Apply folder filter
    if (filters.folder !== 'all') {
      filteredAccounts = filteredAccounts.filter(acc => acc.folderId === filters.folder)
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filteredAccounts = filteredAccounts.filter(acc => acc.status === filters.status)
    }

    // Apply proxy filters
    if (filters.noProxy) {
      filteredAccounts = filteredAccounts.filter(acc => !acc.proxyId)
    } else {
      if (filters.proxy !== 'all') {
        if (filters.proxy === 'none') {
          filteredAccounts = filteredAccounts.filter(acc => !acc.proxyId)
        } else {
          filteredAccounts = filteredAccounts.filter(acc => acc.proxyId === filters.proxy)
        }
      }

      if (filters.proxyFolder !== 'all') {
        const proxiesArray = Array.isArray(proxies) ? proxies : []
        const proxiesInFolder = proxiesArray.filter(p => p.folderId === filters.proxyFolder)
        if (proxiesInFolder.length === 0) {
          // Folder không có proxy → chỉ hiển thị accounts không có proxy
          filteredAccounts = filteredAccounts.filter(acc => !acc.proxyId)
        } else {
          const proxyIds = proxiesInFolder.map(p => p.id)
          filteredAccounts = filteredAccounts.filter(acc => 
            acc.proxyId && proxyIds.includes(acc.proxyId)
          )
        }
      }
    }

    // Apply active rooms filter
    const [minRooms, maxRooms] = filters.maxActiveRooms
    filteredAccounts = filteredAccounts.filter(acc => {
      const currentRooms = acc.currentRooms || acc.activeRooms || 0
      return currentRooms >= minRooms && currentRooms <= maxRooms
    })

    // Apply selected accounts filter
    if (filters.selectedAccounts.length > 0) {
      // ✅ ĐÚNG: Chuyển số thứ tự thành accounts theo index (1-based)
      const accountsArray = Array.isArray(accounts) ? accounts : []
      const selectedAccounts = filters.selectedAccounts
        .map(index => accountsArray[index - 1]) // Convert 1-based to 0-based
        .filter(acc => acc) // Remove undefined items
      
      const selectedAccountIds = selectedAccounts.map(acc => acc.id)
      
      filteredAccounts = filteredAccounts.filter(acc => 
        selectedAccountIds.includes(acc.id)
      )
    }

    // Apply sorting
    filteredAccounts.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'activeRooms':
          aValue = a.activeRooms || 0
          bValue = b.activeRooms || 0
          break
        case 'createdAt':
          aValue = new Date(a.createdAt || 0)
          bValue = new Date(b.createdAt || 0)
          break
        case 'updatedAt':
          aValue = new Date(a.updatedAt || 0)
          bValue = new Date(b.updatedAt || 0)
          break
        case 'lastUsed':
          aValue = new Date(a.lastUsed || 0)
          bValue = new Date(b.lastUsed || 0)
          break
        case 'username':
          aValue = (a.username || '').toLowerCase()
          bValue = (b.username || '').toLowerCase()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filteredAccounts
  }, [accounts, filters, sortBy, sortOrder, proxies])

  // Calculate pagination data
  const paginationData = React.useMemo(() => {
    const totalCount = getFilteredAndSortedAccounts.length
    const totalPages = Math.ceil(totalCount / pagination.pageSize)
    
    const startIndex = (pagination.page - 1) * pagination.pageSize
    const endIndex = startIndex + pagination.pageSize
    const paginatedAccounts = getFilteredAndSortedAccounts.slice(startIndex, endIndex)

    return {
      accounts: paginatedAccounts,
      totalCount,
      totalPages,
      allFilteredAccounts: getFilteredAndSortedAccounts
    }
  }, [getFilteredAndSortedAccounts, pagination.page, pagination.pageSize])

  // Update pagination totalCount and totalPages when data changes
  React.useEffect(() => {
    setPagination(prev => ({
      ...prev,
      totalCount: paginationData.totalCount,
      totalPages: paginationData.totalPages
    }))
  }, [paginationData.totalCount, paginationData.totalPages])

  // Lấy dữ liệu để sử dụng
  const displayedAccounts = paginationData.accounts
  const allFilteredAccounts = paginationData.allFilteredAccounts

  // Pagination handlers
  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }))
  }

  const handlePageSizeChange = (newPageSize) => {
    setPagination(prev => ({
      ...prev,
      pageSize: newPageSize,
      page: 1 // Reset to first page
    }))
  }

  // Reset pagination when filters change
  React.useEffect(() => {
    setPagination(prev => ({
      ...prev,
      page: 1
    }))
  }, [filters, sortBy, sortOrder])

  const handleSelectAccount = (accountId, isSelected) => {
    if (isSelected) {
      setSelectedAccountIds(prev => [...prev, accountId])
    } else {
      setSelectedAccountIds(prev => prev.filter(id => id !== accountId))
    }
  }

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedAccountIds(displayedAccounts.map(acc => acc.id))
    } else {
      setSelectedAccountIds([])
    }
  }

  // Handle opening SetProxyModal
  const handleOpenSetProxyModal = async () => {
    try {
      // Tải lại settings trước khi mở modal
      // console.log('Loading fresh settings before opening SetProxyModal');
      await loadSettings();
      
      // Mở modal
      setIsSetProxyModalOpen(true);
    } catch (error) {
      console.error('Error loading settings before opening modal:', error);
      setIsSetProxyModalOpen(true); // Vẫn mở modal nếu có lỗi
    }
  }

  const handleBulkAction = async (action, data = {}) => {
    if (selectedAccountIds.length === 0) return
    
    setLoading(true)
    try {
      let result = { success: false }
      
      switch (action) {
        case 'set-proxy':
          setSetProxyData({
            proxyFolderId: 'default',
            accountsPerProxy: 1,
            selectedProxies: []
          })
          handleOpenSetProxyModal(); // Sử dụng hàm mới để mở modal với settings được tải lại
          return
        case 'removeProxy':
          result = await window.tiktokAPI.bulkRemoveProxy(selectedAccountIds)
          break
        case 'setStatus':
          result = await window.tiktokAPI.bulkSetStatus(selectedAccountIds, data.status)
          break
        case 'moveToFolder':
          result = await window.tiktokAPI.bulkMoveToFolder(selectedAccountIds, data.folderId)
          break
        case 'delete':
          result = await window.tiktokAPI.bulkDeleteAccounts(selectedAccountIds)
          break
      }
      
      if (result.success) {
        setSelectedAccountIds([])
        await loadAccountsForFolder()
        await loadFolders()
        setIsBulkActionsOpen(false)
      }
    } catch (error) {
      console.error('Error performing bulk action:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSetProxy = async (proxyData) => {
    try {
      if (selectedAccountIds.length === 0) {
        alert(t('selectAtLeastOne'))
        return
      }

      const result = await window.tiktokAPI.setProxyForAccounts({
        accountIds: selectedAccountIds,
        ...proxyData
      })

      if (result.success) {
        // Reload accounts
        await loadAccountsForFolder(selectedFolder)
        setSelectedAccountIds([])
        setIsSetProxyModalOpen(false)
        alert(result.message || t('setProxySuccess'))
      } else {
        alert(result.error || t('accounts.proxy.setError'))
        if (result.errors) {
          console.error('Detailed errors:', result.errors)
        }
      }
    } catch (error) {
      console.error('Error setting proxy:', error)
      alert(t('accounts.errors.setProxyGeneral', { error: error.message }))
    }
  }

  const handleAddAccount = async () => {
    if (!newAccount.username || !newAccount.password) return
    
    setLoading(true)
    try {
      const result = await window.tiktokAPI.addAccount({
        ...newAccount,
        folderId: selectedFolder
      })
      
      if (result.success) {
        setNewAccount({ username: '', password: '', folderId: 'default' })
        setIsAddModalOpen(false)
        await loadAccountsForFolder()
        await loadFolders()
      }
    } catch (error) {
      console.error('Error adding account:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddFolder = async () => {
    if (!newFolder.name) return
    
    setLoading(true)
    try {
      const result = await window.tiktokAPI.addFolder('accounts', newFolder)
      
      if (result.success) {
        setNewFolder({ name: '', description: '', color: '#3B82F6' })
        setIsAddFolderModalOpen(false)
        await loadFolders()
      }
    } catch (error) {
      console.error('Error adding folder:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async (accountId) => {
    try {
      const result = await window.tiktokAPI.deleteAccount(accountId)
      if (result.success) {
        await loadAccountsForFolder()
        await loadFolders()
      }
    } catch (error) {
      console.error('Error deleting account:', error)
    }
  }

  const handleDeleteFolder = async (folderId) => {
    if (folderId === 'default') return
    
    try {
      const result = await window.tiktokAPI.deleteFolder('accounts', folderId)
      if (result.success) {
        if (selectedFolder === folderId) {
          setSelectedFolder('accounts-default')
        }
        await loadFolders()
      }
    } catch (error) {
      console.error('Error deleting folder:', error)
    }
  }

  const handleResetFolders = async () => {
    if (!confirm(t('resetConfirm'))) {
      return
    }
    
    try {
      setLoading(true)
      const result = await window.tiktokAPI.resetFolders()
      
      if (result.success) {
        await loadFolders()
        setSelectedFolder('accounts-default')
        alert(t('resetSuccess'))
      } else {
        alert(result.error || t('proxies.resetError'))
      }
    } catch (error) {
      console.error('Error resetting folders:', error)
      alert(t('accounts.errors.resetGeneral', { error: error.message }))
    } finally {
      setLoading(false)
    }
  }

  const handleImportAccounts = () => {
    setIsImportFileModalOpen(true)
  }

  const handleImportFromText = async (importText, folderId) => {
    try {
      setLoading(true)
      const result = await window.tiktokAPI.importAccountsFromText(importText, folderId)
      
      if (result.success) {
        alert(t('accounts.importSuccess', { imported: result.imported }))
        await loadAccountsForFolder(selectedFolder)
        setIsImportModalOpen(false)
      } else {
        alert(result.error || t('accounts.importError'))
      }
    } catch (error) {
      console.error('Error importing from text:', error)
      alert(t('accounts.errors.importTextGeneral', { error: error.message }))
    } finally {
      setLoading(false)
    }
  }

  const handleImportFromFile = async (file) => {
    try {
      setLoading(true)
      setIsImportFileModalOpen(false)
      
      const result = await window.tiktokAPI.importAccountsFromFile(file.path || file.name, importFileData.folderId)
      
      if (result.success) {
        alert(t('accounts.importFileSuccess', { imported: result.imported }))
        await loadAccountsForFolder(selectedFolder)
      } else {
        alert(result.error || t('accounts.importFileError'))
      }
    } catch (error) {
      console.error('Error importing from file:', error)
      alert(t('accounts.errors.importFileGeneral', { error: error.message }))
    } finally {
      setLoading(false)
    }
  }

  const selectedFolderData = folders.find(f => f.id === selectedFolder) || { name: t('unknownFolder'), color: '#6B7280' }

  const getFolderDisplayName = (folder) => {
    if (folder.id === 'accounts-default' || folder.name === 'Mặc định') {
      return t('default')
    }
    return folder.name
  }

  // Pagination Controls Component để tránh duplicate code
  const PaginationControls = ({ position = 'bottom' }) => {
    if (paginationData.totalPages <= 1) return null;
    
    return (
      <div className={`px-6 py-4 ${position === 'top' ? 'border-b' : 'border-t'} border-gray-200 dark:border-gray-700`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {t('common.pagination.showing')} {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, paginationData.totalCount)} {t('common.pagination.of')} {paginationData.totalCount} {t('common.pagination.items')}
            </span>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">{t('common.pagination.itemsPerPage')}:</span>
              <select
                value={pagination.pageSize}
                onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                className="input text-sm w-20"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.pagination.previous')}
            </button>

            <div className="flex items-center space-x-1">
              {[...Array(pagination.totalPages)].map((_, index) => {
                const pageNum = index + 1
                const isCurrentPage = pageNum === pagination.page
                
                // Hiển thị page numbers với logic smart (hiển thị 5 pages xung quanh current)
                if (
                  pageNum === 1 ||
                  pageNum === pagination.totalPages ||
                  (pageNum >= pagination.page - 2 && pageNum <= pagination.page + 2)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 text-sm rounded ${
                        isCurrentPage
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                } else if (
                  pageNum === pagination.page - 3 ||
                  pageNum === pagination.page + 3
                ) {
                  return <span key={pageNum} className="text-gray-400">...</span>
                }
                return null
              })}
            </div>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.pagination.next')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Lắng nghe sự kiện từ URL khi trang tải
  React.useEffect(() => {
    // Lấy tham số từ URL
    const urlParams = new URLSearchParams(window.location.search)
    const action = urlParams.get('action')
    
    // Xử lý các action khác nhau
    if (action === 'add') {
      setIsAddModalOpen(true)
      // Xóa tham số khỏi URL
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (action === 'import-text') {
      setIsImportModalOpen(true)
      // Xóa tham số khỏi URL
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (action === 'check-all') {
      // Thực hiện kiểm tra tất cả tài khoản
      if (window.tiktokAPI && typeof window.tiktokAPI.checkAllAccounts === 'function') {
        window.tiktokAPI.checkAllAccounts()
      }
      // Xóa tham số khỏi URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
    
    // Đăng ký lắng nghe sự kiện mở modal
    const handleOpenImportTextModal = () => {
      setIsImportModalOpen(true)
    }
    
    const handleOpenAddModal = () => {
      setIsAddModalOpen(true)
    }
    
    // Đăng ký các sự kiện
    window.addEventListener('open-account-import-text-modal', handleOpenImportTextModal)
    window.addEventListener('open-account-add-modal', handleOpenAddModal)
    
    // Cleanup khi component unmount
    return () => {
      window.removeEventListener('open-account-import-text-modal', handleOpenImportTextModal)
      window.removeEventListener('open-account-add-modal', handleOpenAddModal)
    }
  }, [])

  // Load total accounts for license display (ALWAYS total across ALL folders)
  const loadTotalAccounts = async () => {
    try {
      // Method 1: Use folderStats first (most reliable)
      if (folderStats && Object.keys(folderStats).length > 0) {
        const totalFromFolders = Object.values(folderStats).reduce((sum, count) => sum + (count || 0), 0);
        setTotalAccounts(totalFromFolders);
        return;
      }
      
      // Method 2: Call get-all-accounts API
      if (window.tiktokAPI && typeof window.tiktokAPI.callHandler === 'function') {
        const result = await window.tiktokAPI.callHandler('get-all-accounts');
        if (result && result.success) {
          setTotalAccounts(result.accounts.length);
          return;
        }
      }
      
      // Method 3: Use current accounts data (folder-specific, not ideal but better than 0)
      if (accounts && Array.isArray(accounts) && accounts.length > 0) {
        setTotalAccounts(accounts.length);
        return;
      }
      
    } catch (error) {
      console.error('Error loading total accounts:', error);
    }
  };

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient) {
      loadSettings()
      loadFolders()
      loadAccountsForFolder('default')
      loadTotalAccounts() // Load total accounts for license display
    }
  }, [isClient])

  // Reload total accounts when data changes
  useEffect(() => {
    if (isClient && folderStats && Object.keys(folderStats).length > 0) {
      loadTotalAccounts()
    }
  }, [folderStats, accounts])

  return (
    <ProtectedRoute
      fallback={<AuthPage />}
    >
      <StaticLayout activePage="accounts">
        <Head>
          <title>{t('accounts.title')}</title>
        </Head>
      
      <ClientOnly fallback={
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
          {/* Sidebar placeholder */}
          <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Folders</h2>
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-shimmer"></div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-400 rounded-full mr-3"></div>
                    <div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20 mb-1 animate-shimmer"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-12 animate-shimmer"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Main content placeholder */}
          <div className="flex-1 flex flex-col">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-shimmer"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-shimmer"></div>
                </div>
                <div className="flex space-x-3">
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-shimmer"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-shimmer"></div>
                  <div className="h-10 bg-blue-200 dark:bg-blue-700 rounded w-28 animate-shimmer"></div>
                </div>
              </div>
              
              {/* Filter bar */}
              <div className="h-16 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-shimmer"></div>
              
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2 animate-shimmer"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-shimmer"></div>
                  </div>
                ))}
              </div>
              
              {/* Table */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-shimmer"></div>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="p-4 flex items-center space-x-4">
                      <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-shimmer"></div>
                      <div className="w-10 h-10 bg-blue-200 dark:bg-blue-700 rounded-lg animate-shimmer"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-1 animate-shimmer"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-shimmer"></div>
                      </div>
                      <div className="h-6 bg-green-200 dark:bg-green-700 rounded-full w-16 animate-shimmer"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-shimmer"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      } delay={50}>
        <div className="flex h-full">
          {/* Folder Sidebar */}
          <FolderSidebar
            folders={folders}
            selectedFolder={selectedFolder}
            setSelectedFolder={setSelectedFolder}
            folderStats={folderStats}
            setIsAddFolderModalOpen={setIsAddFolderModalOpen}
            handleDeleteFolder={handleDeleteFolder}
            handleResetFolders={handleResetFolders}
          />

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between flex-shrink-0">
                <div>
                  <div className="flex items-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {t('accounts.title')}
                    </h1>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 mx-2" />
                    <span className="text-xl font-semibold" style={{ color: selectedFolderData.color }}>
                      {getFolderDisplayName(selectedFolderData)}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {t('accounts.manageInFolder', { folder: getFolderDisplayName(selectedFolderData) })}
                  </p>
                </div>
                <div className="flex space-x-3">
                  <div className="relative">
                    <button
                      onClick={() => setIsImportModalOpen(true)}
                      disabled={!hasValidLicense}
                      className={`btn-secondary flex items-center ${!hasValidLicense ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={!hasValidLicense ? t('license.errors.licenseRequired') : ''}
                    >
                      <DocumentArrowUpIcon className="w-5 h-5 mr-2" />
                      {t('accounts.importText')}
                    </button>
                  </div>
                  <button
                    onClick={() => setIsImportFileModalOpen(true)}
                    disabled={loading || !hasValidLicense}
                    className={`btn-secondary flex items-center ${!hasValidLicense ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={!hasValidLicense ? t('license.errors.licenseRequired') : ''}
                  >
                    <DocumentArrowUpIcon className="w-5 h-5 mr-2" />
                    {t('accounts.importFile')}
                  </button>
                  {/* <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="btn-primary flex items-center"
                  >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    {t('accounts.add')}
                  </button> */}
                </div>
              </div>

              {/* License Warning Banner */}
              {!hasValidLicense && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                        {t('license.warnings.noValidLicense')}
                      </h3>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        {t('license.warnings.accountFeaturesDisabled')}
                      </p>
                      <div className="mt-2">
                        <span className="text-xs text-red-600 dark:text-red-400">
                          {t('license.messages.accountLimit', { current: totalAccounts || 0, max: limits?.accounts || 0 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Filter and Sort Bar */}
              <FilterAndSortBar
                filters={filters}
                onFiltersChange={setFilters}
                sortConfig={{ field: sortBy, direction: sortOrder }}
                onSortChange={({ field, direction }) => {
                  setSortBy(field)
                  setSortOrder(direction)
                }}
                accounts={accounts}
                folders={folders}
                proxies={proxies}
                proxyFolders={proxyFolders}
              />

              {/* Stats */}
              <AccountStats 
                accounts={allFilteredAccounts}
              />

              {/* Top Pagination Controls */}
              <PaginationControls position="top" />

              {/* Main Content */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                {/* Bulk Actions Button */}
                {selectedAccountIds.length > 0 && (
                  <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setIsBulkActionsOpen(true)}
                      className="btn-primary flex items-center"
                    >
                      <Cog6ToothIcon className="w-5 h-5 mr-2" />
                      {t('accounts.bulkActionsButton', { count: selectedAccountIds.length })}
                    </button>
                  </div>
                )}
                
                {/* Accounts Table */}
                <AccountsTable
                  accounts={displayedAccounts}
                  selectedAccountIds={selectedAccountIds}
                  handleSelectAccount={handleSelectAccount}
                  handleSelectAll={handleSelectAll}
                  handleDeleteAccount={handleDeleteAccount}
                  proxies={proxies}
                  setIsAddModalOpen={setIsAddModalOpen}
                  sortConfig={{ field: sortBy, direction: sortOrder }}
                  onSortChange={({ field, direction }) => {
                    setSortBy(field)
                    setSortOrder(direction)
                  }}
                  pagination={pagination}
                  totalCount={paginationData.totalCount}
                />

                {/* Bottom Pagination Controls */}
                <PaginationControls position="bottom" />
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <AccountModals
          isAddModalOpen={isAddModalOpen}
          setIsAddModalOpen={setIsAddModalOpen}
          isAddFolderModalOpen={isAddFolderModalOpen}
          setIsAddFolderModalOpen={setIsAddFolderModalOpen}
          isImportModalOpen={isImportModalOpen}
          setIsImportModalOpen={setIsImportModalOpen}
          newAccount={newAccount}
          setNewAccount={setNewAccount}
          newFolder={newFolder}
          setNewFolder={setNewFolder}
          handleAddAccount={handleAddAccount}
          handleAddFolder={handleAddFolder}
          loading={loading}
          folders={folders}
          selectedFolder={selectedFolder}
          handleImportFromText={handleImportFromText}
        />

        {/* Bulk Actions Modal */}
        {isBulkActionsOpen && (
          <BulkActionsModal
            isOpen={isBulkActionsOpen}
            onClose={() => setIsBulkActionsOpen(false)}
            selectedCount={selectedAccountIds.length}
            onBulkAction={handleBulkAction}
            folders={folders}
            loading={loading}
          />
        )}

        {/* Set Proxy Modal */}
        {isSetProxyModalOpen && (
          <SetProxyModal
            isOpen={isSetProxyModalOpen}
            onClose={() => setIsSetProxyModalOpen(false)}
            selectedAccountIds={selectedAccountIds}
            proxyFolders={proxyFolders}
            setProxyData={setProxyData}
            setSetProxyData={setSetProxyData}
            onSetProxy={handleSetProxy}
            loading={loading}
            getProxyStatistics={getProxyStatistics}
            settings={settings}
          />
        )}

        {/* Import File Modal */}
        {isImportFileModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('accounts.modal.importFile.title')}
                </h3>
                <button
                  onClick={() => setIsImportFileModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Folder Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('accounts.modal.importFile.selectFolder')}
                  </label>
                  <select
                    value={importFileData.folderId}
                    onChange={(e) => setImportFileData(prev => ({ ...prev, folderId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    {folders.map(folder => (
                      <option key={folder.id} value={folder.id}>
                        {getFolderDisplayName(folder)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* File Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('accounts.modal.importFile.selectFile')}
                  </label>
                  <input
                    type="file"
                    accept=".txt,.csv"
                    onChange={(e) => {
                      const file = e.target.files[0]
                      if (file) {
                        handleImportFromFile(file)
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('accounts.modal.importFile.supportedFormats')}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setIsImportFileModalOpen(false)}
                  className="btn-secondary"
                  disabled={loading}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}
      </ClientOnly>
    </StaticLayout>
    </ProtectedRoute>
  )
}