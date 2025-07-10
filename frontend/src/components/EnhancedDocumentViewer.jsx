import React, { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Eye, FileText, Brain, TrendingUp, Clock, Sparkles } from 'lucide-react'
import ProfessionalAnalysisDisplay from './ProfessionalAnalysisDisplay'
import HighlightableText from './HighlightableText'

function EnhancedDocumentViewer({ results, file, inputMode }) {
  const [activeHighlight, setActiveHighlight] = useState(null)
  const [highlights, setHighlights] = useState([])
  const [activeTab, setActiveTab] = useState('')

  const getFileUrl = () => {
    if (file && inputMode === 'file' && file.type === 'application/pdf') {
      return URL.createObjectURL(file)
    }
    return null
  }

  const isPDF = file && file.type === 'application/pdf'

  // Set default tab based on PDF availability
  useEffect(() => {
    if (!activeTab) {
      setActiveTab(isPDF ? "pdf" : "analysis")
    }
  }, [isPDF, activeTab])

  // Generate highlights for text interaction
  useEffect(() => {
    if (!results?.analysis) {
      setHighlights([])
      return
    }

    const newHighlights = []

    // Add key points highlights
    if (results.analysis.key_points) {
      results.analysis.key_points.forEach((keyPoint, index) => {
        if (typeof keyPoint === 'object' && keyPoint.position && keyPoint.position.found) {
          newHighlights.push({
            id: `insight-${index}`,
            type: 'insight',
            position: keyPoint.position,
            text: keyPoint.text,
            quote: keyPoint.quote,
            tooltip: `Key Insight: ${keyPoint.text}`
          })
        }
      })
    }

    // Add risk flags highlights
    if (results.analysis.risk_flags) {
      results.analysis.risk_flags.forEach((riskFlag, index) => {
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
      })
    }

    setHighlights(newHighlights)
  }, [results])

  const handleHighlightClick = (id) => {
    setActiveHighlight(activeHighlight === id ? null : id)
  }



  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-800 border-l border-slate-200 dark:border-gray-700">
      {/* Enhanced Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 rounded-xl">
              <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                AI Analysis Dashboard
              </h2>
              {results?.filename && (
                <div className="flex items-center gap-2 mt-1">
                  <FileText className="h-3 w-3 text-slate-500" />
                  <p className="text-sm text-slate-500 dark:text-gray-400 truncate max-w-[200px]">
                    {results.filename}
                  </p>
                  <Badge className="text-xs bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0">
                    <Sparkles className="h-2.5 w-2.5 mr-1" />
                    Analyzed
                  </Badge>
                </div>
              )}
            </div>
          </div>
          
          {/* Analysis Stats */}
          {results?.analysis && (
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {results.analysis.key_points?.length || 0}
                </div>
                <div className="text-xs text-slate-500 dark:text-gray-400">Insights</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600 dark:text-red-400">
                  {results.analysis.risk_flags?.length || 0}
                </div>
                <div className="text-xs text-slate-500 dark:text-gray-400">Risks</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  <Clock className="h-4 w-4 inline" />
                </div>
                <div className="text-xs text-slate-500 dark:text-gray-400">Live</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="px-6 pt-4">
            <TabsList className={`grid w-full ${isPDF ? 'grid-cols-3' : 'grid-cols-2'} bg-slate-100 dark:bg-gray-700 p-1 rounded-xl`}>
              {isPDF && (
                <TabsTrigger value="pdf" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 rounded-lg">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">PDF Viewer</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="analysis" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 rounded-lg">
                <Brain className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">AI Analysis</span>
              </TabsTrigger>
              <TabsTrigger value="document" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 rounded-lg">
                <Eye className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Interactive Text</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            {/* PDF Viewer Tab */}
            {isPDF && (
              <TabsContent value="pdf" className="h-full mt-4 px-6 pb-6">
                <Card className="h-full border-0 shadow-xl">
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

            {/* Professional AI Analysis Tab */}
            <TabsContent value="analysis" className="h-full mt-4 overflow-auto">
              <ProfessionalAnalysisDisplay 
                results={results}
                onHighlightClick={handleHighlightClick}
                activeHighlight={activeHighlight}
              />
            </TabsContent>

            {/* Interactive Document Text Tab */}
            <TabsContent value="document" className="h-full mt-4 overflow-auto px-6 pb-6">
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                        <Eye className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                          Interactive Document
                        </CardTitle>
                        <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
                          Full document text with intelligent highlighting
                        </p>
                      </div>
                    </div>
                    {highlights.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                          {highlights.length} highlights
                        </Badge>
                        {/* <Badge variant="outline" className="text-xs">
                          Click insights/risks in Analysis tab
                        </Badge> */}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {results?.document_text ? (
                    <div className="space-y-4">
                      {/* Interactive Text Display */}
                      <div className="bg-slate-50 dark:bg-gray-800 rounded-2xl p-6 max-h-[70vh] overflow-auto border border-slate-200 dark:border-gray-700">
                        <HighlightableText 
                          text={results.document_text}
                          highlights={highlights}
                          activeHighlight={activeHighlight}
                          onHighlightClick={handleHighlightClick}
                        />
                      </div>
                      
                      {/* Instructions */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-medium mb-2">
                            <TrendingUp className="h-4 w-4" />
                            Key Insights
                          </div>
                          <p className="text-sm text-emerald-700 dark:text-emerald-300">
                            Navigate to the Analysis tab and click on any insight to see it highlighted here in green.
                          </p>
                        </div>
                        
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                          <div className="flex items-center gap-2 text-red-800 dark:text-red-200 font-medium mb-2">
                            <TrendingUp className="h-4 w-4" />
                            Risk Flags
                          </div>
                          <p className="text-sm text-red-700 dark:text-red-300">
                            Click on any risk assessment in the Analysis tab to see it highlighted here in red.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="p-4 bg-slate-100 dark:bg-gray-700 rounded-full w-fit mx-auto mb-4">
                        <FileText className="h-8 w-8 text-slate-400 dark:text-gray-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-700 dark:text-gray-300 mb-2">
                        No Document Text Available
                      </h3>
                      <p className="text-slate-500 dark:text-gray-400">
                        Upload and analyze a document to see the interactive text view.
                      </p>
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

export default EnhancedDocumentViewer 