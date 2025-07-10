import React, { useState } from 'react'
import axios from 'axios'
import { Button } from './components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './components/ui/card'
import { Input } from './components/ui/input'
import { Textarea } from './components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs'
import { Alert, AlertDescription } from './components/ui/alert'
import { Separator } from './components/ui/separator'
import { Badge } from './components/ui/badge'
import { Upload, FileText, Brain, AlertTriangle, Loader2 } from 'lucide-react'
import ChatInterface from './ChatInterface'

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              DigestGPT
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Analyze your documents with AI-powered insights. Upload PDFs, DOCX files, or paste text to get summaries, key points, and risk assessments.
          </p>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Document Analysis</CardTitle>
            <CardDescription>
              Choose how you'd like to analyze your document
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={inputMode} onValueChange={setInputMode} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload File
                </TabsTrigger>
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Paste Text
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="mt-4">
                <TabsContent value="file" className="space-y-4">
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                      <Input
                        type="file"
                        id="file-input"
                        accept=".pdf,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label htmlFor="file-input" className="cursor-pointer block">
                        {file ? (
                          <div className="space-y-2">
                            <FileText className="h-12 w-12 mx-auto text-primary" />
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">Click to change file</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                            <p className="text-sm font-medium">Choose PDF or DOCX file</p>
                            <p className="text-xs text-muted-foreground">or drag and drop</p>
                          </div>
                        )}
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Supported formats: PDF, DOCX (max 10MB)
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="text" className="space-y-4">
                  <div className="space-y-4">
                    <Textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Paste your document text here..."
                      className="min-h-[200px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum 50,000 characters
                    </p>
                  </div>
                </TabsContent>

                <div className="flex gap-2 mt-6">
                  <Button 
                    type="submit" 
                    disabled={loading || (inputMode === 'file' && !file) || (inputMode === 'text' && !textInput.trim())}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Analyze Document
                      </>
                    )}
                  </Button>
                  
                  {(file || textInput || results) && (
                    <Button type="button" onClick={resetForm} variant="outline">
                      Reset
                    </Button>
                  )}
                </div>
              </form>
            </Tabs>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="max-w-4xl mx-auto mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {results && (
          <Card className="max-w-4xl mx-auto mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Analysis Results
              </CardTitle>
              {results.filename && (
                <CardDescription>
                  <FileText className="h-4 w-4 inline mr-1" />
                  {results.filename}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  📋 Summary
                </h3>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm leading-relaxed">{results.analysis.summary}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Key Points */}
              {results.analysis.key_points && results.analysis.key_points.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    🔑 Key Points
                  </h3>
                  <div className="space-y-2">
                    {results.analysis.key_points.map((point, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <p className="text-sm leading-relaxed">{point}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Flags */}
              {results.analysis.risk_flags && results.analysis.risk_flags.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    🚩 Risk Flags
                  </h3>
                  <div className="space-y-2">
                    {results.analysis.risk_flags.map((flag, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{flag}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {results && documentId && (
          <div className="max-w-4xl mx-auto mt-6">
            <ChatInterface 
              documentId={documentId} 
              filename={results.filename || "Pasted Text"}
            />
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Powered by Anthropic Claude • Built with React & FastAPI
          </p>
        </div>
      </div>
    </div>
  )
}

export default App 