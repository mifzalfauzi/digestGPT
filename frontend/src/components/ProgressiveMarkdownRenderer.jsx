import React, { useMemo } from 'react'

function ProgressiveMarkdownRenderer({ content, className = '' }) {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL
  if (!content) {
    return null
  }

  const parseProgressiveMarkdown = useMemo(() => {
    if (!content) return []

    // Simple and robust markdown parsing that works with partial content
    const parseMarkdown = (text) => {
      // First, detect and parse tables
      const tableRegex = /^\|(.+)\|\s*\n\|[-\s\|:]+\|\s*\n((?:\|.*\|\s*\n?)+)/gm
      const tables = []
      let tableMatch
      
      // Find all tables and their positions
      while ((tableMatch = tableRegex.exec(text)) !== null) {
        const tableStart = tableMatch.index
        const tableEnd = tableRegex.lastIndex
        const headerRow = tableMatch[1].trim()
        const bodyRows = tableMatch[2].trim()
        
        tables.push({
          start: tableStart,
          end: tableEnd,
          header: headerRow,
          body: bodyRows,
          fullMatch: tableMatch[0]
        })
      }

      // Use a simple regex-based approach that processes the entire text
      const parts = []
      let lastIndex = 0
      
      // Combined regex for all markdown patterns - only match complete patterns
      // Order matters: ** before *, __ before _, longer patterns first
      const markdownRegex = /(\*\*([^*\n]+?)\*\*)|(__([^_\n]+?)__)|(\*([^*\s\n][^*\n]*?)\*)|(_([^_\s\n][^_\n]*?)_)|(`([^`\n]+?)`)|^(#{1,3})\s+(.+?)(?=\n|$)/gm
      
      // Check for tables first and add them to parts
      for (const table of tables) {
        // Add any text before this table
        if (table.start > lastIndex) {
          const beforeText = text.substring(lastIndex, table.start)
          if (beforeText.trim()) {
            const beforeParts = parseNonTableContent(beforeText)
            parts.push(...beforeParts)
          }
        }
        
        // Add the table
        parts.push({
          type: 'table',
          content: table.fullMatch,
          header: table.header,
          body: table.body
        })
        
        lastIndex = table.end
      }
      
      // Add any remaining text after all tables
      if (lastIndex < text.length) {
        const remainingText = text.substring(lastIndex)
        if (remainingText.trim()) {
          const remainingParts = parseNonTableContent(remainingText)
          parts.push(...remainingParts)
        }
      }
      
      // If no tables found, parse the entire text normally
      if (tables.length === 0) {
        return parseNonTableContent(text)
      }
      
      return parts
    }

    // Separate function to parse non-table markdown content
    const parseNonTableContent = (text) => {
      const parts = []
      let lastIndex = 0

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
        
        case 'table':
          // Helper function to process markdown in cell content
          const processMarkdownInCell = (cellContent) => {
            // Parse basic markdown formatting
            return cellContent
              .replace(/\*\*(.*?)\*\*/g, '<strong className="font-semibold">$1</strong>')
              .replace(/__(.*?)__/g, '<strong className="font-semibold">$1</strong>')
              .replace(/\*(.*?)\*/g, '<em className="italic">$1</em>')
              .replace(/_(.*?)_/g, '<em className="italic">$1</em>')
              .replace(/`([^`]+)`/g, '<code className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded text-xs font-mono">$1</code>')
          }

          const headerCells = token.header.split('|').map(cell => cell.trim()).filter(cell => cell)
          const bodyRowsArray = token.body.split('\n').filter(row => row.trim()).map(row => 
            row.split('|').map(cell => cell.trim()).filter(cell => cell)
          )
          const tableId = 'table-' + Math.random().toString(36).substr(2, 9)
          
          const handleCopyTable = () => {
            // Create CSV content for fallback
            let csvContent = ''
            csvContent += headerCells.map(cell => {
              if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                return '"' + cell.replace(/"/g, '""') + '"'
              }
              return cell
            }).join(',') + '\n'
            
            bodyRowsArray.forEach(row => {
              const rowData = row.map(cell => {
                if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                  return '"' + cell.replace(/"/g, '""') + '"'
                }
                return cell
              })
              csvContent += rowData.join(',') + '\n'
            })
            
            // Create HTML table for rich paste (Google Docs, Word, etc.)
            let htmlContent = '<table border="1" style="border-collapse: collapse; width: 100%;">'
            
            // Header
            htmlContent += '<thead><tr>'
            headerCells.forEach(cell => {
              htmlContent += `<th style="padding: 8px; border: 1px solid #ddd; background-color: #f5f5f5; font-weight: bold; text-align: left;">${cell}</th>`
            })
            htmlContent += '</tr></thead>'
            
            // Body
            htmlContent += '<tbody>'
            bodyRowsArray.forEach(row => {
              htmlContent += '<tr>'
              row.forEach(cell => {
                htmlContent += `<td style="padding: 8px; border: 1px solid #ddd;">${cell}</td>`
              })
              htmlContent += '</tr>'
            })
            htmlContent += '</tbody></table>'
            
            // Copy both HTML and plain text formats
            const clipboardItem = new ClipboardItem({
              'text/html': new Blob([htmlContent], { type: 'text/html' }),
              'text/plain': new Blob([csvContent], { type: 'text/plain' })
            })
            
            navigator.clipboard.write([clipboardItem]).then(() => {
              console.log('Table copied to clipboard with formatting')
            }).catch(err => {
              console.error('Failed to copy table with formatting, falling back to text:', err)
              // Fallback to plain text if HTML copy fails
              navigator.clipboard.writeText(csvContent).then(() => {
                console.log('Table copied to clipboard as text')
              }).catch(fallbackErr => {
                console.error('Failed to copy table:', fallbackErr)
              })
            })
          }
          
          return (
            <div key={key} className="relative group overflow-x-auto my-4">
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button 
                  onClick={handleCopyTable}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded shadow-md transition-colors flex items-center gap-1"
                  title="Copy table as CSV"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                  
                </button>
              </div>
              <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    {headerCells.map((cell, cellIndex) => (
                      <th 
                        key={cellIndex} 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 last:border-r-0"
                        dangerouslySetInnerHTML={{ __html: processMarkdownInCell(cell) }}
                      />
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {bodyRowsArray.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      {row.map((cell, cellIndex) => (
                        <td 
                          key={cellIndex} 
                          className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap border-r border-gray-200 dark:border-gray-600 last:border-r-0"
                          dangerouslySetInnerHTML={{ __html: processMarkdownInCell(cell) }}
                        />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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