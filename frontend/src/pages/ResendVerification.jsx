// pages/ResendVerification.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function ResendVerification() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error', 'info'
  const navigate = useNavigate();

  const handleResend = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Please enter your email address');
      setMessageType('error');
      return;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage('Please enter a valid email address');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      console.log('🔄 Sending resend verification request for:', email);
      
      const response = await fetch('http://localhost:8000/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      const data = await response.json();
      console.log('📡 Resend verification response:', response.status, data);

      if (response.ok) {
        setMessage(data.message);
        setMessageType(data.already_verified ? 'info' : 'success');
        
        // If already verified, redirect to login after a moment
        if (data.already_verified) {
          setTimeout(() => {
            navigate('/signin?message=email_verified');
          }, 3000);
        }
      } else if (response.status === 429) {
        // Rate limited
        setMessage(data.detail || 'Too many requests. Please wait before trying again.');
        setMessageType('error');
      } else {
        setMessage(data.detail || 'Failed to resend verification email');
        setMessageType('error');
      }
    } catch (error) {
      console.error('❌ Resend verification error:', error);
      setMessage('Network error. Please check your connection and try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full">
        
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Resend Verification Email
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Enter your email address and we'll send you a new verification link
            </p>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`rounded-lg p-4 flex items-start gap-3 mb-6 ${
            messageType === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
              : messageType === 'error'
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
              : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
          }`}>
            <div className="flex-shrink-0 mt-0.5">
              {messageType === 'success' && <CheckCircle className="h-4 w-4" />}
              {(messageType === 'error' || messageType === 'info') && <AlertCircle className="h-4 w-4" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{message}</p>
            </div>
            <button
              onClick={() => {
                setMessage('');
                setMessageType('');
              }}
              className="flex-shrink-0 ml-auto text-current opacity-70 hover:opacity-100"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleResend} className="space-y-6">
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
                className="pl-10 h-12 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your email address"
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </div>
            ) : (
              'Resend Verification Email'
            )}
          </button>
        </form>

        {/* Back to Sign In */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/signin')}
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors bg-transparent border-none cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </button>
        </div>

        {/* Additional Help */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Having trouble?
          </h3>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Check your spam/junk folder</li>
            <li>• Make sure you're using the same email you registered with</li>
            <li>• Wait a few minutes for the email to arrive</li>
            <li>• Contact support if you continue having issues</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
            <button 
              onClick={() => navigate('/signup')}
              className="text-blue-600 hover:text-blue-500 font-medium bg-transparent border-none cursor-pointer"
            >
              Sign up here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}