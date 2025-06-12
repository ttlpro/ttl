import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import StaticLayout from '../components/StaticLayout'
import ClientOnly from '../components/ClientOnly'
import { useTheme } from '../contexts/ThemeContext'
import { useTranslation } from 'react-i18next'
import { formatDate, formatDateTime } from '../utils/i18nUtils'
import { 
  ChartBarIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  UserGroupIcon,
  ClockIcon,
  CalendarDaysIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { 
  ChartBarIcon as ChartBarIconSolid,
  EyeIcon as EyeIconSolid
} from '@heroicons/react/24/solid'

export default function AnalyticsPage() {
  const { isDarkMode } = useTheme()
  const { t } = useTranslation('common')
  const [stats, setStats] = useState({
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalAccounts: 0,
    activeViewers: 0,
    totalRuntime: 0,
    dailyStats: [],
    accountStats: [],
    recentActivities: []
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7days')

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const result = await window.tiktokAPI.getAnalytics({ timeRange })
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const getTimeRangeText = (range) => {
    switch (range) {
      case '24h': return t('analytics.timeRange.24h')
      case '7days': return t('analytics.timeRange.7days')
      case '30days': return t('analytics.timeRange.30days')
      case '90days': return t('analytics.timeRange.90days')
      default: return t('analytics.timeRange.7days')
    }
  }

  return (
    <StaticLayout activePage="analytics">
      <Head>
        <title>{t('analytics.title')}</title>
      </Head>
      
      <ClientOnly fallback={
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2 w-48"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-64"></div>
            </div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
          <div className="h-64 bg-white dark:bg-gray-800 rounded-xl p-6">
            <div className="h-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
      }>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('analytics.title')}</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">{t('analytics.description')}</p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-tiktok-primary focus:border-tiktok-primary ${
                  isDarkMode 
                    ? 'border-gray-600 bg-gray-700 text-white' 
                    : 'border-gray-300 bg-white text-gray-900'
                }`}
              >
                <option value="24h">{t('analytics.timeRange.24h')}</option>
                <option value="7days">{t('analytics.timeRange.7days')}</option>
                <option value="30days">{t('analytics.timeRange.30days')}</option>
                <option value="90days">{t('analytics.timeRange.90days')}</option>
              </select>
              <button
                onClick={loadAnalytics}
                className="flex items-center px-4 py-2 bg-tiktok-primary text-white rounded-lg hover:bg-tiktok-dark transition-colors"
              >
                <ArrowPathIcon className="w-5 h-5 mr-2" />
                {t('analytics.refresh')}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin" />
              <span className="ml-3 text-gray-600 dark:text-gray-300">{t('analytics.loading')}</span>
            </div>
          ) : (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">{t('analytics.totalViews')}</p>
                      <p className="text-3xl font-bold">{formatNumber(stats.totalViews)}</p>
                      <p className="text-blue-100 text-xs mt-1">{getTimeRangeText(timeRange)}</p>
                    </div>
                    <EyeIconSolid className="w-12 h-12 text-blue-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100 text-sm">{t('analytics.totalLikes')}</p>
                      <p className="text-3xl font-bold">{formatNumber(stats.totalLikes)}</p>
                      <p className="text-red-100 text-xs mt-1">{getTimeRangeText(timeRange)}</p>
                    </div>
                    <HeartIcon className="w-12 h-12 text-red-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">{t('analytics.totalComments')}</p>
                      <p className="text-3xl font-bold">{formatNumber(stats.totalComments)}</p>
                      <p className="text-green-100 text-xs mt-1">{getTimeRangeText(timeRange)}</p>
                    </div>
                    <ChatBubbleLeftIcon className="w-12 h-12 text-green-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">{t('analytics.activeViewers')}</p>
                      <p className="text-3xl font-bold">{stats.activeViewers}</p>
                      <p className="text-purple-100 text-xs mt-1">{t('analytics.current')}</p>
                    </div>
                    <UserGroupIcon className="w-12 h-12 text-purple-200" />
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`rounded-xl shadow-sm border p-6 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('analytics.totalRuntime')}</h3>
                    <ClockIcon className={`w-6 h-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                  <div className="text-center">
                    <p className={`text-4xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatDuration(stats.totalRuntime)}
                    </p>
                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{getTimeRangeText(timeRange)}</p>
                  </div>
                </div>

                <div className={`rounded-xl shadow-sm border p-6 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('analytics.totalAccounts')}</h3>
                    <UserGroupIcon className={`w-6 h-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                  <div className="text-center">
                    <p className={`text-4xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalAccounts}</p>
                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('analytics.used')}</p>
                  </div>
                </div>

                <div className={`rounded-xl shadow-sm border p-6 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('analytics.averagePerformance')}</h3>
                    <ChartBarIconSolid className={`w-6 h-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                  <div className="text-center">
                    <p className={`text-4xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {stats.totalAccounts > 0 ? Math.round(stats.totalViews / stats.totalAccounts) : 0}
                    </p>
                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('analytics.viewsPerAccount')}</p>
                  </div>
                </div>
              </div>

              {/* Charts and Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Stats Chart */}
                <div className={`rounded-xl shadow-sm border p-6 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-200'
                }`}>
                  <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('analytics.dailyStats')}</h3>
                  
                  {stats.dailyStats && stats.dailyStats.length > 0 ? (
                    <div className="space-y-4">
                      {stats.dailyStats.slice(0, 7).map((day, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-tiktok-primary rounded-full mr-3"></div>
                            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {formatDate(day.date)}
                            </span>
                          </div>
                          <div className="flex space-x-4 text-sm">
                            <span className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{formatNumber(day.views)} {t('analytics.views')}</span>
                            <span className={`${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{formatNumber(day.likes)} {t('analytics.likes')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <ChartBarIcon className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                      <p>{t('analytics.noData')}</p>
                    </div>
                  )}
                </div>

                {/* Account Performance */}
                <div className={`rounded-xl shadow-sm border p-6 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-200'
                }`}>
                  <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('analytics.topAccounts')}</h3>
                  
                  {stats.accountStats && stats.accountStats.length > 0 ? (
                    <div className="space-y-4">
                      {stats.accountStats.slice(0, 5).map((account, index) => (
                        <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                          isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                        }`}>
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                              index === 0 ? 'bg-yellow-500' : 
                              index === 1 ? 'bg-gray-400' : 
                              index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="ml-3">
                              <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{account.username}</p>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{account.platform}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatNumber(account.totalViews)}</p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('analytics.views')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <UserGroupIcon className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                      <p>{t('analytics.noAccountData')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activities */}
              <div className={`rounded-xl shadow-sm border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className={`px-6 py-4 border-b ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('analytics.recentActivities')}</h3>
                </div>
                
                {stats.recentActivities && stats.recentActivities.length > 0 ? (
                  <div className={`divide-y ${
                    isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
                  }`}>
                    {stats.recentActivities.slice(0, 10).map((activity, index) => (
                      <div key={index} className="px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-4 ${
                            activity.type === 'start' ? 'bg-green-400' :
                            activity.type === 'stop' ? 'bg-red-400' :
                            activity.type === 'error' ? 'bg-yellow-400' : 'bg-blue-400'
                          }`}></div>
                          <div>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{activity.message}</p>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{activity.account}</p>
                          </div>
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatDateTime(activity.timestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <CalendarDaysIcon className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                    <p>{t('analytics.noActivity')}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </ClientOnly>
    </StaticLayout>
  )
}
