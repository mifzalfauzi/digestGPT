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
  Sparkles 
} from 'lucide-react'

function KeyConceptsDisplay({ concepts = [] }) {
  const [selectedConcept, setSelectedConcept] = useState(null)

  const handleConceptClick = (concept, index) => {
    const conceptId = `concept-${index}`
    setSelectedConcept(selectedConcept === conceptId ? null : conceptId)
  }

  if (!concepts || concepts.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                Key Concepts
              </CardTitle>
              <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
                Important terms and concepts identified
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="p-4 bg-amber-100 dark:bg-amber-900/40 rounded-full w-fit mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-slate-600 dark:text-gray-400">
              No key concepts identified yet. Upload a document to begin analysis.
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
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                Key Concepts
              </CardTitle>
              <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
                Important terms and concepts identified
              </p>
            </div>
          </div>
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            {concepts.length} concepts
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3">
          {concepts.map((concept, index) => {
            const conceptId = `concept-${index}`
            const isExpanded = selectedConcept === conceptId
            
            return (
              <div key={conceptId} className="space-y-2">
                {/* Concept Term Button */}
                <Button
                  variant="outline"
                  onClick={() => handleConceptClick(concept, index)}
                  className={`w-full justify-between text-left h-auto p-4 transition-all duration-200 ${
                    isExpanded 
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 shadow-md' 
                      : 'hover:bg-amber-50 dark:hover:bg-amber-900/10 border-slate-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                      <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {concept.term}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                        Click to {isExpanded ? 'hide' : 'view'} explanation
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Concept
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </Button>

                {/* Concept Explanation */}
                {isExpanded && (
                  <Alert className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800 ml-4">
                    <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <AlertDescription className="text-amber-800 dark:text-amber-200 leading-relaxed">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-3 w-3 text-amber-500" />
                          <span className="text-xs font-medium uppercase tracking-wider">
                            Explanation
                          </span>
                        </div>
                        <p className="text-sm">
                          {concept.explanation}
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )
          })}
        </div>

        {/* Summary Footer */}
        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 text-sm">
            <Info className="h-4 w-4" />
            <span className="font-medium">
              {concepts.length} key {concepts.length === 1 ? 'concept' : 'concepts'} identified
            </span>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
            Click on any concept above to view its detailed explanation and context.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default KeyConceptsDisplay 