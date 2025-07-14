import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Brain, Upload, FileText, Home, MessageCircle, Settings, HelpCircle, Sparkles, Activity, X, Menu, PanelLeftClose, ChevronDown, AlertTriangle } from 'lucide-react'
import SettingsPanel from './SettingsPanel'

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
  onSelectDocument = () => {},
  onRemoveDocument = () => {},
  // Collection props
  collections = [],
  expandedCollections = new Set(),
  onToggleCollectionExpansion = () => {},
  onRemoveCollection = () => {}
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [errorModalOpen, setErrorModalOpen] = useState(false)
  const [errorDocument, setErrorDocument] = useState(null)
  const navigate = useNavigate()
  
  const handleDocumentClick = (doc) => {
    if (doc.status === 'error') {
      setErrorDocument(doc)
      setErrorModalOpen(true)
    } else {
      onSelectDocument(doc.id)
    }
  }
  
  return (
    <div className="w-full bg-white dark:bg-gray-900 h-full flex flex-col shadow-xl lg:shadow-none transition-all duration-300">
      {/* Modern Logo Section */}
      <div className="p-3 sm:p-4 border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${collapsed ? 'justify-center w-full' : 'gap-2'}`}>
            <div className="relative">
              <Brain className={`${collapsed ? 'h-6 w-6' : 'h-6 w-6 sm:h-8 sm:w-8'} text-blue-600 dark:text-blue-400`} />
              <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-purple-600 dark:text-purple-400 absolute -top-0.5 -right-0.5" />
            </div>
            {!collapsed && (
            <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                DocuChat
              </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {isDemoMode ? 'Demo Mode - No API Usage' : bypassAPI ? 'Preview Mode - No API Usage' : 'AI Document Analysis'}
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
                className={`hidden lg:flex p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white ${collapsed ? 'w-full justify-center' : ''}`}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <Menu className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
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
          {!collapsed && (
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
            Navigation
          </p>
          )}
          
          <Button 
            onClick={() => {
              navigate('/')
              onClose?.()
            }}
            variant="ghost" 
            className={`w-full text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 h-8 py-2 text-sm ${
              collapsed ? 'justify-center px-0' : 'justify-start gap-2'
            }`}
            title={collapsed ? 'Home' : ''}
          >
            <Home className="h-3.5 w-3.5 flex-shrink-0" />
            {!collapsed && <span>Home</span>}
          </Button>

          <Button 
            onClick={() => {
              onNewDocument()
              onClose?.()
            }}
            className={`w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 h-8 py-2 text-sm ${
              collapsed ? 'justify-center px-0' : 'justify-start gap-2'
            }`}
            title={collapsed ? 'New Analysis' : ''}
          >
            <Upload className="h-3.5 w-3.5 flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">New Analysis</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5">
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
            className={`w-full text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 h-8 py-2 text-sm ${
              collapsed ? 'justify-center px-0' : 'justify-start gap-2'
            }`}
            title={collapsed ? 'Chat' : ''}
          >
            <MessageCircle className="h-3.5 w-3.5 flex-shrink-0" />
            {!collapsed && <span>Normal Chat</span>}
          </Button>
        </div>

        {/* Collections List */}
        {collections.length > 0 && (
          <div className="space-y-2">
            {!collapsed && (
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
                Collections ({collections.length})
              </p>
            )}
            
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {collections.map((collection) => {
                const isExpanded = expandedCollections.has(collection.id)
                const collectionDocuments = documents.filter(doc => doc.collectionId === collection.id)
                const completedCount = collectionDocuments.filter(doc => doc.status === 'completed').length
                
                return (
                  <div key={collection.id} className="space-y-1">
                    {/* Collection Header */}
                    <div
                      onClick={() => onToggleCollectionExpansion(collection.id)}
                      className={`${collapsed ? 'p-2' : 'p-2.5 sm:p-3'} rounded-lg cursor-pointer transition-all duration-200 group bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-700`}
                    >
                      <div className={`flex items-start ${collapsed ? 'justify-center' : 'gap-2'}`}>
                        <div className={`${collapsed ? 'p-1' : 'p-1.5'} rounded-lg flex-shrink-0 bg-purple-200 dark:bg-purple-800`} title={collapsed ? collection.name : ''}>
                          <FileText className={`${collapsed ? 'h-3 w-3' : 'h-3.5 w-3.5'} text-purple-700 dark:text-purple-300`} />
                </div>
                        {!collapsed && (
                <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-purple-900 dark:text-purple-100 truncate">
                                {collection.name}
                  </p>
                    <div className="flex items-center gap-1">
                                <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 text-xs px-1.5 py-0.5">
                                  {collectionDocuments.length} docs
                                </Badge>
                                <ChevronDown 
                                  className={`h-3 w-3 text-purple-600 dark:text-purple-400 transition-transform duration-200 ${
                                    isExpanded ? 'rotate-180' : ''
                                  }`} 
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <div className={`w-2 h-2 rounded-full ${
                                completedCount === collectionDocuments.length ? 'bg-green-500' :
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
                    
                    {/* Collection Documents (when expanded) */}
                    {isExpanded && !collapsed && (
                      <div className="ml-4 space-y-1">
                        {collectionDocuments.map((doc) => (
                          <div
                            key={doc.id}
                            onClick={() => handleDocumentClick(doc)}
                            className={`p-2 rounded-lg cursor-pointer transition-all duration-200 group ${
                              selectedDocumentId === doc.id
                                ? 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 border border-blue-200 dark:border-blue-700'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <div className={`p-1 rounded-lg flex-shrink-0 ${
                                selectedDocumentId === doc.id
                                  ? 'bg-blue-200 dark:bg-blue-800'
                                  : 'bg-gray-200 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40'
                              }`}>
                                <FileText className={`h-3 w-3 ${
                                  selectedDocumentId === doc.id
                                    ? 'text-blue-700 dark:text-blue-300'
                                    : 'text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                                }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${
                                  selectedDocumentId === doc.id
                                    ? 'text-blue-900 dark:text-blue-100'
                                    : 'text-gray-900 dark:text-white'
                                }`}>
                                  {doc.filename}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <div className={`w-2 h-2 rounded-full ${
                                    doc.status === 'completed' ? 'bg-green-500' :
                                    doc.status === 'analyzing' ? 'bg-yellow-500 animate-pulse' :
                                    doc.status === 'uploading' ? 'bg-blue-500 animate-pulse' :
                                    doc.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                                  }`} />
                                                            <span className={`text-xs ${
                            selectedDocumentId === doc.id
                              ? 'text-blue-700 dark:text-blue-300'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {doc.status === 'completed' ? 'Ready' :
                             doc.status === 'error' ? 'Error' :
                             doc.status === 'analyzing' ? 'Analyzing...' :
                             doc.status === 'uploading' ? 'Uploading...' : 'Pending'}
                          </span>
                                </div>
                  </div>
                </div>
              </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Individual Documents List (not in collections) */}
        {documents.filter(doc => !doc.collectionId).length > 0 && (
          <div className="space-y-2">
            {!collapsed && (
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
                Individual Documents ({documents.filter(doc => !doc.collectionId).length})
              </p>
            )}
            
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {documents.filter(doc => !doc.collectionId).map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleDocumentClick(doc)}
                  className={`${collapsed ? 'p-2' : 'p-2.5 sm:p-3'} rounded-lg cursor-pointer transition-all duration-200 group ${
                    selectedDocumentId === doc.id
                      ? 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 border border-blue-200 dark:border-blue-700'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
                  }`}
            >
                  <div className={`flex items-start ${collapsed ? 'justify-center' : 'gap-2'}`}>
                    <div className={`${collapsed ? 'p-1' : 'p-1.5'} rounded-lg flex-shrink-0 ${
                      selectedDocumentId === doc.id
                        ? 'bg-blue-200 dark:bg-blue-800'
                        : 'bg-gray-200 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40'
                    }`} title={collapsed ? doc.filename : ''}>
                      <FileText className={`${collapsed ? 'h-3 w-3' : 'h-3.5 w-3.5'} ${
                        selectedDocumentId === doc.id
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                      }`} />
                    </div>
                    {!collapsed && (
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          selectedDocumentId === doc.id
                            ? 'text-blue-900 dark:text-blue-100'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {doc.filename}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className={`w-2 h-2 rounded-full ${
                            doc.status === 'completed' ? 'bg-green-500' :
                            doc.status === 'analyzing' ? 'bg-yellow-500 animate-pulse' :
                            doc.status === 'uploading' ? 'bg-blue-500 animate-pulse' :
                            doc.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                          }`} />
                          <span className={`text-xs ${
                            selectedDocumentId === doc.id
                              ? 'text-blue-700 dark:text-blue-300'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {doc.status === 'completed' ? 'Ready' :
                             doc.status === 'error' ? 'Error' :
                             doc.status === 'analyzing' ? 'Analyzing...' :
                             doc.status === 'uploading' ? 'Uploading...' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
        )}


      </div>

      {/* Modern Footer */}
      <div className="p-2 sm:p-3 border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 space-y-1.5">        
        <div className={`flex ${collapsed ? 'flex-col' : ''} gap-1.5`}>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            className={`text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 h-7 py-1.5 touch-manipulation text-xs ${
              collapsed ? 'justify-center w-full' : 'flex-1 justify-start gap-1.5'
            }`}
            title={collapsed ? 'Settings' : ''}
          >
            <Settings className="h-3 w-3 flex-shrink-0" />
            {!collapsed && <span>Settings</span>}
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className={`text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 h-7 py-1.5 touch-manipulation text-xs ${
              collapsed ? 'justify-center w-full' : 'flex-1 justify-start gap-1.5'
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
      
      {/* Error Document Modal */}
      {errorModalOpen && errorDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Document Error
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Unable to process this file
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {errorDocument.filename}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  This file may be corrupted, unreadable, or in an unsupported format.
                </p>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <p>Possible reasons:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>File is corrupted or damaged</li>
                  <li>File format is not supported</li>
                  <li>File is password protected</li>
                  <li>File size is too large</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setErrorModalOpen(false)}
                className="flex-1"
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  setErrorModalOpen(false)
                  onRemoveDocument(errorDocument.id)
                }}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Remove File
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default ModernSidebar 