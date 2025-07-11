import React, { useState } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Brain, Upload, FileText, Home, MessageCircle, Settings, HelpCircle, Sparkles, Activity, X } from 'lucide-react'
import SettingsPanel from './SettingsPanel'

function ModernSidebar({ onNewDocument, currentDocument, onHome, onClose, isDemoMode = false, bypassAPI = false }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  
  return (
    <div className="w-64 sm:w-72 lg:w-64 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-700 h-full flex flex-col shadow-xl lg:shadow-none">
      {/* Modern Logo Section */}
              <div className="p-3 sm:p-4 border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-black/90 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
              <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-purple-600 dark:text-purple-400 absolute -top-0.5 -right-0.5" />
            </div>
            <div>
                              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                DocuChat
              </h1>
                              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                {isDemoMode ? 'Demo Mode - No API Usage' : bypassAPI ? 'Preview Mode - No API Usage' : 'AI Document Analysis'}
              </p>
            </div>
          </div>
          
          {/* Mobile Close Button */}
          {onClose && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClose}
              className="lg:hidden p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Demo/Preview Mode Banner */}
        {(isDemoMode || bypassAPI) && (
          <div className={`mt-2 p-2 border rounded-lg ${
            isDemoMode 
              ? 'bg-orange-100/80 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700'
              : 'bg-green-100/80 dark:bg-green-900/30 border-green-300 dark:border-green-700'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                isDemoMode ? 'bg-orange-500 dark:bg-orange-400' : 'bg-green-500 dark:bg-green-400'
              }`}></div>
              <p className={`text-xs font-medium ${
                isDemoMode 
                  ? 'text-orange-700 dark:text-orange-300' 
                  : 'text-green-700 dark:text-green-300'
              }`}>
                {isDemoMode ? 'Demo Mode Active - Interface Preview' : 'Preview Mode - Real Interface, No API Usage'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Section */}
      <div className="flex-1 p-2 sm:p-3 space-y-2 sm:space-y-3 overflow-y-auto">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
            Navigation
          </p>
          
          <Button 
            onClick={() => {
              onHome()
              onClose?.()
            }}
            variant="ghost" 
            className="w-full justify-start gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 h-8 py-2 text-sm"
          >
            <Home className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Dashboard</span>
          </Button>

          <Button 
            onClick={() => {
              onNewDocument()
              onClose?.()
            }}
            className="w-full justify-start gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 h-8 py-2 text-sm"
          >
            <Upload className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="flex-1 text-left">New Analysis</span>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5">
              AI
            </Badge>
          </Button>
        </div>

        <Separator className="my-2 sm:my-3 bg-gray-200 dark:bg-gray-700" />

        {/* Current Document Section */}
        {currentDocument && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
              {isDemoMode ? 'Demo Document' : bypassAPI ? 'Preview Document' : 'Active Document'}
            </p>
            
            <Card className={`p-2.5 sm:p-3 border-gray-600 ${
              isDemoMode 
                ? 'bg-gradient-to-r from-orange-900/40 to-yellow-900/40' 
                : bypassAPI
                ? 'bg-gradient-to-r from-green-900/40 to-emerald-900/40'
                : 'bg-gradient-to-r from-emerald-900/40 to-teal-900/40'
            }`}>
              <div className="flex items-start gap-2">
                <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                  isDemoMode 
                    ? 'bg-orange-800/60' 
                    : bypassAPI
                    ? 'bg-green-800/60'
                    : 'bg-emerald-800/60'
                }`}>
                  <FileText className={`h-3.5 w-3.5 ${
                    isDemoMode 
                      ? 'text-orange-300' 
                      : bypassAPI
                      ? 'text-green-300'
                      : 'text-emerald-300'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {currentDocument}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Activity className={`h-2.5 w-2.5 flex-shrink-0 ${
                        isDemoMode 
                          ? 'text-orange-400 animate-pulse' 
                          : bypassAPI
                          ? 'text-green-400 animate-pulse'
                          : 'text-emerald-400 animate-pulse'
                      }`} />
                      <span className={`text-xs font-medium ${
                        isDemoMode 
                          ? 'text-orange-300' 
                          : bypassAPI
                          ? 'text-green-300'
                          : 'text-emerald-300'
                      }`}>
                        {isDemoMode ? 'Demo' : bypassAPI ? 'Preview' : 'Active'}
                      </span>
                    </div>
                    <Badge variant="outline" className={`text-xs px-1.5 py-0.5 ${
                      isDemoMode 
                        ? 'border-orange-600 text-orange-300' 
                        : bypassAPI
                        ? 'border-green-600 text-green-300'
                        : 'border-emerald-600 text-emerald-300'
                    }`}>
                      <MessageCircle className="h-2 w-2 mr-1" />
                      {isDemoMode ? 'Preview' : bypassAPI ? 'No API' : 'Chat Ready'}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        <Separator className="my-2 sm:my-3 bg-gray-200 dark:bg-gray-700" />

        {/* Quick Actions */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
            Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs h-auto py-2 flex flex-col gap-1 hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white touch-manipulation"
            >
              <Brain className="h-3.5 w-3.5" />
              <span>Analyze</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs h-auto py-2 flex flex-col gap-1 hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white touch-manipulation"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>Chat</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Modern Footer */}
      <div className="p-2 sm:p-3 border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-black/50 space-y-1.5">        
        <div className="flex gap-1.5">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            className="flex-1 justify-start gap-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 h-7 py-1.5 touch-manipulation text-xs"
          >
            <Settings className="h-3 w-3 flex-shrink-0" />
            <span>Settings</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="flex-1 justify-start gap-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 h-7 py-1.5 touch-manipulation text-xs"
          >
            <HelpCircle className="h-3 w-3 flex-shrink-0" />
            <span>Help</span>
          </Button>
        </div>
        
        <div className=" pt-1.5 border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {isDemoMode ? (
              <>Demo Preview - <span className="font-medium text-orange-400">No API Usage</span></>
            ) : bypassAPI ? (
              <>Interface Preview - <span className="font-medium text-green-400">No API Usage</span></>
            ) : (
              <></>
            )}
          </p>
        </div>
      </div>
      
      {/* Settings Panel */}
      <SettingsPanel 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  )
}

export default ModernSidebar 