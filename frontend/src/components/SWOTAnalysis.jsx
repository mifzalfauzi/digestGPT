"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Button } from "./ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Switch } from "./ui/switch"
import { Label } from "./ui/label"
import {
  TrendingUp,
  AlertTriangle,
  Target,
  Shield,
  Zap,
  Eye,
  Users,
  DollarSign,
  Globe,
  Clock,
  ChevronLeft,
  ChevronRight,
  Building2,
  Factory,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Check,
  BookOpen,
  Grid3X3,
  List,
  MoreHorizontal,
  BarChart3,
  LineChart,
  Filter,
  Settings,
  X,
  Save,
  RotateCcw,
} from "lucide-react"
import { Separator } from "./ui/separator"
import axios from "axios"


export default function SWOTAnalysis({ swot, isDemoMode = false, bypassAPI = false }) {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL
  
  // Generate document-specific storage key
  const generateDocumentKey = (swotData) => {
    if (!swotData) return 'swot-controls-default'
    
    // Create a simple hash from the SWOT data to identify unique documents
    const dataString = JSON.stringify(swotData)
    let hash = 0
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return `swot-controls-${Math.abs(hash)}`
  }
  
  const STORAGE_KEY = generateDocumentKey(swot)
  const [currentDocumentKey, setCurrentDocumentKey] = useState(STORAGE_KEY)

  // Load settings from localStorage for current document
  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem(currentDocumentKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        return {
          chartType: parsed.chartType || 'line',
          priorityFilter: parsed.priorityFilter || 'all',
          categoryFilter: parsed.categoryFilter || 'all',
          itemCategoryFilter: parsed.itemCategoryFilter || 'all',
          showCharts: parsed.showCharts !== undefined ? parsed.showCharts : true,
          activeSwotTab: parsed.activeSwotTab || 'strengths',
          viewMode: parsed.viewMode || 'list'
        }
      }
    } catch (error) {
      console.warn('Failed to load SWOT settings from localStorage:', error)
    }
    return {
      chartType: 'line',
      priorityFilter: 'all',
      categoryFilter: 'all',
      itemCategoryFilter: 'all',
      showCharts: true,
      activeSwotTab: 'strengths',
      viewMode: 'list'
    }
  }

  // Save settings to localStorage for current document
  const saveToStorage = (settings) => {
    try {
      localStorage.setItem(currentDocumentKey, JSON.stringify(settings))
    } catch (error) {
      console.warn('Failed to save SWOT settings to localStorage:', error)
    }
  }

  // Initialize with stored values
  const storedSettings = loadFromStorage()

  // Simple persistence using ref with default values
  const persistedState = useRef({
    currentPage: {
      strengths: 0,
      weaknesses: 0,
      opportunities: 0,
      threats: 0,
    },
    activeSwotTab: storedSettings.activeSwotTab,
    viewMode: storedSettings.viewMode,
    copiedItems: new Set(),
    itemRatings: {},
    chartType: storedSettings.chartType,
    priorityFilter: storedSettings.priorityFilter,
    categoryFilter: storedSettings.categoryFilter,
    itemCategoryFilter: storedSettings.itemCategoryFilter,
    showCharts: storedSettings.showCharts,
    localChartType: storedSettings.chartType,
    localPriorityFilter: storedSettings.priorityFilter,
    localCategoryFilter: storedSettings.categoryFilter,
    localItemCategoryFilter: storedSettings.itemCategoryFilter,
    localShowCharts: storedSettings.showCharts,
    controlsKey: 0,
    isInitialized: false
  })

  // FIXED: Initialize states with persisted values
  const [currentPage, setCurrentPage] = useState(persistedState.current.currentPage)
  const [activeSwotTab, setActiveSwotTab] = useState(persistedState.current.activeSwotTab)
  const [copiedItems, setCopiedItems] = useState(persistedState.current.copiedItems)
  const [itemRatings, setItemRatings] = useState(persistedState.current.itemRatings)
  const [viewMode, setViewMode] = useState(persistedState.current.viewMode)
  const [viewMenuOpen, setViewMenuOpen] = useState(false) // Always start closed
  const [controlsDrawerOpen, setControlsDrawerOpen] = useState(false) // Always start closed
  const controlsDrawerRef = useRef(null)
  const viewMenuRef = useRef(null)
  const [controlsKey, setControlsKey] = useState(persistedState.current.controlsKey)
  const [isResetting, setIsResetting] = useState(false) // Always start false

  // FIXED: Chart and filtering state - Initialize with persisted values
  const [chartType, setChartType] = useState(persistedState.current.chartType)
  const [priorityFilter, setPriorityFilter] = useState(persistedState.current.priorityFilter)
  const [categoryFilter, setCategoryFilter] = useState(persistedState.current.categoryFilter)
  const [itemCategoryFilter, setItemCategoryFilter] = useState(persistedState.current.itemCategoryFilter)
  const [showCharts, setShowCharts] = useState(persistedState.current.showCharts)

  // FIXED: Local state for drawer controls - Initialize with persisted values
  const [localChartType, setLocalChartType] = useState(persistedState.current.localChartType)
  const [localPriorityFilter, setLocalPriorityFilter] = useState(persistedState.current.localPriorityFilter)
  const [localCategoryFilter, setLocalCategoryFilter] = useState(persistedState.current.localCategoryFilter)
  const [localItemCategoryFilter, setLocalItemCategoryFilter] = useState(persistedState.current.localItemCategoryFilter)
  const [localShowCharts, setLocalShowCharts] = useState(persistedState.current.localShowCharts)

  const ITEMS_PER_PAGE = 3

  // Persist state changes (but exclude temporary UI states)
  useEffect(() => {
    persistedState.current = {
      ...persistedState.current,
      currentPage,
      activeSwotTab,
      viewMode,
      copiedItems,
      itemRatings,
      chartType,           // ✅ Persist user's chart choice
      priorityFilter,      // ✅ Persist user's filter choice
      categoryFilter,      // ✅ Persist user's category choice
      itemCategoryFilter,  // ✅ Persist user's item category choice
      showCharts,          // ✅ Persist user's display preference
      localChartType,      // ✅ Persist drawer state
      localPriorityFilter, // ✅ Persist drawer state
      localCategoryFilter, // ✅ Persist drawer state
      localItemCategoryFilter, // ✅ Persist drawer state
      localShowCharts,     // ✅ Persist drawer state
      controlsKey,
      isInitialized: true
      // Note: controlsDrawerOpen is NOT persisted - drawer always starts closed
    }
  }, [currentPage, activeSwotTab, viewMode, copiedItems, itemRatings, chartType, priorityFilter, categoryFilter, itemCategoryFilter, showCharts, localChartType, localPriorityFilter, localCategoryFilter, localItemCategoryFilter, localShowCharts, controlsKey])

  // Handle clicking outside the view menu to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (viewMenuRef.current && !viewMenuRef.current.contains(event.target)) {
        setViewMenuOpen(false)
      }
    }

    if (viewMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [viewMenuOpen])

  // Handle document changes - reset state only for truly new documents
  useEffect(() => {
    const newDocumentKey = generateDocumentKey(swot)
    
    // Only reset if this is a genuinely different document
    if (newDocumentKey !== currentDocumentKey) {
      console.log('New document detected, resetting SWOT drawer state')
      
      // Reset all settings to defaults for new document
      const defaults = {
        chartType: 'line',
        priorityFilter: 'all',
        categoryFilter: 'all',
        itemCategoryFilter: 'all',
        showCharts: true,
        activeSwotTab: 'strengths',
        viewMode: 'list'
      }
      
      setChartType(defaults.chartType)
      setPriorityFilter(defaults.priorityFilter)
      setCategoryFilter(defaults.categoryFilter)
      setItemCategoryFilter(defaults.itemCategoryFilter)
      setShowCharts(defaults.showCharts)
      setActiveSwotTab(defaults.activeSwotTab)
      setViewMode(defaults.viewMode)
      
      setLocalChartType(defaults.chartType)
      setLocalPriorityFilter(defaults.priorityFilter)
      setLocalCategoryFilter(defaults.categoryFilter)
      setLocalItemCategoryFilter(defaults.itemCategoryFilter)
      setLocalShowCharts(defaults.showCharts)
      
      // Close controls drawer if open
      setControlsDrawerOpen(false)
      
      // Update current document key
      setCurrentDocumentKey(newDocumentKey)
    } else {
      // Same document - load persisted settings if available
      const stored = loadFromStorage()
      if (stored) {
        setChartType(stored.chartType)
        setPriorityFilter(stored.priorityFilter)
        setCategoryFilter(stored.categoryFilter)
        setItemCategoryFilter(stored.itemCategoryFilter)
        setShowCharts(stored.showCharts)
        setActiveSwotTab(stored.activeSwotTab)
        setViewMode(stored.viewMode)
        
        setLocalChartType(stored.chartType)
        setLocalPriorityFilter(stored.priorityFilter)
        setLocalCategoryFilter(stored.categoryFilter)
        setLocalItemCategoryFilter(stored.itemCategoryFilter)
        setLocalShowCharts(stored.showCharts)
      }
    }
  }, [swot, currentDocumentKey])

  // Auto-save activeSwotTab to localStorage when it changes
  useEffect(() => {
    if (currentDocumentKey) {
      const currentSettings = loadFromStorage()
      saveToStorage({
        ...currentSettings,
        activeSwotTab: activeSwotTab
      })
    }
  }, [activeSwotTab, currentDocumentKey])

  // Auto-save viewMode to localStorage when it changes
  useEffect(() => {
    if (currentDocumentKey) {
      const currentSettings = loadFromStorage()
      saveToStorage({
        ...currentSettings,
        viewMode: viewMode
      })
    }
  }, [viewMode, currentDocumentKey])

  // Update local state when drawer opens or main state changes
  useEffect(() => {
    if (controlsDrawerOpen) {
      setLocalChartType(chartType)
      setLocalPriorityFilter(priorityFilter)
      setLocalCategoryFilter(categoryFilter)
      setLocalItemCategoryFilter(itemCategoryFilter)
      setLocalShowCharts(showCharts)
    }
  }, [controlsDrawerOpen, chartType, priorityFilter, categoryFilter, itemCategoryFilter, showCharts])

  // Save controls function
  const saveControls = () => {
    // Update main state
    setChartType(localChartType)
    setPriorityFilter(localPriorityFilter)
    setCategoryFilter(localCategoryFilter)
    setItemCategoryFilter(localItemCategoryFilter)
    setShowCharts(localShowCharts)
    
    // Save to localStorage for persistence across refreshes (only controls, not UI state)
    saveToStorage({
      chartType: localChartType,
      priorityFilter: localPriorityFilter,
      categoryFilter: localCategoryFilter,
      itemCategoryFilter: localItemCategoryFilter,
      showCharts: localShowCharts,
      activeSwotTab: activeSwotTab,  // Keep current active tab
      viewMode: viewMode  // Keep current view mode
    })
    
    setControlsDrawerOpen(false)
  }

  // Reset controls function - Resets to defaults
  const resetControls = () => {
    setIsResetting(true)

    // Reset all local state to default options
    setLocalChartType('line')
    setLocalPriorityFilter('all')
    setLocalCategoryFilter('all')
    setLocalItemCategoryFilter('all')
    setLocalShowCharts(true)

    // Force re-render of Select components
    setControlsKey(prev => prev + 1)

    // Remove reset feedback after a short delay
    setTimeout(() => {
      setIsResetting(false)
    }, 800)
  }

  // Enhanced mock SWOT data
  const mockSWOTData = {
    strengths: [
      {
        title: "Advanced AI Technology",
        description: "Proprietary machine learning algorithms with 40% higher accuracy than industry standard, backed by 15 patents",
        impact: "high",
        category: "technology",
      },
      {
        title: "Strong Financial Position",
        description: "18-month operational runway with 35% YoY revenue growth and positive cash flow",
        impact: "high",
        category: "financial",
      },
      {
        title: "Premium Customer Retention",
        description: "Industry-leading 95% customer retention rate with NPS score of 68",
        impact: "high",
        category: "market",
      },
      {
        title: "Strategic Partnerships",
        description: "Established relationships with 12 Fortune 500 companies including multi-year contracts",
        impact: "medium",
        category: "business",
      },
      {
        title: "Innovation Pipeline",
        description: "Active R&D program with 25+ patents pending and partnerships with leading universities",
        impact: "high",
        category: "technology",
      },
      {
        title: "Expert Team",
        description: "World-class leadership team with 80+ years combined experience from top tech companies",
        impact: "medium",
        category: "business",
      },
    ],
    weaknesses: [
      {
        title: "Geographic Concentration",
        description: "85% of revenue concentrated in North America, creating vulnerability to regional downturns",
        impact: "medium",
        category: "market",
      },
      {
        title: "Talent Shortage",
        description: "Difficulty recruiting senior AI engineers with 6-month average time-to-fill",
        impact: "high",
        category: "operational",
      },
      {
        title: "Customer Dependency",
        description: "Top 3 enterprise clients represent 45% of total revenue",
        impact: "high",
        category: "business",
      },
      {
        title: "Infrastructure Limits",
        description: "Current cloud infrastructure requires $3M investment for 10x user growth",
        impact: "medium",
        category: "technology",
      },
      {
        title: "Brand Recognition",
        description: "Limited brand awareness at 12% compared to competitors at 35%+",
        impact: "medium",
        category: "market",
      },
    ],
    opportunities: [
      {
        title: "Asia Market Expansion",
        description: "Untapped $2.8B market opportunity with 200% YoY growth in AI adoption",
        impact: "high",
        category: "market",
      },
      {
        title: "Healthcare AI Growth",
        description: "Emerging $45B healthcare AI market with increasing demand for automation",
        impact: "high",
        category: "industry",
      },
      {
        title: "ESG Investment Wave",
        description: "Growing $35T ESG investment market aligned with our sustainable framework",
        impact: "medium",
        category: "financial",
      },
      {
        title: "Strategic Acquisitions",
        description: "Market consolidation creating opportunities to acquire complementary technologies",
        impact: "high",
        category: "business",
      },
      {
        title: "Enterprise Transformation",
        description: "$3.9T enterprise digital transformation spending with 78% prioritizing AI",
        impact: "high",
        category: "market",
      },
      {
        title: "Government Initiatives",
        description: "$2B in government AI spending programs creating public sector opportunities",
        impact: "medium",
        category: "regulatory",
      },
    ],
    threats: [
      {
        title: "Big Tech Competition",
        description: "Google, Microsoft, and Amazon increasing AI investments by $50B+ collectively",
        impact: "high",
        category: "competitive",
      },
      {
        title: "Regulatory Uncertainty",
        description: "Pending EU AI Act could require $2M+ compliance investment",
        impact: "medium",
        category: "regulatory",
      },
      {
        title: "Economic Recession",
        description: "Potential recession could reduce enterprise AI spending by 30-40%",
        impact: "high",
        category: "market",
      },
      {
        title: "Cybersecurity Risks",
        description: "AI systems increasingly targeted with potential $4.5M average breach cost",
        impact: "medium",
        category: "operational",
      },
      {
        title: "Talent War",
        description: "Top AI talent costs increasing 25% YoY with $500K+ competitive packages",
        impact: "high",
        category: "operational",
      },
    ],
  }

  const swotData = isDemoMode || bypassAPI ? mockSWOTData : swot || mockSWOTData

  // Filter data based on current filters
  const getFilteredData = (data) => {
    if (!data) return { strengths: [], weaknesses: [], opportunities: [], threats: [] }

    const categories = ['strengths', 'weaknesses', 'opportunities', 'threats']
    const filtered = {}

    categories.forEach(category => {
      let items = data[category] || []

      // Apply priority filter
      if (priorityFilter !== 'all') {
        items = items.filter(item => item.impact?.toLowerCase() === priorityFilter)
      }

      // Apply category filter (for SWOT categories)
      if (categoryFilter !== 'all' && categoryFilter !== category) {
        items = []
      }

      // Apply item category filter (for technology, competitive, etc.)
      if (itemCategoryFilter !== 'all') {
        items = items.filter(item => item.category?.toLowerCase() === itemCategoryFilter)
      }

      filtered[category] = items
    })

    return filtered
  }

  const filteredSwotData = getFilteredData(swotData)

  // Get chart data for visualization
  const getChartData = () => {
    const categories = ['strengths', 'weaknesses', 'opportunities', 'threats']
    const data = []

    categories.forEach(category => {
      const items = filteredSwotData[category] || []
      const highCount = items.filter(item => item.impact?.toLowerCase() === 'high').length
      const mediumCount = items.filter(item => item.impact?.toLowerCase() === 'medium').length
      const lowCount = items.filter(item => item.impact?.toLowerCase() === 'low').length
      const totalCount = items.length

      data.push({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        high: highCount,
        medium: mediumCount,
        low: lowCount,
        total: totalCount
      })
    })

    return data
  }

  const getImpactColor = (impact) => {
    switch (impact?.toLowerCase()) {
      case "high":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
      case "medium":
        return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800"
      case "low":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/20 dark:text-gray-300 dark:border-gray-700"
    }
  }

  const getCategoryIcon = (category) => {
    const iconClass = "h-3 w-3"
    switch (category?.toLowerCase()) {
      case "technology":
        return <Zap className={iconClass} />
      case "financial":
        return <DollarSign className={iconClass} />
      case "market":
        return <Globe className={iconClass} />
      case "business":
        return <Building2 className={iconClass} />
      case "operational":
        return <Factory className={iconClass} />
      case "regulatory":
        return <Shield className={iconClass} />
      case "competitive":
        return <TrendingUp className={iconClass} />
      case "industry":
        return <Eye className={iconClass} />
      case "product":
        return <Clock className={iconClass} />
      default:
        return <Target className={iconClass} />
    }
  }

  const getPaginatedItems = (items, category) => {
    const startIndex = currentPage[category] * ITEMS_PER_PAGE
    return items.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }

  const getTotalPages = (items) => {
    return Math.ceil(items.length / ITEMS_PER_PAGE)
  }

  const nextPage = useCallback((category, items) => {
    const totalPages = getTotalPages(items)
    setCurrentPage(prev => ({
      ...prev,
      [category]: prev[category] < totalPages - 1 ? prev[category] + 1 : prev[category]
    }))
  }, [])

  const prevPage = useCallback((category) => {
    setCurrentPage(prev => ({
      ...prev,
      [category]: prev[category] > 0 ? prev[category] - 1 : prev[category]
    }))
  }, [])

  const copyToClipboard = useCallback(async (item, category) => {
    const text = `${item.title}\n\n${item.description}\n\nImpact: ${item.impact}\nCategory: ${item.category}`

    try {
      await navigator.clipboard.writeText(text)
      const itemId = `${category}-${item.title}`
      setCopiedItems(prev => new Set([...prev, itemId]))

      // Remove the copied indicator after 2 seconds
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(itemId)
          return newSet
        })
      }, 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }, [])

  const rateItem = useCallback((item, category, rating) => {
    const itemId = `${category}-${item.title}`
    setItemRatings(prev => ({
      ...prev,
      [itemId]: rating
    }))

    // Send feedback to backend
    const feedbackType = rating === 'up' ? 'positive' : 'negative'
    const feedbackCategory = `swot_${category}`  // e.g., 'swot_strengths'
    const message = `${item.title}\n${item.description}`

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
  }, [])

  const goToPage = useCallback((category, page) => {
    setCurrentPage(prev => ({
      ...prev,
      [category]: page
    }))
  }, [])

  const SWOTItem = ({ item, index, category }) => {
    const itemId = `${category}-${item.title}`
    const isCopied = copiedItems.has(itemId)
    const rating = itemRatings[itemId]

    const getItemStyle = (category) => {
      switch (category) {
        case 'strengths':
          return "bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200/50 dark:border-emerald-800/30"
        case 'weaknesses':
          return "bg-gradient-to-br from-red-50/50 to-orange-50/50 dark:from-red-950/20 dark:to-orange-950/20 border border-red-200/50 dark:border-red-800/30"
        case 'opportunities':
          return "bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200/50 dark:border-blue-800/30"
        case 'threats':
          return "bg-gradient-to-br from-amber-50/50 to-yellow-50/50 dark:from-amber-950/20 dark:to-yellow-950/20 border border-amber-200/50 dark:border-amber-800/30"
        default:
          return "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      }
    }

    return (
      <div className={`${getItemStyle(category)} rounded-xl p-3 sm:p-4 hover:shadow-md transition-all duration-200 group`}>
        {/* Header with title and actions */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight flex-1">
            {item.title}
          </h4>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Copy Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(item, category)}
              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Copy to clipboard"
            >
              {isCopied ? (
                <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
              ) : (
                <Copy className="h-3 w-3 text-gray-500 dark:text-gray-400" />
              )}
            </Button>

            {/* Rating Buttons */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => rateItem(item, category, 'up')}
                className={`h-7 w-7 p-0 ${rating === 'up'
                    ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                    : 'text-gray-500 dark:text-gray-400'
                  }`}
                title="Helpful"
              >
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => rateItem(item, category, 'down')}
                className={`h-7 w-7 p-0 ${rating === 'down'
                    ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                    : 'text-gray-500 dark:text-gray-400'
                  }`}
                title="Not helpful"
              >
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 mb-3">
          <Badge className={`text-xs font-medium ${getImpactColor(item.impact)}`}>
            {item.impact?.toUpperCase() || "MEDIUM"}
          </Badge>
          {item.category && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/60 dark:bg-gray-800/60 text-xs backdrop-blur-sm">
              {getCategoryIcon(item.category)}
              <span className="capitalize text-gray-600 dark:text-gray-300">{item.category}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed">
          {item.description}
        </p>
      </div>
    )
  }

  const PaginationControls = ({ category, items }) => {
    const totalPages = getTotalPages(items)
    const currentPageNum = currentPage[category]

    if (totalPages <= 1) return null

    return (
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Page {currentPageNum + 1} of {totalPages} • {items.length} total items
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => prevPage(category)}
            disabled={currentPageNum === 0}
            className="h-7 w-7 p-0"
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>

          {Array.from({ length: totalPages }, (_, i) => (
            <Button
              key={i}
              variant={i === currentPageNum ? "default" : "outline"}
              size="sm"
              onClick={() => goToPage(category, i)}
              className="h-7 w-7 p-0 text-xs"
            >
              {i + 1}
            </Button>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() => nextPage(category, items)}
            disabled={currentPageNum === totalPages - 1}
            className="h-7 w-7 p-0"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    )
  }

  const TabContent = ({ items, category, emptyMessage }) => {
    const paginatedItems = getPaginatedItems(items, category)

    return (
      <div className="space-y-4">
        {paginatedItems.length > 0 ? (
          <>
            <div className="space-y-3">
              {paginatedItems.map((item, index) => (
                <SWOTItem key={index} item={item} index={index} category={category} />
              ))}
            </div>
            <PaginationControls category={category} items={items} />
          </>
        ) : (
          <div className="text-center p-8 text-gray-500 dark:text-gray-400 bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            {emptyMessage}
          </div>
        )}
      </div>
    )
  }

  // Matrix View Component
  const MatrixView = () => {
    const MatrixQuadrant = ({ title, items, bgColor, borderColor, textColor, icon }) => (
      <div className={`${bgColor} ${borderColor} border-2 rounded-xl p-4 h-full min-h-[300px] flex flex-col`}>
        <div className="flex items-center gap-2 mb-4">
          <div className={`p-2 ${textColor === 'text-green-600' ? 'bg-green-100 dark:bg-green-900/30' :
            textColor === 'text-red-600' ? 'bg-red-100 dark:bg-red-900/30' :
              textColor === 'text-blue-600' ? 'bg-blue-100 dark:bg-blue-900/30' :
                'bg-amber-100 dark:bg-amber-900/30'} rounded-lg`}>
            {icon}
          </div>
          <h3 className={`font-bold text-lg ${textColor} dark:${textColor.replace('600', '400')}`}>
            {title}
          </h3>
          <Badge variant="outline" className="ml-auto">
            {items.length}
          </Badge>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto max-h-64">
          {items.length > 0 ? items.slice(0, 8).map((item, index) => (
            <div key={index} className="group">
              <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3 hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(item, title.toLowerCase())}
                      className="h-6 w-6 p-0"
                      title="Copy"
                    >
                      <Copy className="h-3 w-3 text-gray-500" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
                  {item.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`text-xs ${getImpactColor(item.impact)}`}>
                    {item.impact?.toUpperCase() || "MEDIUM"}
                  </Badge>
                  {item.category && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/60 dark:bg-gray-700/60 text-xs">
                      {getCategoryIcon(item.category)}
                      <span className="capitalize text-gray-600 dark:text-gray-300">{item.category}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="text-sm">No {title.toLowerCase()} identified</p>
            </div>
          )}
          {items.length > 8 && (
            <div className="text-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                View all {items.length} items
              </Button>
            </div>
          )}
        </div>
      </div>
    )

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
        {/* Top Row - Internal Factors */}
        <MatrixQuadrant
          title="Strengths"
          items={filteredSwotData?.strengths || []}
          bgColor="bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/20 dark:to-teal-950/20"
          borderColor="border-emerald-300 dark:border-emerald-700"
          textColor="text-green-600"
          icon={<TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />}
        />
        <MatrixQuadrant
          title="Weaknesses"
          items={filteredSwotData?.weaknesses || []}
          bgColor="bg-gradient-to-br from-red-50/80 to-orange-50/80 dark:from-red-950/20 dark:to-orange-950/20"
          borderColor="border-red-300 dark:border-red-700"
          textColor="text-red-600"
          icon={<AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />}
        />
        {/* Bottom Row - External Factors */}
        <MatrixQuadrant
          title="Opportunities"
          items={filteredSwotData?.opportunities || []}
          bgColor="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-950/20 dark:to-indigo-950/20"
          borderColor="border-blue-300 dark:border-blue-700"
          textColor="text-blue-600"
          icon={<Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
        />
        <MatrixQuadrant
          title="Threats"
          items={filteredSwotData?.threats || []}
          bgColor="bg-gradient-to-br from-amber-50/80 to-yellow-50/80 dark:from-amber-950/20 dark:to-yellow-950/20"
          borderColor="border-amber-300 dark:border-amber-700"
          textColor="text-orange-600"
          icon={<Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
        />
      </div>
    )
  }

  // Chart Display Component
  const ChartDisplay = ({ chartData, chartType }) => {
    const maxValue = Math.max(...chartData.map(item => Math.max(item.high, item.medium, item.low, item.total)))

    if (chartType === 'bubble') {
      // Responsive bubble chart dimensions
      const bubbleWidth = 400
      const bubbleHeight = 300
      
      return (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-2 sm:p-4 border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">SWOT Bubble Analysis</h3>
              <div className="hidden sm:flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">High</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">Medium</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">Low</span>
                </div>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <div className="flex justify-center min-w-fit">
                <svg 
                  width={bubbleWidth} 
                  height={bubbleHeight} 
                  className="overflow-visible max-w-full h-auto"
                  viewBox={`0 0 ${bubbleWidth} ${bubbleHeight}`}
                >
                  {/* Grid lines with unique ID */}
                  <defs>
                    <pattern id={`bubble-grid-${currentDocumentKey}`} width="40" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 30" fill="none" stroke="rgba(156, 163, 175, 0.2)" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill={`url(#bubble-grid-${currentDocumentKey})`} />
                
                {/* Quadrant labels - positioned to avoid overlap */}
                <text x={100} y={15} textAnchor="middle" className="text-xs fill-gray-500 dark:fill-gray-400 font-medium">
                  Internal Strengths
                </text>
                <text x={300} y={15} textAnchor="middle" className="text-xs fill-gray-500 dark:fill-gray-400 font-medium">
                  Internal Weaknesses
                </text>
                <text x={100} y={295} textAnchor="middle" className="text-xs fill-gray-500 dark:fill-gray-400 font-medium">
                  External Opportunities
                </text>
                <text x={300} y={295} textAnchor="middle" className="text-xs fill-gray-500 dark:fill-gray-400 font-medium">
                  External Threats
                </text>

                {/* Center lines */}
                <line x1={200} y1={30} x2={200} y2={270} stroke="rgba(156, 163, 175, 0.5)" strokeWidth="2" strokeDasharray="5,5" />
                <line x1={50} y1={150} x2={350} y2={150} stroke="rgba(156, 163, 175, 0.5)" strokeWidth="2" strokeDasharray="5,5" />

                {/* Bubbles */}
                {chartData.map((item, index) => {
                  const x = index === 0 ? 100 : // Strengths
                           index === 1 ? 300 : // Weaknesses  
                           index === 2 ? 100 : // Opportunities
                           300; // Threats
                  const y = index < 2 ? 80 : 220; // Top row vs bottom row
                  
                  const highRadius = Math.max(8, (item.high / Math.max(maxValue, 1)) * 25)
                  const mediumRadius = Math.max(6, (item.medium / Math.max(maxValue, 1)) * 20)
                  const lowRadius = Math.max(4, (item.low / Math.max(maxValue, 1)) * 15)

                  return (
                    <g key={index}>
                      {/* High impact bubble */}
                      {item.high > 0 && (
                        <circle
                          cx={x}
                          cy={y - 15}
                          r={highRadius}
                          fill="#ef4444"
                          fillOpacity={0.7}
                          stroke="#dc2626"
                          strokeWidth={2}
                        >
                          <title>{`${item.category} High Impact: ${item.high}`}</title>
                        </circle>
                      )}
                      
                      {/* Medium impact bubble */}
                      {item.medium > 0 && (
                        <circle
                          cx={x + (item.high > 0 ? 20 : 0)}
                          cy={y}
                          r={mediumRadius}
                          fill="#eab308"
                          fillOpacity={0.7}
                          stroke="#ca8a04"
                          strokeWidth={2}
                        >
                          <title>{`${item.category} Medium Impact: ${item.medium}`}</title>
                        </circle>
                      )}
                      
                      {/* Low impact bubble */}
                      {item.low > 0 && (
                        <circle
                          cx={x - (item.high > 0 ? 20 : 0)}
                          cy={y + 15}
                          r={lowRadius}
                          fill="#22c55e"
                          fillOpacity={0.7}
                          stroke="#16a34a"
                          strokeWidth={2}
                        >
                          <title>{`${item.category} Low Impact: ${item.low}`}</title>
                        </circle>
                      )}

                      {/* Category label - positioned to avoid overlap with quadrant labels */}
                      <text
                        x={x}
                        y={index < 2 ? y + 45 : y + 40} // Different positioning for top/bottom rows
                        textAnchor="middle"
                        className="text-xs font-medium fill-gray-700 dark:fill-gray-300"
                      >
                        {item.category}
                      </text>
                      
                      {/* Count text with impact breakdown */}
                      <text
                        x={x}
                        y={index < 2 ? y + 57 : y + 52} // Different positioning for top/bottom rows
                        textAnchor="middle"
                        className="text-xs fill-gray-500 dark:fill-gray-400"
                      >
                        {item.total} ({item.high}H {item.medium}M {item.low}L)
                      </text>
                    </g>
                  )
                })}
                </svg>
              </div>
            </div>

            {/* Mobile legend */}
            <div className="sm:hidden flex items-center justify-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">H</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">M</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">L</span>
              </div>
            </div>
            
            {/* Legend */}
            <div className="text-center text-xs text-gray-500 dark:text-gray-400">
              Bubble size represents count • Position shows SWOT category
            </div>
          </div>
        </div>
      )
    } else if (chartType === 'bar') {
      return (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-2 sm:p-4 border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">SWOT Analysis Distribution</h3>
              <div className="hidden sm:flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                  <span className="text-gray-600 dark:text-gray-400">High</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
                  <span className="text-gray-600 dark:text-gray-400">Medium</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                  <span className="text-gray-600 dark:text-gray-400">Low</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {chartData.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{item.category}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Total: {item.total}</span>
                  </div>
                  <div className="flex gap-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
                    <div
                      className="bg-red-500 transition-all duration-300"
                      style={{ width: `${maxValue > 0 ? (item.high / maxValue) * 100 : 0}%` }}
                      title={`High: ${item.high}`}
                    />
                    <div
                      className="bg-yellow-500 transition-all duration-300"
                      style={{ width: `${maxValue > 0 ? (item.medium / maxValue) * 100 : 0}%` }}
                      title={`Medium: ${item.medium}`}
                    />
                    <div
                      className="bg-green-500 transition-all duration-300"
                      style={{ width: `${maxValue > 0 ? (item.low / maxValue) * 100 : 0}%` }}
                      title={`Low: ${item.low}`}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>High: {item.high}</span>
                    <span>Medium: {item.medium}</span>
                    <span>Low: {item.low}</span>
                  </div>
                  <div className="text-center text-xs text-gray-600 dark:text-gray-300 font-medium mt-1">
                    Total: {item.total} items
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    } else {
      // Line Chart - Responsive dimensions
      const chartHeight = 200
      const chartWidth = 400
      const padding = { top: 20, right: 20, bottom: 40, left: 40 }
      const innerWidth = chartWidth - padding.left - padding.right
      const innerHeight = chartHeight - padding.top - padding.bottom

      const xStep = innerWidth / (chartData.length - 1)
      const yScale = innerHeight / maxValue

      const createPath = (values) => {
        return chartData.map((item, index) => {
          const x = padding.left + (index * xStep)
          const y = padding.top + (innerHeight - (values[index] * yScale))
          return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
        }).join(' ')
      }

      const highPath = createPath(chartData.map(item => item.high))
      const mediumPath = createPath(chartData.map(item => item.medium))
      const lowPath = createPath(chartData.map(item => item.low))

      return (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-2 sm:p-4 border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">SWOT Analysis Trends</h3>
              <div className="hidden sm:flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-red-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">High</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-yellow-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">Medium</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-green-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">Low</span>
                </div>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <div className="flex justify-center min-w-fit">
                <svg 
                  width={chartWidth} 
                  height={chartHeight} 
                  className="overflow-visible max-w-full h-auto"
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                >
                {/* Grid lines */}
                <g>
                  {/* Vertical grid lines - align with data points */}
                  {chartData.map((_, i) => {
                    const x = padding.left + (i * xStep)
                    return (
                      <line
                        key={`v-${i}`}
                        x1={x}
                        y1={padding.top}
                        x2={x}
                        y2={chartHeight - padding.bottom}
                        stroke="rgba(156, 163, 175, 0.3)"
                        strokeWidth="1"
                        strokeDasharray="3,3"
                      />
                    )
                  })}
                  {/* Horizontal grid lines */}
                  {[0, Math.ceil(maxValue / 4), Math.ceil(maxValue / 2), Math.ceil(maxValue * 3 / 4), maxValue].map((value, i) => {
                    const y = padding.top + (innerHeight - (value * yScale))
                    return (
                      <line
                        key={`h-${i}`}
                        x1={padding.left}
                        y1={y}
                        x2={chartWidth - padding.right}
                        y2={y}
                        stroke="rgba(156, 163, 175, 0.3)"
                        strokeWidth="1"
                        strokeDasharray="3,3"
                      />
                    )
                  })}
                </g>

                {/* Lines */}
                <path d={highPath} fill="none" stroke="#ef4444" strokeWidth="2" className="drop-shadow-sm" />
                <path d={mediumPath} fill="none" stroke="#eab308" strokeWidth="2" className="drop-shadow-sm" />
                <path d={lowPath} fill="none" stroke="#22c55e" strokeWidth="2" className="drop-shadow-sm" />

                {/* Data points */}
                {chartData.map((item, index) => {
                  const x = padding.left + (index * xStep)
                  const highY = padding.top + (innerHeight - (item.high * yScale))
                  const mediumY = padding.top + (innerHeight - (item.medium * yScale))
                  const lowY = padding.top + (innerHeight - (item.low * yScale))

                  return (
                    <g key={index}>
                      <circle cx={x} cy={highY} r="3" fill="#ef4444" className="drop-shadow-sm" />
                      <circle cx={x} cy={mediumY} r="3" fill="#eab308" className="drop-shadow-sm" />
                      <circle cx={x} cy={lowY} r="3" fill="#22c55e" className="drop-shadow-sm" />
                    </g>
                  )
                })}

                {/* X-axis labels */}
                {chartData.map((item, index) => {
                  const x = padding.left + (index * xStep)
                  return (
                    <text
                      key={index}
                      x={x}
                      y={chartHeight - 10}
                      textAnchor="middle"
                      className="text-xs fill-gray-600 dark:fill-gray-400"
                    >
                      {item.category.charAt(0)}
                    </text>
                  )
                })}

                {/* Y-axis labels */}
                {[0, Math.ceil(maxValue / 2), maxValue].map((value, index) => {
                  const y = padding.top + (innerHeight - (value * yScale))
                  return (
                    <text
                      key={index}
                      x={padding.left - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="text-xs fill-gray-600 dark:fill-gray-400"
                    >
                      {value}
                    </text>
                  )
                })}
                </svg>
              </div>
            </div>

            {/* Mobile legend */}
            <div className="sm:hidden flex items-center justify-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-red-500"></div>
                <span className="text-gray-600 dark:text-gray-400">H</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-yellow-500"></div>
                <span className="text-gray-600 dark:text-gray-400">M</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-green-500"></div>
                <span className="text-gray-600 dark:text-gray-400">L</span>
              </div>
            </div>

            {/* Summary with totals */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              {chartData.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.category}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    H:{item.high} M:{item.medium} L:{item.low}
                  </div>
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Total: {item.total}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }
  }

  const tabConfigs = {
    strengths: {
      label: "",
      icon: <p className="text-green-600 font-bold">S</p>,
      color: "text-green-600",
      emptyMessage: isDemoMode
        ? "Demo strengths will appear here"
        : bypassAPI
          ? "Strengths analysis will appear here in full mode"
          : "No strengths identified",
    },
    weaknesses: {
      label: "",
      icon: <p className="text-red-600 font-bold">W</p>,
      color: "text-red-600",
      emptyMessage: isDemoMode
        ? "Demo weaknesses will appear here"
        : bypassAPI
          ? "Weaknesses analysis will appear here in full mode"
          : "No weaknesses identified",
    },
    opportunities: {
      label: "",
      icon: <p className="text-blue-600 font-bold">O</p>,
      color: "text-blue-600",
      emptyMessage: isDemoMode
        ? "Demo opportunities will appear here"
        : bypassAPI
          ? "Opportunities analysis will appear here in full mode"
          : "No opportunities identified",
    },
    threats: {
      label: "",
      icon: <p className="text-orange-600 font-bold">T</p>,
      color: "text-orange-600",
      emptyMessage: isDemoMode
        ? "Demo threats will appear here"
        : bypassAPI
          ? "Threats analysis will appear here in full mode"
          : "No threats identified",
    },
  }

 

  // Controls Drawer Component
  const ControlsDrawer = () => (
    <>
      {/* Overlay - No click to close, only visual background */}
      {controlsDrawerOpen && (
  <div
    className={`fixed bg-black z-40 transition-opacity duration-300 ease-in-out ${controlsDrawerOpen ? 'opacity-50' : 'opacity-0'}`}
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
  ref={controlsDrawerRef}
  className={`fixed right-0 w-80 bg-white dark:bg-[#121212] shadow-xl z-50 transform transition-all duration-300 ease-in-out ${controlsDrawerOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}
  style={{ 
    top: '-1px',  // Slight negative margin to overcome browser gaps
    bottom: '-1px',
    height: 'calc(100vh + 2px)',
    margin: 0,
    padding: 0,
    transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out' 
  }}
>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Settings className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  SWOT Controls
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Customize charts and filters
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setControlsDrawerOpen(false)}
              className="h-8 w-8 p-0 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div key={controlsKey} className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Display Mode - FIRST */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Display Mode</Label>
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <Switch
                  id="show-charts-drawer"
                  checked={localShowCharts}
                  onCheckedChange={setLocalShowCharts}
                  className="data-[state=checked]:bg-blue-600"
                />
                <Label htmlFor="show-charts-drawer" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer font-medium">
                  {localShowCharts ? 'Charts View ' : 'Counts View '}
                </Label>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Toggle between statistical counts and visual charts
              </p>
            </div>

            {/* Conditional Chart & Filter Options - Only show when charts are enabled */}
            {localShowCharts && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Charts & Filters</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <b>Note :</b> Field selection also affects SWOT Insights view
                </p>
                {/* Chart Type Selection */}
                <div className="space-y-3 mb-6">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Chart Type</Label>
                  <Select value={localChartType} onValueChange={setLocalChartType}>
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
                      <SelectItem value="bar">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Bar Chart
                        </div>
                      </SelectItem>
                      
                     
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Choose how to visualize the analysis data
                  </p>
                </div>

                {/* Priority Filter */}
                <div className="space-y-3 mb-6">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority Level</Label>
                  <Select value={localPriorityFilter} onValueChange={setLocalPriorityFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[60]">
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="high">High Impact</SelectItem>
                      <SelectItem value="medium">Medium Impact</SelectItem>
                      <SelectItem value="low">Low Impact</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Filter items by their impact level
                  </p>
                </div>

                {/* Category Filter */}
                <div className="space-y-3 mb-6">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">SWOT Category</Label>
                  <Select value={localCategoryFilter} onValueChange={setLocalCategoryFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[60]">
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="strengths">Strengths Only</SelectItem>
                      <SelectItem value="weaknesses">Weaknesses Only</SelectItem>
                      <SelectItem value="opportunities">Opportunities Only</SelectItem>
                      <SelectItem value="threats">Threats Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Focus on specific SWOT categories
                  </p>
                </div>

                {/* Item Category Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Item Category</Label>
                  <Select value={localItemCategoryFilter} onValueChange={setLocalItemCategoryFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[60]">
                      <SelectItem value="all">All Item Types</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="competitive">Competitive</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="market">Market</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="operational">Operational</SelectItem>
                      <SelectItem value="regulatory">Regulatory</SelectItem>
                      <SelectItem value="industry">Industry</SelectItem>
                      <SelectItem value="product">Product</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Filter by business domain categories
                  </p>
                </div>
              </div>
            )}

            {/* Show message when charts are disabled */}
            {!localShowCharts && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="text-center p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Chart Options Hidden
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Enable "Show Charts" to access chart types and filters
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="border-t mb-6 border-gray-200 dark:border-gray-700 p-4 space-y-3">
            <div className="flex gap-2">
              <Button
                onClick={saveControls}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                size="sm"
              >
                <Save className="h-3 w-3" />
                Save Changes
              </Button>
              <Button
                onClick={resetControls}
                variant="outline"
                size="sm"
                disabled={isResetting}
                className={`flex-1 flex items-center gap-2 transition-colors ${isResetting ? 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800' : ''
                  }`}
              >
                <RotateCcw className={`h-3 w-3 ${isResetting ? 'animate-spin' : ''}`} />
                {isResetting ? 'Reset!' : 'Reset'}
              </Button>
            </div>
            {/* <Button
              onClick={() => setControlsDrawerOpen(false)}
              variant="ghost"
              size="sm"
              className="w-full text-gray-600 dark:text-gray-400"
            >
              Cancel
            </Button> */}
          </div>
        </div>
      </div>
    </>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Professional Header Card - Following exact styling */}
      <Card className="border-0 dark:bg-transparent">
        <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow-lg">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 dark:text-white">
                  SWOT Analysis
                  {isDemoMode && <span className="text-xs text-orange-500 font-normal ml-2">(Demo)</span>}
                  {bypassAPI && !isDemoMode && <span className="text-xs text-green-600 font-normal ml-2"></span>}
                </CardTitle>
                <p className="text-xs text-slate-600 dark:text-gray-400 mt-1">
                  Strategic analysis by <span className="text-center inline-block font-bold">
                    Elva
                    <span className="text-red-500">*</span>
                  </span>
                </p>
              </div>
            </div>

            {/* Analysis Controls Button - Far Right */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setControlsDrawerOpen(true)}
              className="h-8 w-8 p-0 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0"
              title="SWOT Controls"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3 px-3 sm:px-4">
          {/* <div className="bg-gradient-to-r from-purple-50/80 to-blue-50/80 dark:from-purple-950/30 dark:to-blue-950/30 rounded-2xl p-3 sm:p-4 border border-purple-200/50 dark:border-purple-800/30">
            <p className="text-slate-800 dark:text-slate-100 leading-relaxed text-sm font-medium">
              {isDemoMode 
                ? 'Comprehensive strategic analysis showcasing strengths, weaknesses, opportunities, and threats with detailed insights for informed decision-making.'
                : bypassAPI 
                  ? 'Strategic SWOT analysis preview demonstrating the four-quadrant framework for evaluating internal and external business factors.'
                  : 'Strategic analysis of internal strengths & weaknesses and external opportunities & threats to guide business strategy and decision-making.'
              }
            </p>
          </div> */}



          {/* Quick Stats or Chart Display */}
          {showCharts ? (
            <ChartDisplay chartData={getChartData()} chartType={chartType} />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl p-2 sm:p-2.5 lg:p-3 border border-emerald-200/50 dark:border-emerald-800/30">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Strengths</span>
                </div>
                <p className="text-sm sm:text-base lg:text-lg font-bold text-emerald-900 dark:text-emerald-100 mt-1">
                  {filteredSwotData?.strengths?.length || 0}
                </p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 rounded-xl p-2 sm:p-2.5 lg:p-3 border border-red-200/50 dark:border-red-800/30">
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-600 dark:text-red-400" />
                  <span className="text-xs font-medium text-red-800 dark:text-red-200">Weaknesses</span>
                </div>
                <p className="text-sm sm:text-base lg:text-lg font-bold text-red-900 dark:text-red-100 mt-1">
                  {filteredSwotData?.weaknesses?.length || 0}
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-2 sm:p-2.5 lg:p-3 border border-blue-200/50 dark:border-blue-800/30">
                <div className="flex items-center gap-1">
                  <Target className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Opportunities</span>
                </div>
                <p className="text-sm sm:text-base lg:text-lg font-bold text-blue-900 dark:text-blue-100 mt-1">
                  {filteredSwotData?.opportunities?.length || 0}
                </p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 rounded-xl p-2 sm:p-2.5 lg:p-3 border border-amber-200/50 dark:border-amber-800/30">
                <div className="flex items-center gap-1">
                  <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-medium text-amber-800 dark:text-amber-200">Threats</span>
                </div>
                <p className="text-sm sm:text-base lg:text-lg font-bold text-amber-900 dark:text-amber-100 mt-1">
                  {filteredSwotData?.threats?.length || 0}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="my-4 dark:bg-gray-700" />

      {/* SWOT Tabs */}
      <Card className="dark:bg-transparent border-0 mt-3 sm:mt-4">
        <Tabs value={activeSwotTab} onValueChange={setActiveSwotTab} className="w-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    SWOT Insights
                    {isDemoMode && <span className="text-xs text-orange-500 font-normal">(Demo)</span>}
                    {bypassAPI && !isDemoMode && <span className="text-xs text-green-600 font-normal"></span>}
                  </CardTitle>
                  <p className="text-xs text-slate-600 dark:text-gray-400 mt-1">
                    Internal strengths & weaknesses and external opportunities & threats
                  </p>
                </div>
              </div>

              {/* View Mode Menu */}
              <div className="relative" ref={viewMenuRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMenuOpen(!viewMenuOpen)}
                  className="h-8 w-8 p-0 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="View options"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>

                {/* Dropdown Menu */}
                {viewMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1">
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                      View Mode
                    </div>

                    <button
                      onClick={() => {
                        setViewMode('list')
                        setViewMenuOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${viewMode === 'list'
                          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                          : 'text-gray-700 dark:text-gray-300'
                        }`}
                    >
                      <List className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">List View</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Detailed items with tabs</div>
                      </div>
                      {viewMode === 'list' && (
                        <Check className="h-4 w-4 ml-auto" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setViewMode('matrix')
                        setViewMenuOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${viewMode === 'matrix'
                          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                          : 'text-gray-700 dark:text-gray-300'
                        }`}
                    >
                      <Grid3X3 className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">2×2 Matrix</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">All quadrants overview</div>
                      </div>
                      {viewMode === 'matrix' && (
                        <Check className="h-4 w-4 ml-auto" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
            {/* Show tabs only in list mode */}
            {viewMode === 'list' && (
              <TabsList className="grid w-full grid-cols-4 h-auto">
                {Object.entries(tabConfigs).map(([key, config]) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="flex items-center gap-2 py-2 px-3 data-[state=active]:bg-white dark:data-[state=active]:bg-black"
                  >
                    <div className={config.color}>{config.icon}</div>
                    <span className="text-xs sm:text-sm">{config.label}</span>

                  </TabsTrigger>
                ))}
              </TabsList>
            )}
          </CardHeader>

          <CardContent>
            {viewMode === 'matrix' ? (
              <MatrixView />
            ) : (
              // List View - Show tabs only in list mode
              <>
                {Object.entries(tabConfigs).map(([key, config]) => (
                  <div
                    key={key}
                    className={`mt-0 ${activeSwotTab === key ? 'block' : 'hidden'}`}
                  >
                    <TabContent
                      items={filteredSwotData[key] || []}
                      category={key}
                      emptyMessage={config.emptyMessage}
                    />
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Tabs>
      </Card>

      {/* Controls Drawer */}
      <ControlsDrawer />

    </div>
  )
}