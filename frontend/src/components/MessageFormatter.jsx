import React from 'react'
import { CheckCircle2, ArrowRight, Zap, AlertTriangle, Info, Star, Circle, AlertCircle, ShieldAlert, Copy, Check } from 'lucide-react'

// React Table Component for proper event handling
function TableComponent({ headerCells, bodyRows, className = "" }) {
  const [copied, setCopied] = React.useState(false)
  
  // Helper function to process markdown in cell content
  const processMarkdownInCell = (cellContent) => {
    return cellContent
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/__(.*?)__/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/_(.*?)_/g, '<em class="italic">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded text-xs font-mono">$1</code>')
  }
  
  const handleCopyTable = () => {
    // Create CSV content for fallback
    let csvContent = ''
    csvContent += headerCells.map(cell => {
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return '"' + cell.replace(/"/g, '""') + '"'
      }
      return cell
    }).join(',') + '\n'
    
    bodyRows.forEach(row => {
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
    bodyRows.forEach(row => {
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
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(err => {
      console.error('Failed to copy table with formatting, falling back to text:', err)
      // Fallback to plain text if HTML copy fails
      navigator.clipboard.writeText(csvContent).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }).catch(fallbackErr => {
        console.error('Failed to copy table:', fallbackErr)
      })
    })
  }
  
  return (
    <div className={`relative group overflow-x-auto my-4 ${className}`}>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button 
          onClick={handleCopyTable}
          className={`px-2 py-1 text-white text-xs rounded shadow-md transition-colors flex items-center gap-1 ${
            copied ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
          }`}
          title="Copy table as CSV"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              
            </>
          )}
        </button>
      </div>
      <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            {headerCells.map((cell, index) => (
              <th 
                key={index}
                className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                  index === headerCells.length - 1 ? '' : 'border-r border-gray-200 dark:border-gray-600'
                }`}
                dangerouslySetInnerHTML={{ __html: processMarkdownInCell(cell) }}
              />
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {bodyRows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              {row.map((cell, cellIndex) => (
                <td 
                  key={cellIndex}
                  className={`px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap ${
                    cellIndex === row.length - 1 ? '' : 'border-r border-gray-200 dark:border-gray-600'
                  }`}
                  dangerouslySetInnerHTML={{ __html: processMarkdownInCell(cell) }}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

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

        // Check for table lines - if we detect a table, handle the entire table as one block
        if (trimmedLine.includes('|') && lines.length > index + 2) {
          const nextLine = lines[index + 1]?.trim()
          const lineAfterNext = lines[index + 2]?.trim()
          
          // Check if this looks like a table (current line has |, next line has | and -, third line has |)
          if (nextLine?.includes('|') && nextLine?.includes('-') && lineAfterNext?.includes('|')) {
            // Find the full table by looking ahead
            let tableLines = [trimmedLine, nextLine]
            let lookAheadIndex = index + 2
            
            while (lookAheadIndex < lines.length && lines[lookAheadIndex]?.trim().includes('|')) {
              tableLines.push(lines[lookAheadIndex].trim())
              lookAheadIndex++
            }
            
            // Parse the table data for React component
            const headerCells = trimmedLine.split('|').map(cell => cell.trim()).filter(cell => cell)
            const bodyRows = tableLines.slice(2).map(row => 
              row.split('|').map(cell => cell.trim()).filter(cell => cell)
            )
            
            formattedLines.push(
              <TableComponent
                key={`${pIndex}-${index}`}
                headerCells={headerCells}
                bodyRows={bodyRows}
                className="text-slate-700 dark:text-slate-200"
              />
            )
            
            // Skip the processed table lines
            lines.splice(index + 1, lookAheadIndex - index - 1)
            return
          }
        }

        // Check for risk alerts with 🚨 emoji
        if (trimmedLine.includes('🚨')) {
          const riskContent = trimmedLine.replace('🚨', '').trim()
          formattedLines.push(
            <div key={`${pIndex}-${index}`} className="group flex gap-3 my-2 p-3 rounded-lg dark:bg-background text-white transition-all duration-300 ">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400" />
                </div>
              </div>
              <div className="flex-1">
                <MarkdownRenderer 
                  content={riskContent}
                  className="font-semibold text-white [&_strong]:text-white [&_em]:text-red-100"
                />
              </div>
            </div>
          )
          return
        }

        // Check for "Risk:" patterns
        const riskMatch = trimmedLine.match(/^[-*•]?\s*\*\*Risk\*\*:\s*(.+)$/i) || trimmedLine.match(/^[-*•]?\s*Risk:\s*(.+)$/i)
        if (riskMatch) {
          formattedLines.push(
            <div key={`${pIndex}-${index}`} className="group flex gap-2 my-1.5 p-2.5 rounded-lg bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 border border-red-200 dark:border-red-800 hover:shadow-md transition-all duration-200">
              <div className="flex-shrink-0">
                <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
              </div>
              <MarkdownRenderer 
                content={riskMatch[1]}
                className="flex-1 text-red-800 dark:text-red-200 font-medium text-sm"
              />
            </div>
          )
          return
        }

        // Check for "Solution:" patterns
        const solutionMatch = trimmedLine.match(/^[-*•]?\s*\*\*Solution\*\*:\s*(.+)$/i) || trimmedLine.match(/^[-*•]?\s*Solution:\s*(.+)$/i)
        if (solutionMatch) {
          formattedLines.push(
            <div key={`${pIndex}-${index}`} className="group flex gap-2 my-1.5 p-2.5 rounded-lg bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-800 hover:shadow-md transition-all duration-200">
              <div className="flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
              </div>
              <MarkdownRenderer 
                content={solutionMatch[1]}
                className="flex-1 text-green-800 dark:text-green-200 font-medium text-sm"
              />
            </div>
          )
          return
        }

        // Check for checklist items with ✅
        if (trimmedLine.includes('✅')) {
          const checkContent = trimmedLine.replace('✅', '').trim()
          formattedLines.push(
            <div key={`${pIndex}-${index}`} className="group flex gap-2 my-1.5 p-2.5 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 hover:shadow-md transition-all duration-200">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              </div>
              <MarkdownRenderer 
                content={checkContent}
                className="flex-1 text-blue-800 dark:text-blue-200 font-medium text-sm pt-0.5"
              />
            </div>
          )
          return
        }

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
          // Check if it's a risk-related bullet
          const bulletContent = bulletMatch[1]
          const isRiskBullet = bulletContent.toLowerCase().includes('risk') || 
                              bulletContent.includes('denied') || 
                              bulletContent.includes('error') ||
                              bulletContent.includes('flag')
          
          if (isRiskBullet) {
            formattedLines.push(
              <div key={`${pIndex}-${index}`} className="group flex gap-2 my-1 ml-1 p-2 rounded-md bg-gradient-to-r from-orange-50/80 to-red-50/80 dark:from-orange-900/20 dark:to-red-900/20 hover:bg-gradient-to-r hover:from-orange-100/80 hover:to-red-100/80 dark:hover:from-orange-800/20 dark:hover:to-red-800/20 transition-all duration-200">
                <div className="flex-shrink-0 w-1.5 h-1.5 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mt-2 shadow-sm"></div>
                <MarkdownRenderer 
                  content={bulletContent}
                  className="flex-1 text-slate-700 dark:text-slate-200 leading-relaxed text-sm"
                />
              </div>
            )
          } else {
            formattedLines.push(
              <div key={`${pIndex}-${index}`} className="group flex gap-2 my-1 ml-1 p-2 rounded-md bg-gradient-to-r from-slate-50/80 to-gray-50/80 dark:from-slate-800/30 dark:to-gray-800/30 hover:bg-gradient-to-r hover:from-slate-100/80 hover:to-gray-100/80 dark:hover:from-slate-700/30 dark:hover:to-gray-700/30 transition-all duration-200">
                <div className="flex-shrink-0 w-1 h-1 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full mt-2 shadow-sm"></div>
                <MarkdownRenderer 
                  content={bulletContent}
                  className="flex-1 text-slate-700 dark:text-slate-200 leading-relaxed text-sm"
                />
              </div>
            )
          }
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
          
          // Check if it's a risk-related header
          const isRiskHeader = headerText.toLowerCase().includes('risk') || 
                              headerText.toLowerCase().includes('security') ||
                              headerText.toLowerCase().includes('checklist')
          
          const headerClasses = {
            1: 'text-xl font-bold mb-3',
            2: 'text-lg font-bold mb-2',
            3: 'text-base font-bold mb-2',
            4: 'text-sm font-bold mb-1',
            5: 'text-sm font-bold mb-1',
            6: 'text-xs font-bold mb-1'
          }
          
          if (isRiskHeader) {
            formattedLines.push(
              <div key={`${pIndex}-${index}`} className="group flex items-center gap-2 mt-4 mb-3 p-3 rounded-lg bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-l-4 border-red-500">
                <div className="flex items-center justify-center h-full">
                  <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <MarkdownRenderer 
                  content={headerText}
                  className={`text-red-900 dark:text-red-100 ${headerClasses[level]}`}
                />
              </div>
            )
          } else {
            formattedLines.push(
              <div key={`${pIndex}-${index}`} className="group flex items-center gap-2 mt-3 mb-2 p-2 rounded-lg">
                <div className="flex items-center justify-center h-full">
                  <Circle className="w-2 h-2 text-purple-600 dark:text-white dark:fill-white mt-[2px]" />
                </div>
                <MarkdownRenderer 
                  content={headerText}
                  className={`text-slate-900 dark:text-white ${headerClasses[level]}`}
                />
              </div>
            )
          }
          return
        }

        // Check for important headers (lines ending with :)
        if (trimmedLine.endsWith(':') && trimmedLine.length < 100 && !trimmedLine.includes('**')) {
          const isMainHeader = trimmedLine.length < 50
          const isRiskRelated = trimmedLine.toLowerCase().includes('risk') || 
                               trimmedLine.toLowerCase().includes('issue') ||
                               trimmedLine.toLowerCase().includes('denied')
          
          if (isRiskRelated) {
            formattedLines.push(
              <div key={`${pIndex}-${index}`} className={`group flex gap-2 items-center ${isMainHeader ? 'mt-3 mb-2' : 'mt-2 mb-1'} p-2.5 rounded-lg bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-950/30 dark:to-orange-950/30 border-l-3 border-red-500`}>
                <div className="flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <MarkdownRenderer 
                  content={trimmedLine}
                  className={`font-bold text-red-900 dark:text-red-100 ${isMainHeader ? 'text-base' : 'text-sm'}`}
                />
              </div>
            )
          } else {
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
          }
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