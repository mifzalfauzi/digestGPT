import React, { useState, useEffect } from 'react'
import mammoth from 'mammoth'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { FileText, Download, Loader2, AlertTriangle } from 'lucide-react'

function DocxViewer({ file, onTextExtracted }) {
  const [pdfUrl, setPdfUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [downloadUrl, setDownloadUrl] = useState(null)

  useEffect(() => {
    if (file && file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      handleDocxToPdf()
      extractText()
    }
    // eslint-disable-next-line
  }, [file])

  const handleDocxToPdf = async () => {
    setLoading(true)
    setError(null)
    setPdfUrl(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('http://localhost:8000/convert-docx-to-pdf', {
        method: 'POST',
        body: formData
      })
      if (!response.ok) throw new Error('Failed to convert DOCX to PDF')
      const data = await response.json()
      setPdfUrl(data.pdf_url)
    } catch (err) {
      setError('Failed to convert DOCX to PDF. ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const extractText = async () => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      // Use extractRawText to get clean text without HTML tags for analysis
      const textResult = await mammoth.extractRawText({ arrayBuffer })
      
      if (onTextExtracted) {
        onTextExtracted(textResult.value)
      }
      
      // Create download URL for the original file
      const url = URL.createObjectURL(file)
      setDownloadUrl(url)
    } catch (err) {
      console.error('Text extraction error:', err)
      // ignore text extraction errors for now
    }
  }

  const handleDownload = () => {
    if (downloadUrl) {
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (loading) {
    return (
      <Card className="h-full border-0 shadow-xl">
        <CardContent className="p-0 h-full">
          <div className="h-full border border-slate-200 dark:border-gray-600 rounded-xl overflow-hidden relative">
            <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-gray-300">Converting DOCX to PDF</p>
                  <p className="text-xs text-slate-500 dark:text-gray-400">Please wait...</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="h-full border-0 shadow-xl">
        <CardContent className="p-0 h-full">
          <div className="h-full border border-slate-200 dark:border-gray-600 rounded-xl overflow-hidden relative">
            <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-gray-300">Error Loading Document</p>
                  <p className="text-xs text-slate-500 dark:text-gray-400">{error}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!pdfUrl) {
    return (
      <Card className="h-full border-0 shadow-xl">
        <CardContent className="p-0 h-full">
          <div className="h-full border border-slate-200 dark:border-gray-600 rounded-xl overflow-hidden relative">
            <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-slate-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="h-6 w-6 text-slate-400 dark:text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-gray-300">No PDF Available</p>
                  <p className="text-xs text-slate-500 dark:text-gray-400">Select a DOCX file to view</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full border-0 shadow-xl">
      <CardHeader className="px-4 py-3 border-b border-slate-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                DOCX Viewer
              </CardTitle>
              <p className="text-xs text-slate-600 dark:text-gray-400 mt-1">
                {file?.name || 'Document'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {downloadUrl && (
              <button
                onClick={handleDownload}
                className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
                title="Download original file"
              >
                <Download className="h-4 w-4 text-slate-600 dark:text-gray-400" />
              </button>
            )}
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
              DOCX
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 h-full">
        <div className="h-full border border-slate-200 dark:border-gray-600 rounded-xl overflow-hidden">
          <iframe
            src={`http://localhost:8000${pdfUrl}`}
            className="w-full h-full min-h-[60vh]"
            title="DOCX as PDF"
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default DocxViewer 