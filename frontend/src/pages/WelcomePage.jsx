import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function WelcomePage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    
    useEffect(() => {
        // Auto-redirect to assistant after 3 seconds
        const timer = setTimeout(() => {
          navigate('/assistant');
        }, 3000);
        
        return () => clearTimeout(timer);
      }, [navigate]);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-6 p-8">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome!</h1>
            <p className="text-gray-600">
              Hi {user?.email}! You're successfully signed in.
            </p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => navigate('/assistant')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started
            </button>
            
            <p className="text-sm text-gray-500">
              Redirecting automatically in 3 seconds...
            </p>
          </div>
        </div>
      </div>
    );
  }