import React, { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs'
import { Alert, AlertDescription } from './ui/alert'
import { Brain, FileText, AlertTriangle, Eye } from 'lucide-react'
import HighlightableText from './HighlightableText'

function DocumentViewer({ results, file, inputMode }) {
  const [activeHighlight, setActiveHighlight] = useState(null)
  const [highlights, setHighlights] = useState([])

  const getFileUrl = () => {
    if (file && inputMode === 'file' && file.type === 'application/pdf') {
      return URL.createObjectURL(file)
    }
    return null
  }

  const isPDF = file && file.type === 'application/pdf'

  // Prepare highlights from analysis results
  useEffect(() => {
    if (!results?.analysis) {
      setHighlights([])
      return
    }

    const newHighlights = []

    // Add key points highlights
    results.analysis.key_points?.forEach((keyPoint, index) => {
      if (keyPoint.position && keyPoint.position.found) {
        newHighlights.push({
          id: `keypoint-${index}`,
          type: 'keypoint',
          position: keyPoint.position,
          text: keyPoint.text,
          quote: keyPoint.quote,
          tooltip: `Key Point: ${keyPoint.text}`
        })
      }
    })

    // Add risk flags highlights
    results.analysis.risk_flags?.forEach((riskFlag, index) => {
      if (riskFlag.position && riskFlag.position.found) {
        newHighlights.push({
          id: `risk-${index}`,
          type: 'risk',
          position: riskFlag.position,
          text: riskFlag.text,
          quote: riskFlag.quote,
          tooltip: `Risk Flag: ${riskFlag.text}`
        })
      }
    })

    setHighlights(newHighlights)
  }, [results])

  const handleItemClick = (id) => {
    setActiveHighlight(activeHighlight === id ? null : id)
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Document & Analysis</h2>
        </div>
        {results?.filename && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            <FileText className="h-4 w-4 inline mr-1" />
            {results.filename}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue={isPDF ? "document" : "text"} className="h-full flex flex-col">
          <TabsList className={`grid w-full mx-6 mt-4 ${isPDF ? 'grid-cols-5' : 'grid-cols-4'}`}>
            {isPDF && (
              <TabsTrigger value="document" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                PDF
              </TabsTrigger>
            )}
            <TabsTrigger value="text" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Text
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="keypoints" className="flex items-center gap-2">
              🔑 Key Points
            </TabsTrigger>
            <TabsTrigger value="risks" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Risks
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden px-6 pb-6">
            {isPDF && (
              <TabsContent value="document" className="h-full mt-4">
                <div className="h-full border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                  <iframe
                    src={getFileUrl()}
                    className="w-full h-full"
                    title="PDF Document"
                  />
                </div>
              </TabsContent>
            )}

            <TabsContent value="text" className="h-full mt-4 overflow-auto">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">📄 Document Text</h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-[60vh] overflow-auto">
                  {results?.document_text ? (
                    <HighlightableText 
                      text={results.document_text}
                      highlights={highlights}
                      activeHighlight={activeHighlight}
                      onHighlightClick={handleItemClick}
                    />
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">
                      Document text will appear here after analysis...
                    </p>
                  )}
                </div>
                {highlights.length > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    💡 Click on key points or risks below to highlight them in the text above
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="summary" className="h-full mt-4 overflow-auto">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">📋 Document Summary</h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {results?.analysis?.summary || 'Summary will appear here after analysis...'}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="keypoints" className="h-full mt-4 overflow-auto">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">🔑 Key Points</h3>
                {results?.analysis?.key_points && results.analysis.key_points.length > 0 ? (
                  <div className="space-y-3">
                    {results.analysis.key_points.map((point, index) => {
                      const pointText = typeof point === 'string' ? point : point.text
                      const highlightId = `keypoint-${index}`
                      const isActive = activeHighlight === highlightId
                      const hasHighlight = point.position && point.position.found
                      
                      return (
                        <div 
                          key={index} 
                          className={`rounded-lg p-4 transition-all duration-200 ${
                            hasHighlight 
                              ? 'cursor-pointer hover:shadow-md' 
                              : ''
                          } ${
                            isActive
                              ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-400 dark:border-blue-600'
                              : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                          }`}
                          onClick={() => hasHighlight && handleItemClick(highlightId)}
                        >
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {pointText}
                          </p>
                          {hasHighlight && (
                            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                              💡 Click to highlight in document • Quote: "{point.quote}"
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No key points identified yet. Upload and analyze a document to see key points.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="risks" className="h-full mt-4 overflow-auto">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">🚩 Risk Assessment</h3>
                {results?.analysis?.risk_flags && results.analysis.risk_flags.length > 0 ? (
                  <div className="space-y-3">
                    {results.analysis.risk_flags.map((flag, index) => {
                      const flagText = typeof flag === 'string' ? flag : flag.text
                      const highlightId = `risk-${index}`
                      const isActive = activeHighlight === highlightId
                      const hasHighlight = flag.position && flag.position.found
                      
                      return (
                        <Alert 
                          key={index} 
                          variant="destructive" 
                          className={`transition-all duration-200 ${
                            hasHighlight 
                              ? 'cursor-pointer hover:shadow-md' 
                              : ''
                          } ${
                            isActive
                              ? 'dark:bg-red-900/40 dark:border-red-600 ring-2 ring-red-500'
                              : 'dark:bg-red-900/20 dark:border-red-800'
                          }`}
                          onClick={() => hasHighlight && handleItemClick(highlightId)}
                        >
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="dark:text-red-300">
                            {flagText}
                            {hasHighlight && (
                              <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                                💡 Click to highlight in document • Quote: "{flag.quote}"
                              </div>
                            )}
                          </AlertDescription>
                        </Alert>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                      <div className="text-green-600 dark:text-green-400 text-center">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-green-500 dark:text-green-400" />
                        <p className="font-medium">No Risk Flags Detected</p>
                        <p className="text-sm mt-1">The document appears to be low risk based on our analysis.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

export default DocumentViewer 