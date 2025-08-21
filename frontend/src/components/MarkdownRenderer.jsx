import React from 'react'

function MarkdownRenderer({ content, className = '' }) {
  if (!content) {
    return null
  }

  // Simple markdown parser that handles the most common cases
  const parseMarkdown = (text) => {
    if (!text) return text

    // First handle tables before other replacements
    let parsed = text

    // Helper function to parse basic markdown in cell content
    const parseBasicMarkdown = (text) => {
      return text
        // Bold text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>')
        // Italic text
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded text-xs font-mono">$1</code>')
    }

    // Table parsing - handles GitHub Flavored Markdown tables
    const tableRegex = /^\|(.+)\|\s*\n\|[-\s\|:]+\|\s*\n((?:\|.*\|\s*\n?)+)/gm
    parsed = parsed.replace(tableRegex, (match, header, body) => {
      const headerCells = header.split('|').map(cell => cell.trim()).filter(cell => cell)
      const bodyRows = body.trim().split('\n').map(row => 
        row.split('|').map(cell => cell.trim()).filter(cell => cell)
      )
      const tableId = 'table-' + Math.random().toString(36).substr(2, 9)
      
      let tableHtml = `<div class="table-container relative group">
        <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button 
            onclick="copyTableContent('${tableId}')" 
            class="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded shadow-md transition-colors copy-table-btn"
            title="Copy table as CSV"
          >
            <svg class="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
            Copy
          </button>
        </div>
        <table id="${tableId}">`
      
      // Header
      tableHtml += '<thead><tr>'
      headerCells.forEach((cell, index) => {
        const isLast = index === headerCells.length - 1
        const processedCell = parseBasicMarkdown(cell)
        tableHtml += `<th class="${isLast ? '' : 'border-r-cell'}">${processedCell}</th>`
      })
      tableHtml += '</tr></thead>'
      
      // Body
      tableHtml += '<tbody>'
      bodyRows.forEach(row => {
        tableHtml += '<tr>'
        row.forEach((cell, index) => {
          const isLast = index === row.length - 1
          const processedCell = parseBasicMarkdown(cell)
          tableHtml += `<td class="${isLast ? '' : 'border-r-cell'}">${processedCell}</td>`
        })
        tableHtml += '</tr>'
      })
      tableHtml += '</tbody></table></div>'
      
      return tableHtml
    })

    // Replace other markdown with HTML-like elements
    parsed = parsed
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\_(.*?)\_/g, '<em>$1</em>')
      // Lists
      .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      // Line breaks
      .replace(/\n/g, '<br />')

    // Wrap lists
    parsed = parsed.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    
    // Wrap paragraphs
    parsed = parsed.replace(/(<br \/>)/g, '</p><p>')
    parsed = '<p>' + parsed + '</p>'
    
    // Clean up empty paragraphs
    parsed = parsed.replace(/<p><\/p>/g, '')
    parsed = parsed.replace(/<p><br \/><\/p>/g, '')

    return parsed
  }

  const htmlContent = parseMarkdown(content)

  // CSS styles for the markdown elements
  const styles = `
    .markdown-content h1 {
      font-size: 1.5rem;
      font-weight: bold;
      color: rgb(15 23 42);
      margin-bottom: 0.75rem;
      margin-top: 1rem;
    }
    .markdown-content h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: rgb(30 41 59);
      margin-bottom: 0.5rem;
      margin-top: 0.75rem;
    }
    .markdown-content h3 {
      font-size: 1.125rem;
      font-weight: 500;
      color: rgb(51 65 85);
      margin-bottom: 0.5rem;
      margin-top: 0.5rem;
    }
    .markdown-content p {
      color: rgb(51 65 85);
      line-height: 1.625;
      margin-bottom: 0.5rem;
    }
    .markdown-content ul {
      list-style-type: disc;
      list-style-position: inside;
      color: rgb(51 65 85);
      margin-bottom: 0.5rem;
      margin-left: 1rem;
    }
    .markdown-content li {
      color: rgb(51 65 85);
      margin-bottom: 0.25rem;
    }
    .markdown-content strong {
      font-weight: 600;
      color: rgb(15 23 42);
    }
    .markdown-content em {
      font-style: italic;
      color: rgb(30 41 59);
    }
    
    /* Dark mode styles */
    .dark .markdown-content h1 {
      color: rgb(248 250 252);
    }
    .dark .markdown-content h2 {
      color: rgb(241 245 249);
    }
    .dark .markdown-content h3 {
      color: rgb(226 232 240);
    }
    .dark .markdown-content p {
      color: rgb(203 213 225);
    }
    .dark .markdown-content ul {
      color: rgb(203 213 225);
    }
    .dark .markdown-content li {
      color: rgb(203 213 225);
    }
    .dark .markdown-content strong {
      color: rgb(248 250 252);
    }
    .dark .markdown-content em {
      color: rgb(241 245 249);
    }
    
    /* Table styles */
    .markdown-content .table-container {
      overflow-x: auto;
      margin: 1rem 0;
    }
    .markdown-content table {
      min-width: 100%;
      background: white;
      border: 1px solid rgb(229 231 235);
      border-radius: 0.5rem;
      box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    }
    .markdown-content thead {
      background: rgb(249 250 251);
    }
    .markdown-content th {
      padding: 0.75rem 1rem;
      text-align: left;
      font-size: 0.75rem;
      font-weight: 500;
      color: rgb(107 114 128);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid rgb(229 231 235);
    }
    .markdown-content td {
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      color: rgb(17 24 39);
      white-space: nowrap;
      border-bottom: 1px solid rgb(229 231 235);
    }
    .markdown-content .border-r-cell {
      border-right: 1px solid rgb(229 231 235);
    }
    .markdown-content tbody tr:hover {
      background: rgb(249 250 251);
    }
    .markdown-content tbody tr:last-child td {
      border-bottom: none;
    }
    
    /* Dark mode table styles */
    .dark .markdown-content table {
      background: rgb(31 41 55);
      border-color: rgb(75 85 99);
    }
    .dark .markdown-content thead {
      background: rgb(17 24 39);
    }
    .dark .markdown-content th {
      color: rgb(156 163 175);
      border-color: rgb(75 85 99);
    }
    .dark .markdown-content td {
      color: rgb(243 244 246);
      border-color: rgb(75 85 99);
    }
    .dark .markdown-content tbody tr:hover {
      background: rgb(55 65 81);
    }
    .dark .markdown-content .border-r-cell {
      border-right-color: rgb(75 85 99);
    }
  `

  // Add copy functionality
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
          const button = document.querySelector(`[onclick="copyTableContent('${tableId}')"]`)
          if (button) {
            const originalText = button.innerHTML
            button.innerHTML = `
              <svg class="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              Copied!
            `
            button.style.backgroundColor = 'rgb(34 197 94)'
            
            setTimeout(() => {
              button.innerHTML = originalText
              button.style.backgroundColor = 'rgb(37 99 235)'
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
                <svg class="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Copied!
              `
              button.style.backgroundColor = 'rgb(34 197 94)'
              
              setTimeout(() => {
                button.innerHTML = originalText
                button.style.backgroundColor = 'rgb(37 99 235)'
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
    <>
      <style>{styles}</style>
      <div 
        className={`markdown-content ${className}`}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </>
  )
}

export default MarkdownRenderer 