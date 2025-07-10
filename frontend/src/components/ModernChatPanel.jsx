import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { ScrollArea } from './ui/scroll-area'
import { Badge } from './ui/badge'
import { Card, CardHeader, CardContent } from './ui/card'
import { Separator } from './ui/separator'
import { MessageCircle, Send, Bot, User, AlertCircle, Trash2, Sparkles, Brain, Zap, ThumbsUp, ThumbsDown, Copy, Check } from 'lucide-react'
import MessageFormatter from './MessageFormatter';

function ModernChatPanel({ documentId, filename, onSetInputMessage }) {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState(null)
  const [messageFeedback, setMessageFeedback] = useState({}) // Store feedback for each message
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Ensure inputMessage is always a string
  useEffect(() => {
    if (inputMessage === null || inputMessage === undefined) {
      setInputMessage('')
    }
  }, [inputMessage])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Create wrapper function that sets input and focuses textarea
  const setInputMessageAndFocus = (message) => {
    const safeMessage = message || ''
    setInputMessage(safeMessage)
    // Focus the textarea after a small delay to ensure the message is set
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(safeMessage.length, safeMessage.length)
      }
    }, 100)
  }

  // Expose setInputMessage function to parent
  useEffect(() => {
    if (onSetInputMessage) {
      onSetInputMessage(setInputMessageAndFocus)
    }
  }, [onSetInputMessage])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!inputMessage || !inputMessage.trim() || isLoading) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setIsLoading(true)

    // Add user message to chat
    const newUserMessage = {
      id: Date.now() + '-user',
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
        id: Date.now() + '-ai',
        type: 'ai',
        content: response.data.ai_response,
        timestamp: response.data.timestamp
      }
      setMessages(prev => [...prev, aiMessage])

    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = {
        id: Date.now() + '-error',
        type: 'error',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyMessage = async (messageId, content) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000) // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = content
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
        setCopiedMessageId(messageId)
        setTimeout(() => setCopiedMessageId(null), 2000)
      } catch (fallbackErr) {
        console.error('Fallback copy failed: ', fallbackErr)
      }
      document.body.removeChild(textArea)
    }
  }

  const handleFeedback = (messageId, feedbackType) => {
    setMessageFeedback(prev => ({
      ...prev,
      [messageId]: feedbackType
    }))
    
    // Here you could send feedback to your backend
    console.log(`Feedback for message ${messageId}: ${feedbackType}`)
    
    // Optional: Send to backend
    // axios.post('/api/feedback', { messageId, feedbackType, documentId })
  }

  const clearChat = () => {
    setMessages([])
    setMessageFeedback({})
  }

  const suggestedQuestions = [
    "What are the main points?",
    "Summarize the key findings",
    "What should I be concerned about?",
    "Explain the most important sections"
  ]

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Modern Header - Responsive */}
      <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="relative">
              <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 rounded-xl">
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">AI Assistant</h2>
              <div className="flex items-center gap-1 sm:gap-2">
                <Badge className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 px-1.5 py-0.5">
                  <Brain className="h-2 w-2 sm:h-2.5 sm:w-2.5 mr-1" />
                  <span className="hidden sm:inline">Claude 4 Sonnet</span>
                  <span className="sm:hidden">Claude</span>
                </Badge>
                <span className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 hidden sm:inline">•</span>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 truncate max-w-[120px] sm:max-w-[200px]">
                  {filename || 'No document'}
                </p>
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={clearChat}
            disabled={messages.length === 0}
            className="text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-700 p-2"
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area - Responsive */}
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea className="h-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl">
                    <Bot className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                  </div>
                  <Sparkles className="h-6 w-6 text-purple-500 absolute -top-1 -right-1" />
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Ready to explore your document!
                </h3>
                <p className="text-slate-600 dark:text-gray-300 max-w-md mx-auto">
                  I've analyzed your document and I'm ready to answer questions, explain concepts, or dive deeper into specific sections.
                </p>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-700 dark:text-gray-300">Try asking:</p>
                <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                  {suggestedQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setInputMessage(question || '')}
                      className="text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-200"
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div key={message.id || index} className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.type !== 'user' && (
                    <div className="flex-shrink-0 mt-1">
                      {message.type === 'ai' ? (
                        <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 rounded-xl">
                          <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                      ) : (
                        <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-xl">
                          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className={`max-w-[75%] ${message.type === 'user' ? 'order-first' : ''}`}>
                    <Card className={`shadow-sm border-0 ${
                      message.type === 'user' 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white ml-auto' 
                        : message.type === 'error'
                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                        : 'bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700'
                    }`}>
                      <CardContent className="p-4">
                        {message.type === 'ai' ? (
                          <MessageFormatter 
                            content={message.content}
                            className="text-slate-700 dark:text-gray-200"
                          />
                        ) : (
                          <p className={`text-sm leading-relaxed ${
                            message.type === 'user' 
                              ? 'text-white' 
                              : message.type === 'error'
                              ? 'text-red-800 dark:text-red-300'
                              : 'text-slate-700 dark:text-gray-200'
                          }`}>
                            {message.content}
                          </p>
                        )}
                        
                        {/* Action buttons for AI responses */}
                        {message.type === 'ai' && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-gray-700">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFeedback(message.id, 'good')}
                                className={`h-7 w-7 p-0 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors ${
                                  messageFeedback[message.id] === 'good' 
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                                    : 'text-slate-400 hover:text-green-600'
                                }`}
                                title="Good response"
                              >
                                <ThumbsUp className="h-3.5 w-3.5" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFeedback(message.id, 'bad')}
                                className={`h-7 w-7 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors ${
                                  messageFeedback[message.id] === 'bad' 
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                                    : 'text-slate-400 hover:text-red-600'
                                }`}
                                title="Bad response"
                              >
                                <ThumbsDown className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            
                            <Separator orientation="vertical" className="h-4" />
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyMessage(message.id, message.content)}
                              className={`h-7 px-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors ${
                                copiedMessageId === message.id 
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                                  : 'text-slate-400 hover:text-blue-600'
                              }`}
                              title="Copy response"
                            >
                              {copiedMessageId === message.id ? (
                                <>
                                  <Check className="h-3.5 w-3.5 mr-1" />
                                  <span className="text-xs">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5 mr-1" />
                                  <span className="text-xs">Copy</span>
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    <p className={`text-xs mt-2 px-3 ${
                      message.type === 'user' ? 'text-right' : 'text-left'
                    } text-slate-400 dark:text-gray-500`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  
                  {message.type === 'user' && (
                    <div className="flex-shrink-0 mt-1">
                      <div className="p-2 bg-blue-600 rounded-xl">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 rounded-xl">
                      <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="max-w-[75%]">
                    <Card className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"></div>
                          </div>
                          <span className="text-sm text-slate-600 dark:text-gray-300">Thinking...</span>
                          <Zap className="h-3 w-3 text-blue-500 animate-pulse" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Modern Input - Responsive */}
      <div className="p-3 sm:p-4 lg:p-6 border-t border-slate-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <form onSubmit={handleSendMessage} className="space-y-3 sm:space-y-4">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={inputMessage || ''}
              onChange={(e) => setInputMessage(e.target.value || '')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage(e)
                }
              }}
              placeholder="Ask me anything about your document..."
              className="min-h-[50px] sm:min-h-[60px] max-h-[100px] sm:max-h-[120px] resize-none bg-white dark:bg-gray-700 border-slate-200 dark:border-gray-600 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-gray-400 rounded-xl pr-10 sm:pr-12 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-sm sm:text-base"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              disabled={!inputMessage || !inputMessage.trim() || isLoading}
              className="absolute right-1.5 sm:right-2 bottom-1.5 sm:bottom-2 h-7 w-7 sm:h-8 sm:w-8 p-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
            >
              <Send className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-xs text-slate-500 dark:text-gray-400">
            <span className="hidden sm:inline">Press Enter to send, Shift+Enter for new line</span>
            <span className="sm:hidden">Tap Enter to send</span>
            <div className="flex items-center gap-1 justify-center sm:justify-end">
              <Sparkles className="h-3 w-3" />
              <span className="hidden sm:inline">Powered by Claude 4 Sonnet</span>
              <span className="sm:hidden">Claude 4 Sonnet</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModernChatPanel 