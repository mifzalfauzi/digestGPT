import React, { useState } from 'react'
import axios from 'axios'
import ModernSidebar from './components/ModernSidebar'
import ModernUploadInterface from './components/ModernUploadInterface'
import ModernChatPanel from './components/ModernChatPanel'
import EnhancedDocumentViewer from './components/EnhancedDocumentViewer'
import { ThemeProvider } from './components/ThemeProvider'
import { Button } from './components/ui/button'
import { Menu, X, MessageCircle, FileText, Eye, Upload, GripVertical } from 'lucide-react'

function App() {
  const [file, setFile] = useState(null)
  const [textInput, setTextInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [inputMode, setInputMode] = useState('file') // 'file' or 'text'
  const [documentId, setDocumentId] = useState(null)
  const [currentView, setCurrentView] = useState('upload') // 'upload' or 'workspace'
  const [chatSetInputMessage, setChatSetInputMessage] = useState(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [bypassAPI, setBypassAPI] = useState(false)
  
  // Responsive state
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activePanel, setActivePanel] = useState('chat') // 'chat' or 'document' for mobile

  // Resizable panel state
  const [rightPanelWidth, setRightPanelWidth] = useState(40) // percentage
  const [isResizing, setIsResizing] = useState(false)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      // Check file type
      if (!selectedFile.name.toLowerCase().endsWith('.pdf') && !selectedFile.name.toLowerCase().endsWith('.docx')) {
        setError('Please select a PDF or DOCX file')
        return
      }
      // Check file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File too large. Maximum size is 10MB')
        return
      }
      setFile(selectedFile)
      setError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResults(null)

    try {
      let response
      
      if (inputMode === 'file') {
        if (!file) {
          setError('Please select a file')
          setLoading(false)
          return
        }
        
        const formData = new FormData()
        formData.append('file', file)
        
        response = await axios.post('http://localhost:8000/analyze-file', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      } else {
        if (!textInput.trim()) {
          setError('Please enter some text')
          setLoading(false)
          return
        }
        
        const formData = new FormData()
        formData.append('text', textInput)
        
        response = await axios.post('http://localhost:8000/analyze-text', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      }
      
      console.log('API Response:', response.data) // Debug log
      setResults(response.data)
      setDocumentId(response.data.document_id)
      setCurrentView('workspace')
      setSidebarOpen(false) // Close sidebar on mobile when workspace opens
      setActivePanel('chat') // Default to chat panel on mobile
    } catch (err) {
      console.error('Error:', err)
      if (err.response?.data?.detail) {
        setError(err.response.data.detail)
      } else {
        setError('An error occurred while processing your request')
      }
    } finally {
      setLoading(false)
    }
  }

  const resetToHome = () => {
    setFile(null)
    setTextInput('')
    setResults(null)
    setError('')
    setDocumentId(null)
    setCurrentView('upload')
    setSidebarOpen(false)
    setIsDemoMode(false)
    setBypassAPI(false)
    // Reset file input
    const fileInput = document.getElementById('file-input')
    if (fileInput) fileInput.value = ''
  }

  const handleNewDocument = () => {
    resetToHome()
  }

  const handleExplainConcept = (conceptTerm) => {
    if (chatSetInputMessage) {
      const message = `Explain the following concept in detail: ${conceptTerm}`
      chatSetInputMessage(message)
      // Switch to chat panel on mobile
      setActivePanel('chat')
    }
  }

  // Demo mode function
  const startDemoMode = () => {
    setIsDemoMode(true)
    setDocumentId('demo-document-id')
    setCurrentView('workspace')
    setSidebarOpen(false)
    setActivePanel('chat')
    
    // Mock results data for document viewer
    setResults({
      filename: "Sample Business Plan.pdf",
      document_id: "demo-document-id",
      executive_summary: {
        main_points: [
          "Strategic expansion into emerging markets with projected 40% revenue growth",
          "Development of innovative AI-powered product suite launching Q3 2024",
          "Establishment of three new regional offices and 150+ new hires",
          "Implementation of sustainable business practices reducing carbon footprint by 60%"
        ],
        key_findings: [
          "Market analysis reveals untapped opportunities in Southeast Asia",
          "Customer acquisition costs decreased by 25% through improved digital marketing",
          "Operational efficiency gains of 30% through automation initiatives",
          "Strong competitive advantage in AI technology and customer service"
        ],
        concerns: [
          "Potential supply chain disruptions affecting Q2 delivery timelines",
          "Regulatory changes in target markets may impact expansion strategy", 
          "Increased competition from well-funded startups in core markets",
          "Talent acquisition challenges in specialized technical roles"
        ]
      },
      key_concepts: [
        {
          term: "Market Penetration Strategy",
          definition: "A comprehensive approach to entering new geographical markets through strategic partnerships and localized product offerings",
          importance: "Critical for achieving projected 40% revenue growth and establishing global presence"
        },
        {
          term: "AI-Powered Analytics",
          definition: "Advanced machine learning algorithms that provide real-time business insights and predictive modeling capabilities",
          importance: "Core differentiator that enables data-driven decision making and competitive advantage"
        },
        {
          term: "Sustainable Operations",
          definition: "Business practices focused on environmental responsibility and long-term resource efficiency",
          importance: "Essential for regulatory compliance and meeting ESG investment criteria"
        }
      ],
      analysis: {
        strengths: [
          "Strong financial position with 18 months runway",
          "Experienced leadership team with proven track record",
          "Innovative technology stack with proprietary AI capabilities",
          "Growing customer base with 95% retention rate"
        ],
        opportunities: [
          "Emerging markets showing 200% YoY growth potential",
          "Strategic partnerships with Fortune 500 companies",
          "Government incentives for sustainable technology adoption",
          "Increasing demand for AI-powered business solutions"
        ],
        threats: [
          "Economic uncertainty affecting enterprise spending",
          "Rapid technological changes requiring continuous innovation",
          "Talent war for AI and machine learning specialists",
          "Potential regulatory restrictions on AI applications"
        ]
      }
    })
  }

  // Load real interface without API calls
  const loadRealInterfaceWithoutAPI = () => {
    setBypassAPI(true)
    setDocumentId('real-document-id')
    setCurrentView('workspace')
    setSidebarOpen(false)
    setActivePanel('chat')
    
    // Mock results data that looks like real API response
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
        summary: "This business plan presents a comprehensive strategy for Q1 2024 focusing on AI-powered market expansion with strong financial fundamentals and risk management. The document outlines ambitious yet achievable growth targets supported by detailed market analysis and operational planning.",
        key_points: [
          {
            text: "Strategic expansion into emerging markets with projected 40% revenue growth through AI-powered solutions",
            quote: "projected revenue increases of 40% year-over-year"
          },
          {
            text: "Technology platform launch scheduled for Q3 2024 providing competitive differentiation",
            quote: "Development of our next-generation AI analytics platform is scheduled for Q3 2024 launch"
          },
          {
            text: "Strong financial position with 18-month runway and improved efficiency metrics",
            quote: "18-month operational runway with current burn rate"
          },
          {
            text: "Customer retention excellence with 95% retention rate demonstrating product-market fit",
            quote: "Customer retention rate maintaining at 95%"
          }
        ],
        risk_flags: [
          {
            text: "🚩 Supply chain vulnerabilities could impact Q2 delivery timelines",
            quote: "Potential disruptions in Q2 delivery schedules"
          },
          {
            text: "🚩 Regulatory changes in target markets may affect expansion strategy",
            quote: "Evolving regulations in target markets may impact our expansion timeline"
          },
          {
            text: "🚩 Talent acquisition challenges in competitive AI/ML market",
            quote: "competitive landscape for AI and machine learning specialists"
          }
        ],
        key_concepts: [
          {
            term: "Market Penetration Strategy",
            explanation: "A systematic approach to entering new geographical markets through strategic partnerships, localized product offerings, and targeted customer acquisition initiatives"
          },
          {
            term: "AI-Powered Analytics Platform", 
            explanation: "Advanced machine learning algorithms that provide real-time business insights, predictive modeling, and data-driven decision making capabilities for enterprise clients"
          },
          {
            term: "ESG Compliance Framework",
            explanation: "Environmental, Social, and Governance practices that ensure regulatory compliance while meeting institutional investor criteria and sustainable business operations"
          }
        ]
      },
      analyzed_at: new Date().toISOString()
    })
  }

  // Handle mouse down on resize handle
  const handleMouseDown = (e) => {
    e.preventDefault()
    setIsResizing(true)
    
    const handleMouseMove = (e) => {
      const container = e.currentTarget.parentElement || document.querySelector('.workspace-container')
      if (!container) return
      
      const containerRect = container.getBoundingClientRect()
      const containerWidth = containerRect.width
      const mouseX = e.clientX - containerRect.left
      
      // Calculate percentage (minimum 20%, maximum 80%)
      const percentage = Math.min(Math.max((containerWidth - mouseX) / containerWidth * 100, 30), 70)
      setRightPanelWidth(percentage)
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  return (
    <ThemeProvider>
      <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
        
        {currentView === 'upload' ? (
          /* ===== UPLOAD VIEW ===== */
          <div className="h-full flex">
            {/* Fixed Sidebar for Desktop */}
            <div className="hidden lg:block fixed left-0 top-0 h-full w-64 z-30">
              <ModernSidebar 
                onNewDocument={handleNewDocument}
                onHome={resetToHome}
                currentDocument={null}
                isDemoMode={isDemoMode}
                bypassAPI={bypassAPI}
              />
            </div>
            
            {/* Main Upload Content */}
            <div className="flex-1 lg:ml-64 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative min-h-full overflow-y-auto">
              {/* Background Elements */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-purple-100/20 to-pink-100/20 dark:from-blue-900/10 dark:via-purple-900/10 dark:to-pink-900/10"></div>
              <div className="absolute top-1/4 left-1/4 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-blue-200/30 dark:bg-blue-800/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-1/4 right-1/4 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-purple-200/30 dark:bg-purple-800/20 rounded-full blur-3xl"></div>
              
              {/* Mobile Menu Button */}
              <div className="lg:hidden fixed top-4 left-4 z-40">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="relative z-10 w-full max-w-2xl">
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
                
                {/* Interface Preview Buttons */}
                <div className="flex flex-col items-center gap-4 mt-8">
                  <Button
                    onClick={loadRealInterfaceWithoutAPI}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 px-8 py-3 text-base font-medium"
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    View Real Interface (No API)
                  </Button>
                  
                  <Button
                    onClick={startDemoMode}
                    variant="outline"
                    className="bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 border-2 border-blue-200 hover:border-blue-300 dark:border-blue-700 dark:hover:border-blue-600 text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 px-6 py-3 text-base font-medium"
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    View Demo Interface
                  </Button>
                </div>
                
                <div className="text-center mt-4 space-y-2">
                  <p className="text-sm text-slate-600 dark:text-gray-400">
                    <strong>Real Interface:</strong> Actual UI with mock data, no API quota used
                  </p>
                  <p className="text-sm text-slate-500 dark:text-gray-500">
                    <strong>Demo Interface:</strong> Showcase version with demo styling and labels
                  </p>
                </div>
              </div>
            </div>
            
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
              <>
                <div 
                  className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
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
                  />
                </div>
              </>
            )}
          </div>
        ) : (
          /* ===== WORKSPACE VIEW ===== */
          <>
            {/* Fixed Sidebar for Desktop */}
            <div className="hidden lg:block fixed left-0 top-0 h-full w-64 z-30">
              <ModernSidebar 
                onNewDocument={handleNewDocument}
                onHome={resetToHome}
                currentDocument={results?.filename || "Demo Document"}
                isDemoMode={isDemoMode}
                bypassAPI={bypassAPI}
              />
            </div>

            {/* Mobile Header - Fixed at top */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
                
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  DocuChat 
                  {isDemoMode && <span className="text-sm text-orange-500 ml-1">(Demo)</span>}
                  {bypassAPI && !isDemoMode && <span className="text-sm text-green-600 ml-1">(Preview)</span>}
                </h1>
                
                {/* Mobile Panel Switcher */}
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <Button 
                    variant={activePanel === 'chat' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActivePanel('chat')}
                    className="px-3 py-1.5 text-xs font-medium h-auto"
                  >
                    <MessageCircle className="h-3.5 w-3.5 mr-1" />
                    Chat
                  </Button>
                  <Button
                    variant={activePanel === 'document' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActivePanel('document')}
                    className="px-3 py-1.5 text-xs font-medium h-auto"
                  >
                    <FileText className="h-3.5 w-3.5 mr-1" />
                    Doc
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Content Area - Properly positioned with resizable panels */}
            <div className="lg:ml-64 pt-16 lg:pt-0 h-full flex workspace-container">
              {/* Chat Panel */}
              <div 
                className={`
                  h-full
                  ${activePanel === 'chat' ? 'block' : 'hidden lg:block'}
                `}
                style={{ 
                  width: `${100 - rightPanelWidth}%`,
                  minWidth: '20%'
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
                  <div className="h-full flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
                    <div className="text-center space-y-4 max-w-md">
                      <div className="p-4 bg-blue-100 dark:bg-blue-900/40 rounded-full w-fit mx-auto">
                        <svg className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-semibold text-slate-700 dark:text-gray-300">Processing Document</p>
                        <p className="text-sm text-slate-500 dark:text-gray-400">AI analysis in progress...</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Resize Handle - Desktop only */}
              <div className="hidden lg:block relative">
                <div 
                  className={`
                    w-1 h-full bg-slate-200 dark:bg-gray-700 hover:bg-blue-400 dark:hover:bg-blue-500 
                    cursor-col-resize transition-colors duration-200 relative group
                    ${isResizing ? 'bg-blue-500 dark:bg-blue-400' : ''}
                  `}
                  onMouseDown={handleMouseDown}
                >
                  {/* Visible handle indicator */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                               bg-slate-400 dark:bg-gray-500 group-hover:bg-blue-500 dark:group-hover:bg-blue-400 
                               rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <GripVertical className="h-4 w-4 text-white" />
                  </div>
                  
                  {/* Extended hover area */}
                  <div className="absolute inset-y-0 -left-2 -right-2 cursor-col-resize" />
                </div>
              </div>

              {/* Document Viewer Panel */}
              <div 
                className={`
                  h-full border-l border-slate-200 dark:border-gray-700
                  ${activePanel === 'document' ? 'block' : 'hidden lg:block'}
                `}
                style={{ 
                  width: `${rightPanelWidth}%`,
                  minWidth: '20%'
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
            
            {/* Mobile Sidebar */}
            {sidebarOpen && (
              <>
                <div 
                  className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
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
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </ThemeProvider>
  )
}

export default App 