import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { Button } from './components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './components/ui/card'
import { Textarea } from './components/ui/textarea'
import { ScrollArea } from './components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './components/ui/collapsible'
import { Separator } from './components/ui/separator'
import { Badge } from './components/ui/badge'
import { MessageCircle, Send, Trash2, ChevronDown, ChevronUp, Bot, User, AlertCircle } from 'lucide-react'

function ChatInterface({ documentId, filename, autoExpand = false }) {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(autoExpand)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    setIsExpanded(autoExpand)
  }, [autoExpand])

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
    <Card className="w-full">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">Chat about: {filename}</CardTitle>
                  <CardDescription>Ask questions about your document</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    clearChat()
                  }}
                  disabled={messages.length === 0}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <ScrollArea className="h-96 w-full rounded-md border p-4 smooth-scroll">
              {messages.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <div className="flex justify-center">
                    <div className="rounded-full bg-primary/10 p-3">
                      <Bot className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Hi! I'm ready to answer questions about your document.</p>
                    <p className="text-xs text-muted-foreground">Try asking:</p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge variant="outline">"What are the main points?"</Badge>
                    <Badge variant="outline">"Can you explain section X?"</Badge>
                    <Badge variant="outline">"What should I be concerned about?"</Badge>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div key={index} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {message.type !== 'user' && (
                        <div className="flex-shrink-0">
                          {message.type === 'ai' ? (
                            <div className="rounded-full bg-primary/10 p-2">
                              <Bot className="h-4 w-4 text-primary" />
                            </div>
                          ) : (
                            <div className="rounded-full bg-destructive/10 p-2">
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            </div>
                          )}
                        </div>
                      )}
                      <div className={`max-w-[80%] ${message.type === 'user' ? 'order-first' : ''}`}>
                        <div className={`rounded-lg p-3 text-sm ${
                          message.type === 'user' 
                            ? 'bg-primary text-primary-foreground ml-auto' 
                            : message.type === 'error'
                            ? 'bg-destructive/10 text-destructive border border-destructive/20'
                            : 'bg-muted'
                        }`}>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 px-3">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      {message.type === 'user' && (
                        <div className="flex-shrink-0">
                          <div className="rounded-full bg-primary p-2">
                            <User className="h-4 w-4 text-primary-foreground" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="flex-shrink-0">
                        <div className="rounded-full bg-primary/10 p-2">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <div className="max-w-[80%]">
                        <div className="rounded-lg p-3 text-sm bg-muted">
                          <div className="flex items-center gap-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                            </div>
                            <span>Thinking...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            <Separator className="my-4" />

            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="flex gap-2">
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
                  className="min-h-[60px] flex-1"
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  size="icon"
                  disabled={!inputMessage.trim() || isLoading}
                  className="h-[60px] w-12"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

export default ChatInterface 