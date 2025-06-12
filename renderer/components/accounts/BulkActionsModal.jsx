import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  XMarkIcon,
  LinkIcon,
  TrashIcon,
  ShieldCheckIcon,
  FolderIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

export default function BulkActionsModal({ 
  isOpen, 
  onClose, 
  selectedCount, // Đổi từ selectedAccountIds thành selectedCount
  folders, 
  onBulkAction, 
  loading 
}) {
  const { t } = useTranslation('common')
  const [selectedFolder, setSelectedFolder] = useState('')
  
  if (!isOpen) return null

  const handleAction = (action, data = {}) => {
    onBulkAction(action, data)
    if (action !== 'set-proxy') {
      onClose()
    }
  }

  const getFolderDisplayName = (folder) => {
    if (folder.id === 'accounts-default' || folder.name === 'Mặc định') {
      return t('common.default')
    }
    return folder.name
  }

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 modal-backdrop">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700 theme-transition">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('accounts.bulkActions.title')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('accounts.bulkActions.selectedCount', { count: selectedCount })}
          </p>
        </div>

        <div className="space-y-3">
          {/* Set Proxy */}
          <button
            onClick={() => handleAction('set-proxy')}
            disabled={loading}
            className="w-full flex items-center p-3 text-left bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors border border-blue-200 dark:border-blue-700"
          >
            <LinkIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
            <div>
              <div className="text-sm font-medium text-blue-900 dark:text-blue-300">{t('accounts.bulkActions.setProxy.title')}</div>
              <div className="text-xs text-blue-700 dark:text-blue-400">{t('accounts.bulkActions.setProxy.description')}</div>
            </div>
          </button>

          {/* Remove Proxy */}
          <button
            onClick={() => handleAction('removeProxy')}
            disabled={loading}
            className="w-full flex items-center p-3 text-left bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 rounded-lg transition-colors border border-orange-200 dark:border-orange-700"
          >
            <XMarkIcon className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-3" />
            <div>
              <div className="text-sm font-medium text-orange-900 dark:text-orange-300">{t('accounts.bulkActions.removeProxy.title')}</div>
              <div className="text-xs text-orange-700 dark:text-orange-400">{t('accounts.bulkActions.removeProxy.description')}</div>
            </div>
          </button>

          {/* Set Status */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('accounts.bulkActions.setStatus.title')}:</div>
            <select
              onChange={(e) => e.target.value && handleAction('setStatus', { status: e.target.value })}
              disabled={loading}
              className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              defaultValue=""
            >
              <option value="">{t('common.selectStatus')}</option>
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

          {/* Move to Folder */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('accounts.bulkActions.moveToFolder.title')}:</div>
            <select
              onChange={(e) => e.target.value && handleAction('moveToFolder', { folderId: e.target.value })}
              disabled={loading}
              className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              defaultValue=""
            >
              <option value="">{t('accounts.bulkActions.moveToFolder.selectFolder')}</option>
              {folders.map(folder => (
                <option key={folder.id} value={folder.id}>
                  {getFolderDisplayName(folder)}
                </option>
              ))}
            </select>
          </div>

          {/* Check Activity */}
          <button
            onClick={() => handleAction('checkActivity')}
            disabled={loading}
            className="w-full flex items-center p-3 text-left bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg transition-colors border border-purple-200 dark:border-purple-700"
          >
            <ClockIcon className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-3" />
            <div>
              <div className="text-sm font-medium text-purple-900 dark:text-purple-300">{t('accounts.bulkActions.checkActivity.title')}</div>
              <div className="text-xs text-purple-700 dark:text-purple-400">{t('accounts.bulkActions.checkActivity.description')}</div>
            </div>
          </button>

          {/* Delete */}
          <button
            onClick={() => {
              if (confirm(t('accounts.bulkActions.delete.confirm', { count: selectedCount }))) {
                handleAction('delete')
              }
            }}
            disabled={loading}
            className="w-full flex items-center p-3 text-left bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors border border-red-200 dark:border-red-700"
          >
            <TrashIcon className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" />
            <div>
              <div className="text-sm font-medium text-red-900 dark:text-red-300">{t('accounts.bulkActions.delete.title')}</div>
              <div className="text-xs text-red-700 dark:text-red-400">{t('accounts.bulkActions.delete.description')}</div>
            </div>
          </button>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={loading}
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}