"use client"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { useAuth } from "../contexts/AuthContext"
import ModernSidebar from "./ModernSidebar"
import ModernUploadInterface from "./ModernUploadInterface"
import ModernChatPanel from "./ModernChatPanel"
import EnhancedDocumentViewer from "./EnhancedDocumentViewer"
import UsageDashboard from "./dashboard/UsageDashboard"
import HistoryDrawer from "./HistoryDrawer"
import { Button } from "./ui/button"
import { Menu, X, MessageCircle, FileText, Eye, GripVertical, Sparkles, Zap, AlertTriangle, LogOut, TrendingUp } from "lucide-react"
import { Card, CardContent } from "./ui/card"
import { Alert, AlertDescription } from "./ui/alert"

function Assistant() {
  // Auth context
  const {
    user,
    logout,
    canUploadDocument,
    canSendChat,
    canUseTokens,
    refreshUserData,
    isAuthenticated
  } = useAuth()

  // Multi-document state
  const [documents, setDocuments] = useState([])
  const [selectedDocumentId, setSelectedDocumentId] = useState(null)
  const [uploadingDocuments, setUploadingDocuments] = useState([])

  // Document history state
  const [historicalDocuments, setHistoricalDocuments] = useState([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // File staging for upload (before analysis)
  const [stagedFiles, setStagedFiles] = useState([])

  // Legacy state for backward compatibility and single document operations
  const [file, setFile] = useState(null)
  const [textInput, setTextInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [inputMode, setInputMode] = useState("file") // 'file' or 'text'
  const [currentView, setCurrentView] = useState("upload") // 'upload', 'workspace', or 'casual-chat'
  const [chatSetInputMessage, setChatSetInputMessage] = useState(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [bypassAPI, setBypassAPI] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Usage dashboard state
  const [showUsageDashboard, setShowUsageDashboard] = useState(false)

  // History drawer state
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false)

  // Change state to historicalCollections
  const [historicalCollections, setHistoricalCollections] = useState([])

  // Load historical documents when component mounts
  useEffect(() => {
    if (isAuthenticated && user) {
      const loadAllHistoricalData = async () => {
        setIsLoadingHistory(true);
        try {
          // Load both documents and collections in parallel
          const [docsResponse, collectionsResponse] = await Promise.all([
            axios.get('http://localhost:8000/documents/', {
              headers: {
                'Authorization': `Bearer ${user?.token || localStorage.getItem('auth_token')}`
              },
              params: {
                skip: 0,
                limit: 50
              }
            }),
            axios.get('http://localhost:8000/collections/', {
              headers: { 'Authorization': `Bearer ${user?.token || localStorage.getItem('auth_token')}` },
              params: { skip: 0, limit: 50 }
            })
          ]);

          // Process documents
          if (docsResponse.data?.documents) {
            setHistoricalDocuments(docsResponse.data.documents);
          }

          // Process collections with their documents
          if (collectionsResponse.data) {
            const fullCollections = await Promise.all(collectionsResponse.data.map(async (col) => {
              try {
                const detailRes = await axios.get(`http://localhost:8000/collections/${col.id}`, {
                  headers: { 'Authorization': `Bearer ${user?.token || localStorage.getItem('auth_token')}` }
                });
                return { ...col, documents: detailRes.data.documents || [] };
              } catch (error) {
                console.error(`Error loading collection ${col.id}:`, error);
                return { ...col, documents: [] };
              }
            }));
            setHistoricalCollections(fullCollections);
            console.log('Loaded historical collections with docs:', fullCollections);
          }
        } catch (error) {
          console.error('Error loading historical data:', error);
          if (error.response?.status === 401) {
            logout();
          }
        } finally {
          setIsLoadingHistory(false);
        }
      };

      loadAllHistoricalData();
    }
  }, [isAuthenticated, user])



  // Function to load a historical document's full data
  const loadHistoricalDocument = async (documentId) => {
    if (!user?.token && !localStorage.getItem('auth_token')) return null

    try {
      const response = await axios.get(`http://localhost:8000/documents/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${user?.token || localStorage.getItem('auth_token')}`
        }
      })

      return response.data
    } catch (error) {
      console.error('Error loading historical document:', error)
      if (error.response?.status === 401) {
        logout()
      }
      throw error
    }
  }

  // Function to refresh historical documents and collections (can be called after new document upload)
  const refreshHistoricalDocuments = async () => {
    setIsLoadingHistory(true);
    try {
      // Load both documents and collections in parallel
      const [docsResponse, collectionsResponse] = await Promise.all([
        axios.get('http://localhost:8000/documents/', {
          headers: {
            'Authorization': `Bearer ${user?.token || localStorage.getItem('auth_token')}`
          },
          params: {
            skip: 0,
            limit: 50
          }
        }),
        axios.get('http://localhost:8000/collections/', {
          headers: { 'Authorization': `Bearer ${user?.token || localStorage.getItem('auth_token')}` },
          params: { skip: 0, limit: 50 }
        })
      ]);

      // Process documents
      if (docsResponse.data?.documents) {
        setHistoricalDocuments(docsResponse.data.documents);
      }

      // Process collections with their documents
      if (collectionsResponse.data) {
        const fullCollections = await Promise.all(collectionsResponse.data.map(async (col) => {
          try {
            const detailRes = await axios.get(`http://localhost:8000/collections/${col.id}`, {
              headers: { 'Authorization': `Bearer ${user?.token || localStorage.getItem('auth_token')}` }
            });
            return { ...col, documents: detailRes.data.documents || [] };
          } catch (error) {
            console.error(`Error loading collection ${col.id}:`, error);
            return { ...col, documents: [] };
          }
        }));
        setHistoricalCollections(fullCollections);
      }
    } catch (error) {
      console.error('Error refreshing historical data:', error);
      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Function to handle collection selection from history
  const selectCollectionFromHistory = async (collectionId) => {
    const collection = historicalCollections.find(c => c.id === collectionId)
    if (!collection) return

    // Load all documents in the collection
    const collectionDocuments = documents.filter(doc => doc.collectionId === collectionId)

    // If collection documents are already loaded, just select the first one
    if (collectionDocuments.length > 0) {
      setSelectedDocumentId(collectionDocuments[0].id)
      setCurrentView("workspace")
      setSidebarOpen(false)
      setActivePanel("chat")
      setIsHistoryDrawerOpen(false)
      return
    }

    // Otherwise load from historical documents
    const historicalCollectionDocs = historicalDocuments.filter(doc => doc.collection_id === collectionId)
    if (historicalCollectionDocs.length > 0) {
      // Load the first document in the collection
      await selectDocument(historicalCollectionDocs[0].id, historicalCollectionDocs[0])
      setIsHistoryDrawerOpen(false)
    }
  }


  // Computed values for selected document
  const selectedDocument = documents.find(doc => doc.id === selectedDocumentId) || null
  const currentDocument = selectedDocument?.filename || (isDemoMode ? "Demo Business Plan.pdf" : bypassAPI ? "Preview Document.pdf" : null)

  // Get the current collection ID if the selected document is part of a collection
  const currentCollectionId = selectedDocument?.collectionId || null

  // Helper function to ensure document has text data
  const ensureDocumentText = async (documentId) => {
    try {
      console.log('Fetching document text for ID:', documentId)
      const response = await axios.get(`http://localhost:8000/documents/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${user?.token || localStorage.getItem('auth_token')}`
        }
      })

      console.log('Backend response for document fetch:', response.data)

      updateDocument(selectedDocumentId, {
        results: {
          ...selectedDocument.results,
          ...response.data,
          document_text: response.data.document_text || response.data.text || response.data.analysis?.document_text
        }
      })

      console.log('Updated document with text data')
    } catch (error) {
      console.error('Error fetching document data:', error)
    }
  }

  // Auto-fetch document text if missing
  useEffect(() => {
    if (selectedDocument && selectedDocument.status === 'completed' &&
      selectedDocument.results && !selectedDocument.results.document_text) {
      console.log('Document missing text, fetching from backend...')

      // Try to get the document ID from various sources
      const docId = selectedDocument.documentId || selectedDocument.id || selectedDocument.results?.document_id

      if (docId) {
        console.log('Using document ID for fetch:', docId)
        ensureDocumentText(docId)
      } else {
        console.error('No valid document ID found for fetching text')
      }
    }
  }, [selectedDocument])

  // Hide initial load animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  const results = selectedDocument?.results || null
  const documentId = selectedDocument?.documentId || selectedDocument?.id || null
  const selectedDocumentFile = selectedDocument?.file || file

  // Ensure document text is always available by checking multiple sources
  const enhancedResults = results ? {
    ...results,
    document_text: results.document_text ||
      results.text ||
      (typeof results.analysis === 'object' ? results.analysis?.document_text : null) ||
      selectedDocument?.textContent ||
      null
  } : null

  // Check if selected document is ready for chat (completed or error status means it's "done")
  const selectedDocumentReady = selectedDocument && selectedDocument.status === 'completed'
  const selectedDocumentIsError = selectedDocument && selectedDocument.status === 'error'
  const hasAnalyzingDocuments = documents.some(doc => doc.status === 'analyzing')
  const analyzingCount = documents.filter(doc => doc.status === 'analyzing').length
  const completedCount = documents.filter(doc => doc.status === 'completed').length

  // Check if selected document has error status
  const selectedDocumentHasError = selectedDocument?.status === 'error'

  // Add state for error modal and error document
  const [errorModalOpen, setErrorModalOpen] = useState(false)
  const [errorDocument, setErrorDocument] = useState(null)

  // Responsive state
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activePanel, setActivePanel] = useState("chat") // 'chat' or 'document' for mobile

  // Sidebar collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  // Resizable panel state
  const [rightPanelWidth, setRightPanelWidth] = useState(35) // percentage
  const [isResizing, setIsResizing] = useState(false)

  // Collection state
  const [collectionName, setCollectionName] = useState("")
  const [collections, setCollections] = useState([])
  const [expandedCollections, setExpandedCollections] = useState(new Set())

  // Document management functions
  const generateDocumentId = () => `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const addDocument = (documentData) => {
    // Check for existing document with same filename to prevent duplicates
    const existingDocument = documents.find(doc =>
      doc.filename === documentData.filename &&
      doc.file?.size === documentData.file?.size &&
      doc.file?.name === documentData.file?.name
    )

    if (existingDocument) {
      console.log('Document already exists, returning existing ID:', existingDocument.id)
      // Auto-select the existing document and switch to workspace view
      setSelectedDocumentId(existingDocument.id)
      setCurrentView("workspace")
      setSidebarOpen(false)
      setActivePanel("chat")
      return existingDocument.id
    }

    const newDocument = {
      id: documentData.id || generateDocumentId(),
      uploadDate: new Date().toISOString(),
      status: documentData.status || 'uploading',
      ...documentData
    }
    console.log('Adding new document:', newDocument.id, newDocument.filename)
    setDocuments(prev => [...prev, newDocument])
    return newDocument.id
  }

  const updateDocument = (documentId, updates) => {
    setDocuments(prev => prev.map(doc =>
      doc.id === documentId ? { ...doc, ...updates } : doc
    ))
  }

  // Enhanced selectDocument function to handle both current session and historical documents
  const selectDocument = async (documentId, historicalDocument = null) => {
    setSelectedDocumentId(documentId)
    setError("")

    // Check if it's a current session document
    const currentDoc = documents.find(d => d.id === documentId)

    if (currentDoc) {
      // Handle current session document
      if (currentDoc.status === 'error') {
        setErrorDocument(currentDoc)
        setErrorModalOpen(true)
      } else {
        setErrorDocument(null)
        setErrorModalOpen(false)
      }
    } else if (historicalDocument) {
      // Handle historical document - need to load its full data and add to current session
      try {
        setLoading(true)

        // Load the full document data from backend
        const fullDocumentData = await loadHistoricalDocument(documentId)

        console.log("Full document data:", fullDocumentData)
        console.log("Raw key_points type:", typeof fullDocumentData.key_points)
        console.log("Raw key_points value:", fullDocumentData.key_points)
        console.log("Raw risk_flags type:", typeof fullDocumentData.risk_flags)
        console.log("Raw risk_flags:", fullDocumentData.risk_flags)
        console.log("Raw key_concepts type:", typeof fullDocumentData.key_concepts)
        console.log("Raw key_concepts:", fullDocumentData.key_concepts)

        // Parse JSON fields safely - FIXED LOGIC
        let keyPoints = []
        let riskFlags = []
        let keyConcepts = []

        try {
          // key_points is a JSON STRING - needs parsing
          if (fullDocumentData.key_points) {
            if (typeof fullDocumentData.key_points === 'string') {
              keyPoints = JSON.parse(fullDocumentData.key_points)
            } else if (Array.isArray(fullDocumentData.key_points)) {
              keyPoints = fullDocumentData.key_points
            }
          }
          console.log("Parsed key points:", keyPoints)
          console.log("Key points length:", keyPoints.length)
        } catch (e) {
          console.error('Error parsing key_points:', e)
          console.error('key_points value that failed:', fullDocumentData.key_points)
        }

        try {
          // risk_flags is already an ARRAY - no parsing needed
          if (fullDocumentData.risk_flags) {
            if (Array.isArray(fullDocumentData.risk_flags)) {
              riskFlags = fullDocumentData.risk_flags
            } else if (typeof fullDocumentData.risk_flags === 'string') {
              riskFlags = JSON.parse(fullDocumentData.risk_flags)
            }
          }
          console.log("Processed risk flags:", riskFlags)
          console.log("Risk flags length:", riskFlags.length)
        } catch (e) {
          console.error('Error processing risk_flags:', e)
        }

        try {
          // key_concepts is already an ARRAY - no parsing needed  
          if (fullDocumentData.key_concepts) {
            if (Array.isArray(fullDocumentData.key_concepts)) {
              keyConcepts = fullDocumentData.key_concepts
            } else if (typeof fullDocumentData.key_concepts === 'string') {
              keyConcepts = JSON.parse(fullDocumentData.key_concepts)
            }
          }
          console.log("Processed key concepts:", keyConcepts)
          console.log("Key concepts length:", keyConcepts.length)
        } catch (e) {
          console.error('Error processing key_concepts:', e)
        }

        // Also check if the data is nested in analysis object
        if (fullDocumentData.analysis) {
          console.log("Found analysis object:", fullDocumentData.analysis)

          // Use analysis data if main fields are empty
          if (keyPoints.length === 0 && fullDocumentData.analysis.key_points) {
            if (typeof fullDocumentData.analysis.key_points === 'string') {
              keyPoints = JSON.parse(fullDocumentData.analysis.key_points)
            } else if (Array.isArray(fullDocumentData.analysis.key_points)) {
              keyPoints = fullDocumentData.analysis.key_points
            }
            console.log("Used analysis.key_points:", keyPoints)
          }

          if (riskFlags.length === 0 && fullDocumentData.analysis.risk_flags) {
            if (Array.isArray(fullDocumentData.analysis.risk_flags)) {
              riskFlags = fullDocumentData.analysis.risk_flags
            } else if (typeof fullDocumentData.analysis.risk_flags === 'string') {
              riskFlags = JSON.parse(fullDocumentData.analysis.risk_flags)
            }
            console.log("Used analysis.risk_flags:", riskFlags)
          }

          if (keyConcepts.length === 0 && fullDocumentData.analysis.key_concepts) {
            if (Array.isArray(fullDocumentData.analysis.key_concepts)) {
              keyConcepts = fullDocumentData.analysis.key_concepts
            } else if (typeof fullDocumentData.analysis.key_concepts === 'string') {
              keyConcepts = JSON.parse(fullDocumentData.analysis.key_concepts)
            }
            console.log("Used analysis.key_concepts:", keyConcepts)
          }
        }

        // Final verification
        console.log("=== FINAL PARSED DATA ===")
        console.log("keyPoints:", keyPoints)
        console.log("keyPoints length:", keyPoints.length)
        console.log("riskFlags:", riskFlags)
        console.log("riskFlags length:", riskFlags.length)
        console.log("keyConcepts:", keyConcepts)
        console.log("keyConcepts length:", keyConcepts.length)
        console.log("========================")

        // Create a document object for the current session
        const sessionDocument = {
          id: documentId,
          filename: fullDocumentData.filename || historicalDocument.filename,
          file: null, // Historical documents don't have file objects
          status: 'completed',
          inputMode: 'historical',
          uploadDate: fullDocumentData.uploaded_at || historicalDocument.uploaded_at,
          documentId: documentId,
          collectionId: fullDocumentData.collection_id || null, // Add this line
          results: {
            filename: fullDocumentData.filename || historicalDocument.filename,
            document_id: documentId,
            document_text: fullDocumentData.document_text,
            file_url: fullDocumentData.file_url, // Add file URL for PDF viewing
            analysis: {
              summary: fullDocumentData.summary,
              key_points: keyPoints,
              risk_flags: riskFlags,
              key_concepts: keyConcepts
            },
            // Also include at root level for compatibility
            summary: fullDocumentData.summary,
            key_points: keyPoints,
            risk_flags: riskFlags,
            key_concepts: keyConcepts,
            word_count: fullDocumentData.word_count,
            analysis_method: fullDocumentData.analysis_method
          }
        }

        // If document belongs to a collection, ensure collection is in current session
        if (fullDocumentData.collection_id) {
          const existingCollection = collections.find(c => c.id === fullDocumentData.collection_id);
          if (!existingCollection) {
            // Find the collection in historical collections and add it to current session
            const historicalCollection = historicalCollections.find(c => c.id === fullDocumentData.collection_id);
            if (historicalCollection) {
              setCollections(prev => [...prev, {
                id: historicalCollection.id,
                name: historicalCollection.name,
                createdAt: historicalCollection.created_at,
                documents: [] // Will be populated as documents are loaded
              }]);
            }
          }
        }

        // Add to current session documents if not already there
        const existingDoc = documents.find(doc => doc.id === documentId)
        if (!existingDoc) {
          setDocuments(prev => [sessionDocument, ...prev])
        }

      } catch (error) {
        console.error('Error loading historical document:', error)
        setError('Failed to load document. Please try again.')
        return
      } finally {
        setLoading(false)
      }
    }

    // Switch to workspace view if needed
    if (currentView === "upload" || currentView === "casual-chat") {
      setCurrentView("workspace")
      setSidebarOpen(false)
      setActivePanel("chat")
    } else {
      setActivePanel("document")
    }
  }

  const removeDocument = (documentId) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId))
    if (selectedDocumentId === documentId) {
      // Select another document if available, or clear selection
      const remainingDocs = documents.filter(doc => doc.id !== documentId)
      setSelectedDocumentId(remainingDocs.length > 0 ? remainingDocs[0].id : null)
    }
  }

  // Add handler for removing error document and auto-selecting another valid doc
  const handleRemoveErrorDocument = (docId) => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId))
    setErrorModalOpen(false)
    setErrorDocument(null)
    // Auto-select another valid document if available
    const nextDoc = documents.find(doc => doc.id !== docId && doc.status === 'completed')
    if (nextDoc) {
      setSelectedDocumentId(nextDoc.id)
    } else {
      setSelectedDocumentId(null)
      setCurrentView('upload')
    }
  }

  // Collection management functions
  const generateCollectionId = () => {
    // Generate a proper UUID v4 for collection ID
    return crypto.randomUUID()
  }

  const addCollection = (collectionData) => {
    const newCollection = {
      id: generateCollectionId(),
      createdAt: new Date().toISOString(),
      documents: [],
      ...collectionData
    }
    setCollections(prev => [...prev, newCollection])
    return newCollection.id
  }

  const updateCollection = (collectionId, updates) => {
    setCollections(prev => prev.map(collection =>
      collection.id === collectionId ? { ...collection, ...updates } : collection
    ))
  }

  const removeCollection = (collectionId) => {
    setCollections(prev => prev.filter(collection => collection.id !== collectionId))
    // Also remove all documents in this collection
    const collection = collections.find(c => c.id === collectionId)
    if (collection) {
      collection.documents.forEach(docId => {
        removeDocument(docId)
      })
    }
  }

  const toggleCollectionExpansion = (collectionId) => {
    setExpandedCollections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(collectionId)) {
        newSet.delete(collectionId)
      } else {
        newSet.add(collectionId)
      }
      return newSet
    })
  }

  const addDocumentToCollection = (collectionId, documentId) => {
    setCollections(prev => prev.map(collection => {
      if (collection.id === collectionId) {
        return {
          ...collection,
          documents: [...(collection.documents || []), documentId]
        }
      }
      return collection
    }))
  }

  // Multi-file staging handler (doesn't analyze immediately)
  const handleMultipleFileChange = (files) => {
    const fileArray = Array.from(files)
    const validFiles = []

    for (const selectedFile of fileArray) {
      if (!selectedFile.name.toLowerCase().endsWith(".pdf") && !selectedFile.name.toLowerCase().endsWith(".docx")) {
        setError(`Invalid file type: ${selectedFile.name}. Please select PDF or DOCX files.`)
        continue
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError(`File too large: ${selectedFile.name}. Maximum size is 10MB.`)
        continue
      }

      // Check for duplicates
      const isDuplicate = stagedFiles.some(staged =>
        staged.name === selectedFile.name && staged.size === selectedFile.size
      )

      if (!isDuplicate) {
        validFiles.push(selectedFile)
      }
    }

    if (validFiles.length > 0) {
      setStagedFiles(prev => [...prev, ...validFiles])
      setError("")
    }
  }

  // File input reset handler
  const handleFileInputReset = () => {
    // This function will be called by the upload interface when file inputs are reset
    // We can use this to trigger any additional cleanup if needed
  }

  // Ref to access upload interface methods
  const uploadInterfaceRef = useRef(null)

  // Remove individual staged file
  const removeStagedFile = (index) => {
    setStagedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Clear all staged files
  const clearStagedFiles = () => {
    setStagedFiles([])
  }

  const handleCollectionUpload = async (e) => {
    e.preventDefault()

    if (!collectionName?.trim() || stagedFiles.length === 0) {
      setError('Please provide a collection name and select at least one file.')
      return
    }

    // Check authentication
    if (!isAuthenticated) {
      setError("Please sign in to upload documents")
      return
    }

    // Check if user can upload documents
    if (!canUploadDocument()) {
      setError("You've reached your document upload limit. Please upgrade your plan to upload more documents.")
      return
    }

    setLoading(true)
    setError('')

    try {
      // Store staged files before clearing them
      const filesToProcess = [...stagedFiles]

      // Create collection in backend first
      const collectionResponse = await axios.post("http://localhost:8000/collections/", {
        name: collectionName.trim(),
        description: `Collection created with ${stagedFiles.length} documents`
      }, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token || localStorage.getItem('auth_token')}`
        }
      })

      const collectionId = collectionResponse.data.id
      console.log(`Created collection in backend: ${collectionId}`)

      // Add collection to local state
      const newCollection = {
        id: collectionId,
        name: collectionName.trim(),
        createdAt: collectionResponse.data.created_at,
        documents: []
      }

      setCollections(prev => [...prev, newCollection])

      // Clear staged files and collection name immediately
      clearStagedFiles()
      setCollectionName('')

      // Reset file inputs to allow new file selection
      if (uploadInterfaceRef.current && uploadInterfaceRef.current.resetFileInputs) {
        uploadInterfaceRef.current.resetFileInputs()
      }

      // Switch to workspace view immediately
      setCurrentView('workspace')
      setSidebarOpen(false)
      setActivePanel("chat")

      // Process each file in the collection
      const uploadPromises = filesToProcess.map(async (file, index) => {
        const documentId = generateDocumentId()

        // Add document to collection
        setCollections(prev => prev.map(collection => {
          if (collection.id === collectionId) {
            return {
              ...collection,
              documents: [...(collection.documents || []), documentId]
            }
          }
          return collection
        }))

        // If this is the first document, select it immediately
        if (index === 0) {
          setSelectedDocumentId(documentId)
          // Ensure we stay on chat panel for collections
          setActivePanel("chat")
        }

        // Process the document with collectionId
        await handleDocumentSubmit(documentId, file, null, collectionId)

        return documentId
      })

      const documentIds = await Promise.all(uploadPromises)

      // First document is already selected above

    } catch (error) {
      console.error('Collection upload error:', error)
      setError('Failed to upload collection. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Individual document submission handler
  const handleDocumentSubmit = async (documentId, file, textContent = null, collectionId = null) => {
    const fileName = file?.name || "Text Document"
    const fileSize = file?.size || 0
    const isLargeFile = fileSize > 1024 * 1024 // > 1MB

    // Check if user can upload documents
    if (!canUploadDocument()) {
      setError("You've reached your document upload limit. Please upgrade your plan to upload more documents.")
      return
    }

    // For single file uploads, we know the document should exist, so we'll update it directly
    // For collection uploads, we need to add the document first
    if (collectionId) {
      // Collection upload - add document first
      const documentData = {
        id: documentId,
        filename: fileName,
        file: file,
        status: 'analyzing',
        analysisStartTime: new Date().toISOString(),
        isLargeFile: isLargeFile,
        uploadDate: new Date().toISOString(),
        collectionId: collectionId
      }
      addDocument(documentData)
    } else {
      // Single file upload - update the existing document
      updateDocument(documentId, {
        analysisStartTime: new Date().toISOString(),
        isLargeFile: isLargeFile
      })
    }

    try {
      let response

      if (file) {
        const formData = new FormData()
        formData.append("file", file)

        // Add collection_id if this is part of a collection upload
        if (collectionId) {
          formData.append("collection_id", collectionId)
          console.log(`Adding collection_id to upload: ${collectionId}`)
        }

        response = await axios.post("http://localhost:8000/documents/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${user?.token || localStorage.getItem('auth_token')}`
          },
        })
      } else if (textContent) {
        const textPayload = {
          text: textContent
        }

        // Add collection_id if this is part of a collection upload
        if (collectionId) {
          textPayload.collection_id = collectionId
          console.log(`Adding collection_id to text analysis: ${collectionId}`)
        }

        response = await axios.post("http://localhost:8000/documents/analyze-text", textPayload, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user?.token || localStorage.getItem('auth_token')}`
          },
        })
      }

      updateDocument(documentId, {
        status: 'completed',
        results: {
          ...response.data,
          // Ensure document_text is available at the results level
          document_text: response.data.document_text || response.data.text || response.data.analysis?.document_text || textContent
        },
        documentId: response.data.document_id || documentId,
        analysisEndTime: new Date().toISOString()
      })

      // Refresh user data to update usage statistics
      await refreshUserData()

      // Refresh historical documents to include the newly analyzed document
      await refreshHistoricalDocuments()

      // Update collection status if this document belongs to a collection
      const document = documents.find(doc => doc.id === documentId)
      if (document?.collectionId) {
        const collection = collections.find(c => c.id === document.collectionId)
        if (collection) {
          const collectionDocuments = documents.filter(doc => doc.collectionId === document.collectionId)
          const completedCount = collectionDocuments.filter(doc => doc.status === 'completed').length

          if (completedCount === collectionDocuments.length) {
            updateCollection(document.collectionId, { status: 'completed' })
          } else {
            updateCollection(document.collectionId, { status: 'analyzing' })
          }
        }
      }

      // Switch to workspace view if not already there
      if (currentView === 'upload') {
        setCurrentView("workspace")
        setSidebarOpen(false)
        setActivePanel("chat")
      }

    } catch (err) {
      console.error("Error:", err)
      let errorMessage = "An error occurred while processing your request"

      // Handle authentication errors
      if (err.response?.status === 401) {
        errorMessage = "Session expired. Please login again."
        logout()
        return
      } else if (err.response?.status === 403) {
        errorMessage = "Access forbidden. Please check your permissions."
      } else if (err.response?.status === 429) {
        errorMessage = err.response.data?.detail || "You've reached your usage limit. Please upgrade your plan."
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail
      }

      updateDocument(documentId, {
        status: 'error',
        error: errorMessage
      })

      // Update collection status if this document belongs to a collection
      const document = documents.find(doc => doc.id === documentId)
      if (document?.collectionId) {
        const collection = collections.find(c => c.id === document.collectionId)
        if (collection) {
          const collectionDocuments = documents.filter(doc => doc.collectionId === document.collectionId)
          const errorCount = collectionDocuments.filter(doc => doc.status === 'error').length

          if (errorCount === collectionDocuments.length) {
            updateCollection(document.collectionId, { status: 'error' })
          } else {
            updateCollection(document.collectionId, { status: 'analyzing' })
          }
        }
      }

      setError(errorMessage)
    }
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith(".pdf") && !selectedFile.name.toLowerCase().endsWith(".docx")) {
        setError("Please select a PDF or DOCX file")
        return
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File too large. Maximum size is 10MB")
        return
      }
      setFile(selectedFile)
      setError("")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Check authentication
    if (!isAuthenticated) {
      setError("Please sign in to upload documents")
      setLoading(false)
      return
    }

    try {
      if (inputMode === "file") {
        // Handle multiple staged files
        if (stagedFiles.length > 0) {
          // Check if user can upload documents
          if (!canUploadDocument()) {
            setError("You've reached your document upload limit. Please upgrade your plan to upload more documents.")
            setLoading(false)
            return
          }

          const documentIds = []

          for (const selectedFile of stagedFiles) {
            const documentId = addDocument({
              filename: selectedFile.name,
              file: selectedFile,
              inputMode: 'file',
              status: 'analyzing'
            })
            documentIds.push(documentId)

            // Start analysis for this document
            handleDocumentSubmit(documentId, selectedFile)
          }

          // Auto-select first document and switch to workspace
          if (documentIds.length > 0) {
            setSelectedDocumentId(documentIds[0])
            setCurrentView("workspace")
            setSidebarOpen(false)
            setActivePanel("chat")
          }

          // Clear staged files after starting analysis
          setStagedFiles([])
          setFile(null)

          // Reset file inputs to allow new file selection
          if (uploadInterfaceRef.current && uploadInterfaceRef.current.resetFileInputs) {
            uploadInterfaceRef.current.resetFileInputs()
          }

        } else if (file) {
          // Check if user can upload documents
          if (!canUploadDocument()) {
            setError("You've reached your document upload limit. Please upgrade your plan to upload more documents.")
            setLoading(false)
            return
          }

          // Handle single file (legacy support)
          const documentId = generateDocumentId()

          // Add document first (or get existing document ID if duplicate)
          const actualDocumentId = addDocument({
            id: documentId,
            filename: file.name,
            file: file,
            inputMode: 'file',
            status: 'analyzing'
          })

          // If addDocument returned a different ID (existing document found), 
          // don't start analysis again since it's already done
          if (actualDocumentId === documentId) {
            // This is a new document, so set it as selected and start analysis
            setSelectedDocumentId(documentId)
            setCurrentView("workspace")
            setSidebarOpen(false)
            setActivePanel("chat")

            // Start analysis
            handleDocumentSubmit(documentId, file)
          }
          // If actualDocumentId !== documentId, it means an existing document was found
          // and addDocument already handled the selection and view switching

          setFile(null)

          // Reset file inputs to allow new file selection
          if (uploadInterfaceRef.current && uploadInterfaceRef.current.resetFileInputs) {
            uploadInterfaceRef.current.resetFileInputs()
          }

        } else {
          setError("Please select one or more files")
          setLoading(false)
          return
        }

      } else if (inputMode === "collection") {
        // Collection upload is handled by handleCollectionUpload function
        // This should not be reached as the form uses handleCollectionUpload for collections
        setError("Collection upload should use the dedicated handler")
        setLoading(false)
        return
      } else {
        // Handle text input
        if (!textInput.trim()) {
          setError("Please enter some text")
          setLoading(false)
          return
        }

        // Check if user can upload documents
        if (!canUploadDocument()) {
          setError("You've reached your document upload limit. Please upgrade your plan to upload more documents.")
          setLoading(false)
          return
        }

        const documentId = addDocument({
          filename: `Text Document ${new Date().toLocaleDateString()}`,
          file: null,
          inputMode: 'text',
          status: 'analyzing',
          textContent: textInput
        })

        setSelectedDocumentId(documentId)
        setCurrentView("workspace")
        setSidebarOpen(false)
        setActivePanel("chat")

        // Start analysis
        handleDocumentSubmit(documentId, null, textInput)
        setTextInput("")
      }

    } catch (err) {
      console.error("Error:", err)
      // Handle authentication errors
      if (err.response?.status === 401) {
        setError("Session expired. Please login again.")
        logout()
      } else if (err.response?.status === 403) {
        setError("Access forbidden. Please check your permissions.")
      } else if (err.response?.status === 429) {
        setError(err.response.data?.detail || "You've reached your usage limit. Please upgrade your plan.")
      } else {
        setError("An error occurred while processing your request")
      }
    } finally {
      setLoading(false)
    }
  }

  const resetToHome = () => {
    setFile(null)
    setTextInput("")
    setError("")
    setCurrentView("upload")
    setSidebarOpen(false)
    setIsDemoMode(false)
    setBypassAPI(false)
    // Keep documents but clear selection for upload view
    setSelectedDocumentId(null)
    // Clear staged files
    setStagedFiles([])
    // Clear collection state
    setCollectionName("")
    const fileInput = document.getElementById("file-input")
    if (fileInput) fileInput.value = ""
  }

  const handleNewDocument = () => {
    resetToHome()
  }

  const clearAllDocuments = () => {
    setDocuments([])
    setSelectedDocumentId(null)
    setStagedFiles([])
    setCollections([])
    setExpandedCollections(new Set())
    resetToHome()
  }

  const handleExplainConcept = (conceptTerm) => {
    if (chatSetInputMessage) {
      const message = `Explain the following concept in detail: ${conceptTerm}`
      chatSetInputMessage(message)
      setActivePanel("chat")
    }
  }

  const handleCasualChat = () => {
    setCurrentView("casual-chat")
    setSidebarOpen(false)
    setSelectedDocumentId("casual-chat-session")
    setFile(null)
    setIsDemoMode(false)
    setBypassAPI(false)
  }

  const startDemoMode = () => {
    setIsDemoMode(true)
    setCurrentView("workspace")
    setSidebarOpen(false)
    setActivePanel("chat")

    const demoDocumentId = addDocument({
      filename: "Sample Business Plan.pdf",
      file: null,
      inputMode: 'demo',
      status: 'completed'
    })

    setSelectedDocumentId(demoDocumentId)

    const demoResults = {
      filename: "Sample Business Plan.pdf",
      document_id: demoDocumentId,
      executive_summary: {
        main_points: [
          "Strategic expansion into emerging markets with projected 40% revenue growth",
          "Development of innovative AI-powered product suite launching Q3 2024",
          "Establishment of three new regional offices and 150+ new hires",
          "Implementation of sustainable business practices reducing carbon footprint by 60%",
        ],
        key_findings: [
          "Market analysis reveals untapped opportunities in Southeast Asia",
          "Customer acquisition costs decreased by 25% through improved digital marketing",
          "Operational efficiency gains of 30% through automation initiatives",
          "Strong competitive advantage in AI technology and customer service",
        ],
        concerns: [
          "Potential supply chain disruptions affecting Q2 delivery timelines",
          "Regulatory changes in target markets may impact expansion strategy",
          "Increased competition from well-funded startups in core markets",
          "Talent acquisition challenges in specialized technical roles",
        ],
      },
      key_concepts: [
        {
          term: "Market Penetration Strategy",
          definition:
            "A comprehensive approach to entering new geographical markets through strategic partnerships and localized product offerings",
          importance: "Critical for achieving projected 40% revenue growth and establishing global presence",
        },
        {
          term: "AI-Powered Analytics",
          definition:
            "Advanced machine learning algorithms that provide real-time business insights and predictive modeling capabilities",
          importance: "Core differentiator that enables data-driven decision making and competitive advantage",
        },
        {
          term: "Sustainable Operations",
          definition: "Business practices focused on environmental responsibility and long-term resource efficiency",
          importance: "Essential for regulatory compliance and meeting ESG investment criteria",
        },
      ],
      analysis: {
        strengths: [
          "Strong financial position with 18 months runway",
          "Experienced leadership team with proven track record",
          "Innovative technology stack with proprietary AI capabilities",
          "Growing customer base with 95% retention rate",
        ],
        opportunities: [
          "Emerging markets showing 200% YoY growth potential",
          "Strategic partnerships with Fortune 500 companies",
          "Government incentives for sustainable technology adoption",
          "Increasing demand for AI-powered business solutions",
        ],
        threats: [
          "Economic uncertainty affecting enterprise spending",
          "Rapid technological changes requiring continuous innovation",
          "Talent war for AI and machine learning specialists",
          "Potential regulatory restrictions on AI applications",
        ],
      },
    }

    // Update the document with demo results
    updateDocument(demoDocumentId, {
      results: demoResults,
      documentId: demoDocumentId
    })
  }

  const loadRealInterfaceWithoutAPI = () => {
    setBypassAPI(true)
    setCurrentView("workspace")
    setSidebarOpen(false)
    setActivePanel("chat")

    const realDocumentId = addDocument({
      filename: "Business_Plan_Q1_2024.pdf",
      file: null,
      inputMode: 'preview',
      status: 'completed'
    })

    setSelectedDocumentId(realDocumentId)

    const realResults = {
      success: true,
      filename: "Business_Plan_Q1_2024.pdf",
      document_id: realDocumentId,
      document_text: `# Strategic Business Plan - Q1 2024 Analysis

## Executive Summary
This comprehensive business plan outlines our strategic initiatives for Q1 2024, focusing on market expansion, technology advancement, and operational excellence. Our analysis indicates strong growth potential across multiple sectors with projected revenue increases of 40% year-over-year.

### Key Strategic Priorities
**Market Expansion Initiative**: Our research has identified significant opportunities in emerging markets, particularly in Southeast Asia where we project 200% growth potential. Market analysis reveals untapped demand for AI-powered business solutions in financial services and healthcare sectors.

**Technology Innovation Platform**: Development of our next-generation AI analytics platform is scheduled for Q3 2024 launch. This platform will provide real-time business insights and predictive modeling capabilities, positioning us as a leader in data-driven decision making tools.

**Sustainable Operations Framework**: Implementation of environmentally responsible business practices will reduce our carbon footprint by 60% while ensuring compliance with evolving ESG regulations and meeting institutional investor criteria.

## Financial Performance Analysis
Our financial model demonstrates robust fundamentals with conservative projections and adequate cash reserves. Current metrics show:
- 18-month operational runway with current burn rate
- Customer acquisition cost reduction of 25% through improved digital marketing
- Operational efficiency improvements of 30% via automation initiatives
- Customer retention rate maintaining at 95%

### Revenue Projections by Segment
Enterprise AI Solutions: 45% of total projected revenue
Healthcare Analytics: 25% of total projected revenue
Financial Services Platform: 20% of total projected revenue
Other Market Segments: 10% of total projected revenue

## Risk Assessment and Mitigation
**Supply Chain Vulnerabilities**: Potential disruptions in Q2 delivery schedules require development of alternative supplier relationships and contingency planning frameworks.

**Regulatory Environment Changes**: Evolving regulations in target markets may impact our expansion timeline, necessitating flexible compliance strategies and legal framework adaptations.

**Talent Acquisition Challenges**: The competitive landscape for AI and machine learning specialists presents recruitment challenges that could affect our development timeline and scaling objectives.

## Implementation Strategy
**Phase 1 (Q1-Q2 2024)**: Complete market research initiatives and establish strategic partnerships
**Phase 2 (Q3 2024)**: Launch AI platform and initiate market entry strategies  
**Phase 3 (Q4 2024)**: Scale operations with 150+ strategic hires across three regional offices

## Competitive Landscape Analysis
Our proprietary AI technology creates substantial barriers to entry while our established customer relationships maintain industry-leading retention rates. Strategic partnerships with Fortune 500 companies provide accelerated market penetration opportunities and competitive differentiation.

## Conclusion and Next Steps
This business plan effectively balances ambitious growth objectives with comprehensive risk management strategies. The combination of strong financial positioning, innovative technology capabilities, and strategic market opportunities positions our organization for sustained success in the evolving business intelligence landscape.`,
      analysis: {
        summary:
          "This business plan presents a comprehensive strategy for Q1 2024 focusing on AI-powered market expansion with strong financial fundamentals and risk management. The document outlines ambitious yet achievable growth targets supported by detailed market analysis and operational planning.",
        key_points: [
          {
            text: "Strategic expansion into emerging markets with projected 40% revenue growth through AI-powered solutions",
            quote: "projected revenue increases of 40% year-over-year",
          },
          {
            text: "Technology platform launch scheduled for Q3 2024 providing competitive differentiation",
            quote: "Development of our next-generation AI analytics platform is scheduled for Q3 2024 launch",
          },
          {
            text: "Strong financial position with 18-month runway and improved efficiency metrics",
            quote: "18-month operational runway with current burn rate",
          },
          {
            text: "Customer retention excellence with 95% retention rate demonstrating product-market fit",
            quote: "Customer retention rate maintaining at 95%",
          },
        ],
        risk_flags: [
          {
            text: "🚩 Supply chain vulnerabilities could impact Q2 delivery timelines",
            quote: "Potential disruptions in Q2 delivery schedules",
          },
          {
            text: "🚩 Regulatory changes in target markets may affect expansion strategy",
            quote: "Evolving regulations in target markets may impact our expansion timeline",
          },
          {
            text: "🚩 Talent acquisition challenges in competitive AI/ML market",
            quote: "competitive landscape for AI and machine learning specialists",
          },
        ],
        key_concepts: [
          {
            term: "Market Penetration Strategy",
            explanation:
              "A systematic approach to entering new geographical markets through strategic partnerships, localized product offerings, and targeted customer acquisition initiatives",
          },
          {
            term: "AI-Powered Analytics Platform",
            explanation:
              "Advanced machine learning algorithms that provide real-time business insights, predictive modeling, and data-driven decision making capabilities for enterprise clients",
          },
          {
            term: "ESG Compliance Framework",
            explanation:
              "Environmental, Social, and Governance practices that ensure regulatory compliance while meeting institutional investor criteria and sustainable business operations",
          },
        ],
      },
      analyzed_at: new Date().toISOString(),
    }

    // Update the document with real results
    updateDocument(realDocumentId, {
      results: realResults,
      documentId: realDocumentId
    })
  }

  const handleMouseDown = (e) => {
    e.preventDefault()
    setIsResizing(true)

    const handleMouseMove = (e) => {
      const container = e.currentTarget.parentElement || document.querySelector(".workspace-container")
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const containerWidth = containerRect.width
      const mouseX = e.clientX - containerRect.left

      const percentage = Math.max(30, Math.min(((containerWidth - mouseX) / containerWidth) * 100, 60));

      setRightPanelWidth(percentage)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }

  const loadHistoricalCollectionDocuments = async (collectionId) => {
    try {
      const response = await axios.get(`http://localhost:8000/collections/${collectionId}`, {
        headers: {
          'Authorization': `Bearer ${user?.token || localStorage.getItem('auth_token')}`
        }
      });
      return response.data.documents || [];
    } catch (error) {
      console.error('Error loading collection documents:', error);
      if (error.response?.status === 401) {
        logout();
      }
      return [];
    }
  };

  return (
    <div className="h-screen dark:bg-[#121212] overflow-hidden">
      {currentView === "upload" ? (
        /* ===== FULL-WIDTH UPLOAD VIEW ===== */
        <div className="h-full flex">
          {/* Sidebar - Wider for better proportions */}
          <div
            className={`hidden lg:block fixed left-0 top-0 h-full z-30 transition-all duration-300 ${sidebarCollapsed ? "w-20" : "w-80"
              }`}
          >
            <ModernSidebar
              onNewDocument={handleNewDocument}
              onHome={resetToHome}
              currentDocument={null}
              isDemoMode={isDemoMode}
              bypassAPI={bypassAPI}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              onCasualChat={handleCasualChat}
              documents={documents}
              selectedDocumentId={selectedDocumentId}
              onSelectDocument={selectDocument}
              onRemoveDocument={removeDocument}
              collections={collections}
              historicalCollections={historicalCollections}
              expandedCollections={expandedCollections}
              onToggleCollectionExpansion={toggleCollectionExpansion}
              onRemoveCollection={removeCollection}
              onOpenHistory={() => setIsHistoryDrawerOpen(true)}
            />
          </div>

          {/* Main Upload Content - Full Width */}
          <div
            className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-80"
              } relative h-full`}
          >
            {/* Simple Background - Matching ChatInterface */}
            <div className="absolute inset-0 bg-white dark:bg-[#1F1F1F]"></div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden fixed top-4 left-4 z-40">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="bg-background/50 backdrop-blur-xl shadow-xl border border-border hover:bg-background transition-all duration-200 p-2"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>

            {/* User Actions - Top Right */}
            <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUsageDashboard(true)}
                className="bg-[#121212] backdrop-blur-xl shadow-xl border border-border hover:bg-accent transition-all duration-200 p-2 group"
              >
                <TrendingUp className="h-4 w-4 text-primary group-hover:text-primary/80" />
                <span className="absolute top-full right-0 mt-2 px-2 py-1 text-xs bg-popover text-popover-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  View Usage & Plan
                </span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="bg-[#121212] backdrop-blur-xl shadow-xl border border-border hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 p-2 group"
              >
                <LogOut className="h-4 w-4 group-hover:text-destructive-foreground" />
                <span className="absolute top-full right-0 mt-2 px-2 py-1 text-xs bg-popover text-popover-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  Sign Out
                </span>
              </Button>
            </div>

            {/* Centered Content Layout */}
            <div className="relative z-10 w-full h-full flex items-center justify-center p-6 lg:p-8">
              <div className="w-full max-w-4xl">

                {/* Simple Header */}
                <div className="text-center">
                  {/* <div className="inline-flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <Sparkles className="h-2.5 w-2.5 text-white" />
                      </div>
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
                      DigesText
                    </h1>
                  </div> */}
                  {/* <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                    AI-powered document analysis
                  </p> */}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                  {/* <Button
                    onClick={startDemoMode}
                    variant="outline"
                    className="flex-1 bg-white/80 hover:bg-white dark:bg-gray-900/80 dark:hover:bg-gray-900 border-2 border-gray-200 hover:border-blue-300 dark:border-gray-700 dark:hover:border-blue-600 text-gray-700 hover:text-blue-700 dark:text-gray-300 dark:hover:text-blue-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 px-6 py-3 text-base font-semibold rounded-xl backdrop-blur-sm"
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    View Demo
                  </Button> */}
                </div>

                {/* Upload Interface */}
                <div className={`w-full ${isInitialLoad ? 'animate-slide-in-up' : ''}`}>
                  <ModernUploadInterface
                    ref={uploadInterfaceRef}
                    file={file}
                    setFile={setFile}
                    textInput={textInput}
                    setTextInput={setTextInput}
                    inputMode={inputMode}
                    setInputMode={setInputMode}
                    handleFileChange={handleFileChange}
                    handleSubmit={handleSubmit}
                    loading={loading}
                    error={error}
                    // Multi-document props
                    handleMultipleFileChange={handleMultipleFileChange}
                    documents={documents}
                    stagedFiles={stagedFiles}
                    removeStagedFile={removeStagedFile}
                    clearStagedFiles={clearStagedFiles}
                    // Collection props
                    collectionName={collectionName}
                    setCollectionName={setCollectionName}
                    handleCollectionUpload={handleCollectionUpload}
                  />
                </div>

                {/* Quick Start Options */}
                {/* <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-xl max-w-2xl mx-auto">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">Quick Start</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white mb-1">Workspace</p>
                      <p className="text-gray-600 dark:text-gray-400">Full interface with sample content, no API usage</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white mb-1">Demo</p>
                      <p className="text-gray-600 dark:text-gray-400">Preview with sample content</p>
                    </div>
                  </div>
                </div> */}

              </div>
            </div>
          </div>

          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
                <ModernSidebar
                  onNewDocument={handleNewDocument}
                  onHome={resetToHome}
                  currentDocument={null}
                  onClose={() => setSidebarOpen(false)}
                  isDemoMode={isDemoMode}
                  bypassAPI={bypassAPI}
                  collapsed={false}
                  onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                  onCasualChat={handleCasualChat}
                  documents={documents}
                  selectedDocumentId={selectedDocumentId}
                  onSelectDocument={selectDocument}
                  onRemoveDocument={removeDocument}
                  collections={collections}
                  historicalCollections={historicalCollections}
                  expandedCollections={expandedCollections}
                  onToggleCollectionExpansion={toggleCollectionExpansion}
                  onRemoveCollection={removeCollection}
                />
              </div>
            </>
          )}
        </div>
      ) : currentView === "casual-chat" ? (
        /* ===== FULL-WIDTH CASUAL CHAT VIEW ===== */
        <>
          {/* Wider Sidebar */}
          <div
            className={`hidden lg:block fixed left-0 top-0 h-full z-30 transition-all duration-300 ${sidebarCollapsed ? "w-20" : "w-80"
              }`}
          >
            <ModernSidebar
              onNewDocument={handleNewDocument}
              onHome={resetToHome}
              currentDocument="Normal Chat"
              isDemoMode={false}
              bypassAPI={false}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              onCasualChat={handleCasualChat}
              documents={documents}
              selectedDocumentId={selectedDocumentId}
              onSelectDocument={selectDocument}
              onRemoveDocument={removeDocument}
              collections={collections}
              historicalCollections={historicalCollections}
              expandedCollections={expandedCollections}
              onToggleCollectionExpansion={toggleCollectionExpansion}
              onRemoveCollection={removeCollection}
              onOpenHistory={() => setIsHistoryDrawerOpen(true)}
            />
          </div>

          {/* Professional Full-Width Mobile Header */}
          <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 shadow-lg">
            <div className="flex items-center justify-between p-2 sm:p-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hover:bg-gray-100 dark:hover:bg-gray-800 p-1.5 rounded-lg"
              >
                {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 dark:from-white dark:to-blue-200 bg-clip-text text-transparent">
                    Normal Chat
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">AI Assistant</p>
                </div>
              </div>
              <div className="w-8 sm:w-10"></div>
            </div>
          </div>

          {/* Full-Width Chat Area */}
          <div
            className={`transition-all duration-300 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-80"} pt-12 sm:pt-14 lg:pt-0 h-full`}
          >
            <ModernChatPanel
              documentId="casual-chat-session"
              filename="Casual Chat - No Document"
              onSetInputMessage={setChatSetInputMessage}
              isDemoMode={false}
              bypassAPI={false}
              casualMode={true}
            />
          </div>

          {/* Mobile Sidebar */}
          {sidebarOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
                <ModernSidebar
                  onNewDocument={handleNewDocument}
                  onHome={resetToHome}
                  currentDocument="Casual Chat"
                  onClose={() => setSidebarOpen(false)}
                  isDemoMode={false}
                  bypassAPI={false}
                  collapsed={false}
                  onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                  onCasualChat={handleCasualChat}
                  documents={documents}
                  selectedDocumentId={selectedDocumentId}
                  onSelectDocument={selectDocument}
                  onRemoveDocument={removeDocument}
                  collections={collections}
                  historicalCollections={historicalCollections}
                  expandedCollections={expandedCollections}
                  onToggleCollectionExpansion={toggleCollectionExpansion}
                  onRemoveCollection={removeCollection}
                  onOpenHistory={() => setIsHistoryDrawerOpen(true)}
                />
              </div>
            </>
          )}
        </>
      ) : (
        /* ===== FULL-WIDTH WORKSPACE VIEW ===== */
        <>
          {/* Wider Sidebar */}
          <div
            className={`hidden lg:block fixed left-0 top-0 h-full z-30 transition-all duration-300 ${sidebarCollapsed ? "w-20" : "w-80"
              }`}
          >
            <ModernSidebar
              onNewDocument={handleNewDocument}
              onHome={resetToHome}
              currentDocument={enhancedResults?.filename || "Demo Document"}
              isDemoMode={isDemoMode}
              bypassAPI={bypassAPI}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              onCasualChat={handleCasualChat}
              documents={documents}
              selectedDocumentId={selectedDocumentId}
              onSelectDocument={selectDocument}
              onRemoveDocument={removeDocument}
              collections={collections}
              historicalCollections={historicalCollections}
              expandedCollections={expandedCollections}
              onToggleCollectionExpansion={toggleCollectionExpansion}
              onRemoveCollection={removeCollection}
              onOpenHistory={() => setIsHistoryDrawerOpen(true)}
            />
          </div>

          {/* Enhanced Mobile Header */}
          <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-background backdrop-blur-xl  shadow-lg">
            <div className="flex items-center justify-between p-2 sm:p-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hover:bg-gray-100 dark:hover:bg-gray-800 p-1.5 rounded-lg"
              >
                {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>

              <div className="flex items-center gap-2">
                {/* <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div> */}
                <div className="text-center">
                  <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 dark:from-white dark:to-blue-200 bg-clip-text text-transparent">
                    drop
                    <span className="text-blue-400 dark:text-blue-300">2</span>
                    chat
                    <span className="text-red-500">*</span>
                  </h1>

                  <div className="flex items-center gap-2 text-xs">
                    {isDemoMode && (
                      <span className="text-orange-600 dark:text-orange-400 font-medium">(Demo Mode)</span>
                    )}
                    {bypassAPI && !isDemoMode && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">(Preview Mode)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Mobile Panel Switcher */}
              <div className="flex gap-1 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg sm:rounded-xl p-1 border border-gray-200/50 dark:border-gray-700/50">
                <Button
                  variant={activePanel === "chat" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActivePanel("chat")}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold h-auto min-w-0 rounded-md sm:rounded-lg transition-all duration-200 ${activePanel === "chat"
                      ? "bg-white dark:bg-gray-700 shadow-sm text-blue-700 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                >
                  <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Chat</span>
                </Button>
                <Button
                  variant={activePanel === "document" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActivePanel("document")}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold h-auto min-w-0 rounded-md sm:rounded-lg transition-all duration-200 ${activePanel === "document"
                      ? "bg-white dark:bg-gray-700 shadow-sm text-blue-700 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                >
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Document</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Full-Width Main Content Area */}
          <div
            className={`transition-all duration-300 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-80"
              } pt-12 sm:pt-14 lg:pt-0 h-full workspace-container ${isInitialLoad ? 'animate-fade-in-scale' : ''}`}
          >
            {/* Mobile/Tablet: Full-width panels with switching */}
            <div className="lg:hidden h-full">
              {/* Chat Panel - Mobile/Tablet */}
              <div className={`h-full ${activePanel === "chat" ? "block" : "hidden"}`}>
                {selectedDocument?.status === 'analyzing' ? (
                  <div className="h-full flex items-center justify-center bg-white dark:bg-background p-6">
                    <div className="text-center space-y-6 max-w-md">
                      <div className="relative">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Processing Document</h3>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                          Analysis is in progress...
                        </p>

                      </div>
                    </div>
                  </div>
                ) : selectedDocument?.status === 'error' ? (
                  <div className="h-full flex items-center justify-center  dark:bg-background p-6">
                    <div className="text-center space-y-6 max-w-md">
                      <div className="flex items-center justify-center mb-4">
                        <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30">
                          <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-red-700 dark:text-red-400">Document Error</h3>
                      <p className="text-base text-gray-700 dark:text-gray-300">
                        Unable to process this file. It may be corrupted, too large, password protected, or in an unsupported format.
                      </p>

                    </div>
                  </div>
                ) : documentId ? (
                  <ModernChatPanel
                    documentId={documentId}
                    filename={enhancedResults?.filename || "Demo Document"}
                    onSetInputMessage={setChatSetInputMessage}
                    isDemoMode={isDemoMode}
                    bypassAPI={bypassAPI}
                    casualMode={false}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-white dark:bg-background p-6">
                    <div className="text-center space-y-6 max-w-md">
                      <div className="relative">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Processing Document</h3>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                          Analysis in progress...
                        </p>

                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Document Viewer Panel - Mobile/Tablet */}
              <div className={`h-full ${activePanel === "document" ? "block" : "hidden"}`}>
                <EnhancedDocumentViewer
                  results={enhancedResults}
                  file={selectedDocumentFile}
                  inputMode={selectedDocument?.inputMode || inputMode}
                  onExplainConcept={handleExplainConcept}
                  isDemoMode={isDemoMode}
                  bypassAPI={bypassAPI}
                />
              </div>
            </div>

            {/* Desktop: Full-width resizable panels */}
            <div className="hidden lg:flex h-full">
              {/* Chat Panel - Desktop */}
              <div
                className="h-full bg-white dark:bg-gray-950"
                style={{
                  width: `${100 - rightPanelWidth}%`,
                  minWidth: "25%",
                }}
              >
                {selectedDocument?.status === 'analyzing' ? (
                  <div className="h-full flex items-center justify-center bg-white dark:bg-background p-12">
                    <div className="text-center space-y-8 max-w-lg">
                      <div className="relative">
                        <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white">Processing Document</h3>
                        <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                          Analysis is in progress...
                        </p>

                      </div>
                    </div>
                  </div>
                ) : selectedDocument?.status === 'error' ? (
                  <div className="h-full flex items-center justify-center dark:bg-[#1f1f1f] p-12">
                    <div className="text-center space-y-8 max-w-lg">
                      <div className="flex items-center justify-center mb-4">
                        <div className="p-5 rounded-full bg-red-100 dark:bg-red-900/30">
                          <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
                        </div>
                      </div>
                      <h3 className="text-3xl font-bold text-red-700 dark:text-red-400">Document Error</h3>
                      <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                        Unable to process this file. It may be corrupted, too large, password protected, or in an unsupported format.
                      </p>

                    </div>
                  </div>
                ) : documentId ? (
                  <ModernChatPanel
                    documentId={documentId}
                    filename={enhancedResults?.filename || "Demo Document"}
                    onSetInputMessage={setChatSetInputMessage}
                    isDemoMode={isDemoMode}
                    bypassAPI={bypassAPI}
                    casualMode={false}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-white dark:bg-background p-12">
                    <div className="text-center space-y-8 max-w-lg">
                      <div className="relative">
                        <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white">Processing Document</h3>
                        <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                          Analysis is in progress...
                        </p>
                        {/* <div className="flex items-center justify-center gap-3 text-blue-600 dark:text-blue-400">
                          <Zap className="h-6 w-6" />
                          <span className="text-lg font-semibold">Advanced AI Processing</span>
                        </div> */}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Hidden Resize Handle - Only visible on hover */}
              <div className="relative">
                <div
                  className={`
                    w-1 h-full bg-transparent hover:bg-gradient-to-b hover:from-blue-400 hover:via-blue-500 hover:to-blue-400 
                    dark:hover:from-blue-500 dark:hover:via-blue-400 dark:hover:to-blue-500
                    cursor-col-resize transition-all duration-200 relative group
                    ${isResizing ? "bg-gradient-to-b from-blue-500 via-blue-600 to-blue-500" : ""}
                  `}
                  onMouseDown={handleMouseDown}
                >
                  <div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                                bg-white dark:bg-gray-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/50
                                rounded-full p-3 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-xl border border-gray-200 dark:border-gray-600"
                  >
                    <GripVertical className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                  </div>
                  <div className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize" />
                </div>
              </div>

              {/* Document Viewer Panel - Desktop */}
              <div
                className="h-full bg-white dark:bg-gray-950"
                style={{
                  width: `${rightPanelWidth}%`,
                  minWidth: "25%",
                }}
              >
                <EnhancedDocumentViewer
                  results={results}
                  file={selectedDocumentFile}
                  inputMode={selectedDocument?.inputMode || inputMode}
                  onExplainConcept={handleExplainConcept}
                  isDemoMode={isDemoMode}
                  bypassAPI={bypassAPI}
                />
              </div>
            </div>
          </div>

          {/* Mobile Sidebar */}
          {sidebarOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
                <ModernSidebar
                  onNewDocument={handleNewDocument}
                  onHome={resetToHome}
                  currentDocument={enhancedResults?.filename || "Demo Document"}
                  onClose={() => setSidebarOpen(false)}
                  isDemoMode={isDemoMode}
                  bypassAPI={bypassAPI}
                  collapsed={false}
                  onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                  onCasualChat={handleCasualChat}
                  documents={documents}
                  selectedDocumentId={selectedDocumentId}
                  onSelectDocument={selectDocument}
                  onRemoveDocument={removeDocument}
                  collections={collections}
                  historicalCollections={historicalCollections}
                  expandedCollections={expandedCollections}
                  onToggleCollectionExpansion={toggleCollectionExpansion}
                  onRemoveCollection={removeCollection}
                  onOpenHistory={() => setIsHistoryDrawerOpen(true)}
                />
              </div>
            </>
          )}
        </>
      )}
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

              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setErrorModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleRemoveErrorDocument(errorDocument.id)}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Remove File
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Usage Dashboard Modal */}
      {showUsageDashboard && (
        <UsageDashboard onClose={() => setShowUsageDashboard(false)} />
      )}

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        historicalDocuments={historicalDocuments}
        collections={historicalCollections}
        currentDocumentId={selectedDocumentId}
        currentCollectionId={currentCollectionId}
        isLoadingHistory={isLoadingHistory}
        onSelectHistoricalDocument={async (docId, doc) => {
          await selectDocument(docId, doc)
          setIsHistoryDrawerOpen(false)
        }}
        onSelectCollection={selectCollectionFromHistory}
      />

      {/* Error Alert for Usage Limits */}
      {error && error.includes('limit') && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md">
          <Alert variant="destructive" className="shadow-lg">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError('')}
                className="ml-2 h-auto p-1 hover:bg-destructive-foreground/10"
              >
                ✕
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  )
}

export default Assistant
