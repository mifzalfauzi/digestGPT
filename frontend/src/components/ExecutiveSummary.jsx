import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { 
  Brain, 
  Target, 
  AlertTriangle, 
  CheckCircle2,
  Sparkles,
  Clock,
  TrendingUp
} from 'lucide-react'

function ExecutiveSummary({ results }) {
  const summary = results?.analysis?.summary || ''
  const insights = results?.analysis?.key_points || []
  const risks = results?.analysis?.risk_flags || []

  return (
    <div className="space-y-6 p-6">
      {/* Executive Summary Card */}
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
                Summary by Claude 4 Sonnet
              </p>
            </div>
            
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50/80 to-blue-50/80 dark:from-purple-950/30 dark:to-blue-950/30 rounded-2xl p-6 border border-purple-200/50 dark:border-purple-800/30">
            <p className="text-slate-800 dark:text-slate-100 leading-relaxed text-base font-medium">
              {summary || 'Comprehensive analysis will appear here after document processing...'}
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            {/* <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-800/30">
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
            </div> */}
            
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

      {/* Analysis Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Insights Overview */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <CardTitle className="text-lg text-emerald-900 dark:text-emerald-100">
                Strategic Insights
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-700 dark:text-emerald-300">Total Insights Identified</span>
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                  {insights.length}
                </Badge>
              </div>
              
              {insights.length > 0 && (
                <>
                  <div className="h-2 bg-emerald-200 dark:bg-emerald-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full w-full"></div>
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    Click on insights in the Analysis tab to explore details and view highlights
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Risks Overview */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50/50 to-orange-50/50 dark:from-red-950/20 dark:to-orange-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-lg text-red-900 dark:text-red-100">
                Risk Assessment
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-700 dark:text-red-300">
                  {risks.length === 0 ? 'Risk Level' : 'Total Risks Identified'}
                </span>
                <Badge className={`${
                  risks.length === 0 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {risks.length === 0 ? 'Low Risk' : risks.length}
                </Badge>
              </div>
              
              {risks.length > 0 ? (
                <>
                  <div className="h-2 bg-red-200 dark:bg-red-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-400 to-orange-500 rounded-full w-full"></div>
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Review risks in the Analysis tab for detailed assessment and mitigation guidance
                  </p>
                </>
              ) : (
                <>
                  <div className="h-2 bg-green-200 dark:bg-green-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full w-full"></div>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Document appears to be low risk based on comprehensive AI analysis
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Timestamp */}
      <Card className="border-0 shadow-sm bg-slate-50/50 dark:bg-gray-800/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-3 text-sm text-slate-600 dark:text-gray-400">
            <Clock className="h-4 w-4" />
            <span>Analysis completed at {new Date().toLocaleString()}</span>
          
            
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ExecutiveSummary 