import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import StaticLayout from '../components/StaticLayout'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { ProtectedRoute, AuthPage } from '../components/auth'
import { useTranslation } from 'react-i18next'
import { formatDate } from '../utils/i18nUtils'
import { 
  UserGroupIcon, 
  ShieldCheckIcon, 
  EyeIcon, 
  ClockIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  PresentationChartLineIcon
} from '@heroicons/react/24/outline'

export default function HomePage() {
  const { t, i18n } = useTranslation('common')
  const [stats, setStats] = useState({
    totalAccounts: 0,
    totalProxies: 0,
    activeViewers: 0,
    totalViews: 0,
    watchingRooms: 0
  })
  const [isClient, setIsClient] = useState(false)
  const [loading, setLoading] = useState(true)
  const [recentActivities, setRecentActivities] = useState([])
  const [appSettings, setAppSettings] = useState(null);

  useEffect(() => {
    setIsClient(true)
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
    loadDashboardData()
    
    // Thiết lập auto refresh mỗi 10 giây
    const interval = setInterval(() => {
      loadDashboardData()
    }, 10000)
    
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        // Lấy thông tin tài khoản và proxy
        const [accounts, proxies, viewerStats] = await Promise.all([
          window.tiktokAPI.getAccounts(),
          window.tiktokAPI.getProxies(),
          window.electronAPI.invoke('get-viewer-manager-stats')
        ])
        
        // Lấy thống kê viewer
        let activeViewers = 0
        let totalViews = 0
        
        if (viewerStats && viewerStats.success) {
          activeViewers = viewerStats.stats.activeViewers || 0
          totalViews = viewerStats.stats.totalAccounts || 0
        }
        
        // Lấy rooms và tính toán tổng số room đang watching
        const roomsResult = await window.tiktokAPI.getRooms()
        let watchingRooms = 0
        
        if (roomsResult && roomsResult.success) {
          const allRooms = roomsResult.rooms || []
          watchingRooms = allRooms.filter(room => room.status === 'watching').length
          
          // Tính tổng số lượng accounts đang xem từ tất cả các room
          let totalAccountsInRooms = 0
          for (const room of allRooms) {
            if (room.status === 'watching') {
              // Lấy số lượng accounts cho room này
              try {
                const accountsInRoom = await window.tiktokAPI.getAccountsInRoom(room.id)
                if (accountsInRoom && Array.isArray(accountsInRoom)) {
                  totalAccountsInRooms += accountsInRoom.length
                }
              } catch (error) {
                console.error(`Error getting accounts for room ${room.id}:`, error)
              }
            }
          }
          
          // Nếu có accounts trong rooms, sử dụng số đó làm activeViewers
          if (totalAccountsInRooms > 0) {
            activeViewers = totalAccountsInRooms
          }
          
          // Tính tổng lượt xem từ all rooms
          const totalViewsFromRooms = allRooms.reduce((sum, room) => sum + (room.currentViewers || 0), 0)
          if (totalViewsFromRooms > 0) {
            totalViews = totalViewsFromRooms
          }
          
          // Tạo recent activities từ những room gần nhất
          const recentRooms = [...allRooms]
            .sort((a, b) => {
              const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(0)
              const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(0)
              return dateB - dateA
            })
            .slice(0, 5)
          
          const activities = recentRooms.map(room => {
            const timestamp = room.updatedAt || room.createdAt || new Date().toISOString()
            const date = new Date(timestamp)
            const timeAgo = getTimeAgo(date)
            
            let action, status, actionKey
            if (room.status === 'watching') {
              actionKey = 'home.activity.roomWatching'
              action = t('home.activity.roomWatching', { roomId: room.roomUsername || room.roomId || room.id })
              status = 'info'
            } else if (room.status === 'stopped') {
              actionKey = 'home.activity.roomStopped'
              action = t('home.activity.roomStopped', { roomId: room.roomUsername || room.roomId || room.id })
              status = 'warning'
            } else if (room.status === 'completed') {
              actionKey = 'home.activity.roomCompleted'
              action = t('home.activity.roomCompleted', { roomId: room.roomUsername || room.roomId || room.id })
              status = 'success'
            } else {
              actionKey = 'home.activity.roomUpdated'
              action = t('home.activity.roomUpdated', { roomId: room.roomUsername || room.roomId || room.id })
              status = 'default'
            }
            
            return {
              id: room.id,
              action,
              roomId: room.roomUsername || room.roomId || room.id,
              actionKey,
              time: timeAgo,
              status,
              date
            }
          })
          
          setRecentActivities(activities)
        }
        
        setStats({
          totalAccounts: accounts.length || 0,
          totalProxies: proxies.length || 0,
          activeViewers,
          totalViews,
          watchingRooms
        })
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Helper function to format time ago
  const getTimeAgo = (date) => {
    const now = new Date()
    const diffMs = now - date
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMinutes < 1) return t('rooms.status.justNow')
    if (diffMinutes < 60) return t('rooms.status.minutesAgo', { count: diffMinutes })
    if (diffHours < 24) return t('rooms.status.hoursAgo', { count: diffHours })
    return t('rooms.status.daysAgo', { count: diffDays })
  }

  const getStatCards = () => [
    {
      title: t('accounts.title'),
      value: stats.totalAccounts,
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: t('proxies.title'),
      value: stats.totalProxies,
      icon: ShieldCheckIcon,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: t('home.stats.activeViewers'),
      value: stats.activeViewers,
      icon: EyeIcon,
      color: 'bg-pink-500',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-600',
      loading: loading
    },
    {
      title: t('home.stats.watchingRooms'),
      value: stats.watchingRooms,
      icon: PresentationChartLineIcon,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      loading: loading
    }
  ]

  return (
    <ProtectedRoute
      fallback={<AuthPage />}
    >
      <StaticLayout activePage="home">
        <Head>
          <title>{t('home.pageTitle', { appTitle: appSettings?.app?.title || t('app.title') })}</title>
        </Head>
        
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('home.title')}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{t('home.welcome', { appTitle: appSettings?.app?.title || t('app.title') })}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('home.today')}</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {isClient ? formatDate(new Date()) : '...'}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {getStatCards().map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                        {stat.loading ? 
                          <span className="animate-pulse">...</span> : 
                          stat.value
                        }
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bgColor} dark:bg-opacity-20`}>
                      <Icon className={`w-8 h-8 ${stat.textColor}`} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Quick Actions & Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('home.quickActions')}</h3>
              <div className="space-y-3">
                <a href="/accounts" className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg hover:shadow-md transition-all duration-200">
                  <UserGroupIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{t('home.actions.manageAccounts')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('home.actions.manageAccountsDesc')}</p>
                  </div>
                </a>
                <a href="/proxies" className="flex items-center p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg hover:shadow-md transition-all duration-200">
                  <ShieldCheckIcon className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{t('home.actions.manageProxies')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('home.actions.manageProxiesDesc')}</p>
                  </div>
                </a>
                <a href="/rooms" className="flex items-center p-4 bg-gradient-to-r from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-lg hover:shadow-md transition-all duration-200">
                  <EyeIcon className="w-6 h-6 text-pink-600 dark:text-pink-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{t('home.actions.manageRooms')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('home.actions.manageRoomsDesc')}</p>
                  </div>
                </a>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('home.activity.recentActivity')}</h3>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center space-x-3 animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mt-2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.status === 'success' ? 'bg-green-400' :
                        activity.status === 'info' ? 'bg-blue-400' :
                        activity.status === 'warning' ? 'bg-yellow-400' : 'bg-gray-400'
                      }`}></div>
                      <div className="flex-1">
                        {/* <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</p> */}
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{t(activity.actionKey, { roomId: activity.roomId })}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          {getTimeAgo(activity.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <ClockIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>{t('home.activity.noRecentActivity')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </StaticLayout>
    </ProtectedRoute>
  )
}
