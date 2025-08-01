import React, { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { TrendingUp, AlertTriangle, Target, Shield, Zap, Eye, Users, DollarSign, Globe, Clock } from 'lucide-react'

export default function SWOTAnalysis({ swot, isDemoMode = false, bypassAPI = false }) {
  // Mock SWOT data for demo/bypass modes
  const mockSWOTData = {
    strengths: [
      {
        title: "AI Technology Leadership",
        description: "Proprietary AI platform with advanced machine learning capabilities providing competitive differentiation",
        impact: "high",
        category: "technology"
      },
      {
        title: "Strong Financial Position", 
        description: "18-month operational runway with conservative cash flow projections and improving unit economics",
        impact: "high",
        category: "financial"
      },
      {
        title: "Customer Retention Excellence",
        description: "95% customer retention rate demonstrates strong product-market fit and customer satisfaction",
        impact: "medium",
        category: "market"
      },
      {
        title: "Strategic Partnerships",
        description: "Established relationships with Fortune 500 companies accelerating market penetration",
        impact: "medium",
        category: "business"
      }
    ],
    weaknesses: [
      {
        title: "Limited Geographic Presence",
        description: "Current operations concentrated in single market, limiting revenue diversification opportunities",
        impact: "medium",
        category: "market"
      },
      {
        title: "Talent Acquisition Challenges",
        description: "Competitive landscape for AI specialists may impact planned expansion timeline",
        impact: "high",
        category: "operational"
      },
      {
        title: "Customer Concentration Risk",
        description: "Heavy reliance on key accounts creates vulnerability to client losses",
        impact: "medium",
        category: "business"
      }
    ],
    opportunities: [
      {
        title: "Southeast Asia Expansion",
        description: "Untapped market with 200% year-over-year growth potential in target sectors",
        impact: "high",
        category: "market"
      },
      {
        title: "Healthcare Analytics Growth",
        description: "Emerging demand for AI-powered healthcare solutions with regulatory tailwinds",
        impact: "high",
        category: "industry"
      },
      {
        title: "ESG Investment Trends",
        description: "Sustainable operations framework aligns with increasing ESG investment criteria",
        impact: "medium",
        category: "financial"
      },
      {
        title: "Product Suite Expansion",
        description: "Cross-selling opportunities across enterprise, healthcare, and financial services",
        impact: "medium",
        category: "product"
      }
    ],
    threats: [
      {
        title: "Supply Chain Vulnerabilities",
        description: "Potential disruptions affecting Q2 delivery timelines and operational continuity",
        impact: "high",
        category: "operational"
      },
      {
        title: "Regulatory Uncertainties",
        description: "Changing regulations in target markets may impact expansion strategy and compliance costs",
        impact: "medium",
        category: "regulatory"
      },
      {
        title: "Competitive Market Pressure",
        description: "Increasing competition from established tech giants entering AI market",
        impact: "medium",
        category: "competitive"
      }
    ]
  }

  // Get SWOT data from results or use mock data
  const swotData = (isDemoMode || bypassAPI) ? mockSWOTData : swot || mockSWOTData

  useEffect(() => {
    console.log("SWOT data:", swotData)
    console.log("swotData keys:", Object.keys(swotData))
  }, [swotData])

  const getImpactColor = (impact) => {
    switch (impact?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'technology':
        return <Zap className="h-3 w-3" />
      case 'financial':
        return <DollarSign className="h-3 w-3" />
      case 'market':
        return <Globe className="h-3 w-3" />
      case 'business':
        return <Users className="h-3 w-3" />
      case 'operational':
        return <Target className="h-3 w-3" />
      case 'regulatory':
        return <Shield className="h-3 w-3" />
      case 'competitive':
        return <TrendingUp className="h-3 w-3" />
      case 'industry':
        return <Eye className="h-3 w-3" />
      case 'product':
        return <Clock className="h-3 w-3" />
      default:
        return <Target className="h-3 w-3" />
    }
  }

  const SWOTCard = ({ title, items, color, icon, description }) => (
    <Card className={`h-full border-2 ${color.border} bg-gradient-to-br ${color.bg}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${color.iconBg} shadow-sm`}>
            {icon}
          </div>
          <div>
            <CardTitle className={`text-lg font-bold ${color.text}`}>
              {swotData[title]}
            </CardTitle>
            <p className={`text-xs ${color.subtitle} mt-1`}>
              {description}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className={`p-3 rounded-xl ${color.itemBg} border ${color.itemBorder}`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className={`font-semibold text-sm ${color.itemTitle}`}>
                {item.title}
              </h4>
              <div className="flex items-center gap-1">
                {item.category && (
                  <div className={`p-1 rounded ${color.categoryBg}`}>
                    {getCategoryIcon(item.category)}
                  </div>
                )}
                <Badge className={`text-xs ${getImpactColor(item.impact)}`}>
                  {item.impact || 'medium'}
                </Badge>
              </div>
            </div>
            <p className={`text-xs leading-relaxed ${color.itemText}`}>
              {item.description}
            </p>
          </div>
        ))}
        {items.length === 0 && (
          <div className={`p-4 text-center rounded-xl ${color.itemBg} border ${color.itemBorder}`}>
            <p className={`text-sm ${color.subtitle}`}>
              {isDemoMode 
                ? 'Demo data will appear here'
                : bypassAPI 
                  ? 'Analysis will appear here in full mode'
                  : 'No items identified in this category'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
            <Target className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              SWOT Analysis
              {isDemoMode && <span className="text-sm text-orange-500 font-normal ml-2">(Demo)</span>}
              {bypassAPI && !isDemoMode && <span className="text-sm text-green-600 font-normal ml-2">(Preview)</span>}
            </h1>
            <p className="text-sm text-slate-600 dark:text-gray-400">
              Strategic analysis of Strengths, Weaknesses, Opportunities, and Threats
            </p>
          </div>
        </div>
      </div>

      {/* Demo/Bypass Notice */}
      {(isDemoMode || bypassAPI) && (
        <div className={`p-3 border rounded-xl ${
          isDemoMode 
            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
            : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
        }`}>
          <p className={`text-sm font-medium ${
            isDemoMode 
              ? 'text-orange-700 dark:text-orange-300'
              : 'text-green-700 dark:text-green-300'
          }`}>
            {isDemoMode 
              ? '📊 Demo SWOT Analysis - Sample strategic analysis to showcase the interface'
              : '📊 Preview Mode - SWOT analysis with sample data to demonstrate functionality'
            }
          </p>
        </div>
      )}

      {/* SWOT Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Strengths */}
        <SWOTCard
          title="Strengths"
          description={`${swotData.strengths?.length || 0} internal positive factors`}
          items={swotData.strengths || []}
          color={{
            border: 'border-emerald-200 dark:border-emerald-800',
            bg: 'from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/30',
            text: 'text-emerald-900 dark:text-emerald-100',
            subtitle: 'text-emerald-700 dark:text-emerald-300',
            iconBg: 'bg-emerald-500',
            itemBg: 'bg-white/80 dark:bg-emerald-950/40',
            itemBorder: 'border-emerald-200/50 dark:border-emerald-800/50',
            itemTitle: 'text-emerald-900 dark:text-emerald-100',
            itemText: 'text-emerald-800 dark:text-emerald-200',
            categoryBg: 'bg-emerald-100 dark:bg-emerald-800/30'
          }}
          icon={<TrendingUp className="h-5 w-5 text-white" />}
        />

        {/* Weaknesses */}
        <SWOTCard
          title="Weaknesses"
          description={`${swotData.weaknesses?.length || 0} internal areas for improvement`}
          items={swotData.weaknesses || []}
          color={{
            border: 'border-red-200 dark:border-red-800',
            bg: 'from-red-50/50 to-pink-50/50 dark:from-red-950/30 dark:to-pink-950/30',
            text: 'text-red-900 dark:text-red-100',
            subtitle: 'text-red-700 dark:text-red-300',
            iconBg: 'bg-red-500',
            itemBg: 'bg-white/80 dark:bg-red-950/40',
            itemBorder: 'border-red-200/50 dark:border-red-800/50',
            itemTitle: 'text-red-900 dark:text-red-100',
            itemText: 'text-red-800 dark:text-red-200',
            categoryBg: 'bg-red-100 dark:bg-red-800/30'
          }}
          icon={<AlertTriangle className="h-5 w-5 text-white" />}
        />

        {/* Opportunities */}
        <SWOTCard
          title="Opportunities"
          description={`${swotData.opportunities?.length || 0} external growth possibilities`}
          items={swotData.opportunities || []}
          color={{
            border: 'border-blue-200 dark:border-blue-800',
            bg: 'from-blue-50/50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/30',
            text: 'text-blue-900 dark:text-blue-100',
            subtitle: 'text-blue-700 dark:text-blue-300',
            iconBg: 'bg-blue-500',
            itemBg: 'bg-white/80 dark:bg-blue-950/40',
            itemBorder: 'border-blue-200/50 dark:border-blue-800/50',
            itemTitle: 'text-blue-900 dark:text-blue-100',
            itemText: 'text-blue-800 dark:text-blue-200',
            categoryBg: 'bg-blue-100 dark:bg-blue-800/30'
          }}
          icon={<Target className="h-5 w-5 text-white" />}
        />

        {/* Threats */}
        <SWOTCard
          title="Threats"
          description={`${swotData.threats?.length || 0} external risk factors`}
          items={swotData.threats || []}
          color={{
            border: 'border-amber-200 dark:border-amber-800',
            bg: 'from-amber-50/50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/30',
            text: 'text-amber-900 dark:text-amber-100',
            subtitle: 'text-amber-700 dark:text-amber-300',
            iconBg: 'bg-amber-500',
            itemBg: 'bg-white/80 dark:bg-amber-950/40',
            itemBorder: 'border-amber-200/50 dark:border-amber-800/50',
            itemTitle: 'text-amber-900 dark:text-amber-100',
            itemText: 'text-amber-800 dark:text-amber-200',
            categoryBg: 'bg-amber-100 dark:bg-amber-800/30'
          }}
          icon={<Shield className="h-5 w-5 text-white" />}
        />
      </div>

      {/* Summary Insights */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Strategic Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-xl border">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {swotData.strengths?.length || 0}
              </div>
              <div className="text-xs text-slate-600 dark:text-gray-400">Core Strengths</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-xl border">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {swotData.weaknesses?.length || 0}
              </div>
              <div className="text-xs text-slate-600 dark:text-gray-400">Key Weaknesses</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-xl border">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {swotData.opportunities?.length || 0}
              </div>
              <div className="text-xs text-slate-600 dark:text-gray-400">Growth Opportunities</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-xl border">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {swotData.threats?.length || 0}
              </div>
              <div className="text-xs text-slate-600 dark:text-gray-400">Risk Factors</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}