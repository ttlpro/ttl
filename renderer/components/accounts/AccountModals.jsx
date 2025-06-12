import React, { useState } from 'react'
import { XMarkIcon, FolderIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

export default function AccountModals({
  isAddModalOpen,
  setIsAddModalOpen,
  isAddFolderModalOpen,
  setIsAddFolderModalOpen,
  isImportModalOpen,
  setIsImportModalOpen,
  newAccount,
  setNewAccount,
  newFolder,
  setNewFolder,
  handleAddAccount,
  handleAddFolder,
  handleImportFromText,
  loading,
  folders = [],
  selectedFolder = 'default'  // Add selectedFolder prop
}) {
  const { t } = useTranslation('common')
  const [importText, setImportText] = useState('')
  const [importFolderId, setImportFolderId] = useState(selectedFolder || 'default')  // Use selectedFolder

  // Update importFolderId when selectedFolder changes or modal opens
  React.useEffect(() => {
    if (isImportModalOpen) {
      setImportFolderId(selectedFolder || 'default')
    }
  }, [isImportModalOpen, selectedFolder])

  const handleImportSubmit = async () => {
    if (!importText.trim()) {
      alert(t('accounts.modal.importText.validation.emptyData'))
      return
    }
    
    await handleImportFromText(importText, importFolderId)
    setImportText('')
    // Keep importFolderId as is, don't reset to 'default'
    setIsImportModalOpen(false)
  }

  const getFolderDisplayName = (folder) => {
    if (folder.id === 'accounts-default' || folder.name === 'Mặc định') {
      return t('common.default')
    }
    return folder.name
  }

  return (
    <>
      {/* Add Account Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('accounts.modal.addAccount.title')}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('accounts.modal.addAccount.username')}
                </label>
                <input
                  type="text"
                  value={newAccount.username}
                  onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={t('accounts.modal.addAccount.usernamePlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('accounts.modal.addAccount.password')}
                </label>
                <input
                  type="password"
                  value={newAccount.password}
                  onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={t('accounts.modal.addAccount.passwordPlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('accounts.modal.addAccount.folder')}
                </label>
                <select
                  value={newAccount.folderId}
                  onChange={(e) => setNewAccount({ ...newAccount, folderId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {folders.map(folder => (
                    <option key={folder.id} value={folder.id}>
                      {getFolderDisplayName(folder)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="btn-secondary"
              >
                {t('accounts.modal.addAccount.cancel')}
              </button>
              <button
                onClick={handleAddAccount}
                className="btn-primary"
                disabled={loading}
              >
                {loading ? t('accounts.modal.addAccount.adding') : t('accounts.modal.addAccount.add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Folder Modal */}
      {isAddFolderModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('accounts.modal.addFolder.title')}
              </h3>
              <button
                onClick={() => setIsAddFolderModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('accounts.modal.addFolder.name')}
                </label>
                <input
                  type="text"
                  value={newFolder.name}
                  onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={t('accounts.modal.addFolder.namePlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('accounts.modal.addFolder.description')}
                </label>
                <input
                  type="text"
                  value={newFolder.description}
                  onChange={(e) => setNewFolder({ ...newFolder, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={t('accounts.modal.addFolder.descriptionPlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('accounts.modal.addFolder.color')}
                </label>
                <div className="flex space-x-2">
                  {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewFolder({ ...newFolder, color })}
                      className={`w-8 h-8 rounded-lg border-2 ${
                        newFolder.color === color ? 'border-gray-400' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setIsAddFolderModalOpen(false)}
                className="btn-secondary"
              >
                {t('accounts.modal.addFolder.cancel')}
              </button>
              <button
                onClick={handleAddFolder}
                className="btn-primary"
                disabled={loading}
              >
                {loading ? t('accounts.modal.addFolder.adding') : t('accounts.modal.addFolder.add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import from Text Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('accounts.modal.importText.title')}
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Folder Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('accounts.modal.importText.folder')}
                </label>
                <select
                  value={importFolderId}
                  onChange={(e) => setImportFolderId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {folders.map(folder => (
                    <option key={folder.id} value={folder.id}>
                      {getFolderDisplayName(folder)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('accounts.modal.importText.text')}
                </label>
                <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  {t('accounts.modal.importText.formatDescription')}
                </div>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full h-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  placeholder={t('accounts.modal.importText.textPlaceholder')}
                />
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-4 4a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>{t('common.note')}:</strong>
                    </p>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1 list-disc list-inside">
                      <li>{t('accounts.modal.importText.note1')}</li>
                      <li>{t('accounts.modal.importText.note2')}</li>
                      <li>{t('accounts.modal.importText.note3')}</li>
                      <li>{t('accounts.modal.importText.note4')}</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="btn-secondary"
                >
                  {t('accounts.modal.importText.cancel')}
                </button>
                <button
                  onClick={handleImportSubmit}
                  disabled={loading || !importText.trim()}
                  className="btn-primary"
                >
                  {loading ? t('accounts.modal.importText.importing') : t('accounts.modal.importText.import')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}