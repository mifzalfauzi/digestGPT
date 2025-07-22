import React, { useState } from 'react'
import axios from 'axios'
import { Button } from './ui/button'
import { RefreshCw, Brain, CheckCircle, AlertCircle } from 'lucide-react'

function ReanalysisButton({ documentId, onReanalysisComplete }) {
  const [isReanalyzing, setIsReanalyzing] = useState(false)
  const [reanalysisStatus, setReanalysisStatus] = useState(null) // 'success', 'error', or null

  const handleReanalysis = async () => {
    if (!documentId) return

    setIsReanalyzing(true)
    setReanalysisStatus(null)

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await axios.post(
        `http://localhost:8000/documents/${documentId}/reanalyze`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.data) {
        setReanalysisStatus('success')
        
        // Call the completion callback with new results
        if (onReanalysisComplete) {
          onReanalysisComplete(response.data)
        }

        // Auto-refresh the page after a short delay to show new analysis
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }

    } catch (error) {
      console.error('Re-analysis failed:', error)
      setReanalysisStatus('error')
      
      // Reset error status after 5 seconds
      setTimeout(() => {
        setReanalysisStatus(null)
      }, 5000)
    } finally {
      setIsReanalyzing(false)
    }
  }

  if (reanalysisStatus === 'success') {
    return (
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
        <CheckCircle className="h-5 w-5" />
        <span className="text-sm font-medium">Re-analysis completed! Refreshing...</span>
      </div>
    )
  }

  if (reanalysisStatus === 'error') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-medium">Re-analysis failed. Please try again.</span>
        </div>
        <Button
          onClick={handleReanalysis}
          disabled={isReanalyzing}
          className="bg-orange-600 hover:bg-orange-700 text-white"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={handleReanalysis}
      disabled={isReanalyzing}
      className="bg-orange-600 hover:bg-orange-700 text-white"
      size="sm"
    >
      {isReanalyzing ? (
        <>
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          Re-analyzing...
        </>
      ) : (
        <>
          <Brain className="h-4 w-4 mr-2" />
          Re-analyze Document
        </>
      )}
    </Button>
  )
}

export default ReanalysisButton 