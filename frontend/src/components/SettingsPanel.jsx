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
  Archive,
  Trash2,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import axios from 'axios'
import DocumentCache from '../utils/documentCache' // Make sure to import your DocumentCache

function SettingsPanel({ isOpen, onClose, onDataDeleted }) {
  const { theme, setTheme } = useTheme()
  const { user, usage } = useAuth()
  
  // Delete confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deleteSuccess, setDeleteSuccess] = useState('')
  const [deletionPreview, setDeletionPreview] = useState(null)

  const calculatePercentage = (current, total) => {
    return Math.min(Math.round((current / total) * 100), 100)
  }

  const handleThemeChange = (isDark) => {
    setTheme(isDark ? 'dark' : 'light')
  }

  // Fetch deletion preview when delete modal opens
  const fetchDeletionPreview = async () => {
    try {
      const response = await axios.get('http://localhost:8000/documents/deletion-preview', {
        withCredentials: true
      })
      setDeletionPreview(response.data.preview)
    } catch (error) {
      console.error('Error fetching deletion preview:', error)
      setDeleteError('Failed to load deletion preview')
    }
  }

  // Handle delete all documents
  const handleDeleteAllDocuments = async () => {
    setIsDeleting(true)
    setDeleteError('')
    setDeleteSuccess('')

    try {
      console.log('Starting delete all documents...')
      
      const response = await axios.post('http://localhost:8000/documents/delete-all', {}, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true
      })

      console.log('Delete response:', response.data)

      // Clear all localStorage cache
      DocumentCache.clearCache()
      console.log('Cleared all cache')

      // Show success message
      setDeleteSuccess(response.data.message)
      
      // Close confirmation modal
      setShowDeleteConfirm(false)
      
      // Call callback to refresh parent component if provided
      if (onDataDeleted) {
        onDataDeleted()
      }

      // Close settings panel after a delay
      setTimeout(() => {
        onClose()
      }, 2000)

    } catch (error) {
      console.error('Error deleting all documents:', error)
      
      let errorMessage = 'Failed to delete documents'
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please login again.'
      }
      
      setDeleteError(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  // Open delete confirmation modal
  const openDeleteConfirmation = () => {
    setShowDeleteConfirm(true)
    setDeleteError('')
    setDeleteSuccess('')
    fetchDeletionPreview()
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
    <>
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
            
            {/* Success/Error Messages */}
            {deleteSuccess && (
              <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-sm font-medium">{deleteSuccess}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {deleteError && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertTriangle className="h-4 w-4" />
                    <p className="text-sm font-medium">{deleteError}</p>
                  </div>
                </CardContent>
              </Card>
            )}

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

            <Separator className="my-6" />

            {/* Delete All Documents Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-slate-600 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Delete All Data
                </h3>
              </div>

              <Card className="border border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50/50 to-white/50 dark:from-red-950/20 dark:to-gray-900/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-red-400 to-red-500 rounded-lg">
                        <Trash2 className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          Delete All Documents
                        </p>
                        <p className="text-sm text-slate-600 dark:text-gray-400">
                          This will permanently delete all your documents, collections, and chat history.
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="destructive"
                      className="bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700"
                      onClick={openDeleteConfirmation}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Deleting...
                        </>
                      ) : (
                        'Delete All'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                    Delete All Data
                  </CardTitle>
                  <p className="text-sm text-slate-600 dark:text-gray-400">
                    This action cannot be undone
                  </p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300 mb-3 font-medium">
                  This will permanently delete:
                </p>
                
                {deletionPreview ? (
                  <div className="space-y-2 text-sm text-red-600 dark:text-red-400">
                    <div className="flex items-center justify-between">
                      <span>Documents:</span>
                      <span className="font-medium">{deletionPreview.documents_to_delete}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Chat messages:</span>
                      <span className="font-medium">{deletionPreview.chat_messages_to_delete}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Collections:</span>
                      <span className="font-medium">{deletionPreview.collections_to_delete}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Storage files:</span>
                      <span className="font-medium">{deletionPreview.storage_files_to_delete}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 text-sm text-red-600 dark:text-red-400">
                    <div>• All your documents</div>
                    <div>• All chat history</div>
                    <div>• All collections</div>
                    <div>• All uploaded files</div>
                  </div>
                )}
              </div>

              {deleteError && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded">
                  <p className="text-sm text-red-700 dark:text-red-300">{deleteError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAllDocuments}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Everything'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

export default SettingsPanel