import React, { useMemo } from 'react'

function ProgressiveMarkdownRenderer({ content, className = '' }) {
  if (!content) {
    return null
  }

  const parseProgressiveMarkdown = useMemo(() => {
    if (!content) return []

    // Simple and robust markdown parsing that works with partial content
    const parseMarkdown = (text) => {
      // Use a simple regex-based approach that processes the entire text
      const parts = []
      let lastIndex = 0
      
      // Combined regex for all markdown patterns - only match complete patterns
      // Order matters: ** before *, __ before _, longer patterns first
      const markdownRegex = /(\*\*([^*\n]+?)\*\*)|(__([^_\n]+?)__)|(\*([^*\s\n][^*\n]*?)\*)|(_([^_\s\n][^_\n]*?)_)|(`([^`\n]+?)`)|^(#{1,3})\s+(.+?)(?=\n|$)/gm
      
      let match
      while ((match = markdownRegex.exec(text)) !== null) {
        const matchStart = match.index
        const matchEnd = markdownRegex.lastIndex
        
        // Add any text before this match as plain text
        if (matchStart > lastIndex) {
          const plainText = text.substring(lastIndex, matchStart)
          if (plainText) {
            parts.push({ type: 'text', content: plainText })
          }
        }
        
        // Determine the type of match and add it
        if (match[1]) { // **bold**
          parts.push({ type: 'bold', content: match[1], inner: match[2] })
        } else if (match[3]) { // __bold__
          parts.push({ type: 'bold', content: match[3], inner: match[4] })
        } else if (match[5]) { // *italic*
          parts.push({ type: 'italic', content: match[5], inner: match[6] })
        } else if (match[7]) { // _italic_
          parts.push({ type: 'italic', content: match[7], inner: match[8] })
        } else if (match[9]) { // `code`
          parts.push({ type: 'code', content: match[9], inner: match[10] })
        } else if (match[11] && match[12]) { // # Header
          parts.push({ 
            type: 'header', 
            content: match[0], 
            inner: match[12], 
            level: match[11].length 
          })
        }
        
        lastIndex = matchEnd
      }
      
      // Add any remaining text
      if (lastIndex < text.length) {
        const remainingText = text.substring(lastIndex)
        if (remainingText) {
          parts.push({ type: 'text', content: remainingText })
        }
      }
      
      // If no matches found, return the entire text as plain text
      return parts.length > 0 ? parts : [{ type: 'text', content: text }]
    }

    return parseMarkdown(content)
  }, [content])

  const renderTokens = (tokens) => {
    return tokens.map((token, index) => {
      const key = `${token.type}-${index}-${token.content?.substring(0, 10) || ''}`
      
      switch (token.type) {
        case 'header':
          const HeaderTag = token.level === 1 ? 'h1' : token.level === 2 ? 'h2' : 'h3'
          return (
            <HeaderTag 
              key={key}
              className={`font-bold text-slate-900 dark:text-white ${
                token.level === 1 ? 'text-xl mb-3 mt-4' :
                token.level === 2 ? 'text-lg mb-2 mt-3' :
                'text-base mb-2 mt-2'
              }`}
            >
              {token.inner}
            </HeaderTag>
          )
        
        case 'bold':
          return (
            <strong 
              key={key}
              className="font-semibold text-slate-900 dark:text-white"
            >
              {token.inner}
            </strong>
          )
        
        case 'italic':
          return (
            <em 
              key={key}
              className="italic text-slate-800 dark:text-slate-200"
            >
              {token.inner}
            </em>
          )
        
        case 'code':
          return (
            <code 
              key={key}
              className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded text-sm font-mono"
            >
              {token.inner}
            </code>
          )
        
        case 'paragraph':
          return <div key={key} className="mb-3" />
        
        case 'break':
          return <br key={key} />
        
        case 'text':
        default:
          // Handle bullet points and numbered lists in plain text
          const lines = token.content.split('\n')
          return lines.map((line, lineIndex) => {
            const lineKey = `${key}-line-${lineIndex}`
            const trimmed = line.trim()
            
            // Numbered list
            const numberedMatch = trimmed.match(/^(\d+)\.\s*(.+)/)
            if (numberedMatch) {
              return (
                <div key={lineKey} className="flex gap-2 my-1.5">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {numberedMatch[1]}
                  </span>
                  <span className="text-slate-700 dark:text-slate-200">
                    {numberedMatch[2]}
                  </span>
                </div>
              )
            }
            
            // Bullet point
            const bulletMatch = trimmed.match(/^[-•*]\s*(.+)/)
            if (bulletMatch) {
              return (
                <div key={lineKey} className="flex gap-2 my-1">
                  <span className="flex-shrink-0 w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full mt-2" />
                  <span className="text-slate-700 dark:text-slate-200">
                    {bulletMatch[1]}
                  </span>
                </div>
              )
            }
            
            // Regular text
            if (trimmed) {
              return (
                <span key={lineKey}>
                  {line}
                  {lineIndex < lines.length - 1 && <br />}
                </span>
              )
            }
            
            return lineIndex < lines.length - 1 ? <br key={lineKey} /> : null
          }).filter(Boolean)
      }
    }).filter(Boolean)
  }

  return (
    <div className={`leading-relaxed ${className}`}>
      {renderTokens(parseProgressiveMarkdown)}
    </div>
  )
}

export default ProgressiveMarkdownRenderer