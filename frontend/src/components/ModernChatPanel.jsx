import React, { useState, useRef, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Card, CardHeader, CardContent } from './ui/card'
import { Separator } from './ui/separator'
import { MessageCircle, Send, Bot, User, AlertCircle, Trash2, Sparkles, Brain, Zap, ThumbsUp, ThumbsDown, Copy, Check, Clock, ChevronDown } from 'lucide-react'
import MessageFormatter from './MessageFormatter'
import TypewriterText from './TypewriterText'

function ModernChatPanel({ documentId, filename, onSetInputMessage, isDemoMode = false, bypassAPI = false, casualMode = false, isDisabled = false, analyzingStatus = null }) {
  // Auth context
  const {
    canSendChat,
    canUseTokens,
    refreshUserData,
    logout,
    isAuthenticated
  } = useAuth()

  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState(null)
  const [messageFeedback, setMessageFeedback] = useState({}) // Store feedback for each message
  const [showScrollIndicator, setShowScrollIndicator] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [chatError, setChatError] = useState('')
  const [typewriterMessageId, setTypewriterMessageId] = useState(null)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const [isUserNearBottom, setIsUserNearBottom] = useState(true)
  const scrollTimeoutRef = useRef(null)
  const lastScrollHeightRef = useRef(0)
  const scrollThresholdRef = useRef(0)

  // Mock responses for demo mode and API bypass mode
  const mockResponses = [
    "Based on my analysis of your business plan, this document outlines a comprehensive strategy for market expansion with a focus on AI-powered solutions. The plan demonstrates strong financial planning with projected 40% revenue growth through strategic market penetration in Southeast Asia.\n\nKey highlights include:\n• **Market Opportunity**: Untapped potential in emerging markets with 200% YoY growth\n• **Technology Advantage**: Proprietary AI capabilities providing competitive differentiation\n• **Financial Strength**: 18-month runway with strong customer retention (95%)\n• **Sustainability Focus**: 60% carbon footprint reduction plan\n\nWould you like me to dive deeper into any specific section?",

    "The executive summary section presents a well-structured overview of your strategic initiatives. The main strengths I identify are:\n\n**Strategic Positioning**:\n- Clear market penetration strategy with measurable goals\n- Strong technological foundation in AI and analytics\n- Sustainable business practices aligned with ESG criteria\n\n**Growth Drivers**:\n- 25% reduction in customer acquisition costs\n- 30% operational efficiency gains through automation\n- Strategic partnerships with Fortune 500 companies\n\n**Risk Considerations**:\n- Supply chain vulnerabilities in Q2\n- Regulatory uncertainties in target markets\n- Talent acquisition challenges in AI/ML roles\n\nIs there a particular aspect you'd like me to analyze in more detail?",

    "Looking at the financial projections and market analysis, your business plan shows solid fundamentals with realistic growth assumptions. The 40% revenue growth target is ambitious but achievable given the market conditions and your competitive advantages.\n\n**Key Financial Insights**:\n- Conservative cash flow projections with 18-month buffer\n- Revenue diversification across multiple market segments\n- Cost optimization through AI-driven automation\n\n**Market Dynamics**:\n- Southeast Asia represents the highest growth opportunity\n- Enterprise AI adoption accelerating post-pandemic\n- Regulatory environment becoming more favorable for AI applications\n\nThe risk mitigation strategies appear comprehensive. Would you like me to elaborate on any specific financial or market aspects?",

    "Your document demonstrates strong strategic thinking with a focus on sustainable growth. The AI-powered analytics platform positions you well in the current market environment where data-driven decision making is becoming essential for competitive advantage.\n\n**Innovation Strategy**:\n- Q3 2024 product launch timeline is realistic\n- AI capabilities aligned with market demand\n- Scalable technology architecture\n\n**Operational Excellence**:\n- Three new regional offices supporting growth\n- 150+ strategic hires in key markets\n- Process automation reducing operational overhead\n\nThe sustainability initiatives not only address ESG requirements but also create cost savings opportunities. What specific implementation challenges are you most concerned about?",

    "This business plan effectively balances growth ambitions with risk management. The comprehensive analysis shows strong market research and realistic implementation timelines.\n\n**Competitive Analysis**:\n- Clear differentiation from existing players\n- Proprietary technology creating barriers to entry\n- Strong customer relationships with high retention\n\n**Execution Strategy**:\n- Phased market entry reducing risk\n- Strategic partnerships accelerating growth\n- Technology-driven operational efficiency\n\nThe plan addresses most critical success factors while acknowledging potential challenges. I notice particular strength in the customer acquisition strategy and technology roadmap. What aspects would you like to explore further?"
  ]

  // Casual chat mock responses
  const casualMockResponses = [
    "Hello! I'm Claude, an AI assistant created by Anthropic. I'm here to help you with a wide variety of tasks - from answering questions and helping with analysis, to creative writing, coding, math, and general conversation.\n\nWhat would you like to chat about today? I'm happy to help with anything you have in mind!",

    "That's a great question! I'd be happy to help you think through that. As an AI, I can assist with many different types of tasks:\n\n• **Research & Analysis**: Help you understand complex topics, compare options, or break down problems\n• **Writing & Communication**: Draft emails, essays, creative content, or help improve your writing\n• **Problem Solving**: Work through challenges step-by-step, brainstorm solutions\n• **Learning Support**: Explain concepts, provide examples, or help with studying\n• **Creative Projects**: Generate ideas, help with planning, or collaborate on creative work\n\nWhat specific area interests you most right now?",

    "I appreciate you asking! I'm designed to be helpful, harmless, and honest in all my interactions. I can engage in conversations on almost any topic, though I aim to be thoughtful and nuanced in my responses.\n\nSome things I particularly enjoy discussing include:\n• Technology and science developments\n• Philosophy and ethics\n• Creative problem-solving\n• Literature and arts\n• Current events and their implications\n• Personal growth and learning strategies\n\nI'm also happy to help with practical tasks like planning, organization, or working through decisions. What's on your mind today?",

    "That's an interesting perspective! I love exploring ideas and having thoughtful conversations. As an AI, I find human creativity and problem-solving fascinating - there's always something new to learn from different viewpoints and experiences.\n\nI'm curious about what you're working on or thinking about lately. Are there any projects, challenges, or topics you've been pondering? Sometimes it helps to talk through ideas with someone (or in this case, an AI assistant) who can offer a fresh perspective or ask clarifying questions.",

    "Thank you for the engaging conversation! I really enjoy these kinds of open-ended discussions where we can explore ideas together. \n\nIs there anything specific you'd like to dive deeper into? I'm here to help whether you want to:\n• Brainstorm and explore new ideas\n• Work through a problem or decision\n• Learn about something that interests you\n• Have a thoughtful discussion on any topic\n• Get help with a project or task\n\nWhat sounds most appealing to you right now?"
  ]

  let mockResponseIndex = 0

  // Ensure inputMessage is always a string
  useEffect(() => {
    if (inputMessage === null || inputMessage === undefined) {
      setInputMessage('')
    }
  }, [inputMessage])

  const scrollToBottom = (force = false, behavior = "smooth") => {
    if (!messagesContainerRef.current || !messagesEndRef.current) return

    const container = messagesContainerRef.current
    const currentScrollHeight = container.scrollHeight

    // Only scroll if user is near bottom or force is true
    if (!isUserNearBottom && !force) return

    // For typewriter effect: only scroll when height increases by a significant amount
    if (typewriterMessageId && !force) {
      const heightDiff = currentScrollHeight - lastScrollHeightRef.current

      // Only scroll if height increased by at least 30px (approximately 2 lines)
      if (heightDiff < 30) return

      // Clear any pending scroll
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      // Debounced smooth scroll
      scrollTimeoutRef.current = setTimeout(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "auto" // Use auto during typing to prevent animation conflicts
        })
        lastScrollHeightRef.current = container.scrollHeight
      }, 50)
    } else {
      // Immediate scroll for new messages or forced scroll
      container.scrollTo({
        top: container.scrollHeight,
        behavior: behavior
      })
      lastScrollHeightRef.current = container.scrollHeight
    }
  }

  // Check if user can scroll down
  const checkScrollPosition = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      setIsUserNearBottom(isNearBottom)
      setShowScrollIndicator(!isNearBottom && messages.length > 2)
    }
  }

  useEffect(() => {
    // Auto-scroll when new messages are added
    if (messages.length > 0) {
      scrollToBottom(true, "smooth")
      // Update scroll height reference
      if (messagesContainerRef.current) {
        lastScrollHeightRef.current = messagesContainerRef.current.scrollHeight
      }
    }
    // Hide initial load animation after first render
    if (isInitialLoad) {
      setTimeout(() => setIsInitialLoad(false), 1000)
    }
  }, [messages.length])

  // Add scroll listener and intersection observer for bottom sentinel
  useEffect(() => {
    const container = messagesContainerRef.current
    const sentinel = messagesEndRef.current

    if (container) {
      container.addEventListener('scroll', checkScrollPosition)
      checkScrollPosition() // Initial check
      // Initialize scroll height reference
      lastScrollHeightRef.current = container.scrollHeight
    }

    // Intersection Observer for smooth auto-scrolling
    let observer
    if (sentinel) {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0]
          setIsUserNearBottom(entry.isIntersecting)
        },
        {
          root: container,
          threshold: 0.1,
          rootMargin: '0px 0px -50px 0px' // Trigger slightly before reaching bottom
        }
      )
      observer.observe(sentinel)
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScrollPosition)
      }
      if (observer) {
        observer.disconnect()
      }
    }
  }, [messages.length])

  // Load chat history when documentId changes
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!documentId || casualMode || isDemoMode || bypassAPI) return

      try {
        const token = localStorage.getItem('auth_token')
        if (!token) return

        const response = await axios.get(
          `http://localhost:8000/chat/history/${documentId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )

        if (response.data?.chat_history) {
          // Convert backend chat history to component message format
          const historicalMessages = []

          // Sort chat history by timestamp (oldest first)
          const sortedHistory = [...response.data.chat_history].sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
          )

          sortedHistory.forEach((chat, index) => {
            // Add user message
            historicalMessages.push({
              id: `${chat.id}_user`,
              type: 'user',  // Use 'type' instead of 'role' for consistency
              content: chat.question || chat.user_message,
              timestamp: new Date(chat.timestamp),
              isHistorical: true
            })
            // Add AI response
            historicalMessages.push({
              id: `${chat.id}_ai`,
              type: 'ai',    // Use 'type' instead of 'role' for consistency
              content: chat.answer || chat.ai_response,
              timestamp: new Date(chat.timestamp),
              isHistorical: true
            })
          })

          setMessages(historicalMessages)
        }
      } catch (error) {
        console.error('Error loading chat history:', error)
      }
    }

    loadChatHistory()
  }, [documentId, casualMode, isDemoMode, bypassAPI])

  // Stable callback functions for TypewriterText
  const handleTypewriterProgress = useCallback(() => {
    // Height-based scrolling during typewriter progress - throttled
    scrollToBottom(false, "auto")
  }, [])

  const handleTypewriterComplete = useCallback(() => {
    // Clear typewriter effect after completion
    setTimeout(() => setTypewriterMessageId(null), 1000)
    // Final scroll to ensure we're at bottom
    scrollToBottom(true, "smooth")
  }, [])

  // Cleanup scroll timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

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

    // Check authentication (only for production mode)
    if (!casualMode && !isDemoMode && !bypassAPI && !isAuthenticated) {
      setChatError("Please sign in to chat with documents")
      return
    }

    // Check chat limits (only for production mode)
    if (!casualMode && !isDemoMode && !bypassAPI && !canSendChat()) {
      setChatError("You've reached your chat limit. Please upgrade your plan to continue chatting.")
      return
    }

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setIsLoading(true)
    setChatError('')

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

      if (casualMode) {
        // Call the dedicated casual chat endpoint
        const response = await axios.post('http://localhost:8000/chat/casual-chat-gemini', {
          message: userMessage
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
        )
        aiResponse = {
          ai_response: response.data.ai_response,
          timestamp: response.data.timestamp
        }
      } else if (isDemoMode || bypassAPI) {
        // Demo or bypass mode: return mock responses
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000))

        const responses = mockResponses
        aiResponse = {
          ai_response: responses[mockResponseIndex % responses.length],
          timestamp: new Date().toISOString()
        }
        mockResponseIndex++
      } else {
        // Production mode: make actual API call with document ID and auth
        const response = await axios.post('http://localhost:8000/chat', {
          document_id: documentId,
          message: userMessage
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
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

      // Set this message to use typewriter effect
      setTypewriterMessageId(aiMessage.id)

      // Refresh user data to update usage statistics (only for production mode)
      if (!casualMode && !isDemoMode && !bypassAPI) {
        await refreshUserData()
      }

    } catch (error) {
      console.error('Chat error:', error)

      let errorContent

      // Handle authentication errors
      if (error.response?.status === 401) {
        errorContent = "Session expired. Please login again."
        logout()
        return
      } else if (error.response?.status === 403) {
        errorContent = "Access forbidden. Please check your permissions."
      } else if (error.response?.status === 429) {
        errorContent = error.response.data?.detail || "You've reached your usage limit. Please upgrade your plan."
      } else if (casualMode || isDemoMode || bypassAPI) {
        errorContent = casualMode
          ? 'Oops! Something went wrong. This is just a simulation - please try again!'
          : 'Demo error simulation - this would normally retry the request.'
      } else {
        errorContent = 'Sorry, I encountered an error. Please try again.'
      }

      const errorMessage = {
        id: Date.now() + '-error',
        type: 'error',
        content: errorContent,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])

      // Clear typewriter effect for error messages
      setTypewriterMessageId(null)
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
    setTypewriterMessageId(null)
  }

  const suggestedQuestions = casualMode ? [
    "What can you help me with?",
    "Tell me about yourself",
    "How can we work together?",
    "What are you good at?"
  ] : (isDemoMode || bypassAPI) ? [
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
      <div className="flex-shrink-0 px-2 sm:px-3 lg:px-4 py-2 sm:py-3 bg-white/80 dark:bg-[#1f1f1f] backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="relative">
              {/* <div className="p-1 sm:p-1.5 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 rounded-xl">
                <MessageCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 text-blue-600 dark:text-blue-400" />
              </div> */}
              {/* <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 lg:w-2.5 lg:h-2.5 bg-green-500 rounded-full border border-white dark:border-gray-800"></div> */}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm lg:text-base font-bold text-slate-900 dark:text-white">
                  {casualMode || true ? (
                    <>
                      Elva<span className="text-red-500">*</span>
                    </>
                  ) : (
                    <>
                      Elva<span className="text-red-500">*</span>
                    </>
                  )}
                  {isDemoMode && (
                    <span className="text-xs text-orange-500 font-normal">(Demo)</span>
                  )}
                  {bypassAPI && !isDemoMode && (
                    <span className="text-xs text-green-600 font-normal">(Preview)</span>
                  )}
                </h2>

                {/* <Badge className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 px-1 py-0.5">
                  <Brain className="h-1.5 w-1.5 sm:h-2 sm:w-2 mr-0.5" />
                  <span className="hidden sm:inline text-xs">
                    {casualMode ? 'Normal Chat' : isDemoMode ? 'Demo Mode' : bypassAPI ? 'Preview Mode' : 'Claude 4 Sonnet'}
                  </span>
                  <span className="sm:hidden text-xs">
                    {casualMode ? 'Chat' : isDemoMode ? 'Demo' : bypassAPI ? 'Preview' : 'Claude'}
                  </span>
                </Badge> */}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            disabled={messages.length === 0}
            className="text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-700 p-1 sm:p-1.5"
          >
            <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Button>
        </div>
      </div>

      {/* Document Banner - Shows current document being discussed */}
      {!casualMode && filename && (
        <div className="flex-shrink-0 px-2 sm:px-3 lg:px-4 py-2 bg-white dark:bg-background border-b ">
          <div className="flex items-center gap-2 p-2 sm:p-2.5 rounded-lg bg-white/60 dark:bg-background backdrop-blur-sm border ">
            {/* <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
              <Brain className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
            </div> */}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                Currently discussing:
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                {filename}
              </p>
            </div>
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 text-xs px-2 py-0.5">
              Active
            </Badge>
          </div>
        </div>
      )}

      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-hidden relative dark:bg-[#1f1f1f]">
        <div
          ref={messagesContainerRef}
          className="h-full overflow-y-auto px-2 sm:px-3 lg:px-4 py-2 sm:py-3 scroll-smooth"
        >
          {isDisabled ? (
            <div className="text-center py-6 sm:py-8 space-y-3 sm:space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl">
                    <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600 dark:text-amber-400 animate-pulse" />
                  </div>
                  <Brain className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 absolute -top-1 -right-1" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Documents Analyzing...
                </h3>
                <p className="text-slate-600 dark:text-gray-300 max-w-md mx-auto text-xs sm:text-sm px-4">
                  {analyzingStatus || "Please wait while your documents are being processed. This may take a few minutes for larger files."}
                </p>

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 sm:p-4 max-w-md mx-auto">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Analysis in Progress</span>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Large files (&gt;1MB) may take longer to process. Chat will be available once all documents are ready.
                  </p>
                </div>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-6 sm:py-8 space-y-3 sm:space-y-4">
              <div className="flex justify-center">
                {/* <div className="relative">
                  <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl">
                    <Bot className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 absolute -top-1 -right-1" />
                </div> */}
              </div>

              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {casualMode
                    ? 'What\'s on your mind today?'
                    : isDemoMode
                      ? 'Explore the demo interface!'
                      : bypassAPI
                        ? 'Ready to chat about your document!'
                        : 'Ready to explore your document!'
                  }
                </h3>
                <p className="text-slate-600 dark:text-gray-300 max-w-md mx-auto text-xs sm:text-sm px-4">
                  {casualMode
                    ? "I'm here to help with any questions, tasks, or conversations."
                    : isDemoMode
                      ? "This is a demo of the chat interface. Try asking questions about the sample business plan document to see how the AI responds."
                      : bypassAPI
                        ? "I've loaded your document and I'm ready to answer questions. This preview mode uses mock responses to save your API quota."
                        : "I've analyzed your document and I'm ready to answer questions, explain concepts, or dive deeper into specific sections."
                  }
                </p>
              </div>

              <div className="space-y-2">
                {/* <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-gray-300">
                  {casualMode ? 'Try asking:' : 'Try asking:'}
                </p>
                <div className="flex flex-wrap gap-1 sm:gap-1.5 justify-center max-w-lg mx-auto">
                  {suggestedQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setInputMessage(question || '')}
                      className="text-xs hover:bg-blue-50 dark:bg-[#121212] dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-200 px-2 py-1 h-auto"
                    >
                      {question}
                    </Button>
                  ))}
                </div> */}
              </div>
            </div>
          ) : (
            <div className={`space-y-3 sm:space-y-4 ${isInitialLoad ? 'animate-fade-in-scale' : ''}`}>
              {messages.map((message, index) => (
                <div
                  key={message.id || index}
                  className={`flex gap-2 sm:gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-message-enter`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {message.type !== 'user' && (
                    <div className="flex-shrink-0 mt-1">
                      {message.type === 'ai' ? (
                        <div className="p-1 sm:p-1.5 ">

                        </div>
                      ) : (
                        <div className="p-1 sm:p-1.5 bg-red-100 dark:bg-red-900/40 rounded-xl">
                          <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-600 dark:text-red-400" />
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`max-w-[85%] sm:max-w-[100%] ${message.type === 'user' ? 'order-first' : ''}`}>
                    <Card className={`shadow-sm border-0 ${message.type === 'user'
                      ? 'bg-black text-white dark:bg-[#3f3f3f] ml-auto'
                      : message.type === 'error'
                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                        : 'bg-white dark:bg-background'
                      }`}>
                      <CardContent className="p-2.5 sm:p-3">
                        {message.type === 'ai' ? (
                          message.id === typewriterMessageId ? (
                            <TypewriterText
                              content={message.content}
                              speed={25}
                              className="text-slate-700 dark:text-gray-200 text-xs sm:text-sm"
                              useFormatter={true}
                              onProgress={handleTypewriterProgress}
                              onComplete={handleTypewriterComplete}
                            />
                          ) : (
                            <MessageFormatter
                              content={message.content}
                              className="text-slate-700 dark:text-gray-200 text-xs sm:text-sm"
                            />
                          )
                        ) : (
                          <p className={`text-xs sm:text-sm leading-relaxed ${message.type === 'user'
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
                          <div className="flex items-center gap-1 sm:gap-1.5 mt-2 pt-2 border-t border-slate-100 dark:border-gray-700">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFeedback(message.id, 'good')}
                                className={`h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors ${messageFeedback[message.id] === 'good'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                  : 'text-slate-400 hover:text-green-600'
                                  }`}
                                title="Good response"
                              >
                                <ThumbsUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFeedback(message.id, 'bad')}
                                className={`h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors ${messageFeedback[message.id] === 'bad'
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                  : 'text-slate-400 hover:text-red-600'
                                  }`}
                                title="Bad response"
                              >
                                <ThumbsDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              </Button>
                            </div>

                            <Separator orientation="vertical" className="h-2.5 sm:h-3" />

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyMessage(message.id, message.content)}
                              className={`h-5 sm:h-6 px-1 sm:px-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors ${copiedMessageId === message.id
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                : 'text-slate-400 hover:text-blue-600'
                                }`}
                              title="Copy response"
                            >
                              {copiedMessageId === message.id ? (
                                <>
                                  <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                                  <span className="text-xs">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                                  <span className="text-xs">Copy</span>
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    <p className={`text-xs mt-1 px-2 ${message.type === 'user' ? 'text-right' : 'text-left'
                      } text-slate-400 dark:text-gray-500`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>

                  {message.type === 'user' && (
                    <div className="flex-shrink-0 mt-1">
                      <div className="   ">
                        {/* <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" /> */}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2 sm:gap-3 justify-start">
                  <div className="flex-shrink-0 mt-1">
                    {/* <div className="p-1 sm:p-1.5 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 rounded-xl">
                      <Bot className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-600 dark:text-blue-400" />
                    </div> */}
                  </div>
                  <div className="max-w-[75%]">
                    <Card className="bg-white dark:bg-background shadow-sm">
                      <CardContent className="p-2.5 sm:p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-white rounded-full animate-bounce"></div>
                          </div>
                          {/* <span className="text-xs sm:text-sm text-slate-600 dark:text-gray-300">Thinking...</span>
                          <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-500 animate-pulse" /> */}
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

        {/* Scroll Indicator */}
        {showScrollIndicator && (
          <div className="absolute bottom-20 right-4 z-10">
            <Button
              onClick={scrollToBottom}
              className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-lg hover:shadow-xl transition-all duration-200 animate-scroll-indicator"
              title="Scroll to bottom"
            >
              <ChevronDown className="h-4 w-4 text-white" />
            </Button>
          </div>
        )}
      </div>

      {/* Modern Input - Fixed at bottom */}
      <div className="flex-shrink-0 p-2 sm:p-3 lg:p-4 bg-white/80 dark:bg-[#1f1f1f] backdrop-blur-sm">
        {/* Chat Error Alert */}
        {chatError && (
          <div className="mb-2 sm:mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-800 dark:text-red-300">{chatError}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChatError('')}
                className="h-auto p-1 hover:bg-red-100 dark:hover:bg-red-800/20"
              >
                ✕
              </Button>
            </div>
          </div>
        )}

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
              placeholder={isDisabled ? "Documents are being analyzed..." : (casualMode ? "Ask anything" : "Enter question here to inquire on the document.")}
              className="min-h-[40px] sm:min-h-[44px] lg:min-h-[48px] max-h-[80px] sm:max-h-[100px] resize-none bg-white dark:bg-[#2f2f2f] dark:border-gray-400 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-gray-400 rounded-xl pr-10 sm:pr-12 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-sm"
              disabled={isLoading || isDisabled}
            />
            <Button
              type="submit"
              disabled={!inputMessage || !inputMessage.trim() || isLoading || isDisabled}
              className="absolute right-1 sm:right-1.5 bottom-1 sm:bottom-1.5 h-6 w-6 sm:h-7 sm:w-7 p-0 bg-[#121212] hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
            >
              <Send className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-xs text-slate-500 dark:text-gray-400">
            <span className="hidden sm:inline">Press Enter to send, Shift+Enter for new line</span>
            <span className="sm:hidden text-center">Tap Enter to send</span>
            <div className="flex items-center gap-1 justify-center sm:justify-end">
              <Sparkles className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
              <span className="hidden sm:inline text-xs">
                {casualMode ? (
                  <>Powered by <a
                    href="https://www.anthropic.com/claude/sonnet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-400 underline hover:text-blue-600"
                  >
                    Claude 4 Sonnet
                  </a></>
                ) : isDemoMode ? (
                  'Demo Mode - No API calls'
                ) : bypassAPI ? (
                  'Preview Mode - No API calls'
                ) : (
                  <>
                    Powered by <a
                      href="https://www.anthropic.com/claude/sonnet"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-400 underline hover:text-blue-600"
                    >
                      Claude 4 Sonnet
                    </a>
                  </>
                )}
              </span>
              <span className="sm:hidden text-xs">
                {casualMode ? 'Claude 4 Sonnet' : isDemoMode ? 'Demo Mode' : bypassAPI ? 'Preview' : 'Claude 4 Sonnet'}
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModernChatPanel 