import React, { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs'
import { Alert, AlertDescription } from './ui/alert'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Upload, FileText, Brain, AlertTriangle, Loader2, Sparkles, Zap, Shield, Clock, X, CheckCircle } from 'lucide-react'

const ModernUploadInterface = forwardRef(({
  file,
  setFile,
  textInput,
  setTextInput,
  inputMode,
  setInputMode,
  handleFileChange,
  handleSubmit,
  loading,
  error,
  // Multi-document props
  handleMultipleFileChange,
  documents = [],
  stagedFiles = [],
  removeStagedFile,
  clearStagedFiles,
  // Collection props
  collectionName,
  setCollectionName,
  handleCollectionUpload,
  // File input reset function
  onFileInputReset
}, ref) => {
  const [dragActive, setDragActive] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [modalError, setModalError] = useState('')
  const [dragCounter, setDragCounter] = useState(0)
  const [showTabWarningModal, setShowTabWarningModal] = useState(false)
  const [pendingTabSwitch, setPendingTabSwitch] = useState(null)
  const [showCollectionWarningModal, setShowCollectionWarningModal] = useState(false)
  
  // Refs for file inputs
  const fileInputRef = useRef(null)
  const collectionInputRef = useRef(null)

  // Expose resetFileInputs function to parent component
  useImperativeHandle(ref, () => ({
    resetFileInputs
  }))

  // Prevent default drag behavior globally
  useEffect(() => {
    const preventDefault = (e) => {
      e.preventDefault()
    }
    
    document.addEventListener('dragover', preventDefault)
    document.addEventListener('drop', preventDefault)
    
    return () => {
      document.removeEventListener('dragover', preventDefault)
      document.removeEventListener('drop', preventDefault)
    }
  }, [])

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Check if the dragged item is a file
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const hasFiles = Array.from(e.dataTransfer.items).some(item => 
        item.kind === 'file'
      )
      
      if (hasFiles) {
        setDragCounter(prev => prev + 1)
        setDragActive(true)
      }
    }
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    setDragCounter(prev => prev - 1)
    
    // Only set dragActive to false when we've completely left the drop zone
    if (dragCounter <= 1) {
      setDragActive(false)
      setDragCounter(0)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    setDragActive(false)
    setDragCounter(0)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Create a synthetic event for file validation
      const syntheticEvent = {
        target: {
          files: e.dataTransfer.files
        }
      }
      handleFileChangeWithModal(syntheticEvent)
    }
  }

  // Function to reset file inputs
  const resetFileInputs = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (collectionInputRef.current) {
      collectionInputRef.current.value = ''
    }
    // Notify parent component that inputs have been reset
    if (onFileInputReset) {
      onFileInputReset()
    }
  }

  // Enhanced file change handler with modal error display
  const handleFileChangeWithModal = (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Check for invalid file types first
    const invalidFiles = Array.from(files).filter(file => 
      !file.name.toLowerCase().endsWith('.pdf')
    )
    
    if (invalidFiles.length > 0) {
      const fileNames = invalidFiles.map(f => f.name).join(', ')
      const errorMessage = `Invalid file type(s): ${fileNames}. Please select PDF files only.`
      setModalError(errorMessage)
      setShowErrorModal(true)
      return
    }

    // Handle single file upload (file tab)
    if (inputMode === 'file') {
      const file = files[0]
      const maxSize = 5 * 1024 * 1024 // 5MB for single files
      
      if (file.size > maxSize) {
        const maxSizeMB = maxSize / (1024 * 1024)
        const errorMessage = `File too large: ${file.name}. Maximum size is ${maxSizeMB}MB.`
        setModalError(errorMessage)
        setShowErrorModal(true)
        return
      }
      
      // For single file mode, directly call handleFileChange
      handleFileChange(e)
      return
    }

    // Handle multiple file upload (collection tab)
    if (inputMode === 'collection') {
      const maxTotalSize = 10 * 1024 * 1024 // 10MB total for collection
      const maxPerFileSize = 5 * 1024 * 1024 // 5MB per file limit
      
      // Check individual file sizes first
      const oversizedFiles = Array.from(files).filter(file => file.size > maxPerFileSize)
      const validSizedFiles = Array.from(files).filter(file => file.size <= maxPerFileSize)
      
      // If all files are oversized, show error
      if (validSizedFiles.length === 0 && oversizedFiles.length > 0) {
        const fileNames = oversizedFiles.map(f => f.name).join(', ')
        const maxSizeMB = maxPerFileSize / (1024 * 1024)
        const errorMessage = `All selected files are too large: ${fileNames}. Maximum size per file is ${maxSizeMB}MB.`
        setModalError(errorMessage)
        setShowErrorModal(true)
        return
      }
      
      // If some files are oversized, show warning but continue with valid files
      if (oversizedFiles.length > 0 && validSizedFiles.length > 0) {
        const oversizedNames = oversizedFiles.map(f => f.name).join(', ')
        const maxSizeMB = maxPerFileSize / (1024 * 1024)
        const warningMessage = `Some files were skipped due to size limit (${maxSizeMB}MB per file): ${oversizedNames}. Only valid files will be uploaded.`
        setModalError(warningMessage)
        setShowErrorModal(true)
      }
      
      // Check total collection size
      const totalSize = validSizedFiles.reduce((sum, file) => sum + file.size, 0)
      if (totalSize > maxTotalSize) {
        const totalSizeMB = (totalSize / 1024 / 1024).toFixed(1)
        const maxTotalSizeMB = maxTotalSize / (1024 * 1024)
        const errorMessage = `Collection size too large: ${totalSizeMB}MB. Maximum total collection size is ${maxTotalSizeMB}MB.`
        setModalError(errorMessage)
        setShowErrorModal(true)
        return
      }

      // Check for single file upload in collection mode
      if (validSizedFiles.length === 1) {
        setModalError('Collections require multiple files. Please select more than one file to create a collection.')
        setShowCollectionWarningModal(true)
        return
      }

      // Process valid files for collection
      if (validSizedFiles.length > 0) {
        handleMultipleFileChange(validSizedFiles)
      }
    }
  }

  // Enhanced multiple file change handler with modal error display
  const handleMultipleFileChangeWithModal = (files) => {
    const fileArray = Array.from(files)
    const validFiles = []
    const errors = []
    
    const maxSize = inputMode === 'collection' ? 10 * 1024 * 1024 : 5 * 1024 * 1024
    
    for (const selectedFile of fileArray) {
      // Check file type
      if (!selectedFile.name.toLowerCase().endsWith('.pdf') && !selectedFile.name.toLowerCase().endsWith('.docx')) {
        errors.push(`Invalid file type: ${selectedFile.name}. Please select PDF or DOCX files.`)
        continue
      }
      
      // Check file size
      if (selectedFile.size > maxSize) {
        const maxSizeMB = maxSize / (1024 * 1024)
        errors.push(`File too large: ${selectedFile.name}. Maximum size is ${maxSizeMB}MB.`)
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
    
    if (errors.length > 0) {
      setModalError(errors.join('\n'))
      setShowErrorModal(true)
      return
    }
    
    if (validFiles.length > 0) {
      handleMultipleFileChange(validFiles)
    }
  }

  // Check if there's content that would be lost when switching tabs
  const hasContent = () => {
    if (inputMode === 'file') {
      return file || stagedFiles.length > 0
    } else if (inputMode === 'collection') {
      return stagedFiles.length > 0 || (collectionName && collectionName.trim())
    } else if (inputMode === 'text') {
      return textInput && textInput.trim()
    }
    return false
  }

  // Handle tab switching with warning
  const handleTabSwitch = (newMode) => {
    if (hasContent()) {
      setPendingTabSwitch(newMode)
      setShowTabWarningModal(true)
    } else {
      setInputMode(newMode)
    }
  }

  // Confirm tab switch and clear content
  const confirmTabSwitch = () => {
    // Clear all content based on current mode
    if (inputMode === 'file') {
      setFile(null)
      clearStagedFiles()
    } else if (inputMode === 'collection') {
      clearStagedFiles()
      setCollectionName('')
    } else if (inputMode === 'text') {
      setTextInput('')
    }
    
    // Switch to the pending tab
    setInputMode(pendingTabSwitch)
    setShowTabWarningModal(false)
    setPendingTabSwitch(null)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Professional Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Document Intelligence Platform
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-gray-300 max-w-2xl mx-auto">
          Upload documents and get instant AI-powered insights, analysis, and answers
        </p>
      </div>

      {/* Main Upload Card - Compact and Professional */}
      <Card className="shadow-2xl border-0 bg-white/90 dark:bg-[#121212] backdrop-blur-sm animate-fade-in-scale">
        <CardContent className="p-6">
          <Tabs value={inputMode} onValueChange={handleTabSwitch} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100 dark:bg-gray-700 p-1 rounded-xl h-auto">
              <TabsTrigger 
                value="file" 
                className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:shadow-md rounded-lg py-2.5 px-3 text-sm transition-all duration-200 font-medium"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Single File</span>
                <span className="sm:hidden">File</span>
                <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 text-xs px-1.5 py-0.5 hidden sm:block">
                  PDF
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="collection" 
                className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:shadow-md rounded-lg py-2.5 px-3 text-sm transition-all duration-200 font-medium"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Collection</span>
                <span className="sm:hidden">Collection</span>
                <Badge variant="secondary" className="ml-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 text-xs px-1.5 py-0.5 hidden sm:block">
                  Multiple
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="text" 
                className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:shadow-md rounded-lg py-2.5 px-3 text-sm transition-all duration-200 font-medium"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Paste Text</span>
                <span className="sm:hidden">Text</span>
                <Badge variant="secondary" className=" ml-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200 text-xs px-1.5 py-0.5 hidden sm:block">
                  Direct
                </Badge>
              </TabsTrigger>
            </TabsList>

            <form onSubmit={inputMode === 'collection' ? handleCollectionUpload : handleSubmit}>
              <TabsContent value="file" className="space-y-4 animate-tab-enter">
                <div className="relative group">
                  <div 
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 touch-manipulation ${
                      dragActive 
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-900/30 scale-[1.02] shadow-lg' 
                        : 'border-slate-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 group-hover:bg-blue-50/30 dark:group-hover:bg-blue-900/10'
                    }`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <Input
                      ref={fileInputRef}
                      type="file"
                      id="file-input"
                      accept=".pdf"
                      onChange={handleFileChangeWithModal}
                      className="hidden"
                    />
                    <label htmlFor="file-input" className="cursor-pointer block">
                      {file || stagedFiles.length > 0 ? (
                        <div className="space-y-4">
                          {/* Header with file count */}
                          <div className="flex items-center justify-center">
                            <div className="flex items-center gap-2">
                              <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full">
                                <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                                  {stagedFiles.length > 0 ? `${stagedFiles.length} files ready` : 'File ready'}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-gray-400">
                                  {stagedFiles.length > 0 ? 'Click to add more or drop files here' : 'Click to change or drop file here'}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Files list within the upload area */}
                          <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg border border-slate-200/50 dark:border-gray-600/50 p-3 max-h-32 overflow-y-auto">
                            <div className="grid gap-2">
                              {/* Show single file if exists */}
                              {file && stagedFiles.length === 0 && (
                                <div className="flex items-center justify-between p-2 bg-white/80 dark:bg-gray-700/80 rounded border border-slate-200/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-700 transition-colors">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                        {file.name}
                                      </p>
                                      <p className="text-xs text-slate-500 dark:text-gray-400">
                                        {(file.size / 1024 / 1024).toFixed(1)} MB
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      setFile(null)
                                    }}
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                              {/* Show staged files */}
                              {stagedFiles.map((stagedFile, index) => (
                                <div 
                                  key={index} 
                                  className="flex items-center justify-between p-2 bg-white/80 dark:bg-gray-700/80 rounded border border-slate-200/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                        {stagedFile.name}
                                      </p>
                                      <p className="text-xs text-slate-500 dark:text-gray-400">
                                        {(stagedFile.size / 1024 / 1024).toFixed(1)} MB
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      removeStagedFile(index)
                                    }}
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 text-xs">
                            Ready for Analysis
                          </Badge>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 dark:bg-gray-700 rounded-full group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                            <Upload className="h-6 w-6 text-slate-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-slate-900 dark:text-white">Drop file here</p>
                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">or click to browse • Single file only</p>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                  
                  {/* Compact File Info */}
                  <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      <span>PDF</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Max 5MB</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      <span>Secure</span>
                    </div>
                  </div>
                  

                </div>
              </TabsContent>

              <TabsContent value="collection" className="space-y-4 animate-tab-enter">
                {/* Collection Name Input */}
                <div className="space-y-2">
                  <label htmlFor="collection-name" className="text-sm font-medium text-slate-700 dark:text-gray-300">
                    Collection Name<span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="collection-name"
                    type="text"
                    value={collectionName || ''}
                    onChange={(e) => setCollectionName(e.target.value)}
                    placeholder="e.g., Marketing Plan Docs, Research Project A"
                    className="bg-white dark:bg-gray-700 border-slate-200 dark:border-gray-600 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-gray-400"
                  />
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    Give your collection a descriptive name
                  </p>
                </div>

                {/* Collection Upload Area */}
                <div className="relative group">
                  <div 
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 touch-manipulation ${
                      dragActive 
                        ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-900/30 scale-[1.02] shadow-lg' 
                        : 'border-purple-300 dark:border-purple-600 hover:border-purple-400 dark:hover:border-purple-500 group-hover:bg-purple-50/30 dark:group-hover:bg-purple-900/10'
                    }`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <Input
                      ref={collectionInputRef}
                      type="file"
                      id="collection-input"
                      accept=".pdf"
                      multiple
                      onChange={handleFileChangeWithModal}
                      className="hidden"
                    />
                    <label htmlFor="collection-input" className="cursor-pointer block">
                      {stagedFiles.length > 0 ? (
                        <div className="space-y-4">
                          {/* Header with file count and clear button */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="inline-flex items-center justify-center w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-full">
                                <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div>
                                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                                  {stagedFiles.length} files selected
                                </p>
                                <p className="text-xs text-slate-500 dark:text-gray-400">Click to add more or drop files here</p>
                                {collectionName && (
                                  <Badge className="mt-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 text-xs">
                                    {collectionName}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                clearStagedFiles()
                              }}
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border-red-300 hover:border-red-400"
                            >
                              Clear All
                            </Button>
                          </div>
                          
                          {/* Files list within the upload area */}
                          <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg border border-purple-200/50 dark:border-purple-600/50 p-3 max-h-32 overflow-y-auto">
                            <div className="grid gap-2">
                              {stagedFiles.map((stagedFile, index) => (
                                <div 
                                  key={index} 
                                  className="flex items-center justify-between p-2 bg-white/80 dark:bg-gray-700/80 rounded border border-purple-200/50 dark:border-purple-600/50 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                        {stagedFile.name}
                                      </p>
                                      <p className="text-xs text-slate-500 dark:text-gray-400">
                                        {(stagedFile.size / 1024 / 1024).toFixed(1)} MB
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      removeStagedFile(index)
                                    }}
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 dark:bg-gray-700 rounded-full group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40 transition-colors">
                            <Upload className="h-6 w-6 text-slate-400 dark:text-gray-500 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-slate-900 dark:text-white">Upload Collection</p>
                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Select multiple files to create a collection • Multiple files required</p>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                  
                  {/* Compact File Info */}
                  <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      <span>PDF</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Max 5MB per file, 10MB total</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      <span>Organized</span>
                    </div>
                  </div>
                  

                </div>
              </TabsContent>

              <TabsContent value="text" className="space-y-4 animate-tab-enter">
                <div className="space-y-3">
                  <Textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Paste your document text here for instant analysis."
                    className="min-h-[200px] text-sm bg-white dark:bg-gray-700 border-slate-200 dark:border-gray-600 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-gray-400 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-gray-400">
                    <span>Maximum 50,000 characters</span>
                    <span className={textInput.length > 45000 ? 'text-amber-500' : ''}>
                      {textInput.length.toLocaleString()} / 50,000
                    </span>
                  </div>
                </div>
              </TabsContent>

              {/* Professional Submit Button */}
              <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-gray-700/50">
                <Button 
                  type="submit" 
                  disabled={loading || 
                    (inputMode === 'file' && !file && stagedFiles.length === 0) || 
                    (inputMode === 'collection' && (stagedFiles.length === 0 || !collectionName?.trim())) || 
                    (inputMode === 'text' && !textInput.trim())}
                  className="w-full h-12 dark:bg-white dark:hover:bg-[#1f1f1f] dark:hover:text-white text-black text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 touch-manipulation"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span>Analyzing Document...</span>
                      <span className="ml-2 px-2 py-1 bg-white/20 rounded text-xs">
                        Please wait
                      </span>
                    </>
                  ) : (
                    <>
                      {/* <Brain className="h-4 w-4 mr-2" /> */}
                      <span>
                        {inputMode === 'collection' ? 'Start Collection Analysis' : 'Start Analysis'}
                      </span>
                      {/* <Sparkles className="h-4 w-4 ml-2" /> */}
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Error Modal */}
            {showErrorModal && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      File Upload Error
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {modalError.split('\n').map((line, index) => (
                        <p key={index} className="text-sm text-red-600 dark:text-red-400">
                          {line}
                        </p>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowErrorModal(false)}
                      >
                        Close
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tab Switch Warning Modal */}
            {showTabWarningModal && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-2xl dark:bg-[#121212]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      Switch Tab Warning
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-slate-700 dark:text-gray-300">
                        Switching tabs will clear your current content. Are you sure you want to continue?
                      </p>
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          <strong>This will clear:</strong>
                        </p>
                        <ul className="text-xs text-amber-600 dark:text-amber-400 mt-1 space-y-1">
                          {inputMode === 'file' && (file || stagedFiles.length > 0) && (
                            <>
                              {file && stagedFiles.length === 0 && (
                                <li>• File: "{file.name}"</li>
                              )}
                              {stagedFiles.length > 0 && (
                                <>
                                  <li>• {stagedFiles.length} file(s):</li>
                                  {stagedFiles.slice(0, 3).map((f, i) => (
                                    <li key={i} className="ml-4">- {f.name}</li>
                                  ))}
                                  {stagedFiles.length > 3 && (
                                    <li className="ml-4">- ... and {stagedFiles.length - 3} more</li>
                                  )}
                                </>
                              )}
                            </>
                          )}
                          {inputMode === 'collection' && stagedFiles.length > 0 && (
                            <>
                              <li>• {stagedFiles.length} collection file(s):</li>
                              {stagedFiles.slice(0, 3).map((f, i) => (
                                <li key={i} className="ml-4">- {f.name}</li>
                              ))}
                              {stagedFiles.length > 3 && (
                                <li className="ml-4">- ... and {stagedFiles.length - 3} more</li>
                              )}
                            </>
                          )}
                          {inputMode === 'collection' && collectionName && (
                            <li>• Collection name: "{collectionName}"</li>
                          )}
                          {inputMode === 'text' && textInput.trim() && (
                            <li>• Text content ({textInput.length} characters)</li>
                          )}
                        </ul>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowTabWarningModal(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={confirmTabSwitch}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        Switch Tab
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Collection Warning Modal */}
            {showCollectionWarningModal && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      Collection Requirement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-slate-700 dark:text-gray-300">
                        Collections are designed for multiple documents. Please select more than one file to create a collection.
                      </p>
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          <strong>For single files:</strong>
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Use the "Single File" tab instead of "Collection"
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                      <Button 
                        onClick={() => setShowCollectionWarningModal(false)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Got it
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
})

export default ModernUploadInterface 