import React from 'react'

function MarkdownRenderer({ content, className = '' }) {
  if (!content) {
    return null
  }

  // Simple markdown parser that handles the most common cases
  const parseMarkdown = (text) => {
    if (!text) return text

    // Replace markdown with HTML-like elements
    let parsed = text
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
  `

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