import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Card } from '../ui/card'
import { Progress } from '../ui/progress'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { FileText, MessageCircle, Zap, Crown, Star, TrendingUp, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const UsageDashboard = ({ onClose }) => {
  const navigate = useNavigate()
  const { user, usage } = useAuth()

  if (!user || !usage) {
    return (
      <div className="p-6 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    )
  }

  // Utility functions for usage calculations
  const getUsagePercentages = () => {
    return {
      documents: usage?.documents ? Math.min(100, Math.round((usage.documents.used / usage.documents.limit) * 100)) : 0,
      chats: usage?.chats ? Math.min(100, Math.round((usage.chats.used / usage.chats.limit) * 100)) : 0,
      tokens: usage?.tokens ? Math.min(100, Math.round((usage.tokens.used / usage.tokens.limit) * 100)) : 0
    }
  }

  const getCappedUsage = () => {
    return {
      documents: {
        used: usage?.documents ? Math.min(usage.documents.used, usage.documents.limit) : 0,
        limit: usage?.documents?.limit || 0
      },
      chats: {
        used: usage?.chats ? Math.min(usage.chats.used, usage.chats.limit) : 0,
        limit: usage?.chats?.limit || 0
      },
      tokens: {
        used: usage?.tokens ? Math.min(usage.tokens.used, usage.tokens.limit) : 0,
        limit: usage?.tokens?.limit || 0
      }
    }
  }

  const getRemainingLimits = () => {
    const capped = getCappedUsage()
    return {
      documents: Math.max(0, capped.documents.limit - capped.documents.used),
      chats: Math.max(0, capped.chats.limit - capped.chats.used),
      tokens: Math.max(0, capped.tokens.limit - capped.tokens.used)
    }
  }

  const percentages = getUsagePercentages()
  const remaining = getRemainingLimits()
  const cappedUsage = getCappedUsage()

  const planColors = {
    free: 'bg-blue-100 text-blue-800 border-blue-200',
    standard: 'bg-purple-100 text-purple-800 border-purple-200',
    pro: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }

  const planIcons = {
    free: <Zap className="h-4 w-4" />,
    standard: <Star className="h-4 w-4" />,
    pro: <Crown className="h-4 w-4" />
  }

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 dark:bg-[#121212]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Usage Dashboard</h2>
              <p className="text-gray-600 dark:text-gray-400">Monitor your plan and usage</p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </Button>
        </div>

        {/* User Info & Plan */}
        {/* <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{user.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
            </div>
            <Badge className={`px-3 py-1 ${planColors[user.plan.toLowerCase()]}`}>
              <div className="flex items-center gap-1">
                {planIcons[user.plan.toLowerCase()]}
                <span className="font-semibold">{user.plan.toUpperCase()} PLAN</span>
              </div>
            </Badge>
          </div>
        </div> */}

        {/* Usage Statistics */}
        <div className="space-y-6">
        <div className="flex items-center justify-between">
    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
      Current Usage
    </h4>

    <Badge className={`px-3 py-1 ${planColors[user.plan.toLowerCase()]}`}>
      <div className="flex items-center gap-1">
        {planIcons[user.plan.toLowerCase()]}
        <span className="font-semibold">{user.plan.toUpperCase()} PLAN</span>
      </div>
    </Badge>
  </div>
          
          {/* Token Usage - Primary Limit */}
          <div className="space-y-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-gray-900 dark:text-white">AI Tokens</span>
                <Badge variant="outline" className="text-xs border-purple-300 text-purple-700 dark:text-purple-300">
                  Enforced Limit
                </Badge>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {(cappedUsage.tokens.used || 0).toLocaleString()} / {(cappedUsage.tokens.limit || 0).toLocaleString()}
                </span>
                <div className="text-xs text-gray-500">
                  {(remaining.tokens || 0).toLocaleString()} remaining
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <Progress 
                value={percentages.tokens} 
                className="h-3"
                indicatorClassName={getProgressColor(percentages.tokens)}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{percentages.tokens}% used</span>
                {percentages.tokens >= 90 && (
                  <span className="text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Limit almost reached
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Documents Usage - Plan Dependent */}
          <div className={`space-y-3 ${user.plan === 'free' ? 'p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-900 dark:text-white">Documents Uploaded</span>
                {user.plan === 'free' ? (
                  <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 dark:text-blue-300">
                    Enforced Limit
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs border-gray-300 text-gray-600 dark:text-gray-400">
                    Tracking Only
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {user.plan === 'free' 
                    ? `${cappedUsage.documents.used || 0} / ${cappedUsage.documents.limit || 0}`
                    : `${user.usage?.documents?.used || 0}`
                  }
                </span>
                <div className="text-xs text-gray-500">
                  {user.plan === 'free' 
                    ? `${remaining.documents || 0} remaining`
                    : 'This month'
                  }
                </div>
              </div>
            </div>
            {user.plan === 'free' && (
              <div className="space-y-1">
                <Progress 
                  value={percentages.documents} 
                  className="h-3"
                  indicatorClassName={getProgressColor(percentages.documents)}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{percentages.documents}% used</span>
                  {percentages.documents >= 90 && (
                    <span className="text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Limit almost reached
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Chat Usage - Plan Dependent */}
          <div className={`space-y-3 ${user.plan === 'free' ? 'p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-gray-900 dark:text-white">Chat Messages Sent</span>
                {user.plan === 'free' ? (
                  <Badge variant="outline" className="text-xs border-green-300 text-green-700 dark:text-green-300">
                    Enforced Limit
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs border-gray-300 text-gray-600 dark:text-gray-400">
                    Tracking Only
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {user.plan === 'free' 
                    ? `${cappedUsage.chats.used || 0} / ${cappedUsage.chats.limit || 0}`
                    : `${user.usage?.chats?.used || 0}`
                  }
                </span>
                <div className="text-xs text-gray-500">
                  {user.plan === 'free' 
                    ? `${remaining.chats || 0} remaining`
                    : 'This month'
                  }
                </div>
              </div>
            </div>
            {user.plan === 'free' && (
              <div className="space-y-1">
                <Progress 
                  value={percentages.chats} 
                  className="h-3"
                  indicatorClassName={getProgressColor(percentages.chats)}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{percentages.chats}% used</span>
                  {percentages.chats >= 90 && (
                    <span className="text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Limit almost reached
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Usage Information */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">i</span>
              </div>
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Usage Policy</p>
              {user.plan === 'free' ? (
                <p><strong>Free tier:</strong> Document uploads (1/month), chat messages (3/month), and token usage (3K/month) all enforce limits. <strong>Standard/Pro:</strong> Only token limits are enforced.</p>
              ) : (
                <p><strong>Your {user.plan} plan:</strong> Only <strong>token usage</strong> will block AI features when limits are reached. Document and chat counts are tracked for informational purposes but won't prevent uploads or conversations.</p>
              )}
            </div>
          </div>
        </div>

        {/* Plan Comparison */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
          <h5 className="font-semibold text-gray-900 dark:text-white">Plan Comparison</h5>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Free</span>
              </div>
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <div className="font-semibold text-blue-600">1 document/month</div>
                <div className="font-semibold text-blue-600">3 chats/month</div>
                <div className="font-semibold text-blue-600">3K tokens/month</div>
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Star className="h-4 w-4 text-purple-500" />
                <span className="font-medium">Standard</span>
              </div>
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <div className="font-semibold text-purple-600">100K tokens/month</div>
                <div className="text-gray-500">Unlimited documents</div>
                <div className="text-gray-500">Unlimited chats</div>
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">Pro</span>
              </div>
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <div className="font-semibold text-yellow-600">350K tokens/month</div>
                <div className="text-gray-500">Unlimited documents</div>
                <div className="text-gray-500">Unlimited chats</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {user.plan === 'free' && (
            <Button onClick={() => navigate('/upgrade')} className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
              <Star className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          )}
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default UsageDashboard 