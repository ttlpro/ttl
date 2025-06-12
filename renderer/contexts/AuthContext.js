import { createContext, useContext, useReducer, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'next-i18next'

// Initial state
const initialState = {
  // Auth state
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
  
  // License state
  license: null,
  limits: {
    accounts: 0,
    rooms: 0,
    hasValidLicense: false
  },
  
  // Status flags
  isLoggingIn: false,
  isRegistering: false,
  isLoggingOut: false,
  isCheckingAuth: false,
  isRefreshingLicense: false
}

// Action types
const AUTH_ACTIONS = {
  // Auth actions
  AUTH_START: 'AUTH_START',
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_ERROR: 'AUTH_ERROR',
  AUTH_LOGOUT: 'AUTH_LOGOUT',
  AUTH_CHECK_START: 'AUTH_CHECK_START',
  AUTH_CHECK_SUCCESS: 'AUTH_CHECK_SUCCESS',
  AUTH_CHECK_ERROR: 'AUTH_CHECK_ERROR',
  
  // Login actions
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_ERROR: 'LOGIN_ERROR',
  
  // Register actions
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_ERROR: 'REGISTER_ERROR',
  
  // Logout actions
  LOGOUT_START: 'LOGOUT_START',
  LOGOUT_SUCCESS: 'LOGOUT_SUCCESS',
  LOGOUT_ERROR: 'LOGOUT_ERROR',
  
  // License actions
  LICENSE_REFRESH_START: 'LICENSE_REFRESH_START',
  LICENSE_REFRESH_SUCCESS: 'LICENSE_REFRESH_SUCCESS',
  LICENSE_REFRESH_ERROR: 'LICENSE_REFRESH_ERROR',
  LICENSE_UPDATE: 'LICENSE_UPDATE',
  
  // Clear error
  CLEAR_ERROR: 'CLEAR_ERROR'
}

// Reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.AUTH_START:
      return {
        ...state,
        loading: true,
        error: null
      }
      
    case AUTH_ACTIONS.AUTH_SUCCESS:
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        license: action.payload.license,
        limits: action.payload.limits || state.limits,
        error: null
      }
      
    case AUTH_ACTIONS.AUTH_ERROR:
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        license: null,
        limits: {
          accounts: 0,
          rooms: 0,
          hasValidLicense: false
        },
        error: action.payload
      }
      
    case AUTH_ACTIONS.AUTH_CHECK_START:
      return {
        ...state,
        loading: true,
        isCheckingAuth: true,
        error: null
      }
      
    case AUTH_ACTIONS.AUTH_CHECK_SUCCESS:
      return {
        ...state,
        loading: false,
        isCheckingAuth: false,
        isAuthenticated: action.payload.authenticated,
        user: action.payload.user || null,
        license: action.payload.license || null,
        limits: action.payload.limits || {
          accounts: 0,
          rooms: 0,
          hasValidLicense: false
        },
        error: null
      }
      
    case AUTH_ACTIONS.AUTH_CHECK_ERROR:
      return {
        ...state,
        loading: false,
        isCheckingAuth: false,
        isAuthenticated: false,
        user: null,
        license: null,
        limits: {
          accounts: 0,
          rooms: 0,
          hasValidLicense: false
        },
        error: action.payload
      }
      
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoggingIn: true,
        error: null
      }
      
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        isLoggingIn: false,
        isAuthenticated: true,
        user: action.payload.user,
        error: null
      }
      
    case AUTH_ACTIONS.LOGIN_ERROR:
      return {
        ...state,
        isLoggingIn: false,
        error: action.payload
      }
      
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        isRegistering: true,
        error: null
      }
      
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        isRegistering: false,
        isAuthenticated: true,
        user: action.payload.user,
        error: null
      }
      
    case AUTH_ACTIONS.REGISTER_ERROR:
      return {
        ...state,
        isRegistering: false,
        error: action.payload
      }
      
    case AUTH_ACTIONS.LOGOUT_START:
      return {
        ...state,
        isLoggingOut: true,
        error: null
      }
      
    case AUTH_ACTIONS.LOGOUT_SUCCESS:
      return {
        ...initialState,
        loading: false,
        isLoggingOut: false
      }
      
    case AUTH_ACTIONS.LOGOUT_ERROR:
      return {
        ...state,
        isLoggingOut: false,
        error: action.payload
      }
      
    case AUTH_ACTIONS.LICENSE_REFRESH_START:
      return {
        ...state,
        isRefreshingLicense: true,
        error: null
      }
      
    case AUTH_ACTIONS.LICENSE_REFRESH_SUCCESS:
      return {
        ...state,
        isRefreshingLicense: false,
        license: action.payload.license,
        limits: action.payload.limits,
        error: null
      }
      
    case AUTH_ACTIONS.LICENSE_REFRESH_ERROR:
      return {
        ...state,
        isRefreshingLicense: false,
        error: action.payload
      }
      
    case AUTH_ACTIONS.LICENSE_UPDATE:
      return {
        ...state,
        license: action.payload.license,
        limits: action.payload.limits
      }
      
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      }
      
    default:
      return state
  }
}

