import React, { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Eye, FileText, Brain, TrendingUp, Clock, Sparkles, Target, AlertTriangle, CheckCircle2, BookOpen } from 'lucide-react'
import ProfessionalAnalysisDisplay from './ProfessionalAnalysisDisplay'
import KeyConceptsDisplay from './KeyConceptsDisplay'
import HighlightableText from './HighlightableText'

function EnhancedDocumentViewer({ results, file, inputMode, onExplainConcept }) {
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
      setActiveTab(isPDF ? "pdf" : "document")
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

  const handleShowInDocument = (id) => {
    setActiveHighlight(id)
    setActiveTab('document')
    
    // Small delay to ensure tab switch completes before scrolling
    setTimeout(() => {
      const element = document.querySelector(`[data-highlight-id="${id}"]`)
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }
    }, 150)
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Enhanced Header - Responsive */}
      <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 rounded-xl">
              <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                AI Dashboard
              </h2>
              {results?.filename && (
                <div className="flex items-center gap-1 sm:gap-2 mt-1">
                  <FileText className="h-3 w-3 text-slate-500 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 truncate">
                    {results.filename}
                  </p>
                  <Badge className="text-xs bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 px-1.5 py-0.5">
                    <Sparkles className="h-2 w-2 mr-1" />
                    <span className="hidden sm:inline">Analyzed</span>
                    <span className="sm:hidden">✓</span>
                  </Badge>
                </div>
              )}
            </div>
          </div>
          
          {/* Analysis Stats - Responsive */}
          {/* {results?.analysis && (
            <div className="flex items-center justify-center lg:justify-end gap-2 sm:gap-4">
              <div className="text-center">
                <div className="text-sm sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {results.analysis.key_points?.length || 0}
                </div>
                <div className="text-xs text-slate-500 dark:text-gray-400">Insights</div>
              </div>
              <div className="text-center">
                <div className="text-sm sm:text-lg font-bold text-red-600 dark:text-red-400">
                  {results.analysis.risk_flags?.length || 0}
                </div>
                <div className="text-xs text-slate-500 dark:text-gray-400">Risks</div>
              </div>
              <div className="text-center">
                <div className="text-sm sm:text-lg font-bold text-blue-600 dark:text-blue-400">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 inline" />
                </div>
                <div className="text-xs text-slate-500 dark:text-gray-400">Live</div>
              </div>
            </div>
          )} */}
        </div>
      </div>

      {/* Enhanced Content - Responsive */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4">
            <TabsList className={`grid w-full ${isPDF ? 'grid-cols-4' : 'grid-cols-3'} bg-slate-100 dark:bg-gray-700 p-1 rounded-xl h-auto`}>
            <TabsTrigger value="analysis" className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 rounded-lg py-2 px-1 sm:px-3 text-xs sm:text-sm">
                <Brain className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                <span className="hidden lg:inline">AI Analysis</span>
                <span className="lg:hidden">AI</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 rounded-lg py-2 px-1 sm:px-3 text-xs sm:text-sm">
                <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                <span className="hidden lg:inline">Insights & Risks</span>
                <span className="lg:hidden">Insights</span>
              </TabsTrigger>
              {isPDF && (
                <TabsTrigger value="pdf" className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 rounded-lg py-2 px-1 sm:px-3 text-xs sm:text-sm">
                  <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                  <span className="hidden sm:inline">PDF Viewer</span>
                  <span className="sm:hidden">PDF</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="document" className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 rounded-lg py-2 px-1 sm:px-3 text-xs sm:text-sm">
                <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                <span className="hidden lg:inline">Interactive Text</span>
                <span className="lg:hidden">Text</span>
              </TabsTrigger>
             
             
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            {/* PDF Viewer Tab */}
            {isPDF && (
              <TabsContent value="pdf" className="h-full mt-2 sm:mt-4 px-3 sm:px-4 lg:px-6 pb-3 sm:pb-6">
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

            {/* AI Analysis Summary Tab */}
            <TabsContent value="analysis" className="h-full mt-2 sm:mt-4 overflow-auto px-3 sm:px-4 lg:px-6 pb-3 sm:pb-6">
              <Card className="border-0 mt-6 shadow-xl bg-gradient-to-br from-slate-50 to-white dark:from-gray-800 dark:to-gray-900">
                <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow-lg">
                      <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                        Executive Summary
                      </CardTitle>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 mt-1">
                        AI-powered analysis powered by Claude 4 Sonnet
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                  <div className="bg-gradient-to-r from-purple-50/80 to-blue-50/80 dark:from-purple-950/30 dark:to-blue-950/30 rounded-2xl p-4 sm:p-6 border border-purple-200/50 dark:border-purple-800/30">
                    <p className="text-slate-800 dark:text-slate-100 leading-relaxed text-sm sm:text-base font-medium">
                      {results?.analysis?.summary || 'Comprehensive analysis will appear here after document processing...'}
                    </p>
                  </div>
                  
                  {/* Quick Stats - Responsive Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mt-4 sm:mt-6">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl p-3 sm:p-4 border border-emerald-200/50 dark:border-emerald-800/30">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Target className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Insights</span>
                      </div>
                      <p className="text-lg sm:text-xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">
                        {results?.analysis?.key_points?.length || 0}
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 rounded-xl p-3 sm:p-4 border border-red-200/50 dark:border-red-800/30">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                        <span className="text-xs font-medium text-red-800 dark:text-red-200">Risks</span>
                      </div>
                      <p className="text-lg sm:text-xl font-bold text-red-900 dark:text-red-100 mt-1">
                        {results?.analysis?.risk_flags?.length || 0}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 rounded-xl p-3 sm:p-4 border border-amber-200/50 dark:border-amber-800/30">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-xs font-medium text-amber-800 dark:text-amber-200">Concepts</span>
                      </div>
                      <p className="text-lg sm:text-xl font-bold text-amber-900 dark:text-amber-100 mt-1">
                        {results?.analysis?.key_concepts?.length || 0}
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-3 sm:p-4 border border-blue-200/50 dark:border-blue-800/30">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Status</span>
                      </div>
                      <p className="text-lg sm:text-xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                        Done
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Key Concepts Section */}
              <div className="mt-4 sm:mt-6">
                <KeyConceptsDisplay 
                  concepts={results?.analysis?.key_concepts || []}
                  onExplainConcept={onExplainConcept}
                />
              </div>

              {/* Analyzed Time */}
              {results?.analyzed_at && (
                <div className="mt-4 sm:mt-6">
                  <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        </div>
                        <div className="text-center">
                          <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-gray-300">
                            Document Analyzed
                          </p>
                          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                            {new Date(results.analyzed_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Insights & Risks Tab */}
            <TabsContent value="insights" className="h-full mt-2 sm:mt-4 overflow-auto">
              <ProfessionalAnalysisDisplay 
                results={results}
                onHighlightClick={handleShowInDocument}
                activeHighlight={activeHighlight}
                showSummary={false}
              />
            </TabsContent>

            {/* Interactive Document Text Tab */}
            <TabsContent value="document" className="h-full mt-2 sm:mt-4 overflow-auto px-3 sm:px-4 lg:px-6 pb-3 sm:pb-6">
              <Card className="border-0 shadow-xl">
                <CardHeader className="px-4 sm:px-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-2 sm:p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                        <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                          Interactive Document
                        </CardTitle>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 mt-1">
                          Full document text with intelligent highlighting
                        </p>
                      </div>
                    </div>
                    {highlights.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 text-xs">
                          {highlights.length} highlights
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  {results?.document_text ? (
                    <div className="space-y-3 sm:space-y-4">
                      {/* Interactive Text Display */}
                      <div className="bg-slate-50 dark:bg-gray-800 rounded-2xl p-3 sm:p-6 max-h-[50vh] sm:max-h-[70vh] overflow-auto border border-slate-200 dark:border-gray-700">
                        <HighlightableText 
                          text={results.document_text}
                          highlights={highlights}
                          activeHighlight={activeHighlight}
                          onHighlightClick={handleHighlightClick}
                        />
                      </div>
                      
                      {/* Instructions - Responsive Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                        <div className="p-3 sm:p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-medium mb-2 text-sm sm:text-base">
                            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                            Key Insights
                          </div>
                          <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300">
                            Navigate to the Analysis tab and click on any insight to see it highlighted here in green.
                          </p>
                        </div>
                        
                        <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                          <div className="flex items-center gap-2 text-red-800 dark:text-red-200 font-medium mb-2 text-sm sm:text-base">
                            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                            Risk Flags
                          </div>
                          <p className="text-xs sm:text-sm text-red-700 dark:text-red-300">
                            Click on any risk assessment in the Analysis tab to see it highlighted here in red.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 sm:py-16">
                      <div className="p-3 sm:p-4 bg-slate-100 dark:bg-gray-700 rounded-full w-fit mx-auto mb-3 sm:mb-4">
                        <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400 dark:text-gray-500" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-slate-700 dark:text-gray-300 mb-2">
                        No Document Text Available
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-gray-400 px-4">
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