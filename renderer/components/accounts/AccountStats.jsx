import React from 'react'
import { useTranslation } from 'react-i18next'
import { 
  UserIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export default function AccountStats({ accounts = [] }) {
  const { t } = useTranslation('common')

  const activeCount = accounts.filter(acc => acc.status === 'active').length
  const problemCount = accounts.filter(acc => 
    ['suspended', 'cookiedie', 'enter403', 'fetch403'].includes(acc.status)
  ).length

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-shrink-0">
      <div className="stat-card">
        <div className="flex items-center">
          <UserIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('accounts.stats.totalAccounts')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{accounts.length}</p>
          </div>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-green-500 dark:bg-green-400 rounded-full"></div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('accounts.stats.activeAccounts')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeCount}</p>
          </div>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('accounts.stats.problemAccounts')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{problemCount}</p>
          </div>
        </div>
      </div>
    </div>
  )
}