import React, { useState, useEffect } from 'react'

function HighlightableText({ text, highlights = [], activeHighlight = null, onHighlightClick }) {
  const [renderedText, setRenderedText] = useState([])

  useEffect(() => {
    console.log('HighlightableText - Text length:', text?.length)
    console.log('HighlightableText - Highlights:', highlights)
    console.log('HighlightableText - Active highlight:', activeHighlight)

    if (!text) {
      setRenderedText([])
      return
    }

    // Filter and sort highlights by start position
    const validHighlights = highlights
      .filter(h => {
        if (!h.position || !h.position.found) {
          console.log('Invalid highlight position:', h)
          return false
        }
        if (h.position.start < 0 || h.position.end > text.length || h.position.start >= h.position.end) {
          console.log('Invalid highlight range:', h)
          return false
        }
        return true
      })
      .sort((a, b) => a.position.start - b.position.start)

    console.log('Valid highlights:', validHighlights)

    if (validHighlights.length === 0) {
      setRenderedText([{ type: 'text', content: text, id: 'base' }])
      return
    }

    const parts = []
    let lastIndex = 0

    validHighlights.forEach((highlight, index) => {
      const { start, end } = highlight.position
      
      // Skip overlapping highlights
      if (start < lastIndex) {
        console.log('Skipping overlapping highlight:', highlight)
        return
      }
      
      // Add text before this highlight
      if (start > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, start),
          id: `text-${index}`
        })
      }

      // Add the highlighted text
      parts.push({
        type: 'highlight',
        content: text.slice(start, end),
        id: highlight.id || `highlight-${index}`,
        isActive: activeHighlight === (highlight.id || `highlight-${index}`),
        highlightData: highlight
      })

      lastIndex = end
    })

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex),
        id: 'text-end'
      })
    }

    console.log('Rendered parts:', parts)
    setRenderedText(parts)
  }, [text, highlights, activeHighlight])

  const getHighlightClass = (isActive, highlightType) => {
    const baseClass = "transition-all duration-300 cursor-pointer rounded-md px-2 py-1 mx-0.5 inline-block hover:shadow-md"
    
    if (isActive) {
      return highlightType === 'risk' 
        ? `${baseClass} bg-red-200 dark:bg-red-800/60 text-red-900 dark:text-red-100 ring-2 ring-red-500 shadow-lg scale-105`
        : `${baseClass} bg-blue-200 dark:bg-blue-800/60 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500 shadow-lg scale-105`
    }
    
    return highlightType === 'risk'
      ? `${baseClass} bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-700`
      : `${baseClass} bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-700`
  }

  const handleHighlightClick = (highlightData) => {
    console.log('Highlight clicked:', highlightData)
    if (onHighlightClick) {
      onHighlightClick(highlightData.id)
    }
  }

  if (!text) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-gray-400 italic">
        No text available for highlighting
      </div>
    )
  }

  return (
    <div className="whitespace-pre-wrap leading-relaxed text-sm text-slate-700 dark:text-gray-300 select-text font-mono">
      {renderedText.map((part) => {
        if (part.type === 'text') {
          return (
            <span key={part.id} className="break-words">
              {part.content}
            </span>
          )
        } else {
          return (
            <span
              key={part.id}
              className={getHighlightClass(part.isActive, part.highlightData?.type)}
              title={part.highlightData?.tooltip}
              onClick={() => handleHighlightClick(part.highlightData)}
            >
              {part.content}
            </span>
          )
        }
      })}
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
          <p>Debug: {highlights.length} highlights, {renderedText.filter(p => p.type === 'highlight').length} rendered</p>
        </div>
      )}
    </div>
  )
}

export default HighlightableText 