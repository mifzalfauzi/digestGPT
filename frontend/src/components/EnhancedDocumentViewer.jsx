import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Separator } from './ui/separator'
import { Eye, FileText, Brain, TrendingUp, Clock, Lightbulb, Sparkles, Target, AlertTriangle, CheckCircle2, BookOpen, Key, ArrowBigDown, Download, Copy, ThumbsUp, ThumbsDown, Info, Menu, ExternalLink } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import ProfessionalAnalysisDisplay from './ProfessionalAnalysisDisplay'
import KeyConceptsDisplay from './KeyConceptsDisplay'
import HighlightableText from './HighlightableText'
import MarkdownRenderer from './MarkdownRenderer'
import DocxViewer from './DocxViewer'
import mammoth from 'mammoth'
import SWOTAnalysis from './SWOTAnalysis'
import Recommendations from './Recommendations'
import { MessageCircle } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import axios from 'axios' // Added axios import
function EnhancedDocumentViewer({ results, file, inputMode, onExplainConcept, isDemoMode = false, bypassAPI = false }) {
  console.log('results', results)

  const [activeHighlight, setActiveHighlight] = useState(null)

  const [highlights, setHighlights] = useState([])
  const [activeTab, setActiveTab] = useState('analysis')
  const [tabChangeKey, setTabChangeKey] = useState(0)
  const [docxContent, setDocxContent] = useState(null)
  const [docxLoading, setDocxLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [highlightClickData, setHighlightClickData] = useState({
    forceListMode: false,
    forceCardMode: null,
    selectedItemIndex: null
  })
  const menuRef = useRef(null)
  const BASE_URL = import.meta.env.VITE_API_BASE_URL
  // Tab state storage for persistence
  const tabStateRef = useRef({})
  const tabContentRefs = useRef({})
  const isInitialRenderRef = useRef(true)

  // Get docId from URL params as fallback
  const [searchParams] = useSearchParams()
  const urlDocId = searchParams.get('docId')

  console.log('urlDocId', results?.document_id)

  // Overview subtab state management - similar to Recommendations.jsx
  const getOverviewSubtabStorageKey = useCallback((currentDocId) => {
    return currentDocId ? `enhancedDocViewer_overviewSubtab_${currentDocId}` : null
  }, [])

  const loadOverviewSubtabFromStorage = useCallback((currentDocId) => {
    const key = getOverviewSubtabStorageKey(currentDocId)
    if (!key) return 'executive-summary'

    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        const data = JSON.parse(stored)
        if (Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000) {
          console.log(`Loaded overview subtab for document ${currentDocId}:`, data.subtab)
          return data.subtab
        } else {
          localStorage.removeItem(key)
          console.log(`Expired overview subtab data removed for document ${currentDocId}`)
        }
      }
    } catch (error) {
      console.error('Error loading overview subtab from storage:', error)
    }
    return 'executive-summary'
  }, [getOverviewSubtabStorageKey])

  const saveOverviewSubtabToStorage = useCallback((subtab, currentDocId) => {
    const key = getOverviewSubtabStorageKey(currentDocId)
    if (!key) return

    try {
      localStorage.setItem(key, JSON.stringify({
        subtab,
        timestamp: Date.now()
      }))
      console.log(`Saved overview subtab for document ${currentDocId}:`, subtab)
    } catch (error) {
      console.error('Error saving overview subtab to storage:', error)
    }
  }, [getOverviewSubtabStorageKey])

  // Generate document key for activeTab storage with multiple fallbacks  
  const generateDocumentKey = useCallback(() => {
    // Try multiple identifiers in order of preference - prioritize document_id for consistency
    const identifier = results?.document_id || 
                      results?.id || 
                      results?.filename || 
                      file?.name || 
                      window.location.pathname || 
                      'default'
    return `enhancedDocViewer_activeTab_${identifier}`
  }, [results?.document_id, results?.id, results?.filename, file?.name])

  // Get current document identifier for consistency checks
  const getCurrentDocumentId = useCallback(() => {
    return results?.document_id || results?.id || results?.filename || file?.name || window.location.pathname || 'default'
  }, [results?.document_id, results?.id, results?.filename, file?.name])

  // Get docId for subtab persistence
  const docId = getCurrentDocumentId() || urlDocId

  // Initialize overview subtab state with localStorage value for current docId
  const [overviewActiveSubtab, setOverviewActiveSubtab] = useState(() => loadOverviewSubtabFromStorage(docId))

  // Clean up old activeTab entries from localStorage
  const cleanupOldActiveTabEntries = useCallback(() => {
    try {
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
      const keysToRemove = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('enhancedDocViewer_activeTab_')) {
          try {
            const stored = localStorage.getItem(key)
            if (stored) {
              const parsed = JSON.parse(stored)
              if (parsed.timestamp && parsed.timestamp < sevenDaysAgo) {
                keysToRemove.push(key)
              }
            }
          } catch (e) {
            // Remove invalid entries
            keysToRemove.push(key)
          }
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        console.log(`🧹 Cleaned up old activeTab entry: ${key}`)
      })
    } catch (error) {
      console.warn('Failed to cleanup old activeTab entries:', error)
    }
  }, [])

  // Save activeTab to localStorage
  const saveActiveTabToStorage = useCallback((tabValue) => {
    try {
      const documentKey = generateDocumentKey()
      const tabData = { activeTab: tabValue, timestamp: Date.now() }
      localStorage.setItem(documentKey, JSON.stringify(tabData))
      console.log(`💾 Saved activeTab "${tabValue}" for ${documentKey}`)
      
      // Clean up old activeTab entries (older than 7 days)
      cleanupOldActiveTabEntries()
    } catch (error) {
      console.warn('Failed to save activeTab to localStorage:', error)
    }
  }, [generateDocumentKey, cleanupOldActiveTabEntries])

  // Find the actual scrollable element within a tab container
  const findScrollableElement = useCallback((tabElement) => {
    if (!tabElement) return null

    // Check if the tab element itself is scrollable
    const computedStyle = window.getComputedStyle(tabElement)
    const hasOverflowY = computedStyle.overflowY
    const hasOverflow = computedStyle.overflow

    if (hasOverflowY === 'auto' || hasOverflowY === 'scroll' || hasOverflow === 'auto' || hasOverflow === 'scroll') {
      return tabElement
    }

    // For SWOT and other tabs, also check for elements with overflow classes in CSS
    const scrollableSelectors = [
      '[style*="overflow-y: auto"]',
      '[style*="overflow: auto"]',
      '.overflow-y-auto',
      '.overflow-auto',
      // Additional selectors for nested components
      '[class*="overflow-y-auto"]',
      '[class*="overflow-auto"]'
    ]

    for (const selector of scrollableSelectors) {
      const scrollableChild = tabElement.querySelector(selector)
      if (scrollableChild) {
        const childStyle = window.getComputedStyle(scrollableChild)
        if (childStyle.overflowY === 'auto' || childStyle.overflowY === 'scroll' ||
          childStyle.overflow === 'auto' || childStyle.overflow === 'scroll') {
          return scrollableChild
        }
      }
    }

    return tabElement
  }, [])

  // Save current tab state with enhanced position tracking
  const saveCurrentTabState = useCallback(() => {
    if (!activeTab || !tabContentRefs.current[activeTab]) return

    const tabElement = tabContentRefs.current[activeTab]
    const scrollableElement = findScrollableElement(tabElement)

    const scrollPosition = scrollableElement ? scrollableElement.scrollTop : 0
    const scrollHeight = scrollableElement ? scrollableElement.scrollHeight : 0
    const clientHeight = scrollableElement ? scrollableElement.clientHeight : 0

    const scrollData = {
      scrollPosition,
      scrollHeight,
      clientHeight,
      scrollPercentage: scrollHeight > clientHeight ? (scrollPosition / (scrollHeight - clientHeight)) * 100 : 0,
      timestamp: Date.now()
    }

    // Save to both ref and localStorage for persistence
    tabStateRef.current[activeTab] = scrollData

    try {
      const storageKey = `enhancedDocViewer_${activeTab}_scroll`
      localStorage.setItem(storageKey, JSON.stringify(scrollData))
    } catch (e) {
      console.warn('Failed to save scroll position to localStorage:', e)
    }

    // Debug logging for SWOT tab
    if (activeTab === 'swot' && scrollPosition > 0) {
      console.log(`SWOT scroll saved:`, {
        tab: activeTab,
        scrollPosition,
        scrollHeight,
        clientHeight,
        scrollPercentage: scrollData.scrollPercentage,
        savedToStorage: true
      })
    }
  }, [activeTab, findScrollableElement])

  // Restore tab state with improved positioning
  const restoreTabState = useCallback((tabId) => {
    let savedState = tabStateRef.current[tabId]

    // If no saved state in ref, try localStorage
    if (!savedState || (!savedState.scrollPosition && !savedState.scrollPercentage)) {
      try {
        const storageKey = `enhancedDocViewer_${tabId}_scroll`
        const storedData = localStorage.getItem(storageKey)
        if (storedData) {
          savedState = JSON.parse(storedData)
          // Update ref with localStorage data
          tabStateRef.current[tabId] = savedState

          if (tabId === 'swot') {
            console.log(`SWOT restored from localStorage:`, savedState)
          }
        }
      } catch (e) {
        console.warn('Failed to load scroll position from localStorage:', e)
      }
    }

    if (!savedState) return

    // Only restore if we have recent state (within last 10 minutes)
    if (Date.now() - savedState.timestamp < 600000) {
      // Use multiple restoration attempts for better reliability
      const restorePosition = (attempt = 0) => {
        if (attempt > 4) return // Increased attempts for SWOT tab

        // Longer delays for SWOT tab to allow content loading
        const baseDelay = tabId === 'swot' ? 200 : 100
        const attemptDelay = tabId === 'swot' ? 150 : 100

        setTimeout(() => {
          const tabElement = tabContentRefs.current[tabId]
          if (!tabElement) {
            restorePosition(attempt + 1)
            return
          }

          const scrollableElement = findScrollableElement(tabElement)
          if (!scrollableElement) {
            restorePosition(attempt + 1)
            return
          }

          // Additional check for SWOT tab - ensure content is loaded
          if (tabId === 'swot') {
            const hasContent = scrollableElement.scrollHeight > scrollableElement.clientHeight
            if (!hasContent && attempt < 3) {
              restorePosition(attempt + 1)
              return
            }
          }

          // Use both percentage and absolute position for restoration
          let restoredSuccessfully = false

          if (savedState.scrollPercentage >= 0) {
            const maxScroll = scrollableElement.scrollHeight - scrollableElement.clientHeight
            const targetScroll = Math.max(0, Math.min((savedState.scrollPercentage / 100) * maxScroll, maxScroll))
            scrollableElement.scrollTop = targetScroll

            // Verify the restoration worked
            const actualScroll = scrollableElement.scrollTop
            restoredSuccessfully = Math.abs(actualScroll - targetScroll) < 5

            // Debug logging for SWOT tab
            if (tabId === 'swot') {
              console.log(`SWOT scroll restore - attempt ${attempt + 1}:`, {
                savedPercentage: savedState.scrollPercentage,
                savedAbsolutePosition: savedState.scrollPosition,
                currentScrollHeight: scrollableElement.scrollHeight,
                clientHeight: scrollableElement.clientHeight,
                maxScroll,
                targetScroll,
                actualScroll,
                restoredSuccessfully
              })
            }
          }

          // Fallback to absolute position if percentage restoration didn't work
          if (!restoredSuccessfully && savedState.scrollPosition !== undefined) {
            scrollableElement.scrollTop = Math.min(savedState.scrollPosition, scrollableElement.scrollHeight - scrollableElement.clientHeight)

            if (tabId === 'swot') {
              console.log(`SWOT scroll restore - fallback to absolute position:`, {
                targetPosition: savedState.scrollPosition,
                actualPosition: scrollableElement.scrollTop
              })
            }
          }
        }, baseDelay + (attempt * attemptDelay))
      }

      restorePosition()
    }
  }, [findScrollableElement])

  // Handle tab change with persistence and ProfessionalAnalysisDisplay sync
  const handleTabChange = useCallback((newTab) => {
    // Debug logging for SWOT
    if (activeTab === 'swot' || newTab === 'swot') {
      console.log(`Tab change: ${activeTab} -> ${newTab}`, {
        currentSavedState: tabStateRef.current[activeTab],
        allSavedStates: { ...tabStateRef.current }
      })
    }

    // Save current state before switching
    saveCurrentTabState()

    // Debug after save
    if (activeTab === 'swot') {
      console.log(`After saving ${activeTab}:`, tabStateRef.current[activeTab])
    }

    setTabChangeKey(prev => prev + 1)
    setActiveTab(newTab)
    
    // Save activeTab immediately to localStorage for cross-component sync
    saveActiveTabToStorage(newTab)

    // Special handling for SWOT tab - longer delays for content loading
    if (newTab === 'swot') {
      setTimeout(() => {
        console.log(`About to restore SWOT, saved state:`, tabStateRef.current['swot'])
        restoreTabState(newTab)
      }, 250)

      // Additional restoration attempts for SWOT
      setTimeout(() => {
        restoreTabState(newTab)
      }, 600)

      setTimeout(() => {
        restoreTabState(newTab)
      }, 1000)
    } else {
      // Standard restoration for other tabs
      setTimeout(() => {
        restoreTabState(newTab)
      }, 150)

      setTimeout(() => {
        restoreTabState(newTab)
      }, 500)
    }
  }, [activeTab, saveCurrentTabState, restoreTabState, saveActiveTabToStorage])

  // PDF Export functionality
  const exportToPDF = async () => {
    setIsExporting(true)

    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      const contentWidth = pageWidth - (margin * 2)
      let yPosition = 25

      // Color palette for professional styling
      const colors = {
        primary: [37, 99, 235],    // Blue
        success: [34, 197, 94],    // Green
        warning: [245, 158, 11],   // Amber
        danger: [239, 68, 68],     // Red
        text: [31, 41, 55],        // Gray-800
        textLight: [107, 114, 128], // Gray-500
        accent: [139, 92, 246],     // Purple
        white: [255, 255, 255],
        black: [0, 0, 0]
      }

      // Helper functions
      const addTextWithWrap = (text, x, y, maxWidth, lineHeight = 6) => {
        const lines = pdf.splitTextToSize(text, maxWidth)
        pdf.text(lines, x, y)
        return y + (lines.length * lineHeight)
      }

      // Triangle function for jsPDF
      const drawTriangle = (x1, y1, x2, y2, x3, y3, style = 'S') => {
        pdf.lines([[x2 - x1, y2 - y1], [x3 - x2, y3 - y2], [x1 - x3, y1 - y3]], x1, y1, [1, 1], style, true)
      }

      const addSectionDivider = (y, addPageIfNeeded = true) => {
        if (addPageIfNeeded && y > pageHeight - 40) {
          pdf.addPage()
          y = 25
        }
        pdf.setDrawColor(229, 231, 235) // Gray-200
        pdf.setLineWidth(0.5)
        pdf.line(margin, y + 5, pageWidth - margin, y + 5)
        return y + 15
      }

      const addSectionHeader = (title, y, color = colors.primary, icon = null) => {
        if (y > pageHeight - 30) {
          pdf.addPage()
          y = 25
        }

        // Reduced left margin for section headers
        const headerMargin = margin - 5  // 5mm less than main margin

        // Background rectangle for section header
        pdf.setFillColor(color[0], color[1], color[2])
        pdf.setDrawColor(color[0], color[1], color[2])
        pdf.roundedRect(headerMargin, y - 3, contentWidth + 5, 12, 2, 2, 'F')

        // Section title
        pdf.setTextColor(colors.black[0], colors.black[1], colors.black[2])
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text(title, headerMargin + 5, y + 5)
        pdf.setTextColor(colors.black[0], colors.black[1], colors.black[2])

        // Add line underneath section header
        const lineY = y + 12
        pdf.setDrawColor(200, 200, 200) // Light gray line
        pdf.setLineWidth(0.8)
        pdf.line(headerMargin, lineY, headerMargin + contentWidth + 5, lineY)

        return y + 25  // Increased spacing to account for the line
      }

      // HEADER SECTION - Clean and Professional
      // Document filename at top
      pdf.setTextColor(colors.black[0], colors.black[1], colors.black[2])
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      const docName = results?.filename || file?.name || 'Sample Business Plan'
      pdf.text(docName, margin, yPosition)
      yPosition += 15

      // Main title
      pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2])
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      const title = `DOCUMENT ANALYSIS`
      pdf.text(title, margin, yPosition)
      yPosition += 15

      // Metadata
      pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, margin, yPosition)
      yPosition += 6
      pdf.text(`Analyzed by: Elva*`, margin, yPosition)

      if (isDemoMode || bypassAPI) {
        yPosition += 6
        pdf.setTextColor(colors.warning[0], colors.warning[1], colors.warning[2])
        pdf.text(`Mode: ${isDemoMode ? 'Demo' : 'Preview'} - Contains sample data for demonstration`, margin, yPosition)
      }

      yPosition += 20

      // EXECUTIVE SUMMARY SECTION
      yPosition = addSectionHeader('EXECUTIVE SUMMARY', yPosition, colors.white)

      // Summary content box
      pdf.setFillColor(249, 250, 251) // Gray-50
      pdf.setDrawColor(209, 213, 219) // Gray-300
      pdf.roundedRect(margin, yPosition, contentWidth, 0, 2, 2, 'D') // Will adjust height after content

      const summaryText = (isDemoMode || bypassAPI)
        ? 'This comprehensive business plan outlines a strategic expansion initiative with projected 40% revenue growth over 18 months. The AI-powered product development strategy focuses on sustainable operations and market penetration in Southeast Asia, leveraging proprietary technology and strong customer relationships. The analysis reveals strong competitive positioning with innovative AI capabilities, solid financial fundamentals, and a well-defined go-to-market strategy.'
        : results?.analysis?.summary || 'No summary available'

      pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2])
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'normal')
      const summaryEndY = addTextWithWrap(summaryText, margin + 5, yPosition + 8, contentWidth - 10, 5.5)

      // Draw the summary box with proper height
      pdf.setFillColor(249, 250, 251)
      pdf.setDrawColor(209, 213, 219)
      pdf.roundedRect(margin, yPosition, contentWidth, summaryEndY - yPosition + 8, 2, 2, 'FD')

      // Re-add the text (it gets covered by the rectangle)
      pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2])
      addTextWithWrap(summaryText, margin + 5, yPosition + 8, contentWidth - 10, 5.5)

      yPosition = summaryEndY + 20

      // KEY CONCEPTS SECTION
      yPosition = addSectionHeader('KEY CONCEPTS', yPosition, colors.white)

      const keyConcepts = (isDemoMode || bypassAPI) ? [
        {
          term: 'AI-Powered Analytics',
          description: 'Advanced artificial intelligence system providing real-time business insights and predictive modeling capabilities for data-driven decision making.'
        },
        {
          term: 'Market Penetration Strategy',
          description: 'Systematic approach to entering Southeast Asian markets with focus on competitive positioning and customer acquisition.'
        },
        {
          term: 'ESG Compliance',
          description: 'Environmental, Social, and Governance framework ensuring sustainable business practices and regulatory adherence.'
        },
        {
          term: 'Strategic Partnerships',
          description: 'Collaborative relationships with Fortune 500 companies to accelerate market entry and reduce competitive pressure.'
        }
      ] : results?.analysis?.key_concepts || []

      if (keyConcepts && keyConcepts.length > 0) {
        keyConcepts.forEach((concept, index) => {
          if (yPosition > pageHeight - 40) {
            pdf.addPage()
            yPosition = 25
          }

          // Concept term
          pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2])
          pdf.setFontSize(12)
          pdf.setFont('helvetica', 'bold')
          const termText = typeof concept === 'string' ? concept : concept.term || concept.name || `Concept ${index + 1}`
          pdf.text(`${index + 1}. ${termText}`, margin, yPosition)
          yPosition += 8

          // Concept description
          pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2])
          pdf.setFontSize(10)
          pdf.setFont('helvetica', 'normal')
          const descText = typeof concept === 'string' ? 'Key business concept identified in analysis' : concept.definition || concept.explanation || concept.description || 'Description not available'
          yPosition = addTextWithWrap(descText, margin + 5, yPosition, contentWidth - 5, 5)
          yPosition += 10
        })
        yPosition += 10
      }

      // Check if we need a new page for SWOT
      if (yPosition > pageHeight - 60) {
        pdf.addPage()
        yPosition = 25
      }

      // SWOT ANALYSIS SECTION
      yPosition = addSectionHeader('SWOT ANALYSIS', yPosition, colors.white)

      const swotData = (isDemoMode || bypassAPI) ? {
        strengths: [
          'Strong AI technology capabilities and proprietary algorithms',
          'Experienced leadership team with proven track record',
          'Established customer base with 95% retention rate',
          'Solid financial position with 18-month runway'
        ],
        weaknesses: [
          'Limited presence in target Southeast Asian markets',
          'Dependency on key technical personnel',
          'High customer acquisition costs in new markets'
        ],
        opportunities: [
          'Rapidly growing AI market with 200% YoY growth potential',
          'Untapped Southeast Asian markets',
          'Strategic partnerships with Fortune 500 companies',
          'ESG compliance creating competitive advantage'
        ],
        threats: [
          'Supply chain vulnerabilities affecting Q2 delivery',
          'Regulatory uncertainties in target markets',
          'Intense competition for AI/ML talent',
          'Economic uncertainties affecting investment'
        ]
      } : results?.analysis?.swot_analysis || results?.swot_analysis || {
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: []
      }

      // SWOT Matrix Layout (2x2 grid)
      const swotSections = [
        { title: 'STRENGTHS', items: swotData.strengths, color: colors.success, bgColor: [240, 253, 244] },
        { title: 'WEAKNESSES', items: swotData.weaknesses, color: colors.danger, bgColor: [254, 242, 242] },
        { title: 'OPPORTUNITIES', items: swotData.opportunities, color: colors.primary, bgColor: [239, 246, 255] },
        { title: 'THREATS', items: swotData.threats, color: colors.warning, bgColor: [255, 251, 235] }
      ]

      // SWOT sections with proper text wrapping (no truncation)
      swotSections.forEach(section => {
        if (yPosition > pageHeight - 40) {
          pdf.addPage()
          yPosition = 25
        }

        // Section header
        pdf.setFillColor(section.color[0], section.color[1], section.color[2])
        pdf.setDrawColor(section.color[0], section.color[1], section.color[2])
        pdf.roundedRect(margin, yPosition - 3, contentWidth, 12, 2, 2, 'F')

        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        pdf.text(section.title, margin + 5, yPosition + 5)

        yPosition += 15

        // Section content with proper wrapping
        pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2])
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')

        if (section.items && section.items.length > 0) {
          section.items.forEach(item => {
            if (yPosition > pageHeight - 20) {
              pdf.addPage()
              yPosition = 25
            }
            const itemText = typeof item === 'string' ? item : item.text || item.description || String(item)
            yPosition = addTextWithWrap(`• ${itemText}`, margin + 5, yPosition, contentWidth - 10, 5)
            yPosition += 3
          })
        } else {
          pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])
          yPosition = addTextWithWrap('• No items identified', margin + 5, yPosition, contentWidth - 10, 5)
        }
        yPosition += 10
      })

      // Check if we need a new page for Analysis section
      if (yPosition > pageHeight - 60) {
        pdf.addPage()
        yPosition = 25
      }

      // KEY INSIGHTS & ANALYSIS SECTION
      yPosition = addSectionHeader('KEY INSIGHTS & ANALYSIS', yPosition, colors.white)

      // Key Points Subsection
      const keyPoints = (isDemoMode || bypassAPI) ? [
        'Market penetration strategy targets 200% YoY growth in Southeast Asia',
        'AI-powered analytics platform provides competitive differentiation',
        'Strong financial position with 18-month operational runway',
        'Customer retention rate of 95% demonstrates product-market fit',
        'ESG compliance initiative reduces carbon footprint by 60%',
        'Strategic partnerships with Fortune 500 companies accelerate growth',
        'Q3 2024 product launch timeline aligns with market demand',
        'Operational efficiency improved by 30% through automation'
      ] : results?.analysis?.key_points || []

      if (keyPoints && keyPoints.length > 0) {
        // Key Points header
        pdf.setFillColor(240, 253, 244) // Green-50
        pdf.setDrawColor(34, 197, 94) // Green-500
        pdf.roundedRect(margin, yPosition, contentWidth, 10, 2, 2, 'FD')

        pdf.setTextColor(34, 197, 94)
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Strategic Insights', margin + 5, yPosition + 7)

        yPosition += 18

        // Key points with enhanced formatting
        keyPoints.forEach((point, index) => {
          if (yPosition > pageHeight - 25) {
            pdf.addPage()
            yPosition = 25
          }

          // Point number circle
          pdf.setFillColor(34, 197, 94)
          pdf.circle(margin + 8, yPosition - 2, 3, 'F')

          pdf.setTextColor(255, 255, 255)
          pdf.setFontSize(8)
          pdf.setFont('helvetica', 'bold')
          const numberText = (index + 1).toString()
          const textWidth = pdf.getTextWidth(numberText)
          const circleX = margin + 8
          const circleY = yPosition - 2
          const centeredX = circleX - (textWidth / 2)
          const centeredY = circleY + 1  // Adjust this value to center vertically
          pdf.text(numberText, centeredX, centeredY)
          // Point text
          pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2])
          pdf.setFontSize(10)
          pdf.setFont('helvetica', 'normal')
          const pointText = typeof point === 'string' ? point : point.text || point.description || String(point)
          yPosition = addTextWithWrap(pointText, margin + 15, yPosition, contentWidth - 25, 5)
          yPosition += 8
        })
        yPosition += 10
      }

      // Risk Flags Subsection
      const riskFlags = (isDemoMode || bypassAPI) ? [
        'Supply chain vulnerabilities may impact Q2 delivery timelines',
        'Regulatory uncertainties in target markets require monitoring',
        'High competition for AI/ML talent may affect hiring goals',
        'Economic uncertainties could impact customer spending patterns'
      ] : results?.analysis?.risk_flags || []

      if (riskFlags && riskFlags.length > 0) {
        if (yPosition > pageHeight - 40) {
          pdf.addPage()
          yPosition = 25
        }

        // Risk Flags header
        pdf.setFillColor(254, 242, 242) // Red-50
        pdf.setDrawColor(239, 68, 68) // Red-500
        pdf.roundedRect(margin, yPosition, contentWidth, 10, 2, 2, 'FD')

        pdf.setTextColor(239, 68, 68)
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Risk Assessment', margin + 5, yPosition + 7)

        yPosition += 18

        // Risk flags with enhanced formatting
        riskFlags.forEach((risk, index) => {
          if (yPosition > pageHeight - 25) {
            pdf.addPage()
            yPosition = 25
          }

          // Point number circle
          pdf.setFillColor(239, 68, 68)
          pdf.circle(margin + 8, yPosition - 2, 3, 'F')

          pdf.setTextColor(255, 255, 255)
          pdf.setFontSize(8)
          pdf.setFont('helvetica', 'bold')
          const numberText = (index + 1).toString()
          const textWidth = pdf.getTextWidth(numberText)
          const circleX = margin + 8
          const circleY = yPosition - 2
          const centeredX = circleX - (textWidth / 2)
          const centeredY = circleY + 1  // Adjust this value to center vertically
          pdf.text(numberText, centeredX, centeredY)
          // Point text
          pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2])
          pdf.setFontSize(10)
          pdf.setFont('helvetica', 'normal')
          const riskText = typeof risk === 'string' ? risk : risk.text || risk.description || String(risk)
          yPosition = addTextWithWrap(riskText, margin + 15, yPosition, contentWidth - 25, 5)
          yPosition += 8
        })
        yPosition += 10
      }

      // Enhanced Footer for all pages
      const pageCount = pdf.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i)

        // Footer background
        pdf.setFillColor(248, 250, 252) // Gray-50
        pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F')

        // Footer divider line
        pdf.setDrawColor(209, 213, 219) // Gray-300
        pdf.setLineWidth(0.5)
        pdf.line(0, pageHeight - 15, pageWidth, pageHeight - 15)

        // Footer content
        pdf.setTextColor(107, 114, 128) // Gray-500
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')

        // Left side - Company info
        pdf.text('Generated by Elva*', margin, pageHeight - 8)

        // Center - Document info
        const centerText = `${results?.filename || file?.name || 'Document'} | ${new Date().toLocaleDateString()}`
        const centerX = pageWidth / 2 - (pdf.getTextWidth(centerText) / 2)
        pdf.text(centerText, centerX, pageHeight - 8)

        // Right side - Page info
        const pageText = `Page ${i} of ${pageCount}`
        pdf.text(pageText, pageWidth - margin - pdf.getTextWidth(pageText), pageHeight - 8)
      }

      // Save the PDF with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      const baseFileName = (results?.filename || file?.name || 'document').replace(/\.[^/.]+$/, '')
      const fileName = `${baseFileName}_analysis_report_${timestamp}.pdf`
      pdf.save(fileName)

    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  // Mock document text for demo mode
  const mockDocumentText = `# Sample Business Plan - Strategic Expansion Initiative

## Executive Summary

Our company is positioned for significant growth through strategic expansion into emerging markets, with projected 40% revenue growth over the next 18 months. This comprehensive business plan outlines our AI-powered product development strategy, sustainable operations framework, and market penetration approach for Southeast Asia.

### Key Strategic Initiatives

**Market Penetration Strategy**: We have identified untapped opportunities in Southeast Asia with 200% year-over-year growth potential. Our research indicates strong demand for AI-powered business solutions in this region, particularly in the financial services and healthcare sectors.

**AI-Powered Analytics Platform**: Development of our innovative AI suite launching Q3 2024 will provide real-time business insights and predictive modeling capabilities. This technology represents our core competitive differentiator and enables data-driven decision making for our clients.

**Sustainable Operations**: Implementation of environmentally responsible business practices will reduce our carbon footprint by 60% while ensuring regulatory compliance and meeting ESG investment criteria.

## Financial Projections

Our financial model demonstrates strong fundamentals with conservative cash flow projections and an 18-month operational runway. Customer acquisition costs have decreased by 25% through improved digital marketing strategies, while operational efficiency has improved by 30% through automation initiatives.

### Revenue Diversification

We project revenue growth across multiple market segments:
- Enterprise AI solutions: 45% of total revenue
- Healthcare analytics: 25% of total revenue  
- Financial services: 20% of total revenue
- Other sectors: 10% of total revenue

## Risk Assessment

**Supply Chain Vulnerabilities**: Potential disruptions affecting Q2 delivery timelines require contingency planning and alternative supplier relationships.

**Regulatory Uncertainties**: Changes in target markets may impact our expansion strategy, necessitating flexible compliance frameworks.

**Talent Acquisition**: The competitive landscape for AI and machine learning specialists presents challenges that may affect our growth timeline.

## Implementation Timeline

**Phase 1 (Q1-Q2 2024)**: Market research completion and strategic partnership establishment
**Phase 2 (Q3 2024)**: AI platform launch and initial market entry
**Phase 3 (Q4 2024)**: Scale operations with 150+ new hires across three regional offices

## Competitive Analysis

Our proprietary AI technology creates significant barriers to entry while our strong customer relationships maintain a 95% retention rate. Strategic partnerships with Fortune 500 companies accelerate our market penetration and reduce competitive pressure.

## Conclusion

This business plan effectively balances growth ambitions with comprehensive risk management. The combination of strong financial positioning, innovative technology, and strategic market opportunities positions us for sustained success in the evolving AI landscape.`

  const getFileUrl = () => {
    if (isDemoMode) {
      // For demo mode, return a placeholder PDF URL
      return "data:application/pdf;base64,JVBERi0xLjMKMSAwIG9iaiAiZGVtbyI="
    }

    if (bypassAPI) {
      // For bypass mode, return another placeholder
      return "data:application/pdf;base64,JVBERi0xLjMKMSAwIG9iaiAiYnlwYXNzIgo="
    }

    // For newly uploaded files with file object
    if (file && file.type === 'application/pdf') {
      return URL.createObjectURL(file)
    }

    // For historical documents with file_url from backend
    if (results?.file_url && results.filename?.toLowerCase().endsWith('.pdf')) {
      // Clean up the URL - remove trailing question mark if present
      const cleanUrl = results.file_url.replace(/\?$/, '')
      console.log('Historical PDF URL:', cleanUrl)
      return cleanUrl
    }

    return null
  }

  const isPDF = (file && file.type === 'application/pdf' && !isDemoMode && !bypassAPI) ||
    (results?.filename?.toLowerCase().endsWith('.pdf') && results?.file_url && !isDemoMode && !bypassAPI)
  const isDOCX = (file && file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' && !isDemoMode && !bypassAPI) ||
    (results?.filename?.endsWith('.docx') && !isDemoMode && !bypassAPI)
  const hasDocumentViewer = isPDF || isDOCX

  // Initialize scroll positions from localStorage on mount
  useEffect(() => {
    const tabs = ['analysis', 'swot', 'insights', 'document', 'recommendations']
    tabs.forEach(tabId => {
      try {
        const storageKey = `enhancedDocViewer_${tabId}_scroll`
        const storedData = localStorage.getItem(storageKey)
        if (storedData) {
          const scrollData = JSON.parse(storedData)
          // Only restore recent data (within 24 hours)
          if (Date.now() - scrollData.timestamp < 86400000) {
            tabStateRef.current[tabId] = scrollData
          }
        }
      } catch (e) {
        console.warn(`Failed to initialize scroll position for ${tabId}:`, e)
      }
    })
  }, [])

  // Track previous document ID to detect document changes
  const previousDocIdRef = useRef()
  
  // Restore activeTab from localStorage when document data becomes available or changes
  useEffect(() => {
    const restoreActiveTab = () => {
      try {
        const documentKey = generateDocumentKey()
        const currentDocId = getCurrentDocumentId()
        
        // Skip if we don't have a proper document identifier yet
        if (currentDocId === 'default' || currentDocId === window.location.pathname) {
          console.log(`⏸️  Skipping activeTab restoration - no proper document identifier yet`)
          return
        }
        
        // Check if this is a document change
        const isDocumentChange = previousDocIdRef.current !== currentDocId
        if (isDocumentChange) {
          console.log(`🔄 Document changed from "${previousDocIdRef.current}" to "${currentDocId}"`)
          previousDocIdRef.current = currentDocId
          // Reset the initial render flag when document changes to ensure restoration works
          isInitialRenderRef.current = false
        }
        
        console.log(`🔍 Attempting to restore activeTab for document: ${currentDocId}`)
        
        const stored = localStorage.getItem(documentKey)
        if (stored) {
          const parsed = JSON.parse(stored)
          // Only restore if the stored data is recent (within 7 days)
          if (parsed.timestamp && Date.now() - parsed.timestamp < (7 * 24 * 60 * 60 * 1000)) {
            const restoredTab = parsed.activeTab || 'analysis'
            console.log(`📂 Restored activeTab "${restoredTab}" from localStorage for ${documentKey}`)
            setActiveTab(restoredTab)
            isInitialRenderRef.current = false // Prevent auto-save from triggering
            
            // If this is the insights tab, check if we need to restore cardMode too
            if (restoredTab === 'insights') {
              console.log(`🎯 Restored insights tab - ProfessionalAnalysisDisplay should sync cardMode`)
            }
          } else {
            console.log('🧹 Stored activeTab is too old, using default (analysis)')
            setActiveTab('analysis')
          }
        } else {
          console.log(`📝 No stored activeTab found for ${documentKey}, using default (analysis)`)
          setActiveTab('analysis')
        }
      } catch (error) {
        console.warn('Failed to restore activeTab from localStorage:', error)
        setActiveTab('analysis') // Fallback to default
      }
    }

    // Only attempt restoration when we have document data
    if (results || file) {
      console.log('🔄 Document data available, attempting activeTab restoration...', {
        hasResults: !!results,
        hasFile: !!file,
        resultsId: results?.id,
        resultsDocumentId: results?.document_id,
        resultsFilename: results?.filename,
        fileName: file?.name
      })
      
      // Add small delay for document switches to allow React state updates to settle
      const currentDocId = getCurrentDocumentId()
      const isDocumentChange = previousDocIdRef.current !== currentDocId
      
      if (isDocumentChange) {
        console.log('📋 Document switch detected - adding delay for state settlement')
        setTimeout(() => {
          restoreActiveTab()
        }, 100)
      } else {
        restoreActiveTab()
      }
    } else {
      console.log('⏳ Waiting for document data before restoring activeTab...')
    }
  }, [results, file, generateDocumentKey, getCurrentDocumentId, results?.document_id, results?.id, results?.filename, file?.name])

  // Set default tab based on document availability (only if no stored preference)
  useEffect(() => {
    // Skip if we don't have proper document data yet
    if (!results && !file) {
      return
    }
    
    // Check if we have a stored activeTab preference for this document
    const documentKey = generateDocumentKey()
    const currentDocId = getCurrentDocumentId()
    
    // Skip if we don't have a proper document identifier yet  
    if (currentDocId === 'default' || currentDocId === window.location.pathname) {
      return
    }
    
    const hasStoredTab = localStorage.getItem(documentKey)
    
    // Only set default if no stored preference and we're still on the initial tab
    if (!hasStoredTab && (activeTab === 'analysis' || activeTab === 'swot')) {
      console.log(`📝 No stored activeTab found for ${documentKey}, keeping default (analysis)`)
      // Don't call setActiveTab here - let the restoration useEffect handle it
    }
  }, [hasDocumentViewer, isDemoMode, bypassAPI, generateDocumentKey, getCurrentDocumentId, results, file])

  // Add scroll event listeners to track scroll position changes
  useEffect(() => {
    if (!activeTab || !tabContentRefs.current[activeTab]) return

    const tabElement = tabContentRefs.current[activeTab]
    const scrollableElement = findScrollableElement(tabElement)

    if (!scrollableElement) return

    const handleScroll = () => {
      // Throttle scroll tracking to improve performance
      clearTimeout(saveCurrentTabState._throttleTimer)
      saveCurrentTabState._throttleTimer = setTimeout(() => {
        saveCurrentTabState()
      }, 100)
    }

    scrollableElement.addEventListener('scroll', handleScroll, { passive: true })

    // Force restoration attempt when tab becomes active and scrollable element is ready
    if (tabStateRef.current[activeTab] && tabStateRef.current[activeTab].scrollPosition > 0) {
      const forceRestore = () => {
        const savedState = tabStateRef.current[activeTab]
        if (savedState && savedState.scrollPosition > 0) {
          // Try both percentage and absolute restoration
          const maxScroll = scrollableElement.scrollHeight - scrollableElement.clientHeight
          const targetScroll = Math.max(0, Math.min((savedState.scrollPercentage / 100) * maxScroll, maxScroll))

          if (scrollableElement.scrollTop === 0 && targetScroll > 0) {
            scrollableElement.scrollTop = targetScroll

            if (activeTab === 'swot') {
              console.log(`SWOT force restore on tab activation:`, {
                targetScroll,
                actualScroll: scrollableElement.scrollTop
              })
            }
          }
        }
      }

      // Attempt force restoration with delays
      setTimeout(forceRestore, 100)
      setTimeout(forceRestore, 300)
      setTimeout(forceRestore, 600)
    }

    return () => {
      scrollableElement.removeEventListener('scroll', handleScroll)
      clearTimeout(saveCurrentTabState._throttleTimer)
    }
  }, [activeTab, findScrollableElement, saveCurrentTabState])

  // Auto-save activeTab to localStorage whenever it changes
  useEffect(() => {
    // Skip saving on initial render to avoid duplicate saves
    if (isInitialRenderRef.current) {
      return
    }
    
    // Only save if we have a proper document identifier
    const currentDocId = getCurrentDocumentId()
    if (currentDocId === 'default' || currentDocId === window.location.pathname) {
      return
    }
    
    // Save the current activeTab
    if (activeTab) {
      saveActiveTabToStorage(activeTab)
    }
  }, [activeTab, saveActiveTabToStorage, getCurrentDocumentId])

  // Save state when component unmounts
  useEffect(() => {
    return () => {
      saveCurrentTabState()
    }
  }, [saveCurrentTabState])

  // Handle docId changes and restore overview subtab state
  useEffect(() => {
    if (docId) {
      console.log(`Overview subtab: docId changed to ${docId}`)
      const savedSubtab = loadOverviewSubtabFromStorage(docId)
      setOverviewActiveSubtab(savedSubtab)
    } else {
      // Reset to default if no docId
      setOverviewActiveSubtab('executive-summary')
    }
  }, [docId, loadOverviewSubtabFromStorage])

  // Auto-save overview subtab state when it changes (with debouncing)
  useEffect(() => {
    if (!docId) return

    const timeoutId = setTimeout(() => {
      saveOverviewSubtabToStorage(overviewActiveSubtab, docId)
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [overviewActiveSubtab, docId, saveOverviewSubtabToStorage])

  // Handle clicking outside the menu to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    const handleScroll = () => {
      setIsMenuOpen(false)
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
      window.addEventListener('scroll', handleScroll, true) // Use capture to catch all scroll events
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [isMenuOpen])

  // Generate highlights from analysis results
  useEffect(() => {
    if (!results?.analysis) {
      setHighlights([])
      return
    }

    const newHighlights = []

    // Add key points highlights
    if (results.analysis.key_points) {
      results.analysis.key_points.forEach((keyPoint, index) => {
        if (typeof keyPoint === 'object' && keyPoint.position && keyPoint.position.found) {
          newHighlights.push({
            id: `insight-${index}`,
            type: 'insight',
            position: keyPoint.position,
            text: keyPoint.text,
            quote: keyPoint.quote,
            tooltip: `Key Insight: ${keyPoint.text}`
          })
        }
      })
    }

    // Add risk flags highlights
    if (results.analysis.risk_flags) {
      results.analysis.risk_flags.forEach((riskFlag, index) => {
        if (typeof riskFlag === 'object' && riskFlag.position && riskFlag.position.found) {
          newHighlights.push({
            id: `risk-${index}`,
            type: 'risk',
            position: riskFlag.position,
            text: riskFlag.text,
            quote: riskFlag.quote,
            tooltip: `Risk Flag: ${riskFlag.text}`
          })
        }
      })
    }

    setHighlights(newHighlights)
  }, [results])

  const handleHighlightClick = (id) => {
    setActiveHighlight(activeHighlight === id ? null : id)
    if (activeTab === 'document') {
      setActiveTab('insights')
    }
    
    // Store the highlight click for forcing list mode
    const highlight = highlights.find(h => h.id === id)
    if (highlight) {
      setHighlightClickData({
        forceListMode: true,
        forceCardMode: highlight.type === 'insight' ? 'insights' : 'risks',
        selectedItemIndex: parseInt(highlight.id.split('-')[1]) // Extract index from id like 'insight-0' or 'risk-1'
      })
    }
  }

  const handleShowInDocument = (id) => {
    console.log('handleShowInDocument called with id:', id)
    setActiveHighlight(id)
    setActiveTab('document')

    // Enhanced delay and retry mechanism to ensure reliable scrolling
    const attemptScroll = (attempts = 0, maxAttempts = 10) => {
      console.log(`Attempting scroll ${attempts + 1}/${maxAttempts} for highlight:`, id)
      
      // Try multiple selectors to find the highlight
      let element = document.querySelector(`[data-highlight-id="${id}"]`)
      
      if (!element) {
        // Fallback: try without quotes in case of encoding issues
        element = document.querySelector(`[data-highlight-id=${id}]`)
      }
      
      if (!element) {
        // Debug: log all highlight elements to see what's available
        const allHighlights = document.querySelectorAll('[data-highlight-id]')
        console.log('All highlights found:', Array.from(allHighlights).map(el => el.getAttribute('data-highlight-id')))
      }
      
      if (element) {
        console.log('Found highlight element:', element)
        
        // Get the scrollable container (document tab)
        const scrollContainer = tabContentRefs.current['document']
        
        if (scrollContainer) {
          // Method: Calculate scroll position using getBoundingClientRect for accuracy
          const elementRect = element.getBoundingClientRect()
          const containerRect = scrollContainer.getBoundingClientRect()
          const containerHeight = scrollContainer.clientHeight
          const elementHeight = element.offsetHeight
          
          // Calculate relative position within the scrollable container
          let calculatedTop = elementRect.top - containerRect.top + scrollContainer.scrollTop
          
          // If getBoundingClientRect fails, try offsetTop as fallback
          if (calculatedTop <= 0) {
            calculatedTop = element.offsetTop
            
            // If offsetTop is also 0, try DOM traversal
            if (calculatedTop === 0) {
              let currentElement = element
              while (currentElement && currentElement !== scrollContainer) {
                calculatedTop += currentElement.offsetTop || 0
                currentElement = currentElement.offsetParent
                if (currentElement === scrollContainer) break
              }
              
              // If still 0, use text-based position calculation from highlight data
              if (calculatedTop === 0) {
                // Find highlight data by id to get character position
                const highlight = highlights.find(h => h.id === id)
                if (highlight && highlight.position && highlight.position.found) {
                  const documentText = (isDemoMode || bypassAPI) ? mockDocumentText : results?.document_text
                  
                  if (scrollContainer && documentText) {
                    const charPosition = highlight.position.start
                    const totalTextLength = documentText.length
                    
                    // Use the scroll container's scrollHeight directly
                    const containerScrollHeight = scrollContainer.scrollHeight
                    const positionRatio = charPosition / totalTextLength
                    calculatedTop = Math.max(0, containerScrollHeight * positionRatio)
                    
                    console.log('Character position calculation debug:', {
                      charPosition,
                      totalTextLength,
                      containerScrollHeight,
                      positionRatio,
                      calculatedBeforeMax: containerScrollHeight * positionRatio,
                      calculatedTop,
                      scrollContainerTag: scrollContainer.tagName,
                      scrollContainerClass: scrollContainer.className
                    })
                  }
                } else {
                  // Fallback to original index-based estimation
                  const textContainer = element.closest('.whitespace-pre-wrap, .prose, [data-highlight-container]')
                  if (textContainer) {
                    const allHighlights = Array.from(textContainer.querySelectorAll('[data-highlight-id]'))
                    const elementIndex = allHighlights.indexOf(element)
                    
                    if (elementIndex >= 0) {
                      // Estimate position based on element index and average spacing
                      const avgSpacing = textContainer.scrollHeight / Math.max(allHighlights.length, 1)
                      calculatedTop = elementIndex * avgSpacing
                      console.log('Used index-based estimation:', calculatedTop, 'for element', elementIndex, 'of', allHighlights.length)
                    }
                  }
                }
              }
            }
          }
          
          // Calculate scroll position to center the element
          // For small positions, don't try to center, just scroll to the element
          let scrollTop
          if (calculatedTop < containerHeight / 2) {
            // Element is near the top, just scroll to show it
            scrollTop = Math.max(0, calculatedTop - 100) // Leave some margin
          } else {
            // Element is further down, try to center it
            scrollTop = calculatedTop - (containerHeight / 2) + (elementHeight / 2)
          }
          
          console.log('Scroll calculation details:', {
            elementRect: elementRect.top,
            calculatedTop,
            containerHeight,
            elementHeight,
            scrollTop,
            scrollContainer: scrollContainer.tagName,
            containerScrollTop: scrollContainer.scrollTop,
            containerScrollHeight: scrollContainer.scrollHeight
          })
          
          // Smooth scroll to the calculated position
          scrollContainer.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
          })
          
          console.log('Scrolled to position:', scrollTop)
          
          // Verify scroll worked after a delay and provide fallback
          setTimeout(() => {
            const newScrollTop = scrollContainer.scrollTop
            console.log('Final scroll position:', newScrollTop, 'vs target:', scrollTop)
            
            // If scroll didn't work well, try scrollIntoView as fallback
            if (Math.abs(newScrollTop - scrollTop) > 20) {
              console.log('Primary scroll failed, using scrollIntoView fallback')
              element.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
              })
              
              // Final verification
              setTimeout(() => {
                const finalScrollTop = scrollContainer.scrollTop
                console.log('Final fallback scroll position:', finalScrollTop)
              }, 300)
            } else {
              console.log('Scroll successful!')
            }
          }, 300)
          
        } else {
          console.log('No scroll container found, using scrollIntoView')
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          })
        }
        
        // Add a subtle flash effect to make the highlight more visible
        element.style.transition = 'box-shadow 0.3s ease-in-out'
        element.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.8)'
        setTimeout(() => {
          element.style.boxShadow = ''
        }, 1500)
        
        console.log('Successfully scrolled to highlight:', id)
      } else if (attempts < maxAttempts) {
        // Retry if element not found yet
        console.log(`Element not found, retrying in 200ms... (attempt ${attempts + 1})`)
        setTimeout(() => attemptScroll(attempts + 1, maxAttempts), 200)
      } else {
        // Final fallback: use position data directly without DOM element
        console.warn('Could not find highlight element after', maxAttempts, 'attempts:', id)
        console.log('Attempting position-based scroll fallback...')
        
        const highlight = highlights.find(h => h.id === id)
        const scrollContainer = tabContentRefs.current['document']
        
        if (highlight && highlight.position && highlight.position.found && scrollContainer) {
          const documentText = (isDemoMode || bypassAPI) ? mockDocumentText : results?.document_text
          
          if (documentText) {
            const charPosition = highlight.position.start
            const totalTextLength = documentText.length
            const containerScrollHeight = scrollContainer.scrollHeight
            const positionRatio = charPosition / totalTextLength
            const scrollTop = containerScrollHeight * positionRatio
            
            console.log('Using direct position-based scroll:', {
              charPosition,
              totalTextLength,
              positionRatio,
              scrollTop,
              containerScrollHeight
            })
            
            scrollContainer.scrollTo({
              top: scrollTop,
              behavior: 'smooth'
            })
          }
        }
        
        console.log('Available highlight IDs:', 
          Array.from(document.querySelectorAll('[data-highlight-id]'))
            .map(el => el.getAttribute('data-highlight-id'))
        )
      }
    }

    // Initial delay to ensure tab switch completes
    setTimeout(() => attemptScroll(), 500)
  }

  // Reset highlight click data when switching tabs or after it's been applied
  useEffect(() => {
    if (highlightClickData.forceListMode && activeTab === 'insights') {
      // Clear the force mode after it's been applied
      const timer = setTimeout(() => {
        setHighlightClickData({
          forceListMode: false,
          forceCardMode: null,
          selectedItemIndex: null
        })
      }, 100) // Small delay to ensure the props are processed
      
      return () => clearTimeout(timer)
    }
  }, [highlightClickData.forceListMode, activeTab])

  // Load DOCX content when file changes
  useEffect(() => {
    if (isDOCX && file) {
      loadDocxContent()
    } else {
      setDocxContent(null)
    }
  }, [isDOCX, file])

  const loadDocxContent = async () => {
    if (!file) return

    setDocxLoading(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })

      setDocxContent({
        text: result.value,
        messages: result.messages
      })
    } catch (err) {
      console.error('Error loading DOCX file:', err)
      setDocxContent(null)
    } finally {
      setDocxLoading(false)
    }
  }

  // State for copy and feedback
  const [copiedItem, setCopiedItem] = useState(null)
  const [feedbackGiven, setFeedbackGiven] = useState({})

  const handleCopy = async (text, itemId) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedItem(itemId)
      setTimeout(() => setCopiedItem(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const handleFeedback = (itemId, type) => {
    setFeedbackGiven(prev => ({
      ...prev,
      [itemId]: type
    }))

    // Send feedback to backend
    const feedbackType = type === 'positive' ? 'positive' : 'negative'
    const feedbackCategory = 'summary'
    const message = text

    axios.post(`${BASE_URL}/feedback`, {
      feedback_type: feedbackType,
      feedback_category: feedbackCategory,
      message: message
    }, {
      withCredentials: true
    }).then(response => {
      console.log('Summary feedback submitted:', response.data)
    }).catch(error => {
      console.error('Summary feedback error:', error)
    })

    console.log(`Feedback given for ${itemId}: ${type}`)
  }

  return (
    <>
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Enhanced Header - Fixed at top */}
      <div className=" flex-shrink-0 px-2 sm:px-3 lg:px-4 py-2 sm:py-3 bg-white/80 dark:bg-[#121212] backdrop-blur-sm">
        <div className="flex flex-row items-center justify-between gap-2">
          {/* LEFT SIDE */}
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm lg:text-base font-bold text-slate-900 dark:text-white">
                  Content Information
                  {isDemoMode && (
                    <span className="text-xs text-orange-500 font-normal">(Demo)</span>
                  )}
                  {bypassAPI && !isDemoMode && (
                    <span className="text-xs text-green-600 font-normal">(Preview)</span>
                  )}
                </h2>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - Hamburger Menu */}
          <div className="flex justify-end flex-shrink-0 relative" ref={menuRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Document options"
            >
              <Menu className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </Button>
          </div>
        </div>
      </div>



      {/* Enhanced Content - Scrollable */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
          <div className="flex-shrink-0 px-2 sm:px-3 lg:px-4 pt-2 sm:pt-3 dark:bg-[#121212]">
            <TabsList className={`grid w-full ${hasDocumentViewer ? 'grid-cols-5' : 'grid-cols-5'} bg-transparent border-none h-auto`}>
              <TabsTrigger value="analysis" className="
                  relative
                  flex items-center justify-center gap-1
                  bg-transparent border-none rounded-none
                  text-xs py-2 sm:py-3 px-2 sm:px-3
                  transition-all duration-200
                  hover:text-blue-500 dark:hover:text-blue-300

                  data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400
                  before:content-[''] before:absolute before:bottom-0 before:left-0 before:h-[2px]
                  before:w-0 before:bg-blue-500 before:transition-all before:duration-300
                  data-[state=active]:before:w-full
                ">
                <Brain className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                <span className="hidden md:inline">Overview</span>
                <span className="md:hidden"></span>
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="
  relative
  flex items-center justify-center gap-1
  bg-transparent border-none rounded-none
  text-xs py-2 sm:py-3 px-2 sm:px-3
  transition-all duration-200
  hover:text-blue-500 dark:hover:text-blue-300

  data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400
  before:content-[''] before:absolute before:bottom-0 before:left-0 before:h-[2px]
  before:w-0 before:bg-blue-500 before:transition-all before:duration-300
  data-[state=active]:before:w-full
">
                  <Lightbulb className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                <span className="hidden md:inline">Recommendations</span>
                <span className="md:hidden"></span>
              </TabsTrigger>
                <TabsTrigger value="swot" className="
    relative
    flex items-center justify-center gap-1
  bg-transparent border-none rounded-none
  text-xs py-2 sm:py-3 px-2 sm:px-3
  transition-all duration-200
  hover:text-blue-500 dark:hover:text-blue-300

  data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400
  before:content-[''] before:absolute before:bottom-0 before:left-0 before:h-[2px]
  before:w-0 before:bg-blue-500 before:transition-all before:duration-300
  data-[state=active]:before:w-full
">
                <Key className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                <span className="hidden md:inline">SWOT</span>
                <span className="md:hidden"></span>
              </TabsTrigger>

              
              <TabsTrigger value="insights" className="
  relative
  flex items-center justify-center gap-1
  bg-transparent border-none rounded-none
  text-xs py-2 sm:py-3 px-2 sm:px-3
  transition-all duration-200
  hover:text-blue-500 dark:hover:text-blue-300

  data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400
  before:content-[''] before:absolute before:bottom-0 before:left-0 before:h-[2px]
  before:w-0 before:bg-blue-500 before:transition-all before:duration-300
  data-[state=active]:before:w-full
">
                <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                <span className="hidden md:inline">Analysis</span>
                <span className="md:hidden"></span>
              </TabsTrigger>
              {/* {hasDocumentViewer && (
                <TabsTrigger value="document-viewer" className="flex items-center justify-center gap-1 bg-transparent border-none rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-all duration-200 py-2 sm:py-3 px-2 sm:px-3 text-xs">
                  <FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                  <span className="hidden sm:inline">{isPDF ? 'PDF' : 'DOCX Viewer'}</span>
                  <span className="sm:hidden">{isPDF ? 'PDF' : 'DOCX'}</span>
                </TabsTrigger>
              )} */}

              

              <TabsTrigger value="document" className="
  relative
  flex items-center justify-center gap-1
  bg-transparent border-none rounded-none
  text-xs py-2 sm:py-3 px-2 sm:px-3
  transition-all duration-200
  hover:text-blue-500 dark:hover:text-blue-300

  data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400
  before:content-[''] before:absolute before:bottom-0 before:left-0 before:h-[2px]
  before:w-0 before:bg-blue-500 before:transition-all before:duration-300
  data-[state=active]:before:w-full
">
                <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                <span className="hidden md:inline">Extractive Text</span>
                <span className="md:hidden"></span>
              </TabsTrigger>
              <Separator className="col-span-full border-b border-gray-200 dark:border-gray-800" />
              {/* <div className="w-full border-b border-gray-200 dark:border-gray-700"></div> */}
            </TabsList>
            {/* Separator */}
            
          </div>

          <div className="flex-1 overflow-hidden dark:bg-[#121212]">
            

            {/* SWOT Tab */}
            <div
              className={`h-full overflow-y-auto px-2 sm:px-3 lg:px-4 pb-2 sm:pb-4  ${activeTab === 'swot' ? 'block' : 'hidden'
                }`}
              ref={el => tabContentRefs.current['swot'] = el}
            >
              <SWOTAnalysis
                swot={
                  isDemoMode || bypassAPI
                    ? undefined // Let component use mock data
                    : results?.analysis?.swot_analysis || results?.swot_analysis || {
                      strengths: [],
                      weaknesses: [],
                      opportunities: [],
                      threats: []
                    }
                }
                isDemoMode={isDemoMode}
                bypassAPI={bypassAPI}
              />
            </div>

            {/* AI Analysis Summary Tab with Subtabs */}
            <div
              className={`h-full overflow-y-auto px-8 p-4 pb-4 ${activeTab === 'analysis' ? 'block' : 'hidden'
                }`}
              ref={el => tabContentRefs.current['analysis'] = el}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4 mt-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow-lg">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Overview Analysis
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-gray-400 mt-1">
                      Executive summary and problem context
                    </p>
                  </div>
                </div>
                {/* Document Analyzed Timestamp */}
                {results?.analyzed_at && (
                  <div className="flex items-center gap-2 bg-gradient-to-r from-slate-50/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 rounded-lg p-2 border border-slate-200/50 dark:border-gray-700/50">
                    <div className="p-1 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                      <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-medium text-slate-700 dark:text-gray-300">
                        Analyzed
                      </p>
                      <p className="text-xs text-slate-500 dark:text-gray-400">
                        {new Date(results.analyzed_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Subtabbed Content */}
              <div className="flex-1 overflow-hidden">
                <Tabs value={overviewActiveSubtab} onValueChange={setOverviewActiveSubtab} className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-2 bg-transparent border-none h-auto mb-4">
                    <TabsTrigger
                      value="executive-summary"
                      className="relative flex items-center justify-center gap-1 bg-transparent border-none rounded-none text-xs py-2 px-3 transition-all duration-200 hover:text-purple-500 dark:hover:text-purple-300 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400 before:content-[''] before:absolute before:bottom-0 before:left-0 before:h-[2px] before:w-0 before:bg-purple-500 before:transition-all before:duration-300 data-[state=active]:before:w-full"
                    >
                      <Brain className="h-3 w-3 flex-shrink-0" />
                      <span className="hidden md:inline">Executive Summary</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="problem-context"
                      className="relative flex items-center justify-center gap-1 bg-transparent border-none rounded-none text-xs py-2 px-3 transition-all duration-200 hover:text-orange-500 dark:hover:text-orange-300 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400 before:content-[''] before:absolute before:bottom-0 before:left-0 before:h-[2px] before:w-0 before:bg-orange-500 before:transition-all before:duration-300 data-[state=active]:before:w-full"
                    >
                      <Info className="h-3 w-3 flex-shrink-0" />
                      <span className="hidden md:inline">Problem Context</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Main Content Area - Only this part changes */}
                  <div className="flex-1 overflow-y-auto">
                    <Card className="border-none bg-transparent mb-4">
                      <CardContent className="p-4">
                        {/* Executive Summary Content */}
                        {overviewActiveSubtab === 'executive-summary' && (
                          <div className="bg-gradient-to-r from-purple-50/80 to-blue-50/80 dark:from-purple-950/30 dark:to-blue-950/30 rounded-2xl p-3 sm:p-4 border border-purple-200/50 dark:border-purple-800/30 relative">
                            {/* Add action buttons at bottom right */}
                            <div className="absolute bottom-3 right-3 flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy(results?.analysis?.summary || '', 'summary')}
                                className="h-7 w-7 p-0 hover:bg-purple-100 dark:hover:bg-purple-900/20"
                                title="Copy summary"
                              >
                                <Copy className={`h-3 w-3 ${copiedItem === 'summary' ? 'text-purple-600' : 'text-gray-500'}`} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFeedback('summary', 'positive')}
                                className={`h-7 w-7 p-0 hover:bg-green-100 dark:hover:bg-green-900/20 ${feedbackGiven['summary'] === 'positive' ? 'bg-green-100 dark:bg-green-900/20' : ''
                                  }`}
                                title="Helpful summary"
                              >
                                <ThumbsUp className={`h-3 w-3 ${feedbackGiven['summary'] === 'positive' ? 'text-green-600' : 'text-gray-500'
                                  }`} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFeedback('summary', 'negative')}
                                className={`h-7 w-7 p-0 hover:bg-red-100 dark:hover:bg-red-900/20 ${feedbackGiven['summary'] === 'negative' ? 'bg-red-100 dark:bg-red-900/20' : ''
                                  }`}
                                title="Not helpful"
                              >
                                <ThumbsDown className={`h-3 w-3 ${feedbackGiven['summary'] === 'negative' ? 'text-red-600' : 'text-gray-500'
                                  }`} />
                              </Button>
                            </div>

                            <MarkdownRenderer
                              content={results?.analysis?.summary || 'Comprehensive analysis will appear here after document processing...'}
                              className="text-slate-800 dark:text-slate-100 leading-relaxed text-sm font-medium"
                            />
                          </div>
                        )}

                        {/* Problem Context Content */}
                        {overviewActiveSubtab === 'problem-context' && (
                          <>
                            {(
                              (results?.problem_context && results.problem_context.trim()) ||
                              (results?.analysis?.problem_context && results.analysis.problem_context.trim())
                            ) ? (
                              <div>
                                {/* <div className="flex items-center gap-2 mb-3">
                                  <Info className="h-5 w-5 text-orange-600" />
                                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Problem Context</h3>
                                </div> */}
                                <div className="bg-orange-50/80 dark:bg-orange-950/30 rounded-xl p-4 border border-orange-200/50 dark:border-orange-800/30 relative">
                                  <MarkdownRenderer
                                    content={
                                      (results?.problem_context && results.problem_context.trim()) ||
                                      (results?.analysis?.problem_context && results.analysis.problem_context.trim()) ||
                                      'Problem context information not available for this document.'
                                    }
                                    className="text-slate-800 dark:text-slate-100 leading-relaxed text-sm"
                                  />

                                  <div className="absolute bottom-3 right-2 flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleCopy(
                                        (results?.problem_context && results.problem_context.trim()) ||
                                        (results?.analysis?.problem_context && results.analysis.problem_context.trim()) ||
                                        '', 'problem_context'
                                      )}
                                      className="h-7 w-7 p-0 hover:bg-orange-100 dark:hover:bg-orange-900/20 mt-2"
                                    >
                                      <Copy className={`h-3 w-3 ${copiedItem === 'problem_context' ? 'text-orange-600' : 'text-gray-500'}`} />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No problem context available</p>
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>

                    {/* Quick Stats - Always visible */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl p-2 sm:p-2.5 lg:p-3 border border-emerald-200/50 dark:border-emerald-800/30">
                        <div className="flex items-center gap-1">
                          <Target className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Insights</span>
                        </div>
                        <p className="text-sm sm:text-base lg:text-lg font-bold text-emerald-900 dark:text-emerald-100 mt-1">
                          {isDemoMode ? '12' : bypassAPI ? '4' : (results?.analysis?.key_points?.length || 0)}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 rounded-xl p-2 sm:p-2.5 lg:p-3 border border-red-200/50 dark:border-red-800/30">
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-600 dark:text-red-400" />
                          <span className="text-xs font-medium text-red-800 dark:text-red-200">Risks</span>
                        </div>
                        <p className="text-sm sm:text-base lg:text-lg font-bold text-red-900 dark:text-red-100 mt-1">
                          {isDemoMode ? '3' : bypassAPI ? '3' : (results?.analysis?.risk_flags?.length || 0)}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 rounded-xl p-2 sm:p-2.5 lg:p-3 border border-amber-200/50 dark:border-amber-800/30">
                        <div className="flex items-center gap-1">
                          <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-600 dark:text-amber-400" />
                          <span className="text-xs font-medium text-amber-800 dark:text-amber-200">Concepts</span>
                        </div>
                        <p className="text-sm sm:text-base lg:text-lg font-bold text-amber-900 dark:text-amber-100 mt-1">
                          {isDemoMode ? '3' : bypassAPI ? '3' : (results?.analysis?.key_concepts?.length || 0)}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-2 sm:p-2.5 lg:p-3 border border-blue-200/50 dark:border-blue-800/30">
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Status</span>
                        </div>
                        <p className="text-sm sm:text-base lg:text-lg font-bold text-blue-900 dark:text-blue-100 mt-1">
                          {isDemoMode ? 'Demo' : bypassAPI ? 'Preview' : 'Done'}
                        </p>
                      </div>
                    </div>

                    <Separator className="my-4 dark:bg-gray-700" />

                    {/* Key Concepts Section - Always visible */}
                    <div className="mt-3 sm:mt-4">
                      <KeyConceptsDisplay
                        concepts={isDemoMode ? results?.key_concepts || [] : bypassAPI ? results?.analysis?.key_concepts || [] : (results?.analysis?.key_concepts || [])}
                        onExplainConcept={onExplainConcept}
                        isDemoMode={isDemoMode}
                        bypassAPI={bypassAPI}
                      />
                    </div>
                  </div>
                </Tabs>
              </div>
            </div>

            <div className={`h-full mt-1 sm:mt-2 overflow-y-auto ${activeTab === 'recommendations' ? 'block' : 'hidden'
                }`}
              ref={el => tabContentRefs.current['recommendations'] = el}
              
            >
              <Recommendations 
                results={results}
                isDemoMode={isDemoMode}
                bypassAPI={bypassAPI}
                docId={getCurrentDocumentId()}
              />
            </div>

            {/* Insights & Risks Tab */}
            <div
              className={`h-full mt-1 sm:mt-2 overflow-y-auto ${activeTab === 'insights' ? 'block' : 'hidden'
                }`}
              ref={el => tabContentRefs.current['insights'] = el}
            >
              <ProfessionalAnalysisDisplay
                results={results}
                onHighlightClick={handleShowInDocument}
                activeHighlight={activeHighlight}
                showSummary={false}
                onActiveHighlightChange={(newId) => setActiveHighlight(newId)}
                forceListMode={highlightClickData.forceListMode}
                forceCardMode={highlightClickData.forceCardMode}
                selectedItemIndex={highlightClickData.selectedItemIndex}
                activeTab={activeTab}
                onActiveTabChange={(newTab) => {
                  // Handle activeTab changes from ProfessionalAnalysisDisplay
                  if (newTab !== activeTab) {
                    console.log(`🔄 ProfessionalAnalysisDisplay requested tab change to: ${newTab}`)
                    handleTabChange(newTab)
                  }
                }}
              />
            </div>

            {/* Interactive Document Text Tab */}
            <div
              className={`h-full overflow-y-auto px-2 sm:px-3 lg:px-4 pb-2 sm:pb-4 scroll-smooth ${activeTab === 'document' ? 'block' : 'hidden'
                }`}
              ref={el => tabContentRefs.current['document'] = el}
              style={{ scrollBehavior: 'smooth' }}
            >
              <Card className="border-0 shadow-xl dark:bg-transparent">
                <CardHeader className="px-3 sm:px-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 dark:text-white">
                          Extractive Text
                          {isDemoMode && <span className="text-xs text-orange-500 font-normal">(Demo)</span>}
                          {bypassAPI && !isDemoMode && <span className="text-xs text-green-600 font-normal">(Preview)</span>}
                          {isDOCX && !isDemoMode && !bypassAPI && <span className="text-xs text-blue-600 font-normal">(DOCX)</span>}
                        </CardTitle>
                        <p className="text-xs text-slate-600 dark:text-gray-400 mt-1">
                          {isDemoMode
                            ? 'Sample document text for demo purposes'
                            : bypassAPI
                              ? 'Document text preview with mock data'
                              : isDOCX
                                ? 'DOCX document content with formatting preserved'
                                : 'Claude\'s extracted document text with intelligent highlighting'
                          }
                        </p>
                      </div>
                    </div>
                    {highlights.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 text-xs">
                          {highlights.length} highlights
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-3 sm:px-4">

                  {(results?.document_text || isDemoMode || bypassAPI || docxContent) ? (
                    <div className="space-y-2 sm:space-y-3">
                      {/* Interactive Text Display */}
                      <div className="bg-slate-50 dark:bg-background rounded-2xl p-2 sm:p-2.5 lg:p-4 max-h-[60vh] overflow-y-auto rounded-none">
                        {(isDemoMode || bypassAPI) && (
                          <div className={`mb-3 p-2 border rounded-lg ${isDemoMode
                            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                            : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            }`}>
                            <p className={`text-xs font-medium ${isDemoMode
                              ? 'text-orange-700 dark:text-orange-300'
                              : 'text-green-700 dark:text-green-300'
                              }`}>
                              {isDemoMode
                                ? '📄 Demo Document - This is sample content to showcase the interface'
                                : '📄 Preview Mode - Document loaded with mock analysis to save API quota'
                              }
                            </p>
                          </div>
                        )}

                        {/* DOCX Content Display */}
                        {docxContent && !isDemoMode && !bypassAPI ? (
                          <HighlightableText
                            text={docxContent.text}
                            highlights={highlights}
                            activeHighlight={activeHighlight}
                            onHighlightClick={handleHighlightClick}
                          />
                        ) : docxLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="text-center space-y-3">
                              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                              <p className="text-sm text-slate-600 dark:text-gray-400">Loading DOCX document...</p>
                            </div>
                          </div>
                        ) : (
                          <HighlightableText
                            text={(isDemoMode || bypassAPI) ? mockDocumentText : results?.document_text}
                            highlights={highlights}
                            activeHighlight={activeHighlight}
                            onHighlightClick={handleHighlightClick}
                          />
                        )}
                      </div>

                      {/* Instructions - Responsive Grid */}
                      
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-12">
                      <div className="p-3 bg-slate-100 dark:bg-gray-700 rounded-full w-fit mx-auto mb-3">
                        <FileText className="h-6 w-6 text-slate-400 dark:text-gray-500" />
                      </div>
                      <h3 className="text-base font-semibold text-slate-700 dark:text-gray-300 mb-2">
                        No Document Text Available
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-gray-400 px-4">
                        Upload and analyze a document to see the interactive text view.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </Tabs>
      </div>
    </div>

    {/* Portal Dropdown Menu - Outside main component tree to avoid z-index issues */}
    {isMenuOpen && (
      <div 
        className="fixed inset-0 z-[99999]"
        onClick={() => setIsMenuOpen(false)}
      >
        <div 
          className="absolute top-16 right-4 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl py-1 rounded-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Open PDF Option - Only show if PDF is available */}
          {getFileUrl() && (
            <a
              href={getFileUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ExternalLink className="h-4 w-4 text-blue-500" />
              <span>Open Original PDF</span>
            </a>
          )}

          {/* Export Analysis to PDF Option */}
          <button
            onClick={() => {
              setIsMenuOpen(false)
              exportToPDF()
            }}
            disabled={isExporting || (!results?.analysis && !isDemoMode && !bypassAPI)}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4 text-green-500" />
                <span>Analysis to PDF</span>
              </>
            )}
          </button>

          {getFileUrl() && (
            <a
              href={`/sendticket?docId=${results?.document_id}`}
              className='w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700'
              onClick={() => setIsMenuOpen(false)}
              target='_parent'
            >
              <MessageCircle className="h-4 w-4 text-blue-500" />
              <span className='text-sm'>Report Issue</span>
            </a>
          )}

          {/* Divider */}
          {getFileUrl() && (
            <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
          )}

          {/* Additional info item */}
          <div className="px-4 py-2">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {isDemoMode ? (
                "Demo mode - sample data only"
              ) : bypassAPI ? (
                "Preview mode - mock responses"
              ) : (
                `${results?.word_count || 0} words analyzed`
              )}
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

export default EnhancedDocumentViewer 