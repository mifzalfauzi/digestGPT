import React, { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs'
import { Alert, AlertDescription } from './ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Brain, FileText, AlertTriangle, Eye, Sparkles, Target, Search, ChevronRight } from 'lucide-react'
import HighlightableText from './HighlightableText'
import MarkdownRenderer from './MarkdownRenderer'

function ModernDocumentViewer({ results, file, inputMode }) {
  const [activeHighlight, setActiveHighlight] = useState(null)
  const [highlights, setHighlights] = useState([])
  const BASE_URL = import.meta.env.VITE_API_BASE_URL

  const getFileUrl = () => {
    // For newly uploaded files with file object
    if (file && inputMode === 'file' && file.type === 'application/pdf') {
      return URL.createObjectURL(file)
    }
    // For historical documents with file_url from backend
    if (results?.file_url && results.filename?.toLowerCase().endsWith('.pdf')) {
      return results.file_url
    }
    return null
  }

  const isPDF = (file && file.type === 'application/pdf') || 
    (results?.filename?.toLowerCase().endsWith('.pdf') && results?.file_url)

  // Debug function to check data structure
  useEffect(() => {
    console.log('DocumentViewer - Results:', results)
    console.log('DocumentViewer - Analysis:', results?.analysis)
    
    if (!results?.analysis) {
      setHighlights([])
      return
    }

    const newHighlights = []

    // Add key points highlights - handle both old and new formats
    if (results.analysis.key_points) {
      results.analysis.key_points.forEach((keyPoint, index) => {
        console.log('Processing key point:', keyPoint)
        
        // Handle new object format
        if (typeof keyPoint === 'object' && keyPoint.position && keyPoint.position.found) {
          newHighlights.push({
            id: `keypoint-${index}`,
            type: 'keypoint',
            position: keyPoint.position,
            text: keyPoint.text,
            quote: keyPoint.quote,
            tooltip: `Key Point: ${keyPoint.text}`
          })
        }
        // Handle old string format - create dummy position for backward compatibility
        else if (typeof keyPoint === 'string') {
          // Try to find the text in document for old format
          const documentText = results.document_text || ''
          const firstWords = keyPoint.split(' ').slice(0, 5).join(' ')
          const position = documentText.toLowerCase().indexOf(firstWords.toLowerCase())
          
          if (position !== -1) {
            newHighlights.push({
              id: `keypoint-${index}`,
              type: 'keypoint',
              position: {
                start: position,
                end: position + firstWords.length,
                found: true
              },
              text: keyPoint,
              quote: firstWords,
              tooltip: `Key Point: ${keyPoint}`
            })
          }
        }
      })
    }

    // Add risk flags highlights - handle both old and new formats
    if (results.analysis.risk_flags) {
      results.analysis.risk_flags.forEach((riskFlag, index) => {
        console.log('Processing risk flag:', riskFlag)
        
        // Handle new object format
        if (typeof riskFlag === 'object' && riskFlag.position && riskFlag.position.found) {
          newHighlights.push({
            id: `risk-${index}`,
            type: 'risk',
            position: riskFlag.position,
            text: riskFlag.text,
            quote: riskFlag.quote,
            tooltip: `Risk Flag: ${riskFlag.text}`
          })
        }
        // Handle old string format
        else if (typeof riskFlag === 'string') {
          const documentText = results.document_text || ''
          const firstWords = riskFlag.replace('🚩', '').trim().split(' ').slice(0, 5).join(' ')
          const position = documentText.toLowerCase().indexOf(firstWords.toLowerCase())
          
          if (position !== -1) {
            newHighlights.push({
              id: `risk-${index}`,
              type: 'risk',
              position: {
                start: position,
                end: position + firstWords.length,
                found: true
              },
              text: riskFlag,
              quote: firstWords,
              tooltip: `Risk Flag: ${riskFlag}`
            })
          }
        }
      })
    }

    console.log('Generated highlights:', newHighlights)
    setHighlights(newHighlights)
  }, [results])

  const handleItemClick = (id) => {
    console.log('Item clicked:', id)
    setActiveHighlight(activeHighlight === id ? null : id)
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-800 border-l border-slate-200 dark:border-gray-700">
      {/* Modern Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 rounded-xl">
            <Eye className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Document Analysis</h2>
            {results?.filename && (
              <div className="flex items-center gap-2">
                <FileText className="h-3 w-3 text-slate-500" />
                <p className="text-sm text-slate-500 dark:text-gray-400 truncate">
                  {results.filename}
                </p>
                <Badge className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                  Analyzed
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue={isPDF ? "document" : "text"} className="h-full flex flex-col">
          <div className="px-6 pt-4">
            <TabsList className={`grid w-full ${isPDF ? 'grid-cols-5' : 'grid-cols-4'} bg-slate-100 dark:bg-gray-700 p-1 rounded-xl`}>
              {isPDF && (
                <TabsTrigger value="document" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 rounded-lg">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">PDF</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="text" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 rounded-lg">
                <Search className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Text</span>
              </TabsTrigger>
              <TabsTrigger value="summary" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 rounded-lg">
                <Brain className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Summary</span>
              </TabsTrigger>
              <TabsTrigger value="keypoints" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 rounded-lg">
                <Target className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Insights</span>
              </TabsTrigger>
              <TabsTrigger value="risks" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 rounded-lg">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Risks</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden px-6 pb-6">
            {isPDF && (
              <TabsContent value="document" className="h-full mt-4">
                <Card className="h-full border-0 shadow-lg">
                  <CardContent className="p-0 h-full">
                    <div className="h-full border border-slate-200 dark:border-gray-600 rounded-xl overflow-hidden">
                      <iframe
                        src={getFileUrl()}
                        className="w-full h-full"
                        title="PDF Document"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="text" className="h-full mt-4 overflow-auto">
              <Card className="h-full border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      📄 Document Text
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                        Interactive
                      </Badge>
                    </CardTitle>
                    {highlights.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {highlights.length} highlights found
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="bg-slate-50 dark:bg-gray-700 rounded-xl p-4 max-h-[60vh] overflow-auto">
                    {results?.document_text ? (
                      <HighlightableText 
                        text={results.document_text}
                        highlights={highlights}
                        activeHighlight={activeHighlight}
                        onHighlightClick={handleItemClick}
                      />
                    ) : (
                      <div className="text-center py-8">
                        <Search className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-500 dark:text-gray-400 italic">
                          Document text will appear here after analysis...
                        </p>
                      </div>
                    )}
                  </div>
                  {highlights.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                        <Sparkles className="h-4 w-4" />
                        <span>Click on insights or risks below to highlight them in the text above</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="summary" className="h-full mt-4 overflow-auto">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    📋 AI Summary
                    <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200">
                      <Brain className="h-3 w-3 mr-1" />
                      AI Generated
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6">
                    <MarkdownRenderer 
                      content={results?.analysis?.summary || 'Summary will appear here after analysis...'}
                      className="text-slate-700 dark:text-gray-300 leading-relaxed"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="keypoints" className="h-full mt-4 overflow-auto">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    🔑 Key Insights
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                      <Target className="h-3 w-3 mr-1" />
                      {results?.analysis?.key_points?.length || 0} found
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {results?.analysis?.key_points && results.analysis.key_points.length > 0 ? (
                    <div className="space-y-4">
                      {results.analysis.key_points.map((point, index) => {
                        const pointText = typeof point === 'string' ? point : point.text
                        const highlightId = `keypoint-${index}`
                        const isActive = activeHighlight === highlightId
                        const hasHighlight = highlights.find(h => h.id === highlightId)
                        
                        return (
                          <Card 
                            key={index} 
                            className={`transition-all duration-300 cursor-pointer group ${
                              hasHighlight ? 'hover:shadow-lg' : 'cursor-default'
                            } ${
                              isActive
                                ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-600 shadow-lg transform scale-[1.02]'
                                : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-600'
                            }`}
                            onClick={() => hasHighlight && handleItemClick(highlightId)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-200 dark:bg-blue-800' : 'bg-blue-100 dark:bg-blue-900/40'}`}>
                                  <Target className={`h-4 w-4 ${isActive ? 'text-blue-700 dark:text-blue-200' : 'text-blue-600 dark:text-blue-400'}`} />
                                </div>
                                <div className="flex-1">
                                  <MarkdownRenderer 
                                    content={pointText}
                                    className="text-slate-700 dark:text-gray-300 leading-relaxed"
                                  />
                                  {hasHighlight && (
                                    <div className="mt-3 flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 border-blue-300 dark:border-blue-700"
                                      >
                                        <Search className="h-3 w-3 mr-1" />
                                        {isActive ? 'Hide highlight' : 'Show in text'}
                                        <ChevronRight className="h-3 w-3 ml-1" />
                                      </Button>
                                      {point.quote && (
                                        <Badge variant="outline" className="text-xs text-blue-600 dark:text-blue-400">
                                          "{point.quote.substring(0, 30)}..."
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Target className="h-12 w-12 text-slate-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-slate-500 dark:text-gray-400">
                        No key insights identified yet. Upload and analyze a document to see key points.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="risks" className="h-full mt-4 overflow-auto">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    🚩 Risk Assessment
                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {results?.analysis?.risk_flags?.length || 0} risks
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {results?.analysis?.risk_flags && results.analysis.risk_flags.length > 0 ? (
                    <div className="space-y-4">
                      {results.analysis.risk_flags.map((flag, index) => {
                        const flagText = typeof flag === 'string' ? flag : flag.text
                        const highlightId = `risk-${index}`
                        const isActive = activeHighlight === highlightId
                        const hasHighlight = highlights.find(h => h.id === highlightId)
                        
                        return (
                          <Alert 
                            key={index}
                            variant="destructive" 
                            className={`transition-all duration-300 cursor-pointer group ${
                              hasHighlight ? 'hover:shadow-lg' : 'cursor-default'
                            } ${
                              isActive
                                ? 'dark:bg-red-900/40 dark:border-red-600 ring-2 ring-red-400 shadow-lg transform scale-[1.02]'
                                : 'dark:bg-red-900/20 dark:border-red-800 hover:dark:border-red-600'
                            }`}
                            onClick={() => hasHighlight && handleItemClick(highlightId)}
                          >
                            <div className="flex items-start gap-3">
                              <AlertTriangle className={`h-4 w-4 mt-0.5 ${isActive ? 'text-red-600 dark:text-red-300' : ''}`} />
                              <div className="flex-1">
                                <AlertDescription className="dark:text-red-300 leading-relaxed">
                                  <MarkdownRenderer content={flagText} />
                                </AlertDescription>
                                {hasHighlight && (
                                  <div className="mt-3 flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 border-red-300 dark:border-red-700"
                                    >
                                      <Search className="h-3 w-3 mr-1" />
                                      {isActive ? 'Hide highlight' : 'Show in text'}
                                      <ChevronRight className="h-3 w-3 ml-1" />
                                    </Button>
                                    {flag.quote && (
                                      <Badge variant="outline" className="text-xs text-red-600 dark:text-red-400">
                                        "{flag.quote.substring(0, 30)}..."
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Alert>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-8">
                        <div className="text-green-600 dark:text-green-400 text-center">
                          <div className="p-4 bg-green-100 dark:bg-green-900/40 rounded-full w-fit mx-auto mb-4">
                            <AlertTriangle className="h-8 w-8 text-green-600 dark:text-green-400" />
                          </div>
                          <h3 className="font-bold text-lg mb-2">No Risk Flags Detected</h3>
                          <p className="text-sm">The document appears to be low risk based on our AI analysis.</p>
                          <Badge className="mt-3 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
                            <Sparkles className="h-3 w-3 mr-1" />
                            All Clear
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

export default ModernDocumentViewer 