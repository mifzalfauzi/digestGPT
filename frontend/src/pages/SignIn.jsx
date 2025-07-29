import React, { useState, useEffect } from 'react'
import { Eye, EyeOff, Lock, Mail, Zap, AlertCircle, Loader2, Shield, Users, TrendingUp, CheckCircle } from 'lucide-react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'

function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated } = useAuth()
  
  // UNIFIED MESSAGE HANDLING
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('') // 'success', 'info', 'error'
  const [searchParams, setSearchParams] = useSearchParams()

  // SINGLE useEffect for ALL message handling
  useEffect(() => {
    let messageSet = false;

    // 1. Check for message from URL parameters (highest priority)
    const urlMessage = searchParams.get('message')
    if (urlMessage && !messageSet) {
      switch (urlMessage) {
        case 'verify_email':
          setMessage('Please check your email and verify your account before signing in.')
          setMessageType('info')
          messageSet = true
          break
        case 'email_verified':
          setMessage('Email verified successfully! You can now sign in.')
          setMessageType('success')
          messageSet = true
          break
        case 'verification_required':
          setMessage('Please verify your email before signing in.')
          setMessageType('info')
          messageSet = true
          break
        default:
          break
      }
      
      // Clear URL parameters after showing message
      if (messageSet) {
        setSearchParams({})
        
        // Auto-dismiss message after 5 seconds
        setTimeout(() => {
          setMessage('')
          setMessageType('')
        }, 10000)
      }
    }

    // 2. Check for message from navigation state (if no URL message)
    if (location.state?.message && !messageSet) {
      if (location.state?.expired) {
        // Session expired message - show as error
        setMessage(location.state.message)
        setMessageType('error')
        messageSet = true
        // Clear the error after 10 seconds
        setTimeout(() => {
          setMessage('')
          setMessageType('')
        }, 10000)
      } else {
        // Regular success message
        setMessage(location.state.message)
        setMessageType('success')
        messageSet = true
        // Clear the message after 5 seconds
        setTimeout(() => {
          setMessage('')
          setMessageType('')
        }, 5000)
      }
      
      // Clear the state to prevent message from showing on refresh
      navigate(location.pathname, { replace: true, state: {} })
    }

    // 3. Check for session expired message in sessionStorage (if no other messages)
    const sessionExpiredMessage = sessionStorage.getItem('sessionExpiredMessage')
    if (sessionExpiredMessage && !messageSet) {
      setMessage(sessionExpiredMessage)
      setMessageType('error')
      sessionStorage.removeItem('sessionExpiredMessage')
      // Clear the error after 10 seconds
      setTimeout(() => {
        setMessage('')
        setMessageType('')
      }, 10000)
    }
  }, [location, searchParams, navigate, setSearchParams])

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/assistant')
    }
  }, [isAuthenticated, navigate])

  // Load Google Identity Services script
  useEffect(() => {
    const loadGoogleScript = () => {
      if (window.google) return Promise.resolve()
      
      return new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = resolve
        script.onerror = reject
        document.head.appendChild(script)
      })
    }

    loadGoogleScript().then(() => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: false
        })
      }
    }).catch(console.error)
  }, [])

  // Handle Google OAuth response
  const handleGoogleResponse = async (response) => {
    try {
      setIsGoogleLoading(true)
      setErrors({})
  
      const googlePopups = document.querySelectorAll('[data-google-popup]')
      googlePopups.forEach(popup => popup.remove())
  
      // Send Google token to backend, cookies will be set automatically
      await axios.post('http://localhost:8000/auth/google', {
        token: response.credential
      }, {
        withCredentials: true
      })
  
      // The backend sets HTTP-only cookies automatically, so we can use the login function
      // which will call fetchUserData and update the authentication state
      // Pass an empty object since cookies are already set
      await login({})
      
      // Navigation will be handled by useEffect when isAuthenticated changes
    } catch (error) {
      console.error('Google authentication error:', error)
      let errorMessage = 'Google sign-in failed. Please try again.'
  
      if (error.response?.data?.detail) {
        errorMessage = typeof error.response.data.detail === 'string'
          ? error.response.data.detail
          : 'Invalid authentication data. Please try again.'
      }
  
      setErrors({ submit: errorMessage })
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    setErrors({})
    
    try {
      await login({ email, password })
      // Navigation will be handled by useEffect when isAuthenticated changes
    } catch (error) {
      console.error('Login error:', error)
      setErrors({ 
        submit: error.response?.data?.detail || 'Invalid email or password. Please try again.' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    setErrors({})
    
    try {
      if (window.google && window.google.accounts) {
        // Clean up any existing popups first
        const existingPopups = document.querySelectorAll('[data-google-popup]')
        existingPopups.forEach(popup => popup.remove())
        
        // Create a hidden div to render Google button
        const buttonContainer = document.createElement('div')
        buttonContainer.setAttribute('data-google-popup', 'true')
        buttonContainer.style.position = 'absolute'
        buttonContainer.style.top = '-9999px'
        buttonContainer.style.left = '-9999px'
        document.body.appendChild(buttonContainer)
        
        // Render the Google button
        window.google.accounts.id.renderButton(buttonContainer, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          width: 300
        })
        
        // Auto-click the button after a short delay
        setTimeout(() => {
          const googleButton = buttonContainer.querySelector('div[role="button"]')
          if (googleButton) {
            googleButton.click()
          } else {
            // Fallback: try to trigger Google sign-in directly
            window.google.accounts.id.prompt()
          }
        }, 100)
        
      } else {
        throw new Error('Google Identity Services not loaded')
      }
    } catch (error) {
      console.error('Google sign-in error:', error)
      setErrors({ submit: 'Google sign-in failed. Please try again.' })
      setIsGoogleLoading(false)
    }
  }

  const handleMicrosoftSignIn = async () => {
    setIsMicrosoftLoading(true)
    setErrors({})
    
    try {
      // Simulate Microsoft OAuth
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('Microsoft sign in attempt')
      // Handle Microsoft authentication here
    } catch (error) {
      setErrors({ submit: 'Microsoft sign-in failed. Please try again.' })
    } finally {
      setIsMicrosoftLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1f1f1f] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          {/* Background elements removed for simplicity */}
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
          <div className="space-y-8">
            {/* Logo and content removed for simplicity */}
          </div>
        </div>
      </div>
      
      {/* Right Side - Sign In Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 dark:bg-[#121212] p-8">
        <div className="w-full max-w-md space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Risks, insights at your fingertips
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              State-of-the-art AI-powered document analysis.
            </p>
          </div>

          {/* UNIFIED MESSAGE DISPLAY */}
          {message && (
            <div className={`rounded-lg p-4 flex items-start gap-3 ${
              messageType === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                : messageType === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
            }`}>
              <div className="flex-shrink-0 mt-0.5">
                {messageType === 'success' && (
                  <CheckCircle className="h-4 w-4" />
                )}
                {messageType === 'info' && (
                  <AlertCircle className="h-4 w-4" />
                )}
                {messageType === 'error' && (
                  <AlertCircle className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{message}</p>
              </div>
              <button
                onClick={() => {
                  setMessage('')
                  setMessageType('')
                }}
                className="flex-shrink-0 ml-auto text-current opacity-70 hover:opacity-100"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <button 
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading || isMicrosoftLoading}
              className="w-full h-12 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium rounded-lg flex items-center justify-center gap-3 hover:shadow-md disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-gray-50 dark:bg-[#121212] text-gray-500">OR</span>
            </div>
          </div>

          {/* Error Message for form validation only */}
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-600 dark:text-red-400">
                {typeof errors.submit === 'string' ? errors.submit : 'Authentication failed. Please try again.'}
              </span>
            </div>
          )}

          {/* Email Form */}
          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="email" 
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={`pl-10 h-12 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {typeof errors.email === 'string' ? errors.email : 'Email validation failed'}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`pl-10 pr-12 h-12 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                  disabled={isLoading}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {typeof errors.password === 'string' ? errors.password : 'Password validation failed'}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input 
                  id="remember-me" 
                  type="checkbox" 
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  Remember me
                </label>
              </div>
              <button 
                onClick={() => console.log('Forgot password clicked')}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors bg-transparent border-none cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={isLoading || isGoogleLoading || isMicrosoftLoading}
              className="w-full h-12 bg-black dark:bg-white text-white dark:text-black hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 font-medium rounded-lg flex items-center justify-center"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <button 
                onClick={() => navigate('/signup')}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors bg-transparent border-none cursor-pointer"
              >
                Sign Up
              </button>
            </p>
            {/* Add resend verification link */}
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Need to verify your email?{' '}
              <button 
                onClick={() => navigate('/resend-verification')}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors bg-transparent border-none cursor-pointer"
              >
                Resend verification email
              </button>
            </p>
          </div>

          {/* Footer */}
          <div className="text-center pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              By signing in, you agree to our{' '}
              <button onClick={() => console.log('Terms clicked')} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 bg-transparent border-none cursor-pointer">
                Terms of Service
              </button>{' '}
              and{' '}
              <button onClick={() => console.log('Privacy clicked')} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 bg-transparent border-none cursor-pointer">
                Privacy Policy
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignIn