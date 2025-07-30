import React, { useState, useEffect } from 'react'
import { Mail, Zap, AlertCircle, Loader2, Shield, Users, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'

function SignIn() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [linkSent, setLinkSent] = useState(false)
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
    const urlError = searchParams.get('error')

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
        case 'welcome':
          setMessage('Welcome! You have been signed in successfully.')
          setMessageType('success')
          messageSet = true
          // For welcome message, redirect to assistant after a short delay
          setTimeout(() => {
            navigate('/assistant')
          }, 2000)
          break
        default:
          break
      }

      // Clear URL parameters after showing message
      if (messageSet) {
        setSearchParams({})

        // Auto-dismiss message after 10 seconds
        setTimeout(() => {
          setMessage('')
          setMessageType('')
        }, 10000)
      }
    }

    // Handle error messages from magic link
    if (urlError && !messageSet) {
      switch (urlError) {
        case 'invalid_link':
          setMessage('Invalid or expired sign-in link. Please request a new one.')
          setMessageType('error')
          messageSet = true
          break
        case 'link_expired':
          setMessage('Sign-in link expired. Please request a new one.')
          setMessageType('error')
          messageSet = true
          break
        case 'login_failed':
          setMessage('Sign-in failed. Please try again.')
          setMessageType('error')
          messageSet = true
          break
        default:
          break
      }

      if (messageSet) {
        setSearchParams({})
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
      console.log('✅ User is authenticated, redirecting to assistant...')
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

  // Handle Magic Link submission
  const handleMagicLinkSubmit = async (e) => {
    e.preventDefault()

    if (!email) {
      setMessage('Please enter your email address')
      setMessageType('error')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage('Please enter a valid email address')
      setMessageType('error')
      return
    }

    setIsLoading(true)
    setMessage('')
    setErrors({})

    try {
      console.log('🔄 Sending magic link request for:', email)

      const response = await fetch('http://localhost:8000/auth/send-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.toLowerCase() }),
      })

      const data = await response.json()
      console.log('📡 Magic link response:', response.status, data)

      if (response.ok) {
        setLinkSent(true)
        setMessage(data.message)
        setMessageType('success')
      } else {
        setMessage(data.detail || 'Failed to send magic link')
        setMessageType('error')
      }
    } catch (error) {
      console.error('❌ Magic link error:', error)
      setMessage('Network error. Please check your connection and try again.')
      setMessageType('error')
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

  const requestNewLink = () => {
    setLinkSent(false)
    setMessage('')
    setMessageType('')
    setEmail('')
  }

  // If link was sent, show the "check email" screen
  if (linkSent) {
    return (
      <div className="min-h-screen flex">
        {/* Left Side - Branding & Features */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#1f1f1f] relative overflow-hidden">
          <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
            <div className="space-y-8">
              {/* Logo and content removed for simplicity */}
            </div>
          </div>
        </div>

        {/* Right Side - Check Email Message */}
        <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 dark:bg-[#121212] p-8">
          <div className="w-full max-w-md text-center space-y-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <Mail className="h-8 w-8 text-white" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Check Your Email
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We've sent a secure sign-in link to <strong>{email}</strong>
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                The link expires in 15 minutes for security
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={requestNewLink}
                className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors"
              >
                Send Another Link
              </button>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Didn't receive the email? Check your spam folder or try again.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
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
            <div className={`rounded-lg p-4 flex items-start gap-3 ${messageType === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                : messageType === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                  : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
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
              disabled={isGoogleLoading || isLoading}
              className="w-full h-12 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 bg-white dark:bg-[#121212] text-gray-900 dark:text-white font-medium rounded-lg flex items-center justify-center gap-3 hover:shadow-md disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
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

          {/* Magic Link Form */}
          <div className="space-y-6">
  <div>
    <div className="relative">
      <input 
        type="email" 
        id="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder=""
        className="h-12 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#121212] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all peer"
        disabled={isLoading}
        required
      />
      <label 
        htmlFor="email" 
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 transition-all duration-200 pointer-events-none
                   peer-focus:-top-1 peer-focus:left-3 peer-focus:text-xs peer-focus:text-blue-500 peer-focus:font-medium peer-focus:bg-white dark:peer-focus:bg-[#121212] peer-focus:px-1
                   peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-gray-600 dark:peer-[:not(:placeholder-shown)]:text-gray-300 peer-[:not(:placeholder-shown)]:bg-white dark:peer-[:not(:placeholder-shown)]:bg-[#121212] peer-[:not(:placeholder-shown)]:px-1 peer-[:not(:placeholder-shown)]:font-medium"
      >
        Email address
      </label>
    </div>
  </div>

            <button
              onClick={handleMagicLinkSubmit}
              disabled={isLoading || isGoogleLoading || !email}
              className="w-full h-12 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 font-medium rounded-lg flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending Magic Link...
                </>
              ) : (
                <>
                  Continue with email
                </>
              )}
            </button>
          </div>

          {/* Info about Magic Links */}
          {/* <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              How it works:
            </h3>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Enter your email address</li>
              <li>• Check your email for a secure link</li>
              <li>• Click the link to sign in instantly</li>
              <li>• No passwords to remember!</li>
            </ul>
          </div> */}

          {/* Sign Up Link */}
          <div className="text-center">
            {/* <p className="text-sm text-gray-600 dark:text-gray-400">
              Prefer traditional signup?{' '}
              <button 
                onClick={() => navigate('/signup')}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors bg-transparent border-none cursor-pointer"
              >
                Create Account
              </button>
            </p> */}
            {/* Add resend verification link */}
            {/* <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Need to verify your email?{' '}
              <button 
                onClick={() => navigate('/resend-verification')}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors bg-transparent border-none cursor-pointer"
              >
                Resend verification email
              </button>
            </p> */}
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