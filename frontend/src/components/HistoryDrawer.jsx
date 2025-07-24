import React, { useState } from 'react'
import { X, FileText, FolderOpen, MessageCircle, Clock, ChevronRight, ChevronDown } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card } from './ui/card'

function HistoryDrawer({ 
  isOpen, 
  onClose, 
  historicalDocuments = [], 
  collections = [], 
  currentDocumentId = null,
  currentCollectionId = null,
  isLoadingHistory = false,
  onSelectHistoricalDocument = () => {},
  onSelectCollection = () => {},
}) {
  const [activeTab, setActiveTab] = useState('documents') // 'documents', 'collections'
  const [expandedCollections, setExpandedCollections] = useState(new Set())

  // Show all documents and collections in history (don't filter out active ones)
  const filteredDocuments = historicalDocuments
  const filteredCollections = collections

  // Toggle collection expansion
  const toggleCollectionExpansion = (collectionId) => {
    const isCurrentlyExpanded = expandedCollections.has(collectionId);
    const newExpanded = isCurrentlyExpanded ? new Set() : new Set([collectionId]);
    setExpandedCollections(newExpanded);
  };

  // Get documents for a collection
  const getCollectionDocuments = (collectionId) => {
    const collection = collections.find(c => c.id === collectionId);
    const docs = collection?.documents || [];
    console.log(`Collection ${collectionId} has ${docs.length} documents:`, docs);
    return docs;
  };

  // Find which collection a document belongs to
  const findCollectionForDocument = (docId) => {
    for (const collection of collections) {
      if (collection.documents && collection.documents.some(doc => doc.id === docId)) {
        return collection;
      }
    }
    return null;
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'No date'
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    return date.toLocaleDateString()
  }

  // Group documents by date
  const groupDocumentsByDate = (docs) => {
    const groups = {}
    docs.forEach(doc => {
      const dateStr = formatDate(doc.uploaded_at)
      if (!groups[dateStr]) groups[dateStr] = []
      groups[dateStr].push(doc)
    })
    return groups
  }

  const groupedDocuments = groupDocumentsByDate(filteredDocuments)
  const dateGroups = Object.keys(groupedDocuments)

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed top-0 left-0 h-full w-96 bg-white dark:bg-[#121212] shadow-2xl transform transition-transform duration-300 z-50 flex flex-col ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Document History</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {filteredDocuments.length === 0 && filteredCollections.length === 0
                ? 'Loading 0 documents, 0 collections'
                : `Loaded ${filteredDocuments.length} documents, ${filteredCollections.length} collections`}
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-2 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <Button
            variant={activeTab === 'documents' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('documents')}
            className="flex-1 h-8 text-xs"
          >
            Documents
          </Button>
          <Button
            variant={activeTab === 'collections' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('collections')}
            className="flex-1 h-8 text-xs"
          >
            Collections
          </Button>
        </div>

        {/* Content - Fixed scrolling area */}
        <div className="flex-1 overflow-y-auto history-drawer-scroll">
          <div className="p-4 space-y-4">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading documents and collections.</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">This may take a while if there are multiple collections.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Collections Section */}
                {activeTab === 'collections' && filteredCollections.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Collections
                    </h3>
                    {filteredCollections.map(collection => {
                      const collectionDocuments = collection.documents || [];
                      const isExpanded = expandedCollections.has(collection.id)
                      
                      return (
                        <div key={collection.id} className="space-y-2">
                          <Card
                            onClick={() => toggleCollectionExpansion(collection.id)}
                            className={`cursor-pointer p-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200 ${collection.id === currentCollectionId ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                <FolderOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {collection.name}
                                  </p>
                                  {collection.id === currentCollectionId && <Badge variant="secondary" className="text-xs">Active</Badge>}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {collection.document_count} document{collection.document_count !== 1 ? 's' : ''}
                                  </span>
                                  <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCollectionExpansion(collection.id);
                                }}
                                className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-400" />
                                )}
                              </Button>
                            </div>
                          </Card>
                          
                          {/* Expanded Documents */}
                          {isExpanded && collectionDocuments.length > 0 && (
                            <div className="ml-6 space-y-2">
                              {collectionDocuments.map(doc => (
                                <Card
                                  key={doc.id}
                                  onClick={() => onSelectHistoricalDocument(doc.id, doc, collection)}
                                  className={`p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200 border-l-2 border-purple-200 dark:border-purple-700 ${doc.id === currentDocumentId ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                >
                                  <div className="flex items-start gap-2">
                                    <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                      <FileText className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                        {doc.filename}
                                      </p>
                                      {doc.summary && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                                          {doc.summary}
                                        </p>
                                      )}
                                    </div>
                                    <ChevronRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                  </div>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Documents Section */}
                {activeTab === 'documents' && filteredDocuments.length > 0 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {filteredDocuments.map(doc => (
                        <Card
                          key={doc.id}
                          onClick={() => {
                            const belongsToCollection = findCollectionForDocument(doc.id);
                            onSelectHistoricalDocument(doc.id, doc, belongsToCollection);
                          }}
                          className={`p-3 cursor-pointer hover:bg-[#121212] dark:hover:bg-[#1f1f1f] dark:bg-[#121212] transition-colors duration-200 ${doc.id === currentDocumentId ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-[#121212]">
                              <FileText className="h-4 w-4 text-blue-600 dark:text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {doc.filename}
                              </p>
                              {doc.summary && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                                  {doc.summary}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                {doc.word_count && (
                                  <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-[#121212] dark:bg-[#1f1f1f]">
                                    {doc.word_count} words
                                  </Badge>
                                )}
                                {doc.analysis_method && (
                                  <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-[#121212] dark:bg-[#1f1f1f]">
                                    {doc.analysis_method}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {filteredDocuments.length === 0 && filteredCollections.length === 0 && (
                  <div className="text-center py-12">
                    <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <Clock className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      No history available
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Your document history will appear here
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .history-drawer-scroll::-webkit-scrollbar {
          width: 8px;
        }

        .history-drawer-scroll::-webkit-scrollbar-track {
          background: var(--background);
        }

        .history-drawer-scroll::-webkit-scrollbar-thumb {
          background-color: hsl(0, 0%, 70%);
          border-radius: 6px;
          border: 3px solid var(--background);
        }

        .dark .history-drawer-scroll::-webkit-scrollbar-thumb {
          background-color: hsl(0, 0%, 25%);
        }

        .history-drawer-scroll::-webkit-scrollbar-thumb:hover {
          background-color: hsl(0, 0%, 60%);
        }

        .dark .history-drawer-scroll::-webkit-scrollbar-thumb:hover {
          background-color: hsl(0, 0%, 35%);
        }
      `}</style>
    </>
  )
}

export default HistoryDrawer