import React from 'react'
import { Button } from './ui/button'
import { Brain, Upload, FileText, Home, MessageCircle, Settings, HelpCircle } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

function Sidebar({ onNewDocument, currentDocument, onHome }) {
  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">DigestGPT</h1>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-2">
        <Button 
          onClick={onHome}
          variant="ghost" 
          className="w-full justify-start gap-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700"
        >
          <Home className="h-4 w-4" />
          Home
        </Button>

        <Button 
          onClick={onNewDocument}
          className="w-full justify-start gap-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white"
        >
          <Upload className="h-4 w-4" />
          New Document
        </Button>

        {currentDocument && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Current Document
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {currentDocument}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3 text-green-500 dark:text-green-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Ready to chat</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <ThemeToggle />
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700"
        >
          <HelpCircle className="h-4 w-4" />
          Help
        </Button>
      </div>
    </div>
  )
}

export default Sidebar 