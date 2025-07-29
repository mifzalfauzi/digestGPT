// src/pages/AuthCallback.js - Enhanced version
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkAuthStatus } = useAuth(); // Get the auth refresh function

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get token from URL parameters
        const token = searchParams.get('token');
        const welcome = searchParams.get('welcome');
        
        if (!token) {
          console.error('❌ Missing token in URL');
          navigate('/signin?error=missing_token');
          return;
        }

        console.log('🔓 Extracting authentication tokens...');
        
        // Extract auth tokens from the short-lived token
        const response = await fetch('http://localhost:8000/auth/extract-auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Important for cookies
          body: JSON.stringify({ token })
        });

        if (response.ok) {
          console.log('✅ Authentication successful');
          
          // Clear the URL immediately for security
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // IMPORTANT: Refresh auth context after cookies are set
          console.log('🔄 Refreshing authentication context...');
          await checkAuthStatus();
          
          // Small delay to ensure auth context is updated
          setTimeout(() => {
            // Redirect to app
            if (welcome === 'true') {
              navigate('/welcome');
            } else {
              navigate('/assistant');
            }
          }, 100);
          
        } else {
          const error = await response.json();
          console.error('❌ Auth extraction failed:', error);
          
          if (error.detail?.includes('expired')) {
            navigate('/signin?error=token_expired&message=Authentication link expired. Please request a new one.');
          } else {
            navigate('/signin?error=auth_failed&message=Authentication failed. Please try again.');
          }
        }
        
      } catch (error) {
        console.error('❌ Auth callback error:', error);
        navigate('/signin?error=callback_failed&message=Something went wrong. Please try again.');
      }
    };

    // Run the callback handler
    handleAuthCallback();
  }, [navigate, searchParams, checkAuthStatus]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center space-y-6 p-8">
        {/* Animated Spinner */}
        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
        
        {/* Loading Text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Completing sign-in...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we authenticate you securely.
          </p>
        </div>
        
        {/* Progress Steps */}
        <div className="text-sm text-gray-500 dark:text-gray-500 max-w-md mx-auto space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Verifying authentication token</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Setting up secure session</span>
          </div>
        </div>
      </div>
    </div>
  );
}