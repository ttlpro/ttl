import React from 'react'
import { FolderIcon, ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

export default function FolderSidebar({ 
  folders, 
  selectedFolder, 
  setSelectedFolder, 
  folderStats, 
  setIsAddFolderModalOpen,
  handleDeleteFolder,
  handleResetFolders 
}) {
  const { t } = useTranslation('common')

  const getFolderDisplayName = (folder) => {
    if (folder.id === 'accounts-default' || folder.name === 'Mặc định') {
      return t('common.default')
    }
    return folder.name
  }

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col theme-transition">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('accounts.folders.title')}</h2>
          {/* <button
            onClick={handleResetFolders}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={t('accounts.folders.resetToDefault')}
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button> */}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {folders.map((folder) => (
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
              />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">{getFolderDisplayName(folder)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {folderStats[folder.id] || 0} {t('accounts.folders.accountCount')}
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
        ))}
      </div>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setIsAddFolderModalOpen(true)}
          className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          + {t('accounts.folders.addNew')}
        </button>
      </div>
    </div>
  )
}