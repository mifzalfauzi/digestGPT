import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Brain, Upload, FileText, Home, MessageCircle, Settings, HelpCircle, Sparkles, Activity, X, Menu, PanelLeftClose, ChevronDown, LayoutDashboard, Crown, Star, Zap, TrendingUp, PanelTopClose, PanelLeftIcon, Clock, MessageSquare, History } from 'lucide-react'
import SettingsPanel from './SettingsPanel'
import UsageDashboard from './dashboard/UsageDashboard'

function ModernSidebar({
  onNewDocument,
  currentDocument,
  onHome,
  onClose,
  isDemoMode = false,
  bypassAPI = false,
  collapsed = false,
  onToggleCollapse,
  onCasualChat,
  // Multi-document props
  documents = [],
  selectedDocumentId = null,
  onSelectDocument = () => { },
  onRemoveDocument = () => { },
  // Collection props
  collections = [],
  historicalCollections = [], // Add this prop
  expandedCollections = new Set(),
  onToggleCollectionExpansion = () => { },
  onRemoveCollection = () => { },
  // History drawer
  onOpenHistory = () => { }
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isUsageDashboardOpen, setIsUsageDashboardOpen] = useState(false)
  const navigate = useNavigate()
  const { user, usage, getUsagePercentages } = useAuth()

  const planIcons = {
    free: <Zap className="h-4 w-4" />,
    standard: <Star className="h-4 w-4" />,
    pro: <Crown className="h-4 w-4" />
  }

  const planColors = {
    free: 'bg-black',
    standard: 'bg-black',
    pro: 'bg-[#000000]'
  }



  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'No activity'
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="w-full bg-white dark:bg-[#121212] h-full flex flex-col shadow-xl lg:shadow-none transition-all duration-300">
      {/* Modern Logo Section */}
      <div className="mt-4 sm:px-4 border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-[#121212] backdrop-blur-sm ">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${collapsed ? 'justify-center w-full' : 'gap-2'}`}>
            <div className="relative">
              {/* <Brain className={`${collapsed ? 'h-6 w-6' : 'h-6 w-6 sm:h-8 sm:w-8'} text-blue-600 dark:text-blue-400`} />
              <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-purple-600 dark:text-purple-400 absolute -top-0.5 -right-0.5" /> */}
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-center">
                  drop
                  <span className="text-blue-400">2</span>
                  chat
                  <span className="text-red-500">*</span>
                </h1>

                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {isDemoMode ? 'Demo Mode - No API Usage' : bypassAPI ? 'Preview Mode - No API Usage' : ''}
                </p>
              </div>

            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Collapse Toggle Button - Desktop only */}
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className={`hidden lg:flex p-4 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white ${collapsed ? 'w-full justify-center' : ''}`}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <Menu className="h-4 w-4" /> : <PanelLeftIcon className="h-4 w-4" />}
              </Button>
            )}

            {/* Mobile Close Button */}
            {onClose && !collapsed && (
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
        </div>

        {/* Demo/Preview Mode Banner */}
        {(isDemoMode || bypassAPI) && !collapsed && (
          <div className={`mt-2 p-2 border rounded-lg ${isDemoMode
            ? 'bg-orange-100/80 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700'
            : 'bg-green-100/80 dark:bg-green-900/30 border-green-300 dark:border-green-700'
            }`}>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDemoMode ? 'bg-orange-500 dark:bg-orange-400' : 'bg-green-500 dark:bg-green-400'
                }`}></div>
              <p className={`text-xs font-medium ${isDemoMode
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
      <div className="flex-1  sm:p-3 space-y-2 sm:space-y-3 overflow-y-auto">
        <div className="space-y-3">
          {!collapsed && (
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
              {/* Navigation */}
            </p>
          )}

          {/* <Button 
            onClick={() => {
              navigate('/dashboard')
              onClose?.()
            }}
            variant="ghost" 
            className={`w-full text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 h-8 py-2 text-sm ${
              collapsed ? 'justify-center px-0' : 'justify-start gap-2'
            }`}
            title={collapsed ? 'Dashboard' : ''}
          >
            <LayoutDashboard className="h-3.5 w-3.5 flex-shrink-0" />
            {!collapsed && <span>Dashboard</span>}
          </Button> */}

          <Button
            onClick={() => {
              onNewDocument()
              onClose?.()
            }}
            className={`w-full bg-black hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 h-8 py-2 text-sm ${collapsed ? 'justify-center px-0' : 'justify-start gap-2'
              }`}
            title={collapsed ? 'New Analysis' : ''}
          >
            <Upload className="h-3.5 w-3.5 flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">New Analysis</span>
                <Badge variant="secondary" className="bg-gray-800 text-white text-xs px-1.5 py-0.5">
                  AI
                </Badge>
              </>
            )}
          </Button>

          <Button
            onClick={() => {
              onCasualChat()
              onClose?.()
            }}
            variant="ghost"
            className={`w-full text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 h-8 py-2 text-sm ${collapsed ? 'justify-center px-0' : 'justify-start gap-2'
              }`}
            title={collapsed ? 'Chat' : ''}
          >
            <MessageCircle className="h-3.5 w-3.5 flex-shrink-0" />
            {!collapsed && <span>Normal Chat</span>}
          </Button>

          <Button
            onClick={() => {
              if (onOpenHistory) {
                onOpenHistory()
                onClose?.()
              }
            }}
            variant="ghost"
            className={`w-full text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 h-8 py-2 text-sm ${collapsed ? 'justify-center px-0' : 'justify-start gap-2'
              }`}
            title={collapsed ? 'History' : ''}
          >
            <History className="h-3.5 w-3.5 flex-shrink-0" />
            {!collapsed && <span>Past Documents</span>}
          </Button>
        </div>

        {/* User Plan & Upgrade Section */}
        {user && user.plan === 'free' && !collapsed && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
              Your Plan
            </p>

            <Card className="p-3 ">
              <div className="flex items-center justify-between mb-2 dark:border-[#121212]">
                <div className="flex items-center gap-2">
                  {planIcons[user.plan]}
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                    {user.plan.toUpperCase()} PLAN
                  </span>
                </div>
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 text-xs">
                  Current
                </Badge>
              </div>

              {usage && (
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Documents</span>
                    <span className="font-medium text-blue-700 dark:text-blue-300">
                      {usage.documents.used}/1
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Chats</span>
                    <span className="font-medium text-blue-700 dark:text-blue-300">
                      {usage.chats.used}/3
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Tokens</span>
                    <span className="font-medium text-blue-700 dark:text-blue-300">
                      {usage.tokens.used}/3K
                    </span>
                  </div>
                </div>
              )}

              <Button
                onClick={() => setIsUsageDashboardOpen(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white h-8 text-xs"
              >
                <Star className="h-3 w-3 mr-1" />
                Upgrade Plan
              </Button>
            </Card>
          </div>
        )}

        {/* Non-free users: Show plan info */}
        {user && user.plan !== 'free' && !collapsed && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
              Your Plan
            </p>

            <Card className={`p-3 border border-gray-200 dark:border-gray-700 bg-gradient-to-r ${planColors[user.plan]}/10`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {planIcons[user.plan]}
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {user.plan.toUpperCase()}
                  </span>
                </div>
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 text-xs">
                  Active
                </Badge>
              </div>

              <Button
                onClick={() => setIsUsageDashboardOpen(true)}
                variant="outline"
                className="w-full bg-black h-8 text-xs text-white"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                View Usage
              </Button>
            </Card>
          </div>
        )}

        {selectedDocumentId && (
  <div className="space-y-2">
    {(() => {
      const selectedDoc = documents.find(doc => doc.id === selectedDocumentId);
      if (!selectedDoc) return null;

      if (!selectedDoc.collectionId) {
        // Individual document
        return (
          <>
            {!collapsed && (
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
                Active Document
              </p>
            )}
            <div className="space-y-1">
              <div
                className={`${collapsed ? 'p-2' : 'p-2.5 sm:p-3'} rounded-lg cursor-pointer transition-all duration-200 group bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 border border-blue-200 dark:border-blue-700`}
              >
                <div className={`flex items-start ${collapsed ? 'justify-center' : 'gap-2'}`}>
                  <div className={`${collapsed ? 'p-1' : 'p-1.5'} rounded-lg flex-shrink-0 bg-blue-200 dark:bg-blue-800`} title={collapsed ? selectedDoc.filename : ''}>
                    <FileText className={`${collapsed ? 'h-3 w-3' : 'h-3.5 w-3.5'} text-blue-700 dark:text-blue-300`} />
                  </div>
                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-blue-900 dark:text-blue-100">
                        {selectedDoc.filename}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className={`w-2 h-2 rounded-full ${selectedDoc.status === 'completed' ? 'bg-green-500' :
                          selectedDoc.status === 'analyzing' ? 'bg-yellow-500 animate-pulse' :
                          selectedDoc.status === 'uploading' ? 'bg-blue-500 animate-pulse' :
                          selectedDoc.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                        }`} />
                        <span className="text-xs text-blue-700 dark:text-blue-300">
                          {selectedDoc.status === 'completed' ? 'Ready' :
                           selectedDoc.status === 'analyzing' ? 'Analyzing...' :
                           selectedDoc.status === 'uploading' ? 'Uploading...' :
                           selectedDoc.status === 'error' ? 'Error' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        );
      } else {
        // Document in collection
        const activeCollection = collections.find(c => c.id === selectedDoc.collectionId) || historicalCollections.find(c => c.id === selectedDoc.collectionId);
        if (!activeCollection) return null;

        const collectionDocuments = documents.filter(doc => doc.collectionId === activeCollection.id);
        const completedCount = collectionDocuments.filter(doc => doc.status === 'completed').length
        const isExpanded = true; // Force expand for active

        return (
          <>
            {!collapsed && (
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
                Active Collection
              </p>
            )}
            <div className="space-y-1 max-h-64 overflow-y-auto">
              <div className="space-y-1">
                {/* Collection Header */}
                <div
                  onClick={() => onToggleCollectionExpansion(activeCollection.id)}
                  className={`${collapsed ? 'p-2' : 'p-2.5 sm:p-3'} rounded-lg cursor-pointer transition-all duration-200 group bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-700 `}
                >
                  <div className={`flex items-start ${collapsed ? 'justify-center' : 'gap-2'}`}>
                    <div className={`${collapsed ? 'p-1' : 'p-1.5'} rounded-lg flex-shrink-0 bg-purple-200 dark:bg-purple-800`} title={collapsed ? activeCollection.name : ''}>
                      <FileText className={`${collapsed ? 'h-3 w-3' : 'h-3.5 w-3.5'} text-purple-700 dark:text-purple-300`} />
                    </div>
                    {!collapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-purple-900 dark:text-purple-100 truncate">
                            {activeCollection.name}
                          </p>
                          <div className="flex items-center gap-1">
                            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 text-xs px-1.5 py-0.5">
                              {collectionDocuments.length} docs
                            </Badge>
                            <ChevronDown
                              className={`h-3 w-3 text-purple-600 dark:text-purple-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className={`w-2 h-2 rounded-full ${completedCount === collectionDocuments.length ? 'bg-green-500' :
                            completedCount > 0 ? 'bg-yellow-500' : 'bg-blue-500 animate-pulse'
                          }`} />
                          <span className="text-xs text-purple-700 dark:text-purple-300">
                            {completedCount === collectionDocuments.length ? 'All Ready' :
                             completedCount > 0 ? `${completedCount}/${collectionDocuments.length} Ready` :
                             'Analyzing...'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Collection Documents */}
                {isExpanded && !collapsed && (
                  <div className="ml-4 space-y-1">
                    {collectionDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => onSelectDocument(doc.id)}
                        className={`p-2 rounded-lg cursor-pointer transition-all duration-200 group ${selectedDocumentId === doc.id
                          ? 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 border border-blue-200 dark:border-blue-700'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`p-1 rounded-lg flex-shrink-0 ${selectedDocumentId === doc.id
                            ? 'bg-blue-200 dark:bg-blue-800'
                            : 'bg-gray-200 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40'
                          }`}>
                            <FileText className={`h-3 w-3 ${selectedDocumentId === doc.id
                              ? 'text-blue-700 dark:text-blue-300'
                              : 'text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${selectedDocumentId === doc.id
                              ? 'text-blue-900 dark:text-blue-100'
                              : 'text-gray-900 dark:text-white'
                            }`}>
                              {doc.filename}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <div className={`w-2 h-2 rounded-full ${doc.status === 'completed' ? 'bg-green-500' :
                                doc.status === 'analyzing' ? 'bg-yellow-500 animate-pulse' :
                                doc.status === 'uploading' ? 'bg-blue-500 animate-pulse' :
                                doc.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                              }`} />
                              <span className={`text-xs ${selectedDocumentId === doc.id
                                ? 'text-blue-700 dark:text-blue-300'
                                : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                {doc.status === 'completed' ? 'Ready' :
                                 doc.status === 'analyzing' ? 'Analyzing...' :
                                 doc.status === 'uploading' ? 'Uploading...' :
                                 doc.status === 'error' ? 'Error' : 'Pending'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        );
      }
    })()}
  </div>
)}


      </div>

      {/* Modern Footer */}
      <div className="p-2 sm:p-3 border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#121212] space-y-1.5">
        <div className={`flex ${collapsed ? 'flex-col' : ''} gap-1.5`}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            className={`text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 h-7 py-1.5 touch-manipulation text-xs ${collapsed ? 'justify-center w-full' : 'flex-1 justify-start gap-1.5'
              }`}
            title={collapsed ? 'Settings' : ''}
          >
            <Settings className="h-3 w-3 flex-shrink-0" />
            {!collapsed && <span>Settings</span>}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 h-7 py-1.5 touch-manipulation text-xs ${collapsed ? 'justify-center w-full' : 'flex-1 justify-start gap-1.5'
              }`}
            title={collapsed ? 'Help' : ''}
          >
            <HelpCircle className="h-3 w-3 flex-shrink-0" />
            {!collapsed && <span>Help</span>}
          </Button>
        </div>

        {!collapsed && (
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
        )}
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Usage Dashboard Modal */}
      {isUsageDashboardOpen && (
        <UsageDashboard
          onClose={() => setIsUsageDashboardOpen(false)}
        />
      )}
    </div>
  )
}

export default ModernSidebar 