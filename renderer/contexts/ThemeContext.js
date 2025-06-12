import { createContext, useContext, useEffect, useState } from 'react'

// Theme Context
const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

// Theme Provider Component
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark') // Default theme
  const [mounted, setMounted] = useState(false)

  // Computed property cho isDarkMode
  const isDarkMode = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  // Load theme từ backend settings TRƯỚC khi check localStorage
  useEffect(() => {
    setMounted(true)
    
    const loadTheme = async () => {
      try {
        if (typeof window !== 'undefined' && window.tiktokAPI) {
          // Wait for API to be ready
          let retryCount = 0
          const maxRetries = 5
          
          while (retryCount < maxRetries && (!window.tiktokAPI || typeof window.tiktokAPI.getSettings !== 'function')) {
            await new Promise(resolve => setTimeout(resolve, 100))
            retryCount++
          }
          
          if (window.tiktokAPI && typeof window.tiktokAPI.getSettings === 'function') {
            const result = await window.tiktokAPI.getSettings()
            if (result && result.success && result.settings && result.settings.theme) {
              console.log('🎨 Loaded theme from backend:', result.settings.theme)
              setTheme(result.settings.theme)
              // Sync với localStorage
              localStorage.setItem('amac-theme', result.settings.theme)
              return
            }
          }
        }
        
        // Fallback: load từ localStorage nếu backend không có
        const saved = localStorage.getItem('amac-theme')
        if (saved && ['light', 'dark', 'system'].includes(saved)) {
          console.log('🎨 Loaded theme from localStorage:', saved)
          setTheme(saved)
        } else {
          // Final fallback: system preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          const defaultTheme = prefersDark ? 'dark' : 'light'
          console.log('🎨 Using system preference theme:', defaultTheme)
          setTheme(defaultTheme)
          localStorage.setItem('amac-theme', defaultTheme)
        }
      } catch (error) {
        console.log('Could not load theme from settings:', error)
        // Fallback to localStorage if API fails
        const saved = localStorage.getItem('amac-theme')
        if (saved && ['light', 'dark', 'system'].includes(saved)) {
          setTheme(saved)
        }
      }
    }
    
    loadTheme()
  }, [])

  // Lắng nghe system theme change
  useEffect(() => {
    if (!mounted) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e) => {
      if (theme === 'system') {
        const root = document.documentElement
        if (e.matches) {
          root.classList.add('dark')
        } else {
          root.classList.remove('dark')
        }
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, mounted])

  // Apply theme khi theme thay đổi (chỉ sau khi mounted)
  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    
    // Remove tất cả theme classes
    root.classList.remove('dark', 'light')
    
    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else if (theme === 'system') {
      // Auto theme theo system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
    
    console.log('🎨 Applied theme to DOM:', theme)
  }, [theme, mounted])

  const changeTheme = async (newTheme) => {
    try {
      if (!['light', 'dark', 'system'].includes(newTheme)) {
        throw new Error('Invalid theme')
      }

      console.log('🎨 Changing theme from', theme, 'to', newTheme)

      // Update theme immediately for better UX
      setTheme(newTheme)
      
      // Apply theme to DOM immediately
      if (mounted && typeof window !== 'undefined') {
        const root = document.documentElement
        root.classList.remove('dark', 'light')
        
        if (newTheme === 'dark') {
          root.classList.add('dark')
        } else if (newTheme === 'light') {
          root.classList.remove('dark')
        } else if (newTheme === 'system') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          if (prefersDark) {
            root.classList.add('dark')
          } else {
            root.classList.remove('dark')
          }
        }
        
        // Save to localStorage immediately
        localStorage.setItem('amac-theme', newTheme)

        // Trigger storage event manually để các tab khác cập nhật
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'amac-theme',
          newValue: newTheme,
          oldValue: theme,
          storageArea: localStorage
        }))
      }
      
      // Save to backend - QUAN TRỌNG: Phải await để đảm bảo đã lưu
      if (typeof window !== 'undefined' && window.tiktokAPI?.saveSettings) {
        try {
          console.log('🎨 Saving theme to backend:', newTheme)
          const result = await window.tiktokAPI.saveSettings({
            theme: newTheme
          })
          if (result.success) {
            console.log('✅ Theme saved to backend successfully')
          } else {
            console.error('❌ Failed to save theme to backend:', result.error)
          }
        } catch (error) {
          console.log('Backend saveSettings not available yet (user not logged in):', error)
          // localStorage đã được lưu ở trên rồi, không cần làm gì thêm
        }
      } else {
        console.log('Backend saveSettings API not available, theme saved to localStorage only')
      }
    } catch (error) {
      console.error('Error changing theme:', error)
      throw error // Re-throw để component có thể xử lý
    }
  }

  // Render children ngay cả khi chưa mounted để tránh flash
  return (
    <ThemeContext.Provider value={{ theme, changeTheme, isDarkMode, mounted }}>
      <div className="theme-transition">
        {children}
      </div>
    </ThemeContext.Provider>
  )
}