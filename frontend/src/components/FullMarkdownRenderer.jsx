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

  return (
    <div 
      className={`prose prose-slate dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  )
}

export default FullMarkdownRenderer