import React, { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Eye, FileText, Brain, TrendingUp, Clock, Sparkles, Target, AlertTriangle, CheckCircle2, BookOpen, Key, ArrowBigDown, Download } from 'lucide-react'
import ProfessionalAnalysisDisplay from './ProfessionalAnalysisDisplay'
import KeyConceptsDisplay from './KeyConceptsDisplay'
import HighlightableText from './HighlightableText'
import MarkdownRenderer from './MarkdownRenderer'
import DocxViewer from './DocxViewer'
import mammoth from 'mammoth'
import SWOTAnalysis from './SWOTAnalysis'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
function EnhancedDocumentViewer({ results, file, inputMode, onExplainConcept, isDemoMode = false, bypassAPI = false }) {
  const [activeHighlight, setActiveHighlight] = useState(null)
  const [highlights, setHighlights] = useState([])
  const [activeTab, setActiveTab] = useState('analysis') // Initialize with default tab
  const [tabChangeKey, setTabChangeKey] = useState(0)
  const [docxContent, setDocxContent] = useState(null)
  const [docxLoading, setDocxLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Handle tab change with animation
  const handleTabChange = (newTab) => {
    setTabChangeKey(prev => prev + 1)
    setActiveTab(newTab)
  }

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

  // Set default tab based on document availability
  useEffect(() => {
    if (!activeTab) {
      if (hasDocumentViewer) {
        setActiveTab("document-viewer")
      } else if (isDemoMode || bypassAPI) {
        setActiveTab("analysis")
      } else {
        setActiveTab("document")
      }
    }
  }, [hasDocumentViewer, activeTab, isDemoMode, bypassAPI])

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
  }

  const handleShowInDocument = (id) => {
    setActiveHighlight(id)
    setActiveTab('document')

    // Small delay to ensure tab switch completes before scrolling
    setTimeout(() => {
      const element = document.querySelector(`[data-highlight-id="${id}"]`)

      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }
    }, 200) // Increased delay to ensure tab rendering completes
  }

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
      const result = await mammoth.convertToHtml({ arrayBuffer })

      setDocxContent({
        html: result.value,
        messages: result.messages
      })
    } catch (err) {
      console.error('Error loading DOCX file:', err)
      setDocxContent(null)
    } finally {
      setDocxLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Enhanced Header - Fixed at top */}
      <div className="border-b flex-shrink-0 px-2 sm:px-3 lg:px-4 py-2 sm:py-3 bg-white/80 dark:bg-[#121212] backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 lg:gap-0">
          {/* LEFT SIDE */}
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm lg:text-base font-bold text-slate-900 dark:text-white">
                  Content Information
                  {isDemoMode && <span className="text-xs text-orange-500 font-normal">(Demo)</span>}
                  {bypassAPI && !isDemoMode && <span className="text-xs text-green-600 font-normal">(Preview)</span>}
                </h2>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - Export Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToPDF}
              disabled={isExporting || (!results?.analysis && !isDemoMode && !bypassAPI)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 hover:text-white shadow-lg hover:shadow-xl transition-all duration-200 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm"
            >
              {isExporting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Exporting...</span>
                  <span className="sm:hidden">Exporting</span>
                </>
              ) : (
                <>
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Export PDF</span>
                  <span className="sm:hidden">PDF</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>


      {/* Enhanced Content - Scrollable */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
          <div className="flex-shrink-0 px-2 sm:px-3 lg:px-4 pt-2 sm:pt-3 dark:bg-[#121212]">
            <TabsList className={`grid w-full ${hasDocumentViewer ? 'grid-cols-5' : 'grid-cols-3'} bg-slate-100 dark:bg-[#000000] dark:text-white p-0.5 sm:p-1 rounded-xl h-auto`}>
              <TabsTrigger value="analysis" className="flex items-center gap-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 rounded-lg py-1 sm:py-1.5 px-1 sm:px-2 text-xs">
                <Brain className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                <span className="hidden md:inline">Overview</span>
                <span className="md:hidden">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="swot" className="flex items-center gap-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 rounded-lg py-1 sm:py-1.5 px-1 sm:px-2 text-xs">
                <Key className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                <span className="hidden md:inline">SWOT</span>
                <span className="md:hidden">SWOT</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 rounded-lg py-1 sm:py-1.5 px-1 sm:px-2 text-xs">
                <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                <span className="hidden md:inline">Analysis</span>
                <span className="md:hidden">Analysis</span>
              </TabsTrigger>
              {hasDocumentViewer && (
                <TabsTrigger value="document-viewer" className="flex items-center gap-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 rounded-lg py-1 sm:py-1.5 px-1 sm:px-2 text-xs">
                  <FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                  <span className="hidden sm:inline">{isPDF ? 'PDF' : 'DOCX Viewer'}</span>
                  <span className="sm:hidden">{isPDF ? 'PDF' : 'DOCX'}</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="document" className="flex items-center gap-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 rounded-lg py-1 sm:py-1.5 px-1 sm:px-2 text-xs">
                <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                <span className="hidden md:inline">Extractive Text</span>
                <span className="md:hidden">Text</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden dark:bg-[#121212]">
            {/* Document Viewer Tab (PDF or DOCX) */}
            {hasDocumentViewer && (
              <TabsContent value="document-viewer" className="h-full mt-1 sm:mt-2 px-2 sm:px-3 lg:px-4 pb-2 sm:pb-4 animate-tab-enter">
                {isPDF ? (
                  <Card className="h-full border-0 shadow-xl">
                    <CardContent className="p-0 h-full">
                      <div className="h-full border border-slate-200 dark:border-gray-600 rounded-xl overflow-hidden relative">
                        {!results && (
                          <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex items-center justify-center z-10">
                            <div className="text-center space-y-3">
                              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                              <div>
                                <p className="text-sm font-medium text-slate-700 dark:text-gray-300">Analyzing Document</p>
                                <p className="text-xs text-slate-500 dark:text-gray-400">PDF will be available once analysis completes</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {getFileUrl() ? (
                          <>
                            {/* Try object/embed for better PDF support */}
                            <object
                              data={getFileUrl()}
                              type="application/pdf"
                              className="w-full h-full"
                            >
                              <iframe
                                src={getFileUrl()}
                                className="w-full h-full"
                                title="PDF Document"
                                onLoad={() => console.log('PDF iframe loaded successfully')}
                                onError={(e) => console.log('PDF iframe error:', e)}
                              />
                            </object>
                            {/* Fallback - direct link */}
                            <div className="absolute bottom-4 right-4">
                              <a
                                href={getFileUrl()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                              >
                                Open PDF ↗
                              </a>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center space-y-3">
                              <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full"></div>
                              <div>
                                <p className="text-sm font-medium text-slate-700 dark:text-gray-300">PDF URL Not Available</p>
                                <p className="text-xs text-slate-500 dark:text-gray-400">Unable to generate PDF viewing URL</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <DocxViewer
                    file={file}
                    onTextExtracted={(text) => {
                      // This can be used to update the interactive text tab
                      console.log('DOCX text extracted:', text)
                    }}
                  />
                )}
              </TabsContent>
            )}

            <TabsContent value="swot" className="h-full mt-1 sm:mt-2 overflow-y-auto px-2 sm:px-3 lg:px-4 pb-2 sm:pb-4 animate-tab-enter">
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
            </TabsContent>

            {/* AI Analysis Summary Tab */}
            <TabsContent value="analysis" className="h-full mt-1 sm:mt-2 overflow-y-auto px-2 sm:px-3 lg:px-4 pb-2 sm:pb-4 animate-tab-enter">
              <Card className="border-0 mt-2 sm:mt-3 shadow-lg">
                <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow-lg">
                        <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 dark:text-white">
                          Executive Summary
                        </CardTitle>
                        <p className="text-xs text-slate-600 dark:text-gray-400 mt-1">
                          Summary by <span className="text-center inline-block font-bold">
                            Elva
                            <span className="text-red-500">*</span>
                          </span>
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
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 px-3 sm:px-4">
                  <div className="bg-gradient-to-r from-purple-50/80 to-blue-50/80 dark:from-purple-950/30 dark:to-blue-950/30 rounded-2xl p-3 sm:p-4 border border-purple-200/50 dark:border-purple-800/30">
                    <MarkdownRenderer
                      content={results?.analysis?.summary || 'Comprehensive analysis will appear here after document processing...'}
                      className="text-slate-800 dark:text-slate-100 leading-relaxed text-sm font-medium"
                    />
                  </div>

                  {/* Quick Stats - Responsive Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-3 sm:mt-4">
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
                </CardContent>
              </Card>

              {/* Key Concepts Section */}
              <div className="mt-3 sm:mt-4">
                <KeyConceptsDisplay
                  concepts={isDemoMode ? results?.key_concepts || [] : bypassAPI ? results?.analysis?.key_concepts || [] : (results?.analysis?.key_concepts || [])}
                  onExplainConcept={onExplainConcept}
                  isDemoMode={isDemoMode}
                  bypassAPI={bypassAPI}
                />
              </div>
            </TabsContent>

            {/* Insights & Risks Tab */}
            <TabsContent value="insights" className="h-full mt-1 sm:mt-2 overflow-y-auto animate-tab-enter">
              <ProfessionalAnalysisDisplay
                results={results}
                onHighlightClick={handleShowInDocument}
                activeHighlight={activeHighlight}
                showSummary={false}
              />
            </TabsContent>

            {/* Interactive Document Text Tab */}
            <TabsContent value="document" className="h-full mt-1 sm:mt-2 overflow-y-auto px-2 sm:px-3 lg:px-4 pb-2 sm:pb-4 animate-tab-enter">
              <Card className="border-0 shadow-xl">
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
                      <div className="bg-slate-50 dark:bg-gray-800 rounded-2xl p-2 sm:p-2.5 lg:p-4 max-h-[60vh] overflow-y-auto border border-slate-200 dark:border-gray-700">
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
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <div
                              dangerouslySetInnerHTML={{ __html: docxContent.html }}
                              style={{
                                fontFamily: 'Inter, system-ui, sans-serif',
                                lineHeight: '1.6',
                                color: 'inherit'
                              }}
                            />
                          </div>
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
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
                        <div className="p-2 sm:p-2.5 lg:p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-medium mb-1.5 text-sm">
                            <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            Key Insights
                          </div>
                          <p className="text-xs text-emerald-700 dark:text-emerald-300">
                            {isDemoMode
                              ? 'In the full version, insights from the AI analysis would be highlighted in green when clicked.'
                              : bypassAPI
                                ? 'In normal operation, AI insights would be highlighted here when clicked from the analysis tab.'
                                : 'Navigate to the Analysis tab and click on any insight to see it highlighted here in green.'
                            }
                          </p>
                        </div>

                        <div className="p-2 sm:p-2.5 lg:p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                          <div className="flex items-center gap-2 text-red-800 dark:text-red-200 font-medium mb-1.5 text-sm">
                            <AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            Risk Flags
                          </div>
                          <p className="text-xs text-red-700 dark:text-red-300">
                            {isDemoMode
                              ? 'Risk assessments would be highlighted in red when selected from the analysis tab.'
                              : bypassAPI
                                ? 'Risk flags from AI analysis would normally be highlighted here in red when selected.'
                                : 'Click on any risk assessment in the Analysis tab to see it highlighted here in red.'
                            }
                          </p>
                        </div>
                      </div>
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
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

export default EnhancedDocumentViewer 