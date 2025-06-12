import { useState, useEffect } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState('dark')
  const [mounted, setMounted] = useState(false)

  // Load theme từ settings khi hook được sử dụng
  useEffect(() => {
    const loadTheme = async () => {
      try {
        if (typeof window !== 'undefined' && window.tiktokAPI) {
          const result = await window.tiktokAPI.getSettings()
          if (result.success && result.settings.theme) {
            setTheme(result.settings.theme)
            applyTheme(result.settings.theme)
          }
        }
      } catch (error) {
        console.log('Could not load theme from settings:', error)
        // Default to dark theme nếu không load được
        applyTheme('dark')
      } finally {
        setMounted(true)
      }
    }
    loadTheme()
  }, [])

  // Apply theme function
  const applyTheme = (themeName) => {
    if (typeof document === 'undefined') return
    
    const root = document.documentElement
    root.classList.remove('dark', 'light')
    
    if (themeName === 'dark') {
      root.classList.add('dark')
    } else if (themeName === 'light') {
      root.classList.remove('dark')
    } else if (themeName === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }

  // Change theme function
  const changeTheme = async (newTheme) => {
    try {
      setTheme(newTheme)
      applyTheme(newTheme)
      
      if (typeof window !== 'undefined' && window.tiktokAPI) {
        await window.tiktokAPI.changeTheme(newTheme)
      }
    } catch (error) {
      console.error('Error changing theme:', error)
    }
  }

  return {
    theme,
    changeTheme,
    mounted
  }
}