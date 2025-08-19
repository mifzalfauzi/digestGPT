import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Alert, AlertDescription } from './ui/alert'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { AlertTriangle, Crown, Star, Zap, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const UsageWarningBanner = ({ onDismiss, className = "" }) => {
  const navigate = useNavigate()
  const { user, getUsagePercentages } = useAuth()
  const BASE_URL = import.meta.env.VITE_API_BASE_URL
  if (!user) return null

  const percentages = getUsagePercentages()
  
  // Helper function to cap usage values at plan limits
  const getCappedUsageValue = (type) => {
    if (!user.usage?.[type]) return { used: 0, limit: 0 }
    return {
      used: Math.min(user.usage[type].used, user.usage[type].limit),
      limit: user.usage[type].limit
    }
  }
  
  // Free tier: show warnings for all limits (docs, chats, tokens)
  // Standard/Pro: only show warnings for tokens
  const warningItems = []
  
  // Free tier gets all warnings
  if (user.plan === 'free') {
    if (percentages.documents >= 80 && user.usage?.documents) {
      const cappedDocs = getCappedUsageValue('documents')
      warningItems.push({
        type: 'documents',
        percentage: Math.min(100, Math.round(percentages.documents)),
        label: 'Document uploads',
        used: cappedDocs.used,
        limit: cappedDocs.limit
      })
    }
    if (percentages.chats >= 80 && user.usage?.chats) {
      const cappedChats = getCappedUsageValue('chats')
      warningItems.push({
        type: 'chats',
        percentage: Math.min(100, Math.round(percentages.chats)),
        label: 'Chat interactions',
        used: cappedChats.used,
        limit: cappedChats.limit
      })
    }
  }
  
  // All plans show token warnings
  if (percentages.tokens >= 80 && user.usage?.tokens) {
    const cappedTokens = getCappedUsageValue('tokens')
    warningItems.push({
      type: 'tokens',
      percentage: Math.min(100, Math.round(percentages.tokens)),
      label: 'AI tokens',
      used: cappedTokens.used,
      limit: cappedTokens.limit
    })
  }

  // Don't show banner if no warnings
  if (warningItems.length === 0) return null

  // Determine alert level
  const hasMaxedOut = warningItems.some(item => item.percentage >= 100)
  const hasWarning = warningItems.some(item => item.percentage >= 80)

  const planIcons = {
    free: <Zap className="h-4 w-4" />,
    standard: <Star className="h-4 w-4" />,
    pro: <Crown className="h-4 w-4" />
  }

  const handleUpgrade = () => {
    navigate('/upgrade')
    if (onDismiss) onDismiss()
  }

  return (
    <Alert className={`border-2 ${hasMaxedOut 
      ? 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800' 
      : 'border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800'
    } ${className}`}>
      <AlertTriangle className={`h-4 w-4 ${hasMaxedOut ? 'text-red-600' : 'text-amber-600'}`} />
      <div className="flex items-start justify-between w-full">
        <div className="flex-1">
          <AlertDescription className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${hasMaxedOut ? 'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200'}`}>
                {hasMaxedOut ? 'Usage Limit Reached!' : 'Usage Warning'}
              </span>
              {/* <Badge 
                variant="outline" 
                className={`text-xs ${hasMaxedOut ? 'border-red-300 text-red-700' : 'border-amber-300 text-amber-700'}`}
              >
                {planIcons[user.plan]}
                <span className="ml-1 capitalize">{user.plan}</span>
              </Badge> */}
            </div>
            
            <div className="space-y-1 text-sm">
              {warningItems.map((item, index) => (
                <div key={item.type} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    item.percentage >= 100 ? 'bg-red-500' : 
                    item.percentage >= 90 ? 'bg-orange-500' : 'bg-amber-500'
                  }`} />
                  <span className={hasMaxedOut ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}>
                    <strong>{item.label}:</strong>  ({item.percentage}%) used
                  </span>
                </div>
              ))}
            </div>

            <div className={`text-xs ${hasMaxedOut ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {hasMaxedOut 
                ? (user.plan === 'free' 
                    ? 'You\'ve reached your limits. Upgrade to continue using AI features.'
                    : 'You cannot use AI features until you upgrade your plan or your token quota resets.'
                  )
                : (user.plan === 'free'
                    ? 'You\'re approaching your monthly usage limits.'
                    : 'You\'re approaching your monthly token limit.'
                  )
              }
            </div>
          </AlertDescription>
        </div>

        <div className="flex items-center gap-2 ml-4">
          {user.plan !== 'pro' && (
            <Button
              size="sm"
              onClick={handleUpgrade}
              className={`text-xs ${hasMaxedOut 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
            >
              Upgrade Plan
            </Button>
          )}
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className={`h-6 w-6 p-0 ${hasMaxedOut ? 'text-red-500 hover:text-red-700' : 'text-amber-500 hover:text-amber-700'}`}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </Alert>
  )
}

export default UsageWarningBanner