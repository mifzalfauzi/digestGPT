// Create src/components/StripeCheckout.jsx
import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../contexts/AuthContext';
import { Crown, Star, Zap, Check, Loader2, CheckCircle } from 'lucide-react';
import { Separator } from './ui/separator';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function StripeCheckout() {
  const [loading, setLoading] = useState({});
  const { user } = useAuth();

  const plans = [
    {
      id: 'standard',
      name: 'Standard Plan',
      price: '$3.99',
      priceId: import.meta.env.VITE_STRIPE_PRICE_STANDARD, // Replace with actual price ID
      icon: <Star className="h-6 w-6" />,
      features: [
        'Priority support',
        'Get insights, risks and summaries from 50 documents',
        'Access to Elva* (powered by Claude 4 Sonnet) for 100 interactions',
        'Usage of 100k tokens per month'
      ],
      color: 'bg-background',
      description: 'Ideal for students, hobbyists, and casual users'
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: '$6.99',
      priceId: import.meta.env.VITE_STRIPE_PRICE_PRO, // Replace with actual price ID
      icon: <Crown className="h-6 w-6" />,
      features: [
        'Extra usage*',
        'Get insights, risks and summaries from 120 documents',
        'Access to Elva* (powered by Claude 4 Sonnet) for 350 interactions',
        'Usage of 350k tokens per month'
      ],
      color: 'bg-background',
      popular: false,
      description: 'Perfect for researchers and professionals'
    }
  ];

  const handleUpgrade = async (plan) => {
    try {
      setLoading(prev => ({ ...prev, [plan.id]: true }));

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

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { checkout_url } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = checkout_url;

    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to start upgrade process. Please try again.');
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
          return_url: `${window.location.origin}/dashboard`
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

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Upgrade Your Plan
          </p>
          {/* <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Unlock powerful AI document analysis with advanced features and priority support.
            </p> */}
        </div>

        <Separator className="my-4" />

        {/* Current Plan Info */}
        {user && (
          <div className=" rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Current Plan: {user.plan.toUpperCase()}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Signed in as {user.email}
                </p>
              </div>
              {/* {user.plan !== 'free' && (
                <button
                  onClick={handleManageSubscription}
                  disabled={loading.manage}
                  className="bg-white dark:bg-black border  hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  {loading.manage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Manage Subscription
                </button>
              )} */}
            </div>
          </div>
        )}

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.id} className="relative group">
              {/* Plan Description */}
              

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
                    <div className=" mb-6">
                      <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                        Everything in Standard Plan, plus
                      </p>
                    </div>
                  )}

                  {plan.id === 'standard' && (
                    <div className=" mb-6">
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
                    disabled={loading[plan.id] || user?.plan === plan.id}
                    className={`
              w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 
              flex items-center justify-center gap-2 text-sm tracking-wide
              ${user?.plan === plan.id
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : `
                  bg-gradient-to-r ${plan.color} text-white 
                  hover:opacity-90 hover:scale-[1.02] hover:shadow-lg 
                  active:scale-[0.98] shadow-md
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
                `
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
      </div>
    </div>
  );
}