import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import './ChatInterface.css'

function ChatInterface({ documentId, filename }) {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!inputMessage.trim() || isLoading) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setIsLoading(true)

    // Add user message to chat
    const newUserMessage = {
      type: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, newUserMessage])

    try {
      const response = await axios.post('http://localhost:8000/chat', {
        document_id: documentId,
        message: userMessage
      })

      // Add AI response to chat
      const aiMessage = {
        type: 'ai',
        content: response.data.ai_response,
        timestamp: response.data.timestamp
      }
      setMessages(prev => [...prev, aiMessage])

    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = {
        type: 'error',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  const clearChat = () => {
    setMessages([])
  }

  return (
    <div className={`chat-interface ${isExpanded ? 'expanded' : ''}`}>
      <div className="chat-header">
        <div className="chat-title">
          <h3>💬 Chat about: {filename}</h3>
          <p>Ask questions about your document</p>
        </div>
        <div className="chat-controls">
          <button 
            className="chat-clear-btn" 
            onClick={clearChat}
            disabled={messages.length === 0}
          >
            🗑️ Clear
          </button>
          <button className="chat-expand-btn" onClick={toggleExpand}>
            {isExpanded ? '🔽' : '🔼'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="chat-content">
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-welcome">
                <p>👋 Hi! I'm ready to answer questions about your document.</p>
                <p>Try asking:</p>
                <ul>
                  <li>"What are the main points?"</li>
                  <li>"Can you explain section X?"</li>
                  <li>"What should I be concerned about?"</li>
                </ul>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className={`message ${message.type}`}>
                  <div className="message-content">
                    {message.type === 'user' && <strong>You:</strong>}
                    {message.type === 'ai' && <strong>🤖 Claude:</strong>}
                    {message.type === 'error' && <strong>⚠️ Error:</strong>}
                    <span>{message.content}</span>
                  </div>
                  <div className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="message ai loading">
                <div className="message-content">
                  <strong>🤖 Claude:</strong>
                  <span>
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    Thinking...
                  </span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="chat-input-form">
            <div className="chat-input-container">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about your document..."
                className="chat-input"
                rows={1}
                disabled={isLoading}
              />
              <button 
                type="submit" 
                className="chat-send-btn"
                disabled={!inputMessage.trim() || isLoading}
              >
                <span>📤</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default ChatInterface 