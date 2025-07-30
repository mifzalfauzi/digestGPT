import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './components/ThemeProvider'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthNavigationHandler from './components/AuthNavigationHandler'
import LandingPage from './components/LandingPage'
import Assistant from './components/Assistant'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import ComingSoonPage from './components/ComingSoon'
import StripeCheckout from './components/StripeCheckout'
import VerifyEmail from './pages/VerifyEmail'
import ResendVerification from './pages/ResendVerification'
import AuthCallback from './pages/AuthCallback'
import WelcomePage from './pages/WelcomePage'
import StripeSuccess from './components/StripeSuccess'
import StripeCancel from './components/StripeCancel'
import CheckingAuthPage from './pages/CheckingAuth'

// Simplified Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  
  console.log('🛡️ ProtectedRoute - isAuthenticated:', isAuthenticated, 'loading:', isLoading)

  // Show loading while auth is being checked
  if (isLoading) {
    return <CheckingAuthPage />
  }

  // If not authenticated, redirect to signin
  if (!isAuthenticated) {
    // Store the intended path for after login
    sessionStorage.setItem('intendedPath', window.location.pathname)
    return <Navigate to="/signin" replace />
  }

  // User is authenticated, render the protected component
  return children
}

// Public Route Component (redirect to assistant if authenticated)
function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()

  // Show loading while auth is being checked
  if (isLoading) {
    return <CheckingAuthPage />
  }

  // If authenticated, redirect to assistant
  if (isAuthenticated) {
    return <Navigate to="/assistant" replace />
  }

  // User is not authenticated, render the public component
  return children
}

function AppContent() {
  return (
    <Router>
      <AuthNavigationHandler />
      <Routes>
        {/* Protected Routes */}
        <Route path="/assistant" element={
          <ProtectedRoute>
            <Assistant />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/upgrade" element={
          <ProtectedRoute>
            <StripeCheckout />
          </ProtectedRoute>
        } />
        <Route path="/stripe-success" element={
          <ProtectedRoute>
            <StripeSuccess />
          </ProtectedRoute>
        } />
        <Route path="/stripe-cancel" element={
          <ProtectedRoute>
            <StripeCancel />
          </ProtectedRoute>
        } />
        <Route path="/welcome" element={
          <ProtectedRoute>
            <WelcomePage />
          </ProtectedRoute>
        } />
        
        {/* Public Routes */}
        <Route path="/signin" element={
          <PublicRoute>
            <SignIn />
          </PublicRoute>
        } />
        <Route path="/signup" element={
          <PublicRoute>
            <SignUp />
          </PublicRoute>
        } />
        {/* <Route path="/main" element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        } /> */}
        <Route path="/main" element={<LandingPage />} />
        <Route path="/verify-email" element={
          <PublicRoute>
            <VerifyEmail />
          </PublicRoute>
        } />
        <Route path="/resend-verification" element={
          <PublicRoute>
            <ResendVerification />
          </PublicRoute>
        } />
        <Route path="/coming-soon" element={
          <PublicRoute>
            <ComingSoonPage />
          </PublicRoute>
        } />
        
        {/* Special routes that don't need auth protection */}
        <Route path="/auth-callback" element={<AuthCallback />} />
        <Route path="/checking-auth" element={<CheckingAuthPage />} />
        
        {/* Default redirects */}
        <Route path="/" element={<Navigate to="/coming-soon" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App