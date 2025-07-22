import React, { useState, useEffect, useRef } from 'react'
import MessageFormatter from './MessageFormatter'

function TypewriterText({ 
  content, 
  speed = 5, 
  className = "", 
  onComplete = null,
  onProgress = null,
  startDelay = 0,
  useFormatter = false
}) {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const timeoutRef = useRef(null)
  const isTypingRef = useRef(false)

  useEffect(() => {
    // Cleanup previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (!content) {
      setDisplayedText('')
      setIsComplete(true)
      onComplete?.()
      return
    }

    setDisplayedText('')
    setIsComplete(false)
    isTypingRef.current = true
    
    const startTyping = () => {
      let currentIndex = 0
      let lastProgressCall = 0
      
      const typeChar = () => {
        // Check if component was unmounted or content changed
        if (!isTypingRef.current) return
        
        if (currentIndex < content.length) {
          const newText = content.slice(0, currentIndex + 1)
          setDisplayedText(newText)
          
          // Call onProgress every 30 characters to trigger height-based scrolling
          const now = Date.now()
          if (onProgress && (currentIndex % 30 === 0 || now - lastProgressCall > 300)) {
            onProgress(currentIndex / content.length)
            lastProgressCall = now
          }
          
          currentIndex++
          timeoutRef.current = setTimeout(typeChar, speed)
        } else {
          // Ensure completion
          setDisplayedText(content) // Set final complete text
          setIsComplete(true)
          isTypingRef.current = false
          
          if (onProgress) {
            onProgress(1) // Final progress call
          }
          if (onComplete) {
            onComplete()
          }
        }
      }
      
      typeChar()
    }

    if (startDelay > 0) {
      timeoutRef.current = setTimeout(startTyping, startDelay)
    } else {
      startTyping()
    }

    // Cleanup function
    return () => {
      isTypingRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [content, speed, startDelay, onComplete, onProgress])

  if (useFormatter) {
    return (
      <MessageFormatter 
        content={displayedText} 
        className={className}
      />
    )
  }

  return (
    <span className={className}>
      {displayedText}
      {!isComplete && (
        <span className="animate-pulse ml-0.5 text-blue-500">|</span>
      )}
    </span>
  )
}

export default TypewriterText