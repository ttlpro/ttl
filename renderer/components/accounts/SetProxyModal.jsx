import React, { useState, useEffect, useMemo } from 'react'
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

export default function SetProxyModal({ 
  isOpen, 
  onClose, 
  selectedAccountIds, 
  proxyFolders,
  setProxyData,
  setSetProxyData,
  onSetProxy,
  loading,
  getProxyStatistics,
  settings
}) {
  const { t } = useTranslation('common')
  if (!isOpen) return null

  // Lấy giá trị maxAccountsPerProxy từ settings
  // Settings hiện tại chỉ là object settings, không còn lồng trong { success, settings }
  const maxAccountsPerProxy = settings?.proxy?.maxAccountsPerProxy || 5
  
  // Log để debug
  // console.log('SetProxyModal received settings:', settings);
  // console.log('maxAccountsPerProxy in modal:', maxAccountsPerProxy);
  
  // **FIX**: Truyền proxyFolderId vào getProxyStatistics
  const proxyStats = getProxyStatistics(setProxyData.proxyFolderId)
  const availableProxies = proxyStats.filter(proxy => proxy.canAssign)
  const totalProxies = proxyStats.length
  const proxiesNeeded = Math.ceil(selectedAccountIds.length / maxAccountsPerProxy)
  
  const selectedValidProxies = setProxyData.selectedProxies.filter(pid => 
    availableProxies.some(ap => ap.id === pid)
  )
  
  const totalAvailableSlots = selectedValidProxies.reduce((total, proxyId) => {
    const proxy = availableProxies.find(p => p.id === proxyId)
    return total + (proxy?.availableSlots || 0)
  }, 0)

  // **FIX**: Cải thiện logic validation - kiểm tra chặt chẽ hơn
  const hasAvailableProxies = availableProxies.length > 0
  const hasSelectedProxies = selectedValidProxies.length > 0
  const hasEnoughProxies = selectedValidProxies.length >= proxiesNeeded
  const hasEnoughSlots = totalAvailableSlots >= selectedAccountIds.length
  
  // Điều kiện để có thể gán proxy:
  // 1. Phải có proxy khả dụng trong thư mục
  // 2. Phải đã chọn ít nhất 1 proxy
  // 3. Phải đã chọn đủ số proxy cần thiết
  // 4. Phải có đủ slot cho tất cả accounts
  const isValidSelection = hasAvailableProxies && hasSelectedProxies && hasEnoughProxies && hasEnoughSlots

  // **FIX**: Thêm validation message rõ ràng hơn
  const getValidationMessage = () => {
    if (!hasAvailableProxies) {
      return { type: 'error', message: t('accounts.modal.setProxy.validation.noAvailableProxies') }
    }
    if (!hasSelectedProxies) {
      return { type: 'warning', message: t('accounts.modal.setProxy.validation.selectAtLeastOne') }
    }
    if (!hasEnoughProxies) {
      return { type: 'warning', message: t('accounts.modal.setProxy.validation.needMoreProxies', { count: proxiesNeeded - selectedValidProxies.length }) }
    }
    if (!hasEnoughSlots) {
      return { type: 'warning', message: t('accounts.modal.setProxy.validation.notEnoughSlots', { needed: selectedAccountIds.length, available: totalAvailableSlots }) }
    }
    return { type: 'success', message: t('accounts.modal.setProxy.validation.enoughProxies', { slots: totalAvailableSlots, accounts: selectedAccountIds.length }) }
  }

  const validationInfo = getValidationMessage()

  const getFolderDisplayName = (folder) => {
    if (folder.id === 'accounts-default' || folder.name === 'Mặc định') {
      return t('common.default')
    }
    return folder.name
  }

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 modal-backdrop">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200 dark:border-gray-700 theme-transition">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('accounts.modal.setProxy.title', { count: selectedAccountIds.length })}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Statistics Overview */}
        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-blue-600 dark:text-blue-400 font-medium">{t('accounts.modal.setProxy.totalProxies')}</div>
              <div className="text-blue-900 dark:text-blue-100 font-semibold">{totalProxies}</div>
            </div>
            <div>
              <div className="text-blue-600 dark:text-blue-400 font-medium">{t('accounts.modal.setProxy.availableProxies')}</div>
              <div className="text-blue-900 dark:text-blue-100 font-semibold">{availableProxies.length}</div>
            </div>
            <div>
              <div className="text-blue-600 dark:text-blue-400 font-medium">{t('accounts.modal.setProxy.minProxiesNeeded')}</div>
              <div className="text-blue-900 dark:text-blue-100 font-semibold">{proxiesNeeded} {t('accounts.modal.setProxy.proxies')}</div>
            </div>
            <div>
              <div className="text-blue-600 dark:text-blue-400 font-medium">{t('accounts.modal.setProxy.selectedProxies')}</div>
              <div className="text-blue-900 dark:text-blue-100 font-semibold">{selectedValidProxies.length} {t('accounts.modal.setProxy.proxies')}</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Proxy Folder Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('accounts.modal.setProxy.proxyFolder')}
            </label>
            <select
              value={setProxyData.proxyFolderId}
              onChange={(e) => setSetProxyData(prev => ({ 
                ...prev, 
                proxyFolderId: e.target.value,
                selectedProxies: [] // Reset selection when folder changes
              }))}
              className="input-field"
            >
              {proxyFolders.map(folder => (
                <option key={folder.id} value={folder.id}>
                  {getFolderDisplayName(folder)}
                </option>
              ))}
            </select>
          </div>

          {/* Accounts per Proxy Info */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
            <div className="flex items-center">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {t('accounts.modal.setProxy.accountsPerProxy')}: <span className="font-semibold">{maxAccountsPerProxy}</span>
              </div>
              <div className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                ({t('accounts.modal.setProxy.configuredInSettings')})
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t('accounts.modal.setProxy.accountsPerProxyNote')}
            </p>
          </div>

          {/* **FIX**: Validation Message - hiển thị message phù hợp với từng trường hợp */}
          <div className={`p-3 rounded-lg text-sm ${
            validationInfo.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700'
              : validationInfo.type === 'error'
              ? 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700'
              : 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700'
          }`}>
            <div className="flex items-center">
              <span className="mr-2">
                {validationInfo.type === 'success' ? '✓' : validationInfo.type === 'error' ? '❌' : '⚠️'}
              </span>
              {validationInfo.message}
            </div>
          </div>

          {/* Proxy Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('accounts.modal.setProxy.selectProxies', { selected: selectedValidProxies.length, needed: proxiesNeeded })}
            </label>
            
            {totalProxies === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {t('accounts.modal.setProxy.noProxiesInFolder')}
              </div>
            ) : !hasAvailableProxies ? (
              <div className="text-center py-8 text-red-500 dark:text-red-400">
                <div className="mb-2">❌ {t('accounts.modal.setProxy.allProxiesFull')}</div>
                <div className="text-sm">{t('accounts.modal.setProxy.selectOtherFolder')}</div>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {proxyStats.map(proxy => (
                  <div 
                    key={proxy.id} 
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      proxy.canAssign
                        ? setProxyData.selectedProxies.includes(proxy.id)
                          ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 cursor-pointer'
                        : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 opacity-60 cursor-not-allowed'
                    }`}
                    onClick={() => {
                      if (!proxy.canAssign) return
                      
                      const isSelected = setProxyData.selectedProxies.includes(proxy.id)
                      if (isSelected) {
                        setSetProxyData(prev => ({
                          ...prev,
                          selectedProxies: prev.selectedProxies.filter(pid => pid !== proxy.id)
                        }))
                      } else {
                        setSetProxyData(prev => ({
                          ...prev,
                          selectedProxies: [...prev.selectedProxies, proxy.id]
                        }))
                      }
                    }}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{proxy.host}:{proxy.port}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {t('accounts.modal.setProxy.availableSlots', { slots: proxy.availableSlots })}
                      </div>
                    </div>
                    <div className="ml-4">
                      {setProxyData.selectedProxies.includes(proxy.id) && (
                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={loading}
          >
            {t('accounts.modal.setProxy.cancel')}
          </button>
          <button
            onClick={() => onSetProxy({
              ...setProxyData,
              accountsPerProxy: maxAccountsPerProxy // Sử dụng giá trị từ settings.proxy.maxAccountsPerProxy
            })}
            className="btn-primary"
            disabled={loading || !isValidSelection}
          >
            {loading ? t('accounts.modal.setProxy.applying') : t('accounts.modal.setProxy.apply')}
          </button>
        </div>
      </div>
    </div>
  )
}