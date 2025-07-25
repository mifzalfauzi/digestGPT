import React, { createContext, useState, useContext, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

const API_BASE_URL = 'http://localhost:8000'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('auth_token'))
  const [loading, setLoading] = useState(true)
  const [usage, setUsage] = useState(null)
  const [refreshingToken, setRefreshingToken] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [redirectCallback, setRedirectCallback] = useState(null)

  // Plan limits configuration
  const PLAN_LIMITS = {
    free: {
      doc_limit: 1,
      chat_limit: 3,
      token_limit: 3000
    },
    standard: {
      doc_limit: 50,
      chat_limit: 100,
      token_limit: 100000
    },
    pro: {
      doc_limit: 120,
      chat_limit: 350,
      token_limit: 350000
    }
  }

  // Utility function to check if token is expired
  const isTokenExpired = (token) => {
    if (!token) return true
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Math.floor(Date.now() / 1000)
      return payload.exp < currentTime
    } catch {
      return true
    }
  }

  // Show session expired message and redirect
  const handleSessionExpired = (message = 'Your session has expired. Please sign in again.') => {
    setSessionExpired(true)
    localStorage.removeItem('auth_token')
    setToken(null)
    setUser(null)
    setUsage(null)
    delete axios.defaults.headers.common['Authorization']
    
    // Show message for 2 seconds then trigger redirect
    setTimeout(() => {
      setSessionExpired(false)
      // Try to use navigation handler first, fallback to window.location
      try {
        sessionStorage.setItem('sessionExpiredMessage', message)
        localStorage.setItem('authRedirectRequest', JSON.stringify({
          path: '/signin',
          options: { state: { message, expired: true } }
        }))
        // Trigger storage event manually for same-window navigation
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'authRedirectRequest',
          newValue: JSON.stringify({
            path: '/signin',
            options: { state: { message, expired: true } }
          })
        }))
      } catch {
        // Fallback to window.location if localStorage fails
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('sessionExpiredMessage', message)
          window.location.href = '/signin'
        }
      }
    }, 2000)
  }

  // Define refreshAccessToken function before useEffect
  const refreshAccessToken = async () => {
    if (refreshingToken) return null // Prevent multiple refresh attempts
    
    setRefreshingToken(true)
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
        withCredentials: true  // Include refresh token cookie
      })
      
      const { access_token } = response.data
      localStorage.setItem('auth_token', access_token)
      setToken(access_token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      
      return access_token
    } catch (error) {
      console.error('Token refresh failed:', error)
      // If refresh fails, handle session expiry
      handleSessionExpired('Session expired. Please sign in again.')
      return null
    } finally {
      setRefreshingToken(false)
    }
  }

  // Configure axios defaults and interceptors
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
    
    // Configure axios to include credentials for cookie support
    axios.defaults.withCredentials = true
    
    // Add response interceptor for automatic token refresh
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config
        
        // If request fails with 401 and we haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry && token) {
          originalRequest._retry = true
          
          const newToken = await refreshAccessToken()
          if (newToken) {
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`
            return axios(originalRequest)
          }
        }
        
        return Promise.reject(error)
      }
    )
    
    // Cleanup interceptor on unmount or token change
    return () => {
      axios.interceptors.response.eject(responseInterceptor)
    }
  }, [token])

  // Check if user is authenticated on app load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token')
      
      if (storedToken) {
        // Check if stored token is expired
        if (isTokenExpired(storedToken)) {
          console.log('Stored token is expired, attempting refresh...')
          
          // Try to refresh the token
          const refreshedToken = await refreshAccessToken()
          
          if (refreshedToken) {
            // Successfully refreshed, fetch user data
            try {
              await fetchUserData()
            } catch (error) {
              console.error('Failed to fetch user data after refresh:', error)
              handleSessionExpired('Unable to restore session. Please sign in again.')
            }
          }
          // If refresh failed, handleSessionExpired was already called
        } else {
          // Token is not expired, try to fetch user data
          try {
            await fetchUserData()
          } catch (error) {
            console.error('Auth initialization failed:', error)
            
            // If 401, try to refresh token
            if (error.response?.status === 401) {
              const refreshedToken = await refreshAccessToken()
              if (refreshedToken) {
                try {
                  await fetchUserData()
                } catch (refreshError) {
                  console.error('Failed to fetch user data after refresh:', refreshError)
                  handleSessionExpired('Unable to restore session. Please sign in again.')
                }
              }
            } else {
              handleSessionExpired('Session validation failed. Please sign in again.')
            }
          }
        }
      } else {
        // No token stored, check if we have a refresh token cookie
        try {
          const refreshedToken = await refreshAccessToken()
          if (refreshedToken) {
            await fetchUserData()
          }
        } catch (error) {
          // No valid refresh token, user needs to sign in
          console.log('No valid tokens found')
        }
      }
      
      setLoading(false)
    }
    
    initAuth()
  }, [])

  const fetchUserData = async () => {
    try {
      const [userResponse, usageResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/auth/me`),
        axios.get(`${API_BASE_URL}/usage/me`)
      ])
      
      setUser(userResponse.data)
      
      // Transform usage data to match expected format
      const usageData = usageResponse.data
      setUsage({
        documents: { used: usageData.docs_used },
        chats: { used: usageData.chats_used },
        tokens: { used: usageData.tokens_used }
      })
      
      return userResponse.data
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      throw error
    }
  }

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData)
      
      // Don't auto-login after registration
      // User should manually sign in after successful registration
      
      return response.data
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  }

  const login = async (credentials) => {
    try {
      // Handle both token-based (Google) and email/password login
      let response
      
      if (credentials.token) {
        // Token-based login (already authenticated)
        const access_token = credentials.token
        localStorage.setItem('auth_token', access_token)
        setToken(access_token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
        await fetchUserData()
        return { access_token }
      } else {
        // Email/password login - cookies will be set automatically
        response = await axios.post(`${API_BASE_URL}/auth/login`, credentials, {
          withCredentials: true  // Include cookies in request
        })
        const { access_token } = response.data
        
        localStorage.setItem('auth_token', access_token)
        setToken(access_token)
        
        // Set axios authorization header immediately before making subsequent requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
        
        // Fetch user data after successful login
        await fetchUserData()
        
        return response.data
      }
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      // Call backend logout to clear refresh token cookie
      await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
        withCredentials: true
      })
    } catch (error) {
      console.error('Logout request failed:', error)
    }
    
    // Clear local storage and state
    localStorage.removeItem('auth_token')
    setToken(null)
    setUser(null)
    setUsage(null)
    delete axios.defaults.headers.common['Authorization']
  }

  const refreshUserData = async () => {
    if (token) {
      try {
        await fetchUserData()
      } catch (error) {
        console.error('Failed to refresh user data:', error)
      }
    }
  }


  // Usage limit checking functions
  const canUploadDocument = () => {
    if (!user || !usage) return false
    const limits = PLAN_LIMITS[user.plan.toLowerCase()]
    return usage.documents.used < limits.doc_limit
  }

  const canSendChat = () => {
    if (!user || !usage) return false
    const limits = PLAN_LIMITS[user.plan.toLowerCase()]
    return usage.chats.used < limits.chat_limit
  }

  const canUseTokens = (estimatedTokens = 0) => {
    if (!user || !usage) return false
    const limits = PLAN_LIMITS[user.plan.toLowerCase()]
    return (usage.tokens.used + estimatedTokens) <= limits.token_limit
  }

  const getRemainingLimits = () => {
    if (!user || !usage) return null
    const limits = PLAN_LIMITS[user.plan.toLowerCase()]
    
    return {
      documents: limits.doc_limit - usage.documents.used,
      chats: limits.chat_limit - usage.chats.used,
      tokens: limits.token_limit - usage.tokens.used
    }
  }

  const getUsagePercentages = () => {
    if (!user || !usage) return null
    const limits = PLAN_LIMITS[user.plan.toLowerCase()]
    
    return {
      documents: Math.round((usage.documents.used / limits.doc_limit) * 100),
      chats: Math.round((usage.chats.used / limits.chat_limit) * 100),
      tokens: Math.round((usage.tokens.used / limits.token_limit) * 100)
    }
  }

  const isAuthenticated = !!token && !!user

  const value = {
    user,
    token,
    loading,
    usage,
    isAuthenticated,
    register,
    login,
    logout,
    refreshUserData,
    refreshAccessToken,
    canUploadDocument,
    canSendChat,
    canUseTokens,
    getRemainingLimits,
    getUsagePercentages,
    PLAN_LIMITS
  }

  return (
    <AuthContext.Provider value={value}>
      {/* Session Expired Overlay */}
      {sessionExpired && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-4">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 text-red-500">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Session Expired
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Your session has expired. Redirecting to sign in...
              </p>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            </div>
          </div>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  )
} 