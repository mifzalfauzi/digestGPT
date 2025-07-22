import React from 'react'
import { CheckCircle2, ArrowRight, Zap, AlertTriangle, Info, Star } from 'lucide-react'

// Enhanced MarkdownRenderer component that handles all markdown syntax
function MarkdownRenderer({ content, className = "" }) {
  const parseMarkdown = (text) => {
    if (!text) return text

    let parsed = text
      // Headers (##, ###, ####)
      .replace(/^#### (.*$)/gm, '<h4 class="text-sm font-bold text-slate-900 dark:text-white mb-1">$1</h4>')
      .replace(/^### (.*$)/gm, '<h3 class="text-base font-bold text-slate-900 dark:text-white mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-lg font-bold text-slate-900 dark:text-white mb-2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold text-slate-900 dark:text-white mb-3">$1</h1>')
      
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>')
      .replace(/__(.*?)__/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>')
      
      // Italic text
      .replace(/\*(.*?)\*/g, '<em class="italic text-slate-800 dark:text-slate-200">$1</em>')
      .replace(/_(.*?)_/g, '<em class="italic text-slate-800 dark:text-slate-200">$1</em>')
      
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded text-xs font-mono">$1</code>')
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors" target="_blank" rel="noopener noreferrer">$1</a>')
      
      // Line breaks
      .replace(/\n/g, '<br>')

    return parsed
  }

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
    />
  )
}

function MessageFormatter({ content, className = "" }) {
  const formatMessage = (text) => {
    if (!text) return []

    // Split by double line breaks first to handle paragraphs
    const paragraphs = text.split(/\n\s*\n/)
    
    return paragraphs.map((paragraph, pIndex) => {
      const lines = paragraph.split('\n')
      const formattedLines = []
      
      lines.forEach((line, index) => {
        const trimmedLine = line.trim()
        if (!trimmedLine) return

        // Check for numbered lists (1. 2. 3. etc.)
        const numberedListMatch = trimmedLine.match(/^(\d+)\.\s*(.+)/)
        if (numberedListMatch) {
          formattedLines.push(
            <div key={`${pIndex}-${index}`} className="group flex gap-2 my-1.5 p-2 rounded-lg bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100/50 dark:border-blue-800/30 hover:shadow-sm transition-all duration-200">
              <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-xs">
                  {numberedListMatch[1]}
                </span>
              </div>
              <div className="flex-1 pt-0.5">
                <MarkdownRenderer 
                  content={numberedListMatch[2]}
                  className="text-slate-800 dark:text-slate-100 font-medium leading-relaxed text-sm"
                />
              </div>
            </div>
          )
          return
        }

        // Check for unordered list items starting with - or *
        const bulletMatch = trimmedLine.match(/^[-*•]\s*(.+)/)
        if (bulletMatch) {
          formattedLines.push(
            <div key={`${pIndex}-${index}`} className="group flex gap-2 my-1 ml-1 p-2 rounded-md bg-gradient-to-r from-slate-50/80 to-gray-50/80 dark:from-slate-800/30 dark:to-gray-800/30 hover:bg-gradient-to-r hover:from-slate-100/80 hover:to-gray-100/80 dark:hover:from-slate-700/30 dark:hover:to-gray-700/30 transition-all duration-200">
              <div className="flex-shrink-0 w-1 h-1 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full mt-2 shadow-sm"></div>
              <MarkdownRenderer 
                content={bulletMatch[1]}
                className="flex-1 text-slate-700 dark:text-slate-200 leading-relaxed text-sm"
              />
            </div>
          )
          return
        }

        // Check for sub-bullets with indentation
        const subBulletMatch = trimmedLine.match(/^\s+[-*•]\s*(.+)/)
        if (subBulletMatch) {
          formattedLines.push(
            <div key={`${pIndex}-${index}`} className="group flex gap-2 my-1 ml-6 p-1.5 rounded-md bg-gradient-to-r from-amber-50/60 to-orange-50/60 dark:from-amber-900/20 dark:to-orange-900/20 hover:bg-gradient-to-r hover:from-amber-100/60 hover:to-orange-100/60 dark:hover:from-amber-800/20 dark:hover:to-orange-800/20 transition-all duration-200">
              <ArrowRight className="flex-shrink-0 w-2.5 h-2.5 text-amber-500 dark:text-amber-400 mt-1" />
              <MarkdownRenderer 
                content={subBulletMatch[1]}
                className="flex-1 text-slate-600 dark:text-slate-300 text-xs leading-relaxed"
              />
            </div>
          )
          return
        }

        // Check for markdown headers at the beginning of lines
        const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/)
        if (headerMatch) {
          const level = headerMatch[1].length
          const headerText = headerMatch[2]
          
          const headerClasses = {
            1: 'text-xl font-bold mb-3',
            2: 'text-lg font-bold mb-2',
            3: 'text-base font-bold mb-2',
            4: 'text-sm font-bold mb-1',
            5: 'text-sm font-bold mb-1',
            6: 'text-xs font-bold mb-1'
          }
          
          formattedLines.push(
            <div key={`${pIndex}-${index}`} className={`group flex gap-2 items-center mt-3 mb-2 p-2 rounded-lg `}>
              <div className="flex-shrink-0  ">
                {/* <Star className="w-4 h-4 text-purple-600 dark:text-purple-400" /> */}
              </div>
              <MarkdownRenderer 
                content={headerText}
                className={`text-slate-900  dark:text-white ${headerClasses[level]}`}
              />
            </div>
          )
          return
        }

        // Check for important headers (lines ending with :)
        if (trimmedLine.endsWith(':') && trimmedLine.length < 100 && !trimmedLine.includes('**')) {
          const isMainHeader = trimmedLine.length < 50
          formattedLines.push(
            <div key={`${pIndex}-${index}`} className={`group flex gap-2 items-center ${isMainHeader ? 'mt-3 mb-2' : 'mt-2 mb-1'} p-2 rounded-lg bg-gradient-to-r from-purple-50/80 to-pink-50/80 dark:from-purple-950/30 dark:to-pink-950/30 border-l-3 border-purple-400 dark:border-purple-500`}>
              <div className="flex-shrink-0">
                {isMainHeader ? (
                  <Star className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                ) : (
                  <Info className="w-3 h-3 text-purple-500 dark:text-purple-400" />
                )}
              </div>
              <MarkdownRenderer 
                content={trimmedLine}
                className={`font-bold text-slate-900 dark:text-white ${isMainHeader ? 'text-base' : 'text-sm'}`}
              />
            </div>
          )
          return
        }

        // Check for section headers (UPPERCASE words followed by :)
        const upperHeaderMatch = trimmedLine.match(/^([A-Z][A-Z\s]+):\s*(.*)/)
        if (upperHeaderMatch) {
          formattedLines.push(
            <div key={`${pIndex}-${index}`} className="group flex gap-2 items-start mt-3 mb-2 p-2.5 rounded-lg bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200/50 dark:border-emerald-700/30 shadow-sm">
              <div className="flex-shrink-0 mt-0.5">
                <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <MarkdownRenderer 
                  content={`${upperHeaderMatch[1]}:`}
                  className="font-bold text-emerald-800 dark:text-emerald-200 text-base"
                />
                {upperHeaderMatch[2] && (
                  <MarkdownRenderer 
                    content={upperHeaderMatch[2]}
                    className="ml-2 text-slate-700 dark:text-slate-200 font-medium text-sm"
                  />
                )}
              </div>
            </div>
          )
          return
        }

        // Check for warning or attention-grabbing content
        const isWarning = /\b(warning|error|important|critical|attention|note)\b/i.test(trimmedLine)
        const isQuestion = trimmedLine.includes('?')
        
        // Regular lines with enhanced styling
        if (isWarning) {
          formattedLines.push(
            <div key={`${pIndex}-${index}`} className="group flex gap-2 my-1.5 p-2 rounded-lg bg-gradient-to-r from-red-50/80 to-orange-50/80 dark:from-red-950/30 dark:to-orange-950/30 border-l-3 border-red-400 dark:border-red-500">
              <AlertTriangle className="flex-shrink-0 w-3 h-3 text-red-500 dark:text-red-400 mt-0.5" />
              <MarkdownRenderer 
                content={trimmedLine}
                className="flex-1 text-slate-800 dark:text-slate-100 leading-relaxed font-medium text-sm"
              />
            </div>
          )
        } else if (isQuestion) {
          formattedLines.push(
            <div key={`${pIndex}-${index}`} className="group flex gap-2 my-1.5 p-2 rounded-lg bg-gradient-to-r from-cyan-50/80 to-blue-50/80 dark:from-cyan-950/30 dark:to-blue-950/30 border border-cyan-200/50 dark:border-cyan-700/30">
              <div className="flex-shrink-0 w-4 h-4 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-white text-xs font-bold">?</span>
              </div>
              <MarkdownRenderer 
                content={trimmedLine}
                className="flex-1 text-slate-800 dark:text-slate-100 leading-relaxed font-medium text-sm"
              />
            </div>
          )
        } else {
          formattedLines.push(
            <div key={`${pIndex}-${index}`} className="my-1 p-1.5 rounded-md hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors duration-200">
              <MarkdownRenderer 
                content={trimmedLine}
                className="text-slate-700 dark:text-slate-200 leading-relaxed text-sm"
              />
            </div>
          )
        }
      })

      // Wrap each paragraph with enhanced styling
      return (
        <div key={pIndex} className={`${pIndex > 0 ? "mt-4" : ""} space-y-0.5`}>
          {formattedLines}
        </div>
      )
    })
  }

  return (
    <div className={`leading-relaxed space-y-1 ${className}`}>
      {formatMessage(content)}
    </div>
  )
}

export default MessageFormatter