// Create context
const AuthContext = createContext()

// Provider component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const { t } = useTranslation('common')
  
  // Check auth status on mount with a slight delay to prevent flash
  useEffect(() => {
    // Small delay to let app initialize smoothly
    const timer = setTimeout(() => {
      checkAuthStatus()
    }, 50); // 50ms delay
    
    return () => clearTimeout(timer);
  }, [])

  // Listen for license changes from backend
  useEffect(() => {
    const handleLicenseChange = (changeData) => {
      // console.log('🔔 License change received:', changeData);
      
      if (!changeData || !changeData.type) {
        // console.warn('⚠️ Invalid license change data received');
        return;
      }
      
      if (changeData.type === 'updated') {
        // License updated
        dispatch({
          type: AUTH_ACTIONS.LICENSE_UPDATE,
          payload: {
            license: changeData.data.license,
            limits: changeData.data.limits
          }
        });
        
        if (changeData.data.limits.hasValidLicense) {
          toast.success(t('license.messages.refreshSuccess') || 'License updated successfully');
        } else {
          toast.warning(t('license.warnings.noValidLicense') || 'License is no longer valid');
        }
        
      } else if (changeData.type === 'cleared') {
        // License cleared/removed
        dispatch({
          type: AUTH_ACTIONS.LICENSE_UPDATE,
          payload: {
            license: null,
            limits: {
              accounts: 0,
              rooms: 0,
              hasValidLicense: false
            }
          }
        });
        
        toast.error(t('license.messages.refreshError') || 'License has been cleared');
      }
    };

    // Register license change listener
    if (window.electronAPI && window.electronAPI.on) {
      const unsubscribe = window.electronAPI.on('license-changed', handleLicenseChange);
      
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }
  }, [t, dispatch])
  
  // API functions
  const checkAuthStatus = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.AUTH_CHECK_START })
      
      // Single API call to get complete auth status
      const result = await window.tiktokAPI.authCheckStatus()
      
      if (result.authenticated) {
        // Get license limits in parallel if authenticated
        const limitsPromise = result.hasValidLicense 
          ? window.tiktokAPI.licenseGetLimits()
          : Promise.resolve({ success: false });
        
        const limits = await limitsPromise;
        
        dispatch({
          type: AUTH_ACTIONS.AUTH_CHECK_SUCCESS,
          payload: {
            authenticated: true,
            user: result.user,
            license: result.license,
            limits: (limits.success && result.hasValidLicense) ? limits.limits : {
              accounts: 0,
              rooms: 0,
              hasValidLicense: false
            }
          }
        })
      } else {
        // Not authenticated - quick path
        dispatch({
          type: AUTH_ACTIONS.AUTH_CHECK_SUCCESS,
          payload: {
            authenticated: false
          }
        })
      }
    } catch (error) {
      console.error('Auth check error:', error)
      dispatch({
        type: AUTH_ACTIONS.AUTH_CHECK_ERROR,
        payload: error.message || 'Failed to check auth status'
      })
    }
  }
  
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START })
      
      const result = await window.tiktokAPI.authLogin(credentials)
      
      if (result.success) {
        // Get updated auth status with license info
        await checkAuthStatus()
        
        toast.success(t('auth.login.success'))
        return { success: true }
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_ERROR,
          payload: result.error
        })
        toast.error(result.error || t('auth.login.error'))
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = error.message || t('auth.login.error')
      dispatch({
        type: AUTH_ACTIONS.LOGIN_ERROR,
        payload: errorMessage
      })
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }
  
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.REGISTER_START })
      
      const result = await window.tiktokAPI.authRegister(userData)
      
      if (result.success) {
        // Get updated auth status with license info
        await checkAuthStatus()
        
        toast.success(t('auth.register.success'))
        return { success: true }
      } else {
        dispatch({
          type: AUTH_ACTIONS.REGISTER_ERROR,
          payload: result.error
        })
        toast.error(result.error || t('auth.register.error'))
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = error.message || t('auth.register.error')
      dispatch({
        type: AUTH_ACTIONS.REGISTER_ERROR,
        payload: errorMessage
      })
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }
  
  const logout = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGOUT_START })
      
      await window.tiktokAPI.authLogout()
      
      dispatch({ type: AUTH_ACTIONS.LOGOUT_SUCCESS })
      toast.success(t('auth.logout.success'))
      
      return { success: true }
    } catch (error) {
      const errorMessage = error.message || 'Logout failed'
      dispatch({
        type: AUTH_ACTIONS.LOGOUT_ERROR,
        payload: errorMessage
      })
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }
  
  const refreshLicense = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.LICENSE_REFRESH_START })
      
      const result = await window.tiktokAPI.authRefreshLicense()
      
      if (result.success) {
        // Get updated license info
        const licenseInfo = await window.tiktokAPI.licenseGetInfo()
        const limits = await window.tiktokAPI.licenseGetLimits()
        
        dispatch({
          type: AUTH_ACTIONS.LICENSE_REFRESH_SUCCESS,
          payload: {
            license: licenseInfo.success ? licenseInfo.license : null,
            limits: limits.success ? limits.limits : {
              accounts: 0,
              rooms: 0,
              hasValidLicense: false
            }
          }
        })
        
        toast.success(t('license.messages.refreshed'))
        return { success: true }
      } else {
        dispatch({
          type: AUTH_ACTIONS.LICENSE_REFRESH_ERROR,
          payload: result.error
        })
        toast.error(result.error || t('license.messages.refreshFailed'))
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = error.message || t('license.messages.refreshFailed')
      dispatch({
        type: AUTH_ACTIONS.LICENSE_REFRESH_ERROR,
        payload: errorMessage
      })
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }
  
  const checkAccountLimit = async (newAccountCount) => {
    try {
      const result = await window.tiktokAPI.licenseCheckAccountLimit(newAccountCount)
      
      if (result.success) {
        if (!result.allowed) {
          toast.error(result.message || t('license.errors.cannotImportAccounts'))
        }
        return result
      } else {
        toast.error(result.error || t('license.errors.licenseRequired'))
        return { allowed: false, error: result.error }
      }
    } catch (error) {
      toast.error(error.message || t('license.errors.licenseRequired'))
      return { allowed: false, error: error.message }
    }
  }
  
  const checkRoomLimit = async (newRoomCount = 1) => {
    try {
      const result = await window.tiktokAPI.licenseCheckRoomLimit(newRoomCount)
      
      if (result.success) {
        if (!result.allowed) {
          toast.error(result.message || t('license.errors.cannotStartRoom'))
        }
        return result
      } else {
        toast.error(result.error || t('license.errors.licenseRequired'))
        return { allowed: false, error: result.error }
      }
    } catch (error) {
      toast.error(error.message || t('license.errors.licenseRequired'))
      return { allowed: false, error: error.message }
    }
  }
  
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })
  }
  
  // Context value
  const value = {
    // State
    ...state,
    
    // Actions
    login,
    register,
    logout,
    refreshLicense,
    checkAuthStatus,
    checkAccountLimit,
    checkRoomLimit,
    clearError,
    
    // Helper computed values
    isLoggedIn: state.isAuthenticated && state.user !== null,
    hasValidLicense: state.limits.hasValidLicense,
    canImportAccounts: state.limits.hasValidLicense,
    canStartRooms: state.limits.hasValidLicense
  }
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

export default AuthContext 