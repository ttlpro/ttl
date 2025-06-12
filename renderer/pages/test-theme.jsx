import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useTheme } from '../contexts/ThemeContext'

export default function TestThemePage() {
  const { theme, changeTheme, isDarkMode, mounted } = useTheme()
  const [log, setLog] = useState([])
  const [settings, setSettings] = useState(null)

  const addLog = (message) => {
    console.log(message)
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    addLog(`🎨 Theme Context - theme: ${theme}, isDarkMode: ${isDarkMode}, mounted: ${mounted}`)
  }, [theme, isDarkMode, mounted])

  const testGetSettings = async () => {
    try {
      addLog('📥 Testing getSettings...')
      const result = await window.tiktokAPI.getSettings()
      addLog(`✅ getSettings result: ${JSON.stringify(result)}`)
      setSettings(result.settings)
    } catch (error) {
      addLog(`❌ getSettings error: ${error.message}`)
    }
  }

  const testSaveSettings = async (newTheme) => {
    try {
      addLog(`💾 Testing saveSettings with theme: ${newTheme}`)
      const result = await window.tiktokAPI.saveSettings({ theme: newTheme })
      addLog(`✅ saveSettings result: ${JSON.stringify(result)}`)
    } catch (error) {
      addLog(`❌ saveSettings error: ${error.message}`)
    }
  }

  const testChangeTheme = async (newTheme) => {
    try {
      addLog(`🔄 Testing changeTheme to: ${newTheme}`)
      await changeTheme(newTheme)
      addLog(`✅ changeTheme completed`)
    } catch (error) {
      addLog(`❌ changeTheme error: ${error.message}`)
    }
  }

  const testChangeThemeAPI = async (newTheme) => {
    try {
      addLog(`🔄 Testing changeTheme API to: ${newTheme}`)
      const result = await window.tiktokAPI.changeTheme(newTheme)
      addLog(`✅ changeTheme API result: ${JSON.stringify(result)}`)
    } catch (error) {
      addLog(`❌ changeTheme API error: ${error.message}`)
    }
  }

  const clearLog = () => {
    setLog([])
    console.clear()
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-8">
      <Head>
        <title>Theme Test Page</title>
      </Head>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          🎨 Theme Test Page
        </h1>

        {/* Current State */}
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Current State</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong className="text-gray-900 dark:text-white">Theme:</strong> 
              <span className="ml-2 text-gray-700 dark:text-gray-300">{theme}</span>
            </div>
            <div>
              <strong className="text-gray-900 dark:text-white">Is Dark Mode:</strong> 
              <span className="ml-2 text-gray-700 dark:text-gray-300">{isDarkMode ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <strong className="text-gray-900 dark:text-white">Mounted:</strong> 
              <span className="ml-2 text-gray-700 dark:text-gray-300">{mounted ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <strong className="text-gray-900 dark:text-white">DOM Class:</strong> 
              <span className="ml-2 text-gray-700 dark:text-gray-300">
                {typeof document !== 'undefined' ? document.documentElement.className : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Backend Settings */}
        {settings && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-semibold mb-4 text-blue-900 dark:text-blue-100">Backend Settings</h2>
            <pre className="text-sm bg-white dark:bg-gray-800 p-4 rounded border overflow-auto">
              {JSON.stringify(settings, null, 2)}
            </pre>
          </div>
        )}

        {/* Test Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={testGetSettings}
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg font-medium"
          >
            Get Settings
          </button>
          
          <button
            onClick={() => testSaveSettings('light')}
            className="bg-yellow-500 hover:bg-yellow-600 text-white p-3 rounded-lg font-medium"
          >
            Save Light
          </button>
          
          <button
            onClick={() => testSaveSettings('dark')}
            className="bg-gray-700 hover:bg-gray-800 text-white p-3 rounded-lg font-medium"
          >
            Save Dark
          </button>
          
          <button
            onClick={() => testChangeTheme('light')}
            className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-lg font-medium"
          >
            Context Light
          </button>
          
          <button
            onClick={() => testChangeTheme('dark')}
            className="bg-indigo-500 hover:bg-indigo-600 text-white p-3 rounded-lg font-medium"
          >
            Context Dark
          </button>
          
          <button
            onClick={() => testChangeThemeAPI('light')}
            className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg font-medium"
          >
            API Light
          </button>
          
          <button
            onClick={() => testChangeThemeAPI('dark')}
            className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg font-medium"
          >
            API Dark
          </button>
          
          <button
            onClick={clearLog}
            className="bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-lg font-medium"
          >
            Clear Log
          </button>
        </div>

        {/* Log Display */}
        <div className="bg-black text-green-400 p-6 rounded-lg max-h-96 overflow-auto">
          <h2 className="text-xl font-semibold mb-4">Console Log</h2>
          <div className="space-y-1">
            {log.map((entry, index) => (
              <div key={index} className="text-sm font-mono">
                {entry}
              </div>
            ))}
            {log.length === 0 && (
              <div className="text-gray-500 italic">No logs yet...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 