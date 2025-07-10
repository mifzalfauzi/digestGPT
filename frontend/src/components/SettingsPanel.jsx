import React, { useState } from 'react'
import { useTheme } from './ThemeProvider'
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
  X 
} from 'lucide-react'

function SettingsPanel({ isOpen, onClose }) {
  const { theme, setTheme } = useTheme()

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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-0 shadow-2xl">
        <CardHeader className="border-b border-slate-200 dark:border-gray-700 bg-gradient-to-r from-slate-50 to-white dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                  Settings
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
                  Customize your DigestGPT experience
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

        <CardContent className="p-6 space-y-6">
          {/* Theme Settings */}
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

            {/* <div className="grid grid-cols-2 gap-3">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => setTheme('light')}
                className={`flex items-center gap-2 justify-start p-3 h-auto ${
                  theme === 'light' 
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white' 
                    : 'hover:bg-slate-100 dark:hover:bg-gray-700'
                }`}
              >
                <Sun className="h-4 w-4" />
                <div className="text-left">
                  <p className="font-medium">Light</p>
                  <p className="text-xs opacity-80">Clean & bright</p>
                </div>
              </Button>
              
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-2 justify-start p-3 h-auto ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-r from-slate-700 to-gray-800 text-white' 
                    : 'hover:bg-slate-100 dark:hover:bg-gray-700'
                }`}
              >
                <Moon className="h-4 w-4" />
                <div className="text-left">
                  <p className="font-medium">Dark</p>
                  <p className="text-xs opacity-80">Easy on eyes</p>
                </div>
              </Button>
            </div> */}
          </div>

          <Separator className="my-6" />

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
        </CardContent>
      </Card>
    </div>
  )
}

export default SettingsPanel 