import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Card } from '../ui/card'
import { Progress } from '../ui/progress'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { FileText, MessageCircle, Zap, Crown, Star, TrendingUp, AlertTriangle } from 'lucide-react'

const UsageDashboard = ({ onClose }) => {
  const { user, usage, getUsagePercentages, getRemainingLimits, PLAN_LIMITS } = useAuth()

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

  const percentages = getUsagePercentages()
  const remaining = getRemainingLimits()
  const currentLimits = PLAN_LIMITS[user.plan.toLowerCase()]

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
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
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
        <div className="space-y-4">
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
        </div>

        {/* Usage Statistics */}
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Current Usage</h4>
          
          {/* Documents Usage */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-900 dark:text-white">Documents</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {usage.documents.used} / {currentLimits.doc_limit}
                </span>
                <div className="text-xs text-gray-500">
                  {remaining.documents} remaining
                </div>
              </div>
            </div>
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
          </div>

          {/* Chat Usage */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-gray-900 dark:text-white">Chat Messages</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {usage.chats.used} / {currentLimits.chat_limit}
                </span>
                <div className="text-xs text-gray-500">
                  {remaining.chats} remaining
                </div>
              </div>
            </div>
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
          </div>

          {/* Token Usage */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-gray-900 dark:text-white">AI Tokens</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {usage.tokens.used.toLocaleString()} / {currentLimits.token_limit.toLocaleString()}
                </span>
                <div className="text-xs text-gray-500">
                  {remaining.tokens.toLocaleString()} remaining
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
                <div>1 document</div>
                <div>3 chats</div>
                <div>3K tokens</div>
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Star className="h-4 w-4 text-purple-500" />
                <span className="font-medium">Standard</span>
              </div>
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <div>50 documents</div>
                <div>100 chats</div>
                <div>100K tokens</div>
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">Pro</span>
              </div>
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <div>120 documents</div>
                <div>350 chats</div>
                <div>350K tokens</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {user.plan === 'free' && (
            <Button className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
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