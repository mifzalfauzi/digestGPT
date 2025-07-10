import React, { useState } from 'react'
import axios from 'axios'
import ChatInterface from './ChatInterface'
import './App.css'

function App() {
  const [file, setFile] = useState(null)
  const [textInput, setTextInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [inputMode, setInputMode] = useState('file') // 'file' or 'text'
  const [documentId, setDocumentId] = useState(null)

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
      
      setResults(response.data)
      setDocumentId(response.data.document_id)
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

  const resetForm = () => {
    setFile(null)
    setTextInput('')
    setResults(null)
    setError('')
    setDocumentId(null)
    // Reset file input
    const fileInput = document.getElementById('file-input')
    if (fileInput) fileInput.value = ''
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🧠 DigestGPT</h1>
        <p>Analyze your documents with AI-powered insights</p>
      </header>

      <main className="main">
        <div className="container">
          {/* Input Mode Toggle */}
          <div className="input-mode-toggle">
            <button 
              className={inputMode === 'file' ? 'active' : ''} 
              onClick={() => setInputMode('file')}
            >
              📁 Upload File
            </button>
            <button 
              className={inputMode === 'text' ? 'active' : ''} 
              onClick={() => setInputMode('text')}
            >
              📝 Paste Text
            </button>
          </div>

          <form onSubmit={handleSubmit} className="upload-form">
            {inputMode === 'file' ? (
              <div className="file-upload-section">
                <div className="file-upload">
                  <input
                    type="file"
                    id="file-input"
                    accept=".pdf,.docx"
                    onChange={handleFileChange}
                    className="file-input"
                  />
                  <label htmlFor="file-input" className="file-label">
                    {file ? (
                      <span>📄 {file.name}</span>
                    ) : (
                      <span>📁 Choose PDF or DOCX file</span>
                    )}
                  </label>
                </div>
                <p className="file-info">Supported formats: PDF, DOCX (max 10MB)</p>
              </div>
            ) : (
              <div className="text-input-section">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste your document text here..."
                  className="text-input"
                  rows={10}
                />
                <p className="text-info">Maximum 50,000 characters</p>
              </div>
            )}

            <div className="button-group">
              <button 
                type="submit" 
                disabled={loading || (inputMode === 'file' && !file) || (inputMode === 'text' && !textInput.trim())}
                className="submit-btn"
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Analyzing...
                  </>
                ) : (
                  '🔍 Analyze Document'
                )}
              </button>
              
              {(file || textInput || results) && (
                <button type="button" onClick={resetForm} className="reset-btn">
                  🔄 Reset
                </button>
              )}
            </div>
          </form>

          {error && (
            <div className="error">
              ⚠️ {error}
            </div>
          )}

          {results && (
            <div className="results">
              <h2>📊 Analysis Results</h2>
              
              {results.filename && (
                <div className="filename">
                  <strong>📄 File:</strong> {results.filename}
                </div>
              )}

              <div className="analysis-section">
                <h3>📋 Summary</h3>
                <p className="summary">{results.analysis.summary}</p>
              </div>

              {results.analysis.key_points && results.analysis.key_points.length > 0 && (
                <div className="analysis-section">
                  <h3>🔑 Key Points</h3>
                  <ul className="key-points">
                    {results.analysis.key_points.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              {results.analysis.risk_flags && results.analysis.risk_flags.length > 0 && (
                <div className="analysis-section">
                  <h3>🚩 Risk Flags</h3>
                  <ul className="risk-flags">
                    {results.analysis.risk_flags.map((flag, index) => (
                      <li key={index} className="risk-item">{flag}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {results && documentId && (
            <ChatInterface 
              documentId={documentId} 
              filename={results.filename || "Pasted Text"}
            />
          )}
        </div>
      </main>

      <footer className="footer">
        <p>Powered by Anthropic Claude • Built with React & FastAPI</p>
      </footer>
    </div>
  )
}

export default App 