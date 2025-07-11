import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'

import { Badge } from './ui/badge'
import { Card, CardHeader, CardContent } from './ui/card'
import { Separator } from './ui/separator'
import { MessageCircle, Send, Bot, User, AlertCircle, Trash2, Sparkles, Brain, Zap, ThumbsUp, ThumbsDown, Copy, Check } from 'lucide-react'
import MessageFormatter from './MessageFormatter';

function ModernChatPanel({ documentId, filename, onSetInputMessage, isDemoMode = false, bypassAPI = false }) {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState(null)
  const [messageFeedback, setMessageFeedback] = useState({}) // Store feedback for each message
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Mock responses for demo mode and API bypass mode
  const mockResponses = [
    "Based on my analysis of your business plan, this document outlines a comprehensive strategy for market expansion with a focus on AI-powered solutions. The plan demonstrates strong financial planning with projected 40% revenue growth through strategic market penetration in Southeast Asia.\n\nKey highlights include:\n• **Market Opportunity**: Untapped potential in emerging markets with 200% YoY growth\n• **Technology Advantage**: Proprietary AI capabilities providing competitive differentiation\n• **Financial Strength**: 18-month runway with strong customer retention (95%)\n• **Sustainability Focus**: 60% carbon footprint reduction plan\n\nWould you like me to dive deeper into any specific section?",
    
    "The executive summary section presents a well-structured overview of your strategic initiatives. The main strengths I identify are:\n\n**Strategic Positioning**:\n- Clear market penetration strategy with measurable goals\n- Strong technological foundation in AI and analytics\n- Sustainable business practices aligned with ESG criteria\n\n**Growth Drivers**:\n- 25% reduction in customer acquisition costs\n- 30% operational efficiency gains through automation\n- Strategic partnerships with Fortune 500 companies\n\n**Risk Considerations**:\n- Supply chain vulnerabilities in Q2\n- Regulatory uncertainties in target markets\n- Talent acquisition challenges in AI/ML roles\n\nIs there a particular aspect you'd like me to analyze in more detail?",
    
    "Looking at the financial projections and market analysis, your business plan shows solid fundamentals with realistic growth assumptions. The 40% revenue growth target is ambitious but achievable given the market conditions and your competitive advantages.\n\n**Key Financial Insights**:\n- Conservative cash flow projections with 18-month buffer\n- Revenue diversification across multiple market segments\n- Cost optimization through AI-driven automation\n\n**Market Dynamics**:\n- Southeast Asia represents the highest growth opportunity\n- Enterprise AI adoption accelerating post-pandemic\n- Regulatory environment becoming more favorable for AI applications\n\nThe risk mitigation strategies appear comprehensive. Would you like me to elaborate on any specific financial or market aspects?",
    
    "Your document demonstrates strong strategic thinking with a focus on sustainable growth. The AI-powered analytics platform positions you well in the current market environment where data-driven decision making is becoming essential for competitive advantage.\n\n**Innovation Strategy**:\n- Q3 2024 product launch timeline is realistic\n- AI capabilities aligned with market demand\n- Scalable technology architecture\n\n**Operational Excellence**:\n- Three new regional offices supporting growth\n- 150+ strategic hires in key markets\n- Process automation reducing operational overhead\n\nThe sustainability initiatives not only address ESG requirements but also create cost savings opportunities. What specific implementation challenges are you most concerned about?",
    
    "This business plan effectively balances growth ambitions with risk management. The comprehensive analysis shows strong market research and realistic implementation timelines.\n\n**Competitive Analysis**:\n- Clear differentiation from existing players\n- Proprietary technology creating barriers to entry\n- Strong customer relationships with high retention\n\n**Execution Strategy**:\n- Phased market entry reducing risk\n- Strategic partnerships accelerating growth\n- Technology-driven operational efficiency\n\nThe plan addresses most critical success factors while acknowledging potential challenges. I notice particular strength in the customer acquisition strategy and technology roadmap. What aspects would you like to explore further?"
  ]

  let mockResponseIndex = 0

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
      let aiResponse

      if (isDemoMode || bypassAPI) {
        // Demo mode or API bypass: use mock response with realistic delay
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000)) // 1.5-2.5s delay
        
        aiResponse = {
          ai_response: mockResponses[mockResponseIndex % mockResponses.length],
          timestamp: new Date().toISOString()
        }
        mockResponseIndex++
      } else {
        // Production mode: make actual API call
        const response = await axios.post('http://localhost:8000/chat', {
          document_id: documentId,
          message: userMessage
        })
        aiResponse = response.data
      }

      // Add AI response to chat
      const aiMessage = {
        id: Date.now() + '-ai',
        type: 'ai',
        content: aiResponse.ai_response,
        timestamp: aiResponse.timestamp
      }
      setMessages(prev => [...prev, aiMessage])

    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = {
        id: Date.now() + '-error',
        type: 'error',
        content: (isDemoMode || bypassAPI)
          ? 'Demo error simulation - this would normally retry the request.' 
          : 'Sorry, I encountered an error. Please try again.',
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

  const suggestedQuestions = (isDemoMode || bypassAPI) ? [
    "What are the main points of this business plan?",
    "Analyze the financial projections",
    "What are the key risks and opportunities?", 
    "Explain the market penetration strategy"
  ] : [
    "What are the main points?",
    "Summarize the key findings",
    "What should I be concerned about?",
    "Explain the most important sections"
  ]

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-800">
            {/* Modern Header - Responsive - Fixed at top */}
      <div className="flex-shrink-0 px-2 sm:px-3 lg:px-4 py-2 sm:py-3 border-b border-slate-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="relative">
              <div className="p-1.5 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 rounded-xl">
                <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                 Assistant 
                {isDemoMode && <span className="text-xs text-orange-500 font-normal">(Demo)</span>}
                {bypassAPI && !isDemoMode && <span className="text-xs text-green-600 font-normal">(Preview)</span>}
              </h2>
              <div className="flex items-center gap-1">
                <Badge className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 px-1 py-0.5">
                  <Brain className="h-2 w-2 mr-0.5" />
                  <span className="hidden sm:inline text-xs">
                    {isDemoMode ? 'Demo Mode' : bypassAPI ? 'Preview Mode' : 'Claude 4 Sonnet'}
                  </span>
                  <span className="sm:hidden text-xs">
                    {isDemoMode ? 'Demo' : bypassAPI ? 'Preview' : 'Claude'}
                  </span>
                </Badge>
                <span className="text-xs text-slate-500 dark:text-gray-400 hidden sm:inline">•</span>
                <p className="text-xs text-slate-500 dark:text-gray-400 truncate max-w-[100px] sm:max-w-[160px]">
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
            className="text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-700 p-1.5"
          >
            <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-hidden relative">
        <div className="h-full overflow-y-auto px-2 sm:px-3 lg:px-4 py-2 sm:py-3">
          {messages.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl">
                    <Bot className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <Sparkles className="h-4 w-4 text-purple-500 absolute -top-1 -right-1" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isDemoMode ? 'Explore the demo interface!' : bypassAPI ? 'Ready to chat about your document!' : 'Ready to explore your document!'}
                </h3>
                <p className="text-slate-600 dark:text-gray-300 max-w-md mx-auto text-sm">
                  {isDemoMode 
                    ? "This is a demo of the chat interface. Try asking questions about the sample business plan document to see how the AI responds."
                    : bypassAPI 
                    ? "I've loaded your document and I'm ready to answer questions. This preview mode uses mock responses to save your API quota."
                    : "I've analyzed your document and I'm ready to answer questions, explain concepts, or dive deeper into specific sections."
                  }
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700 dark:text-gray-300">Try asking:</p>
                <div className="flex flex-wrap gap-1.5 justify-center max-w-lg mx-auto">
                  {suggestedQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setInputMessage(question || '')}
                      className="text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-200 px-2 py-1 h-auto"
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={message.id || index} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.type !== 'user' && (
                    <div className="flex-shrink-0 mt-1">
                      {message.type === 'ai' ? (
                        <div className="p-1.5 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 rounded-xl">
                          <Bot className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                      ) : (
                        <div className="p-1.5 bg-red-100 dark:bg-red-900/40 rounded-xl">
                          <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
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
                      <CardContent className="p-3">
                        {message.type === 'ai' ? (
                          <MessageFormatter 
                            content={message.content}
                            className="text-slate-700 dark:text-gray-200 text-sm"
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
                          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100 dark:border-gray-700">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFeedback(message.id, 'good')}
                                className={`h-6 w-6 p-0 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors ${
                                  messageFeedback[message.id] === 'good' 
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                                    : 'text-slate-400 hover:text-green-600'
                                }`}
                                title="Good response"
                              >
                                <ThumbsUp className="h-3 w-3" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFeedback(message.id, 'bad')}
                                className={`h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors ${
                                  messageFeedback[message.id] === 'bad' 
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                                    : 'text-slate-400 hover:text-red-600'
                                }`}
                                title="Bad response"
                              >
                                <ThumbsDown className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <Separator orientation="vertical" className="h-3" />
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyMessage(message.id, message.content)}
                              className={`h-6 px-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors ${
                                copiedMessageId === message.id 
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                                  : 'text-slate-400 hover:text-blue-600'
                              }`}
                              title="Copy response"
                            >
                              {copiedMessageId === message.id ? (
                                <>
                                  <Check className="h-3 w-3 mr-1" />
                                  <span className="text-xs">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 mr-1" />
                                  <span className="text-xs">Copy</span>
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    <p className={`text-xs mt-1 px-2 ${
                      message.type === 'user' ? 'text-right' : 'text-left'
                    } text-slate-400 dark:text-gray-500`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  
                  {message.type === 'user' && (
                    <div className="flex-shrink-0 mt-1">
                      <div className="p-1.5 bg-blue-600 rounded-xl">
                        <User className="h-3.5 w-3.5 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="p-1.5 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 rounded-xl">
                      <Bot className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="max-w-[75%]">
                    <Card className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 shadow-sm">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"></div>
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
        </div>
      </div>

      {/* Modern Input - Fixed at bottom */}
      <div className="flex-shrink-0 p-2 sm:p-3 lg:p-4 border-t border-slate-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <form onSubmit={handleSendMessage} className="space-y-2 sm:space-y-3">
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
              placeholder="Enter question here to inquire on the document."
              className="min-h-[44px] sm:min-h-[48px] max-h-[80px] sm:max-h-[100px] resize-none bg-white dark:bg-gray-700 border-slate-200 dark:border-gray-600 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-gray-400 rounded-xl pr-10 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-sm"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              disabled={!inputMessage || !inputMessage.trim() || isLoading}
              className="absolute right-1.5 bottom-1.5 h-6 w-6 sm:h-7 sm:w-7 p-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
            >
              <Send className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-xs text-slate-500 dark:text-gray-400">
            <span className="hidden sm:inline">Press Enter to send, Shift+Enter for new line</span>
            <span className="sm:hidden">Tap Enter to send</span>
            <div className="flex items-center gap-1 justify-center sm:justify-end">
              <Sparkles className="h-2.5 w-2.5" />
              <span className="hidden sm:inline text-xs">
                {isDemoMode ? (
                  'Demo Mode - No API calls'
                ) : bypassAPI ? (
                  'Preview Mode - No API calls'
                ) : (
                  <>
                    Powered by <span className="font-medium text-blue-400">Claude 4 Sonnet</span>
                  </>
                )}
              </span>
              <span className="sm:hidden text-xs">
                {isDemoMode ? 'Demo Mode' : bypassAPI ? 'Preview' : 'Claude 4 Sonnet'}
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModernChatPanel 