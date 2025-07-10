import React from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Brain, Upload, FileText, Home, MessageCircle, Settings, HelpCircle, Sparkles, Activity } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

function ModernSidebar({ onNewDocument, currentDocument, onHome }) {
  return (
    <div className="w-72 bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-800 border-r border-slate-200 dark:border-gray-700 h-full flex flex-col shadow-xl">
      {/* Modern Logo Section */}
      <div className="p-6 border-b border-slate-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Brain className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            <Sparkles className="h-4 w-4 text-purple-500 absolute -top-1 -right-1" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              DigestGPT
            </h1>
            <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">
              AI Document Analysis
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 p-4 space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider px-3">
            Navigation
          </p>
          
          <Button 
            onClick={onHome}
            variant="ghost" 
            className="w-full justify-start gap-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>

          <Button 
            onClick={onNewDocument}
            className="w-full justify-start gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-500 dark:hover:to-blue-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <Upload className="h-4 w-4" />
            New Analysis
            <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
              AI
            </Badge>
          </Button>
        </div>

        <Separator className="my-4" />

        {/* Current Document Section */}
        {currentDocument && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider px-3">
              Active Document
            </p>
            
            <Card className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 border-emerald-200 dark:border-gray-600">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-gray-100 truncate">
                    {currentDocument}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        Active
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700 dark:border-emerald-600 dark:text-emerald-300">
                      <MessageCircle className="h-2.5 w-2.5 mr-1" />
                      Chat Ready
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        <Separator className="my-4" />

        {/* Quick Actions */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider px-3">
            Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs h-auto py-3 flex flex-col gap-1 hover:bg-slate-50 dark:hover:bg-gray-700"
            >
              <Brain className="h-4 w-4" />
              Analyze
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs h-auto py-3 flex flex-col gap-1 hover:bg-slate-50 dark:hover:bg-gray-700"
            >
              <MessageCircle className="h-4 w-4" />
              Chat
            </Button>
          </div>
        </div>
      </div>

      {/* Modern Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50 space-y-2">
        <ThemeToggle />
        
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            className="flex-1 justify-start gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700"
          >
            <Settings className="h-3.5 w-3.5" />
            <span className="text-xs">Settings</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="flex-1 justify-start gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span className="text-xs">Help</span>
          </Button>
        </div>
        
        <div className="text-center pt-2 border-t border-slate-200 dark:border-gray-700">
          <p className="text-xs text-slate-400 dark:text-gray-500">
            Powered by <span className="font-medium text-blue-600 dark:text-blue-400">Claude AI</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ModernSidebar 