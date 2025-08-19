import React, { useEffect, useState } from 'react';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import InvoiceDisplay from './InvoiceDisplay';

export default function StripeSuccess() {
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const [planDetails, setPlanDetails] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [invoiceFilename, setInvoiceFilename] = useState(null);
  const [hasProcessed, setHasProcessed] = useState(false); // Prevent duplicate calls
  const BASE_URL = import.meta.env.VITE_API_BASE_URL
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

    // Prevent duplicate calls in React StrictMode
    if (hasProcessed) {
      console.log('⚠️ Already processed, skipping duplicate call');
      return;
    }

    setHasProcessed(true);
    updateUserPlan();
  }, [sessionId, hasProcessed]);

  const updateUserPlan = async () => {
    try {
      setStatus('loading');
      setMessage('Processing your payment and updating subscription...');

      console.log('🔄 Updating plan with session ID:', sessionId);

      // Call the manual update endpoint
      const response = await fetch(`${BASE_URL}/stripe/update-plan-manual`, {
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
        throw new Error(errorData.detail || 'Failed to update subscription');
      }

      const data = await response.json();
      console.log('✅ Plan updated successfully:', data);

      setPlanDetails(data);
      setStatus('success');
      setMessage(`Your ${data.new_plan} plan is now active!`);
      
      // Set invoice data if available
      if (data.invoice_data) {
        setInvoiceData(data.invoice_data);
      }
      
      if (data.invoice_filename) {
        setInvoiceFilename(data.invoice_filename);
      }

    } catch (error) {
      console.error('❌ Plan update error:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to update your subscription. Please contact support.');
    }
  };

  const handleShowInvoice = () => {
    setShowInvoice(true);
  };

  const handleBackToSummary = () => {
    setShowInvoice(false);
  };

  // Show invoice view
  if (showInvoice) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#121212] py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <button
              onClick={handleBackToSummary}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
            >
              ← Back to Summary
            </button>
          </div>
          
          <InvoiceDisplay 
            sessionId={sessionId}
            invoiceData={invoiceData}
            invoiceFilename={invoiceFilename}
          />
        </div>
      </div>
    );
  }

  // Main success/loading/error view
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-[#121212] rounded-lg shadow-lg p-8 text-center">
          
          {/* Loading State */}
          {status === 'loading' && (
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Processing Payment
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {message}
              </p>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Please don't close this window...
              </div>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && planDetails && (
            <div className="space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Payment Successful!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {message}
                </p>
              </div>

              {/* Plan Details */}
              <div className="bg-gray-50 dark:bg-[#121212] rounded-lg p-4 text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Subscription Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Plan:</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {planDetails.new_plan}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Next Billing:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {planDetails.subscription_end_date ? 
                        new Date(planDetails.subscription_end_date).toLocaleDateString() : 
                        'Not available'
                      }
                    </span>
                  </div>
                  {planDetails.subscription_id && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Subscription ID:</span>
                      <span className="font-mono text-xs text-gray-900 dark:text-white">
                        {planDetails.subscription_id.substring(0, 20)}...
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Email Confirmation Notice */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                      Confirmation Email Sent
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      A payment confirmation and invoice has been sent to {planDetails.user_email}.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Show Invoice Button */}
                {(invoiceData || sessionId) && (
                  <button
                    onClick={handleShowInvoice}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    View Invoice
                  </button>
                )}

                {/* Continue Button */}
                <button
                  onClick={() => window.location.href = '/assistant'}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Continue to DocuChat
                </button>

                
              </div>

              {/* Debug info (only in development) */}
            
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Payment Processing Failed
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {message}
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => window.location.href = '/upgrade'}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="w-full bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}