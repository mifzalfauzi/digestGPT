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

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }, [token])

  // Check if user is authenticated on app load
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          await fetchUserData()
        } catch (error) {
          console.error('Auth initialization failed:', error)
          logout()
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
        // Email/password login
        response = await axios.post(`${API_BASE_URL}/auth/login`, credentials)
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

  const logout = () => {
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
    canUploadDocument,
    canSendChat,
    canUseTokens,
    getRemainingLimits,
    getUsagePercentages,
    PLAN_LIMITS
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 