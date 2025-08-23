import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import { Separator } from './ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import {
  Brain,
  Target,
  AlertTriangle,
  TrendingUp,
  Shield,
  Eye,
  Sparkles,
  Search,
  CheckCircle2,
  Info,
  Zap,
  Star,
  ArrowRight,
  FileText,
  Clock,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Settings,
  X,
  Save,
  RotateCcw,
  LineChart,
  BarChart3,
  Filter
} from 'lucide-react'
import HighlightableText from './HighlightableText'
import MarkdownRenderer from './MarkdownRenderer'
import axios from 'axios'
// Add to the top, after existing imports
import {
  ResponsiveContainer,
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell
} from 'recharts';

function ProfessionalAnalysisDisplay({ results, onHighlightClick, activeHighlight, onActiveHighlightChange, showSummary = true }) {
  const [insights, setInsights] = useState([])
  const [risks, setRisks] = useState([])
  const [summary, setSummary] = useState('')
  const [keyConcepts, setKeyConcepts] = useState([])
  const [highlights, setHighlights] = useState([])
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0)
  const [currentRiskIndex, setCurrentRiskIndex] = useState(0)
  const [copiedItem, setCopiedItem] = useState(null)
  const [feedbackGiven, setFeedbackGiven] = useState({})
  const BASE_URL = import.meta.env.VITE_API_BASE_URL

  // Chart and filter controls state - separate for insights and risks
  const [insightsDrawerOpen, setInsightsDrawerOpen] = useState(false)
  const [risksDrawerOpen, setRisksDrawerOpen] = useState(false)
  
  // Insights controls
  const [insightsChartType, setInsightsChartType] = useState('line')
  const [showInsightsCharts, setShowInsightsCharts] = useState(true)
  const [insightCategoryFilter, setInsightCategoryFilter] = useState('all')
  
  // Risks controls
  const [risksChartType, setRisksChartType] = useState('line')
  const [showRisksCharts, setShowRisksCharts] = useState(true)
  const [riskCategoryFilter, setRiskCategoryFilter] = useState('all')
  const [riskLevelFilter, setRiskLevelFilter] = useState('all')
  
  // Local state for insights drawer controls
  const [localInsightsChartType, setLocalInsightsChartType] = useState('line')
  const [localShowInsightsCharts, setLocalShowInsightsCharts] = useState(true)
  const [localInsightCategoryFilter, setLocalInsightCategoryFilter] = useState('all')
  
  // Local state for risks drawer controls
  const [localRisksChartType, setLocalRisksChartType] = useState('line')
  const [localShowRisksCharts, setLocalShowRisksCharts] = useState(true)
  const [localRiskCategoryFilter, setLocalRiskCategoryFilter] = useState('all')
  const [localRiskLevelFilter, setLocalRiskLevelFilter] = useState('all')
  
  const [insightsControlsKey, setInsightsControlsKey] = useState(0)
  const [risksControlsKey, setRisksControlsKey] = useState(0)
  const [isInsightsResetting, setIsInsightsResetting] = useState(false)
  const [isRisksResetting, setIsRisksResetting] = useState(false)
  
  const insightsDrawerRef = useRef(null)
  const risksDrawerRef = useRef(null)

  // Scroll position persistence refs
  const containerRef = useRef(null)
  const scrollPositionRef = useRef({
    scrollTop: 0,
    scrollHeight: 0,
    clientHeight: 0,
    scrollPercentage: 0,
    timestamp: Date.now()
  })

  // Generate document-specific storage key
  const generateDocumentKey = (resultsData) => {
    if (!resultsData) return 'analysis-controls-default'
    
    // Create a simple hash from the results data to identify unique documents
    const dataString = JSON.stringify(resultsData)
    let hash = 0
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return `analysis-controls-${Math.abs(hash)}`
  }
  
  const STORAGE_KEY = generateDocumentKey(results)
  const [currentDocumentKey, setCurrentDocumentKey] = useState(STORAGE_KEY)

  // Load settings from localStorage for current document
  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem(currentDocumentKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        return {
          insightsChartType: parsed.insightsChartType || 'line',
          showInsightsCharts: parsed.showInsightsCharts !== undefined ? parsed.showInsightsCharts : true,
          insightCategoryFilter: parsed.insightCategoryFilter || 'all',
          risksChartType: parsed.risksChartType || 'line',
          showRisksCharts: parsed.showRisksCharts !== undefined ? parsed.showRisksCharts : true,
          riskCategoryFilter: parsed.riskCategoryFilter || 'all',
          riskLevelFilter: parsed.riskLevelFilter || 'all'
        }
      }
    } catch (error) {
      console.warn('Failed to load analysis settings from localStorage:', error)
    }
    return {
      insightsChartType: 'line',
      showInsightsCharts: true,
      insightCategoryFilter: 'all',
      risksChartType: 'line',
      showRisksCharts: true,
      riskCategoryFilter: 'all',
      riskLevelFilter: 'all'
    }
  }

  // Save settings to localStorage for current document
  const saveToStorage = (settings) => {
    try {
      localStorage.setItem(currentDocumentKey, JSON.stringify(settings))
    } catch (error) {
      console.warn('Failed to save analysis settings to localStorage:', error)
    }
  }

  // Save insights settings to localStorage for current document
  const saveInsightsToStorage = (settings) => {
    try {
      const existingSettings = JSON.parse(localStorage.getItem(currentDocumentKey) || '{}')
      const updatedSettings = {
        ...existingSettings,
        insightsChartType: settings.insightsChartType,
        showInsightsCharts: settings.showInsightsCharts,
        insightCategoryFilter: settings.insightCategoryFilter
      }
      localStorage.setItem(currentDocumentKey, JSON.stringify(updatedSettings))
    } catch (error) {
      console.warn('Failed to save insights settings to localStorage:', error)
    }
  }
  
  // Save risks settings to localStorage for current document  
  const saveRisksToStorage = (settings) => {
    try {
      const existingSettings = JSON.parse(localStorage.getItem(currentDocumentKey) || '{}')
      const updatedSettings = {
        ...existingSettings,
        risksChartType: settings.risksChartType,
        showRisksCharts: settings.showRisksCharts,
        riskCategoryFilter: settings.riskCategoryFilter,
        riskLevelFilter: settings.riskLevelFilter
      }
      localStorage.setItem(currentDocumentKey, JSON.stringify(updatedSettings))
    } catch (error) {
      console.warn('Failed to save risks settings to localStorage:', error)
    }
  }

  // Simple persistence using ref to avoid re-render loops
  const persistedState = useRef({
    currentInsightIndex: 0,
    currentRiskIndex: 0,
    copiedItem: null,
    feedbackGiven: {},
    isInitialized: false,
    lastResultsId: null,
    scrollPosition: {
      scrollTop: 0,
      scrollHeight: 0,
      clientHeight: 0,
      scrollPercentage: 0,
      timestamp: Date.now()
    },
    insightsChartType: 'line',
    showInsightsCharts: true,
    insightCategoryFilter: 'all',
    risksChartType: 'line',
    showRisksCharts: true,
    riskCategoryFilter: 'all',
    riskLevelFilter: 'all'
  })

  // Touch/swipe handling state - separated for insights and risks
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 })
  const touchEndRef = useRef({ x: 0, y: 0, time: 0 })
  
  // Separate states for insights
  const [insightSwipeState, setInsightSwipeState] = useState({
    isSwipeGesture: false,
    swipeDirection: null, // 'left' | 'right' | null
    isAnimating: false,
    swipeProgress: 0 // 0 to 1 for animation progress
  })
  
  // Separate states for risks
  const [riskSwipeState, setRiskSwipeState] = useState({
    isSwipeGesture: false,
    swipeDirection: null, // 'left' | 'right' | null
    isAnimating: false,
    swipeProgress: 0 // 0 to 1 for animation progress
  })
  const selectedFrom = useMemo(() => {
    if (!activeHighlight) return null
    if (activeHighlight.startsWith('insight-')) {
      const idx = parseInt(activeHighlight.split('-')[1], 10)
      return { type: 'insight', index: isNaN(idx) ? null : idx }
    }
    if (activeHighlight.startsWith('risk-')) {
      const idx = parseInt(activeHighlight.split('-')[1], 10)
      return { type: 'risk', index: isNaN(idx) ? null : idx }
    }
    return null
  }, [activeHighlight])

  useEffect(() => {
    console.log('ProfessionalAnalysisDisplay - Full results:', results)
    console.log('ProfessionalAnalysisDisplay - Analysis data:', results?.analysis)

    if (!results?.analysis) return
    
    // Handle document changes - reset state only for truly new documents
    const newDocumentKey = generateDocumentKey(results)
    if (newDocumentKey !== currentDocumentKey) {
      console.log('New document detected, resetting analysis controls state')
      
      // Reset all settings to defaults for new document
      const defaults = loadFromStorage()
      setInsightsChartType(defaults.insightsChartType)
      setShowInsightsCharts(defaults.showInsightsCharts)
      setInsightCategoryFilter(defaults.insightCategoryFilter)
      setRisksChartType(defaults.risksChartType)
      setShowRisksCharts(defaults.showRisksCharts)
      setRiskCategoryFilter(defaults.riskCategoryFilter)
      setRiskLevelFilter(defaults.riskLevelFilter)
      
      setLocalInsightsChartType(defaults.insightsChartType)
      setLocalShowInsightsCharts(defaults.showInsightsCharts)
      setLocalInsightCategoryFilter(defaults.insightCategoryFilter)
      setLocalRisksChartType(defaults.risksChartType)
      setLocalShowRisksCharts(defaults.showRisksCharts)
      setLocalRiskCategoryFilter(defaults.riskCategoryFilter)
      setLocalRiskLevelFilter(defaults.riskLevelFilter)
      
      setInsightsDrawerOpen(false)
      setRisksDrawerOpen(false)
      setCurrentDocumentKey(newDocumentKey)
    } else {
      // Same document - load persisted settings if available
      const stored = loadFromStorage()
      if (stored) {
        setInsightsChartType(stored.insightsChartType)
        setShowInsightsCharts(stored.showInsightsCharts)
        setInsightCategoryFilter(stored.insightCategoryFilter)
        setRisksChartType(stored.risksChartType)
        setShowRisksCharts(stored.showRisksCharts)
        setRiskCategoryFilter(stored.riskCategoryFilter)
        setRiskLevelFilter(stored.riskLevelFilter)
        
        setLocalInsightsChartType(stored.insightsChartType)
        setLocalShowInsightsCharts(stored.showInsightsCharts)
        setLocalInsightCategoryFilter(stored.insightCategoryFilter)
        setLocalRisksChartType(stored.risksChartType)
        setLocalShowRisksCharts(stored.showRisksCharts)
        setLocalRiskCategoryFilter(stored.riskCategoryFilter)
        setLocalRiskLevelFilter(stored.riskLevelFilter)
      }
    }

    // Handle case where analysis might be a string instead of object
    let analysisData = results.analysis
    if (typeof analysisData === 'string') {
      console.log('Analysis is a string, attempting to parse JSON...')
      try {
        analysisData = JSON.parse(analysisData)
        console.log('Successfully parsed analysis JSON:', analysisData)
      } catch (e) {
        console.error('Failed to parse analysis JSON:', e)
        console.log('Raw analysis string:', analysisData)
        return
      }
    }

    // Process summary
    setSummary(analysisData.summary || '')

    // Process insights (key points)
    const processedInsights = (analysisData.key_points || []).map((point, index) => ({
      id: `insight-${index}`,
      text: typeof point === 'string' ? point : point.text,
      quote: typeof point === 'object' ? point.quote : '',
      position: typeof point === 'object' ? point.position : null,
      confidence: 'high',
      category: getInsightCategory(typeof point === 'string' ? point : point.text)
    }))
    setInsights(processedInsights)

    // Process risks
    const processedRisks = (analysisData.risk_flags || []).map((risk, index) => ({
      id: `risk-${index}`,
      text: typeof risk === 'string' ? risk : risk.text,
      quote: typeof risk === 'object' ? risk.quote : '',
      position: typeof risk === 'object' ? risk.position : null,
      severity: getRiskSeverity(typeof risk === 'string' ? risk : risk.text),
      category: getRiskCategory(typeof risk === 'string' ? risk : risk.text)
    }))
    setRisks(processedRisks)

    // Process key concepts
    const processedConcepts = (analysisData.key_concepts || []).map((concept, index) => ({
      id: `concept-${index}`,
      term: typeof concept === 'string' ? concept : concept.term,
      explanation: typeof concept === 'object' ? concept.explanation : 'No explanation provided'
    }))
    setKeyConcepts(processedConcepts)

    console.log('Processed key concepts:', processedConcepts)

    // Create highlights for text interaction
    const newHighlights = [
      ...processedInsights.filter(i => i.position?.found).map(i => ({
        id: i.id,
        type: 'insight',
        position: i.position,
        text: i.text,
        quote: i.quote
      })),
      ...processedRisks.filter(r => r.position?.found).map(r => ({
        id: r.id,
        type: 'risk',
        position: r.position,
        text: r.text,
        quote: r.quote
      }))
    ]
    setHighlights(newHighlights)

  }, [results, currentDocumentKey])
  
  // Filter data based on current filters
  const getFilteredInsights = (insights) => {
    if (!insights) return []
    
    let filtered = [...insights]
    
    // Apply category filter
    if (insightCategoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category?.toLowerCase() === insightCategoryFilter)
    }
    
    return filtered
  }
  
  const getFilteredRisks = (risks) => {
    if (!risks) return []
    
    let filtered = [...risks]
    
    // Apply category filter
    if (riskCategoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category?.toLowerCase() === riskCategoryFilter)
    }
    
    // Apply risk level filter
    if (riskLevelFilter !== 'all') {
      filtered = filtered.filter(item => item.severity?.toLowerCase() === riskLevelFilter)
    }
    
    return filtered
  }
  
  const filteredInsights = getFilteredInsights(insights)
  const filteredRisks = getFilteredRisks(risks)
  
  // Get chart data for insights
  const getInsightsChartData = () => {
    const categories = ['general', 'technical', 'legal', 'financial', 'strategic']
    const data = []

    categories.forEach(category => {
      const items = filteredInsights.filter(item => item.category?.toLowerCase() === category)
      const count = items.length
      
      if (count > 0) {
        data.push({
          category: category.charAt(0).toUpperCase() + category.slice(1),
          value: count,
          items: items
        })
      }
    })

    return data
  }
  
  // Get chart data for risks
  const getRisksChartData = () => {
    const categories = ['general', 'compliance', 'financial', 'security', 'operational']
    const data = []

    categories.forEach(category => {
      const items = filteredRisks.filter(item => item.category?.toLowerCase() === category)
      const criticalCount = items.filter(item => item.severity?.toLowerCase() === 'critical').length
      const highCount = items.filter(item => item.severity?.toLowerCase() === 'high').length
      const mediumCount = items.filter(item => item.severity?.toLowerCase() === 'medium').length
      const lowCount = items.filter(item => item.severity?.toLowerCase() === 'low').length
      const totalCount = items.length
      
      if (totalCount > 0) {
        data.push({
          category: category.charAt(0).toUpperCase() + category.slice(1),
          critical: criticalCount,
          high: highCount,
          medium: mediumCount,
          low: lowCount,
          total: totalCount,
          items: items
        })
      }
    })

    return data
  }

  // Scroll position tracking functions
  const saveScrollPosition = useCallback(() => {
    if (!containerRef.current) return
    
    const element = containerRef.current
    const scrollTop = element.scrollTop
    const scrollHeight = element.scrollHeight
    const clientHeight = element.clientHeight
    
    const scrollData = {
      scrollTop,
      scrollHeight,
      clientHeight,
      scrollPercentage: scrollHeight > clientHeight ? (scrollTop / (scrollHeight - clientHeight)) * 100 : 0,
      timestamp: Date.now()
    }
    
    scrollPositionRef.current = scrollData
    persistedState.current.scrollPosition = scrollData
  }, [])

  const restoreScrollPosition = useCallback(() => {
    if (!containerRef.current || !persistedState.current.scrollPosition) return
    
    const savedScroll = persistedState.current.scrollPosition
    const element = containerRef.current
    
    // Only restore if saved within last 10 minutes
    if (Date.now() - savedScroll.timestamp < 600000) {
      // Use percentage-based restoration with fallback attempts
      const restorePosition = (attempt = 0) => {
        if (attempt > 3) return
        
        setTimeout(() => {
          if (!containerRef.current) {
            restorePosition(attempt + 1)
            return
          }
          
          // Use percentage-based restoration for better consistency
          if (savedScroll.scrollPercentage > 0) {
            const maxScroll = element.scrollHeight - element.clientHeight
            const targetScroll = (savedScroll.scrollPercentage / 100) * maxScroll
            element.scrollTop = Math.max(0, Math.min(targetScroll, maxScroll))
          } else if (savedScroll.scrollTop !== undefined) {
            element.scrollTop = savedScroll.scrollTop
          }
        }, 100 + (attempt * 50))
      }
      
      restorePosition()
    }
  }, [])

  // Separate useEffect for initialization to avoid conflicts
  useEffect(() => {
    if (!persistedState.current.isInitialized) {
      // First time initialization - use persisted state if available
      setCurrentInsightIndex(persistedState.current.currentInsightIndex || 0)
      setCurrentRiskIndex(persistedState.current.currentRiskIndex || 0)
      if (persistedState.current.copiedItem) setCopiedItem(persistedState.current.copiedItem)
      if (persistedState.current.feedbackGiven) setFeedbackGiven(persistedState.current.feedbackGiven)
      
      // Restore scroll position after a brief delay to ensure content is loaded
      setTimeout(() => {
        restoreScrollPosition()
      }, 200)
      
      persistedState.current.isInitialized = true
    }
  }, [restoreScrollPosition]) // Run only once on mount

  // Save scroll position on scroll events
  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    
    const handleScroll = () => {
      saveScrollPosition()
    }
    
    element.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      element.removeEventListener('scroll', handleScroll)
    }
  }, [saveScrollPosition])

  // Save scroll position before component unmounts
  useEffect(() => {
    return () => {
      saveScrollPosition()
    }
  }, [saveScrollPosition])

  // Track if user manually changed pagination to avoid auto-sync conflicts
  const userNavigatedManually = useRef(false)
  const previousActiveHighlight = useRef(activeHighlight)

  // Only sync when activeHighlight changes due to external click AND user hasn't manually navigated
  useEffect(() => {
    // Only sync if activeHighlight actually changed (not just tab restoration)
    if (!activeHighlight || activeHighlight === previousActiveHighlight.current) {
      previousActiveHighlight.current = activeHighlight
      return
    }

    // Reset manual navigation flag when highlight changes
    userNavigatedManually.current = false
    previousActiveHighlight.current = activeHighlight

    if (activeHighlight.startsWith('insight-') && !userNavigatedManually.current) {
      const idx = parseInt(activeHighlight.split('-')[1], 10)
      if (!isNaN(idx)) {
        const bounded = Math.min(Math.max(0, idx), Math.max(insights.length - 1, 0))
        setCurrentInsightIndex(bounded)
      }
    } else if (activeHighlight.startsWith('risk-') && !userNavigatedManually.current) {
      const idx = parseInt(activeHighlight.split('-')[1], 10)
      if (!isNaN(idx)) {
        const bounded = Math.min(Math.max(0, idx), Math.max(risks.length - 1, 0))
        setCurrentRiskIndex(bounded)
      }
    }
  }, [activeHighlight, insights.length, risks.length])

  const getInsightCategory = (text) => {
    const lower = text.toLowerCase()
    if (lower.includes('financial') || lower.includes('money') || lower.includes('cost')) return 'financial'
    if (lower.includes('legal') || lower.includes('contract') || lower.includes('agreement')) return 'legal'
    if (lower.includes('technical') || lower.includes('system') || lower.includes('process')) return 'technical'
    if (lower.includes('strategic') || lower.includes('business') || lower.includes('objective')) return 'strategic'
    return 'general'
  }

  const getRiskSeverity = (text) => {
    const lower = text.toLowerCase()
    if (lower.includes('critical') || lower.includes('severe') || lower.includes('major')) return 'critical'
    if (lower.includes('significant') || lower.includes('important') || lower.includes('concerning')) return 'high'
    if (lower.includes('minor') || lower.includes('low') || lower.includes('potential')) return 'medium'
    return 'medium'
  }

  const getRiskCategory = (text) => {
    const lower = text.toLowerCase()
    if (lower.includes('compliance') || lower.includes('regulatory') || lower.includes('legal')) return 'compliance'
    if (lower.includes('financial') || lower.includes('cost') || lower.includes('budget')) return 'financial'
    if (lower.includes('security') || lower.includes('privacy') || lower.includes('data')) return 'security'
    if (lower.includes('operational') || lower.includes('process') || lower.includes('workflow')) return 'operational'
    return 'general'
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'financial': return <TrendingUp className="h-4 w-4" />
      case 'legal': return <Shield className="h-4 w-4" />
      case 'technical': return <Zap className="h-4 w-4" />
      case 'strategic': return <Target className="h-4 w-4" />
      case 'compliance': return <Shield className="h-4 w-4" />
      case 'security': return <Shield className="h-4 w-4" />
      case 'operational': return <Zap className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'financial': return 'emerald'
      case 'legal': return 'blue'
      case 'technical': return 'purple'
      case 'strategic': return 'orange'
      case 'compliance': return 'red'
      case 'security': return 'red'
      case 'operational': return 'yellow'
      default: return 'blue'
    }
  }

  const getCategoryBadgeClasses = (category) => {
    switch (category) {
      case 'financial':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
      case 'legal':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
      case 'technical':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
      case 'strategic':
        return 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300'
      case 'compliance':
        return 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
      case 'security':
        return 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
      case 'operational':
        return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
      default:
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
    }
  }

  const getCategoryIconClasses = (category) => {
    switch (category) {
      case 'financial':
        return 'bg-emerald-100 dark:bg-emerald-900/30'
      case 'legal':
        return 'bg-blue-100 dark:bg-blue-900/30'
      case 'technical':
        return 'bg-purple-100 dark:bg-purple-900/30'
      case 'strategic':
        return 'bg-orange-100 dark:bg-orange-900/30'
      case 'compliance':
        return 'bg-red-100 dark:bg-red-900/30'
      case 'security':
        return 'bg-red-100 dark:bg-red-900/30'
      case 'operational':
        return 'bg-yellow-100 dark:bg-yellow-900/30'
      default:
        return 'bg-blue-100 dark:bg-blue-900/30'
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'red'
      case 'high': return 'orange'
      case 'medium': return 'yellow'
      default: return 'gray'
    }
  }

  const getSeverityBadgeClasses = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
      case 'high':
        return 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300'
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
      default:
        return 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  const getSeverityIconClasses = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 dark:bg-red-900/30'
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900/30'
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30'
      default:
        return 'bg-gray-100 dark:bg-gray-900/30'
    }
  }

  // Persist state changes
  useEffect(() => {
    persistedState.current = {
      ...persistedState.current,
      currentInsightIndex,
      currentRiskIndex,
      copiedItem,
      feedbackGiven,
      insightsChartType,
      showInsightsCharts,
      insightCategoryFilter,
      risksChartType,
      showRisksCharts,
      riskCategoryFilter,
      riskLevelFilter
    }
  }, [currentInsightIndex, currentRiskIndex, copiedItem, feedbackGiven, insightsChartType, showInsightsCharts, insightCategoryFilter, risksChartType, showRisksCharts, riskCategoryFilter, riskLevelFilter])
  
  // Update local state when drawers open - cleaned up
  // This was handled in the separate useEffect hooks above
  
  // Save insights controls function
  const saveInsightsControls = () => {
    // Update main state
    setInsightsChartType(localInsightsChartType)
    setShowInsightsCharts(localShowInsightsCharts)
    setInsightCategoryFilter(localInsightCategoryFilter)
    
    // Save to localStorage for persistence across refreshes
    saveInsightsToStorage({
      insightsChartType: localInsightsChartType,
      showInsightsCharts: localShowInsightsCharts,
      insightCategoryFilter: localInsightCategoryFilter
    })
    
    setInsightsDrawerOpen(false)
  }
  
  // Save risks controls function
  const saveRisksControls = () => {
    // Update main state
    setRisksChartType(localRisksChartType)
    setShowRisksCharts(localShowRisksCharts)
    setRiskCategoryFilter(localRiskCategoryFilter)
    setRiskLevelFilter(localRiskLevelFilter)
    
    // Save to localStorage for persistence across refreshes
    saveRisksToStorage({
      risksChartType: localRisksChartType,
      showRisksCharts: localShowRisksCharts,
      riskCategoryFilter: localRiskCategoryFilter,
      riskLevelFilter: localRiskLevelFilter
    })
    
    setRisksDrawerOpen(false)
  }

  // Reset insights controls function
  const resetInsightsControls = () => {
    setIsInsightsResetting(true)

    // Reset insights local state to default options
    setLocalInsightsChartType('line')
    setLocalShowInsightsCharts(true)
    setLocalInsightCategoryFilter('all')

    // Force re-render of Select components
    setInsightsControlsKey(prev => prev + 1)

    // Remove reset feedback after a short delay
    setTimeout(() => {
      setIsInsightsResetting(false)
    }, 800)
  }
  
  // Reset risks controls function
  const resetRisksControls = () => {
    setIsRisksResetting(true)

    // Reset risks local state to default options
    setLocalRisksChartType('line')
    setLocalShowRisksCharts(true)
    setLocalRiskCategoryFilter('all')
    setLocalRiskLevelFilter('all')

    // Force re-render of Select components
    setRisksControlsKey(prev => prev + 1)

    // Remove reset feedback after a short delay
    setTimeout(() => {
      setIsRisksResetting(false)
    }, 800)
  }

  // Get current items for display (use filtered data)
  const currentInsight = filteredInsights[currentInsightIndex] || filteredInsights[0]
  const currentRisk = filteredRisks[currentRiskIndex] || filteredRisks[0]
  
  // Adjust indices if they're out of bounds due to filtering
  useEffect(() => {
    if (currentInsightIndex >= filteredInsights.length && filteredInsights.length > 0) {
      setCurrentInsightIndex(0)
    }
  }, [filteredInsights.length, currentInsightIndex])
  
  useEffect(() => {
    if (currentRiskIndex >= filteredRisks.length && filteredRisks.length > 0) {
      setCurrentRiskIndex(0)
    }
  }, [filteredRisks.length, currentRiskIndex])

  // Copy to clipboard function
  const handleCopy = async (text, itemId) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedItem(itemId)
      setTimeout(() => setCopiedItem(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  // Handle feedback
  const handleFeedback = (itemId, type) => {
    setFeedbackGiven(prev => ({
      ...prev,
      [itemId]: type
    }))
    // Here you could also send feedback to your analytics/backend
    console.log(`Feedback given for ${itemId}: ${type}`)

    // Send feedback to backend
    const feedbackType = type === 'positive' ? 'positive' : 'negative'
    const feedbackCategory = itemId.startsWith('insight-') ? 'insight' : 'risk'
    const message = itemId.startsWith('insight-') ? insights[parseInt(itemId.split('-')[1])].text : risks[parseInt(itemId.split('-')[1])].text

    axios.post(`${BASE_URL}/feedback`, {
      feedback_type: feedbackType,
      feedback_category: feedbackCategory,
      message: message
    }, {
      withCredentials: true
    }).then(response => {
      console.log('Feedback submitted:', response.data)
    }).catch(error => {
      console.error('Feedback error:', error)
    })
  }

  // Touch/swipe handling functions
  const handleTouchStart = (e, type) => {
    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }
    
    // Reset the appropriate swipe state
    if (type === 'insight') {
      setInsightSwipeState({
        isSwipeGesture: false,
        swipeDirection: null,
        isAnimating: false,
        swipeProgress: 0
      })
    } else {
      setRiskSwipeState({
        isSwipeGesture: false,
        swipeDirection: null,
        isAnimating: false,
        swipeProgress: 0
      })
    }
  }

  const handleTouchMove = (e, type) => {
    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    
    // Check if this is a horizontal swipe gesture
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY)
    const isSignificantMove = Math.abs(deltaX) > 10
    
    if (isHorizontalSwipe && isSignificantMove) {
      e.preventDefault() // Prevent scrolling during swipe
      
      // Set swipe direction
      const direction = deltaX > 0 ? 'right' : 'left'
      
      // Calculate progress (0 to 1) based on swipe distance
      const maxSwipeDistance = 100 // Maximum distance for full animation
      const progress = Math.min(Math.abs(deltaX) / maxSwipeDistance, 1)
      
      // Update the appropriate swipe state
      if (type === 'insight') {
        setInsightSwipeState({
          isSwipeGesture: true,
          swipeDirection: direction,
          isAnimating: false,
          swipeProgress: progress
        })
      } else {
        setRiskSwipeState({
          isSwipeGesture: true,
          swipeDirection: direction,
          isAnimating: false,
          swipeProgress: progress
        })
      }
    }
  }

  const handleTouchEnd = (e, type) => {
    const touch = e.changedTouches[0]
    touchEndRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }

    const deltaX = touchEndRef.current.x - touchStartRef.current.x
    const deltaY = touchEndRef.current.y - touchStartRef.current.y
    const deltaTime = touchEndRef.current.time - touchStartRef.current.time

    // Check if it's a valid swipe (horizontal movement > vertical, fast enough, long enough)
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY)
    const isQuickSwipe = deltaTime < 500
    const isLongEnoughSwipe = Math.abs(deltaX) > 50

    if (isHorizontalSwipe && isQuickSwipe && isLongEnoughSwipe) {
      // Determine if we should change index based on direction and current position
      let shouldNavigate = false
      
      if (type === 'insight') {
        // Set animating state for insights
        setInsightSwipeState(prev => ({ ...prev, isAnimating: true, swipeProgress: 1 }))
        
        if (deltaX > 0 && currentInsightIndex > 0) {
          // Swipe right - previous insight
          shouldNavigate = true
          setTimeout(() => {
            userNavigatedManually.current = true
            setCurrentInsightIndex(prev => Math.max(0, prev - 1))
          }, 150) // Delay to show animation
        } else if (deltaX < 0 && currentInsightIndex < filteredInsights.length - 1) {
          // Swipe left - next insight
          shouldNavigate = true
          setTimeout(() => {
            userNavigatedManually.current = true
            setCurrentInsightIndex(prev => Math.min(filteredInsights.length - 1, prev + 1))
          }, 150)
        }
        
        // Reset insight animation state
        setTimeout(() => {
          setInsightSwipeState({
            isSwipeGesture: false,
            swipeDirection: null,
            isAnimating: false,
            swipeProgress: 0
          })
        }, shouldNavigate ? 300 : 200)
        
      } else if (type === 'risk') {
        // Set animating state for risks
        setRiskSwipeState(prev => ({ ...prev, isAnimating: true, swipeProgress: 1 }))
        
        if (deltaX > 0 && currentRiskIndex > 0) {
          // Swipe right - previous risk
          shouldNavigate = true
          setTimeout(() => {
            userNavigatedManually.current = true
            setCurrentRiskIndex(prev => Math.max(0, prev - 1))
          }, 150)
        } else if (deltaX < 0 && currentRiskIndex < filteredRisks.length - 1) {
          // Swipe left - next risk
          shouldNavigate = true
          setTimeout(() => {
            userNavigatedManually.current = true
            setCurrentRiskIndex(prev => Math.min(filteredRisks.length - 1, prev + 1))
          }, 150)
        }
        
        // Reset risk animation state
        setTimeout(() => {
          setRiskSwipeState({
            isSwipeGesture: false,
            swipeDirection: null,
            isAnimating: false,
            swipeProgress: 0
          })
        }, shouldNavigate ? 300 : 200)
      }
    } else {
      // Reset if swipe wasn't completed
      if (type === 'insight') {
        setInsightSwipeState({
          isSwipeGesture: false,
          swipeDirection: null,
          isAnimating: false,
          swipeProgress: 0
        })
      } else {
        setRiskSwipeState({
          isSwipeGesture: false,
          swipeDirection: null,
          isAnimating: false,
          swipeProgress: 0
        })
      }
    }
  }
  
  // Chart Display Components
  const InsightsChartDisplay = ({ data, chartType }) => {
    if (!data || data.length === 0) return null;

    const processedData = data.map(item => ({
      category: item.category,
      value: item.value
    }));

    const colors = ['#10b981', '#059669', '#14b8a6', '#6ee7b7', '#34d399'];

    return (
      <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
        <div className="flex items-center gap-2 mb-3">
          <LineChart className="h-4 w-4 text-emerald-600" />
          <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
            Insights {chartType === 'line' ? 'Trend Analysis' : 'Distribution Analysis'}
          </h4>
        </div>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <ReLineChart 
                data={processedData}
                margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickMargin={10}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickMargin={5}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: 10 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981' }}
                  activeDot={{ r: 6 }}
                />
              </ReLineChart>
            ) : (
              <ScatterChart 
                margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis 
                  type="category" 
                  dataKey="category" 
                  name="Category" 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickMargin={10}
                />
                <YAxis 
                  type="number" 
                  dataKey="value" 
                  name="Value" 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickMargin={5}
                />
                <ZAxis 
                  type="number" 
                  dataKey="value" 
                  range={[50, 800]} 
                  name="Size" 
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: 10 }}
                />
                <Scatter 
                  name="Insights" 
                  data={processedData} 
                  fill="#10b981"
                >
                  {processedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Scatter>
              </ScatterChart>
            )}
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 text-center">
          Showing {filteredInsights.length} insights across {data.length} categories
        </p>
      </div>
    );
  };

  const RisksChartDisplay = ({ data, chartType }) => {
    if (!data || data.length === 0) return null;

    const processedData = data.map(item => ({
      category: item.category,
      critical: item.critical || 0,
      high: item.high || 0,
      medium: item.medium || 0,
      low: item.low || 0,
      total: item.total
    }));

    const colors = ['#dc2626', '#ea580c', '#f59e0b', '#84cc16', '#10b981'];
    const severityColors = {
      critical: '#dc2626',
      high: '#ea580c',
      medium: '#f59e0b',
      low: '#84cc16'
    };

    return (
      <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-red-600" />
          <h4 className="text-sm font-semibold text-red-800 dark:text-red-200">
            Risk Assessment {chartType === 'line' ? 'Trend Analysis' : 'Severity Distribution'}
          </h4>
        </div>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <ReLineChart 
                data={processedData}
                margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickMargin={10}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickMargin={5}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                  formatter={(value, name) => [
                    value,
                    name === 'total' ? 'Total Risks' :
                    name === 'critical' ? 'Critical Risks' :
                    name === 'high' ? 'High Risks' :
                    name === 'medium' ? 'Medium Risks' :
                    name === 'low' ? 'Low Risks' : name
                  ]}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: 10 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#dc2626" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#dc2626' }}
                  activeDot={{ r: 6 }}
                  name="Total Risks"
                />
                <Line 
                  type="monotone" 
                  dataKey="critical" 
                  stroke="#dc2626" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: '#dc2626' }}
                  name="Critical"
                />
                <Line 
                  type="monotone" 
                  dataKey="high" 
                  stroke="#ea580c" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: '#ea580c' }}
                  name="High"
                />
                <Line 
                  type="monotone" 
                  dataKey="medium" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={{ r: 3, fill: '#f59e0b' }}
                  name="Medium"
                />
                <Line 
                  type="monotone" 
                  dataKey="low" 
                  stroke="#84cc16" 
                  strokeWidth={2}
                  strokeDasharray="2 4"
                  dot={{ r: 3, fill: '#84cc16' }}
                  name="Low"
                />
              </ReLineChart>
            ) : (
              <ScatterChart 
                margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis 
                  type="category" 
                  dataKey="category" 
                  name="Category" 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickMargin={10}
                />
                <YAxis 
                  type="number" 
                  dataKey="total" 
                  name="Total Risks" 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickMargin={5}
                />
                <ZAxis 
                  type="number" 
                  dataKey="critical" 
                  range={[50, 400]} 
                  name="Critical Risks" 
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                  formatter={(value, name) => [
                    value,
                    name === 'Total Risks' ? 'Total Risks' :
                    name === 'Critical Risks' ? 'Critical Risks' :
                    name === 'critical' ? 'Critical Risks' :
                    name === 'high' ? 'High Risks' :
                    name === 'medium' ? 'Medium Risks' :
                    name === 'low' ? 'Low Risks' :
                    name === 'total' ? 'Total Risks' : name
                  ]}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: 10 }}
                />
                <Scatter 
                  name="Risk Distribution" 
                  data={processedData} 
                  fill="#dc2626"
                >
                  {processedData.map((entry, index) => {
                    // Color based on highest severity level
                    let color = '#84cc16'; // default green for low/no risk
                    if (entry.critical > 0) color = '#dc2626';
                    else if (entry.high > 0) color = '#ea580c';
                    else if (entry.medium > 0) color = '#f59e0b';
                    
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Scatter>
              </ScatterChart>
            )}
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-red-600 dark:text-red-400 mt-2 text-center">
          Showing {filteredRisks.length} risks across {data.length} categories
        </p>
      </div>
    );
  };

  // Insights Controls Drawer Component
  const InsightsControlsDrawer = () => (
    <>
      {/* Overlay */}
      {insightsDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          style={{
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            margin: 0,
            padding: 0
          }}
        />
      )}

      {/* Drawer */}
      <div
        ref={insightsDrawerRef}
        className={`fixed right-0 w-80 bg-white dark:bg-[#121212] shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          insightsDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ 
          top: 0,
          bottom: 0,
          height: '100vh',
          margin: 0,
          padding: 0
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                <Target className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Insights Controls
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Customize insights charts and filters
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInsightsDrawerOpen(false)}
              className="h-8 w-8 p-0 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div key={insightsControlsKey} className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Display Mode */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Display Mode</Label>
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <Switch
                  id="show-insights-charts"
                  checked={localShowInsightsCharts}
                  onCheckedChange={setLocalShowInsightsCharts}
                  className="data-[state=checked]:bg-emerald-600"
                />
                <Label htmlFor="show-insights-charts" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer font-medium">
                  {localShowInsightsCharts ? 'Charts View ' : 'List View '}
                </Label>
              </div>
            </div>

            {/* Chart Options */}
            {localShowInsightsCharts && (
              <>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Chart Type</Label>
                  <Select value={localInsightsChartType} onValueChange={setLocalInsightsChartType}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[60]">
                      <SelectItem value="line">
                        <div className="flex items-center gap-2">
                          <LineChart className="h-4 w-4" />
                          Line Chart
                        </div>
                      </SelectItem>
                      <SelectItem value="bubble">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Bubble Chart
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category Filter</Label>
                  <Select value={localInsightCategoryFilter} onValueChange={setLocalInsightCategoryFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[60]">
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="legal">Legal</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="strategic">Strategic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
            <div className="flex gap-2">
              <Button
                onClick={saveInsightsControls}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
                size="sm"
              >
                <Save className="h-3 w-3" />
                Save Changes
              </Button>
              <Button
                onClick={resetInsightsControls}
                variant="outline"
                size="sm"
                disabled={isInsightsResetting}
                className={`flex-1 flex items-center gap-2 transition-colors ${isInsightsResetting ? 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800' : ''}`}
              >
                <RotateCcw className={`h-3 w-3 ${isInsightsResetting ? 'animate-spin' : ''}`} />
                {isInsightsResetting ? 'Reset!' : 'Reset'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  // Risks Controls Drawer Component
  const RisksControlsDrawer = () => (
    <>
      {/* Overlay */}
      {risksDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          style={{
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            margin: 0,
            padding: 0
          }}
        />
      )}

      {/* Drawer */}
      <div
        ref={risksDrawerRef}
        className={`fixed right-0 w-80 bg-white dark:bg-[#121212] shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          risksDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ 
          top: 0,
          bottom: 0,
          height: '100vh',
          margin: 0,
          padding: 0
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Risks Controls
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Customize risks charts and filters
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRisksDrawerOpen(false)}
              className="h-8 w-8 p-0 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div key={risksControlsKey} className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Display Mode */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Display Mode</Label>
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 rounded-lg border border-red-200 dark:border-red-800">
                <Switch
                  id="show-risks-charts"
                  checked={localShowRisksCharts}
                  onCheckedChange={setLocalShowRisksCharts}
                  className="data-[state=checked]:bg-red-600"
                />
                <Label htmlFor="show-risks-charts" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer font-medium">
                  {localShowRisksCharts ? 'Charts View ' : 'List View '}
                </Label>
              </div>
            </div>

            {/* Chart Options */}
            {localShowRisksCharts && (
              <>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Chart Type</Label>
                  <Select value={localRisksChartType} onValueChange={setLocalRisksChartType}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[60]">
                      <SelectItem value="line">
                        <div className="flex items-center gap-2">
                          <LineChart className="h-4 w-4" />
                          Line Chart
                        </div>
                      </SelectItem>
                      <SelectItem value="bubble">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Bubble Chart
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category Filter</Label>
                  <Select value={localRiskCategoryFilter} onValueChange={setLocalRiskCategoryFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[60]">
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="operational">Operational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Risk Level</Label>
                  <Select value={localRiskLevelFilter} onValueChange={setLocalRiskLevelFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[60]">
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
            <div className="flex gap-2">
              <Button
                onClick={saveRisksControls}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                size="sm"
              >
                <Save className="h-3 w-3" />
                Save Changes
              </Button>
              <Button
                onClick={resetRisksControls}
                variant="outline"
                size="sm"
                disabled={isRisksResetting}
                className={`flex-1 flex items-center gap-2 transition-colors ${isRisksResetting ? 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800' : ''}`}
              >
                <RotateCcw className={`h-3 w-3 ${isRisksResetting ? 'animate-spin' : ''}`} />
                {isRisksResetting ? 'Reset!' : 'Reset'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <div ref={containerRef} className="space-y-4 sm:space-y-6 p-2 sm:p-4">
   

      {/* Key Insights Section */}
      <Card className="border-0 dark:bg-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                  Strategic Insights
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
                  Key findings from your document
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                {insights.length} insights
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInsightsDrawerOpen(true)}
                className="h-8 w-8 p-0 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0"
                title="Insights Controls"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.length > 0 ? (
            <>
              {/* Charts Display for Insights - Show only when charts are enabled */}
              {showInsightsCharts ? (
                <InsightsChartDisplay 
                  data={getInsightsChartData()} 
                  chartType={insightsChartType}
                />
              ) : currentInsight ? (
                <>
                  {/* Current Insight Display - Show only when charts are disabled */}
                  <div className="relative overflow-hidden">
                <Card
                  className={`transition-all duration-300 dark:bg-green-900/20 overflow-hidden touch-pan-y select-none ${highlights.find(h => h.id === currentInsight.id) ? 'hover:shadow-lg' : ''
                    } ${activeHighlight === currentInsight.id
                      ? 'ring-2 ring-emerald-400 dark:ring-emerald-500 shadow-lg bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700'
                      : 'border-slate-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600'
                    }`}
                  style={{
                    transform: insightSwipeState.isSwipeGesture && insightSwipeState.swipeDirection ? 
                      `translateX(${insightSwipeState.swipeDirection === 'right' ? insightSwipeState.swipeProgress * 20 : -insightSwipeState.swipeProgress * 20}px)` : 
                      'translateX(0)',
                    opacity: insightSwipeState.isSwipeGesture ? Math.max(0.7, 1 - insightSwipeState.swipeProgress * 0.3) : 1,
                    transition: insightSwipeState.isAnimating ? 'all 0.3s ease-out' : 'none'
                  }}
                  onTouchStart={(e) => handleTouchStart(e, 'insight')}
                  onTouchMove={(e) => handleTouchMove(e, 'insight')}
                  onTouchEnd={(e) => handleTouchEnd(e, 'insight')}
                >
                  {/* Swipe indicator overlay */}
                  {insightSwipeState.isSwipeGesture && insightSwipeState.swipeProgress > 0.2 && (
                    <div 
                      className={`absolute inset-0 flex items-center justify-center bg-emerald-500/10 dark:bg-emerald-400/10 pointer-events-none transition-opacity duration-200`}
                      style={{ opacity: insightSwipeState.swipeProgress }}
                    >
                      <div className={`flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium`}>
                        {insightSwipeState.swipeDirection === 'right' ? (
                          <>
                            <ChevronLeft className="h-5 w-5" />
                            <span className="text-sm">Previous</span>
                          </>
                        ) : (
                          <>
                            <span className="text-sm">Next</span>
                            <ChevronRight className="h-5 w-5" />
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <CardContent className="p-3 sm:p-5">
                  <div className="flex items-start gap-2 sm:gap-4">
                    <div className={`p-2 sm:p-2.5 ${getCategoryIconClasses(currentInsight.category)} rounded-lg flex-shrink-0`}>
                      {getCategoryIcon(currentInsight.category)}
                    </div>

                    <div className="flex-1 space-y-3 min-w-0">
                      {/* Mobile-first responsive layout */}
                      <div className="space-y-3">
                        {/* Badge and buttons row - mobile stacked, desktop inline */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                          <Badge
                            variant="outline"
                            className={`text-xs ${getCategoryBadgeClasses(currentInsight.category)} capitalize w-fit`}
                          >
                            {currentInsight.category}
                          </Badge>

                          {/* Copy and Feedback buttons - responsive sizing */}
                          <div className="flex gap-1 sm:gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(currentInsight.text, currentInsight.id)}
                              className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-emerald-100 dark:hover:bg-emerald-900/20"
                              title="Copy insight"
                            >
                              {copiedItem === currentInsight.id ? (
                                <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-600" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFeedback(currentInsight.id, 'positive')}
                              className={`h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-green-100 dark:hover:bg-green-900/20 ${feedbackGiven[currentInsight.id] === 'positive' ? 'bg-green-100 dark:bg-green-900/20' : ''
                                }`}
                              title="Helpful insight"
                            >
                              <ThumbsUp className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${feedbackGiven[currentInsight.id] === 'positive' ? 'text-green-600' : 'text-gray-500'
                                }`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFeedback(currentInsight.id, 'negative')}
                              className={`h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-red-100 dark:hover:bg-red-900/20 ${feedbackGiven[currentInsight.id] === 'negative' ? 'bg-red-100 dark:bg-red-900/20' : ''
                                }`}
                              title="Not helpful"
                            >
                              <ThumbsDown className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${feedbackGiven[currentInsight.id] === 'negative' ? 'text-red-600' : 'text-gray-500'
                                }`} />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Content text - full width with proper word wrapping */}
                        <div className="text-slate-800 dark:text-slate-100 leading-relaxed font-medium text-sm break-words overflow-hidden">
                          <MarkdownRenderer content={currentInsight.text} />
                        </div>
                      </div>

                      {highlights.find(h => h.id === currentInsight.id) && (
                        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-gray-600">
                          {/* Highlight button - full width on mobile */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto text-xs bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (activeHighlight === currentInsight.id) {
                                onActiveHighlightChange?.(null)

                                const hasHighlight = highlights.find(h => h.id === currentInsight.id);
                                hasHighlight && onHighlightClick(currentInsight.id);
                              } else {
                                onHighlightClick(currentInsight.id)
                              }
                            }}
                          >
                            <Search className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 sm:mr-1.5" />
                            <span className="text-xs sm:text-sm">
                              {activeHighlight === currentInsight.id ? 'Hide highlight' : 'Show in document'}
                            </span>
                            <ArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 ml-1 sm:ml-1.5" />
                          </Button>

                          {/* Quote - separate line on mobile for better readability */}
                          {currentInsight.quote && (
                            <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-gray-400 px-2 py-1 bg-slate-50 dark:bg-emerald-900 rounded">
                              <div className="w-1 h-1 bg-slate-400 rounded-full mt-1.5 flex-shrink-0"></div>
                              <span className="italic break-words">
                                "{currentInsight.quote.length > 60 
                                  ? `${currentInsight.quote.substring(0, 60)}...` 
                                  : currentInsight.quote}"
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  </CardContent>
                </Card>
              </div>


                  {/* Insights Pagination - Show only when charts are disabled */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 pt-3 border-t border-slate-200 dark:border-gray-700">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        userNavigatedManually.current = true
                        setCurrentInsightIndex(prev => {
                          const newIdx = Math.max(0, prev - 1)
                          if (selectedFrom && selectedFrom.type === 'insight' && selectedFrom.index !== newIdx) {
                            onActiveHighlightChange?.(null)
                          }
                          return newIdx
                        })
                      }}
                      disabled={currentInsightIndex === 0}
                      className="hidden sm:flex text-xs sm:text-sm w-full sm:w-auto"
                    >
                      <ChevronLeft className="h-3 w-3 mr-1" />
                      Previous
                    </Button>
                    <div className="text-center order-first sm:order-none">
                      <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white">
                        Insight {currentInsightIndex + 1} of {filteredInsights.length}
                      </p>
                      
                      <div className="flex gap-1 mt-1 justify-center">
                        {filteredInsights.map((_, index) => (
                          <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${index === currentInsightIndex
                              ? 'bg-emerald-500'
                              : 'bg-slate-300 dark:bg-gray-600 hover:bg-emerald-300'
                              }`}
                            onClick={() => {
                              userNavigatedManually.current = true
                              setCurrentInsightIndex(index)
                            }}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-gray-400 sm:hidden mt-0.5">
                        Swipe left/right to navigate
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        userNavigatedManually.current = true
                        setCurrentInsightIndex(prev => {
                          const newIdx = Math.min(filteredInsights.length - 1, prev + 1)
                          if (selectedFrom && selectedFrom.type === 'insight' && selectedFrom.index !== newIdx) {
                            onActiveHighlightChange?.(null)
                          }
                          return newIdx
                        })
                      }}
                      disabled={currentInsightIndex === filteredInsights.length - 1}
                      className="hidden sm:flex text-xs sm:text-sm w-full sm:w-auto"
                    >
                      Next
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </>
              ) : null}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="p-4 bg-slate-100 dark:bg-gray-700 rounded-full w-fit mx-auto mb-4">
                <Target className="h-8 w-8 text-slate-400 dark:text-gray-500" />
              </div>
              <p className="text-slate-600 dark:text-gray-400">
                No strategic insights identified yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="my-4" />

      {/* Risk Assessment Section */}
      <Card className="border-0 shadow-lg dark:bg-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl shadow-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                  Risk Assessment
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
                  Potential risks and concerns identified
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${risks.length === 0
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                {risks.length === 0 ? 'Low Risk' : `${risks.length} risks `}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRisksDrawerOpen(true)}
                className="h-8 w-8 p-0 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0"
                title="Risks Controls"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {risks.length > 0 ? (
            <>
              {/* Charts Display for Risks - Show only when charts are enabled */}
              {showRisksCharts ? (
                <RisksChartDisplay 
                  data={getRisksChartData()} 
                  chartType={risksChartType}
                />
              ) : currentRisk ? (
                <>
                  {/* Current Risk Display - Show only when charts are disabled */}
                  <div className="relative overflow-hidden">
                <Alert
                  className={`transition-all duration-300 overflow-hidden touch-pan-y select-none ${highlights.find(h => h.id === currentRisk.id) ? ' hover:shadow-lg' : ''
                    } ${activeHighlight === currentRisk.id
                      ? 'ring-2 ring-red-400 dark:ring-red-500 shadow-lg bg-red-50/50 dark:bg-red-950/30 border-red-300 dark:border-red-600'
                      : 'border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-600'
                    } bg-gradient-to-r from-red-50/80 to-orange-50/80 dark:from-red-950/20 dark:to-orange-950/20`}
                  style={{
                    transform: riskSwipeState.isSwipeGesture && riskSwipeState.swipeDirection ? 
                      `translateX(${riskSwipeState.swipeDirection === 'right' ? riskSwipeState.swipeProgress * 20 : -riskSwipeState.swipeProgress * 20}px)` : 
                      'translateX(0)',
                    opacity: riskSwipeState.isSwipeGesture ? Math.max(0.7, 1 - riskSwipeState.swipeProgress * 0.3) : 1,
                    transition: riskSwipeState.isAnimating ? 'all 0.3s ease-out' : 'none'
                  }}
                  onTouchStart={(e) => handleTouchStart(e, 'risk')}
                  onTouchMove={(e) => handleTouchMove(e, 'risk')}
                  onTouchEnd={(e) => handleTouchEnd(e, 'risk')}
                >
                  {/* Swipe indicator overlay */}
                  {riskSwipeState.isSwipeGesture && riskSwipeState.swipeProgress > 0.2 && (
                    <div 
                      className={`absolute inset-0 flex items-center justify-center bg-red-500/10 dark:bg-red-400/10 pointer-events-none transition-opacity duration-200`}
                      style={{ opacity: riskSwipeState.swipeProgress }}
                    >
                      <div className={`flex items-center gap-2 text-red-600 dark:text-red-400 font-medium`}>
                        {riskSwipeState.swipeDirection === 'right' ? (
                          <>
                            <ChevronLeft className="h-5 w-5" />
                            <span className="text-sm">Previous</span>
                          </>
                        ) : (
                          <>
                            <span className="text-sm">Next</span>
                            <ChevronRight className="h-5 w-5" />
                          </>
                        )}
                      </div>
                    </div>
                  )}
                <div className="flex items-start gap-2 sm:gap-4 p-3 sm:p-4">
                  <div className={`p-2 sm:p-2.5 ${getSeverityIconClasses(currentRisk.severity)} rounded-lg flex-shrink-0`}>
                    <AlertTriangle className={`h-4 w-4 sm:h-5 sm:w-5 text-${getSeverityColor(currentRisk.severity)}-600 dark:text-${getSeverityColor(currentRisk.severity)}-400`} />
                  </div>

                  <div className="flex-1 space-y-3 min-w-0">
                    {/* Mobile-first responsive layout */}
                    <div className="space-y-3">
                      {/* Badges and buttons row - mobile stacked, desktop inline */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                        <div className="flex flex-wrap gap-1.5">
                          <Badge
                            variant="outline"
                            className={`text-xs ${getCategoryBadgeClasses(currentRisk.category)} capitalize w-fit`}
                          >
                            {currentRisk.category}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getSeverityBadgeClasses(currentRisk.severity)} capitalize w-fit`}
                          >
                            {currentRisk.severity}
                          </Badge>
                        </div>

                        {/* Copy and Feedback buttons - responsive sizing */}
                        <div className="flex gap-1 sm:gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(currentRisk.text, currentRisk.id)}
                            className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                            title="Copy risk"
                          >
                            {copiedItem === currentRisk.id ? (
                              <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-600" />
                            ) : (
                              <Copy className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-600" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFeedback(currentRisk.id, 'positive')}
                            className={`h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-green-100 dark:hover:bg-green-900/20 ${feedbackGiven[currentRisk.id] === 'positive' ? 'bg-green-100 dark:bg-green-900/20' : ''
                              }`}
                            title="Accurate risk assessment"
                          >
                            <ThumbsUp className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${feedbackGiven[currentRisk.id] === 'positive' ? 'text-green-600' : 'text-gray-500'
                              }`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFeedback(currentRisk.id, 'negative')}
                            className={`h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-red-100 dark:hover:bg-red-900/20 ${feedbackGiven[currentRisk.id] === 'negative' ? 'bg-red-100 dark:bg-red-900/20' : ''
                              }`}
                            title="Inaccurate assessment"
                          >
                            <ThumbsDown className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${feedbackGiven[currentRisk.id] === 'negative' ? 'text-red-600' : 'text-gray-500'
                              }`} />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Content text - full width with proper word wrapping */}
                      <AlertDescription className="text-red-800 dark:text-red-200 leading-relaxed font-medium text-sm break-words overflow-hidden">
                        <MarkdownRenderer content={currentRisk.text} />
                      </AlertDescription>
                    </div>

                    {highlights.find(h => h.id === currentRisk.id) && (
                      <div className="space-y-2 pt-2 border-t border-red-200 dark:border-red-700">
                        {/* Highlight button - full width on mobile */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto text-xs bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 border-red-300 dark:border-red-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (activeHighlight === currentRisk.id) {
                              onActiveHighlightChange?.(null)

                              const hasHighlight = highlights.find(h => h.id === currentRisk.id);
                              hasHighlight && onHighlightClick(currentRisk.id);
                            } else {
                              onHighlightClick(currentRisk.id)
                            }
                          }}
                        >
                          <Search className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 sm:mr-1.5" />
                          <span className="text-xs sm:text-sm">
                            {activeHighlight === currentRisk.id ? 'Hide highlight' : 'Show in document'}
                          </span>
                          <ArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 ml-1 sm:ml-1.5" />
                        </Button>

                        {/* Quote - separate line on mobile for better readability */}
                        {currentRisk.quote && (
                          <div className="flex items-start gap-2 text-xs text-red-700 dark:text-red-300 px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded">
                            <div className="w-1 h-1 bg-red-400 rounded-full mt-1.5 flex-shrink-0"></div>
                            <span className="italic break-words">
                              "{currentRisk.quote.length > 60 
                                ? `${currentRisk.quote.substring(0, 60)}...` 
                                : currentRisk.quote}"
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                </Alert>
              </div>


                  {/* Risks Pagination - Show only when charts are disabled */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 pt-3 border-t border-red-200 dark:border-red-700">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        userNavigatedManually.current = true
                        setCurrentRiskIndex(prev => {
                          const newIdx = Math.max(0, prev - 1)
                          if (selectedFrom && selectedFrom.type === 'risk' && selectedFrom.index !== newIdx) {
                            onActiveHighlightChange?.(null)
                          }
                          return newIdx
                        })
                      }}
                      disabled={currentRiskIndex === 0}
                      className="hidden sm:flex text-xs sm:text-sm w-full sm:w-auto"
                    >
                      <ChevronLeft className="h-3 w-3 mr-1" />
                      Previous
                    </Button>
                    <div className="text-center order-first sm:order-none">
                      <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white">
                        Risk {currentRiskIndex + 1} of {filteredRisks.length}
                      </p>
                      
                      <div className="flex gap-1 mt-1 justify-center">
                        {filteredRisks.map((_, index) => (
                          <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${index === currentRiskIndex
                              ? 'bg-red-500'
                              : 'bg-slate-300 dark:bg-gray-600 hover:bg-red-300'
                              }`}
                            onClick={() => {
                              userNavigatedManually.current = true
                              setCurrentRiskIndex(index)
                            }}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-gray-400 sm:hidden mt-0.5">
                        Swipe left/right to navigate
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        userNavigatedManually.current = true
                        setCurrentRiskIndex(prev => {
                          const newIdx = Math.min(filteredRisks.length - 1, prev + 1)
                          if (selectedFrom && selectedFrom.type === 'risk' && selectedFrom.index !== newIdx) {
                            onActiveHighlightChange?.(null)
                          }
                          return newIdx
                        })
                      }}
                      disabled={currentRiskIndex === filteredRisks.length - 1}
                      className="hidden sm:flex text-xs sm:text-sm w-full sm:w-auto"
                    >
                      Next
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </>
              ) : null}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-2xl p-8">
                <div className="p-4 bg-green-100 dark:bg-green-900/40 rounded-full w-fit mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-green-800 dark:text-green-200 mb-2">
                  No Significant Risks Detected
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  The document appears to be low risk based on our comprehensive AI analysis.
                </p>
                <Badge className="mt-3 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <Star className="h-3 w-3 mr-1" />
                  All Clear
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Separate Controls Drawers */}
      <InsightsControlsDrawer />
      <RisksControlsDrawer />
    </div>
  )
}

export default ProfessionalAnalysisDisplay