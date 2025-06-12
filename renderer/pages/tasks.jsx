import React, { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import StaticLayout from '../components/StaticLayout'
import ClientOnly from '../components/ClientOnly'
import { useAuth } from '../contexts/AuthContext'
import { ProtectedRoute, AuthPage } from '../components/auth'
import { useTranslation } from 'react-i18next'
import { 
  PlayIcon,
  PauseIcon,
  TrashIcon,
  PencilIcon,
  PlusIcon,
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { PlayIcon as PlayIconSolid } from '@heroicons/react/24/solid'
import Toggle from '../components/Toggle'
import toast from 'react-hot-toast'
import TaskToggle from '../components/TaskToggle'

export default function TasksPage() {
  const { t } = useTranslation('common')
  const { hasValidLicense, limits } = useAuth()
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [availableHandlers, setAvailableHandlers] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    handler: '',
    interval: 300000, // 5 minutes default
    enabled: false
  })

  useEffect(() => {
    loadTasks()
    loadAvailableHandlers()
  }, [])

  const loadTasks = async () => {
    try {
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        const result = await window.tiktokAPI.getAllTasks()
        if (result.success) {
          setTasks(result.data || [])
        } else {
          toast.error(t('tasks.messages.loadError') || 'Không thể tải danh sách tasks')
        }
      }
    } catch (error) {
      console.error('Error loading tasks:', error)
      toast.error(t('common.error'))
    } finally {
      setIsLoading(false)
    }
  }

  const loadAvailableHandlers = async () => {
    try {
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        const result = await window.tiktokAPI.getAvailableHandlers()
        if (result.success) {
          setAvailableHandlers(result.data || [])
        }
      }
    } catch (error) {
      console.error('Error loading handlers:', error)
    }
  }

  const handleAddTask = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        const result = await window.tiktokAPI.addTask(formData)
        if (result.success) {
          await loadTasks()
          toast.success(t('tasks.messages.addSuccess'))
          setShowAddModal(false)
          resetForm()
        } else {
          toast.error(result.message || t('common.error'))
        }
      }
    } catch (error) {
      console.error('Error adding task:', error)
      toast.error(t('common.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateTask = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      if (typeof window !== 'undefined' && window.tiktokAPI && editingTask) {
        const result = await window.tiktokAPI.updateTask(editingTask.id, formData)
        if (result.success) {
          await loadTasks()
          toast.success(t('tasks.messages.updateSuccess'))
          setShowEditModal(false)
          setEditingTask(null)
          resetForm()
        } else {
          toast.error(result.message || t('common.error'))
        }
      }
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error(t('common.error'))
    } finally {
      setIsSubmitting(false)
    }
  }
  const hideActionTask = (taskId, task) => {
    if(["monitorRooms","updateAccountsInfo","autoStopExpiredRooms","refreshLicense"].includes(task.handler)) {
      return true
    }
    return false
  }
  const hideListTask = (taskId, task) => {
    // return false;
    if(["refreshLicense"].includes(task.handler)) {
      return true
    }
    return false
  }
  const handleDeleteTask = async (taskId, task) => {
    if(["monitorRooms","updateAccountsInfo","autoStopExpiredRooms","refreshLicense"].includes(task.handler)) {
      toast.error(t('common.error'))
      return
    }
    if (!confirm(t('tasks.messages.deleteConfirm'))) {
      return
    }

    try {
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        const result = await window.tiktokAPI.deleteTask(taskId)
        if (result.success) {
          await loadTasks()
          toast.success(t('tasks.messages.deleteSuccess'))
        } else {
          toast.error(result.message || t('common.error'))
        }
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error(t('common.error'))
    }
  }

  const handleToggleTask = async (taskId, enabled) => {
    try {
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        // Cập nhật UI optimistically trước
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskId 
              ? { ...task, enabled, updatedAt: new Date() }
              : task
          )
        )
        
        // // console.log(`🔄 Toggling task ${taskId} to ${enabled}`);
        
        const result = await window.tiktokAPI.updateTask(taskId, { enabled })
        // // console.log('🔄 Update result:', result);
        
        if (result.success) {
          // Cập nhật lại từ server để đảm bảo sync
          await loadTasks()
          toast.success(enabled ? t('tasks.messages.enableSuccess') : t('tasks.messages.disableSuccess'))
        //   // console.log('✅ Tasks synced from server');
        } else {
          // Rollback nếu thất bại
          setTasks(prevTasks => 
            prevTasks.map(task => 
              task.id === taskId 
                ? { ...task, enabled: !enabled } // Rollback
                : task
            )
          )
        //   console.error('❌ Update failed, rolled back:', result.message);
          toast.error(result.message || t('common.error'))
        }
      }
    } catch (error) {
      // Rollback nếu có lỗi
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, enabled: !enabled } // Rollback
            : task
        )
      )
      console.error('❌ Error toggling task:', error)
      toast.error(t('common.error'))
    }
  }

  const handleRunTaskNow = async (taskId) => {
    try {
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        const result = await window.tiktokAPI.runTaskNow(taskId)
        if (result.success) {
          toast.success(t('tasks.messages.runSuccess'))
          // Reload tasks để cập nhật trạng thái
          setTimeout(loadTasks, 1000)
        } else {
          toast.error(result.message || t('common.error'))
        }
      }
    } catch (error) {
      console.error('Error running task:', error)
      toast.error(t('common.error'))
    }
  }

  const openEditModal = (task) => {
    // // console.log('Opening edit modal for task:', task.id, 'enabled:', task.enabled);
    setEditingTask(task)
    setFormData({
      name: task.name,
      handler: task.handler,
      interval: task.interval,
      enabled: Boolean(task.enabled)
    })
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      handler: '',
      interval: 300000,
      enabled: false
    })
  }

  const formatInterval = (milliseconds) => {
    const seconds = milliseconds / 1000
    const minutes = seconds / 60
    const hours = minutes / 60
    const days = hours / 24

    if (days >= 1) {
      return `${Math.floor(days)} ${t('tasks.days')}`
    } else if (hours >= 1) {
      return `${Math.floor(hours)} ${t('tasks.hours')}`
    } else if (minutes >= 1) {
      return `${Math.floor(minutes)} ${t('tasks.minutes')}`
    } else {
      return `${seconds} ${t('tasks.seconds')}`
    }
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString()
  }

  const getStatusIcon = (task) => {
    switch (task.status) {
      case 'running':
        return <PlayIconSolid className="w-4 h-4 text-green-500" />
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4 text-blue-500" />
      case 'error':
        return <XCircleIcon className="w-4 h-4 text-red-500" />
      default:
        return <ClockIcon className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusText = (task) => {
    return t(`tasks.statusValues.${task.status}`) || task.status
  }

  const getHandlerDisplayName = (handlerName) => {
    return t(`tasks.handlers.${handlerName}`) || handlerName
  }

  // Danh sách các handlers đang được sử dụng
  const getActiveHandlers = () => {
    return tasks.map(task => task.handler);
  }

  // Danh sách các handlers có thể chọn khi thêm mới (loại bỏ các handlers đã có)
  const getAvailableHandlersForAdd = () => {
    const activeHandlers = getActiveHandlers();
    return availableHandlers.filter(handler => !activeHandlers.includes(handler));
  }

  if (isLoading) {
    return (
      <StaticLayout activePage="tasks">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </StaticLayout>
    )
  }

  return (
    <ProtectedRoute
      fallback={<AuthPage />}
    >
      <StaticLayout activePage="tasks">
        <Head>
          <title>{t('tasks.title')}</title>
        </Head>

        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('tasks.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {t('tasks.description')}
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              disabled={!hasValidLicense}
              className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${!hasValidLicense ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={!hasValidLicense ? t('license.errors.licenseRequired') : ''}
            >
              <PlusIcon className="w-5 h-5" />
              <span>{t('tasks.add')}</span>
            </button>
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
                    {t('license.warnings.taskFeaturesDisabled')}
                  </p>
                  <div className="mt-2">
                    <span className="text-xs text-red-600 dark:text-red-400">
                      {t('license.warnings.taskManagementUnavailable')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tasks Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {tasks.map((task) => (
              !hideListTask(task.id, task) && (
              <div
                key={task.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6"
              >
                {/* Task Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {task.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {getHandlerDisplayName(task.handler)}
                    </p>
                  </div>
                    
                  {!hideActionTask(task.id, task) && (
                  <div className="flex items-center space-x-2">
                    
                    
                    {/* Simple Toggle thay thế */}
                    <button
                      onClick={() => {
                      //   // console.log('Toggle clicked for task:', task.id, 'current:', task.enabled);
                        handleToggleTask(task.id, !task.enabled);
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                        task.enabled 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : 'bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500'
                      }`}
                    >
                      <span className="sr-only">Toggle task</span>
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
                          task.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  )}
                </div>

                {/* Task Info */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('tasks.status')}:</span>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(task)}
                      <span className={`${
                        task.status === 'running' ? 'text-green-600' :
                        task.status === 'completed' ? 'text-blue-600' :
                        task.status === 'error' ? 'text-red-600' :
                        'text-gray-400'
                      }`}>
                        {getStatusText(task)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('tasks.interval')}:</span>
                    <span className="text-gray-900 dark:text-white">
                      {formatInterval(task.interval)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('tasks.lastRun')}:</span>
                    <span className="text-gray-900 dark:text-white">
                      {formatDateTime(task.lastRun)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('tasks.nextRun')}:</span>
                    <span className="text-gray-900 dark:text-white">
                      {formatDateTime(task.nextRun)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('tasks.runCount')}:</span>
                    <span className="text-gray-900 dark:text-white">
                      {task.runCount}
                    </span>
                  </div>

                  {task.errorCount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{t('tasks.errorCount')}:</span>
                      <span className="text-red-600">
                        {task.errorCount}
                      </span>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {task.lastError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <ExclamationTriangleIcon className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-700 dark:text-red-400">
                        {task.lastError}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleRunTaskNow(task.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center justify-center space-x-1 text-sm transition-colors"
                  >
                    <PlayIcon className="w-4 h-4" />
                    <span>{t('tasks.runNow')}</span>
                  </button>
                  {!hideActionTask(task.id, task) && (
                  <button
                    onClick={() => openEditModal(task)}
                    className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 p-2 rounded-lg transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  )}
                  {!hideActionTask(task.id, task) && (
                  <button
                    onClick={() => handleDeleteTask(task.id, task)}
                    className="bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 p-2 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                  )}
                </div>
              </div>
              )
            ))}
          </div>

          {/* Empty State */}
          {tasks.length === 0 && (
            <div className="text-center py-12">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                {t('tasks.messages.noTasks')}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('tasks.messages.noTasksDescription')}
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>{t('tasks.messages.addFirstTask')}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add Task Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('tasks.add')}
              </h3>
              <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('tasks.name')}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('tasks.handler')}
                  </label>
                  <select
                    value={formData.handler}
                    onChange={(e) => setFormData({ ...formData, handler: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">{t('common.selectOption') || 'Chọn hàm xử lý'}</option>
                    {getAvailableHandlersForAdd().map((handler) => (
                      <option key={handler} value={handler}>
                        {getHandlerDisplayName(handler)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('tasks.interval')} ({t('tasks.minutes')})
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.interval / 60000}
                    onChange={(e) => setFormData({ ...formData, interval: parseInt(e.target.value) * 60000 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Toggle
                    enabled={formData.enabled}
                    onChange={(enabled) => setFormData({ ...formData, enabled })}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t('tasks.enabled')}
                  </span>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
                  >
                    {t('tasks.add')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      resetForm()
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 py-2 rounded-lg transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Task Modal */}
        {showEditModal && editingTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('tasks.edit')}
              </h3>
              <form onSubmit={handleUpdateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('tasks.name')}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('tasks.handler')}
                  </label>
                  <select
                    value={formData.handler}
                    onChange={(e) => setFormData({ ...formData, handler: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">{t('common.selectOption') || 'Chọn hàm xử lý'}</option>
                    {availableHandlers.map((handler) => (
                      <option key={handler} value={handler}>
                        {getHandlerDisplayName(handler)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('tasks.interval')} ({t('tasks.minutes')})
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.interval / 60000}
                    onChange={(e) => setFormData({ ...formData, interval: parseInt(e.target.value) * 60000 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Toggle
                    enabled={formData.enabled}
                    onChange={(enabled) => setFormData({ ...formData, enabled })}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t('tasks.enabled')}
                  </span>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
                  >
                    {t('common.save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingTask(null)
                      resetForm()
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 py-2 rounded-lg transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </StaticLayout>
    </ProtectedRoute>
  )
} 