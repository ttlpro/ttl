import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDate, formatDateTime } from '../utils/i18nUtils'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useTheme } from '../contexts/ThemeContext'

export default function ViewerChart({ roomId, roomInfo, isOpen, onClose }) {
  const { t } = useTranslation('common')
  const { isDarkMode } = useTheme()
  const canvasRef = useRef(null)
  const [historyData, setHistoryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDays, setSelectedDays] = useState(7)
  const [hoveredPoint, setHoveredPoint] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (isOpen && roomId) {
      loadViewerHistory()
    }
  }, [isOpen, roomId, selectedDays])

  useEffect(() => {
    if (historyData.length > 0 && canvasRef.current) {
      drawChart()
    }
  }, [historyData, hoveredPoint])

  const loadViewerHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Debug: Loading viewer history for room:', roomId, 'days:', selectedDays)
      console.log('🔍 Debug: window.tiktokAPI available:', !!window.tiktokAPI)
      console.log('🔍 Debug: getRoomViewerHistory method available:', !!window.tiktokAPI?.getRoomViewerHistory)
      
      const result = await window.tiktokAPI.getRoomViewerHistory(roomId, selectedDays)
      console.log('🔍 Debug: API result:', result)
      
      if (!result) {
        console.error('❌ API Error: Kết quả trả về là null hoặc undefined')
        setError(t('rooms.chart.loadError') + ': Kết quả trả về là null hoặc undefined')
        return
      }
      
      if (result.success) {
        // Kiểm tra nếu history là một mảng từ database
        if (Array.isArray(result)) {
          console.log('✅ Success: Database history data loaded:', result.length, 'entries')
          // Chuyển đổi dữ liệu từ database nếu cần
          const convertedData = result.map(item => ({
            timestamp: item.timestamp,
            viewers: item.viewerCount || 0,
            isAlive: true // Giả định là tất cả đều là active
          }))
          setHistoryData(convertedData)
        } 
        // Kiểm tra nếu là định dạng từ file JSON
        else if (result.history && Array.isArray(result.history)) {
          console.log('✅ Success: File history data loaded:', result.history.length, 'entries')
          setHistoryData(result.history || [])
        }
        // Trường hợp không có dữ liệu
        else {
          console.log('ℹ️ No history data available')
          setHistoryData([])
        }
      } else {
        const errorMessage = result.error || result.errorCode || 'Unknown error'
        console.error('❌ API Error:', errorMessage)
        setError(t('rooms.chart.loadError') + ': ' + errorMessage)
      }
    } catch (error) {
      console.error('❌ Error loading viewer history:', error)
      setError(t('rooms.chart.loadError') + ': ' + (error?.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const getChartPoints = () => {
    if (historyData.length === 0) return []

    const canvas = canvasRef.current
    if (!canvas) return []

    const rect = canvas.getBoundingClientRect()
    const padding = { top: 20, right: 50, bottom: 50, left: 80 }
    const chartWidth = rect.width - padding.left - padding.right
    const chartHeight = rect.height - padding.top - padding.bottom

    const viewers = historyData.map(d => d.viewerCount || d.viewers || 0)
    const maxViewers = Math.max(...viewers, 100)
    const minViewers = Math.min(...viewers, 0)
    const viewerRange = maxViewers - minViewers

    const timestamps = historyData.map(d => new Date(d.timestamp))
    const minTime = Math.min(...timestamps)
    const maxTime = Math.max(...timestamps)
    const timeRange = maxTime - minTime

    return historyData.map((point, index) => {
      const x = padding.left + ((new Date(point.timestamp) - minTime) / timeRange) * chartWidth
      const y = padding.top + chartHeight - (((point.viewerCount || point.viewers || 0) - minViewers) / viewerRange) * chartHeight
      
      return {
        x,
        y,
        viewers: point.viewerCount || point.viewers || 0,
        timestamp: point.timestamp,
        isAlive: point.isAlive !== undefined ? point.isAlive : true,
        index
      }
    })
  }

  const handleMouseMove = (event) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top

    setMousePos({ x: event.clientX, y: event.clientY })

    const points = getChartPoints()
    const hoveredPoint = points.find(point => {
      const distance = Math.sqrt(Math.pow(mouseX - point.x, 2) + Math.pow(mouseY - point.y, 2))
      return distance <= 10
    })

    setHoveredPoint(hoveredPoint || null)
  }

  const handleMouseLeave = () => {
    setHoveredPoint(null)
  }

  const getThemeColors = () => {
    if (isDarkMode) {
      return {
        background: '#1f2937',      // gray-800
        gridLines: '#374151',       // gray-700
        textPrimary: '#f9fafb',     // gray-50
        textSecondary: '#d1d5db',   // gray-300
        axisBorder: '#6b7280'       // gray-500
      }
    } else {
      return {
        background: '#f8fafc',      // slate-50
        gridLines: '#e2e8f0',       // slate-200
        textPrimary: '#374151',     // gray-700
        textSecondary: '#64748b',   // slate-500
        axisBorder: '#374151'       // gray-700
      }
    }
  }

  const drawChart = () => {
    const canvas = canvasRef.current
    if (!canvas || historyData.length === 0) return

    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const colors = getThemeColors()
    
    // Set canvas size for high DPI displays
    const devicePixelRatio = window.devicePixelRatio || 1
    canvas.width = rect.width * devicePixelRatio
    canvas.height = rect.height * devicePixelRatio
    ctx.scale(devicePixelRatio, devicePixelRatio)

    const width = rect.width
    const height = rect.height
    const padding = { top: 20, right: 50, bottom: 50, left: 80 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Get min/max values
    const viewers = historyData.map(d => d.viewerCount || d.viewers || 0)
    const maxViewers = Math.max(...viewers, 100)
    const minViewers = Math.min(...viewers, 0)
    const viewerRange = maxViewers - minViewers

    // Time range
    const timestamps = historyData.map(d => new Date(d.timestamp))
    const minTime = Math.min(...timestamps)
    const maxTime = Math.max(...timestamps)
    const timeRange = maxTime - minTime

    // Draw background - responsive to theme
    ctx.fillStyle = colors.background
    ctx.fillRect(0, 0, width, height)

    // Draw grid lines - responsive to theme
    ctx.strokeStyle = colors.gridLines
    ctx.lineWidth = 1

    // Horizontal grid lines (viewers)
    const yTicks = 5
    for (let i = 0; i <= yTicks; i++) {
      const y = padding.top + (chartHeight * i) / yTicks
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(padding.left + chartWidth, y)
      ctx.stroke()

      // Y-axis labels - responsive to theme
      const viewerValue = maxViewers - (viewerRange * i) / yTicks
      ctx.fillStyle = colors.textSecondary
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(Math.round(viewerValue).toLocaleString(), padding.left - 10, y + 4)
    }

    // Vertical grid lines (time)
    const xTicks = 6
    for (let i = 0; i <= xTicks; i++) {
      const x = padding.left + (chartWidth * i) / xTicks
      ctx.beginPath()
      ctx.moveTo(x, padding.top)
      ctx.lineTo(x, padding.top + chartHeight)
      ctx.stroke()

      // X-axis labels - responsive to theme
      if (timeRange > 0) {
        const timeValue = new Date(minTime + (timeRange * i) / xTicks)
        ctx.fillStyle = colors.textSecondary
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(
                      formatDate(timeValue, null, { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          x,
          padding.top + chartHeight + 20
        )
      }
    }

    // Draw chart line
    if (historyData.length > 1) {
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 2
      ctx.beginPath()

      historyData.forEach((point, index) => {
        const x = padding.left + ((new Date(point.timestamp) - minTime) / timeRange) * chartWidth
        const y = padding.top + chartHeight - (((point.viewerCount || point.viewers || 0) - minViewers) / viewerRange) * chartHeight

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()

      // Draw points với số viewers
      historyData.forEach((point, index) => {
        const x = padding.left + ((new Date(point.timestamp) - minTime) / timeRange) * chartWidth
        const y = padding.top + chartHeight - (((point.viewerCount || point.viewers || 0) - minViewers) / viewerRange) * chartHeight

        // Draw point circle
        const isHovered = hoveredPoint?.index === index
        const pointRadius = isHovered ? 6 : 4
        
        ctx.fillStyle = point.isAlive !== false ? '#3b82f6' : '#ef4444'
        ctx.beginPath()
        ctx.arc(x, y, pointRadius, 0, 2 * Math.PI)
        ctx.fill()

        // Draw white border for hovered point
        if (isHovered) {
          ctx.strokeStyle = isDarkMode ? '#374151' : '#ffffff'
          ctx.lineWidth = 2
          ctx.stroke()
        }

        // Draw viewer number above each point - responsive to theme
        ctx.fillStyle = colors.textPrimary
        ctx.font = 'bold 11px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(
          (point.viewerCount || point.viewers || 0).toLocaleString(), 
          x, 
          y - (isHovered ? 15 : 10)
        )
      })
    }

    // Draw axes - responsive to theme
    ctx.strokeStyle = colors.axisBorder
    ctx.lineWidth = 2
    
    // Y-axis
    ctx.beginPath()
    ctx.moveTo(padding.left, padding.top)
    ctx.lineTo(padding.left, padding.top + chartHeight)
    ctx.stroke()

    // X-axis  
    ctx.beginPath()
    ctx.moveTo(padding.left, padding.top + chartHeight)
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight)
    ctx.stroke()

    // Labels - responsive to theme
    ctx.fillStyle = colors.textPrimary
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    
    // Y-axis label
    ctx.save()
    ctx.translate(20, padding.top + chartHeight / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText(t('rooms.chart.viewersAxis'), 0, 0)
    ctx.restore()

    // X-axis label
    ctx.fillText(t('rooms.chart.timeAxis'), padding.left + chartWidth / 2, height - 10)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('rooms.chart.title')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {roomInfo?.roomUsername ? `@${roomInfo.roomUsername}` : roomId}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Days selector */}
              <select
                value={selectedDays}
                onChange={(e) => setSelectedDays(Number(e.target.value))}
                className="input-field text-sm"
                disabled={loading}
              >
                <option value={1}>{t('rooms.chart.days.1')}</option>
                <option value={3}>{t('rooms.chart.days.3')}</option>
                <option value={7}>{t('rooms.chart.days.7')}</option>
                <option value={30}>{t('rooms.chart.days.30')}</option>
              </select>
              
              <button
                onClick={onClose}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">{t('rooms.chart.loading')}</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <button
                  onClick={loadViewerHistory}
                  className="btn-primary"
                >
                  {t('common.retry')}
                </button>
              </div>
            </div>
          ) : historyData.length === 0 ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400">{t('rooms.chart.noData')}</p>
              </div>
            </div>
          ) : (
            <div className="h-full relative">
              <canvas
                ref={canvasRef}
                className="w-full h-96 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer bg-white dark:bg-gray-800"
                style={{ width: '100%', height: '400px' }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              />
              
              {/* Tooltip khi hover - dark mode support */}
              {hoveredPoint && (
                <div 
                  className="absolute bg-gray-900 dark:bg-gray-700 text-white dark:text-gray-100 px-3 py-2 rounded-lg text-sm pointer-events-none z-10 shadow-lg border border-gray-700 dark:border-gray-600"
                  style={{
                    left: mousePos.x - window.scrollX + 10,
                    top: mousePos.y - window.scrollY - 60
                  }}
                >
                  <div className="font-semibold">{hoveredPoint.viewers.toLocaleString()} {t('rooms.chart.viewers')}</div>
                  <div className="text-gray-300 dark:text-gray-400">
                    {formatDateTime(hoveredPoint.timestamp)}
                  </div>
                  {!hoveredPoint.isAlive && (
                    <div className="text-red-400 text-xs">● {t('rooms.chart.offline')}</div>
                  )}
                </div>
              )}
              
              {/* Stats - already have dark mode support */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
                  <div className="text-sm text-blue-600 dark:text-blue-400">{t('rooms.chart.stats.totalPoints')}</div>
                  <div className="text-lg font-semibold text-blue-900 dark:text-blue-300">
                    {historyData.length.toLocaleString()}
                  </div>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg">
                  <div className="text-sm text-green-600 dark:text-green-400">{t('rooms.chart.stats.maxViewers')}</div>
                  <div className="text-lg font-semibold text-green-900 dark:text-green-300">
                    {Math.max(...historyData.map(d => d.viewerCount || d.viewers || 0)).toLocaleString()}
                  </div>
                </div>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg">
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">{t('rooms.chart.stats.avgViewers')}</div>
                  <div className="text-lg font-semibold text-yellow-900 dark:text-yellow-300">
                    {Math.round(historyData.reduce((sum, d) => sum + (d.viewerCount || d.viewers || 0), 0) / historyData.length).toLocaleString()}
                  </div>
                </div>
                
                <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg">
                  <div className="text-sm text-red-600 dark:text-red-400">{t('rooms.chart.stats.offlinePoints')}</div>
                  <div className="text-lg font-semibold text-red-900 dark:text-red-300">
                    {historyData.filter(d => !d.isAlive).length}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 