import React, { useEffect, useState } from 'react';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';

export default function StripeSuccess() {
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const [planDetails, setPlanDetails] = useState(null);

  // Get session_id from URL parameters
  const getSessionId = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('session_id');
  };

  const sessionId = getSessionId();

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setMessage('No session ID found');
      return;
    }

    updateUserPlan();
  }, [sessionId]);

  const updateUserPlan = async () => {
    try {
      setStatus('loading');
      setMessage('Updating your subscription...');

      console.log('🔄 Updating plan with session ID:', sessionId);

      // Call the manual update endpoint
      const response = await fetch('http://localhost:8000/stripe/update-plan-manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          session_id: sessionId
        })
      });

      console.log('📡 Update response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Update failed:', errorData);
        throw new Error(errorData.detail || 'Failed to update plan');
      }

      const data = await response.json();
      console.log('✅ Plan updated successfully:', data);
      
      setStatus('success');
      setMessage('Subscription activated successfully!');
      setPlanDetails(data);

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        window.location.href = '/assistant';
      }, 3000);

    } catch (error) {
      console.error('❌ Error updating plan:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to activate subscription');
    }
  };

  const retryUpdate = () => {
    updateUserPlan();
  };

  const goToDashboard = () => {
    window.location.href = '/assistant';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          
          {/* Loading State */}
          {status === 'loading' && (
            <>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-6">
                <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-300 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Processing Payment
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {message}
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
              </div>
            </>
          )}

          {/* Success State */}
          {status === 'success' && (
            <>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 mb-6">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-300" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Payment Successful! 🎉
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {message}
              </p>
              
              {planDetails && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    <strong>New Plan:</strong> {planDetails.plan?.toUpperCase() || 'Updated'}
                  </p>
                  {planDetails.subscription_id && (
                    <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                      Subscription: {planDetails.subscription_id}
                    </p>
                  )}
                </div>
              )}

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Redirecting to dashboard in 3 seconds...
              </p>
              
              <button
                onClick={goToDashboard}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Go to Dashboard Now
              </button>
            </>
          )}

          {/* Error State */}
          {status === 'error' && (
            <>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 mb-6">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-300" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Activation Issue
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {message}
              </p>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Don't worry!</strong> Your payment was processed successfully. 
                  We're just having trouble activating your subscription automatically.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={retryUpdate}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Try Again
                </button>
                
                <button
                  onClick={goToDashboard}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Go to Dashboard
                </button>
                
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  If the issue persists, contact support with session: {sessionId}
                </p>
              </div>
            </>
          )}

          {/* Debug Info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs">
              <p><strong>Debug:</strong></p>
              <p>Session ID: {sessionId}</p>
              <p>Status: {status}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}