import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function WelcomePage() {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading } = useAuth();
    const [countdown, setCountdown] = useState(3);  
    
    useEffect(() => {
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              navigate('/assistant');
            }
            return prev - 1;
          });
        }, 1000);
    
        return () => clearInterval(timer);
      }, [navigate]);
      
    
      // ADD DEBUG LOGGING
    //   useEffect(() => {
    //     console.log('🔍 Welcome Page Debug:', {
    //       isAuthenticated,
    //       isLoading,
    //       user: user ? 'User exists' : 'User is null',
    //       userEmail: user?.email
    //     });
    //   }, [isAuthenticated, isLoading, user]);
      
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 p-8">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <div>
            <h1 className="text-3xl font-bold dark:text-white mb-2">Welcome to drop2chat*</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Hi {user?.email}! You're successfully signed in.
            </p>
          </div>
          
          <div className="space-y-4">
            {/* <button
              onClick={() => navigate('/assistant')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Click here to get started
            </button> */}
            
            <p className="text-sm text-gray-500">
                Redirecting automatically in {countdown} seconds...
            </p>
          </div>
        </div>
      </div>
    );
  }