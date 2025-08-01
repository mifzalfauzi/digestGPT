"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Button } from "./ui/button"
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
} from "lucide-react"

export default function SWOTAnalysis({ swot, isDemoMode = false, bypassAPI = false }) {
  const [currentPage, setCurrentPage] = useState({
    strengths: 0,
    weaknesses: 0,
    opportunities: 0,
    threats: 0,
  })

  const [copiedItems, setCopiedItems] = useState(new Set())
  const [itemRatings, setItemRatings] = useState({})

  const ITEMS_PER_PAGE = 3

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

  const nextPage = (category, items) => {
    const totalPages = getTotalPages(items)
    setCurrentPage(prev => ({
      ...prev,
      [category]: prev[category] < totalPages - 1 ? prev[category] + 1 : prev[category]
    }))
  }

  const prevPage = (category) => {
    setCurrentPage(prev => ({
      ...prev,
      [category]: prev[category] > 0 ? prev[category] - 1 : prev[category]
    }))
  }

  const copyToClipboard = async (item, category) => {
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
  }

  const rateItem = (item, category, rating) => {
    const itemId = `${category}-${item.title}`
    setItemRatings(prev => ({
      ...prev,
      [itemId]: rating
    }))
  }

  const goToPage = (category, page) => {
    setCurrentPage(prev => ({
      ...prev,
      [category]: page
    }))
  }

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
                className={`h-7 w-7 p-0 ${
                  rating === 'up' 
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
                className={`h-7 w-7 p-0 ${
                  rating === 'down' 
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

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Professional Header Card - Following exact styling */}
      <Card className="border-0 mt-2 sm:mt-3 shadow-lg">
        <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow-lg">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 dark:text-white">
                  SWOT Analysis
                  {isDemoMode && <span className="text-xs text-orange-500 font-normal ml-2">(Demo)</span>}
                  {bypassAPI && !isDemoMode && <span className="text-xs text-green-600 font-normal ml-2">(Preview)</span>}
                </CardTitle>
                <p className="text-xs text-slate-600 dark:text-gray-400 mt-1">
                  Strategic analysis by <span className="text-center inline-block font-bold">
                  Elva
                  <span className="text-red-500">*</span>
                </span>
                </p>
              </div>
            </div>

            {/* Demo/Bypass Status Badge */}
            {(isDemoMode || bypassAPI) && (
              <div className={`flex items-center gap-2 rounded-lg p-2 border ${
                isDemoMode
                  ? 'bg-gradient-to-r from-orange-50/80 to-amber-50/80 dark:from-orange-800/80 dark:to-amber-900/80 border-orange-200/50 dark:border-orange-700/50'
                  : 'bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-800/80 dark:to-emerald-900/80 border-green-200/50 dark:border-green-700/50'
              }`}>
                <div className={`p-1 rounded-lg ${
                  isDemoMode
                    ? 'bg-gradient-to-br from-orange-500 to-amber-600'
                    : 'bg-gradient-to-br from-green-500 to-emerald-600'
                }`}>
                  <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                </div>
                <div className="text-left">
                  <p className={`text-xs font-medium ${
                    isDemoMode ? 'text-orange-700 dark:text-orange-300' : 'text-green-700 dark:text-green-300'
                  }`}>
                    {isDemoMode ? 'Demo Mode' : 'Preview Mode'}
                  </p>
                  <p className={`text-xs ${
                    isDemoMode ? 'text-orange-500 dark:text-orange-400' : 'text-green-500 dark:text-green-400'
                  }`}>
                    Sample data
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3 px-3 sm:px-4">
          <div className="bg-gradient-to-r from-purple-50/80 to-blue-50/80 dark:from-purple-950/30 dark:to-blue-950/30 rounded-2xl p-3 sm:p-4 border border-purple-200/50 dark:border-purple-800/30">
            <p className="text-slate-800 dark:text-slate-100 leading-relaxed text-sm font-medium">
              {isDemoMode 
                ? 'Comprehensive strategic analysis showcasing strengths, weaknesses, opportunities, and threats with detailed insights for informed decision-making.'
                : bypassAPI 
                  ? 'Strategic SWOT analysis preview demonstrating the four-quadrant framework for evaluating internal and external business factors.'
                  : 'Strategic analysis of internal strengths & weaknesses and external opportunities & threats to guide business strategy and decision-making.'
              }
            </p>
          </div>

          {/* Quick Stats - Following exact styling pattern */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-3 sm:mt-4">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl p-2 sm:p-2.5 lg:p-3 border border-emerald-200/50 dark:border-emerald-800/30">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Strengths</span>
              </div>
              <p className="text-sm sm:text-base lg:text-lg font-bold text-emerald-900 dark:text-emerald-100 mt-1">
                {isDemoMode ? '6' : bypassAPI ? '6' : (swotData?.strengths?.length || 0)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 rounded-xl p-2 sm:p-2.5 lg:p-3 border border-red-200/50 dark:border-red-800/30">
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-600 dark:text-red-400" />
                <span className="text-xs font-medium text-red-800 dark:text-red-200">Weaknesses</span>
              </div>
              <p className="text-sm sm:text-base lg:text-lg font-bold text-red-900 dark:text-red-100 mt-1">
                {isDemoMode ? '5' : bypassAPI ? '5' : (swotData?.weaknesses?.length || 0)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-2 sm:p-2.5 lg:p-3 border border-blue-200/50 dark:border-blue-800/30">
              <div className="flex items-center gap-1">
                <Target className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Opportunities</span>
              </div>
              <p className="text-sm sm:text-base lg:text-lg font-bold text-blue-900 dark:text-blue-100 mt-1">
                {isDemoMode ? '6' : bypassAPI ? '6' : (swotData?.opportunities?.length || 0)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 rounded-xl p-2 sm:p-2.5 lg:p-3 border border-amber-200/50 dark:border-amber-800/30">
              <div className="flex items-center gap-1">
                <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-medium text-amber-800 dark:text-amber-200">Threats</span>
              </div>
              <p className="text-sm sm:text-base lg:text-lg font-bold text-amber-900 dark:text-amber-100 mt-1">
                {isDemoMode ? '5' : bypassAPI ? '5' : (swotData?.threats?.length || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SWOT Tabs */}
      <Card>
        <Tabs defaultValue="strengths" className="w-full">
          <CardHeader className="pb-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" /> 
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                SWOT Insights
                {isDemoMode && <span className="text-xs text-orange-500 font-normal">(Demo)</span>}
                {bypassAPI && !isDemoMode && <span className="text-xs text-green-600 font-normal">(Preview)</span>}
              </CardTitle>
              <p className="text-xs text-slate-600 dark:text-gray-400 mt-1">
                Internal strengths & weaknesses and external opportunities & threats
              </p>
            </div>
          </div>
            <TabsList className="grid w-full grid-cols-4 h-auto">
              {Object.entries(tabConfigs).map(([key, config]) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="flex items-center gap-2 py-2 px-3 data-[state=active]:bg-white dark:data-[state=active]:bg-black"
                >
                  <div className={config.color}>{config.icon}</div>
                  <span className="text-xs sm:text-sm">{config.label}</span>
                  {/* <Badge variant="secondary" className="text-xs">
                    {swotData[key]?.length || 0}
                  </Badge> */}
                </TabsTrigger>
              ))}
            </TabsList>
          </CardHeader>

          <CardContent>
            {Object.entries(tabConfigs).map(([key, config]) => (
              <TabsContent key={key} value={key} className="mt-0">
                <TabContent
                  items={swotData[key] || []}
                  category={key}
                  emptyMessage={config.emptyMessage}
                />
              </TabsContent>
            ))}
          </CardContent>
        </Tabs>
      </Card>
      
    </div>
  )
}