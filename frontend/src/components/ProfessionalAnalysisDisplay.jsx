import React, { useState, useEffect } from 'react'
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
  Clock
} from 'lucide-react'
import HighlightableText from './HighlightableText'

function ProfessionalAnalysisDisplay({ results, onHighlightClick, activeHighlight, showSummary = true }) {
  const [insights, setInsights] = useState([])
  const [risks, setRisks] = useState([])
  const [summary, setSummary] = useState('')
  const [highlights, setHighlights] = useState([])

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
      default: return 'gray'
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

  return (
    <div className="space-y-6 p-6">
      {/* Executive Summary - Only show if showSummary is true */}
      {showSummary && (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-50 to-white dark:from-gray-800 dark:to-gray-900">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                  Executive Summary
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
                  AI-powered analysis powered by Claude 4 Sonnet
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
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-800/30">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Key Insights</span>
                </div>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">
                  {insights.length}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 rounded-xl p-4 border border-red-200/50 dark:border-red-800/30">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-800 dark:text-red-200">Risk Flags</span>
                </div>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100 mt-1">
                  {risks.length}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/30">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Completion</span>
                </div>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                  100%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Insights Section */}
      <Card className="border-0 shadow-xl">
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
                  Key points identified by advanced AI analysis
                </p>
              </div>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
              {insights.length} insights
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.length > 0 ? (
            insights.map((insight, index) => {
              const isActive = activeHighlight === insight.id
              const hasHighlight = highlights.find(h => h.id === insight.id)
              const categoryColor = getCategoryColor(insight.category)
              
              return (
                <Card 
                  key={insight.id}
                  className={`transition-all duration-300 ${
                    hasHighlight ? 'cursor-pointer hover:shadow-lg' : ''
                  } ${
                    isActive
                      ? 'ring-2 ring-emerald-400 dark:ring-emerald-500 shadow-lg bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700'
                      : 'border-slate-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600'
                  }`}
                  onClick={() => hasHighlight && onHighlightClick(insight.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 bg-${categoryColor}-100 dark:bg-${categoryColor}-900/30 rounded-lg flex-shrink-0`}>
                        {getCategoryIcon(insight.category)}
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-slate-800 dark:text-slate-100 leading-relaxed font-medium">
                            {insight.text}
                          </p>
                          <Badge 
                            variant="outline" 
                            className={`text-xs bg-${categoryColor}-50 text-${categoryColor}-700 dark:bg-${categoryColor}-900/20 dark:text-${categoryColor}-300 capitalize`}
                          >
                            {insight.category}
                          </Badge>
                        </div>
                        
                        {hasHighlight && (
                          <div className="flex items-center gap-3 pt-2 border-t border-slate-200 dark:border-gray-600">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700"
                            >
                              <Search className="h-3 w-3 mr-1" />
                              {isActive ? 'Hide highlight' : 'Show in document'}
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                            
                            {insight.quote && (
                              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-gray-400">
                                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                                <span className="italic">"{insight.quote.substring(0, 40)}..."</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
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

      {/* Risk Assessment Section */}
      <Card className="border-0 shadow-xl">
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
              {risks.length === 0 ? 'Low Risk' : `${risks.length} risks found`}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {risks.length > 0 ? (
            risks.map((risk, index) => {
              const isActive = activeHighlight === risk.id
              const hasHighlight = highlights.find(h => h.id === risk.id)
              const severityColor = getSeverityColor(risk.severity)
              const categoryColor = getCategoryColor(risk.category)
              
              return (
                <Alert 
                  key={risk.id}
                  className={`transition-all duration-300 ${
                    hasHighlight ? 'cursor-pointer hover:shadow-lg' : ''
                  } ${
                    isActive
                      ? 'ring-2 ring-red-400 dark:ring-red-500 shadow-lg bg-red-50/50 dark:bg-red-950/30 border-red-300 dark:border-red-600'
                      : 'border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-600'
                  } bg-gradient-to-r from-red-50/80 to-orange-50/80 dark:from-red-950/20 dark:to-orange-950/20`}
                  onClick={() => hasHighlight && onHighlightClick(risk.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 bg-${severityColor}-100 dark:bg-${severityColor}-900/30 rounded-lg flex-shrink-0`}>
                      <AlertTriangle className={`h-5 w-5 text-${severityColor}-600 dark:text-${severityColor}-400`} />
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <AlertDescription className="text-red-800 dark:text-red-200 leading-relaxed font-medium text-base">
                          {risk.text}
                        </AlertDescription>
                        <div className="flex gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs bg-${severityColor}-50 text-${severityColor}-700 dark:bg-${severityColor}-900/20 dark:text-${severityColor}-300 capitalize`}
                          >
                            {risk.severity}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`text-xs bg-${categoryColor}-50 text-${categoryColor}-700 dark:bg-${categoryColor}-900/20 dark:text-${categoryColor}-300 capitalize`}
                          >
                            {risk.category}
                          </Badge>
                        </div>
                      </div>
                      
                      {hasHighlight && (
                        <div className="flex items-center gap-3 pt-2 border-t border-red-200 dark:border-red-700">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 border-red-300 dark:border-red-700"
                          >
                            <Search className="h-3 w-3 mr-1" />
                            {isActive ? 'Hide highlight' : 'Show in document'}
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                          
                          {risk.quote && (
                            <div className="flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                              <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                              <span className="italic">"{risk.quote.substring(0, 40)}..."</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Alert>
              )
            })
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

      {/* Document Text Section */}
      {/* {results?.document_text && (
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                    Interactive Document
                  </CardTitle>
                  <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
                    Click insights or risks above to highlight them in the text
                  </p>
                </div>
              </div>
              {highlights.length > 0 && (
                <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20">
                  {highlights.length} highlights available
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-50 dark:bg-gray-800 rounded-2xl p-6 max-h-[70vh] overflow-auto border border-slate-200 dark:border-gray-700">
              <HighlightableText 
                text={results.document_text}
                highlights={highlights}
                activeHighlight={activeHighlight}
                onHighlightClick={onHighlightClick}
              />
            </div>
            
            {highlights.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                  <Eye className="h-4 w-4" />
                  <span className="font-medium">Interactive highlights are active.</span>
                  <span>Click on any insight or risk above to see it highlighted in the document text.</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )} */}
    </div>
  )
}

export default ProfessionalAnalysisDisplay 