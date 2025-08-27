import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
    Target,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Clock,
    ArrowRight,
    Lightbulb,
    BarChart3,
    Users,
    DollarSign,
    Calendar,
    Flag,
    Copy,
    ThumbsUp,
    ThumbsDown,
    Zap
} from "lucide-react"
import MarkdownRenderer from './MarkdownRenderer'

function Recommendations({ results, isDemoMode = false, bypassAPI = false, docId }) {
    const [activeTab, setActiveTab] = useState('overview')
    const [copiedItem, setCopiedItem] = useState(null)
    const [feedbackGiven, setFeedbackGiven] = useState({})

    // Tab persistence hook
    const useTabPersistence = (defaultTab = 'overview') => {
        const getStorageKey = useCallback(() => {
            return docId ? `enhancedDocViewer_recommendationsTab_${docId}` : null
        }, [docId])

        const loadFromStorage = useCallback(() => {
            const key = getStorageKey()
            if (!key) return defaultTab

            try {
                const stored = localStorage.getItem(key)
                if (stored) {
                    const data = JSON.parse(stored)
                    if (Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000) {
                        return data.tab
                    } else {
                        localStorage.removeItem(key)
                    }
                }
            } catch (error) {
                console.error('Error loading recommendations tab from storage:', error)
            }
            return defaultTab
        }, [getStorageKey, defaultTab])

        const saveToStorage = useCallback((tab) => {
            const key = getStorageKey()
            if (!key) return

            try {
                localStorage.setItem(key, JSON.stringify({
                    tab,
                    timestamp: Date.now()
                }))
            } catch (error) {
                console.error('Error saving recommendations tab to storage:', error)
            }
        }, [getStorageKey])

        return { loadFromStorage, saveToStorage }
    }

    const { loadFromStorage, saveToStorage } = useTabPersistence('overview')

    // Load tab state on mount or when docId changes
    useEffect(() => {
        const savedTab = loadFromStorage()
        setActiveTab(savedTab)
    }, [loadFromStorage])

    // Save tab state when it changes
    useEffect(() => {
        if (docId) {
            saveToStorage(activeTab)
        }
    }, [activeTab, docId, saveToStorage])

    // Mock data for demo/preview mode
    const mockRecommendations = {
        problem_framing: "This strategic expansion initiative requires decisive action to capture market opportunities while mitigating operational risks. The company needs clear direction on resource allocation and timeline prioritization.",
        strategic_options: [
            {
                title: "Accelerated Market Entry",
                description: "Fast-track Southeast Asian expansion with focused investment in key markets",
                pros: ["Quick market penetration", "First-mover advantage", "Rapid revenue growth"],
                cons: ["Higher resource requirements", "Increased execution risk"],
                risk_level: "medium",
                timeline: "6-9 months",
                investment_required: "High"
            },
            {
                title: "Phased Regional Rollout",
                description: "Gradual market entry with pilot programs and iterative learning",
                pros: ["Reduced risk exposure", "Learning-based approach", "Resource optimization"],
                cons: ["Slower market capture", "Potential competitor advantage"],
                risk_level: "low",
                timeline: "12-18 months",
                investment_required: "Medium"
            },
            {
                title: "Strategic Partnership Focus",
                description: "Leverage partnerships for accelerated market entry with shared risk",
                pros: ["Shared resources and risk", "Local market expertise", "Faster execution"],
                cons: ["Reduced control", "Revenue sharing"],
                risk_level: "low",
                timeline: "9-12 months",
                investment_required: "Medium"
            }
        ],
        action_items: [
            {
                priority: "high",
                category: "Strategic",
                action: "Conduct detailed market assessment for top 3 Southeast Asian markets",
                owner: "Strategy Team",
                timeline: "4 weeks",
                success_metrics: "Market size, competitive landscape, regulatory requirements documented"
            },
            {
                priority: "high",
                category: "Financial",
                action: "Secure additional funding round for expansion capital",
                owner: "Finance Team",
                timeline: "8 weeks",
                success_metrics: "$5M+ raised, 18-month runway extended to 30 months"
            },
            {
                priority: "medium",
                category: "Technology",
                action: "Complete AI platform localization for target markets",
                owner: "Product Team",
                timeline: "12 weeks",
                success_metrics: "Multi-language support, local compliance features ready"
            },
            {
                priority: "medium",
                category: "Operations",
                action: "Establish regional partnerships and distribution channels",
                owner: "Business Development",
                timeline: "10 weeks",
                success_metrics: "3+ strategic partnerships signed, distribution network operational"
            },
            {
                priority: "low",
                category: "HR",
                action: "Hire regional team leads for key markets",
                owner: "HR Team",
                timeline: "16 weeks",
                success_metrics: "Country managers hired for top 3 markets"
            }
        ],
        key_metrics: [
            {
                name: "Market Penetration Rate",
                target: "15% market share in target segments",
                timeframe: "18 months",
                measurement: "Monthly market research and sales data"
            },
            {
                name: "Revenue Growth",
                target: "40% YoY revenue increase",
                timeframe: "12 months",
                measurement: "Quarterly revenue reports and projections"
            },
            {
                name: "Customer Acquisition Cost",
                target: "Reduce CAC by 25%",
                timeframe: "9 months",
                measurement: "Monthly CAC analysis by region and channel"
            },
            {
                name: "Customer Retention",
                target: "Maintain 95%+ retention rate",
                timeframe: "Ongoing",
                measurement: "Monthly cohort analysis and churn tracking"
            }
        ],
        decision_point: {
            recommendation: "Proceed with Strategic Partnership Focus approach",
            rationale: "Balances growth ambition with risk management while leveraging local expertise for faster market entry",
            next_steps: "Initiate partnership discussions with identified regional players within 2 weeks",
            review_date: "In 6 weeks to assess partnership progress and pivot if necessary"
        }
    }

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
        console.log(`Feedback given for ${itemId}: ${type}`)
    }

    // Enhanced data resolution with multiple fallback paths and better debugging
    const recommendationsData = (() => {
        if (isDemoMode || bypassAPI) {
            console.log('Using mock recommendations data')
            return mockRecommendations
        }

        // Debug what we're receiving
        console.log('Recommendations - results object:', results)
        console.log('Recommendations - results.analysis:', results?.analysis)
        console.log('Recommendations - results.analysis.recommendations:', results?.analysis?.recommendations)
        console.log('Recommendations - results.recommendations:', results?.recommendations)

        // Try multiple paths to find recommendations data
        let recommendations = null

        // Path 1: results.analysis.recommendations (most common)
        if (results?.analysis?.recommendations) {
            recommendations = results.analysis.recommendations
            console.log('Found recommendations at results.analysis.recommendations:', recommendations)
        }
        // Path 2: results.recommendations (direct)
        else if (results?.recommendations) {
            recommendations = results.recommendations
            console.log('Found recommendations at results.recommendations:', recommendations)
        }
        // Path 3: Check if recommendations data is directly in analysis object (our case)
        else if (results?.analysis && typeof results.analysis === 'object') {
            // Look for recommendations in any nested structure
            const analysisKeys = Object.keys(results.analysis)
            console.log('Available analysis keys:', analysisKeys)

            if (analysisKeys.includes('recommendations')) {
                recommendations = results.analysis.recommendations
                console.log('Found recommendations in analysis keys:', recommendations)
            } else {
                // Check if recommendation fields are directly in analysis
                const hasRecommendationFields = analysisKeys.some(key =>
                    ['problem_framing', 'strategic_options', 'action_items', 'key_metrics', 'decision_point'].includes(key)
                )

                if (hasRecommendationFields) {
                    // Build recommendations object from individual fields in analysis
                    recommendations = {
                        problem_framing: results.analysis.problem_framing,
                        strategic_options: results.analysis.strategic_options,
                        action_items: results.analysis.action_items,
                        key_metrics: results.analysis.key_metrics,
                        decision_point: results.analysis.decision_point
                    }
                    console.log('Built recommendations from analysis fields:', recommendations)
                }
            }
        }

        if (recommendations) {
            // Validate that we have actual recommendation data
            const hasData = recommendations.problem_framing ||
                recommendations.strategic_options ||
                recommendations.action_items ||
                recommendations.key_metrics ||
                recommendations.decision_point

            if (hasData) {
                console.log('Valid recommendations data found:', recommendations)
                return recommendations
            } else {
                console.log('Recommendations object exists but appears empty:', recommendations)
            }
        }

        console.log('No recommendations data found, returning null')
        return null
    })()

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
            case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
        }
    }

    const getRiskColor = (risk) => {
        switch (risk) {
            case 'high': return 'text-red-600 dark:text-red-400'
            case 'medium': return 'text-yellow-600 dark:text-yellow-400'
            case 'low': return 'text-green-600 dark:text-green-400'
            default: return 'text-gray-600 dark:text-gray-400'
        }
    }

    if (!recommendationsData && !isDemoMode && !bypassAPI) {
        return (
            <div className="px-4 py-8">
                <div className="text-center">
                    <div className="p-3 bg-slate-100 dark:bg-gray-700 rounded-full w-fit mx-auto mb-3">
                        <Lightbulb className="h-6 w-6 text-slate-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-700 dark:text-gray-300 mb-2">
                        No Recommendations Available
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-gray-400 px-4">
                        Analyze a document to generate strategic recommendations and action plans.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="px-8 p-4 pb-4 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow-lg">
                        <Target className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            Strategic Recommendations
                        </h2>
                        <p className="text-xs text-slate-600 dark:text-gray-400 mt-1">
                            Decision-ready insights and action plans
                        </p>
                    </div>
                </div>
                {(isDemoMode || bypassAPI) && (
                    <Badge className={isDemoMode ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}>
                        {isDemoMode ? "Demo Data" : "Preview Mode"}
                    </Badge>
                )}
            </div>

            {/* Tabbed Content */}
            <div className="flex-1 overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-5 bg-transparent border-none h-auto mb-4">
                        <TabsTrigger
                            value="overview"
                            className="relative flex items-center justify-center gap-1 bg-transparent border-none rounded-none text-xs py-2 px-3 transition-all duration-200 hover:text-orange-500 dark:hover:text-orange-300 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400 before:content-[''] before:absolute before:bottom-0 before:left-0 before:h-[2px] before:w-0 before:bg-orange-500 before:transition-all before:duration-300 data-[state=active]:before:w-full"
                        >
                            <AlertCircle className="h-3 w-3 flex-shrink-0" />
                            <span className="hidden md:inline">Problem</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="options"
                            className="relative flex items-center justify-center gap-1 bg-transparent border-none rounded-none text-xs py-2 px-3 transition-all duration-200 hover:text-blue-500 dark:hover:text-blue-300 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 before:content-[''] before:absolute before:bottom-0 before:left-0 before:h-[2px] before:w-0 before:bg-blue-500 before:transition-all before:duration-300 data-[state=active]:before:w-full"
                        >
                            <TrendingUp className="h-3 w-3 flex-shrink-0" />
                            <span className="hidden md:inline">Options</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="actions"
                            className="relative flex items-center justify-center gap-1 bg-transparent border-none rounded-none text-xs py-2 px-3 transition-all duration-200 hover:text-purple-500 dark:hover:text-purple-300 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400 before:content-[''] before:absolute before:bottom-0 before:left-0 before:h-[2px] before:w-0 before:bg-purple-500 before:transition-all before:duration-300 data-[state=active]:before:w-full"
                        >
                            <Zap className="h-3 w-3 flex-shrink-0" />
                            <span className="hidden md:inline">Actions</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="metrics"
                            className="relative flex items-center justify-center gap-1 bg-transparent border-none rounded-none text-xs py-2 px-3 transition-all duration-200 hover:text-green-500 dark:hover:text-green-300 data-[state=active]:text-green-600 dark:data-[state=active]:text-green-400 before:content-[''] before:absolute before:bottom-0 before:left-0 before:h-[2px] before:w-0 before:bg-green-500 before:transition-all before:duration-300 data-[state=active]:before:w-full"
                        >
                            <BarChart3 className="h-3 w-3 flex-shrink-0" />
                            <span className="hidden md:inline">Metrics</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="decision"
                            className="relative flex items-center justify-center gap-1 bg-transparent border-none rounded-none text-xs py-2 px-3 transition-all duration-200 hover:text-blue-500 dark:hover:text-blue-300 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 before:content-[''] before:absolute before:bottom-0 before:left-0 before:h-[2px] before:w-0 before:bg-blue-500 before:transition-all before:duration-300 data-[state=active]:before:w-full"
                        >
                            <Flag className="h-3 w-3 flex-shrink-0" />
                            <span className="hidden md:inline">Decision</span>
                        </TabsTrigger>
                    </TabsList>
                    {/*                     
                    <Separator className="mb-4" /> */}

                    <div className="flex-1 overflow-hidden">
                        {/* Problem Framing Tab */}
                        <TabsContent value="overview" className="h-full overflow-y-auto mt-0">
                            {recommendationsData?.problem_framing ? (
                                <Card className="border-none bg-transparent">
                                    <CardHeader>
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="h-5 w-5 text-orange-600" />
                                            <CardTitle className="text-sm">Problem Framing</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="bg-orange-50/80 dark:bg-orange-950/30 rounded-xl p-4 border border-orange-200/50 dark:border-orange-800/30 relative">

                                            <MarkdownRenderer
                                                content={recommendationsData.problem_framing}
                                                className="text-slate-800 dark:text-slate-100 leading-relaxed text-sm"
                                            />

                                            <div className="absolute bottom-3 right-2 flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleCopy(recommendationsData.problem_framing, 'problem-framing')}
                                                    className="h-7 w-7 p-0 hover:bg-orange-100 dark:hover:bg-orange-900/20 mt-2"
                                                >
                                                    <Copy className={`h-3 w-3 ${copiedItem === 'problem-framing' ? 'text-orange-600' : 'text-gray-500'}`} />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="text-center py-8">
                                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">No problem framing available</p>
                                </div>
                            )}
                        </TabsContent>

                        {/* Strategic Options Tab */}
                        <TabsContent value="options" className="h-full overflow-y-auto mt-0">
                            {recommendationsData?.strategic_options ? (
                                <div className="space-y-4 ">
                                    {recommendationsData.strategic_options.map((option, index) => (
                                        <Card key={index} className="border-none bg-transparent ">
                                            <CardContent className="p-4">
                                                <div className=" p-4 bg-transparent ">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                                                {option.title}
                                                            </h4>
                                                            <p className="text-slate-600 dark:text-gray-400 mt-1 text-xs">
                                                                {option.description}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-col gap-2 items-end">
                                                            <Badge className={getRiskColor(option.risk_level)}>
                                                                {option.risk_level} risk
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        <div>
                                                            <h5 className="font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-1">
                                                                <CheckCircle2 className="h-4 w-4" />
                                                                Pros
                                                            </h5>
                                                            <ul className="space-y-1">
                                                                {option.pros?.map((pro, idx) => (
                                                                    <li key={idx} className="text-sm text-slate-700 dark:text-gray-300 flex items-start gap-2">
                                                                        <span className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                                                                        {pro}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                        <div>
                                                            <h5 className="font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-1">
                                                                <AlertCircle className="h-4 w-4" />
                                                                Cons
                                                            </h5>
                                                            <ul className="space-y-1">
                                                                {option.cons?.map((con, idx) => (
                                                                    <li key={idx} className="text-sm text-slate-700 dark:text-gray-300 flex items-start gap-2">
                                                                        <span className="w-1 h-1 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                                                                        {con}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-slate-200 dark:border-gray-700">
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <Clock className="h-4 w-4 text-slate-500" />
                                                            <span className="text-slate-600 dark:text-gray-400">Timeline:</span>
                                                            <span className="font-medium">{option.timeline}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <DollarSign className="h-4 w-4 text-slate-500" />
                                                            <span className="text-slate-600 dark:text-gray-400">Investment:</span>
                                                            <span className="font-medium">{option.investment_required}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">No strategic options available</p>
                                </div>
                            )}
                        </TabsContent>

                        {/* Action Items Tab */}
                        <TabsContent value="actions" className="h-full overflow-y-auto mt-0">
                            {recommendationsData?.action_items ? (
                                <div className="space-y-4">
                                    {recommendationsData.action_items.map((item, index) => (
                                        <Card key={index} className="border-none bg-transparent">
                                            <CardContent className="p-4">
                                                <div className="p-4 bg-transparent">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Badge className={getPriorityColor(item.priority)}>
                                                                    {item.priority} priority
                                                                </Badge>
                                                                <Badge variant="outline" className="text-xs">
                                                                    {item.category}
                                                                </Badge>
                                                            </div>
                                                            <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                                                                {item.action}
                                                            </h4>
                                                        </div>
                                                    </div>

                                                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <div className="flex items-center gap-1 mb-1">
                                                                <Users className="h-3 w-3 text-slate-500" />
                                                                <span className="text-slate-600 dark:text-gray-400">Owner:</span>
                                                            </div>
                                                            <p className="font-medium pl-4">{item.owner}</p>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-1 mb-1">
                                                                <Calendar className="h-3 w-3 text-slate-500" />
                                                                <span className="text-slate-600 dark:text-gray-400">Timeline:</span>
                                                            </div>
                                                            <p className="font-medium pl-4">{item.timeline}</p>
                                                        </div>
                                                    </div>

                                                    {item.success_metrics && (
                                                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-gray-700">
                                                            <div className="flex items-center gap-1 mb-1">
                                                                <BarChart3 className="h-3 w-3 text-slate-500" />
                                                                <span className="text-xs font-medium text-slate-600 dark:text-gray-400">Success Metrics:</span>
                                                            </div>
                                                            <p className="text-sm text-slate-700 dark:text-gray-300 pl-4">
                                                                {item.success_metrics}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">No action items available</p>
                                </div>
                            )}
                        </TabsContent>

                        {/* Key Metrics Tab */}
                        <TabsContent value="metrics" className="h-full overflow-y-auto mt-0">
                            {recommendationsData?.key_metrics ? (
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {recommendationsData.key_metrics.map((metric, index) => (
                                        <Card key={index} className="border-none bg-transparent">
                                            <CardContent className="p-4">
                                                <div className="p-4 bg-transparent ">
                                                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                                                        {metric.name}
                                                    </h4>
                                                    <div className="space-y-2 text-sm">
                                                        <div>
                                                            <span className="text-slate-600 dark:text-gray-400">Target: </span>
                                                            <span className="font-medium text-green-700 dark:text-green-400">
                                                                {metric.target}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-600 dark:text-gray-400">Timeframe: </span>
                                                            <span className="font-medium">{metric.timeframe}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-600 dark:text-gray-400">Measurement: </span>
                                                            <span className="text-slate-700 dark:text-gray-300">
                                                                {metric.measurement}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">No key metrics available</p>
                                </div>
                            )}
                        </TabsContent>

                        {/* Decision Point Tab */}
                        <TabsContent value="decision" className="h-full overflow-y-auto mt-0">
                            {recommendationsData?.decision_point ? (
                                <Card className="border-none bg-transparent">
                                    <CardHeader>
                                        <div className="flex items-center gap-2">
                                            <Flag className="h-5 w-5 text-blue-600" />
                                            <CardTitle className="text-lg">Recommended Decision</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <Separator className="mb-4" />
                                    <CardContent>
                                        <div className="p-4 bg-transparent">
                                            <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
                                                {recommendationsData.decision_point.recommendation}
                                            </h4>
                                            <p className="text-slate-700 dark:text-gray-300 mb-4">
                                                {recommendationsData.decision_point.rationale}
                                            </p>

                                            <div className="space-y-3">
                                                <div>
                                                    <div className="flex items-center gap-1 mb-1">
                                                        <ArrowRight className="h-4 w-4 text-blue-600" />
                                                        <span className="font-medium text-slate-900 dark:text-white">Next Steps:</span>
                                                    </div>
                                                    <p className="text-slate-700 dark:text-gray-300 pl-5">
                                                        {recommendationsData.decision_point.next_steps}
                                                    </p>
                                                </div>

                                                {recommendationsData.decision_point.review_date && (
                                                    <div>
                                                        <div className="flex items-center gap-1 mb-1">
                                                            <Calendar className="h-4 w-4 text-blue-600" />
                                                            <span className="font-medium text-slate-900 dark:text-white">Review Date:</span>
                                                        </div>
                                                        <p className="text-slate-700 dark:text-gray-300 pl-5">
                                                            {recommendationsData.decision_point.review_date}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="text-center py-8">
                                    <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">No decision recommendation available</p>
                                </div>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    )
}

export default Recommendations