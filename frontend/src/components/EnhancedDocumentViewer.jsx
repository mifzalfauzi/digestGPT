import React, { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Eye, FileText, Brain, TrendingUp, Clock, Sparkles, Target, AlertTriangle, CheckCircle2, BookOpen } from 'lucide-react'
import ProfessionalAnalysisDisplay from './ProfessionalAnalysisDisplay'
import KeyConceptsDisplay from './KeyConceptsDisplay'
import HighlightableText from './HighlightableText'
import MarkdownRenderer from './MarkdownRenderer'
import DocxViewer from './DocxViewer'
import mammoth from 'mammoth'

function EnhancedDocumentViewer({ results, file, inputMode, onExplainConcept, isDemoMode = false, bypassAPI = false }) {
  const [activeHighlight, setActiveHighlight] = useState(null)
  const [highlights, setHighlights] = useState([])
  const [activeTab, setActiveTab] = useState('analysis') // Initialize with default tab
  const [tabChangeKey, setTabChangeKey] = useState(0)
  const [docxContent, setDocxContent] = useState(null)
  const [docxLoading, setDocxLoading] = useState(false)

  // Handle tab change with animation
  const handleTabChange = (newTab) => {
    setTabChangeKey(prev => prev + 1)
    setActiveTab(newTab)
  }

  // Mock document text for demo mode
  const mockDocumentText = `# Sample Business Plan - Strategic Expansion Initiative

## Executive Summary

Our company is positioned for significant growth through strategic expansion into emerging markets, with projected 40% revenue growth over the next 18 months. This comprehensive business plan outlines our AI-powered product development strategy, sustainable operations framework, and market penetration approach for Southeast Asia.

### Key Strategic Initiatives

**Market Penetration Strategy**: We have identified untapped opportunities in Southeast Asia with 200% year-over-year growth potential. Our research indicates strong demand for AI-powered business solutions in this region, particularly in the financial services and healthcare sectors.

**AI-Powered Analytics Platform**: Development of our innovative AI suite launching Q3 2024 will provide real-time business insights and predictive modeling capabilities. This technology represents our core competitive differentiator and enables data-driven decision making for our clients.

**Sustainable Operations**: Implementation of environmentally responsible business practices will reduce our carbon footprint by 60% while ensuring regulatory compliance and meeting ESG investment criteria.

## Financial Projections

Our financial model demonstrates strong fundamentals with conservative cash flow projections and an 18-month operational runway. Customer acquisition costs have decreased by 25% through improved digital marketing strategies, while operational efficiency has improved by 30% through automation initiatives.

### Revenue Diversification

We project revenue growth across multiple market segments:
- Enterprise AI solutions: 45% of total revenue
- Healthcare analytics: 25% of total revenue  
- Financial services: 20% of total revenue
- Other sectors: 10% of total revenue

## Risk Assessment

**Supply Chain Vulnerabilities**: Potential disruptions affecting Q2 delivery timelines require contingency planning and alternative supplier relationships.

**Regulatory Uncertainties**: Changes in target markets may impact our expansion strategy, necessitating flexible compliance frameworks.

**Talent Acquisition**: The competitive landscape for AI and machine learning specialists presents challenges that may affect our growth timeline.

## Implementation Timeline

**Phase 1 (Q1-Q2 2024)**: Market research completion and strategic partnership establishment
**Phase 2 (Q3 2024)**: AI platform launch and initial market entry
**Phase 3 (Q4 2024)**: Scale operations with 150+ new hires across three regional offices

## Competitive Analysis

Our proprietary AI technology creates significant barriers to entry while our strong customer relationships maintain a 95% retention rate. Strategic partnerships with Fortune 500 companies accelerate our market penetration and reduce competitive pressure.

## Conclusion

This business plan effectively balances growth ambitions with comprehensive risk management. The combination of strong financial positioning, innovative technology, and strategic market opportunities positions us for sustained success in the evolving AI landscape.`

  const getFileUrl = () => {
    if (isDemoMode) {
      // For demo mode, return a placeholder PDF URL
      return "data:application/pdf;base64,JVBERi0xLjMKMSAwIG9iaiAiZGVtbyI="
    }
    
    if (bypassAPI) {
      // For bypass mode, return another placeholder
      return "data:application/pdf;base64,JVBERi0xLjMKMSAwIG9iaiAiYnlwYXNzIgo="
    }
    
    if (file && file.type === 'application/pdf') {
      return URL.createObjectURL(file)
    }
    
    // For historical documents, fetch from Supabase
    if (results?.filename && results?.document_id && (results.filename.endsWith('.pdf'))) {
      // Get user ID from auth context or localStorage
      const authData = JSON.parse(localStorage.getItem('auth') || '{}')
      const userId = authData.user?.id || localStorage.getItem('user_id') || 'unknown'

      console.table("Auth data:", authData)
      console.table("User ID:", userId)
      
      // Extract file extension
      const fileExtension = results.filename.split('.').pop()
      const documentId = results.document_id.slice(0, 8) // First 8 chars of UUID
      const safeFilename = `${results.filename.replace(/\.[^/.]+$/, "")}_${documentId}.${fileExtension}`
      
      // Construct Supabase URL
      const supabaseUrl = "https://vlijwmcpzkrzbjmntbsx.supabase.co"
      const bucketName = "documents-uploaded-digestifile"
      const filePath = `${userId}/${safeFilename}`
      
      console.log('PDF URL for historical document:', {
        userId,
        safeFilename,
        filePath,
        fullUrl: `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`
      })
      
      return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`
    }
    
    return null
  }

  const isPDF = (file && file.type === 'application/pdf' && !isDemoMode && !bypassAPI) || 
                (results?.filename?.endsWith('.pdf') && !isDemoMode && !bypassAPI)
  const isDOCX = (file && file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' && !isDemoMode && !bypassAPI) ||
                 (results?.filename?.endsWith('.docx') && !isDemoMode && !bypassAPI)
  const hasDocumentViewer = isPDF || isDOCX

  // Set default tab based on document availability
  useEffect(() => {
    if (!activeTab) {
      if (hasDocumentViewer) {
        setActiveTab("document-viewer")
      } else if (isDemoMode || bypassAPI) {
        setActiveTab("analysis")
      } else {
        setActiveTab("document")
      }
    }
  }, [hasDocumentViewer, activeTab, isDemoMode, bypassAPI])

  // Generate highlights from analysis results
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
    }, 200) // Increased delay to ensure tab rendering completes
  }

  // Load DOCX content when file changes
  useEffect(() => {
    if (isDOCX && file) {
      loadDocxContent()
    } else {
      setDocxContent(null)
    }
  }, [isDOCX, file])

  const loadDocxContent = async () => {
    if (!file) return

    setDocxLoading(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.convertToHtml({ arrayBuffer })

      setDocxContent({
        html: result.value,
        messages: result.messages
      })
    } catch (err) {
      console.error('Error loading DOCX file:', err)
      setDocxContent(null)
    } finally {
      setDocxLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Enhanced Header - Fixed at top */}
      <div className="border-b flex-shrink-0 px-2 sm:px-3 lg:px-4 py-2 sm:py-3 bg-white/80 dark:bg-[#121212] backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 lg:gap-0">
          <div className="flex items-center gap-2">
            {/* <div className="p-1 sm:p-1.5 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 rounded-xl">
              <Brain className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 text-blue-600 dark:text-blue-400" />
            </div> */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm lg:text-base font-bold text-slate-900 dark:text-white">
                  Dashboard
                  {isDemoMode && <span className="text-xs text-orange-500 font-normal">(Demo)</span>}
                  {bypassAPI && !isDemoMode && <span className="text-xs text-green-600 font-normal">(Preview)</span>}
                </h2>
                <Badge className={`text-xs border-0 px-1 py-0.5 ${isDemoMode
                  ? 'bg-gradient-to-r from-orange-500 to-yellow-600 text-white'
                  : bypassAPI
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                  }`}>
                  <Sparkles className="h-1.5 w-1.5 sm:h-2 sm:w-2 mr-0.5" />
                  <span className="hidden sm:inline">
                    {isDemoMode ? 'Demo Data' : bypassAPI ? 'Preview Data' : 'Analyzed'}
                  </span>
                  <span className="sm:hidden">
                    {isDemoMode ? '🎭' : bypassAPI ? '👁️' : '✓'}
                  </span>
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Content - Scrollable */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
          <div className="flex-shrink-0 px-2 sm:px-3 lg:px-4 pt-2 sm:pt-3 dark:bg-[#121212]">
            <TabsList className={`grid w-full ${hasDocumentViewer ? 'grid-cols-4' : 'grid-cols-3'} bg-slate-100 dark:bg-[#000000] dark:text-white p-0.5 sm:p-1 rounded-xl h-auto`}>
              <TabsTrigger value="analysis" className="flex items-center gap-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 rounded-lg py-1 sm:py-1.5 px-1 sm:px-2 text-xs">
                <Brain className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                <span className="hidden md:inline">Analysis</span>
                <span className="md:hidden">AI</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 rounded-lg py-1 sm:py-1.5 px-1 sm:px-2 text-xs">
                <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                <span className="hidden md:inline">Insights & Risks</span>
                <span className="md:hidden">Insights</span>
              </TabsTrigger>
              {hasDocumentViewer && (
                <TabsTrigger value="document-viewer" className="flex items-center gap-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 rounded-lg py-1 sm:py-1.5 px-1 sm:px-2 text-xs">
                  <FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                  <span className="hidden sm:inline">{isPDF ? 'PDF Viewer' : 'DOCX Viewer'}</span>
                  <span className="sm:hidden">{isPDF ? 'PDF' : 'DOCX'}</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="document" className="flex items-center gap-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 rounded-lg py-1 sm:py-1.5 px-1 sm:px-2 text-xs">
                <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                <span className="hidden md:inline">Extractive Text</span>
                <span className="md:hidden">Text</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden dark:bg-[#121212]">
            {/* Document Viewer Tab (PDF or DOCX) */}
            {hasDocumentViewer && (
              <TabsContent value="document-viewer" className="h-full mt-1 sm:mt-2 px-2 sm:px-3 lg:px-4 pb-2 sm:pb-4 animate-tab-enter">
                {isPDF ? (
                  <Card className="h-full border-0 shadow-xl">
                    <CardContent className="p-0 h-full">
                      <div className="h-full border border-slate-200 dark:border-gray-600 rounded-xl overflow-hidden relative">
                        {!results && (
                          <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex items-center justify-center z-10">
                            <div className="text-center space-y-3">
                              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                              <div>
                                <p className="text-sm font-medium text-slate-700 dark:text-gray-300">Analyzing Document</p>
                                <p className="text-xs text-slate-500 dark:text-gray-400">PDF will be available once analysis completes</p>
                              </div>
                            </div>
                          </div>
                        )}
                        <iframe
                          src={getFileUrl()}
                          className="w-full h-full"
                          title="PDF Document"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <DocxViewer
                    file={file}
                    onTextExtracted={(text) => {
                      // This can be used to update the interactive text tab
                      console.log('DOCX text extracted:', text)
                    }}
                  />
                )}
              </TabsContent>
            )}

            {/* AI Analysis Summary Tab */}
            <TabsContent value="analysis" className="h-full mt-1 sm:mt-2 overflow-y-auto px-2 sm:px-3 lg:px-4 pb-2 sm:pb-4 animate-tab-enter">
              <Card className="border-0 mt-2 sm:mt-3 shadow-lg">
                <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow-lg">
                        <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 dark:text-white">
                          Executive Summary
                        </CardTitle>
                        <p className="text-xs text-slate-600 dark:text-gray-400 mt-1">
                          Summary by Claude
                        </p>
                      </div>
                    </div>


                    {/* Document Analyzed Timestamp */}
                    {results?.analyzed_at && (
                      <div className="flex items-center gap-2 bg-gradient-to-r from-slate-50/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 rounded-lg p-2 border border-slate-200/50 dark:border-gray-700/50">
                        <div className="p-1 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                          <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-medium text-slate-700 dark:text-gray-300">
                            Analyzed
                          </p>
                          <p className="text-xs text-slate-500 dark:text-gray-400">
                            {new Date(results.analyzed_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 px-3 sm:px-4">
                  <div className="bg-gradient-to-r from-purple-50/80 to-blue-50/80 dark:from-purple-950/30 dark:to-blue-950/30 rounded-2xl p-3 sm:p-4 border border-purple-200/50 dark:border-purple-800/30">
                    <MarkdownRenderer
                      content={results?.analysis?.summary || 'Comprehensive analysis will appear here after document processing...'}
                      className="text-slate-800 dark:text-slate-100 leading-relaxed text-sm font-medium"
                    />
                  </div>

                  {/* Quick Stats - Responsive Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-3 sm:mt-4">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl p-2 sm:p-2.5 lg:p-3 border border-emerald-200/50 dark:border-emerald-800/30">
                      <div className="flex items-center gap-1">
                        <Target className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Insights</span>
                      </div>
                      <p className="text-sm sm:text-base lg:text-lg font-bold text-emerald-900 dark:text-emerald-100 mt-1">
                        {isDemoMode ? '12' : bypassAPI ? '4' : (results?.analysis?.key_points?.length || 0)}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 rounded-xl p-2 sm:p-2.5 lg:p-3 border border-red-200/50 dark:border-red-800/30">
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-600 dark:text-red-400" />
                        <span className="text-xs font-medium text-red-800 dark:text-red-200">Risks</span>
                      </div>
                      <p className="text-sm sm:text-base lg:text-lg font-bold text-red-900 dark:text-red-100 mt-1">
                        {isDemoMode ? '3' : bypassAPI ? '3' : (results?.analysis?.risk_flags?.length || 0)}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 rounded-xl p-2 sm:p-2.5 lg:p-3 border border-amber-200/50 dark:border-amber-800/30">
                      <div className="flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-600 dark:text-amber-400" />
                        <span className="text-xs font-medium text-amber-800 dark:text-amber-200">Concepts</span>
                      </div>
                      <p className="text-sm sm:text-base lg:text-lg font-bold text-amber-900 dark:text-amber-100 mt-1">
                        {isDemoMode ? '3' : bypassAPI ? '3' : (results?.analysis?.key_concepts?.length || 0)}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-2 sm:p-2.5 lg:p-3 border border-blue-200/50 dark:border-blue-800/30">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Status</span>
                      </div>
                      <p className="text-sm sm:text-base lg:text-lg font-bold text-blue-900 dark:text-blue-100 mt-1">
                        {isDemoMode ? 'Demo' : bypassAPI ? 'Preview' : 'Done'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Key Concepts Section */}
              <div className="mt-3 sm:mt-4">
                <KeyConceptsDisplay
                  concepts={isDemoMode ? results?.key_concepts || [] : bypassAPI ? results?.analysis?.key_concepts || [] : (results?.analysis?.key_concepts || [])}
                  onExplainConcept={onExplainConcept}
                  isDemoMode={isDemoMode}
                  bypassAPI={bypassAPI}
                />
              </div>
            </TabsContent>

            {/* Insights & Risks Tab */}
            <TabsContent value="insights" className="h-full mt-1 sm:mt-2 overflow-y-auto animate-tab-enter">
              <ProfessionalAnalysisDisplay
                results={results}
                onHighlightClick={handleShowInDocument}
                activeHighlight={activeHighlight}
                showSummary={false}
              />
            </TabsContent>

            {/* Interactive Document Text Tab */}
            <TabsContent value="document" className="h-full mt-1 sm:mt-2 overflow-y-auto px-2 sm:px-3 lg:px-4 pb-2 sm:pb-4 animate-tab-enter">
              <Card className="border-0 shadow-xl">
                <CardHeader className="px-3 sm:px-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 dark:text-white">
                          Extractive Text
                          {isDemoMode && <span className="text-xs text-orange-500 font-normal">(Demo)</span>}
                          {bypassAPI && !isDemoMode && <span className="text-xs text-green-600 font-normal">(Preview)</span>}
                          {isDOCX && !isDemoMode && !bypassAPI && <span className="text-xs text-blue-600 font-normal">(DOCX)</span>}
                        </CardTitle>
                        <p className="text-xs text-slate-600 dark:text-gray-400 mt-1">
                          {isDemoMode
                            ? 'Sample document text for demo purposes'
                            : bypassAPI
                              ? 'Document text preview with mock data'
                              : isDOCX
                                ? 'DOCX document content with formatting preserved'
                                : 'Claude\'s extracted document text with intelligent highlighting'
                          }
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
                <CardContent className="px-3 sm:px-4">

                  {(results?.document_text || isDemoMode || bypassAPI || docxContent) ? (
                    <div className="space-y-2 sm:space-y-3">
                      {/* Interactive Text Display */}
                      <div className="bg-slate-50 dark:bg-gray-800 rounded-2xl p-2 sm:p-2.5 lg:p-4 max-h-[60vh] overflow-y-auto border border-slate-200 dark:border-gray-700">
                        {(isDemoMode || bypassAPI) && (
                          <div className={`mb-3 p-2 border rounded-lg ${isDemoMode
                            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                            : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            }`}>
                            <p className={`text-xs font-medium ${isDemoMode
                              ? 'text-orange-700 dark:text-orange-300'
                              : 'text-green-700 dark:text-green-300'
                              }`}>
                              {isDemoMode
                                ? '📄 Demo Document - This is sample content to showcase the interface'
                                : '📄 Preview Mode - Document loaded with mock analysis to save API quota'
                              }
                            </p>
                          </div>
                        )}

                        {/* DOCX Content Display */}
                        {docxContent && !isDemoMode && !bypassAPI ? (
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <div
                              dangerouslySetInnerHTML={{ __html: docxContent.html }}
                              style={{
                                fontFamily: 'Inter, system-ui, sans-serif',
                                lineHeight: '1.6',
                                color: 'inherit'
                              }}
                            />
                          </div>
                        ) : docxLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="text-center space-y-3">
                              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                              <p className="text-sm text-slate-600 dark:text-gray-400">Loading DOCX document...</p>
                            </div>
                          </div>
                        ) : (
                          <HighlightableText
                            text={(isDemoMode || bypassAPI) ? mockDocumentText : results?.document_text}
                            highlights={highlights}
                            activeHighlight={activeHighlight}
                            onHighlightClick={handleHighlightClick}
                          />
                        )}
                      </div>

                      {/* Instructions - Responsive Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
                        <div className="p-2 sm:p-2.5 lg:p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-medium mb-1.5 text-sm">
                            <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            Key Insights
                          </div>
                          <p className="text-xs text-emerald-700 dark:text-emerald-300">
                            {isDemoMode
                              ? 'In the full version, insights from the AI analysis would be highlighted in green when clicked.'
                              : bypassAPI
                                ? 'In normal operation, AI insights would be highlighted here when clicked from the analysis tab.'
                                : 'Navigate to the Analysis tab and click on any insight to see it highlighted here in green.'
                            }
                          </p>
                        </div>

                        <div className="p-2 sm:p-2.5 lg:p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                          <div className="flex items-center gap-2 text-red-800 dark:text-red-200 font-medium mb-1.5 text-sm">
                            <AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            Risk Flags
                          </div>
                          <p className="text-xs text-red-700 dark:text-red-300">
                            {isDemoMode
                              ? 'Risk assessments would be highlighted in red when selected from the analysis tab.'
                              : bypassAPI
                                ? 'Risk flags from AI analysis would normally be highlighted here in red when selected.'
                                : 'Click on any risk assessment in the Analysis tab to see it highlighted here in red.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-12">
                      <div className="p-3 bg-slate-100 dark:bg-gray-700 rounded-full w-fit mx-auto mb-3">
                        <FileText className="h-6 w-6 text-slate-400 dark:text-gray-500" />
                      </div>
                      <h3 className="text-base font-semibold text-slate-700 dark:text-gray-300 mb-2">
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