import React, { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import StaticLayout from '../components/StaticLayout'
import ClientOnly from '../components/ClientOnly'
import { useAuth } from '../contexts/AuthContext'
import { ProtectedRoute, AuthPage } from '../components/auth'
import { useTheme } from '../contexts/ThemeContext'
import { useTranslation } from 'react-i18next'
import { formatDate } from '../utils/i18nUtils'
import { 
  PlusIcon, 
  TrashIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  DocumentArrowUpIcon,
  FolderIcon,
  FolderPlusIcon,
  ChevronRightIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline'

export default function ProxiesPage() {
  const { t } = useTranslation('common')
  const [proxies, setProxies] = useState([])
  const [folders, setFolders] = useState([])
  const [selectedFolder, setSelectedFolder] = useState('default')
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isAddFolderModalOpen, setIsAddFolderModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [testingProxies, setTestingProxies] = useState(new Set())
  const [selectedProxyIds, setSelectedProxyIds] = useState([])
  const [bulkTesting, setBulkTesting] = useState(false)
  
  // Thêm selectedFolderData để tránh lỗi ReferenceError
  const selectedFolderData = Array.isArray(folders) ? folders.find(f => f.id === selectedFolder) : null || { name: t('proxies.defaultFolder'), color: '#6B7280' }
  
  // Thêm state để lưu thống kê proxy theo folder
  const [folderStats, setFolderStats] = useState({})
  
  const [newProxy, setNewProxy] = useState({
    ip: '',
    port: '',
    username: '',
    password: '',
    type: 'http',
    folderId: 'default'
  })
  const [newFolder, setNewFolder] = useState({ name: '', description: '', color: '#3B82F6' })
  const [importText, setImportText] = useState('')
  const [importFolderId, setImportFolderId] = useState('default')
  const [importResult, setImportResult] = useState(null)
  const [importLoading, setImportLoading] = useState(false)
  const fileInputRef = React.useRef(null)
  
  // Filter và Sort states theo yêu cầu trong description.txt
  const [filterOptions, setFilterOptions] = useState({
    folderId: 'all',
    status: 'all',
    minAssignedAccounts: 0,
    maxAssignedAccounts: 10,
    searchTerm: '',
    page: 1,
    pageSize: 20
  })
  
  const [sortOptions, setSortOptions] = useState({
    sortBy: 'createdAt', 
    sortOrder: 'desc'
  })
  
  const [filteredData, setFilteredData] = useState({
    proxies: [],
    totalCount: 0,
    totalPages: 0
  })

  useEffect(() => {
    loadFolders()
    loadFilteredProxies()
  }, [])

  useEffect(() => {
    // Load folder stats when folders are loaded
    if (folders.length > 0) {
      loadFolderStats()
    }
  }, [folders])

  useEffect(() => {
    loadFilteredProxies()
  }, [filterOptions, sortOptions])

  // Thêm useEffect để đồng bộ selectedFolder với filterOptions
  useEffect(() => {
    setFilterOptions(prev => ({
      ...prev,
      folderId: selectedFolder,
      page: 1 // Reset về trang 1 khi chuyển folder
    }))
  }, [selectedFolder])

  useEffect(() => {
    // Load folder stats when folders change
    if (folders.length > 0) {
      loadFolderStats()
    }
  }, [folders])

  // Lắng nghe sự kiện từ URL khi trang tải
  useEffect(() => {
    // Lấy tham số từ URL
    const urlParams = new URLSearchParams(window.location.search)
    const action = urlParams.get('action')
    
    // Xử lý các action khác nhau
    if (action === 'add') {
      setShowAddModal(true)
      // Xóa tham số khỏi URL
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (action === 'import-text') {
      setIsImportModalOpen(true)
      // Xóa tham số khỏi URL
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (action === 'check-all') {
      // Thực hiện kiểm tra tất cả proxy
      if (window.tiktokAPI && typeof window.tiktokAPI.bulkTestProxies === 'function') {
        window.tiktokAPI.bulkTestProxies([])
      }
      // Xóa tham số khỏi URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
    
    // Đăng ký lắng nghe sự kiện mở modal
    const handleOpenImportTextModal = () => {
      setIsImportModalOpen(true)
    }
    
    const handleOpenAddModal = () => {
      setShowAddModal(true)
    }
    
    // Đăng ký các sự kiện
    window.addEventListener('open-proxy-import-text-modal', handleOpenImportTextModal)
    window.addEventListener('open-proxy-add-modal', handleOpenAddModal)
    
    // Cleanup khi component unmount
    return () => {
      window.removeEventListener('open-proxy-import-text-modal', handleOpenImportTextModal)
      window.removeEventListener('open-proxy-add-modal', handleOpenAddModal)
    }
  }, [])

  const loadFolders = async () => {
    try {
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        const result = await window.tiktokAPI.getFolders('proxies')
        if (result.success) {
          setFolders(result.folders || [])
        }
      }
    } catch (error) {
      console.error('Error loading folders:', error)
    }
  }

  const loadFolderStats = async () => {
    try {
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        // Lấy tất cả proxy để đếm theo folder
        const allProxies = await window.tiktokAPI.getProxies()
        const stats = {}
        
        // Đếm số lượng proxy theo từng folder
        folders.forEach(folder => {
          const count = allProxies.filter(proxy => proxy.folderId === folder.id).length
          stats[folder.id] = count
        })
        
        setFolderStats(stats)
      }
    } catch (error) {
      console.error('Error loading folder stats:', error)
      // Fallback: đếm từ dữ liệu proxies hiện tại
      const stats = {}
      folders.forEach(folder => {
        const count = proxies.filter(proxy => proxy.folderId === folder.id).length
        stats[folder.id] = count
      })
      setFolderStats(stats)
    }
  }

  const loadFilteredProxies = async () => {
    try {
      setLoading(true)
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        const result = await window.tiktokAPI.getProxiesWithFilter(filterOptions, sortOptions)
        if (result.success) {
          setFilteredData({
            proxies: result.proxies || [],
            totalCount: result.totalCount || 0,
            totalPages: result.totalPages || 0
          })
          setProxies(result.proxies || [])
        }
      }
    } catch (error) {
      console.error('Error loading filtered proxies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilterOptions(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filter changes
    }))
  }

  const handleSortChange = (sortBy) => {
    setSortOptions(prev => ({
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc'
    }))
  }

  const handlePageChange = (page) => {
    setFilterOptions(prev => ({ ...prev, page }))
  }

  const handleSelectProxy = (proxyId, isSelected) => {
    if (isSelected) {
      setSelectedProxyIds(prev => [...prev, proxyId])
    } else {
      setSelectedProxyIds(prev => prev.filter(id => id !== proxyId))
    }
  }

  const handleSelectAllProxies = (isSelected) => {
    if (isSelected) {
      setSelectedProxyIds(proxies.map(p => p.id))
    } else {
      setSelectedProxyIds([])
    }
  }

  const handleBulkAction = async (action, data = {}) => {
    if (selectedProxyIds.length === 0) return
    
    setLoading(true)
    try {
      let result = { success: false }
      
      switch (action) {
        case 'test':
          result = await window.tiktokAPI.bulkTestProxies(selectedProxyIds)
          break
        case 'moveToFolder':
          result = await window.tiktokAPI.bulkMoveProxiesToFolder(selectedProxyIds, data.folderId)
          break
        case 'export':
          result = await window.tiktokAPI.exportProxies(data.format, selectedProxyIds)
          if (result.success) {
            // Download exported data
            const blob = new Blob([result.data], { type: 'text/plain' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `proxies_${data.format}_${new Date().toISOString().split('T')[0]}.txt`
            a.click()
            window.URL.revokeObjectURL(url)
          }
          break
        case 'delete':
          // Delete each proxy individually với detailed tracking
          const deleteResults = await Promise.all(
            selectedProxyIds.map(async id => {
              try {
                const deleteResult = await window.tiktokAPI.deleteProxy(id)
                return { id, ...deleteResult }
              } catch (error) {
                return { id, success: false, error: error.message }
              }
            })
          )
          
          const successfulDeletes = deleteResults.filter(r => r.success)
          const failedDeletes = deleteResults.filter(r => !r.success)
          
          if (successfulDeletes.length > 0) {
            const message = `Đã xóa thành công ${successfulDeletes.length}/${deleteResults.length} proxy`
            alert(message)
          }
          
          if (failedDeletes.length > 0) {
            const errorMessage = `Có ${failedDeletes.length} proxy không thể xóa:\n${failedDeletes.map(r => `- ${r.error}`).join('\n')}`
            console.error('Failed deletes:', failedDeletes)
            alert(errorMessage)
          }
          
          result = { success: successfulDeletes.length > 0 }
          break
      }
      
      if (result.success) {
        setSelectedProxyIds([])
        await loadFilteredProxies()
        await loadFolderStats() // Reload folder stats after bulk action
        setIsBulkActionsOpen(false)
      }
    } catch (error) {
      console.error('Error performing bulk action:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProxiesForFolder = async () => {
    try {
      setLoading(true)
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        const result = await window.tiktokAPI.getProxiesByFolder(selectedFolder)
        if (result.success) {
          setProxies(result.proxies || [])
        }
      }
    } catch (error) {
      console.error('Error loading proxies for folder:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddProxy = async () => {
    if (!newProxy.ip || !newProxy.port) {
      alert(t('proxies.addModal.validation.required'))
      return
    }

    setLoading(true)
    try {
      const result = await window.tiktokAPI.addProxy(newProxy)
      if (result.success) {
        setNewProxy({ ip: '', port: '', username: '', password: '', type: 'http', folderId: 'default' })
        setIsAddModalOpen(false)
        await loadFilteredProxies()
        await loadFolders()
      } else {
        alert(t('proxies.addModal.error') + ': ' + result.error)
      }
    } catch (error) {
      console.error('Error adding proxy:', error)
      alert(t('proxies.addModal.generalError'))
    } finally {
      setLoading(false)
    }
  }

  const handleAddFolder = async () => {
    if (!newFolder.name) return
    
    try {
      const result = await window.tiktokAPI.addFolder('proxies', newFolder)
      if (result.success) {
        setNewFolder({ name: '', description: '', color: '#3B82F6' })
        setIsAddFolderModalOpen(false)
        await loadFolders()
      }
    } catch (error) {
      console.error('Error creating folder:', error)
    }
  }

  const handleDeleteProxy = async (proxyId) => {
    if (!confirm(t('proxies.deleteConfirm'))) return

    try {
      const result = await window.tiktokAPI.deleteProxy(proxyId)
      if (result.success) {
        await loadFilteredProxies()
        await loadFolders()
        // Show success message với details nếu có
        const message = result.message || t('proxy.deleteSuccess')
        alert(message)
      } else {
        alert(t('proxies.deleteError') + ': ' + result.error)
      }
    } catch (error) {
      console.error('Error deleting proxy:', error)
      alert(t('proxies.deleteGeneralError'))
    }
  }

  const handleDeleteFolder = async (folderId) => {
    if (folderId === 'default') return
    
    try {
      const result = await window.tiktokAPI.deleteFolder('proxies', folderId)
      if (result.success) {
        if (selectedFolder === folderId) {
          setSelectedFolder('default')
        }
        await loadFolders()
      }
    } catch (error) {
      console.error('Error deleting folder:', error)
    }
  }

  const handleTestProxy = async (proxy) => {
    setTestingProxies(prev => new Set([...prev, proxy.id]))
    
    try {
      const result = await window.tiktokAPI.testProxy(proxy.id)
      // Update proxy status in local state
      setProxies(prev => prev.map(p => 
        p.id === proxy.id 
          ? { ...p, status: result.success ? 'active' : 'error', lastTested: new Date() }
          : p
      ))
    } catch (error) {
      console.error('Error testing proxy:', error)
      setProxies(prev => prev.map(p => 
        p.id === proxy.id 
          ? { ...p, status: 'error', lastTested: new Date() }
          : p
      ))
    } finally {
      setTestingProxies(prev => {
        const newSet = new Set(prev)
        newSet.delete(proxy.id)
        return newSet
      })
    }
  }

  const handleImportFromText = async () => {
    if (!importText.trim()) return
    setImportLoading(true)
    setImportResult(null)
    try {
      // console.log('📤 Importing proxies from text. Length:', importText.length, 'Folder:', importFolderId);
      
      // Đảm bảo importFolderId được truyền vào hàm API
      const result = await window.tiktokAPI.importProxiesFromText(importText, importFolderId || 'default');
      
      // console.log('📥 Import result:', result);
      setImportResult(result)
      
      if (result.success) {
        // Cập nhật giao diện sau khi import thành công
        await loadFolderStats()
        await loadFilteredProxies()
        
        // Nếu đang chọn folder tương ứng, load lại proxies cho folder đó
        if (selectedFolder === importFolderId) {
          await loadProxiesForFolder(importFolderId)
        }
      }
    } catch (error) {
      console.error('❌ Error importing proxies:', error);
      setImportResult({ success: false, error: error.message })
    } finally {
      setImportLoading(false)
    }
  }

  const handleImportFromFile = (event) => {
    const file = event.target.files[0]
    if (!file) return
    setImportLoading(true)
    setImportResult(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      setImportText(e.target.result)
      setImportLoading(false)
      setImportResult({
        success: true,
        imported: 0,
        error: null,
        info: t('proxies.importModal.fileLoaded', { fileName: file.name })
      })
    }

    reader.onerror = () => {
      setImportLoading(false)
      setImportResult({ success: false, error: t('proxies.importModal.fileReadError') })
    }

    reader.readAsText(file)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'error': return 'text-red-600 bg-red-100'
      case 'testing': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return t('proxies.filters.active')
      case 'error': return t('common.error')
      case 'testing': return t('proxies.testing')
      default: return t('proxies.notTested')
    }
  }

  // Tính toán danh sách proxy được lọc theo folder đã chọn
  const filteredProxiesByFolder = proxies.filter(proxy => {
    if (selectedFolder === 'default') {
      // Nếu chọn "Mặc định", chỉ hiển thị proxy không có folderId hoặc folderId = 'default'
      return !proxy.folderId || proxy.folderId === 'default'
    }
    // Nếu chọn folder khác, chỉ hiển thị proxy thuộc folder đó
    return proxy.folderId === selectedFolder
  })

  const handleResetFolders = async () => {
    try {
      const result = await window.tiktokAPI.resetProxyFolders()
      if (result.success) {
        alert(t('proxies.resetSuccess'))
        await loadFolders()
      } else {
        alert(t('proxies.resetError') + ': ' + result.error)
      }
    } catch (error) {
      console.error('Error resetting folders:', error)
      alert(t('proxies.errors.resetGeneral'))
    }
  }

  const getFolderDisplayName = (folder) => {
    if (folder.id === 'proxies-default' || folder.name === 'Mặc định') {
      return t('common.default')
    }
    return folder.name
  }

  return (
    <ProtectedRoute
      fallback={<AuthPage />}
    >
      <StaticLayout activePage="proxies">
        <Head>
          <title>{`${t('proxies.title')}`}</title>
        </Head>
        
        <ClientOnly fallback={
          <div className="flex h-full">
            {/* Sidebar placeholder */}
            <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Folders</h2>
                <div className="space-y-2">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
            
            {/* Main content placeholder */}
            <div className="flex-1 flex flex-col">
              <div className="p-6">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        }>
          <div className="flex h-full">
            {/* Folder Sidebar */}
            <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col theme-transition">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('proxies.folders')}</h2>
                  <button
                    onClick={() => setIsAddFolderModalOpen(true)}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <FolderPlusIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {Array.isArray(folders) ? folders.map((folder) => (
                  <div
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder.id)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedFolder === folder.id 
                        ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: folder.color }}
                      ></div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{getFolderDisplayName(folder)}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {folderStats[folder.id] || 0} proxy
                        </div>
                      </div>
                    </div>
                    
                    {folder.id !== 'default' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteFolder(folder.id)
                        }}
                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )) : <div className="p-4 text-center text-gray-500 dark:text-gray-400">Không có thư mục nào</div>}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {t('proxies.title')}
                    </h1>
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                      {t('proxies.description')}
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex space-x-3">
                    {/* <button
                      onClick={async () => {
                        if (confirm(t('proxies.resetConfirm'))) {
                          try {
                            const result = await window.tiktokAPI.resetFoldersData()
                            if (result.success) {
                              await loadFolders()
                              alert(t('proxies.resetSuccess'))
                            } else {
                              alert(t('proxies.resetError') + ': ' + result.error)
                            }
                          } catch (error) {
                            console.error('Error resetting folders:', error)
                            alert(t('proxies.errors.resetGeneral'))
                          }
                        }
                      }}
                      className="btn-secondary flex items-center text-red-600 hover:bg-red-50"
                    >
                      <ArrowPathIcon className="w-5 h-5 mr-2" />
                      {t('proxies.resetFolders')}
                    </button> */}
                    <button
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      className="btn-secondary flex items-center"
                    >
                      <FunnelIcon className="w-5 h-5 mr-2" />
                      {t('proxies.filter')}
                    </button>
                    {selectedProxyIds.length > 0 && (
                      <button
                        onClick={() => setIsBulkActionsOpen(true)}
                        className="btn-secondary flex items-center"
                      >
                        <Cog6ToothIcon className="w-5 h-5 mr-2" />
                        {t('proxies.bulkActions', { count: selectedProxyIds.length })}
                      </button>
                    )}
                    <button
                      onClick={() => setIsExportModalOpen(true)}
                      className="btn-secondary flex items-center"
                    >
                      <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                      {t('proxies.export')}
                    </button>
                    <button
                      onClick={() => setIsImportModalOpen(true)}
                      className="btn-secondary flex items-center"
                    >
                      <DocumentArrowUpIcon className="w-5 h-5 mr-2" />
                      {t('proxies.import')}
                    </button>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="btn-primary flex items-center"
                    >
                      <PlusIcon className="w-5 h-5 mr-2" />
                      {t('proxies.add')}
                    </button>
                  </div>
                </div>

                {/* Filter Controls */}
                {isFilterOpen && (
                  <div className="card flex-shrink-0">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('proxies.advancedFilter')}</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Folder Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('proxies.filters.folder')}
                          </label>
                          <select
                            value={filterOptions.folderId}
                            onChange={(e) => handleFilterChange('folderId', e.target.value)}
                            className="input-field"
                          >
                            <option value="all">{t('proxies.filters.allFolders')}</option>
                            {Array.isArray(folders) ? folders.map(folder => (
                              <option key={folder.id} value={folder.id}>{getFolderDisplayName(folder)}</option>
                            )) : null}
                          </select>
                        </div>

                        {/* Status Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('proxies.filters.status')}
                          </label>
                          <select
                            value={filterOptions.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="input-field"
                          >
                            <option value="all">{t('proxies.filters.allStatuses')}</option>
                            <option value="active">{t('proxies.filters.active')}</option>
                            <option value="inactive">{t('proxies.filters.inactive')}</option>
                            <option value="suspended">{t('proxies.filters.suspended')}</option>
                            <option value="enter403">{t('proxies.filters.enter403')}</option>
                            <option value="fetch403">{t('proxies.filters.fetch403')}</option>
                          </select>
                        </div>

                        {/* Min Assigned Accounts */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('proxies.filters.minAccounts')}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={filterOptions.minAssignedAccounts}
                            onChange={(e) => handleFilterChange('minAssignedAccounts', parseInt(e.target.value) || 0)}
                            className="input-field"
                          />
                        </div>

                        {/* Max Assigned Accounts */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('proxies.filters.maxAccounts')}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={filterOptions.maxAssignedAccounts}
                            onChange={(e) => handleFilterChange('maxAssignedAccounts', parseInt(e.target.value) || 10)}
                            className="input-field"
                          />
                        </div>

                        {/* Search Term */}
                        <div className="lg:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('proxies.filters.searchTerm')}
                          </label>
                          <div className="relative">
                            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                            <input
                              type="text"
                              value={filterOptions.searchTerm}
                              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                              className="input-field pl-10"
                              placeholder={t('proxies.filters.searchTermPlaceholder')}
                            />
                          </div>
                        </div>

                        {/* Sort Options */}
                        <div className="lg:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('proxies.filters.sortBy')}
                          </label>
                          <div className="flex space-x-2">
                            <select
                              value={sortOptions.sortBy}
                              onChange={(e) => setSortOptions(prev => ({ ...prev, sortBy: e.target.value }))}
                              className="input-field flex-1"
                            >
                              <option value="assignedAccountsCount">{t('proxies.filters.assignedAccountsCount')}</option>
                              <option value="createdAt">{t('proxies.filters.createdAt')}</option>
                              <option value="updatedAt">{t('proxies.filters.updatedAt')}</option>
                              <option value="lastUsed">{t('proxies.filters.lastUsed')}</option>
                            </select>
                            <button
                              onClick={() => setSortOptions(prev => ({ 
                                ...prev, 
                                sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
                              }))}
                              className="btn-secondary flex items-center px-3"
                            >
                              <ArrowsUpDownIcon className="w-4 h-4" />
                              {sortOptions.sortOrder === 'asc' ? t('proxies.filters.sortAsc') : t('proxies.filters.sortDesc')}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-6">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {t('proxies.filters.found', { count: filteredData.totalCount })}
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => {
                              setFilterOptions({
                                folderId: 'all',
                                status: 'all',
                                minAssignedAccounts: 0,
                                maxAssignedAccounts: 10,
                                searchTerm: '',
                                page: 1,
                                pageSize: 20
                              })
                              setSortOptions({
                                sortBy: 'createdAt',
                                sortOrder: 'desc'
                              })
                            }}
                            className="btn-secondary"
                          >
                            {t('proxies.filters.clearFilter')}
                          </button>
                          <button
                            onClick={() => setIsFilterOpen(false)}
                            className="btn-primary"
                          >
                            {t('proxies.filters.apply')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Proxy Table */}
                <div className="card flex-1 min-h-0 flex flex-col">
                  <div className="p-6 flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t('proxies.table.title')}
                      </h3>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {proxies.length} proxy
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                onChange={(e) => handleSelectAllProxies(e.target.checked)}
                                className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:bg-gray-700"
                              />
                              <span className="ml-2">{t('proxies.table.selectAll')}</span>
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {t('proxies.table.proxy')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {t('proxies.table.status')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {t('proxies.table.assignedAccounts')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {t('proxies.table.createdAt')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {t('proxies.table.actions')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                              <div className="flex flex-col items-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                                {t('proxies.loading')}
                              </div>
                            </td>
                          </tr>
                        ) : filteredProxiesByFolder.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center">
                                <FolderIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                  {t('proxies.empty.title')}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                  {t('proxies.empty.description')}
                                </p>
                                <button
                                  onClick={() => setShowAddModal(true)}
                                  className="btn-primary"
                                >
                                  {t('proxies.empty.addFirst')}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredProxiesByFolder.map((proxy) => (
                            <tr key={proxy.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 theme-transition">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={selectedProxyIds.includes(proxy.id)}
                                    onChange={(e) => handleSelectProxy(proxy.id, e.target.checked)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:bg-gray-700"
                                  />
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                    <div className="w-6 h-6 bg-blue-600 dark:bg-blue-400 rounded-sm"></div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {proxy.host}:{proxy.port}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {proxy.type?.toUpperCase() || 'HTTP'} • 
                                      {proxy.username ? ` Auth: ***` : ' No Auth'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(proxy.status)}`}>
                                  {getStatusText(proxy.status)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                                  {proxy.assignedAccountsCount || 0}/5
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {proxy.createdAt ? formatDate(proxy.createdAt) : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleTestProxy(proxy)}
                                    className={`text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors duration-200 ${
                                      testingProxies.has(proxy.id) ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                    disabled={testingProxies.has(proxy.id)}
                                  >
                                    {testingProxies.has(proxy.id) ? (
                                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                                    ) : (
                                      <CheckCircleIcon className="w-5 h-5" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProxy(proxy.id)}
                                    className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors duration-200"
                                  >
                                    <TrashIcon className="w-5 h-5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  {filteredData.totalPages > 1 && (
                    <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {t('proxies.pagination', { page: filterOptions.page, totalPages: filteredData.totalPages, totalCount: filteredData.totalCount })}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handlePageChange(filterOptions.page - 1)}
                            disabled={filterOptions.page === 1}
                            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {t('proxies.pagination.prev')}
                          </button>
                          <button
                            onClick={() => handlePageChange(filterOptions.page + 1)}
                            disabled={filterOptions.page === filteredData.totalPages}
                            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {t('proxies.pagination.next')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Add Proxy Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 modal-backdrop">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700 theme-transition">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t('proxies.addModal.title')}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('proxies.addModal.ip')}
                    </label>
                    <input
                      type="text"
                      value={newProxy.ip}
                      onChange={(e) => setNewProxy({ ...newProxy, ip: e.target.value })}
                      className="input-field"
                      placeholder={t('proxies.addModal.ipPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('proxies.addModal.port')}
                    </label>
                    <input
                      type="text"
                      value={newProxy.port}
                      onChange={(e) => setNewProxy({ ...newProxy, port: e.target.value })}
                      className="input-field"
                      placeholder={t('proxies.addModal.portPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('proxies.addModal.username')}
                    </label>
                    <input
                      type="text"
                      value={newProxy.username}
                      onChange={(e) => setNewProxy({ ...newProxy, username: e.target.value })}
                      className="input-field"
                      placeholder={t('proxies.addModal.usernamePlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('proxies.addModal.password')}
                    </label>
                    <input
                      type="text"
                      value={newProxy.password}
                      onChange={(e) => setNewProxy({ ...newProxy, password: e.target.value })}
                      className="input-field"
                      placeholder={t('proxies.addModal.passwordPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('proxies.addModal.type')}
                    </label>
                    <select
                      value={newProxy.type}
                      onChange={(e) => setNewProxy({ ...newProxy, type: e.target.value })}
                      className="input-field"
                    >
                      <option value="http">{t('proxies.addModal.http')}</option>
                      <option value="socks5">{t('proxies.addModal.socks5')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('proxies.addModal.folder')}
                    </label>
                    <select
                      value={newProxy.folderId}
                      onChange={(e) => setNewProxy({ ...newProxy, folderId: e.target.value })}
                      className="input-field"
                    >
                                                <option value="default">{t('proxies.addModal.noFolder')}</option>
                      {Array.isArray(folders) ? folders.map(folder => (
                        <option key={folder.id} value={folder.id}>{getFolderDisplayName(folder)}</option>
                      )) : null}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="btn-secondary"
                  >
                    {t('proxies.addModal.cancel')}
                  </button>
                  <button
                    onClick={handleAddProxy}
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? t('proxies.addModal.adding') : t('proxies.addModal.add')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Folder Modal */}
          {isAddFolderModalOpen && (
            <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 modal-backdrop">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700 theme-transition">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t('proxies.addFolderModal.title')}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('proxies.addFolderModal.name')}
                    </label>
                    <input
                      type="text"
                      value={newFolder.name}
                      onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
                      className="input-field"
                      placeholder={t('proxies.addFolderModal.namePlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('proxies.addFolderModal.description')}
                    </label>
                    <input
                      type="text"
                      value={newFolder.description}
                      onChange={(e) => setNewFolder({ ...newFolder, description: e.target.value })}
                      className="input-field"
                      placeholder={t('proxies.addFolderModal.descriptionPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('proxies.addFolderModal.color')}
                    </label>
                    <input
                      type="color"
                      value={newFolder.color}
                      onChange={(e) => setNewFolder({ ...newFolder, color: e.target.value })}
                      className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setIsAddFolderModalOpen(false)}
                    className="btn-secondary"
                  >
                    {t('proxies.addFolderModal.cancel')}
                  </button>
                  <button
                    onClick={handleAddFolder}
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? t('proxies.addFolderModal.adding') : t('proxies.addFolderModal.add')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Import Modal */}
          {isImportModalOpen && (
            <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 modal-backdrop">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700 theme-transition">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t('proxies.importModal.title')}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('proxies.importModal.fromFile')}
                    </label>
                    <div className="flex items-center">
                      <input
                        type="file"
                        accept=".txt"
                        onChange={handleImportFromFile}
                        className="hidden"
                        ref={fileInputRef}
                      />
                      <button
                        onClick={() => fileInputRef.current.click()}
                        className="btn-secondary flex-1"
                      >
                        {t('proxies.importModal.chooseFile')}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('proxies.importModal.orText')}
                    </label>
                    <textarea
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      className="input-field h-24 resize-none"
                      placeholder={t('proxies.importModal.textPlaceholder')}
                    ></textarea>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('proxies.importModal.folder')}
                    </label>
                    <select
                      value={importFolderId}
                      onChange={(e) => setImportFolderId(e.target.value)}
                      className="input-field"
                    >
                                                <option value="default">{t('proxies.importModal.defaultFolder')}</option>
                          {Array.isArray(folders) ? folders.filter(folder => folder.id !== 'proxies-default').map(folder => (
                        <option key={folder.id} value={folder.id}>{folder.name}</option>
                      )) : null}
                    </select>
                  </div>

                  {importResult && (
                    <div className={`p-4 rounded-lg border ${
                      importResult.success 
                        ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700' 
                        : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700'
                    }`}>
                      <p className={`text-sm font-medium ${
                        importResult.success ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'
                      }`}>
                        {importResult.success ? t('proxies.importModal.success') : t('proxies.importModal.error')}:
                      </p>
                      <p className={`text-sm ${
                        importResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                      }`}>
                        {importResult.success 
                          ? t('proxies.importModal.imported', { count: importResult.imported })
                          : importResult.error
                        }
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setIsImportModalOpen(false)}
                    className="btn-secondary"
                  >
                    {t('proxies.importModal.cancel')}
                  </button>
                  <button
                    onClick={handleImportFromText}
                    className="btn-primary"
                    disabled={importLoading}
                  >
                    {importLoading ? t('proxies.importModal.importing') : t('proxies.importModal.import')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Export Modal */}
          {isExportModalOpen && (
            <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 modal-backdrop">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700 theme-transition">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t('proxies.exportModal.title')}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('proxies.exportModal.format')}
                    </label>
                    <select className="input-field" id="exportFormat">
                      <option value="ip_port_username_password">{t('proxies.exportModal.defaultFormat')}</option>
                      <option value="ip_port">{t('proxies.exportModal.ipPort')}</option>
                      <option value="ip_port_username">{t('proxies.exportModal.ipPortUsername')}</option>
                      <option value="username_password_ip_port">{t('proxies.exportModal.usernamePasswordIpPort')}</option>
                    </select>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedProxyIds.length > 0 
                        ? t('proxies.exportModal.exportSelected', { count: selectedProxyIds.length })
                        : t('proxies.exportModal.exportAll', { count: proxies.length })
                      }
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setIsExportModalOpen(false)}
                    className="btn-secondary"
                  >
                    {t('proxies.exportModal.cancel')}
                  </button>
                  <button
                    onClick={() => {
                      const format = document.getElementById('exportFormat').value
                      handleBulkAction('export', { format })
                      setIsExportModalOpen(false)
                    }}
                    className="btn-primary"
                  >
                    {t('proxies.exportModal.export')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Actions Modal */}
          {isBulkActionsOpen && (
            <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 modal-backdrop">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg shadow-xl border border-gray-200 dark:border-gray-700 theme-transition">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t('proxies.bulkActionsModal.title', { count: selectedProxyIds.length })}
                </h3>
                
                <div className="space-y-4">
                  {/* Test Proxies */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                      {t('proxies.bulkActionsModal.testProxies')}
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('proxies.bulkActionsModal.testTimeout')}
                        </label>
                        <select className="input-field" id="testTimeout">
                          <option value="5000">{t('proxies.bulkActionsModal.defaultTimeout')}</option>
                          <option value="10000">{t('proxies.bulkActionsModal.tenSeconds')}</option>
                          <option value="15000">{t('proxies.bulkActionsModal.fifteenSeconds')}</option>
                          <option value="30000">{t('proxies.bulkActionsModal.thirtySeconds')}</option>
                        </select>
                      </div>
                      <button
                        onClick={() => handleBulkAction('test')}
                        className="btn-primary w-full"
                        disabled={loading}
                      >
                        {t('proxies.bulkActionsModal.testSelected')}
                      </button>
                    </div>
                  </div>

                  {/* Move to Folder */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                      {t('proxies.bulkActionsModal.moveToFolder')}
                    </h4>
                    <div className="space-y-3">
                      <select className="input-field" id="bulkMoveFolder">
                        <option value="">{t('proxies.bulkActionsModal.chooseFolder')}</option>
                        {Array.isArray(folders) ? folders.map(folder => (
                          <option key={folder.id} value={folder.id}>{getFolderDisplayName(folder)}</option>
                        )) : null}
                      </select>
                      <button
                        onClick={() => {
                          const folderId = document.getElementById('bulkMoveFolder').value
                          if (folderId) handleBulkAction('moveToFolder', { folderId })
                        }}
                        className="btn-primary w-full"
                        disabled={loading}
                      >
                        {t('proxies.bulkActionsModal.moveSelected')}
                      </button>
                    </div>
                  </div>

                  {/* Export Proxies */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                      {t('proxies.bulkActionsModal.exportSelected')}
                    </h4>
                    <div className="space-y-3">
                      <select className="input-field" id="bulkExportFormat">
                        <option value="ip_port_username_password">{t('proxies.bulkActionsModal.defaultFormat')}</option>
                        <option value="ip_port">{t('proxies.bulkActionsModal.ipPort')}</option>
                        <option value="ip_port_username">{t('proxies.bulkActionsModal.ipPortUsername')}</option>
                        <option value="username_password_ip_port">{t('proxies.bulkActionsModal.usernamePasswordIpPort')}</option>
                      </select>
                      <button
                        onClick={() => {
                          const format = document.getElementById('bulkExportFormat').value
                          handleBulkAction('export', { format })
                        }}
                        className="btn-secondary w-full"
                        disabled={loading}
                      >
                        {t('proxies.bulkActionsModal.exportSelected')}
                      </button>
                    </div>
                  </div>

                  {/* Delete Proxies */}
                  <div className="border border-red-200 dark:border-red-600 rounded-lg p-4 bg-red-50 dark:bg-red-900/30">
                    <h4 className="font-medium text-red-900 dark:text-red-400 mb-3">
                      {t('proxies.bulkActionsModal.deleteSelected')}
                    </h4>
                    <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                      {t('proxies.bulkActionsModal.deleteWarning')}
                    </p>
                    <button
                      onClick={() => {
                        if (confirm(t('proxies.bulkActionsModal.confirmDelete', { count: selectedProxyIds.length }))) {
                          handleBulkAction('delete')
                        }
                      }}
                      className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200"
                      disabled={loading}
                    >
                      {t('proxies.bulkActionsModal.delete')}
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setIsBulkActionsOpen(false)}
                    className="btn-secondary"
                    disabled={loading}
                  >
                    {t('proxies.bulkActionsModal.cancel')}
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