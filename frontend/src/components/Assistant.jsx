"use client"

import { useState } from "react"
import axios from "axios"
import ModernSidebar from "./ModernSidebar"
import ModernUploadInterface from "./ModernUploadInterface"
import ModernChatPanel from "./ModernChatPanel"
import EnhancedDocumentViewer from "./EnhancedDocumentViewer"
import { Button } from "./ui/button"
import { Menu, X, MessageCircle, FileText, Eye, GripVertical, Sparkles, Zap } from "lucide-react"

function Assistant() {
  const [file, setFile] = useState(null)
  const [textInput, setTextInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState("")
  const [inputMode, setInputMode] = useState("file") // 'file' or 'text'
  const [documentId, setDocumentId] = useState(null)
  const [currentView, setCurrentView] = useState("upload") // 'upload', 'workspace', or 'casual-chat'
  const [chatSetInputMessage, setChatSetInputMessage] = useState(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [bypassAPI, setBypassAPI] = useState(false)

  // Responsive state
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activePanel, setActivePanel] = useState("chat") // 'chat' or 'document' for mobile

  // Sidebar collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  // Resizable panel state
  const [rightPanelWidth, setRightPanelWidth] = useState(45) // percentage
  const [isResizing, setIsResizing] = useState(false)

  // ... (keep all existing handler functions unchanged)
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith(".pdf") && !selectedFile.name.toLowerCase().endsWith(".docx")) {
        setError("Please select a PDF or DOCX file")
        return
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File too large. Maximum size is 10MB")
        return
      }
      setFile(selectedFile)
      setError("")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResults(null)
    try {
      let response

      if (inputMode === "file") {
        if (!file) {
          setError("Please select a file")
          setLoading(false)
          return
        }

        const formData = new FormData()
        formData.append("file", file)

        response = await axios.post("http://localhost:8000/analyze-file", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
      } else {
        if (!textInput.trim()) {
          setError("Please enter some text")
          setLoading(false)
          return
        }

        const formData = new FormData()
        formData.append("text", textInput)

        response = await axios.post("http://localhost:8000/analyze-text", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
      }

      console.log("API Response:", response.data)
      setResults(response.data)
      setDocumentId(response.data.document_id)
      setCurrentView("workspace")
      setSidebarOpen(false)
      setActivePanel("chat")
    } catch (err) {
      console.error("Error:", err)
      if (err.response?.data?.detail) {
        setError(err.response.data.detail)
      } else {
        setError("An error occurred while processing your request")
      }
    } finally {
      setLoading(false)
    }
  }

  const resetToHome = () => {
    setFile(null)
    setTextInput("")
    setResults(null)
    setError("")
    setDocumentId(null)
    setCurrentView("upload")
    setSidebarOpen(false)
    setIsDemoMode(false)
    setBypassAPI(false)
    const fileInput = document.getElementById("file-input")
    if (fileInput) fileInput.value = ""
  }

  const handleNewDocument = () => {
    resetToHome()
  }

  const handleExplainConcept = (conceptTerm) => {
    if (chatSetInputMessage) {
      const message = `Explain the following concept in detail: ${conceptTerm}`
      chatSetInputMessage(message)
      setActivePanel("chat")
    }
  }

  const handleCasualChat = () => {
    setCurrentView("casual-chat")
    setSidebarOpen(false)
    setDocumentId("casual-chat-session")
    setResults(null)
    setFile(null)
    setIsDemoMode(false)
    setBypassAPI(false)
  }

  const startDemoMode = () => {
    setIsDemoMode(true)
    setDocumentId("demo-document-id")
    setCurrentView("workspace")
    setSidebarOpen(false)
    setActivePanel("chat")

    setResults({
      filename: "Sample Business Plan.pdf",
      document_id: "demo-document-id",
      executive_summary: {
        main_points: [
          "Strategic expansion into emerging markets with projected 40% revenue growth",
          "Development of innovative AI-powered product suite launching Q3 2024",
          "Establishment of three new regional offices and 150+ new hires",
          "Implementation of sustainable business practices reducing carbon footprint by 60%",
        ],
        key_findings: [
          "Market analysis reveals untapped opportunities in Southeast Asia",
          "Customer acquisition costs decreased by 25% through improved digital marketing",
          "Operational efficiency gains of 30% through automation initiatives",
          "Strong competitive advantage in AI technology and customer service",
        ],
        concerns: [
          "Potential supply chain disruptions affecting Q2 delivery timelines",
          "Regulatory changes in target markets may impact expansion strategy",
          "Increased competition from well-funded startups in core markets",
          "Talent acquisition challenges in specialized technical roles",
        ],
      },
      key_concepts: [
        {
          term: "Market Penetration Strategy",
          definition:
            "A comprehensive approach to entering new geographical markets through strategic partnerships and localized product offerings",
          importance: "Critical for achieving projected 40% revenue growth and establishing global presence",
        },
        {
          term: "AI-Powered Analytics",
          definition:
            "Advanced machine learning algorithms that provide real-time business insights and predictive modeling capabilities",
          importance: "Core differentiator that enables data-driven decision making and competitive advantage",
        },
        {
          term: "Sustainable Operations",
          definition: "Business practices focused on environmental responsibility and long-term resource efficiency",
          importance: "Essential for regulatory compliance and meeting ESG investment criteria",
        },
      ],
      analysis: {
        strengths: [
          "Strong financial position with 18 months runway",
          "Experienced leadership team with proven track record",
          "Innovative technology stack with proprietary AI capabilities",
          "Growing customer base with 95% retention rate",
        ],
        opportunities: [
          "Emerging markets showing 200% YoY growth potential",
          "Strategic partnerships with Fortune 500 companies",
          "Government incentives for sustainable technology adoption",
          "Increasing demand for AI-powered business solutions",
        ],
        threats: [
          "Economic uncertainty affecting enterprise spending",
          "Rapid technological changes requiring continuous innovation",
          "Talent war for AI and machine learning specialists",
          "Potential regulatory restrictions on AI applications",
        ],
      },
    })
  }

  const loadRealInterfaceWithoutAPI = () => {
    setBypassAPI(true)
    setDocumentId("real-document-id")
    setCurrentView("workspace")
    setSidebarOpen(false)
    setActivePanel("chat")

    setResults({
      success: true,
      filename: "Business_Plan_Q1_2024.pdf",
      document_id: "real-document-id",
      document_text: `# Strategic Business Plan - Q1 2024 Analysis

## Executive Summary
This comprehensive business plan outlines our strategic initiatives for Q1 2024, focusing on market expansion, technology advancement, and operational excellence. Our analysis indicates strong growth potential across multiple sectors with projected revenue increases of 40% year-over-year.

### Key Strategic Priorities
**Market Expansion Initiative**: Our research has identified significant opportunities in emerging markets, particularly in Southeast Asia where we project 200% growth potential. Market analysis reveals untapped demand for AI-powered business solutions in financial services and healthcare sectors.

**Technology Innovation Platform**: Development of our next-generation AI analytics platform is scheduled for Q3 2024 launch. This platform will provide real-time business insights and predictive modeling capabilities, positioning us as a leader in data-driven decision making tools.

**Sustainable Operations Framework**: Implementation of environmentally responsible business practices will reduce our carbon footprint by 60% while ensuring compliance with evolving ESG regulations and meeting institutional investor criteria.

## Financial Performance Analysis
Our financial model demonstrates robust fundamentals with conservative projections and adequate cash reserves. Current metrics show:
- 18-month operational runway with current burn rate
- Customer acquisition cost reduction of 25% through improved digital marketing
- Operational efficiency improvements of 30% via automation initiatives
- Customer retention rate maintaining at 95%

### Revenue Projections by Segment
Enterprise AI Solutions: 45% of total projected revenue
Healthcare Analytics: 25% of total projected revenue
Financial Services Platform: 20% of total projected revenue
Other Market Segments: 10% of total projected revenue

## Risk Assessment and Mitigation
**Supply Chain Vulnerabilities**: Potential disruptions in Q2 delivery schedules require development of alternative supplier relationships and contingency planning frameworks.

**Regulatory Environment Changes**: Evolving regulations in target markets may impact our expansion timeline, necessitating flexible compliance strategies and legal framework adaptations.

**Talent Acquisition Challenges**: The competitive landscape for AI and machine learning specialists presents recruitment challenges that could affect our development timeline and scaling objectives.

## Implementation Strategy
**Phase 1 (Q1-Q2 2024)**: Complete market research initiatives and establish strategic partnerships
**Phase 2 (Q3 2024)**: Launch AI platform and initiate market entry strategies  
**Phase 3 (Q4 2024)**: Scale operations with 150+ strategic hires across three regional offices

## Competitive Landscape Analysis
Our proprietary AI technology creates substantial barriers to entry while our established customer relationships maintain industry-leading retention rates. Strategic partnerships with Fortune 500 companies provide accelerated market penetration opportunities and competitive differentiation.

## Conclusion and Next Steps
This business plan effectively balances ambitious growth objectives with comprehensive risk management strategies. The combination of strong financial positioning, innovative technology capabilities, and strategic market opportunities positions our organization for sustained success in the evolving business intelligence landscape.`,
      analysis: {
        summary:
          "This business plan presents a comprehensive strategy for Q1 2024 focusing on AI-powered market expansion with strong financial fundamentals and risk management. The document outlines ambitious yet achievable growth targets supported by detailed market analysis and operational planning.",
        key_points: [
          {
            text: "Strategic expansion into emerging markets with projected 40% revenue growth through AI-powered solutions",
            quote: "projected revenue increases of 40% year-over-year",
          },
          {
            text: "Technology platform launch scheduled for Q3 2024 providing competitive differentiation",
            quote: "Development of our next-generation AI analytics platform is scheduled for Q3 2024 launch",
          },
          {
            text: "Strong financial position with 18-month runway and improved efficiency metrics",
            quote: "18-month operational runway with current burn rate",
          },
          {
            text: "Customer retention excellence with 95% retention rate demonstrating product-market fit",
            quote: "Customer retention rate maintaining at 95%",
          },
        ],
        risk_flags: [
          {
            text: "🚩 Supply chain vulnerabilities could impact Q2 delivery timelines",
            quote: "Potential disruptions in Q2 delivery schedules",
          },
          {
            text: "🚩 Regulatory changes in target markets may affect expansion strategy",
            quote: "Evolving regulations in target markets may impact our expansion timeline",
          },
          {
            text: "🚩 Talent acquisition challenges in competitive AI/ML market",
            quote: "competitive landscape for AI and machine learning specialists",
          },
        ],
        key_concepts: [
          {
            term: "Market Penetration Strategy",
            explanation:
              "A systematic approach to entering new geographical markets through strategic partnerships, localized product offerings, and targeted customer acquisition initiatives",
          },
          {
            term: "AI-Powered Analytics Platform",
            explanation:
              "Advanced machine learning algorithms that provide real-time business insights, predictive modeling, and data-driven decision making capabilities for enterprise clients",
          },
          {
            term: "ESG Compliance Framework",
            explanation:
              "Environmental, Social, and Governance practices that ensure regulatory compliance while meeting institutional investor criteria and sustainable business operations",
          },
        ],
      },
      analyzed_at: new Date().toISOString(),
    })
  }

  const handleMouseDown = (e) => {
    e.preventDefault()
    setIsResizing(true)

    const handleMouseMove = (e) => {
      const container = e.currentTarget.parentElement || document.querySelector(".workspace-container")
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const containerWidth = containerRect.width
      const mouseX = e.clientX - containerRect.left

      const percentage = Math.min(Math.max(((containerWidth - mouseX) / containerWidth) * 100, 25), 75)
      setRightPanelWidth(percentage)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 relative overflow-hidden">
      {currentView === "upload" ? (
        /* ===== FULL-WIDTH UPLOAD VIEW ===== */
        <div className="h-full flex">
          {/* Sidebar - Wider for better proportions */}
          <div
            className={`hidden lg:block fixed left-0 top-0 h-full z-30 transition-all duration-300 ${
              sidebarCollapsed ? "w-20" : "w-80"
            }`}
          >
            <ModernSidebar
              onNewDocument={handleNewDocument}
              onHome={resetToHome}
              currentDocument={null}
              isDemoMode={isDemoMode}
              bypassAPI={bypassAPI}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              onCasualChat={handleCasualChat}
            />
          </div>

          {/* Main Upload Content - Full Width */}
          <div
            className={`flex-1 transition-all duration-300 ${
              sidebarCollapsed ? "lg:ml-20" : "lg:ml-80"
            } relative min-h-full overflow-y-auto`}
          >
            {/* Professional Full-Width Background */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-indigo-50/40 to-purple-50/50 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/30"></div>
              <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-1/4 left-1/6 w-96 h-96 bg-gradient-to-r from-blue-200/30 to-indigo-200/30 dark:from-blue-800/15 dark:to-indigo-800/15 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-gradient-to-r from-purple-200/30 to-pink-200/30 dark:from-purple-800/15 dark:to-pink-800/15 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-indigo-100/15 to-blue-100/15 dark:from-indigo-900/8 dark:to-blue-900/8 rounded-full blur-3xl"></div>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden fixed top-6 left-6 z-40">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-900 transition-all duration-200"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>

            {/* Centered Content Layout */}
            <div className="relative z-10 w-full min-h-full flex items-center justify-center p-6 lg:p-8">
              <div className="w-full max-w-4xl space-y-8">
                
                {/* Simple Header */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <Sparkles className="h-2.5 w-2.5 text-white" />
                      </div>
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
                      DigesText
                    </h1>
                  </div>
                  {/* <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                    AI-powered document analysis
                  </p> */}
                </div>

                {/* Upload Interface - Centered */}
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-2xl">
                  <ModernUploadInterface
                    file={file}
                    textInput={textInput}
                    setTextInput={setTextInput}
                    inputMode={inputMode}
                    setInputMode={setInputMode}
                    handleFileChange={handleFileChange}
                    handleSubmit={handleSubmit}
                    loading={loading}
                    error={error}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                  <Button
                    onClick={loadRealInterfaceWithoutAPI}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-300 px-6 py-3 text-base font-semibold rounded-xl"
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Launch Workspace
                  </Button>

                  <Button
                    onClick={startDemoMode}
                    variant="outline"
                    className="flex-1 bg-white/80 hover:bg-white dark:bg-gray-900/80 dark:hover:bg-gray-900 border-2 border-gray-200 hover:border-blue-300 dark:border-gray-700 dark:hover:border-blue-600 text-gray-700 hover:text-blue-700 dark:text-gray-300 dark:hover:text-blue-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 px-6 py-3 text-base font-semibold rounded-xl backdrop-blur-sm"
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    View Demo
                  </Button>
                </div>

                {/* Quick Start Options */}
                <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-xl max-w-2xl mx-auto">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">Quick Start</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white mb-1">Workspace</p>
                      <p className="text-gray-600 dark:text-gray-400">Full interface, no API usage</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white mb-1">Demo</p>
                      <p className="text-gray-600 dark:text-gray-400">Preview with sample content</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
                <ModernSidebar
                  onNewDocument={handleNewDocument}
                  onHome={resetToHome}
                  currentDocument={null}
                  onClose={() => setSidebarOpen(false)}
                  isDemoMode={isDemoMode}
                  bypassAPI={bypassAPI}
                  collapsed={false}
                  onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                  onCasualChat={handleCasualChat}
                />
              </div>
            </>
          )}
        </div>
      ) : currentView === "casual-chat" ? (
        /* ===== FULL-WIDTH CASUAL CHAT VIEW ===== */
        <>
          {/* Wider Sidebar */}
          <div
            className={`hidden lg:block fixed left-0 top-0 h-full z-30 transition-all duration-300 ${
              sidebarCollapsed ? "w-20" : "w-80"
            }`}
          >
            <ModernSidebar
              onNewDocument={handleNewDocument}
              onHome={resetToHome}
              currentDocument="Casual Chat"
              isDemoMode={false}
              bypassAPI={false}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              onCasualChat={handleCasualChat}
            />
          </div>

          {/* Professional Full-Width Mobile Header */}
          <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 shadow-lg">
            <div className="flex items-center justify-between p-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-xl"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 dark:from-white dark:to-blue-200 bg-clip-text text-transparent">
                    Casual Chat
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">AI Assistant</p>
                </div>
              </div>
              <div className="w-10"></div>
            </div>
          </div>

          {/* Full-Width Chat Area */}
          <div
            className={`transition-all duration-300 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-80"} pt-16 lg:pt-0 h-full`}
          >
            <ModernChatPanel
              documentId="casual-chat-session"
              filename="Casual Chat - No Document"
              onSetInputMessage={setChatSetInputMessage}
              isDemoMode={false}
              bypassAPI={false}
              casualMode={true}
            />
          </div>

          {/* Mobile Sidebar */}
          {sidebarOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
                <ModernSidebar
                  onNewDocument={handleNewDocument}
                  onHome={resetToHome}
                  currentDocument="Casual Chat"
                  onClose={() => setSidebarOpen(false)}
                  isDemoMode={false}
                  bypassAPI={false}
                  collapsed={false}
                  onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                  onCasualChat={handleCasualChat}
                />
              </div>
            </>
          )}
        </>
      ) : (
        /* ===== FULL-WIDTH WORKSPACE VIEW ===== */
        <>
          {/* Wider Sidebar */}
          <div
            className={`hidden lg:block fixed left-0 top-0 h-full z-30 transition-all duration-300 ${
              sidebarCollapsed ? "w-20" : "w-80"
            }`}
          >
            <ModernSidebar
              onNewDocument={handleNewDocument}
              onHome={resetToHome}
              currentDocument={results?.filename || "Demo Document"}
              isDemoMode={isDemoMode}
              bypassAPI={bypassAPI}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              onCasualChat={handleCasualChat}
            />
          </div>

          {/* Enhanced Mobile Header */}
          <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 shadow-lg">
            <div className="flex items-center justify-between p-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-xl"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div className="text-center">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 dark:from-white dark:to-blue-200 bg-clip-text text-transparent">
                    DigesText
                  </h1>
                  <div className="flex items-center gap-2 text-xs">
                    {isDemoMode && (
                      <span className="text-orange-600 dark:text-orange-400 font-medium">(Demo Mode)</span>
                    )}
                    {bypassAPI && !isDemoMode && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">(Preview Mode)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Mobile Panel Switcher */}
              <div className="flex gap-1 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-1 border border-gray-200/50 dark:border-gray-700/50">
                <Button
                  variant={activePanel === "chat" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActivePanel("chat")}
                  className={`px-3 py-2 text-xs font-semibold h-auto min-w-0 rounded-lg transition-all duration-200 ${
                    activePanel === "chat"
                      ? "bg-white dark:bg-gray-700 shadow-sm text-blue-700 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  <MessageCircle className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Chat</span>
                </Button>
                <Button
                  variant={activePanel === "document" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActivePanel("document")}
                  className={`px-3 py-2 text-xs font-semibold h-auto min-w-0 rounded-lg transition-all duration-200 ${
                    activePanel === "document"
                      ? "bg-white dark:bg-gray-700 shadow-sm text-blue-700 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  <FileText className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Document</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Full-Width Main Content Area */}
          <div
            className={`transition-all duration-300 ${
              sidebarCollapsed ? "lg:ml-20" : "lg:ml-80"
            } pt-16 lg:pt-0 h-full workspace-container`}
          >
            {/* Mobile/Tablet: Full-width panels with switching */}
            <div className="lg:hidden h-full">
              {/* Chat Panel - Mobile/Tablet */}
              <div className={`h-full ${activePanel === "chat" ? "block" : "hidden"}`}>
                {documentId ? (
                  <ModernChatPanel
                    documentId={documentId}
                    filename={results?.filename || "Demo Document"}
                    onSetInputMessage={setChatSetInputMessage}
                    isDemoMode={isDemoMode}
                    bypassAPI={bypassAPI}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 p-6">
                    <div className="text-center space-y-6 max-w-md">
                      <div className="relative">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Processing Document</h3>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                          AI analysis powered by Claude 4 Sonnet is in progress...
                        </p>
                        <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                          <Zap className="h-5 w-5" />
                          <span className="font-semibold">Advanced AI Processing</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Document Viewer Panel - Mobile/Tablet */}
              <div className={`h-full ${activePanel === "document" ? "block" : "hidden"}`}>
                <EnhancedDocumentViewer
                  results={results}
                  file={file}
                  inputMode={inputMode}
                  onExplainConcept={handleExplainConcept}
                  isDemoMode={isDemoMode}
                  bypassAPI={bypassAPI}
                />
              </div>
            </div>

            {/* Desktop: Full-width resizable panels */}
            <div className="hidden lg:flex h-full">
                              {/* Chat Panel - Desktop */}
                <div
                  className="h-full bg-white dark:bg-gray-950"
                  style={{
                    width: `${100 - rightPanelWidth}%`,
                    minWidth: "25%",
                  }}
                >
                {documentId ? (
                  <ModernChatPanel
                    documentId={documentId}
                    filename={results?.filename || "Demo Document"}
                    onSetInputMessage={setChatSetInputMessage}
                    isDemoMode={isDemoMode}
                    bypassAPI={bypassAPI}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 p-12">
                    <div className="text-center space-y-8 max-w-lg">
                      <div className="relative">
                        <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white">Processing Document</h3>
                        <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                          AI analysis powered by Claude 4 Sonnet is in progress...
                        </p>
                        <div className="flex items-center justify-center gap-3 text-blue-600 dark:text-blue-400">
                          <Zap className="h-6 w-6" />
                          <span className="text-lg font-semibold">Advanced AI Processing</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Resize Handle */}
              <div className="relative">
                <div
                  className={`
                    w-2 h-full bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 
                    hover:bg-gradient-to-b hover:from-blue-400 hover:via-blue-500 hover:to-blue-400 
                    dark:hover:from-blue-500 dark:hover:via-blue-400 dark:hover:to-blue-500
                    cursor-col-resize transition-all duration-200 relative group
                    ${isResizing ? "bg-gradient-to-b from-blue-500 via-blue-600 to-blue-500" : ""}
                  `}
                  onMouseDown={handleMouseDown}
                >
                  <div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                                bg-white dark:bg-gray-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/50
                                rounded-full p-3 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-xl border border-gray-200 dark:border-gray-600"
                  >
                    <GripVertical className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                  </div>
                  <div className="absolute inset-y-0 -left-4 -right-4 cursor-col-resize" />
                </div>
              </div>

              {/* Document Viewer Panel - Desktop */}
              <div
                className="h-full bg-white dark:bg-gray-950"
                style={{
                  width: `${rightPanelWidth}%`,
                  minWidth: "25%",
                }}
              >
                <EnhancedDocumentViewer
                  results={results}
                  file={file}
                  inputMode={inputMode}
                  onExplainConcept={handleExplainConcept}
                  isDemoMode={isDemoMode}
                  bypassAPI={bypassAPI}
                />
              </div>
            </div>
          </div>

          {/* Mobile Sidebar */}
          {sidebarOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
                <ModernSidebar
                  onNewDocument={handleNewDocument}
                  onHome={resetToHome}
                  currentDocument={results?.filename || "Demo Document"}
                  onClose={() => setSidebarOpen(false)}
                  isDemoMode={isDemoMode}
                  bypassAPI={bypassAPI}
                  collapsed={false}
                  onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                  onCasualChat={handleCasualChat}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default Assistant
