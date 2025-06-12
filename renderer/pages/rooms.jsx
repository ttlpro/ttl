import React, { useState, useEffect, useMemo, useRef } from 'react'
import Head from 'next/head'
import StaticLayout from '../components/StaticLayout'
import ClientOnly from '../components/ClientOnly'
import { useTheme } from '../contexts/ThemeContext'
import { useTranslation } from 'react-i18next'
import { formatDate } from '../utils/i18nUtils'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import { ProtectedRoute, AuthPage } from '../components/auth'
import { 
  PlayIcon, 
  StopIcon, 
  PlusIcon, 
  EyeIcon, 
  ClockIcon,
  UserGroupIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  DocumentArrowDownIcon,
  ArrowPathIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  ChartBarIcon,
  UserIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useAccountsData } from '../hooks/useAccountsData'
import ViewerChart from '../components/ViewerChart'

export default function RoomsPage() {
  const { t } = useTranslation('common')
  const { hasValidLicense, limits } = useAuth()
  const { isDarkMode } = useTheme()
  const router = useRouter()
  const [rooms, setRooms] = useState([])
  const [accounts, setAccounts] = useState([])
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [selectedRoomIds, setSelectedRoomIds] = useState([])
  
  // Thêm state để theo dõi stats thời gian thực
  const [realTimeStats, setRealTimeStats] = useState({})
  
  const [newRoom, setNewRoom] = useState({
    roomUrl: '',
    accountCount: 1,
    duration: 5,
    note: ''
  })
  
  // Filter options theo yêu cầu trong description.txt
  const [filterOptions, setFilterOptions] = useState({
    status: 'all',
    minViewers: 0,
    maxViewers: 100000,
    minDuration: 0,
    maxDuration: 300,
    searchTerm: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    pageSize: 20
  })
  
  // Sort options - Mặc định sắp xếp theo thời gian mới nhất
  const [sortOptions, setSortOptions] = useState({
    sortBy: 'createdAt',
    sortOrder: 'desc' // Mới nhất lên trên
  })
  
  // Account filters
  const [accountFilters, setAccountFilters] = useState({
    folder: 'all',
    status: 'active',
    proxy: 'with-proxy',
    maxCurrentRooms: 10,
    selectedAccounts: []
  })
  
  // Quick selection range
  const [quickSelection, setQuickSelection] = useState({
    fromPosition: 1,
    toPosition: 1
  })
  
  // Debug mode state
  const [isDebugMode, setIsDebugMode] = useState(false)
  
  // Filtered data
  const [filteredData, setFilteredData] = useState({
    rooms: [],
    totalCount: 0,
    totalPages: 0
  })

  // Auto refresh states
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [countdown, setCountdown] = useState(30);
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);

  // Chart modal state
  const [isChartModalOpen, setIsChartModalOpen] = useState(false)
  const [selectedRoomForChart, setSelectedRoomForChart] = useState(null)

  // Thêm state và hàm xử lý để hiển thị accounts trong room
  const [selectedRoomAccounts, setSelectedRoomAccounts] = useState([]);
  const [isViewingRoomAccounts, setIsViewingRoomAccounts] = useState(false);
  const [selectedRoomForAccounts, setSelectedRoomForAccounts] = useState(null);
  
  // Lấy settings từ useAccountsData
  const [appSettings, setAppSettings] = useState(null);
  
  useEffect(() => {
    // Load settings khi component mount
    const loadAppSettings = async () => {
      try {
        if (typeof window !== 'undefined' && window.tiktokAPI) {
          const result = await window.tiktokAPI.getSettings();
          if (result && result.success && result.settings) {
            setAppSettings(result.settings);
            // console.log('Loaded settings for rooms:', result.settings);
          }
        }
      } catch (error) {
        console.error('Error loading settings in rooms page:', error);
      }
    };
    
    loadAppSettings();
  }, []);

  const handleViewAccountsInRoom = async (roomId) => {
    try {
      setIsViewingRoomAccounts(true);
      const room = rooms.find(r => r.id === roomId);
      setSelectedRoomForAccounts(room);
      
      const result = await window.tiktokAPI.getAccountsInRoom(roomId);
      if (result.success) {
        setSelectedRoomAccounts(result.accounts || []);
      } else {
        setSelectedRoomAccounts([]);
        console.error('Error getting accounts in room:', result.error);
      }
    } catch (error) {
      console.error('Error viewing accounts in room:', error);
      setSelectedRoomAccounts([]);
    }
  };

  // Get filtered rooms function
  const getFilteredRooms = () => {
    let filtered = [...rooms]

    // Filter by status
    if (filterOptions.status !== 'all') {
      filtered = filtered.filter(room => room.status === filterOptions.status)
    }

    // Filter by viewer count
    filtered = filtered.filter(room => {
      const viewerCount = room.currentViewers || 0
      return viewerCount >= filterOptions.minViewers && viewerCount <= filterOptions.maxViewers
    })

    // Filter by duration
    filtered = filtered.filter(room => {
      const duration = room.duration || 0
      return duration >= filterOptions.minDuration && duration <= filterOptions.maxDuration
    })

    // Filter by search term
    if (filterOptions.searchTerm) {
      filtered = filtered.filter(room => 
        room.roomUrl.toLowerCase().includes(filterOptions.searchTerm.toLowerCase())
      )
    }

    // Sort rooms - Mặc định theo thời gian mới nhất
    filtered.sort((a, b) => {
      switch (sortOptions.sortBy) {
        case 'createdAt':
          return sortOptions.sortOrder === 'asc' 
            ? new Date(a.createdAt || 0) - new Date(b.createdAt || 0) 
            : new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        case 'currentViewers':
          return sortOptions.sortOrder === 'asc' 
            ? (a.currentViewers || 0) - (b.currentViewers || 0) 
            : (b.currentViewers || 0) - (a.currentViewers || 0)
        case 'status':
          const statusOrder = { 'watching': 1, 'stopped': 2, 'completed': 3 }
          const aOrder = statusOrder[a.status] || 4
          const bOrder = statusOrder[b.status] || 4
          return sortOptions.sortOrder === 'asc' ? aOrder - bOrder : bOrder - aOrder
        default:
          return 0
      }
    })

    return filtered
  }

  // Get filtered accounts function - loại bỏ accounts đang chạy room đó rồi
  const getFilteredAccounts = () => {
    if (!Array.isArray(accounts)) {
      console.warn('accounts không phải là mảng');
      return [];
    }
    
    let filtered = [...accounts];

    // Filter by folder
    if (accountFilters.folder !== 'all') {
      filtered = filtered.filter(acc => acc.folderId === accountFilters.folder);
    }

    // Filter by status
    if (accountFilters.status !== 'all') {
      filtered = filtered.filter(acc => acc.status === accountFilters.status);
    }

    // Filter by proxy
    if (accountFilters.proxy === 'with-proxy') {
      filtered = filtered.filter(acc => {
        // Check multiple possible proxy field names
        return !!(acc.proxyId || acc.proxy_id || acc.proxyID || acc.proxy || acc.proxyInfo);
      });
    } else if (accountFilters.proxy === 'without-proxy') {
      filtered = filtered.filter(acc => {
        // Check if account has NO proxy
        const hasProxy = !!(acc.proxyId || acc.proxy_id || acc.proxyID || acc.proxy || acc.proxyInfo);
        return !hasProxy;
      });
    }

    // Filter by current rooms count
    filtered = filtered.filter(acc => (acc.currentRooms || 0) <= accountFilters.maxCurrentRooms);
    
    // Thêm lọc theo thời gian nghỉ (cooldown)
    if (appSettings?.system?.accountCooldown > 0) {
      const cooldownMs = appSettings.system.accountCooldown * 1000; // Chuyển giây thành mili giây
      const now = new Date().getTime();
      
      // Tạo danh sách accounts bị loại bỏ do cooldown để hiển thị trong debug mode
      const cooldownAccounts = [];
      
      filtered = filtered.filter(acc => {
        // Nếu không có lastUsed hoặc lastUsed + cooldown < now thì cho phép sử dụng account
        if (!acc.lastUsed) return true;
        
        const lastUsedTime = new Date(acc.lastUsed).getTime();
        const canUseAfter = lastUsedTime + cooldownMs;
        
        // Nếu account đang trong thời gian cooldown, thêm vào danh sách để debug
        if (now < canUseAfter && isDebugMode) {
          const remainingTime = Math.ceil((canUseAfter - now) / 1000);
          cooldownAccounts.push({
            id: acc.id,
            username: acc.username,
            lastUsed: new Date(acc.lastUsed).toLocaleTimeString(),
            remainingSeconds: remainingTime
          });
        }
        
        return now >= canUseAfter;
      });
      
      // Hiển thị thông tin về accounts bị loại do cooldown trong debug mode
      if (isDebugMode && cooldownAccounts.length > 0) {
        // console.log('Accounts filtered out due to cooldown:', cooldownAccounts);
      }
      
      // console.log(`Applied cooldown filter (${appSettings.system.accountCooldown}s): ${filtered.length} accounts available`);
    }

    // QUAN TRỌNG: Loại bỏ accounts đang chạy room với room_id này rồi
    if (newRoom.roomUrl && newRoom.roomUrl.trim()) {
      // Extract room_id giống như logic trong storage-manager
      let currentRoomId = newRoom.roomUrl.trim();
      
      // Nếu là URL TikTok, chỉ lấy username
      if (newRoom.roomUrl.includes('tiktok.com')) {
        // Extract từ format @username/live
        const usernameMatch = newRoom.roomUrl.match(/@([^\/]+)\/live/);
        if (usernameMatch) {
          currentRoomId = usernameMatch[1]; // Chỉ lấy username
        } else {
          // Fallback: extract từ các format khác nếu có
          const urlMatch = newRoom.roomUrl.match(/\/live\/(\w+)/);
          if (urlMatch) {
            currentRoomId = urlMatch[1];
          }
        }
      }
      
      // console.log('Input:', newRoom.roomUrl);
      // console.log('Extracted room_id:', currentRoomId);
      
      // Loại bỏ accounts đã có room_id này trong activeRooms
      filtered = filtered.filter(acc => {
        // Bảo vệ trường hợp acc là null hoặc undefined
        if (!acc) return false;
        
        // Parse activeRooms thành mảng nếu là string
        let activeRoomsList = [];
        if (typeof acc.activeRooms === 'string') {
          try {
            activeRoomsList = JSON.parse(acc.activeRooms);
          } catch (e) {
            console.error(`Lỗi parse activeRooms cho account ${acc.id}:`, e);
            activeRoomsList = [];
          }
        } else if (Array.isArray(acc.activeRooms)) {
          activeRoomsList = acc.activeRooms;
        }
        
        // Kiểm tra xem room_id có trong activeRooms không
        const hasRoom = Array.isArray(activeRoomsList) && activeRoomsList.includes(currentRoomId);
        return !hasRoom; // Trả về true nếu account chưa có room này (có thể chọn)
      });
      
      // console.log('Filtered accounts after room check:', filtered.length);
    }

    // Sort accounts
    filtered.sort((a, b) => {
      if (!a || !b) return 0;
      
      switch (sortOptions.sortBy) {
        case 'currentRooms':
          return sortOptions.sortOrder === 'asc' ? (a.currentRooms || 0) - (b.currentRooms || 0) : (b.currentRooms || 0) - (a.currentRooms || 0);
        case 'createdAt':
          const aDate = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const bDate = b.createdAt ? new Date(b.createdAt) : new Date(0);
          return sortOptions.sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
        case 'lastViewed':
          const aViewed = a.lastViewed ? new Date(a.lastViewed) : new Date(0);
          const bViewed = b.lastViewed ? new Date(b.lastViewed) : new Date(0);
          return sortOptions.sortOrder === 'asc' ? aViewed - bViewed : bViewed - aViewed;
        default:
          return 0;
      }
    });

    return filtered;
  }

  // Calculate filtered data using useMemo
  const filteredRooms = useMemo(() => getFilteredRooms(), [rooms, filterOptions, sortOptions]);
  const filteredAccounts = useMemo(() => getFilteredAccounts(), [accounts, accountFilters, newRoom.roomUrl, sortOptions]);

  useEffect(() => {
    loadRooms()
    loadAccounts()
    loadFolders()
    
    // Thiết lập interval để cập nhật số người xem thời gian thực
    const interval = setInterval(() => {
      updateRealTimeViewers()
    }, 3000) // Cập nhật mỗi 3 giây

    return () => clearInterval(interval)
  }, [])

  // Xử lý URL parameter để tự động mở modal
  useEffect(() => {
    if (router.query.action === 'add') {
      handleOpenAddRoomModal()
      // Xóa parameter khỏi URL để tránh mở modal lại khi refresh
      router.replace('/rooms', undefined, { shallow: true })
    }
  }, [router.query])
  useEffect(() => {
    loadFilteredRooms()
  }, [filterOptions, sortOptions])

  // Reload filtered accounts when account filters change
  useEffect(() => {
    // console.log('Account filters changed:', accountFilters)
    // console.log('Total accounts:', accounts.length)
    // console.log('Filtered accounts:', getFilteredAccounts().length)
  }, [accountFilters, accounts])

  // Auto-update quick selection range when account count changes
  useEffect(() => {
    if (filteredAccounts.length > 0) {
      setQuickSelection({
        fromPosition: 1,
        toPosition: Math.min(newRoom.accountCount, filteredAccounts.length)
      })
    }
  }, [newRoom.accountCount, filteredAccounts.length])

  // Auto refresh effect
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      // Clear previous intervals
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      
      // Reset countdown
      setCountdown(refreshInterval);
      
      // Main refresh interval
      intervalRef.current = setInterval(() => {
        // console.log('🔄 Auto refreshing rooms...');
        handleManualRefresh(); // ✅ Load full data + filtered data
        setCountdown(refreshInterval); // Reset countdown
      }, refreshInterval * 1000);
      
      // Countdown timer  
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            return refreshInterval; // Reset when reaches 0
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Clear intervals when auto refresh is disabled
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      setCountdown(0);
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [autoRefresh, refreshInterval]);

  // Manual refresh function
  const handleManualRefresh = async () => {
    setLoading(true);
    
    // Load TOÀN BỘ rooms trước (không pagination)
    await loadRooms();
    
    // Sau đó load filtered data với pagination
    await loadFilteredRooms();
    
    // Cập nhật real-time data
    await updateRealTimeViewers();
    
    setCountdown(refreshInterval); // Reset countdown
    setLoading(false);
  };

  // Change refresh interval
  const handleIntervalChange = (newInterval) => {
    setRefreshInterval(newInterval);
    setCountdown(newInterval);
  };

  // Hàm cập nhật số người xem thời gian thực
  const updateRealTimeViewers = async () => {
    try {
      // Lấy thống kê từ viewer manager
      const viewerStatsResult = await window.electronAPI.invoke('get-viewer-manager-stats');
      
      if (viewerStatsResult.success) {
        const { activeViewers, isRunning, totalAccounts } = viewerStatsResult.stats;
        
        setRooms(prevRooms => 
          prevRooms.map(room => {
            if (room.status === 'running') {
              return {
                ...room,
                currentViewers: activeViewers, // Sử dụng số viewers thực tế
                totalViewers: totalAccounts,
                isActive: isRunning
              };
            }
            return room;
          })
        );
      }
      
      // Cập nhật thống kê cho từng room đang chạy
      const runningRooms = rooms.filter(room => room.status === 'running');
      
      for (const room of runningRooms) {
        const roomStatsResult = await window.electronAPI.invoke('get-room-stats', room.id);
        
        if (roomStatsResult.success) {
          const { currentViewers, status, accounts } = roomStatsResult.stats;
          
          setRooms(prevRooms => 
            prevRooms.map(r => 
              r.id === room.id 
                ? { 
                    ...r, 
                    currentViewers: currentViewers,
                    status: status,
                    accounts: accounts,
                    lastUpdated: new Date().toLocaleTimeString()
                  }
                : r
            )
          );
        }
      }
      
    } catch (error) {
      console.error('Error updating real-time viewers:', error);
    }
  }

  const loadFilteredRooms = async () => {
    try {
      setLoading(true)
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        const result = await window.tiktokAPI.getRoomsWithFilter(filterOptions, sortOptions)
        if (result.success) {
          setFilteredData({
            rooms: result.rooms || [],
            totalCount: result.totalCount || 0,
            totalPages: result.totalPages || 0
          })
          // XÓA DÒNG NÀY: setRooms(result.rooms || [])
        }
      }
    } catch (error) {
      console.error('Error loading filtered rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRooms = async () => {
    try {
      setLoading(true)
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        const result = await window.tiktokAPI.getRooms()
        if (result.success) {
          setRooms(result.rooms || [])
        }
      }
    } catch (error) {
      console.error('Error loading rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAccounts = async () => {
    try {
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        const accountList = await window.tiktokAPI.getAccounts()
        // console.log('Loaded accounts:', accountList?.length || 0)
        setAccounts(accountList || [])
      }
    } catch (error) {
      console.error('Error loading accounts:', error)
    }
  }

  const loadFolders = async () => {
    try {
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        const result = await window.tiktokAPI.getFolders('accounts')
        if (result.success) {
          setFolders(Array.isArray(result.folders) ? result.folders : []);
          // console.log('Loaded folders:', result.folders?.length || 0);
        } else {
          console.warn('Failed to load folders, setting empty array');
          setFolders([]);
        }
      }
    } catch (error) {
      console.error('Error loading folders:', error)
      setFolders([]);
    }
  }

  // Thêm function refresh data khi mở modal
  const refreshDataForModal = async () => {
    // console.log('Refreshing data for modal...')
    try {
      // Đảm bảo load xong mới tiếp tục
      const [accountsResult, foldersResult] = await Promise.all([
        typeof window !== 'undefined' && window.tiktokAPI ? window.tiktokAPI.getAccounts() : [],
        typeof window !== 'undefined' && window.tiktokAPI ? window.tiktokAPI.getFolders('accounts') : { success: false, folders: [] }
      ])
      
      // Cập nhật state với dữ liệu mới
      setAccounts(accountsResult || [])
      setFolders(Array.isArray(foldersResult?.folders) ? foldersResult.folders : [])
      
      // console.log('Data refreshed - Accounts:', accountsResult?.length || 0, 'Folders:', foldersResult?.folders?.length || 0)
    } catch (error) {
      console.error('Error refreshing modal data:', error)
      setAccounts([])
      setFolders([])
    }
  }

  // Hàm mở modal và refresh dữ liệu
  const handleOpenAddRoomModal = async () => {
    setIsAddRoomModalOpen(true)
    // Reset form
    setNewRoom({ roomUrl: '', accountCount: 1, duration: 5, note: '' })
    
    // Thêm maxCurrentRooms từ settings nếu có
    const defaultMaxRooms = appSettings?.system?.maxRoomsPerAccount || 1;
    setAccountFilters(prev => ({ 
      ...prev, 
      selectedAccounts: [],
      maxCurrentRooms: defaultMaxRooms // Sử dụng giá trị từ settings
    }))
    
    // Refresh dữ liệu mới nhất
    await refreshDataForModal()
  }

  const handleAddRoom = async () => {
    if (!newRoom.roomUrl) return

    // Use selected accounts if any, otherwise use filtered accounts
    const accountsToUse = accountFilters.selectedAccounts.length > 0 
      ? accounts.filter(acc => accountFilters.selectedAccounts.includes(acc.id))
      : getFilteredAccounts().slice(0, newRoom.accountCount)

    if (accountsToUse.length === 0) {
      alert(t('rooms.messages.selectAtLeastOne'))
      return
    }

    setLoading(true)
    try {
      // Gọi phương thức addRoomAndStartViewer để xử lý toàn bộ quy trình trong một transaction
      const result = await window.tiktokAPI.addRoomAndStartViewer({
        roomUrl: newRoom.roomUrl,
        accountCount: accountsToUse.length,
        duration: newRoom.duration,
        note: newRoom.note,
        targetViewers: accountsToUse.length
      }, accountsToUse)

      if (result.success) {
        // console.log(`✅ Đã thêm và bắt đầu room thành công: ${result.roomId}`)
        
        // Reset form và đóng modal
        setNewRoom({ roomUrl: '', accountCount: 1, duration: 5, note: '' })
        setAccountFilters(prev => ({ ...prev, selectedAccounts: [] }))
        setIsAddRoomModalOpen(false)
        
        // Reload lại dữ liệu để cập nhật UI ngay lập tức
        await Promise.all([
          loadRooms(),         // Cập nhật danh sách rooms
          loadAccounts(),      // Cập nhật danh sách accounts
          loadFilteredRooms()  // Cập nhật danh sách rooms đã lọc
        ])
        
        // Cập nhật thống kê real-time
        updateRealTimeViewers()
      } else {
        alert(t('rooms.messages.addRoomError') + ': ' + result.error)
      }
    } catch (error) {
      console.error('Error adding room:', error)
      alert(t('rooms.messages.addRoomGeneralError'))
    } finally {
      setLoading(false)
    }
  }

  const handleStopRoom = async (roomId) => {
    if (!confirm(t('rooms.messages.confirmStop'))) return

    try {
      const result = await window.tiktokAPI.stopRoom(roomId)
      if (result.success) {
        await loadRooms()
        // Cập nhật real-time stats
        await updateRealTimeViewers()
      } else {
        alert(t('rooms.messages.stopRoomError') + ': ' + result.error)
      }
    } catch (error) {
      console.error('Error stopping room:', error)
      alert(t('rooms.messages.stopRoomGeneralError'))
    }
  }

  const handleDuplicateRoom = async (room) => {
    setNewRoom({
      roomUrl: room.roomUrl,
      accountCount: 1,
      duration: room.duration || 5,
      note: `Copy of: ${room.note || room.roomUrl}`
    })
    setIsAddRoomModalOpen(true)
  }

  const handleDeleteRoom = async (roomId) => {
    if (!confirm(t('rooms.messages.confirmDelete'))) return

    try {
      const result = await window.tiktokAPI.deleteRoom(roomId)
      if (result.success) {
        await loadRooms()
      } else {
        alert(t('rooms.messages.deleteRoomError') + ': ' + result.error)
      }
    } catch (error) {
      console.error('Error deleting room:', error)
      alert(t('rooms.messages.deleteRoomGeneralError'))
    }
  }

  // Quick selection functions
  const handleQuickSelection = () => {
    const startPos = Math.max(1, quickSelection.fromPosition) - 1 // Convert to 0-based index
    const endPos = Math.min(filteredAccounts.length, quickSelection.toPosition) - 1 // Convert to 0-based index
    const maxSelectable = newRoom.accountCount - accountFilters.selectedAccounts.length
    
    if (maxSelectable <= 0) {
      alert(t('rooms.messages.alreadySelectedEnough', { count: newRoom.accountCount }))
      return
    }
    
    const rangeAccounts = filteredAccounts.slice(startPos, endPos + 1)
    const accountsToSelect = rangeAccounts.slice(0, maxSelectable).map(acc => acc.id)
    
    setAccountFilters(prev => ({
      ...prev,
      selectedAccounts: [...prev.selectedAccounts, ...accountsToSelect]
    }))
  }

  const canSelectMore = () => {
    return accountFilters.selectedAccounts.length < newRoom.accountCount
  }

  // Helper functions for status
  const getStatusColor = (status) => {
    switch (status) {
      case 'watching':
        return 'bg-green-100 text-green-800'
      case 'stopped':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'watching':
        return t('rooms.status.watching')
      case 'stopped':
        return t('rooms.status.stopped')
      case 'completed':
        return t('rooms.status.completed')
      default:
        return t('rooms.status.unknown')
    }
  }

  // Calculate statistics - SỬA: tính trên toàn bộ rooms, không chỉ page hiện tại  
  const roomStats = useMemo(() => {
    // Lấy tất cả rooms sau filter, trước pagination
    const allFilteredRooms = getFilteredRooms();
    
    return {
      total: allFilteredRooms.length,
      watching: allFilteredRooms.filter(r => r.status === 'watching').length,
      stopped: allFilteredRooms.filter(r => r.status === 'stopped').length, 
      completed: allFilteredRooms.filter(r => r.status === 'completed').length,
      totalViewers: allFilteredRooms.reduce((sum, r) => sum + (r.currentViewers || 0), 0),
      avgViewers: allFilteredRooms.length > 0 ? Math.round(allFilteredRooms.reduce((sum, r) => sum + (r.currentViewers || 0), 0) / allFilteredRooms.length) : 0
    }
  }, [rooms, filterOptions]);

  const getFolderDisplayName = (folder) => {
    if (!folder) return t('common.unknown');
    if (folder.id === 'default' || folder.name === 'Mặc định') {
      return t('common.default')
    }
    return folder.name || folder.id || t('common.unknown');
  }

  // Helper function để format thời gian relative với translations
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return t('rooms.status.notChecked')
    
    const now = new Date()
    const checkTime = new Date(timestamp)
    const diffMs = now - checkTime
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMinutes < 1) return t('rooms.status.justNow')
    if (diffMinutes < 60) return t('rooms.status.minutesAgo', { count: diffMinutes })
    if (diffHours < 24) return t('rooms.status.hoursAgo', { count: diffHours })
    return t('rooms.status.daysAgo', { count: diffDays })
  }

  const formatLastCheck = (lastTimeCheckViewers) => {
    if (!lastTimeCheckViewers) return t('rooms.status.notChecked');
    
    const now = new Date();
    const lastCheck = new Date(lastTimeCheckViewers);
    const diffMs = now - lastCheck;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return t('rooms.status.justNow');
    if (diffMinutes < 60) return t('rooms.status.minutesAgo', { count: diffMinutes });
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return t('rooms.status.hoursAgo', { count: diffHours });
    
    const diffDays = Math.floor(diffHours / 24);
    return t('rooms.status.daysAgo', { count: diffDays });
  };

  const formatRuntime = (room) => {
    if (!room.startedAt) return '-';
    
    const started = new Date(room.startedAt);
    let endTime;
    
    // Nếu room đã kết thúc thì dùng stoppedAt, còn không thì dùng thời gian hiện tại
    if (room.status === 'watching') {
      endTime = new Date();
    } else if (room.stoppedAt) {
      endTime = new Date(room.stoppedAt);
    } else {
      return '-';
    }
    
    const diffMs = endTime - started;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes}m`;
    const diffHours = Math.floor(diffMinutes / 60);
    const remainingMinutes = diffMinutes % 60;
    return `${diffHours}h ${remainingMinutes}m`;
  };

  // Handler để mở chart modal
  const handleOpenChart = (room) => {
    setSelectedRoomForChart(room)
    setIsChartModalOpen(true)
  }

  const handleCloseChart = () => {
    setIsChartModalOpen(false)
    setSelectedRoomForChart(null)
  }

  return (
    <ProtectedRoute
      fallback={<AuthPage />}
    >
      <StaticLayout activePage="rooms">
        <Head>
          <title>{`${t('rooms.title')}`}</title>
        </Head>

        <ClientOnly fallback={
          <div className="p-6">
            {/* Statistics placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
            
            {/* Header placeholder */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2 w-48"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-64"></div>
              </div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
            </div>
            
            {/* Content placeholder */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        }>
          <div className="container mx-auto px-4 py-8">
            {/* Header với Thêm phòng live + Auto Refresh */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {t('rooms.title')} ({roomStats.total})
                </h1>
              </div>
              
              {/* Right side controls */}
              <div className="flex items-center space-x-4">
                {/* Auto Refresh Controls */}
                <div className="flex items-center space-x-3 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  {/* Auto Refresh Toggle */}
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      {t('rooms.autoRefresh.label')}:
                    </label>
                    <button
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        autoRefresh ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          autoRefresh ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Interval Selector */}
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      {t('rooms.autoRefresh.interval')}:
                    </label>
                    <select
                      value={refreshInterval}
                      onChange={(e) => handleIntervalChange(parseInt(e.target.value))}
                      className="input text-sm w-16 h-8"
                      disabled={!autoRefresh}
                    >
                      <option value={10}>10s</option>
                      <option value={15}>15s</option>
                      <option value={30}>30s</option>
                      <option value={60}>60s</option>
                      <option value={120}>2m</option>
                      <option value={300}>5m</option>
                    </select>
                  </div>

                  {/* Countdown + Manual Refresh */}
                  <div className="flex items-center space-x-2">
                    {autoRefresh && (
                      <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                        <ClockIcon className="w-4 h-4" />
                        <span>{t('rooms.autoRefresh.next', { countdown })}</span>
                      </div>
                    )}
                    
                    <button
                      onClick={handleManualRefresh}
                      disabled={loading}
                      className="btn btn-secondary btn-sm flex items-center space-x-1"
                    >
                      <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      <span>{t('rooms.autoRefresh.refresh')}</span>
                    </button>
                  </div>
                </div>

                {/* Thêm phòng live button */}
                <button
                  onClick={handleOpenAddRoomModal}
                  disabled={!hasValidLicense}
                  className={`btn btn-primary flex items-center space-x-2 ${!hasValidLicense ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={!hasValidLicense ? t('license.errors.licenseRequired') : ''}
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>{t('rooms.add')}</span>
                </button>
              </div>
            </div>

            {/* License Warning Banner */}
            {!hasValidLicense && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      {t('license.warnings.noValidLicense')}
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {t('license.warnings.roomFeaturesDisabled')}
                    </p>
                    <div className="mt-2">
                      <span className="text-xs text-red-600 dark:text-red-400">
                        {t('license.messages.roomLimit', { current: roomStats.watching || 0, max: limits?.rooms || 0 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
              <div className="stat-card">
                <div className="stat-icon bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <GlobeAltIcon className="w-6 h-6" />
                </div>
                <div className="stat-content">
                  <div className="stat-label">{t('rooms.stats.totalRooms')}</div>
                  <div className="stat-value">{roomStats.total}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                  <EyeIcon className="w-6 h-6" />
                </div>
                <div className="stat-content">
                  <div className="stat-label">{t('rooms.stats.watching')}</div>
                  <div className="stat-value">{roomStats.watching}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                  <StopIcon className="w-6 h-6" />
                </div>
                <div className="stat-content">
                  <div className="stat-label">{t('rooms.stats.stopped')}</div>
                  <div className="stat-value">{roomStats.stopped}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  <CheckCircleIcon className="w-6 h-6" />
                </div>
                <div className="stat-content">
                  <div className="stat-label">{t('rooms.stats.completed')}</div>
                  <div className="stat-value">{roomStats.completed}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400">
                  <UserGroupIcon className="w-6 h-6" />
                </div>
                <div className="stat-content">
                  <div className="stat-label">{t('rooms.stats.totalViewers')}</div>
                  <div className="stat-value">{roomStats.totalViewers}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                  <ChartBarIcon className="w-6 h-6" />
                </div>
                <div className="stat-content">
                  <div className="stat-label">{t('rooms.stats.avgViewers')}</div>
                  <div className="stat-value">{roomStats.avgViewers}</div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('rooms.filters.title')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('rooms.filters.status')}</label>
                    <select
                      value={filterOptions.status}
                      onChange={(e) => setFilterOptions(prev => ({ ...prev, status: e.target.value }))}
                      className="input"
                    >
                      <option value="all">{t('rooms.filters.all')}</option>
                      <option value="watching">{t('rooms.filters.watching')}</option>
                      <option value="stopped">{t('rooms.filters.stopped')}</option>
                      <option value="completed">{t('rooms.filters.completed')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('rooms.filters.minViewers')}</label>
                    <input
                      type="number"
                      value={filterOptions.minViewers}
                      onChange={(e) => setFilterOptions(prev => ({ ...prev, minViewers: parseInt(e.target.value) || 0 }))}
                      className="input"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('rooms.filters.maxViewers')}</label>
                    <input
                      type="number"
                      value={filterOptions.maxViewers}
                      onChange={(e) => setFilterOptions(prev => ({ ...prev, maxViewers: parseInt(e.target.value) || 100000 }))}
                      className="input"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Rooms Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('rooms.table.title', { count: filteredData.totalCount })}
                </h3>
              </div>
              {/* ✅ THÊM PAGINATION CONTROLS */}
              {filteredData.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <span>
                      {t('common.pagination.showing')} {((filterOptions.page - 1) * filterOptions.pageSize) + 1} - {Math.min(filterOptions.page * filterOptions.pageSize, filteredData.totalCount)} {t('common.pagination.of')} {filteredData.totalCount} {t('common.pagination.items')}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Page Size Selector */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{t('common.pagination.itemsPerPage')}:</span>
                      <select
                        value={filterOptions.pageSize}
                        onChange={(e) => setFilterOptions(prev => ({ 
                          ...prev, 
                          pageSize: parseInt(e.target.value),
                          page: 1 // Reset về trang đầu khi thay đổi page size
                        }))}
                        className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                    
                    {/* Previous Button */}
                    <button
                      onClick={() => setFilterOptions(prev => ({ 
                        ...prev, 
                        page: Math.max(1, prev.page - 1) 
                      }))}
                      disabled={filterOptions.page <= 1}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('common.pagination.previous')}
                    </button>
                    
                    {/* Page Numbers */}
                    <div className="flex items-center space-x-1">
                      {(() => {
                        const currentPage = filterOptions.page;
                        const totalPages = filteredData.totalPages;
                        const pages = [];
                        
                        // Hiển thị tối đa 5 pages
                        let startPage = Math.max(1, currentPage - 2);
                        let endPage = Math.min(totalPages, startPage + 4);
                        
                        // Điều chỉnh lại nếu gần cuối
                        if (endPage - startPage < 4) {
                          startPage = Math.max(1, endPage - 4);
                        }
                        
                        // Nút đầu và dấu ... nếu cần
                        if (startPage > 1) {
                          pages.push(
                            <button
                              key={1}
                              onClick={() => setFilterOptions(prev => ({ ...prev, page: 1 }))}
                              className={`px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded ${
                                1 === currentPage 
                                  ? 'bg-blue-500 text-white border-blue-500' 
                                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                              }`}
                            >
                              1
                            </button>
                          );
                          
                          if (startPage > 2) {
                            pages.push(
                              <span key="start-ellipsis" className="px-2 py-1 text-sm text-gray-500">...</span>
                            );
                          }
                        }
                        
                        // Các trang ở giữa
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => setFilterOptions(prev => ({ ...prev, page: i }))}
                              className={`px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded ${
                                i === currentPage 
                                  ? 'bg-blue-500 text-white border-blue-500' 
                                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                              }`}
                            >
                              {i}
                            </button>
                          );
                        }
                        
                        // Nút cuối và dấu ... nếu cần
                        if (endPage < totalPages) {
                          if (endPage < totalPages - 1) {
                            pages.push(
                              <span key="end-ellipsis" className="px-2 py-1 text-sm text-gray-500">...</span>
                            );
                          }
                          
                          pages.push(
                            <button
                              key={totalPages}
                              onClick={() => setFilterOptions(prev => ({ ...prev, page: totalPages }))}
                              className={`px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded ${
                                totalPages === currentPage 
                                  ? 'bg-blue-500 text-white border-blue-500' 
                                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                              }`}
                            >
                              {totalPages}
                            </button>
                          );
                        }
                        
                        return pages;
                      })()}
                    </div>
                    
                    {/* Next Button */}
                    <button
                      onClick={() => setFilterOptions(prev => ({ 
                        ...prev, 
                        page: Math.min(filteredData.totalPages, prev.page + 1) 
                      }))}
                      disabled={filterOptions.page >= filteredData.totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('common.pagination.next')}
                    </button>
                  </div>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('rooms.table.roomUrl')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('rooms.table.status')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('rooms.table.toolViewers')}
                      </th>
                      {/*<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('rooms.table.accounts')}
                      </th>*/}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('rooms.table.startedAt').replace(':', '')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('rooms.table.lastCheck')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('rooms.table.duration')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('rooms.table.notes')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('rooms.table.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredData.rooms.map((room) => (
                      <tr key={room.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 theme-transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                              {room.avatarThumb && room.avatarThumb.length > 0 && (  
                                <img src={room.avatarThumb} alt={room.roomUsername} className="w-10 h-10 rounded-lg" />
                              )}
                              {!room.avatarThumb &&  (
                                <EyeIcon className="w-6 h-6 text-white" />
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {room.roomId && room.roomId.length > 50 ? room.roomId.substring(0, 50) + '...' : room.roomId || ''}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{t('@')}{room.roomUsername || room.uid || room.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            room.status === 'watching'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : room.status === 'stopped'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                              : room.status === 'completed'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                          }`}>
                            {getStatusText(room.status)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                          <span className="font-medium text-gray-900 dark:text-white">{room.currentViewers || 0}</span>
                          {room.targetViewers > 0 && (
                            <span className="text-gray-500 dark:text-gray-400">/{room.targetViewers}</span>
                          )}
                        </td>
                        {/*<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <button 
                            onClick={() => handleViewAccountsInRoom(room.id)}
                            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          >
                            <UserGroupIcon className="w-4 h-4 mr-1" />
                            {t('rooms.accountsInRoom.view')}
                          </button>
                        </td>*/}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center">
                            <EyeIcon className="w-4 h-4 text-green-400 mr-1" />
                            <span className="font-medium">
                              {room.startCount !== undefined ? room.startCount.toLocaleString() : '0'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatLastCheck(room.startedAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center">
                            <EyeIcon className="w-4 h-4 text-green-400 mr-1" />
                            <span className="font-medium">
                              {room.realViewers !== undefined ? room.realViewers.toLocaleString() : '0'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatLastCheck(room.lastTimeCheckViewers)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <div className="text-xs text-gray-500">Plan: {room.duration}m</div>
                          <div>Run: {formatRuntime(room)}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {room.note || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            {/* Chart button */}
                            <button
                              onClick={() => handleOpenChart(room)}
                              className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 transition-colors"
                              title={t('rooms.actions.viewChart')}
                            >
                              <ChartBarIcon className="w-4 h-4" />
                            </button>
                            
                            {room.status === 'watching' && (
                              <button
                                onClick={() => handleStopRoom(room.id)}
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors"
                                title={t('rooms.actions.stop')}
                              >
                                <StopIcon className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDuplicateRoom(room)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors"
                              title={t('rooms.actions.duplicate')}
                            >
                              <DocumentDuplicateIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRoom(room.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors"
                              title={t('rooms.actions.delete')}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredData.rooms.length === 0 && (
                  <div className="text-center py-12">
                    <EyeIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t('rooms.empty.title')}</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('rooms.empty.description')}</p>
                  </div>
                )}
              </div>
              
              {/* ✅ THÊM PAGINATION CONTROLS */}
              {filteredData.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <span>
                      {t('common.pagination.showing')} {((filterOptions.page - 1) * filterOptions.pageSize) + 1} - {Math.min(filterOptions.page * filterOptions.pageSize, filteredData.totalCount)} {t('common.pagination.of')} {filteredData.totalCount} {t('common.pagination.items')}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Page Size Selector */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{t('common.pagination.itemsPerPage')}:</span>
                      <select
                        value={filterOptions.pageSize}
                        onChange={(e) => setFilterOptions(prev => ({ 
                          ...prev, 
                          pageSize: parseInt(e.target.value),
                          page: 1 // Reset về trang đầu khi thay đổi page size
                        }))}
                        className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                    
                    {/* Previous Button */}
                    <button
                      onClick={() => setFilterOptions(prev => ({ 
                        ...prev, 
                        page: Math.max(1, prev.page - 1) 
                      }))}
                      disabled={filterOptions.page <= 1}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('common.pagination.previous')}
                    </button>
                    
                    {/* Page Numbers */}
                    <div className="flex items-center space-x-1">
                      {(() => {
                        const currentPage = filterOptions.page;
                        const totalPages = filteredData.totalPages;
                        const pages = [];
                        
                        // Hiển thị tối đa 5 pages
                        let startPage = Math.max(1, currentPage - 2);
                        let endPage = Math.min(totalPages, startPage + 4);
                        
                        // Điều chỉnh lại nếu gần cuối
                        if (endPage - startPage < 4) {
                          startPage = Math.max(1, endPage - 4);
                        }
                        
                        // Nút đầu và dấu ... nếu cần
                        if (startPage > 1) {
                          pages.push(
                            <button
                              key={1}
                              onClick={() => setFilterOptions(prev => ({ ...prev, page: 1 }))}
                              className={`px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded ${
                                1 === currentPage 
                                  ? 'bg-blue-500 text-white border-blue-500' 
                                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                              }`}
                            >
                              1
                            </button>
                          );
                          
                          if (startPage > 2) {
                            pages.push(
                              <span key="start-ellipsis" className="px-2 py-1 text-sm text-gray-500">...</span>
                            );
                          }
                        }
                        
                        // Các trang ở giữa
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => setFilterOptions(prev => ({ ...prev, page: i }))}
                              className={`px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded ${
                                i === currentPage 
                                  ? 'bg-blue-500 text-white border-blue-500' 
                                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                              }`}
                            >
                              {i}
                            </button>
                          );
                        }
                        
                        // Nút cuối và dấu ... nếu cần
                        if (endPage < totalPages) {
                          if (endPage < totalPages - 1) {
                            pages.push(
                              <span key="end-ellipsis" className="px-2 py-1 text-sm text-gray-500">...</span>
                            );
                          }
                          
                          pages.push(
                            <button
                              key={totalPages}
                              onClick={() => setFilterOptions(prev => ({ ...prev, page: totalPages }))}
                              className={`px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded ${
                                totalPages === currentPage 
                                  ? 'bg-blue-500 text-white border-blue-500' 
                                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                              }`}
                            >
                              {totalPages}
                            </button>
                          );
                        }
                        
                        return pages;
                      })()}
                    </div>
                    
                    {/* Next Button */}
                    <button
                      onClick={() => setFilterOptions(prev => ({ 
                        ...prev, 
                        page: Math.min(filteredData.totalPages, prev.page + 1) 
                      }))}
                      disabled={filterOptions.page >= filteredData.totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('common.pagination.next')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Add Room Modal */}
          {isAddRoomModalOpen && (
            <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700 theme-transition">
                {/* Header - Fixed */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('rooms.modal.addRoom.title')}</h3>
                    <button
                      onClick={() => setIsAddRoomModalOpen(false)}
                      className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Content - Scrollable */}
                <div className="px-6 py-6 space-y-6 overflow-y-auto flex-1">
                  {/* Room URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('rooms.modal.addRoom.roomUrl')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newRoom.roomUrl}
                      onChange={(e) => setNewRoom(prev => ({ ...prev, roomUrl: e.target.value }))
                      }
                      placeholder={t('rooms.modal.addRoom.roomUrlPlaceholder')}
                      className="input-field"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('rooms.modal.addRoom.roomUrlDescription')}
                    </p>
                  </div>

                  {/* Row 1: Account Count & Duration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('rooms.modal.addRoom.targetViewers')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={newRoom.accountCount}
                        onChange={(e) => {
                          const value = e.target.value === '' ? '' : parseInt(e.target.value) || 1
                          setNewRoom(prev => ({ ...prev, accountCount: value }))
                          // Reset selected accounts nếu số lượng mới nhỏ hơn số đã chọn
                          if (value < accountFilters.selectedAccounts.length) {
                            setAccountFilters(prev => ({ 
                              ...prev, 
                              selectedAccounts: prev.selectedAccounts.slice(0, value) 
                            }))
                          }
                        }}
                        onFocus={(e) => e.target.select()} // Chọn toàn bộ text khi focus
                        min="1"
                        max="1000"
                        className="input-field"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t('rooms.modal.addRoom.availableAccounts', { count: filteredAccounts.length })}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('rooms.modal.addRoom.duration')}
                      </label>
                      <input
                        type="number"
                        value={newRoom.duration}
                        onChange={(e) => setNewRoom(prev => ({ ...prev, duration: parseInt(e.target.value) || 5 }))}
                        min="1"
                        max="300"
                        className="input-field"
                      />
                    </div>
                  </div>

                  {/* Account Filters */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">{t('rooms.modal.addRoom.accountFilters')}</h4>
                      <div className="flex items-center space-x-3">
                        {/* Debug Mode Toggle */}
                        <div className="flex items-center space-x-2">
                          <label className="text-xs text-gray-600 dark:text-gray-400">Debug:</label>
                          <button
                            onClick={() => setIsDebugMode(!isDebugMode)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              isDebugMode 
                                ? 'bg-red-500 dark:bg-red-600' 
                                : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          >
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              isDebugMode ? 'translate-x-5' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>
                        <button
                          onClick={loadAccounts}
                          className="btn-secondary text-xs"
                        >
                          <ArrowPathIcon className="w-3 h-3 inline mr-1" />
                          {t('common.reload')}
                        </button>
                      </div>
                    </div>
                    
                    {/* Debug info */}
                    {isDebugMode && (
                      <div className="mb-4 p-2 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded text-xs">
                        <div className="text-yellow-800 dark:text-yellow-200">{t('rooms.debug.totalAccounts')}: {accounts.length}</div>
                        <div className="text-yellow-800 dark:text-yellow-200">{t('rooms.debug.folders')}: {folders.length}</div>
                        <div className="text-yellow-800 dark:text-yellow-200">{t('rooms.debug.filteredAccounts')}: {filteredAccounts.length}</div>
                        <div className="text-yellow-800 dark:text-yellow-200">{t('rooms.debug.roomUrl')}: {newRoom.roomUrl}</div>
                        {newRoom.roomUrl && (
                          <div className="text-yellow-800 dark:text-yellow-200">
                            {t('rooms.debug.extractedRoomId')}: {(() => {
                              let roomId = newRoom.roomUrl.trim();
                              
                              // Nếu là URL TikTok, chỉ lấy username
                              if (newRoom.roomUrl.includes('tiktok.com')) {
                                // Extract từ format @username/live
                                const usernameMatch = newRoom.roomUrl.match(/@([^\/]+)\/live/);
                                if (usernameMatch) {
                                  roomId = usernameMatch[1]; // Chỉ lấy username
                                } else {
                                  // Fallback: extract từ các format khác nếu có
                                  const urlMatch = newRoom.roomUrl.match(/\/live\/(\w+)/);
                                  if (urlMatch) {
                                    roomId = urlMatch[1];
                                  }
                                }
                              }
                              // Nếu không phải URL, giữ nguyên input (đó chính là room_id)
                              
                              return roomId;
                            })()}
                          </div>
                        )}
                        <div className="text-yellow-800 dark:text-yellow-200">
                          {t('rooms.debug.accountsWithActiveRooms')}: {accounts.filter(acc => Array.isArray(acc.activeRooms) && acc.activeRooms.length > 0).length}
                        </div>
                        {accounts.filter(acc => Array.isArray(acc.activeRooms) && acc.activeRooms.length > 0).slice(0, 3).map(acc => (
                          <div key={acc.id} className="text-yellow-800 dark:text-yellow-200">
                            Account {acc.id}: activeRooms = {JSON.stringify(acc.activeRooms)}
                          </div>
                        ))}
                        
                        {/* Hiển thị thông tin về cooldown */}
                        {appSettings?.system?.accountCooldown > 0 && (
                          <div className="mt-2 pt-2 border-t border-yellow-300 dark:border-yellow-600">
                            <div className="text-yellow-800 dark:text-yellow-200 font-medium">
                              Account Cooldown: {appSettings.system.accountCooldown} giây
                            </div>
                            <div className="text-yellow-800 dark:text-yellow-200">
                              {accounts.filter(acc => {
                                if (!acc.lastUsed) return false;
                                const lastUsedTime = new Date(acc.lastUsed).getTime();
                                const cooldownMs = appSettings.system.accountCooldown * 1000;
                                const canUseAfter = lastUsedTime + cooldownMs;
                                return new Date().getTime() < canUseAfter;
                              }).length} accounts đang trong thời gian nghỉ
                            </div>
                          </div>
                        )}
                        
                        {/* Clear All Rooms Button */}
                        <div className="mt-3 pt-3 border-t border-yellow-300 dark:border-yellow-600">
                          <button
                            onClick={async () => {
                              if (confirm(t('rooms.messages.confirmClearAll'))) {
                                try {
                                  const result = await window.tiktokAPI.clearAllAccountRooms();
                                  if (result.success) {
                                    alert(t('rooms.messages.clearAllSuccess', { count: result.affectedAccounts }));
                                    await refreshDataForModal(); // Reload data
                                  } else {
                                    alert(t('rooms.messages.clearAllError') + ': ' + result.error);
                                  }
                                } catch (error) {
                                  console.error('Error clearing all rooms:', error);
                                  alert(t('rooms.messages.clearAllGeneralError'));
                                }
                              }
                            }}
                            className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            🗑️ {t('rooms.actions.clearAll')}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('rooms.modal.addRoom.folder')}</label>
                        <select
                          value={accountFilters.folder}
                          onChange={(e) => setAccountFilters(prev => ({ ...prev, folder: e.target.value }))}
                          className="input-field"
                        >
                          <option value="all">{t('rooms.modal.addRoom.allFolders')}</option>
                          {Array.isArray(folders) ? folders.map(folder => (
                            <option key={folder.id} value={folder.id}>{getFolderDisplayName(folder)}</option>
                          )) : null}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('rooms.modal.addRoom.accountStatus')}</label>
                        <select
                          value={accountFilters.status}
                          onChange={(e) => setAccountFilters(prev => ({ ...prev, status: e.target.value }))}
                          className="input-field"
                        >
                          <option value="all">{t('rooms.modal.addRoom.allStatuses')}</option>
                          <option value="active">{t('accounts.status.active')}</option>
                          <option value="inactive">{t('accounts.status.inactive')}</option>
                          <option value="suspended">{t('accounts.status.suspended')}</option>
                          <option value="error">{t('accounts.status.error')}</option>
                          <option value="connecting">{t('accounts.status.connecting')}</option>
                          <option value="403">{t('accounts.status.403')}</option>
                          <option value="403fetch">{t('accounts.status.403fetch')}</option>
                          <option value="die">{t('accounts.status.die')}</option>
                          <option value="diecookie">{t('accounts.status.diecookie')}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('rooms.modal.addRoom.proxy')}</label>
                        <select
                          value={accountFilters.proxy}
                          onChange={(e) => setAccountFilters(prev => ({ ...prev, proxy: e.target.value }))}
                          className="input-field"
                        >
                          <option value="with-proxy">{t('rooms.modal.addRoom.withProxy')}</option>
                          <option value="all">{t('rooms.modal.addRoom.allProxies')}</option>
                          <option value="without-proxy">{t('rooms.modal.addRoom.withoutProxy')}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('rooms.modal.addRoom.maxCurrentRooms')}</label>
                        <input
                          type="number"
                          value={accountFilters.maxCurrentRooms}
                          onChange={(e) => setAccountFilters(prev => ({ ...prev, maxCurrentRooms: parseInt(e.target.value) || 10 }))}
                          min="0"
                          max="10"
                          className="input-field"
                        />
                      </div>
                    </div>

                    {/* Filter Result */}
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-700 dark:text-blue-300">
                          <strong>{t('common.result')}:</strong> {t('rooms.modal.addRoom.filteredAccounts', { count: filteredAccounts.length })}
                        </span>
                        <span className="text-blue-700 dark:text-blue-300">
                          <strong>{t('common.selected')}:</strong> {t('rooms.modal.addRoom.selectedAccounts', { count: accountFilters.selectedAccounts.length })}
                        </span>
                      </div>
                    </div>

                    {/* Account Selection List */}
                    {filteredAccounts.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('rooms.modal.addRoom.selectSpecificAccounts')}:</h5>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                const maxSelectable = newRoom.accountCount - accountFilters.selectedAccounts.length
                                const accountsToSelect = filteredAccounts.slice(0, maxSelectable).map(acc => acc.id)
                                setAccountFilters(prev => ({ 
                                  ...prev, 
                                  selectedAccounts: [...prev.selectedAccounts, ...accountsToSelect] 
                                }))
                                // Cập nhật quick selection range theo số lượng thực tế được chọn
                                if (maxSelectable > 0) {
                                  setQuickSelection({
                                    fromPosition: 1,
                                    toPosition: Math.min(maxSelectable, filteredAccounts.length)
                                  })
                                }
                              }}
                              disabled={!canSelectMore()}
                              className="btn-primary text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {t('rooms.modal.addRoom.accountsTable.selectAll')}
                            </button>
                            <button
                              onClick={() => setAccountFilters(prev => ({ ...prev, selectedAccounts: [] }))}
                              className="btn-secondary text-xs"
                            >
                              {t('common.deselect')}
                            </button>
                          </div>
                        </div>

                        {/* Quick Selection Range */}
                        <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg">
                          <h6 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">{t('rooms.modal.addRoom.quickSelectionByPosition')}:</h6>
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <label className="text-xs text-gray-600 dark:text-gray-400">{t('common.from')}:</label>
                              <input
                                type="number"
                                value={quickSelection.fromPosition}
                                onChange={(e) => setQuickSelection(prev => ({ 
                                  ...prev, 
                                  fromPosition: Math.max(1, parseInt(e.target.value) || 1) 
                                }))}
                                min="1"
                                max={filteredAccounts.length}
                                className="w-14 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <label className="text-xs text-gray-600 dark:text-gray-400">{t('common.to')}:</label>
                              <input
                                type="number"
                                value={quickSelection.toPosition}
                                onChange={(e) => setQuickSelection(prev => ({ 
                                  ...prev, 
                                  toPosition: Math.min(filteredAccounts.length, parseInt(e.target.value) || 1) 
                                }))}
                                min="1"
                                max={filteredAccounts.length}
                                className="w-14 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>
                            <button
                              onClick={handleQuickSelection}
                              disabled={!canSelectMore()}
                              className="px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                              {t('common.selectRange')}
                            </button>
                            <div className="text-xs text-purple-600 dark:text-purple-400">
                              {t('rooms.modal.addRoom.canSelectMore', { count: newRoom.accountCount - accountFilters.selectedAccounts.length })}
                            </div>
                          </div>
                        </div>
                        
                        <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                          {filteredAccounts.map((account) => (
                            <div
                              key={account.id}
                              className="flex items-center p-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              <input
                                type="checkbox"
                                checked={accountFilters.selectedAccounts.includes(account.id)}
                                disabled={!accountFilters.selectedAccounts.includes(account.id) && !canSelectMore()}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    if (canSelectMore()) {
                                      setAccountFilters(prev => ({
                                        ...prev,
                                        selectedAccounts: [...prev.selectedAccounts, account.id]
                                      }))
                                    }
                                  } else {
                                    setAccountFilters(prev => ({
                                      ...prev,
                                      selectedAccounts: prev.selectedAccounts.filter(id => id !== account.id)
                                    }))
                                  }
                                }}
                                className="mr-3 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 bg-white dark:bg-gray-700"
                              />
                              
                              {/* Avatar và thông tin account */}
                              <div className="flex items-center flex-1 min-w-0">
                                {/* Avatar */}
                                <div className="w-8 h-8 bg-tiktok-primary rounded-lg flex items-center justify-center overflow-hidden mr-3 flex-shrink-0">
                                  {account.avatarThumb ? (
                                    <img 
                                      src={account.avatarThumb} 
                                      alt={account.username}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                  ) : (
                                    <UserIcon className="w-5 h-5 text-white" />
                                  )}
                                </div>
                                
                                {/* Thông tin account */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {account.username || `Account ${account.id}`}
                                      </p>
                                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                                        <span>{account.roomUsername || '***'}</span>
                                        {account.proxy && (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                            Có proxy
                                          </span>
                                        )}
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full ${
                                          account.status === 'active' 
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                                            : account.status === 'error' || account.status === 'die' || account.status === 'diecookie'
                                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                            : account.status === 'connecting'
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                                            : account.status === '403' || account.status === '403fetch'
                                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                                            : account.status === 'suspended'
                                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                                        }`}>
                                          {t(`accounts.status.${account.status}`) || t('accounts.status.unknown')}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 text-right ml-2">
                                      <div>Rooms: {account.currentRooms || 0}</div>
                                      {account.lastViewed && (
                                        <div>Last: {formatDate(account.lastViewed)}</div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('rooms.modal.addRoom.notes')}
                    </label>
                    <textarea
                      value={newRoom.note}
                      onChange={(e) => setNewRoom(prev => ({ ...prev, note: e.target.value }))}
                      rows="3"
                      className="input-field resize-none"
                      placeholder={t('rooms.modal.addRoom.notesPlaceholder')}
                    />
                  </div>
                </div>

                {/* Footer - Fixed */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl flex-shrink-0">
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setIsAddRoomModalOpen(false)}
                      className="btn-secondary"
                    >
                      {t('rooms.modal.addRoom.cancel')}
                    </button>
                    <button
                      onClick={handleAddRoom}
                      disabled={!newRoom.roomUrl || (accountFilters.selectedAccounts.length === 0 && filteredAccounts.length === 0)}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {accountFilters.selectedAccounts.length > 0 
                        ? t('rooms.modal.addRoom.addWithCount', { count: accountFilters.selectedAccounts.length })
                        : t('rooms.modal.addRoom.add')
                      }
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Viewer Chart Modal */}
          {isChartModalOpen && selectedRoomForChart && (
            <ViewerChart
              roomId={selectedRoomForChart.id}
              roomInfo={selectedRoomForChart}
              isOpen={isChartModalOpen}
              onClose={handleCloseChart}
            />
          )}

          {/* Modal hiển thị danh sách accounts trong room */}
          {isViewingRoomAccounts && selectedRoomForAccounts && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {t('rooms.accountsInRoom.title')} 
                      <span className="text-blue-600 dark:text-blue-400 ml-2">
                        @{selectedRoomForAccounts.roomUsername || selectedRoomForAccounts.id}
                      </span>
                    </h3>
                    <button
                      onClick={() => setIsViewingRoomAccounts(false)}
                      className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="p-6 overflow-y-auto">
                  {selectedRoomAccounts.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                      {t('rooms.accountsInRoom.noAccounts')}
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead>
                        <tr>
                          <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('rooms.accountsInRoom.username')}
                          </th>
                          <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('rooms.accountsInRoom.status')}
                          </th>
                          <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('rooms.accountsInRoom.joinedAt')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {selectedRoomAccounts.map(account => (
                          <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {account.username}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm">
                              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                account.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                account.status === 'inactive' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' : 
                                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {account.status}
                              </span>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                              {new Date(account.joinedAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                  <button
                    onClick={() => setIsViewingRoomAccounts(false)}
                    className="btn-secondary"
                  >
                    {t('common.close')}
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