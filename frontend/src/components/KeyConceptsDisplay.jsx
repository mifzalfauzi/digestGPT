import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import { 
  BookOpen, 
  Lightbulb, 
  ChevronDown, 
  ChevronUp, 
  Info,
  Sparkles,
  MessageCircle 
} from 'lucide-react'

function KeyConceptsDisplay({ concepts = [], onExplainConcept, isDemoMode = false, bypassAPI = false }) {
  const [selectedConcept, setSelectedConcept] = useState(null)

  const handleConceptClick = (concept, index) => {
    const conceptId = `concept-${index}`
    setSelectedConcept(selectedConcept === conceptId ? null : conceptId)
  }

  if (!concepts || concepts.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Key Concepts 
                {isDemoMode && <span className="text-xs text-orange-500 font-normal">(Demo)</span>}
                {bypassAPI && !isDemoMode && <span className="text-xs text-green-600 font-normal">(Preview)</span>}
              </CardTitle>
              <p className="text-xs text-slate-600 dark:text-gray-400 mt-1">
                Important terms and concepts identified
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-full w-fit mx-auto mb-3">
              <BookOpen className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-slate-600 dark:text-gray-400 text-sm">
              {isDemoMode 
                ? 'Demo concepts would appear here in the full version.' 
                : bypassAPI
                ? 'Preview concepts loaded with mock data.'
                : 'No key concepts identified yet. Upload a document to begin analysis.'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Key Concepts 
                {isDemoMode && <span className="text-xs text-orange-500 font-normal">(Demo)</span>}
                {bypassAPI && !isDemoMode && <span className="text-xs text-green-600 font-normal">(Preview)</span>}
              </CardTitle>
              <p className="text-xs text-slate-600 dark:text-gray-400 mt-1">
                {isDemoMode 
                  ? 'Sample concepts from demo document' 
                  : bypassAPI 
                  ? 'Mock concepts for interface preview'
                  : 'Important terms and concepts identified'
                }
              </p>
            </div>
          </div>
          <Badge className={`${
            isDemoMode 
              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' 
              : bypassAPI
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
          } text-xs px-1.5 py-0.5`}>
            {concepts.length} concepts
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {(isDemoMode || bypassAPI) && (
          <div className={`mb-3 p-2 border rounded-lg ${
            isDemoMode 
              ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
              : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          }`}>
            <p className={`text-xs font-medium ${
              isDemoMode 
                ? 'text-orange-700 dark:text-orange-300' 
                : 'text-green-700 dark:text-green-300'
            }`}>
              {isDemoMode 
                ? '💡 Demo Mode - These are sample concepts from the business plan demo'
                : '💡 Preview Mode - Mock concepts loaded to showcase functionality without API usage'
              }
            </p>
          </div>
        )}
        
        <div className="grid gap-2">
          {concepts.map((concept, index) => {
            const conceptId = `concept-${index}`
            const isExpanded = selectedConcept === conceptId
            
            return (
              <div key={conceptId} className="space-y-1.5">
                {/* Concept Term Button */}
                <Button
                  variant="outline"
                  onClick={() => handleConceptClick(concept, index)}
                  className={`w-full justify-between text-left h-auto p-3 transition-all duration-200 ${
                    isExpanded 
                      ? isDemoMode
                        ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700 shadow-md'
                        : bypassAPI
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 shadow-md'
                        : 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 shadow-md'
                      : isDemoMode
                        ? 'hover:bg-orange-50 dark:hover:bg-orange-900/10 border-slate-200 dark:border-gray-700'
                        : bypassAPI
                        ? 'hover:bg-green-50 dark:hover:bg-green-900/10 border-slate-200 dark:border-gray-700'
                        : 'hover:bg-amber-50 dark:hover:bg-amber-900/10 border-slate-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${
                      isDemoMode 
                        ? 'bg-orange-100 dark:bg-orange-900/40' 
                        : bypassAPI
                        ? 'bg-green-100 dark:bg-green-900/40'
                        : 'bg-amber-100 dark:bg-amber-900/40'
                    }`}>
                      <Lightbulb className={`h-3.5 w-3.5 ${
                        isDemoMode 
                          ? 'text-orange-600 dark:text-orange-400' 
                          : bypassAPI
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`} />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">
                        {concept.term}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                        Click to {isExpanded ? 'hide' : 'view'} explanation
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {onExplainConcept && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onExplainConcept(concept.term)
                        }}
                        className={`h-7 w-7 p-0 hover:scale-110 transition-all duration-200 ${
                          isDemoMode 
                            ? 'hover:bg-orange-100 dark:hover:bg-orange-900/30' 
                            : bypassAPI
                            ? 'hover:bg-green-100 dark:hover:bg-green-900/30'
                            : 'hover:bg-amber-100 dark:hover:bg-amber-900/30'
                        }`}
                        title={`Ask AI to explain "${concept.term}" in detail`}
                      >
                        <MessageCircle className={`h-3 w-3 ${
                          isDemoMode 
                            ? 'text-orange-600 dark:text-orange-400' 
                            : bypassAPI
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`} />
                      </Button>
                    )}
                    <Badge variant="outline" className="text-xs px-1 py-0.5">
                      {isDemoMode ? 'Demo' : bypassAPI ? 'Preview' : 'Concept'}
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className={`h-3.5 w-3.5 ${
                        isDemoMode 
                          ? 'text-orange-600 dark:text-orange-400' 
                          : bypassAPI
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`} />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </div>
                </Button>

                {/* Concept Explanation */}
                {isExpanded && (
                  <Alert className={`ml-3 ${
                    isDemoMode 
                      ? 'bg-gradient-to-r from-orange-50/80 to-yellow-50/80 dark:from-orange-950/20 dark:to-yellow-950/20 border-orange-200 dark:border-orange-800'
                      : bypassAPI
                      ? 'bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800'
                      : 'bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800'
                  }`}>
                    <Info className={`h-3.5 w-3.5 ${
                      isDemoMode 
                        ? 'text-orange-600 dark:text-orange-400' 
                        : bypassAPI
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`} />
                    <AlertDescription className={`leading-relaxed ${
                      isDemoMode 
                        ? 'text-orange-800 dark:text-orange-200' 
                        : bypassAPI
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-amber-800 dark:text-amber-200'
                    }`}>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Sparkles className={`h-2.5 w-2.5 ${
                            isDemoMode ? 'text-orange-500' : bypassAPI ? 'text-green-500' : 'text-amber-500'
                          }`} />
                          <span className="text-xs font-medium uppercase tracking-wider">
                            {isDemoMode ? 'Demo Explanation' : bypassAPI ? 'Preview Explanation' : 'Explanation'}
                          </span>
                        </div>
                        <p className="text-sm">
                          {concept.definition || concept.explanation}
                        </p>
                        {concept.importance && (
                          <div className="mt-2 pt-2 border-t border-current/20">
                            <p className="text-xs font-medium mb-1">Importance:</p>
                            <p className="text-xs">{concept.importance}</p>
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )
          })}
        </div>

        {/* Summary Footer */}
        <div className={`mt-4 p-3 rounded-xl border ${
          isDemoMode 
            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
            : bypassAPI
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
        }`}>
          <div className={`flex items-center gap-2 text-sm ${
            isDemoMode 
              ? 'text-orange-800 dark:text-orange-200' 
              : bypassAPI
              ? 'text-green-800 dark:text-green-200'
              : 'text-amber-800 dark:text-amber-200'
          }`}>
            <Info className="h-3.5 w-3.5" />
            <span className="font-medium">
              {concepts.length} key {concepts.length === 1 ? 'concept' : 'concepts'} {isDemoMode ? 'in demo' : bypassAPI ? 'in preview' : 'identified'}
            </span>
          </div>
          <p className={`text-xs mt-1 ${
            isDemoMode 
              ? 'text-orange-700 dark:text-orange-300' 
              : bypassAPI
              ? 'text-green-700 dark:text-green-300'
              : 'text-amber-700 dark:text-amber-300'
          }`}>
            {isDemoMode 
              ? 'In demo mode - try clicking concepts above to see explanations and chat integration.'
              : bypassAPI
              ? 'Preview mode with mock data - click concepts to test functionality without API usage.'
              : 'Click on any concept above to view its detailed explanation and context.'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default KeyConceptsDisplay 