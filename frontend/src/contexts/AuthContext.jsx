import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
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

  // Helper function to check if we're authenticated by making a test request
  const checkAuthStatus = async () => {
    try {
      await axios.get(`${API_BASE_URL}/auth/check-auth`)
      return true
    } catch (error) {
      return false
    }
  }

  const handleSessionExpired = (message = 'Your session has expired. Please sign in again.') => {
    setUser(null)
    setIsAuthenticated(false)
    setUsage({
      documents: { used: 0 },
      chats: { used: 0 },
      tokens: { used: 0 }
    })
    
    // Store the session expired message
    sessionStorage.setItem('sessionExpiredMessage', message)
    
    // Clear any stored tokens (cleanup)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    
    // Navigate to sign in (this will be handled by the app)
    window.location.href = '/signin'
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
        await fetchUserData()
        return true
      } else {
        console.error('Auth check failed after token refresh')
        handleSessionExpired()
        return false
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      // If refresh fails, handle session expiry
      handleSessionExpired('Session expired. Please sign in again.')
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
        setIsLoading(true)
        
        // Clear any old localStorage tokens since we're using cookies now
        localStorage.removeItem('auth_token')
        localStorage.removeItem('refresh_token')
        
        // Check if we're authenticated via cookies
        const authStatus = await checkAuthStatus()
        if (authStatus) {
          console.log('Found valid authentication cookies')
          await fetchUserData()
        } else {
          console.log('No valid authentication found')
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Auth initialization failed:', error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const fetchUserData = async () => {
    try {
      const [userResponse, usageResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/auth/me`, { withCredentials: true }),
        axios.get(`${API_BASE_URL}/usage/me`, { withCredentials: true })
      ])
      
      setUser(userResponse.data)
      setIsAuthenticated(true)
      
      // The backend now returns the full structure with limits
      const usageData = usageResponse.data
      setUsage(usageData.usage) // Extract the usage object which contains documents, chats, tokens with limits
      
      return userResponse.data
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      setIsAuthenticated(false)
      throw error
    }
  }

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData, {
        withCredentials: true  // Include cookies in request
      })
      
      // Fetch user data after successful registration
      await fetchUserData()
      
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
        // Empty credentials means cookies are already set (e.g., after Google OAuth)
        // Just fetch user data to establish authentication state
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

  const logout = async () => {
    try {
      // Call logout endpoint to clear cookies on server
      await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
        withCredentials: true
      })
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
      localStorage.removeItem('auth_token')
      localStorage.removeItem('refresh_token')
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
    refreshUserData,
    canUploadDocument,
    canSendChat,
    canUseTokens,
    getRemainingLimits,
    getUsagePercentages,
    fetchUserData // Export this for use in components that need to re-fetch user data
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 