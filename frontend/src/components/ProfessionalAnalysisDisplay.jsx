import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import { Separator } from './ui/separator'
import { 
  Brain, 
  Target, 
  AlertTriangle, 
  TrendingUp, 
  Shield, 
  Eye, 
  Sparkles, 
  Search,
  CheckCircle2,
  Info,
  Zap,
  Star,
  ArrowRight,
  FileText,
  Clock,
  ChevronLeft,
  ChevronRight,
  Copy,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'
import HighlightableText from './HighlightableText'
import MarkdownRenderer from './MarkdownRenderer'

function ProfessionalAnalysisDisplay({ results, onHighlightClick, activeHighlight, onActiveHighlightChange, showSummary = true }) {
  const [insights, setInsights] = useState([])
  const [risks, setRisks] = useState([])
  const [summary, setSummary] = useState('')
  const [keyConcepts, setKeyConcepts] = useState([])
  const [highlights, setHighlights] = useState([])
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0)
  const [currentRiskIndex, setCurrentRiskIndex] = useState(0)
  const [copiedItem, setCopiedItem] = useState(null)
  const [feedbackGiven, setFeedbackGiven] = useState({})
  
  // Simple persistence using ref to avoid re-render loops
  const persistedState = useRef({
    currentInsightIndex: 0,
    currentRiskIndex: 0,
    copiedItem: null,
    feedbackGiven: {},
    isInitialized: false,
    lastResultsId: null
  })
  const selectedFrom = useMemo(() => {
    if (!activeHighlight) return null
    if (activeHighlight.startsWith('insight-')) {
      const idx = parseInt(activeHighlight.split('-')[1], 10)
      return { type: 'insight', index: isNaN(idx) ? null : idx }
    }
    if (activeHighlight.startsWith('risk-')) {
      const idx = parseInt(activeHighlight.split('-')[1], 10)
      return { type: 'risk', index: isNaN(idx) ? null : idx }
    }
    return null
  }, [activeHighlight])

  useEffect(() => {
    console.log('ProfessionalAnalysisDisplay - Full results:', results)
    console.log('ProfessionalAnalysisDisplay - Analysis data:', results?.analysis)
    
    if (!results?.analysis) return

    // Handle case where analysis might be a string instead of object
    let analysisData = results.analysis
    if (typeof analysisData === 'string') {
      console.log('Analysis is a string, attempting to parse JSON...')
      try {
        analysisData = JSON.parse(analysisData)
        console.log('Successfully parsed analysis JSON:', analysisData)
      } catch (e) {
        console.error('Failed to parse analysis JSON:', e)
        console.log('Raw analysis string:', analysisData)
        return
      }
    }

    // Process summary
    setSummary(analysisData.summary || '')

    // Process insights (key points)
    const processedInsights = (analysisData.key_points || []).map((point, index) => ({
      id: `insight-${index}`,
      text: typeof point === 'string' ? point : point.text,
      quote: typeof point === 'object' ? point.quote : '',
      position: typeof point === 'object' ? point.position : null,
      confidence: 'high',
      category: getInsightCategory(typeof point === 'string' ? point : point.text)
    }))
    setInsights(processedInsights)

    // Process risks
    const processedRisks = (analysisData.risk_flags || []).map((risk, index) => ({
      id: `risk-${index}`,
      text: typeof risk === 'string' ? risk : risk.text,
      quote: typeof risk === 'object' ? risk.quote : '',
      position: typeof risk === 'object' ? risk.position : null,
      severity: getRiskSeverity(typeof risk === 'string' ? risk : risk.text),
      category: getRiskCategory(typeof risk === 'string' ? risk : risk.text)
    }))
    setRisks(processedRisks)

    // Process key concepts
    const processedConcepts = (analysisData.key_concepts || []).map((concept, index) => ({
      id: `concept-${index}`,
      term: typeof concept === 'string' ? concept : concept.term,
      explanation: typeof concept === 'object' ? concept.explanation : 'No explanation provided'
    }))
    setKeyConcepts(processedConcepts)

    console.log('Processed key concepts:', processedConcepts)

    // Create highlights for text interaction
    const newHighlights = [
      ...processedInsights.filter(i => i.position?.found).map(i => ({
        id: i.id,
        type: 'insight',
        position: i.position,
        text: i.text,
        quote: i.quote
      })),
      ...processedRisks.filter(r => r.position?.found).map(r => ({
        id: r.id,
        type: 'risk',
        position: r.position,
        text: r.text,
        quote: r.quote
      }))
    ]
    setHighlights(newHighlights)

  }, [results])
  
  // Separate useEffect for initialization to avoid conflicts
  useEffect(() => {
    if (!persistedState.current.isInitialized) {
      // First time initialization - use persisted state if available
      setCurrentInsightIndex(persistedState.current.currentInsightIndex || 0)
      setCurrentRiskIndex(persistedState.current.currentRiskIndex || 0)
      if (persistedState.current.copiedItem) setCopiedItem(persistedState.current.copiedItem)
      if (persistedState.current.feedbackGiven) setFeedbackGiven(persistedState.current.feedbackGiven)
      persistedState.current.isInitialized = true
    }
  }, []) // Run only once on mount

  // Only sync when activeHighlight changes due to external click (not tab restoration)
  const previousActiveHighlight = useRef(activeHighlight)
  useEffect(() => {
    // Only sync if activeHighlight actually changed (not just tab restoration)
    if (!activeHighlight || activeHighlight === previousActiveHighlight.current) {
      previousActiveHighlight.current = activeHighlight
      return
    }
    
    previousActiveHighlight.current = activeHighlight
    
    if (activeHighlight.startsWith('insight-')) {
      const idx = parseInt(activeHighlight.split('-')[1], 10)
      if (!isNaN(idx)) {
        const bounded = Math.min(Math.max(0, idx), Math.max(insights.length - 1, 0))
        setCurrentInsightIndex(bounded)
      }
    } else if (activeHighlight.startsWith('risk-')) {
      const idx = parseInt(activeHighlight.split('-')[1], 10)
      if (!isNaN(idx)) {
        const bounded = Math.min(Math.max(0, idx), Math.max(risks.length - 1, 0))
        setCurrentRiskIndex(bounded)
      }
    }
  }, [activeHighlight, insights.length, risks.length])

  const getInsightCategory = (text) => {
    const lower = text.toLowerCase()
    if (lower.includes('financial') || lower.includes('money') || lower.includes('cost')) return 'financial'
    if (lower.includes('legal') || lower.includes('contract') || lower.includes('agreement')) return 'legal'
    if (lower.includes('technical') || lower.includes('system') || lower.includes('process')) return 'technical'
    if (lower.includes('strategic') || lower.includes('business') || lower.includes('objective')) return 'strategic'
    return 'general'
  }

  const getRiskSeverity = (text) => {
    const lower = text.toLowerCase()
    if (lower.includes('critical') || lower.includes('severe') || lower.includes('major')) return 'critical'
    if (lower.includes('significant') || lower.includes('important') || lower.includes('concerning')) return 'high'
    if (lower.includes('minor') || lower.includes('low') || lower.includes('potential')) return 'medium'
    return 'medium'
  }

  const getRiskCategory = (text) => {
    const lower = text.toLowerCase()
    if (lower.includes('compliance') || lower.includes('regulatory') || lower.includes('legal')) return 'compliance'
    if (lower.includes('financial') || lower.includes('cost') || lower.includes('budget')) return 'financial'
    if (lower.includes('security') || lower.includes('privacy') || lower.includes('data')) return 'security'
    if (lower.includes('operational') || lower.includes('process') || lower.includes('workflow')) return 'operational'
    return 'general'
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'financial': return <TrendingUp className="h-4 w-4" />
      case 'legal': return <Shield className="h-4 w-4" />
      case 'technical': return <Zap className="h-4 w-4" />
      case 'strategic': return <Target className="h-4 w-4" />
      case 'compliance': return <Shield className="h-4 w-4" />
      case 'security': return <Shield className="h-4 w-4" />
      case 'operational': return <Zap className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'financial': return 'emerald'
      case 'legal': return 'blue'
      case 'technical': return 'purple'
      case 'strategic': return 'orange'
      case 'compliance': return 'red'
      case 'security': return 'red'
      case 'operational': return 'yellow'
      default: return 'blue'
    }
  }

  const getCategoryBadgeClasses = (category) => {
    switch (category) {
      case 'financial': 
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
      case 'legal': 
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
      case 'technical': 
        return 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
      case 'strategic': 
        return 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300'
      case 'compliance': 
        return 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
      case 'security': 
        return 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
      case 'operational': 
        return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
      default: 
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
    }
  }

  const getCategoryIconClasses = (category) => {
    switch (category) {
      case 'financial': 
        return 'bg-emerald-100 dark:bg-emerald-900/30'
      case 'legal': 
        return 'bg-blue-100 dark:bg-blue-900/30'
      case 'technical': 
        return 'bg-purple-100 dark:bg-purple-900/30'
      case 'strategic': 
        return 'bg-orange-100 dark:bg-orange-900/30'
      case 'compliance': 
        return 'bg-red-100 dark:bg-red-900/30'
      case 'security': 
        return 'bg-red-100 dark:bg-red-900/30'
      case 'operational': 
        return 'bg-yellow-100 dark:bg-yellow-900/30'
      default: 
        return 'bg-blue-100 dark:bg-blue-900/30'
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'red'
      case 'high': return 'orange'
      case 'medium': return 'yellow'
      default: return 'gray'
    }
  }

  const getSeverityBadgeClasses = (severity) => {
    switch (severity) {
      case 'critical': 
        return 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
      case 'high': 
        return 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300'
      case 'medium': 
        return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
      default: 
        return 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  const getSeverityIconClasses = (severity) => {
    switch (severity) {
      case 'critical': 
        return 'bg-red-100 dark:bg-red-900/30'
      case 'high': 
        return 'bg-orange-100 dark:bg-orange-900/30'
      case 'medium': 
        return 'bg-yellow-100 dark:bg-yellow-900/30'
      default: 
        return 'bg-gray-100 dark:bg-gray-900/30'
    }
  }

  // Persist state changes
  useEffect(() => {
    persistedState.current = {
      ...persistedState.current,
      currentInsightIndex,
      currentRiskIndex,
      copiedItem,
      feedbackGiven
    }
  }, [currentInsightIndex, currentRiskIndex, copiedItem, feedbackGiven])
  
  // Get current items for display
  const currentInsight = insights[currentInsightIndex]
  const currentRisk = risks[currentRiskIndex]

  // Copy to clipboard function
  const handleCopy = async (text, itemId) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedItem(itemId)
      setTimeout(() => setCopiedItem(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  // Handle feedback
  const handleFeedback = (itemId, type) => {
    setFeedbackGiven(prev => ({
      ...prev,
      [itemId]: type
    }))
    // Here you could also send feedback to your analytics/backend
    console.log(`Feedback given for ${itemId}: ${type}`)
  }

  return (
    <div className="space-y-6 p-4 sm:p-4 h-full overflow-y-auto">
      {/* Selection banner when coming from extractive text */}
      {/* {selectedFrom && selectedFrom.index !== null && (
        <div className="flex items-center justify-between p-2 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs">
          <span>
            Selected from Extractive Text: {selectedFrom.type === 'insight' ? 'Insight' : 'Risk'} #{selectedFrom.index + 1}
          </span>
          {onActiveHighlightChange && (
            <button
              className="underline hover:opacity-80"
              onClick={() => onActiveHighlightChange(null)}
            >
              Clear
            </button>
          )}
        </div>
      )} */}
      {/* Executive Summary - Only show if showSummary is true */}
      {showSummary && (
        <Card className="border-0 shadow-xl dark:bg-black">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
             
              <div>
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                  Executive Summary
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
                  Summary by Claude
                </p>
              </div>
             
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gradient-to-r from-purple-50/80 to-blue-50/80 dark:from-purple-950/30 dark:to-blue-950/30 rounded-2xl p-6 border border-purple-200/50 dark:border-purple-800/30">
              <p className="text-slate-800 dark:text-slate-100 leading-relaxed text-base font-medium">
                {summary || 'Comprehensive analysis will appear here after document processing...'}
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-3 mt-6">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-800/30">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Insights</span>
                </div>
                <p className="text-xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">
                  {insights.length}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 rounded-xl p-4 border border-red-200/50 dark:border-red-800/30">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-xs font-medium text-red-800 dark:text-red-200">Risks</span>
                </div>
                <p className="text-xl font-bold text-red-900 dark:text-red-100 mt-1">
                  {risks.length}
                </p>
              </div>

              <div className=" dark:bg-black rounded-xl p-4 border border-amber-200/50 dark:border-amber-800/30">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-medium text-amber-800 dark:text-amber-200">Concepts</span>
                </div>
                <p className="text-xl font-bold text-amber-900 dark:text-amber-100 mt-1">
                  {keyConcepts.length}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/30">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Status</span>
                </div>
                <p className="text-xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                  Done
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Insights Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                  Strategic Insights
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
                  Key findings from your document
                </p>
              </div>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
              {insights.length} insights
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.length > 0 && currentInsight ? (
            <>
              {/* Current Insight Display */}
              <Card 
                className={`transition-all duration-300 dark:bg-green-900/20 ${
                  highlights.find(h => h.id === currentInsight.id) ? 'cursor-pointer hover:shadow-lg' : ''
                } ${
                  activeHighlight === currentInsight.id
                    ? 'ring-2 ring-emerald-400 dark:ring-emerald-500 shadow-lg bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700'
                    : 'border-slate-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600'
                }`}
                onClick={() => {
                  const hasHighlight = highlights.find(h => h.id === currentInsight.id);
                  hasHighlight && onHighlightClick(currentInsight.id);
                }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 ${getCategoryIconClasses(currentInsight.category)} rounded-lg flex-shrink-0`}>
                      {getCategoryIcon(currentInsight.category)}
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-slate-800 dark:text-slate-100 leading-relaxed font-medium text-sm flex-1">
                          <MarkdownRenderer content={currentInsight.text} />
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getCategoryBadgeClasses(currentInsight.category)} capitalize`}
                          >
                            {currentInsight.category}
                          </Badge>
                          
                          {/* Copy and Feedback buttons */}
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(currentInsight.text, currentInsight.id)}
                              className="h-7 w-7 p-0 hover:bg-emerald-100 dark:hover:bg-emerald-900/20"
                              title="Copy insight"
                            >
                              <Copy className={`h-3 w-3 ${copiedItem === currentInsight.id ? 'text-emerald-600' : 'text-gray-500'}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFeedback(currentInsight.id, 'positive')}
                              className={`h-7 w-7 p-0 hover:bg-green-100 dark:hover:bg-green-900/20 ${
                                feedbackGiven[currentInsight.id] === 'positive' ? 'bg-green-100 dark:bg-green-900/20' : ''
                              }`}
                              title="Helpful insight"
                            >
                              <ThumbsUp className={`h-3 w-3 ${
                                feedbackGiven[currentInsight.id] === 'positive' ? 'text-green-600' : 'text-gray-500'
                              }`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFeedback(currentInsight.id, 'negative')}
                              className={`h-7 w-7 p-0 hover:bg-red-100 dark:hover:bg-red-900/20 ${
                                feedbackGiven[currentInsight.id] === 'negative' ? 'bg-red-100 dark:bg-red-900/20' : ''
                              }`}
                              title="Not helpful"
                            >
                              <ThumbsDown className={`h-3 w-3 ${
                                feedbackGiven[currentInsight.id] === 'negative' ? 'text-red-600' : 'text-gray-500'
                              }`} />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {highlights.find(h => h.id === currentInsight.id) && (
                        <div className="flex items-center gap-3 pt-2 border-t border-slate-200 dark:border-gray-600">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              onHighlightClick(currentInsight.id)
                            }}
                          >
                            <Search className="h-3 w-3 mr-1" />
                            {activeHighlight === currentInsight.id ? 'Hide highlight' : 'Show in document'}
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                          
                          {currentInsight.quote && (
                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-gray-400">
                              <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                              <span className="italic">"{currentInsight.quote.substring(0, 40)}..."</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Insights Pagination */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentInsightIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentInsightIndex === 0}
                  className="text-xs"
                >
                  <ChevronLeft className="h-3 w-3 mr-1" />
                  Previous
                </Button>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Insight {currentInsightIndex + 1} of {insights.length}
                  </p>
                  <div className="flex gap-1 mt-1 justify-center">
                    {insights.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${
                          index === currentInsightIndex
                            ? 'bg-emerald-500'
                            : 'bg-slate-300 dark:bg-gray-600 hover:bg-emerald-300'
                        }`}
                        onClick={() => setCurrentInsightIndex(index)}
                      />
                    ))}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentInsightIndex(prev => Math.min(insights.length - 1, prev + 1))}
                  disabled={currentInsightIndex === insights.length - 1}
                  className="text-xs"
                >
                  Next
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="p-4 bg-slate-100 dark:bg-gray-700 rounded-full w-fit mx-auto mb-4">
                <Target className="h-8 w-8 text-slate-400 dark:text-gray-500" />
              </div>
              <p className="text-slate-600 dark:text-gray-400">
                No strategic insights identified yet. Upload a document to begin analysis.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="my-4" />

      {/* Risk Assessment Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl shadow-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                  Risk Assessment
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
                  Potential risks and concerns identified
                </p>
              </div>
            </div>
            <Badge className={`${
              risks.length === 0 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {risks.length === 0 ? 'Low Risk' : `${risks.length} risks `}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {risks.length > 0 && currentRisk ? (
            <>
              {/* Current Risk Display */}
              <Alert 
                className={`transition-all duration-300 ${
                  highlights.find(h => h.id === currentRisk.id) ? 'cursor-pointer hover:shadow-lg' : ''
                } ${
                  activeHighlight === currentRisk.id
                    ? 'ring-2 ring-red-400 dark:ring-red-500 shadow-lg bg-red-50/50 dark:bg-red-950/30 border-red-300 dark:border-red-600'
                    : 'border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-600'
                } bg-gradient-to-r from-red-50/80 to-orange-50/80 dark:from-red-950/20 dark:to-orange-950/20`}
                onClick={() => {
                  const hasHighlight = highlights.find(h => h.id === currentRisk.id);
                  hasHighlight && onHighlightClick(currentRisk.id);
                }}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 ${getSeverityIconClasses(currentRisk.severity)} rounded-lg flex-shrink-0`}>
                    <AlertTriangle className={`h-5 w-5 text-${getSeverityColor(currentRisk.severity)}-600 dark:text-${getSeverityColor(currentRisk.severity)}-400`} />
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <AlertDescription className="text-red-800 dark:text-red-200 leading-relaxed font-medium text-sm flex-1">
                        <MarkdownRenderer content={currentRisk.text} />
                      </AlertDescription>
                      <div className="flex flex-col gap-2 items-end">
                        <div className="flex flex-col gap-1 items-end">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getCategoryBadgeClasses(currentRisk.category)} capitalize`}
                          >
                            {currentRisk.category}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getSeverityBadgeClasses(currentRisk.severity)} capitalize`}
                          >
                            {currentRisk.severity}
                          </Badge>
                        </div>
                        
                        {/* Copy and Feedback buttons */}
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(currentRisk.text, currentRisk.id)}
                            className="h-7 w-7 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                            title="Copy risk"
                          >
                            <Copy className={`h-3 w-3 ${copiedItem === currentRisk.id ? 'text-red-600' : 'text-gray-500'}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFeedback(currentRisk.id, 'positive')}
                            className={`h-7 w-7 p-0 hover:bg-green-100 dark:hover:bg-green-900/20 ${
                              feedbackGiven[currentRisk.id] === 'positive' ? 'bg-green-100 dark:bg-green-900/20' : ''
                            }`}
                            title="Accurate risk assessment"
                          >
                            <ThumbsUp className={`h-3 w-3 ${
                              feedbackGiven[currentRisk.id] === 'positive' ? 'text-green-600' : 'text-gray-500'
                            }`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFeedback(currentRisk.id, 'negative')}
                            className={`h-7 w-7 p-0 hover:bg-red-100 dark:hover:bg-red-900/20 ${
                              feedbackGiven[currentRisk.id] === 'negative' ? 'bg-red-100 dark:bg-red-900/20' : ''
                            }`}
                            title="Inaccurate assessment"
                          >
                            <ThumbsDown className={`h-3 w-3 ${
                              feedbackGiven[currentRisk.id] === 'negative' ? 'text-red-600' : 'text-gray-500'
                            }`} />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {highlights.find(h => h.id === currentRisk.id) && (
                      <div className="flex items-center gap-3 pt-2 border-t border-red-200 dark:border-red-700">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 border-red-300 dark:border-red-700"
                          onClick={(e) => {
                            e.stopPropagation() // Prevent alert click
                            onHighlightClick(currentRisk.id)
                          }}
                        >
                          <Search className="h-3 w-3 mr-1" />
                          {activeHighlight === currentRisk.id ? 'Hide highlight' : 'Show in document'}
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                        
                        {currentRisk.quote && (
                          <div className="flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                            <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                            <span className="italic">"{currentRisk.quote.substring(0, 40)}..."</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Alert>

              {/* Risks Pagination */}
              <div className="flex items-center justify-between pt-2 border-t border-red-200 dark:border-red-700">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentRiskIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentRiskIndex === 0}
                  className="text-xs"
                >
                  <ChevronLeft className="h-3 w-3 mr-1" />
                  Previous
                </Button>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Risk {currentRiskIndex + 1} of {risks.length}
                  </p>
                  <div className="flex gap-1 mt-1 justify-center">
                    {risks.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${
                          index === currentRiskIndex
                            ? 'bg-red-500'
                            : 'bg-slate-300 dark:bg-gray-600 hover:bg-red-300'
                        }`}
                        onClick={() => setCurrentRiskIndex(index)}
                      />
                    ))}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentRiskIndex(prev => Math.min(risks.length - 1, prev + 1))}
                  disabled={currentRiskIndex === risks.length - 1}
                  className="text-xs"
                >
                  Next
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-2xl p-8">
                <div className="p-4 bg-green-100 dark:bg-green-900/40 rounded-full w-fit mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-green-800 dark:text-green-200 mb-2">
                  No Significant Risks Detected
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  The document appears to be low risk based on our comprehensive AI analysis.
                </p>
                <Badge className="mt-3 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <Star className="h-3 w-3 mr-1" />
                  All Clear
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ProfessionalAnalysisDisplay