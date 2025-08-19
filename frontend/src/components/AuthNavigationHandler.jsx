import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const AuthNavigationHandler = () => {
  const navigate = useNavigate()
  const BASE_URL = import.meta.env.VITE_API_BASE_URL
  useEffect(() => {
    // Listen for navigation requests from AuthContext
    const handleStorageChange = (e) => {
      if (e.key === 'authRedirectRequest') {
        const redirectData = JSON.parse(e.newValue || '{}')
        if (redirectData.path) {
          navigate(redirectData.path, redirectData.options || {})
          // Clear the request
          localStorage.removeItem('authRedirectRequest')
        }
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Also check for existing redirect request
    const existingRequest = localStorage.getItem('authRedirectRequest')
    if (existingRequest) {
      try {
        const redirectData = JSON.parse(existingRequest)
        if (redirectData.path) {
          navigate(redirectData.path, redirectData.options || {})
          localStorage.removeItem('authRedirectRequest')
        }
      } catch (error) {
        console.error('Error parsing redirect request:', error)
        localStorage.removeItem('authRedirectRequest')
      }
    }
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [navigate])
  
  return null // This component doesn't render anything
}

export default AuthNavigationHandler