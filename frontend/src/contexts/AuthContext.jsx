import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const SessionExpiredModal = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black dark:bg-[#121212] bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#121212] p-6 max-w-md w-full mx-4 ">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Session Expired</h3>
            <p className="text-sm text-gray-600 dark:text-white">Your session has timed out</p>
          </div>
        </div>
        
        <p className="text-gray-700 dark:text-white mb-6">
          {message || 'Your session has expired. Please sign in again to continue.'}
        </p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-white hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onClose()
              window.location.href = '/signin'
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In Again
          </button>
        </div>
      </div>
    </div>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading_logout, setLoading_logout] = useState(false)
  const [showSessionModal, setShowSessionModal] = useState(false)
  // const [sessionExpiredMessage, setSessionExpiredMessage] = useState('')

  const [usage, setUsage] = useState({
    documents: { used: 0 },
    chats: { used: 0 },
    tokens: { used: 0 }
  })
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshingToken, setRefreshingToken] = useState(false)

  // Configure axios to always include credentials for cookie support
  axios.defaults.withCredentials = true

  

  // Enhanced auth check with better logging
  const checkAuth = async () => {
    try {
      console.log('🔍 Checking authentication status...')
      
      const response = await axios.get(`${API_BASE_URL}/auth/check-auth`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('📡 Auth check response:', response.status, response.data)

      if (response.status === 200) {
        console.log('✅ User is authenticated:', response.data)
        return true
      } else {
        console.log('❌ User is not authenticated')
        return false
      }
    } catch (error) {
      console.error('❌ Auth check error:', error.response?.status, error.response?.data)
      return false
    }
  }

  // Helper function to check if we're authenticated by making a test request
  const checkAuthStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/check-auth`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      })
      console.log('✅ Auth check successful')
      setIsAuthenticated(true)
      return true
    } catch (error) {
      console.log('❌ Auth check failed:', error.response?.status)
      setIsAuthenticated(false)
      return false
    }
    // ❌ DON'T set loading state here - let the caller handle it
  }

  const handleSessionExpired = (message = 'Your session has expired. Please sign in again.') => {
    setUser(null)
    setIsAuthenticated(false)
    setUsage({
      documents: { used: 0 },
      chats: { used: 0 },
      tokens: { used: 0 }
    })
    // setSessionExpiredMessage(message)
    setShowSessionModal(true)
    
    // Store the session expired message
    sessionStorage.setItem('sessionExpiredMessage', message)
    
    // Clear any stored tokens (cleanup)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    
    // Navigate to sign in (this will be handled by the app)
    // window.location.href = '/signin'
  }

  const closeSessionModal = () => {
    setShowSessionModal(false)
    // setSessionExpiredMessage('')
  }

  const refreshAccessToken = async () => {
    if (refreshingToken) return false // Prevent multiple refresh attempts
    
    setRefreshingToken(true)
    try {
      console.log('Attempting to refresh access token...')
      
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
        withCredentials: true  // Include refresh token cookie
      })
      
      console.log('Token refresh successful')
      
      // The backend sets new cookies automatically, so we just need to verify auth status
      const authStatus = await checkAuthStatus()
      if (authStatus) {
        // Re-fetch user data to ensure we have the latest information
        await fetchUserData();

        // Optional: force full reload to fix edge cookie/auth sync issues
        window.location.reload();
        return true
      } else {
        console.error('Auth check failed after token refresh')
        handleSessionExpired()
        return false
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      // If refresh fails, handle session expiry
      handleSessionExpired('')
      return false
    } finally {
      setRefreshingToken(false)
    }
  }

  // Add response interceptor for automatic token refresh
  useEffect(() => {
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config
        
        // If request fails with 401 and we haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry && isAuthenticated) {
          originalRequest._retry = true
          
          console.log('Got 401, attempting token refresh...')
          const refreshSuccess = await refreshAccessToken()
          if (refreshSuccess) {
            console.log('Token refreshed, retrying original request...')
            return axios(originalRequest)
          }
        }
        
        return Promise.reject(error)
      }
    )

    // Cleanup interceptor on unmount
    return () => {
      axios.interceptors.response.eject(responseInterceptor)
    }
  }, [isAuthenticated])

  // Check if user is authenticated on app load
  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoading(true) // Start loading
        
        // Skip auth check if we're on the auth-callback page
        if (window.location.pathname === '/auth-callback') {
          console.log('⏭️ Skipping auth check - on auth-callback page')
          setIsLoading(false)
          return
        }
        
        console.log('🔄 Starting auth initialization...')
        
        // Check if we're authenticated via cookies
        let authStatus = await checkAuthStatus()
        
        if (!authStatus) {
          console.warn('First auth check failed. Retrying after delay...');
          await new Promise((resolve) => setTimeout(resolve, 2000));
          authStatus = await checkAuthStatus();
        }
        
        if (authStatus) {
          console.log('Found valid authentication cookies')
          await fetchUserData()
          console.log('✅ Auth initialization complete - user authenticated')
        } else {
          console.log('No valid authentication found - user not authenticated')
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Auth initialization failed:', error)
        setIsAuthenticated(false)
      } finally {
        // ✅ ALWAYS set loading to false here, regardless of success/failure
        console.log('🏁 Auth initialization finished, setting loading to false')
        setIsLoading(false)
      }
    }
  
    initAuth()
  }, [])

  const fetchUserData = async () => {
    try {
      console.log('👤 Fetching user data...')
      
      const [userResponse, usageResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/auth/me`, { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }),
        axios.get(`${API_BASE_URL}/usage/me`, { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      ])
  
      console.log('✅ User data fetched:', userResponse.data)
      
      setUser(userResponse.data)
      setIsAuthenticated(true)
      // ❌ REMOVE this line - don't set loading here
      // setIsLoading(false)
      
      const usageData = usageResponse.data
      setUsage(usageData.usage)
      
      return userResponse.data
    } catch (error) {
      console.error('❌ Failed to fetch user data:', error)
      setIsAuthenticated(false)
      // ❌ REMOVE this line - don't set loading here  
      // setIsLoading(false)
      throw error
    }
  }

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData, {
        withCredentials: true  // Include cookies in request
      })
      console.log(response.data)
      // Fetch user data after successful registration
      // await fetchUserData()
      
      return response.data
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  }

  const login = async (credentials) => {
    try {
      // Handle different login scenarios
      if (credentials.token) {
        // Token-based login (legacy Google OAuth) - token will be processed by backend
        // Just fetch user data since cookies will be set by the backend
        await fetchUserData()
        return { success: true }
      } else if (Object.keys(credentials).length === 0) {
        // Empty credentials means cookies are already set (e.g., after Google OAuth or Magic Link)
        // Just fetch user data to establish authentication state
        console.log('🔄 Login with empty credentials - fetching user data...')
        await fetchUserData()
        return { success: true }
      } else {
        // Email/password login - cookies will be set automatically
        const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials, {
          withCredentials: true  // Include cookies in request
        })
        
        // Fetch user data after successful login
        await fetchUserData()
        
        return { success: true }
      }
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  // NEW: Send magic link function
  const sendMagicLink = async (email) => {
    try {
      console.log('🔗 Sending magic link to:', email)
      
      const response = await axios.post(`${API_BASE_URL}/auth/send-magic-link`, {
        email: email.toLowerCase()
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('✅ Magic link sent:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Magic link error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      setLoading_logout(true)
      console.log('Logging out...')
      // Call logout endpoint to clear cookies on server
      await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
        withCredentials: true
      })
      console.log('Logout successful')
      setLoading_logout(false)
    } catch (error) {
      console.error('Logout request failed:', error)
      // Continue with local cleanup even if server request fails
    } finally {
      // Clear local state
      setUser(null)
      setIsAuthenticated(false)
      setUsage({
        documents: { used: 0 },
        chats: { used: 0 },
        tokens: { used: 0 }
      })
      
      // Clear any stored tokens (cleanup)
      // localStorage.removeItem('auth_token')
      // localStorage.removeItem('refresh_token')
    }
  }

  const refreshUserData = async () => {
    try {
      await fetchUserData()
    } catch (error) {
      console.error('Failed to refresh user data:', error)
    }
  }

  const canUploadDocument = () => {
    return user?.usage?.documents?.used < user?.usage?.documents?.limit
  }

  const canSendChat = () => {
    return user?.usage?.chats?.used < user?.usage?.chats?.limit
  }

  const canUseTokens = (estimatedTokens = 0) => {
    return (user?.usage?.tokens?.used || 0) + estimatedTokens <= (user?.usage?.tokens?.limit || 0)
  }

  const getRemainingLimits = () => {
    if (!user?.usage) return { documents: 0, chats: 0, tokens: 0 }
    
    return {
      documents: Math.max(0, (user.usage.documents?.limit || 0) - (user.usage.documents?.used || 0)),
      chats: Math.max(0, (user.usage.chats?.limit || 0) - (user.usage.chats?.used || 0)),
      tokens: Math.max(0, (user.usage.tokens?.limit || 0) - (user.usage.tokens?.used || 0))
    }
  }

  const getUsagePercentages = () => {
    if (!user?.usage) return { documents: 0, chats: 0, tokens: 0 }
    
    return {
      documents: user.usage.documents?.limit ? (user.usage.documents.used / user.usage.documents.limit) * 100 : 0,
      chats: user.usage.chats?.limit ? (user.usage.chats.used / user.usage.chats.limit) * 100 : 0,
      tokens: user.usage.tokens?.limit ? (user.usage.tokens.used / user.usage.tokens.limit) * 100 : 0
    }
  }

  const value = {
    user,
    usage,
    isAuthenticated,
    isLoading,
    register,
    login,
    logout,
    loading_logout,
    refreshUserData,
    canUploadDocument,
    canSendChat,
    canUseTokens,
    getRemainingLimits,
    getUsagePercentages,
    fetchUserData, // Export this for use in components that need to re-fetch user data
    checkAuth, // Export this for magic link verification
    sendMagicLink, // NEW: Export magic link function
    showSessionModal,
    checkAuthStatus,
    // sessionExpiredMessage,
    closeSessionModal
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* NEW: Render the session expired modal */}
      <SessionExpiredModal 
        isOpen={showSessionModal}
        onClose={closeSessionModal}
        // message={sessionExpiredMessage}
      />
    </AuthContext.Provider>
  )
}