import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { ScrollArea } from './ui/scroll-area'
import { Badge } from './ui/badge'
import { MessageCircle, Send, Bot, User, AlertCircle, Trash2, Brain } from 'lucide-react'

function ChatPanel({ documentId, filename }) {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const BASE_URL = import.meta.env.VITE_API_BASE_URL
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
      const response = await axios.post(`${BASE_URL}/chat`, {
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

  const clearChat = () => {
    setMessages([])
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Chat Assistant</h2>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={clearChat}
            disabled={messages.length === 0}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Document Banner - Shows current document being discussed */}
      {filename && (
        <div className="px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-blue-200/50 dark:border-blue-800/30">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-blue-200/50 dark:border-blue-700/30">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Currently discussing:
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {filename}
              </p>
            </div>
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 text-xs px-3 py-1">
              Active
            </Badge>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-6 py-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-blue-50 dark:bg-blue-900/20 p-4">
                  <Bot className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900 dark:text-white">Hi! I'm ready to help with your document.</p>
                <p className="text-gray-600 dark:text-gray-300">Try asking me:</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                <Badge variant="outline" className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                  "What are the main points?"
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                  "Can you explain section X?"
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                  "What should I be concerned about?"
                </Badge>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div key={index} className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.type !== 'user' && (
                    <div className="flex-shrink-0">
                      {message.type === 'ai' ? (
                        <div className="rounded-full bg-blue-50 dark:bg-blue-900/20 p-2">
                          <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      ) : (
                        <div className="rounded-full bg-red-50 dark:bg-red-900/20 p-2">
                          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                      )}
                    </div>
                  )}
                  <div className={`max-w-[75%] ${message.type === 'user' ? 'order-first' : ''}`}>
                    <div className={`rounded-lg p-4 ${
                      message.type === 'user' 
                        ? 'bg-blue-600 dark:bg-blue-600 text-white ml-auto' 
                        : message.type === 'error'
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}>
                      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-2">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  {message.type === 'user' && (
                    <div className="flex-shrink-0">
                      <div className="rounded-full bg-blue-600 dark:bg-blue-600 p-2">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <div className="flex-shrink-0">
                    <div className="rounded-full bg-blue-50 dark:bg-blue-900/20 p-2">
                      <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="max-w-[75%]">
                    <div className="rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Input */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage(e)
              }
            }}
            placeholder="Ask a question about your document..."
            className="flex-1 min-h-[60px] max-h-[120px] resize-none bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            disabled={!inputMessage.trim() || isLoading}
            className="h-[60px] px-6 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

export default ChatPanel 