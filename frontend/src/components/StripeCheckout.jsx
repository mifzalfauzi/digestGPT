// Create src/components/StripeCheckout.jsx
import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../contexts/AuthContext';
import { Crown, Star, Zap, Check, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { Separator } from './ui/separator';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function StripeCheckout() {
  const [loading, setLoading] = useState({});
  const { user } = useAuth();

  // Debug environment variables
  // React.useEffect(() => {
  //   console.log('🔧 Environment Variables Debug:');
  //   console.log('VITE_STRIPE_PUBLISHABLE_KEY:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? 'Set ✅' : 'Missing ❌');
  //   console.log('VITE_STRIPE_PRICE_ID_STANDARD:', import.meta.env.VITE_STRIPE_PRICE_ID_STANDARD || 'Missing ❌');
  //   console.log('VITE_STRIPE_PRICE_ID_PRO:', import.meta.env.VITE_STRIPE_PRICE_ID_PRO || 'Missing ❌');
  //   console.log('🔍 All VITE_ env vars:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));
  // }, []);

  const plans = [
    {
      id: 'standard',
      name: 'Standard Plan',
      price: '$3.99',
      priceId: import.meta.env.VITE_STRIPE_PRICE_ID_STANDARD || null, // Will be null if undefined
      icon: <Star className="h-6 w-6" />,
      features: [
        'Priority support',
        'Get insights, risks and summaries from 50 documents',
        'Access to Elva* (powered by Claude 4 Sonnet) for 100 interactions',
        'Usage of 100k tokens per month'
      ],
      color: 'from-blue-500 to-blue-600',
      description: 'Ideal for students, hobbyists, and casual users'
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: '$7.99',
      priceId: import.meta.env.VITE_STRIPE_PRICE_ID_PRO || null, // Will be null if undefined
      icon: <Crown className="h-6 w-6" />,
      features: [
        '3x more usage than Standard Plan',
        'Get insights, risks and summaries from 150 documents',
        'Access to Elva* (powered by Claude 4 Sonnet) for 350 interactions',
        'Usage of 350k tokens per month'
      ],
      color: 'from-purple-500 to-purple-600',
      popular: false,
      description: 'Perfect for researchers and professionals'
    }
  ];

  const handleUpgrade = async (plan) => {
    try {
      console.log('🛒 Starting upgrade for:', plan.name);
      console.log('📋 Plan Price ID:', plan.priceId);
      console.log('👤 Current user:', user);
      console.log('🔐 User authenticated:', !!user);
      console.log('📧 User email:', user?.email);
      console.log('🍪 Document cookies:', document.cookie);

      setLoading(prev => ({ ...prev, [plan.id]: true }));

      // Check if price ID is available
      if (!plan.priceId) {
        throw new Error(`Price ID not configured for ${plan.name}. Please add VITE_STRIPE_PRICE_ID_${plan.id.toUpperCase()} to your .env file.`);
      }

      // Validate user is logged in
      if (!user) {
        throw new Error('Please log in to upgrade your plan.');
      }

      console.log('📡 Sending request to server...');
      console.log('🔗 Request URL:', 'http://localhost:8000/stripe/create-checkout-session');
      console.log('📦 Request body:', JSON.stringify({
        price_id: plan.priceId,
        success_url: `${window.location.origin}/stripe-success`,
        cancel_url: `${window.location.origin}/stripe-cancel`
      }, null, 2));

      // Create checkout session
      const response = await fetch('http://localhost:8000/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          price_id: plan.priceId,
          success_url: `${window.location.origin}/stripe-success`,
          cancel_url: `${window.location.origin}/stripe-cancel`
        })
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error:', response.status, response.statusText);
        console.error('❌ Error body:', errorText);
        console.error('❌ Response headers:', Object.fromEntries(response.headers.entries()));
        
        let errorMessage = 'Failed to create checkout session';
        
        if (response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else {
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.detail || errorMessage;
          } catch (e) {
            errorMessage = errorText || errorMessage;
          }
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Checkout session created:', data);

      if (!data.checkout_url) {
        throw new Error('No checkout URL received from server');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.checkout_url;

    } catch (error) {
      console.error('❌ Upgrade error:', error);
      
      let userMessage = error.message || 'Failed to start upgrade process. Please try again.';
      
      // Show specific error messages
      if (error.message.includes('Price ID not configured')) {
        userMessage = `${error.message}\n\nPlease contact support or check your configuration.`;
      } else if (error.message.includes('log in')) {
        userMessage = 'Please log in to continue with your upgrade.';
      }
      
      alert(userMessage);
    } finally {
      setLoading(prev => ({ ...prev, [plan.id]: false }));
    }
  };

  const handleManageSubscription = async () => {
    try {
      setLoading(prev => ({ ...prev, manage: true }));

      const response = await fetch('http://localhost:8000/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          return_url: `${window.location.origin}/stripe-success`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { portal_url } = await response.json();
      window.location.href = portal_url;

    } catch (error) {
      console.error('Portal error:', error);
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, manage: false }));
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? It will remain active until the end of your current billing period.')) {
      return;
    }

    try {
      setLoading(prev => ({ ...prev, cancel: true }));

      const response = await fetch('http://localhost:8000/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to cancel subscription');
      }

      const data = await response.json();
      alert(data.message);
      
      // Refresh the page to show updated status
      window.location.reload();

    } catch (error) {
      console.error('Cancel error:', error);
      alert(error.message || 'Failed to cancel subscription. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, cancel: false }));
    }
  };

  // Check if any price IDs are missing
  const missingPriceIds = plans.filter(plan => !plan.priceId);

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] py-12">
      <div className="absolute top-6 left-6 z-50">
        <button
          onClick={() => window.location.href = '/assistant'}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Back</span>
        </button>
      </div>
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Upgrade Your Plan
          </p>
        </div>

        <Separator className="my-4" />

        {/* Configuration Warning */}
        {/* {missingPriceIds.length > 0 && (
          <div className="mb-8 p-4 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-lg">
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              ⚠️ Configuration Required
            </h4>
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">
              Missing price IDs for: {missingPriceIds.map(p => p.name).join(', ')}
            </p>
            <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
              Add these to your .env file:
            </p>
            <code className="block mt-2 p-2 bg-yellow-200 dark:bg-yellow-800 rounded text-xs">
              {missingPriceIds.map(plan => 
                `VITE_STRIPE_PRICE_ID_${plan.id.toUpperCase()}=price_your_price_id_here`
              ).join('\n')}
            </code>
          </div>
        )} */}

        {/* Current Plan Info */}
        {user && (
          <div className="rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Current Plan: {user.plan?.toUpperCase() || 'FREE'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Signed in as {user.email}
                </p>
              </div>
              {user.plan !== 'free' && (
                <div className="flex gap-2">
                  {/* <button
                    onClick={handleManageSubscription}
                    disabled={loading.manage}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading.manage ? 'Loading...' : 'Manage Billing'}
                  </button> */}
                  <button
                    onClick={handleCancelSubscription}
                    disabled={loading.cancel}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {loading.cancel ? 'Loading...' : 'Cancel Subscription'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.id} className="relative group">
              {/* Main Card */}
              <div
                className={`
                  relative bg-white dark:bg-black rounded-2xl shadow-xl overflow-hidden 
                  border border-gray-200 dark:border-gray-700 transition-all duration-300
                  hover:shadow-2xl hover:-translate-y-1
                  min-h-[560px] flex flex-col justify-between
                  ${plan.popular
                    ? 'ring-2 ring-purple-500 scale-105 shadow-purple-500/20'
                    : 'hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 z-10">
                    <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 text-white text-center py-3">
                      <span className="text-sm font-semibold tracking-wide">✨ Most Popular</span>
                    </div>
                  </div>
                )}

                <div className={`p-8 ${plan.popular ? 'pt-16' : 'pt-8'}`}>
                  {/* Plan Header */}
                  <div className="text-center mb-8">
                    <div className={`
                      inline-flex p-4 rounded-2xl bg-gradient-to-br ${plan.color} 
                      text-white mb-6 shadow-lg transform transition-transform 
                      group-hover:scale-110 duration-300
                    `}>
                      {plan.icon}
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
                      {plan.name}
                    </h3>

                    <div className="flex items-end justify-center gap-1 mb-2">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        {plan.price}
                      </span>
                      <span className="text-lg font-medium text-gray-500 dark:text-gray-400 pb-1">
                        /month
                      </span>
                    </div>

                    {plan.description && (
                      <div className="text-center mb-4">
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                          {plan.description}
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator className="my-4" />

                  {/* Plan Progression Text */}
                  {plan.id === 'pro' && (
                    <div className="mb-6">
                      <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                        Everything in Standard Plan, plus
                      </p>
                    </div>
                  )}

                  {plan.id === 'standard' && (
                    <div className="mb-6">
                      <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                        Everything in Free Plan, plus
                      </p>
                    </div>
                  )}

                  {/* Features List */}
                  <div className="mb-8">
                    <ul className="space-y-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3 group/item">
                          <div className="flex-shrink-0 mt-0.5">
                            <CheckCircle className="h-5 w-5 text-emerald-500 transition-colors group-hover/item:text-emerald-600" />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={loading[plan.id] || user?.plan === plan.id || !plan.priceId}
                    className={`
                      w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 
                      flex items-center justify-center gap-2 text-sm tracking-wide
                      ${user?.plan === plan.id
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : !plan.priceId
                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : `bg-gradient-to-r ${plan.color} text-white 
                           hover:opacity-90 hover:scale-[1.02] hover:shadow-lg 
                           active:scale-[0.98] shadow-md
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`
                      }
                    `}
                  >
                    {loading[plan.id] ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : user?.plan === plan.id ? (
                      <>
                        <Check className="h-5 w-5" />
                        <span>Current Plan</span>
                      </>
                    ) : !plan.priceId ? (
                      <>
                        <span>Configuration Required</span>
                      </>
                    ) : (
                      <>
                        <span>Get {plan.name}</span>
                        <svg
                          className="h-4 w-4 transition-transform group-hover:translate-x-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Debug Info in Development */}
        
      </div>
    </div>
  );
}