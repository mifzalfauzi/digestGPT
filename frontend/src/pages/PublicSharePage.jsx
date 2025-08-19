import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { Card, CardHeader, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { AlertCircle, MessageCircle, Bot, User, ExternalLink, Eye, Clock, FileText, BarChart3, Lightbulb, Target, File, Download, Share, TrendingUp, AlertTriangle } from 'lucide-react'
import MessageFormatter from '../components/MessageFormatter'
import KeyConceptsDisplay from '../components/KeyConceptsDisplay'

function PublicSharePage() {
  const { shareToken } = useParams()
  const [shareData, setShareData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const leftRef = useRef(null)
  const rightRef = useRef(null)
  const BASE_URL = import.meta.env.VITE_API_BASE_URL
  const syncHeights = () => {
    if (leftRef.current && rightRef.current) {
      // Use clientHeight to respect max-h and padding
      const leftHeight = leftRef.current.getBoundingClientRect().height
      rightRef.current.style.height = `${leftHeight}px`
    }
  }

  useEffect(() => {
    syncHeights()
  }, [activeTab])

  useEffect(() => {
    // Re-sync when data loads/changes
    syncHeights()
  }, [shareData])

  useEffect(() => {
    // Re-sync on window resize
    const onResize = () => syncHeights()
    window.addEventListener('resize', onResize)

    // Observe left container size changes
    let observer
    if ('ResizeObserver' in window && leftRef.current) {
      observer = new ResizeObserver(() => syncHeights())
      observer.observe(leftRef.current)
    }

    // Initial sync after first paint
    const raf = requestAnimationFrame(syncHeights)

    return () => {
      window.removeEventListener('resize', onResize)
      if (observer && leftRef.current) observer.unobserve(leftRef.current)
      cancelAnimationFrame(raf)
    }
  }, [])

  useEffect(() => {
    const fetchShareData = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/chat/public-share/${shareToken}`)
        setShareData(response.data)
        console.log('Share data received:', response.data)
      } catch (err) {
        console.error('Error fetching share data:', err)
        if (err.response?.status === 404) {
          setError('This shared conversation was not found or has expired.')
        } else if (err.response?.status === 429) {
          setError('This shared conversation has exceeded its view limit.')
        } else {
          setError('Failed to load the shared conversation. Please try again.')
        }
      } finally {
        setLoading(false)
      }
    }

    if (shareToken) {
      fetchShareData()
    }
  }, [shareToken])

  // PDF Export functionality
  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      // Use jsPDF or html2pdf.js for client-side PDF generation
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()

      // Add title
      doc.setFontSize(20)
      doc.text(shareData.title, 20, 30)

      // Add document info
      doc.setFontSize(12)
      doc.text(`Document: ${shareData.document_filename}`, 20, 50)
      doc.text(`Created: ${new Date(shareData.created_at).toLocaleDateString()}`, 20, 60)
      doc.text(`Views: ${shareData.view_count}`, 20, 70)

      let yPosition = 90

      // Add overview
      if (shareData.overview) {
        doc.setFontSize(14)
        doc.text('Overview', 20, yPosition)
        yPosition += 10
        doc.setFontSize(10)
        const overviewLines = doc.splitTextToSize(shareData.overview.replace(/[*#]/g, ''), 170)
        doc.text(overviewLines, 20, yPosition)
        yPosition += overviewLines.length * 5 + 10
      }

      // Add SWOT Analysis
      if (shareData.swot_analysis && Object.keys(shareData.swot_analysis).length > 0) {
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 20
        }

        doc.setFontSize(14)
        doc.text('SWOT Analysis', 20, yPosition)
        yPosition += 15

        const categories = ['strengths', 'weaknesses', 'opportunities', 'threats']
        categories.forEach(category => {
          if (shareData.swot_analysis[category] && shareData.swot_analysis[category].length > 0) {
            doc.setFontSize(12)
            doc.text(category.charAt(0).toUpperCase() + category.slice(1), 20, yPosition)
            yPosition += 8
            doc.setFontSize(10)

            shareData.swot_analysis[category].forEach((item, index) => {
              const text = typeof item === 'string' ? item : item.title || item
              doc.text(`• ${text}`, 25, yPosition)
              yPosition += 6
              if (yPosition > 270) {
                doc.addPage()
                yPosition = 20
              }
            })
            yPosition += 5
          }
        })
      }

      // Add chat history
      const messages = formatChatHistory()
      if (messages.length > 0) {
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 20
        }

        doc.setFontSize(14)
        doc.text('Conversation History', 20, yPosition)
        yPosition += 15

        messages.forEach(message => {
          if (yPosition > 260) {
            doc.addPage()
            yPosition = 20
          }

          doc.setFontSize(10)
          doc.text(`${message.type === 'user' ? 'User' : 'AI'}:`, 20, yPosition)
          yPosition += 6

          const messageLines = doc.splitTextToSize(message.content.replace(/[*#]/g, ''), 170)
          doc.text(messageLines, 25, yPosition)
          yPosition += messageLines.length * 5 + 10
        })
      }

      // Save the PDF
      doc.save(`${shareData.document_filename}_analysis.pdf`)
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Failed to export PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-[#121212]">
        <div className="mx-auto max-w-md rounded-2xl bg-white dark:bg-[#121212] shadow-lg p-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full flex items-center justify-center">
            <span className="flex space-x-1">
              <span className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce" style={{ animationDelay: '0s' }}></span>
              <span className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </span>
          </div>

          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Loading Shared Conversation</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Please wait while we retrieve the shared content.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="mx-auto max-w-lg rounded-2xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-gray-900 shadow-lg p-8 text-center ring-1 ring-red-200/20 dark:ring-red-900/20">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Unable to Load Conversation</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <Button onClick={() => window.location.href = '/'} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-4 py-2 text-sm">Return to Home</Button>
        </div>
      </div>
    )
  }

  // Format chat history for display
  const formatChatHistory = () => {
    if (!shareData.chat_history) return []

    const messages = []
    shareData.chat_history.forEach((chat, index) => {
      // Add user message
      messages.push({
        id: `${chat.id}_user`,
        type: 'user',
        content: chat.user_message,
        timestamp: chat.timestamp
      })
      // Add AI response
      messages.push({
        id: `${chat.id}_ai`,
        type: 'ai',
        content: chat.ai_response,
        timestamp: chat.timestamp
      })
    })
    return messages
  }

  const messages = formatChatHistory()

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 rounded-2xl bg-white dark:bg-[#121212] overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                  <Share className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">drop2chat*</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                    <File className="h-4 w-4" />
                    {shareData.document_filename}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-4 py-2 text-sm flex items-center justify-center"
                >
                  {isExporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </>
                  )}
                </Button>
                <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/'}
              className="border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-4 py-2 text-sm flex items-center"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Visit drop2chat*
            </Button>
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 font-medium rounded-lg px-3 py-1 text-sm flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  Public
                </Badge>
              </div>
            </div>

            {/* Share info */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                Created {new Date(shareData.created_at).toLocaleDateString()}
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400">
                <MessageCircle className="h-4 w-4" />
                {messages.length} messages
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Chat History */}
          <section className="lg:col-span-1">
            <Card ref={leftRef} className="h-full max-h-[60vh] rounded-2xl bg-white dark:bg-gray-900 shadow-lg ring-1 ring-gray-200/5 dark:ring-gray-800/5 overflow-hidden">
              <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">

                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Conversation History</h2>
                  </div>
                  <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium rounded-full px-3 py-1 text-xs">
                    {messages.length} messages
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-hidden h-[calc(100%-5rem)]">
                {messages.length > 0 ? (
                  <div className="h-full overflow-y-auto p-4 space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
                      >
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.type === 'user'
                              ? ''
                              : ''
                            }`}>
                            {/* {message.type === 'user' ? (
                              <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                            ) : (
                                <Bot className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            )} */}
                          </div>
                        </div>
                        <div className={`max-w-[80%] ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                          <div className={`inline-block rounded-xl px-4 py-3 text-sm shadow-sm ${message.type === 'user'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200'
                            }`}>
                            {message.type === 'ai' ? (
                              <MessageFormatter
                                content={message.content}
                                className="prose prose-sm dark:prose-invert max-w-none"
                              />
                            ) : (
                              <p className="text-white">{message.content}</p>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <div className="text-center p-6">
                      <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No conversation history available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Right Column - Analysis Tabs */}
          <section className="lg:col-span-1">
            <Tabs
              defaultValue="overview"
              onValueChange={setActiveTab}
              ref={rightRef}
              className={`h-full flex flex-col rounded-2xl bg-white dark:bg-gray-900 overflow-hidden max-h-[60vh]`}
            >
              <TabsList className="grid grid-cols-5 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 p-1">
                <TabsTrigger value="overview" className="flex items-center justify-center gap-2 py-2 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm rounded-t-md">
                  <FileText className="h-4 w-4" />
                  <span className="hidden md:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="insights" className="flex items-center justify-center gap-2 py-2 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm rounded-t-md">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden md:inline">Insights</span>
                </TabsTrigger>
                <TabsTrigger value="swot" className="flex items-center justify-center gap-2 py-2 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm rounded-t-md">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden md:inline">SWOT</span>
                </TabsTrigger>
                <TabsTrigger value="document" className="flex items-center justify-center gap-2 py-2 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm rounded-t-md">
                  <File className="h-4 w-4" />
                  <span className="hidden md:inline">Document</span>
                </TabsTrigger>
                <TabsTrigger value="text" className="flex items-center justify-center gap-2 py-2 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm rounded-t-md">
                  <FileText className="h-4 w-4" />
                  <span className="hidden md:inline">Text</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden">
                {/* Overview Tab */}
                <TabsContent value="overview" className="h-full p-6 overflow-hidden transition-all duration-200 data-[state=inactive]:opacity-0 data-[state=active]:opacity-100">
                  {/* Single internal scroll area to prevent height jump */}
                  <div className="h-full overflow-y-auto space-y-6">
                    {shareData.overview ? (
                      <div className="prose prose-slate dark:prose-invert max-w-none text-gray-800 dark:text-gray-200">
                        <MessageFormatter content={shareData.overview} />
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                        <div className="text-center">
                          <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p>No overview available</p>
                        </div>
                      </div>
                    )}

                    <KeyConceptsDisplay
                      concepts={shareData.key_concepts || []}
                      isDemoMode={false}
                      bypassAPI={true}
                      onExplainConcept={null}
                    />
                  </div>
                </TabsContent>

                {/* Insights Tab */}
                <TabsContent value="insights" className="h-full p-6 overflow-y-auto transition-all duration-200 data-[state=inactive]:opacity-0 data-[state=active]:opacity-100">
                  {(shareData.key_points && shareData.key_points.length > 0) || (shareData.risk_flags && shareData.risk_flags.length > 0) ? (
                    <div className="h-full overflow-y-auto">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Insights */}
                        <section>
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Key Insights</h3>
                          </div>
                          {shareData.key_points && shareData.key_points.length > 0 ? (
                            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                              {shareData.key_points.map((p, idx) => {
                                const text = typeof p === 'string' ? p : p.text || p.description || ''
                                return (
                                  <li key={idx} className="leading-relaxed">
                                    • {text}
                                  </li>
                                )
                              })}
                            </ul>
                          ) : (
                            <p className="text-xs text-gray-500 dark:text-gray-400">No insights identified.</p>
                          )}
                        </section>

                        {/* Risks */}
                        <section>
                          <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Risks</h3>
                          </div>
                          {shareData.risk_flags && shareData.risk_flags.length > 0 ? (
                            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                              {shareData.risk_flags.map((r, idx) => {
                                const text = typeof r === 'string' ? r : r.text || r.description || ''
                                return (
                                  <li key={idx} className="leading-relaxed">
                                    • {text}
                                  </li>
                                )
                              })}
                            </ul>
                          ) : (
                            <p className="text-xs text-gray-500 dark:text-gray-400">No risks identified.</p>
                          )}
                        </section>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                      <div className="text-center">
                        <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>No insights available</p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* SWOT Analysis Tab */}
                <TabsContent value="swot" className="h-full p-6 overflow-y-auto transition-all duration-200 data-[state=inactive]:opacity-0 data-[state=active]:opacity-100">
                  {shareData.swot_analysis && Object.keys(shareData.swot_analysis).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Strengths */}
                      <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                        <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-200 mb-2">Strengths</h4>
                        <ul className="space-y-1 text-sm text-emerald-900 dark:text-emerald-100">
                          {(shareData.swot_analysis.strengths || []).map((item, i) => (
                            <li key={`s-${i}`}>• {typeof item === 'string' ? item : item.text || item.title || String(item)}</li>
                          ))}
                        </ul>
                      </div>
                      {/* Weaknesses */}
                      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                        <h4 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">Weaknesses</h4>
                        <ul className="space-y-1 text-sm text-red-900 dark:text-red-100">
                          {(shareData.swot_analysis.weaknesses || []).map((item, i) => (
                            <li key={`w-${i}`}>• {typeof item === 'string' ? item : item.text || item.title || String(item)}</li>
                          ))}
                        </ul>
                      </div>
                      {/* Opportunities */}
                      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">Opportunities</h4>
                        <ul className="space-y-1 text-sm text-blue-900 dark:text-blue-100">
                          {(shareData.swot_analysis.opportunities || []).map((item, i) => (
                            <li key={`o-${i}`}>• {typeof item === 'string' ? item : item.text || item.title || String(item)}</li>
                          ))}
                        </ul>
                      </div>
                      {/* Threats */}
                      <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                        <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">Threats</h4>
                        <ul className="space-y-1 text-sm text-amber-900 dark:text-amber-100">
                          {(shareData.swot_analysis.threats || []).map((item, i) => (
                            <li key={`t-${i}`}>• {typeof item === 'string' ? item : item.text || item.title || String(item)}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                      <div className="text-center">
                        <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>No SWOT analysis available</p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Document View Tab */}
                <TabsContent value="document" className="h-full p-6 transition-all duration-200 data-[state=inactive]:opacity-0 data-[state=active]:opacity-100">
                  {shareData.file_url && shareData.document_filename?.toLowerCase().endsWith('.pdf') ? (
                    <iframe
                      src={shareData.file_url}
                      className="w-full h-full rounded-lg"
                      title="Document Preview"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                      <div className="text-center">
                        <File className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="mb-4">Document preview not available</p>
                        {shareData.file_url && (
                          <Button
                            variant="outline"
                            onClick={() => window.open(shareData.file_url, '_blank')}
                            className="border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-4 py-2 text-sm"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open Document
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Extracted Text Tab */}
                <TabsContent value="text" className="h-full p-6 overflow-y-auto transition-all duration-200 data-[state=inactive]:opacity-0 data-[state=active]:opacity-100">
                  {shareData.extracted_text ? (
                    <pre className="rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-x-auto">
                      {shareData.extracted_text}
                    </pre>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                      <div className="text-center">
                        <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>No extracted text available</p>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
            <p>This analysis is publicly shared and read-only.</p>
            
          </div>
        </footer>
      </div>
    </div>
  )
}

export default PublicSharePage