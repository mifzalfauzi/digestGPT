import React, { useMemo } from 'react'
import { marked } from 'marked'

function FullMarkdownRenderer({ content, className = '' }) {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL
  const htmlContent = useMemo(() => {
    if (!content) return ''

    // Configure marked for safe parsing
    const renderer = new marked.Renderer()
    
    // Custom renderer for better styling
    renderer.heading = function(text, level) {
      const sizes = {
        1: 'text-xl font-bold text-slate-900 dark:text-white mb-3 mt-4',
        2: 'text-lg font-semibold text-slate-900 dark:text-white mb-2 mt-3',
        3: 'text-base font-medium text-slate-900 dark:text-white mb-2 mt-2'
      }
      const className = sizes[level] || sizes[3]
      return `<h${level} class="${className}">${text}</h${level}>`
    }

    renderer.strong = function(text) {
      return `<strong class="font-semibold text-slate-900 dark:text-white">${text}</strong>`
    }

    renderer.em = function(text) {
      return `<em class="italic text-slate-800 dark:text-slate-200">${text}</em>`
    }

    renderer.code = function(code) {
      return `<code class="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded text-sm font-mono">${code}</code>`
    }

    renderer.codespan = function(code) {
      return `<code class="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded text-sm font-mono">${code}</code>`
    }

    renderer.list = function(body, ordered, start) {
      const tag = ordered ? 'ol' : 'ul'
      const className = ordered ? 'list-decimal list-inside space-y-1 my-2 text-slate-700 dark:text-slate-200' : 'list-disc list-inside space-y-1 my-2 text-slate-700 dark:text-slate-200'
      return `<${tag} class="${className}">${body}</${tag}>`
    }

    renderer.listitem = function(text) {
      return `<li class="text-slate-700 dark:text-slate-200">${text}</li>`
    }

    renderer.paragraph = function(text) {
      return `<p class="text-slate-700 dark:text-slate-200 leading-relaxed mb-2">${text}</p>`
    }

    // Table rendering
    renderer.table = function(header, body) {
      const tableId = 'table-' + Math.random().toString(36).substr(2, 9)
      return `<div class="relative group overflow-x-auto my-4">
        <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button 
            onclick="copyTableContent('${tableId}')" 
            class="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded shadow-md transition-colors flex items-center gap-1"
            title="Copy table"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
            Copy
          </button>
        </div>
        <table id="${tableId}" class="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <thead class="bg-gray-50 dark:bg-gray-900">${header}</thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">${body}</tbody>
        </table>
      </div>`
    }

    renderer.tablehead = function(content) {
      return `<tr>${content}</tr>`
    }

    renderer.tablerow = function(content) {
      return `<tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">${content}</tr>`
    }

    renderer.tablecell = function(content, flags) {
      const tag = flags.header ? 'th' : 'td'
      const className = flags.header 
        ? 'px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 last:border-r-0'
        : 'px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap border-r border-gray-200 dark:border-gray-600 last:border-r-0'
      const align = flags.align ? ` style="text-align: ${flags.align}"` : ''
      
      // Process markdown formatting in cell content
      const processedContent = content
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
        .replace(/__(.*?)__/g, '<strong class="font-semibold">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
        .replace(/_(.*?)_/g, '<em class="italic">$1</em>')
        .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded text-xs font-mono">$1</code>')
      
      return `<${tag} class="${className}"${align}>${processedContent}</${tag}>`
    }

    // Configure marked options
    marked.setOptions({
      renderer: renderer,
      gfm: true,
      breaks: true,
      sanitize: false, // We trust our content
      smartLists: true,
      smartypants: false
    })

    try {
      return marked(content)
    } catch (error) {
      console.error('Markdown parsing error:', error)
      // Fallback to plain text if parsing fails
      return `<p class="text-slate-700 dark:text-slate-200 leading-relaxed">${content}</p>`
    }
  }, [content])

  if (!content) {
    return null
  }

  // Add copy functionality script
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.copyTableContent = (tableId) => {
        const table = document.getElementById(tableId)
        if (!table) return
        
        // Extract table data
        const rows = table.querySelectorAll('tr')
        const tableData = []
        let csvContent = ''
        
        rows.forEach((row, rowIndex) => {
          const cells = row.querySelectorAll('th, td')
          const rowData = []
          
          cells.forEach(cell => {
            let cellText = cell.textContent.trim()
            // Escape quotes and wrap in quotes if contains comma for CSV
            if (cellText.includes(',') || cellText.includes('"') || cellText.includes('\n')) {
              cellText = '"' + cellText.replace(/"/g, '""') + '"'
            }
            rowData.push(cellText)
          })
          
          tableData.push(rowData)
          csvContent += rowData.join(',') + '\n'
        })
        
        // Create HTML table for rich paste
        let htmlContent = '<table border="1" style="border-collapse: collapse; width: 100%;">'
        
        tableData.forEach((rowData, rowIndex) => {
          const isHeader = rowIndex === 0 && table.querySelector('thead')
          const tag = isHeader ? 'th' : 'td'
          const style = isHeader 
            ? 'padding: 8px; border: 1px solid #ddd; background-color: #f5f5f5; font-weight: bold; text-align: left;'
            : 'padding: 8px; border: 1px solid #ddd;'
          
          if (isHeader) htmlContent += '<thead>'
          htmlContent += '<tr>'
          rowData.forEach(cellData => {
            // Remove CSV quotes for HTML
            const cleanCell = cellData.replace(/^"(.*)"$/, '$1').replace(/""/g, '"')
            htmlContent += `<${tag} style="${style}">${cleanCell}</${tag}>`
          })
          htmlContent += '</tr>'
          if (isHeader) htmlContent += '</thead><tbody>'
        })
        htmlContent += '</tbody></table>'
        
        // Copy both formats
        const clipboardItem = new ClipboardItem({
          'text/html': new Blob([htmlContent], { type: 'text/html' }),
          'text/plain': new Blob([csvContent], { type: 'text/plain' })
        })
        
        navigator.clipboard.write([clipboardItem]).then(() => {
          // Visual feedback
          const button = document.querySelector(`[onclick="copyTableContent('${tableId}')"]`)
          if (button) {
            const originalText = button.innerHTML
            button.innerHTML = `
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              Copied!
            `
            button.classList.add('bg-green-600')
            button.classList.remove('bg-blue-600', 'hover:bg-blue-700')
            
            setTimeout(() => {
              button.innerHTML = originalText
              button.classList.remove('bg-green-600')
              button.classList.add('bg-blue-600', 'hover:bg-blue-700')
            }, 2000)
          }
        }).catch(err => {
          console.error('Failed to copy table with formatting, falling back to text:', err)
          // Fallback to plain text
          navigator.clipboard.writeText(csvContent).then(() => {
            const button = document.querySelector(`[onclick="copyTableContent('${tableId}')"]`)
            if (button) {
              const originalText = button.innerHTML
              button.innerHTML = `
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Copied!
              `
              button.classList.add('bg-green-600')
              button.classList.remove('bg-blue-600', 'hover:bg-blue-700')
              
              setTimeout(() => {
                button.innerHTML = originalText
                button.classList.remove('bg-green-600')
                button.classList.add('bg-blue-600', 'hover:bg-blue-700')
              }, 2000)
            }
          }).catch(fallbackErr => {
            console.error('Failed to copy table:', fallbackErr)
          })
        })
      }
    }
  }, [])

  return (
    <div 
      className={`prose prose-slate dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  )
}

export default FullMarkdownRenderer