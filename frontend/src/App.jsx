import React, { useState } from 'react'
import axios from 'axios'
import ModernSidebar from './components/ModernSidebar'
import ModernUploadInterface from './components/ModernUploadInterface'
import ModernChatPanel from './components/ModernChatPanel'
import EnhancedDocumentViewer from './components/EnhancedDocumentViewer'
import { ThemeProvider } from './components/ThemeProvider'

function App() {
  const [file, setFile] = useState(null)
  const [textInput, setTextInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [inputMode, setInputMode] = useState('file') // 'file' or 'text'
  const [documentId, setDocumentId] = useState(null)
  const [currentView, setCurrentView] = useState('upload') // 'upload' or 'workspace'

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      // Check file type
      if (!selectedFile.name.toLowerCase().endsWith('.pdf') && !selectedFile.name.toLowerCase().endsWith('.docx')) {
        setError('Please select a PDF or DOCX file')
        return
      }
      // Check file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File too large. Maximum size is 10MB')
        return
      }
      setFile(selectedFile)
      setError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResults(null)

    try {
      let response
      
      if (inputMode === 'file') {
        if (!file) {
          setError('Please select a file')
          setLoading(false)
          return
        }
        
        const formData = new FormData()
        formData.append('file', file)
        
        response = await axios.post('http://localhost:8000/analyze-file', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      } else {
        if (!textInput.trim()) {
          setError('Please enter some text')
          setLoading(false)
          return
        }
        
        const formData = new FormData()
        formData.append('text', textInput)
        
        response = await axios.post('http://localhost:8000/analyze-text', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      }
      
      console.log('API Response:', response.data) // Debug log
      setResults(response.data)
      setDocumentId(response.data.document_id)
      setCurrentView('workspace')
    } catch (err) {
      console.error('Error:', err)
      if (err.response?.data?.detail) {
        setError(err.response.data.detail)
      } else {
        setError('An error occurred while processing your request')
      }
    } finally {
      setLoading(false)
    }
  }

  const resetToHome = () => {
    setFile(null)
    setTextInput('')
    setResults(null)
    setError('')
    setDocumentId(null)
    setCurrentView('upload')
    // Reset file input
    const fileInput = document.getElementById('file-input')
    if (fileInput) fileInput.value = ''
  }

  const handleNewDocument = () => {
    resetToHome()
  }

  return (
    <ThemeProvider>
      <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 flex">
        {currentView === 'upload' ? (
          /* Modern Upload View */
          <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-purple-100/20 to-pink-100/20 dark:from-blue-900/10 dark:via-purple-900/10 dark:to-pink-900/10"></div>
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200/30 dark:bg-blue-800/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-200/30 dark:bg-purple-800/20 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 w-full">
              <ModernUploadInterface
                file={file}
                textInput={textInput}
                setTextInput={setTextInput}
                inputMode={inputMode}
                setInputMode={setInputMode}
                handleFileChange={handleFileChange}
                handleSubmit={handleSubmit}
                loading={loading}
                error={error}
              />
            </div>
          </div>
        ) : (
          /* Modern Workspace View */
          <>
            {/* Left Sidebar */}
            <ModernSidebar 
              onNewDocument={handleNewDocument}
              onHome={resetToHome}
              currentDocument={results?.filename || "Pasted Text"}
            />

            {/* Center Panel - Chat */}
            <div className="flex-1 min-w-0">
              {documentId ? (
                <ModernChatPanel 
                  documentId={documentId}
                  filename={results?.filename || "Pasted Text"}
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-800">
                  <div className="text-center space-y-4">
                    <div className="p-4 bg-blue-100 dark:bg-blue-900/40 rounded-full w-fit mx-auto">
                      <svg className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-semibold text-slate-700 dark:text-gray-300">Processing Document</p>
                      <p className="text-sm text-slate-500 dark:text-gray-400">AI analysis in progress...</p>
              </div>
                  </div>
                </div>
              )}
                </div>

            {/* Right Panel - Enhanced Document Viewer */}
            <div className="w-1/3 min-w-[420px]">
              <EnhancedDocumentViewer 
                results={results}
                file={file}
                inputMode={inputMode}
              />
            </div>
          </>
        )}
      </div>
    </ThemeProvider>
  )
}

export default App 