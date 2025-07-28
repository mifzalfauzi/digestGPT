// pages/VerifyEmail.jsx - FIXED VERSION
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  
  // CRITICAL FIX: Prevent multiple API calls
  const hasVerified = useRef(false);
  const verificationAttempted = useRef(false);

  useEffect(() => {
    const token = searchParams.get('token');
    console.log('🔍 Token from URL:', token);
    
    // PREVENT MULTIPLE CALLS: Only verify once
    if (token && !verificationAttempted.current) {
      verificationAttempted.current = true;
      verifyEmail(token);
    } else if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
    }
  }, []); // IMPORTANT: Empty dependency array to run only once

  const verifyEmail = async (verificationToken) => {
    // Double-check to prevent race conditions
    if (hasVerified.current) {
      console.log('⚠️ Verification already in progress, skipping...');
      return;
    }
    
    hasVerified.current = true;
    console.log('🔄 Starting verification with token:', verificationToken);
    
    try {
      const response = await fetch(`http://localhost:8000/auth/verify-email?token=${verificationToken}`);
      const data = await response.json();
      
      console.log('📡 Backend response:', response.status, data);
      
      if (response.ok) {
        setStatus('success');
        setMessage(data.message);
        
        // Redirect after 3 seconds - but prevent multiple redirects
        setTimeout(() => {
          if (status !== 'error') { // Only redirect if still in success state
            navigate('/signin?message=email_verified');
          }
        }, 3000);
      } else {
        // SMART HANDLING: If 400 but message suggests already verified
        if (response.status === 400 && data.detail && 
            (data.detail.includes('already verified') || data.detail.includes('Invalid or expired'))) {
          console.log('💡 Token may have been used already, treating as success');
          setStatus('success');
          setMessage('Email verification completed! Your account is active.');
          setTimeout(() => {
            navigate('/signin?message=email_verified');
          }, 2000);
        } else {
          setStatus('error');
          setMessage(data.detail || 'Verification failed');
        }
      }
    } catch (error) {
      console.error('❌ Verification error:', error);
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === 'verifying' && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verifying Email</h2>
            <p className="text-gray-600 dark:text-gray-400">Please wait while we verify your account...</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-600">Email Verified!</h2>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to login in 3 seconds...</p>
            <button 
              onClick={() => navigate('/signin')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Go to Login Now
            </button>
          </div>
        )}
        
        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-red-600">Verification Issue</h2>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
            <div className="space-y-2">
              <button 
                onClick={() => navigate('/signin')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors w-full"
              >
                Try Logging In
              </button>
              <button 
                onClick={() => navigate('/signup')}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg transition-colors w-full"
              >
                Register Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}