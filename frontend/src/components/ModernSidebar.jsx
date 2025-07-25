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
  onOpenHistory = () => { },
  // Historical document selection
  selectedHistoricalCollection = null,
  historicalDocuments = [],
  onSelectHistoricalDocument = () => { },
  onClearHistoricalCollection = () => { },
  // Chat loading state
  isChatLoadingHistory = false
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

  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false)

  useEffect(() => {
    if (isChatLoadingHistory) {
      setShowLoadingOverlay(true)
    } else {
      const timeout = setTimeout(() => setShowLoadingOverlay(false), 1400) // 1100ms delay
      return () => clearTimeout(timeout)
    }
  }, [isChatLoadingHistory])

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
      <div className="flex-1 p-2 sm:p-3 space-y-2 sm:space-y-3 overflow-y-auto">
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
              // Clear all collection and document states
              onClearHistoricalCollection()
              onNewDocument()
              // Close mobile sidebar with slight delay to ensure state is updated
              if (onClose) {
                if (window.innerWidth < 1024) {
                  setTimeout(() => onClose(), 150)
                } else {
                  onClose()
                }
              }
            }}
            className={`w-full bg-black hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 h-8 py-2 text-sm touch-manipulation ${collapsed ? 'justify-center px-0' : 'justify-start gap-2'
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
              // Close mobile sidebar with proper delay
              if (onClose) {
                if (window.innerWidth < 1024) {
                  setTimeout(() => onClose(), 150)
                } else {
                  onClose()
                }
              }
            }}
            variant="ghost"
            className={`w-full text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 h-8 py-2 text-sm touch-manipulation ${collapsed ? 'justify-center px-0' : 'justify-start gap-2'
              }`}
            title={collapsed ? 'Chat' : ''}
          >
            <MessageCircle className="h-3.5 w-3.5 flex-shrink-0" />
            {!collapsed && <span>Normal Chat</span>}
          </Button>

          <Button
            onClick={() => {
              // Call onOpenHistory first, before closing the sidebar
              if (onOpenHistory) {
                console.log('Opening history drawer')
                onOpenHistory()
              }
              // Close mobile sidebar with proper delay
              if (onClose) {
                if (window.innerWidth < 1024) {
                  setTimeout(() => onClose(), 150)
                } else {
                  onClose()
                }
              }
            }}
            variant="ghost"
            className={`w-full text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 h-8 py-2 text-sm touch-manipulation ${collapsed ? 'justify-center px-0' : 'justify-start gap-2'}`}
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

        {/* Chat Loading Indicator - Subtle and brief */}
        {/* {isChatLoadingHistory && !collapsed && (
          <div className="px-2 py-1 mb-1">
            <div className="flex items-center gap-2 px-2 py-1 bg-blue-50/30 dark:bg-blue-900/5 rounded-md">
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-blue-400 dark:bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-blue-400 dark:bg-blue-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                <div className="w-1 h-1 bg-blue-400 dark:bg-blue-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
              </div>
              <span className="text-xs text-blue-500/70 dark:text-blue-400/70 font-light">Loading history...</span>
            </div>
          </div>
        )} */}

        {/* Active Document/Collection Section - Responsive */}
        {(selectedDocumentId || selectedHistoricalCollection) && (
          <div 
            className={`space-y-2 relative ${isChatLoadingHistory ? 'pointer-events-none' : ''}`}
            onClickCapture={(e) => {
              if (isChatLoadingHistory) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                console.log('Collection section interactions blocked during chat history loading');
                return false;
              }
            }}
          >
            {(() => {
              // Handle historical collection display
              if (selectedHistoricalCollection && historicalDocuments.length > 0) {
                const collectionDocuments = historicalDocuments;
                const completedCount = collectionDocuments.length; // Historical docs are always completed
                const isExpanded = true; // Always expand historical collections

                return (
                  <>
                    {!collapsed && (
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
                        Historical Collection
                      </p>
                    )}
                    <div className="space-y-1 max-h-48 sm:max-h-72 overflow-y-auto">
                      <div className="space-y-1">
                        {/* Collection Header - Mobile Responsive */}
                        <div 
                          className={`${collapsed ? 'p-2' : 'p-2 sm:p-2.5 lg:p-3'} rounded-lg transition-all duration-200 group bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-700 shadow-sm touch-manipulation select-none`}
                          style={{ minHeight: collapsed ? 'auto' : '44px' }} // Ensure minimum touch target size
                        >
                          <div className={`flex items-start ${collapsed ? 'justify-center' : 'gap-2 sm:gap-3'}`}>
                            <div className={`${collapsed ? 'p-1' : 'p-1.5'} rounded-lg flex-shrink-0 bg-purple-200 dark:bg-purple-800 transition-colors duration-200`} title={collapsed ? selectedHistoricalCollection.name : ''}>
                              <FileText className={`${collapsed ? 'h-3 w-3' : 'h-3.5 w-3.5'} text-purple-700 dark:text-purple-300`} />
                            </div>
                            {!collapsed && (
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs sm:text-sm font-medium text-purple-900 dark:text-purple-100 truncate">
                                    {selectedHistoricalCollection.name}
                                  </p>
                                  <div className="flex items-center gap-1">
                                    <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 text-xs px-1.5 py-0.5">
                                      {collectionDocuments.length} docs
                                    </Badge>
                                    <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200 text-xs px-1.5 py-0.5">
                                      History
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <div className="w-2 h-2 rounded-full bg-green-500" />
                                  <span className="text-xs text-purple-700 dark:text-purple-300">
                                    All Ready
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Collection Documents - Always Visible on Mobile */}
                        {isExpanded && !collapsed && (
                          <div 
                            className={`ml-2 sm:ml-4 space-y-1 relative ${isChatLoadingHistory ? 'pointer-events-none select-none' : ''}`}
                            onClickCapture={(e) => {
                              if (isChatLoadingHistory) {
                                e.preventDefault();
                                e.stopPropagation();
                                e.stopImmediatePropagation();
                                console.log('All document interactions blocked during chat history loading');
                                return false;
                              }
                            }}
                            style={isChatLoadingHistory ? { pointerEvents: 'none !important' } : {}}
                          >
                            {/* Loading overlay for documents during chat history loading */}
                            {showLoadingOverlay  && (
                              <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 z-50 rounded-lg flex items-center justify-center" style={{ pointerEvents: 'auto !important' }}>
                                <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-800 rounded-full shadow-lg border">
                                  <div className="flex space-x-1">
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                                  </div>
                                  <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">Loading chat history...</span>
                                </div>
                              </div>
                            )}
                            {collectionDocuments.map((doc) => (
                              <div
                                key={doc.id}
                                onClick={(e) => {
                                  // Immediate check and block if loading
                                  if (isChatLoadingHistory) {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    e.stopImmediatePropagation()
                                    console.log('Document switching completely blocked during chat history loading')
                                    return false
                                  }
                                  
                                  e.preventDefault()
                                  e.stopPropagation()
                                  
                                  console.log('Selecting historical document:', doc.id, doc.filename)
                                  onSelectHistoricalDocument(doc.id, doc, selectedHistoricalCollection)
                                  // Close mobile sidebar after selection with proper delay
                                  if (onClose && window.innerWidth < 1024) {
                                    setTimeout(() => onClose(), 200)
                                  }
                                }}
                                className={`p-2 sm:p-2.5 rounded-lg transition-all duration-200 group touch-manipulation select-none ${
                                  isChatLoadingHistory 
                                    ? 'cursor-not-allowed opacity-20 bg-gray-200 dark:bg-gray-700/70 pointer-events-none' 
                                    : 'cursor-pointer'
                                } ${selectedDocumentId === doc.id && !isChatLoadingHistory
                                  ? 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 border border-blue-200 dark:border-blue-700 shadow-sm'
                                  : isChatLoadingHistory 
                                    ? 'border border-gray-400 dark:border-gray-500'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent active:bg-blue-50 dark:active:bg-blue-900/20 active:scale-[0.98]'
                                  }`}
                                style={{ 
                                  minHeight: '44px',
                                  pointerEvents: isChatLoadingHistory ? 'none !important' : 'auto',
                                  userSelect: isChatLoadingHistory ? 'none' : 'auto'
                                }} // Ensure minimum touch target size and disable pointer events when loading
                              >
                                <div className="flex items-start gap-2 sm:gap-3">
                                  <div className={`p-1 sm:p-1.5 rounded-lg flex-shrink-0 transition-colors duration-200 ${selectedDocumentId === doc.id
                                    ? 'bg-blue-200 dark:bg-blue-800'
                                    : 'bg-gray-200 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 group-active:bg-blue-200 dark:group-active:bg-blue-800'
                                    }`}>
                                    <FileText className={`h-3 w-3 sm:h-3.5 sm:w-3.5 transition-colors duration-200 ${selectedDocumentId === doc.id
                                      ? 'text-blue-700 dark:text-blue-300'
                                      : 'text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                                      }`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-xs sm:text-sm font-medium truncate transition-colors duration-200 ${selectedDocumentId === doc.id
                                      ? 'text-blue-900 dark:text-blue-100'
                                      : 'text-gray-900 dark:text-white'
                                      }`}>
                                      {doc.filename}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <div className="w-2 h-2 rounded-full bg-green-500" />
                                      <span className={`text-xs transition-colors duration-200 ${selectedDocumentId === doc.id
                                        ? 'text-blue-700 dark:text-blue-300'
                                        : 'text-gray-500 dark:text-gray-400'
                                        }`}>
                                        Ready
                                      </span>
                                    </div>
                                  </div>
                                  {/* Active indicator for mobile */}
                                  {selectedDocumentId === doc.id && (
                                    <div className="flex-shrink-0">
                                      <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                                    </div>
                                  )}
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

              // Handle current document display
              const selectedDoc = documents.find(doc => doc.id === selectedDocumentId);
              if (!selectedDoc) return null;

              if (!selectedDoc.collectionId) {
                // Individual document - Mobile Responsive
                return (
                  <>
                    {!collapsed && (
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
                        Active Document
                      </p>
                    )}
                    <div className="space-y-1">
                      <div 
                        className={`${collapsed ? 'p-2' : 'p-2 sm:p-2.5 lg:p-3'} rounded-lg cursor-pointer transition-all duration-200 group bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 border border-blue-200 dark:border-blue-700 shadow-sm touch-manipulation select-none`}
                        style={{ minHeight: collapsed ? 'auto' : '44px' }} // Ensure minimum touch target size
                      >
                        <div className={`flex items-start ${collapsed ? 'justify-center' : 'gap-2 sm:gap-3'}`}>
                          <div className={`${collapsed ? 'p-1' : 'p-1.5'} rounded-lg flex-shrink-0 bg-blue-200 dark:bg-blue-800 transition-colors duration-200`} title={collapsed ? selectedDoc.filename : ''}>
                            <FileText className={`${collapsed ? 'h-3 w-3' : 'h-3.5 w-3.5'} text-blue-700 dark:text-blue-300`} />
                          </div>
                          {!collapsed && (
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium truncate text-blue-900 dark:text-blue-100">
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
                          {/* Active indicator for mobile */}
                          {!collapsed && (
                            <div className="flex-shrink-0">
                              <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                );
              } else {
                // Document in collection - Mobile Responsive
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
                    <div className="space-y-1 max-h-48 sm:max-h-72 overflow-y-auto">
                      <div className="space-y-1">
                        {/* Collection Header - Mobile Responsive */}
                        <div
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            console.log('Toggling collection expansion:', activeCollection.id)
                            onToggleCollectionExpansion(activeCollection.id)
                          }}
                          className={`${collapsed ? 'p-2' : 'p-2 sm:p-2.5 lg:p-3'} rounded-lg cursor-pointer transition-all duration-200 group bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-700 touch-manipulation select-none active:scale-[0.98]`}
                          style={{ minHeight: '44px' }} // Ensure minimum touch target size
                        >
                          <div className={`flex items-start ${collapsed ? 'justify-center' : 'gap-2'}`}>
                            <div className={`${collapsed ? 'p-1' : 'p-1.5'} rounded-lg flex-shrink-0 bg-purple-200 dark:bg-purple-800`} title={collapsed ? activeCollection.name : ''}>
                              <FileText className={`${collapsed ? 'h-3 w-3' : 'h-3.5 w-3.5'} text-purple-700 dark:text-purple-300`} />
                            </div>
                            {!collapsed && (
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs sm:text-sm font-medium text-purple-900 dark:text-purple-100 truncate">
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

                        {/* Collection Documents - Always Visible, Mobile Responsive */}
                        {isExpanded && !collapsed && (
                          <div 
                            className={`ml-2 sm:ml-4 space-y-1 relative ${isChatLoadingHistory ? 'pointer-events-none select-none' : ''}`}
                            onClickCapture={(e) => {
                              if (isChatLoadingHistory) {
                                e.preventDefault();
                                e.stopPropagation();
                                e.stopImmediatePropagation();
                                console.log('All document interactions blocked during chat history loading');
                                return false;
                              }
                            }}
                            style={isChatLoadingHistory ? { pointerEvents: 'none !important' } : {}}
                          >
                            {/* Loading overlay for documents during chat history loading */}
                            {isChatLoadingHistory && (
                              <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 z-50 rounded-lg flex items-center justify-center" style={{ pointerEvents: 'auto !important' }}>
                                <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-800 rounded-full shadow-lg border">
                                  <div className="flex space-x-1">
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                                  </div>
                                  <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">Loading chat history...</span>
                                </div>
                              </div>
                            )}
                            {collectionDocuments.map((doc) => (
                              <div
                                key={doc.id}
                                onClick={(e) => {
                                  // Immediate check and block if loading
                                  if (isChatLoadingHistory) {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    e.stopImmediatePropagation()
                                    console.log('Document switching completely blocked during chat history loading')
                                    return false
                                  }
                                  
                                  e.preventDefault()
                                  e.stopPropagation()
                                  
                                  console.log('Selecting current session document:', doc.id, doc.filename)
                                  onSelectDocument(doc.id)
                                  // Close mobile sidebar after selection with proper delay
                                  if (onClose && window.innerWidth < 1024) {
                                    setTimeout(() => onClose(), 200)
                                  }
                                }}
                                className={`p-2 sm:p-2.5 rounded-lg transition-all duration-200 group touch-manipulation select-none ${
                                  isChatLoadingHistory 
                                    ? 'cursor-not-allowed opacity-20 bg-gray-200 dark:bg-gray-700/70 pointer-events-none' 
                                    : 'cursor-pointer'
                                } ${selectedDocumentId === doc.id && !isChatLoadingHistory
                                  ? 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 border border-blue-200 dark:border-blue-700 shadow-sm'
                                  : isChatLoadingHistory 
                                    ? 'border border-gray-400 dark:border-gray-500'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent active:bg-blue-50 dark:active:bg-blue-900/20 active:scale-[0.98]'
                                  }`}
                                style={{ 
                                  minHeight: '44px',
                                  pointerEvents: isChatLoadingHistory ? 'none !important' : 'auto',
                                  userSelect: isChatLoadingHistory ? 'none' : 'auto'
                                }} // Ensure minimum touch target size and disable pointer events when loading
                              >
                                <div className="flex items-start gap-2 sm:gap-3">
                                  <div className={`p-1 sm:p-1.5 rounded-lg flex-shrink-0 transition-colors duration-200 ${selectedDocumentId === doc.id
                                    ? 'bg-blue-200 dark:bg-blue-800'
                                    : 'bg-gray-200 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 group-active:bg-blue-200 dark:group-active:bg-blue-800'
                                    }`}>
                                    <FileText className={`h-3 w-3 sm:h-3.5 sm:w-3.5 transition-colors duration-200 ${selectedDocumentId === doc.id
                                      ? 'text-blue-700 dark:text-blue-300'
                                      : 'text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                                      }`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-xs sm:text-sm font-medium truncate transition-colors duration-200 ${selectedDocumentId === doc.id
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
                                      <span className={`text-xs transition-colors duration-200 ${selectedDocumentId === doc.id
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
                                  {/* Active indicator for mobile */}
                                  {selectedDocumentId === doc.id && (
                                    <div className="flex-shrink-0">
                                      <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                                    </div>
                                  )}
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