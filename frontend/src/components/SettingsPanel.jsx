import React, { useState, useEffect } from 'react'
import { useTheme } from './ThemeProvider'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Switch } from './ui/switch'
import { Separator } from './ui/separator'
import { 
  Settings, 
  Monitor, 
  Sun, 
  Moon, 
  Bot, 
  Zap, 
  Shield, 
  Cpu,
  Globe,
  X,
  FileText,
  MessageCircle,
  Database,
  TrendingUp,
  Clock,
  Archive
} from 'lucide-react'

function SettingsPanel({ isOpen, onClose }) {
  const { theme, setTheme } = useTheme()
  const { user, usage } = useAuth()

  const calculatePercentage = (current, total) => {
    return Math.min(Math.round((current / total) * 100), 100)
  }

  const handleThemeChange = (isDark) => {
    setTheme(isDark ? 'dark' : 'light')
  }

  const modelInfo = {
    name: "Claude 4 Sonnet",
    provider: "Anthropic",
    version: "2025-05-14",
    capabilities: ["Document Analysis", "Natural Language", "Multi-modal", "Advanced Reasoning"],
    features: ["Enhanced Intelligence", "Context Awareness", "Latest Generation"]
  }

  if (!isOpen) return null

  // Show loading state if user data is not available
  if (!user || !usage) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-6 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[95vh] overflow-y-auto bg-white dark:bg-gray-900 border-0 shadow-2xl">
        <CardHeader className=" bg-white border-b border-slate-200 dark:border-gray-700 dark:bg-[#121212]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 dark:bg-[#121212] rounded-xl">
                <Settings className="h-5 w-5 dark:text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                  Settings
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
                  Customize your drop2chat* experience
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="hover:bg-slate-100 dark:hover:bg-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6 dark:bg-[#121212]">
         
          {/* <div className="space-y-4"> */}
            {/* <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-slate-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Usage Statistics
              </h3>
              <div className="flex-1 flex justify-end items-center gap-2">
                {user && (
                  <Badge variant="secondary" className={`text-xs ${
                    user.plan === 'free' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                    user.plan === 'standard' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                  }`}>
                    {user.plan.toUpperCase()}
                  </Badge>
                )}
              </div>
            </div> */}

            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> */}
     
              {/* <Card className="border border-slate-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <p className="text-xs text-slate-600 dark:text-gray-400">
                      Documents
                    </p>
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    {usage ? usage.documents.used : 0} / {currentLimits ? currentLimits.doc_limit : 0}
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ 
                        width: `${usage && currentLimits ? calculatePercentage(usage.documents.used, currentLimits.doc_limit) : 0}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                    {usage && currentLimits ? calculatePercentage(usage.documents.used, currentLimits.doc_limit) : 0}% of monthly limit
                  </p>
                </CardContent>
              </Card> */}

            
              {/* <Card className="border border-slate-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                    <p className="text-xs text-slate-600 dark:text-gray-400">
                      Chats
                    </p>
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    {usage ? usage.chats.used : 0} / {currentLimits ? currentLimits.chat_limit : 0}
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full" 
                      style={{ 
                        width: `${usage && currentLimits ? calculatePercentage(usage.chats.used, currentLimits.chat_limit) : 0}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                    {usage && currentLimits ? calculatePercentage(usage.chats.used, currentLimits.chat_limit) : 0}% of monthly limit
                  </p>
                </CardContent>
              </Card> */}

              {/* <Card className="border border-slate-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Zap className="h-5 w-5 text-purple-600" />
                    <p className="text-xs text-slate-600 dark:text-gray-400">
                      AI Tokens
                    </p>
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    {usage ? usage.tokens.used.toLocaleString() : 0} / {currentLimits ? currentLimits.token_limit.toLocaleString() : 0}
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div 
                      className="bg-purple-600 h-2.5 rounded-full" 
                      style={{ 
                        width: `${usage && currentLimits ? calculatePercentage(usage.tokens.used, currentLimits.token_limit) : 0}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                    {usage && currentLimits ? calculatePercentage(usage.tokens.used, currentLimits.token_limit) : 0}% of token limit
                  </p>
                </CardContent>
              </Card> */}
            {/* </div> */}

            {/* Usage Tips */}
            {/* <Card className="border border-slate-200 dark:border-gray-700 mt-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Usage Tips
                  </h4>
                </div>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    Optimize document uploads to save storage space
                  </li>
                  <li className="flex items-start gap-2">
                    <Archive className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                    Manage your monthly usage to avoid hitting limits
                  </li>
                </ul>
              </CardContent>
            </Card> */}
          {/* </div> */}
{/* 
          <Separator className="my-6" /> */}

          {/* AI Model Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-slate-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                AI Model
              </h3>
            </div>

            <Card className="border border-slate-200 dark:border-gray-700 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Anthropic Logo */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                      <svg 
                        className="w-7 h-7 text-white" 
                        viewBox="0 0 24 24" 
                        fill="currentColor"
                      >
                        <path d="M12 2L3 7v10c0 5.55 3.84 9.74 9 9.74s9-4.19 9-9.74V7l-9-5z"/>
                        <path d="M12 6.5L8.5 8.5v7l3.5 2 3.5-2v-7L12 6.5z" fill="white" fillOpacity="0.3"/>
                      </svg>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                          {modelInfo.name}
                        </h4>
                        <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
                          {modelInfo.version}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-gray-400">
                        by {modelInfo.provider}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          Capabilities
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {modelInfo.capabilities.map((capability, index) => (
                          <Badge 
                            key={index}
                            variant="secondary"
                            className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          >
                            {capability}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          Features
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {modelInfo.features.map((feature, index) => (
                          <Badge 
                            key={index}
                            variant="secondary"
                            className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          >
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-1">
                      <Cpu className="h-3 w-3 text-slate-500" />
                      <p className="text-xs font-medium text-slate-600 dark:text-gray-400">
                        Context
                      </p>
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      200K
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-1">
                      <Globe className="h-3 w-3 text-slate-500" />
                      <p className="text-xs font-medium text-slate-600 dark:text-gray-400">
                        Languages
                      </p>
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      100+
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-1">
                      <Zap className="h-3 w-3 text-slate-500" />
                      <p className="text-xs font-medium text-slate-600 dark:text-gray-400">
                        Speed
                      </p>
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      Fast
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator className="my-6" />

          {/* Appearance Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-slate-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Appearance
              </h3>
            </div>
            
            <Card className="border border-slate-200 dark:border-gray-700 bg-gradient-to-r from-slate-50/50 to-white/50 dark:from-gray-800/50 dark:to-gray-900/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg">
                      {theme === 'dark' ? (
                        <Moon className="h-4 w-4 text-white" />
                      ) : (
                        <Sun className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        Dark Mode
                      </p>
                      <p className="text-sm text-slate-600 dark:text-gray-400">
                        Switch between light and dark themes
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={theme === 'dark'}
                    onCheckedChange={handleThemeChange}
                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-600"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SettingsPanel 