import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  MessageCircle,
  Smartphone,
  Upload,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Zap,
  Shield,
  AlertTriangle,
  Play,
  Star,
  Menu,
  Brain,
  Eye,
} from "lucide-react"
import { Link } from "react-router-dom"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 overflow-x-hidden">
      {/* Header - Full Width */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-950/95 dark:supports-[backdrop-filter]:bg-gray-950/60 animate-in slide-in-from-top duration-500">
        <div className="w-full max-w-none px-4 lg:px-8 xl:px-12 flex h-14 items-center justify-between">
          <div className="flex items-center space-x-2 animate-in fade-in slide-in-from-left duration-700">
            <div className="relative">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400 transition-transform hover:scale-110 duration-300" />
              <Sparkles className="h-2.5 w-2.5 text-purple-500 absolute -top-0.5 -right-0.5 animate-pulse" />
            </div>
            <span className="text-lg font-bold">DigesText</span>
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium animate-in fade-in duration-700 delay-200">
            <Link
              href="#features"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-all duration-300 hover:scale-105"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-all duration-300 hover:scale-105"
            >
              Pricing
            </Link>
            <Link
              href="#demo"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-all duration-300 hover:scale-105"
            >
              Demo
            </Link>
          </nav>

          <div className="flex items-center space-x-3 animate-in fade-in slide-in-from-right duration-700">
            <Button
              variant="ghost"
              className="hidden md:inline-flex text-sm hover:scale-105 transition-transform duration-300"
            >
              Sign In
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-sm hover:scale-105 transition-all duration-300 hover:shadow-lg">
              Get Started
              <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1 duration-300" />
            </Button>
            <Button variant="ghost" size="sm" className="md:hidden hover:scale-105 transition-transform duration-300">
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Full Width, Compact */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 animate-in fade-in duration-1000" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-200/20 dark:bg-blue-800/10 rounded-full blur-3xl animate-in zoom-in duration-1000 delay-300" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-200/20 dark:bg-purple-800/10 rounded-full blur-3xl animate-in zoom-in duration-1000 delay-500" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-indigo-100/10 to-blue-100/10 dark:from-indigo-900/5 dark:to-blue-900/5 rounded-full blur-3xl animate-in zoom-in duration-1000 delay-700" />
        </div>

        <div className="relative w-full px-4 lg:px-8 xl:px-12 py-12 sm:py-14">
          {/* Hero Content - Two Column Layout */}
          <div className="grid lg:grid-cols-2 gap-8 items-center max-w-none">
            {/* Left Column - Content */}
            <div className="space-y-5 animate-in fade-in slide-in-from-left duration-800">
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 w-fit text-xs hover:scale-105 transition-transform duration-300">
                <Zap className="mr-1.5 h-3 w-3 animate-pulse" />
                Powered by Claude 4 Sonnet
              </Badge>

              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-tight animate-in fade-in slide-in-from-bottom duration-800 delay-200">
                  Unlock Document{" "}
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
                    Insights
                  </span>{" "}
                  
                </h1>

                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-xl animate-in fade-in slide-in-from-bottom duration-800 delay-400">
                  Upload documents anywhere, anytime. DigesText uses Claude 4 Sonnet to analyze content, extract key
                  insights, assess risks, and provide an AI assistant you can chat with about your data.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 animate-in fade-in slide-in-from-bottom duration-800 delay-600">
                <Button
                  size="default"
                  className="bg-blue-600 hover:bg-blue-700 text-base px-6 py-2.5 hover:scale-105 transition-all duration-300 hover:shadow-lg group"
                >
                  <Upload className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                  Upload & Analyze
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  className="text-base px-6 py-2.5 bg-transparent hover:scale-105 transition-all duration-300 hover:shadow-lg group"
                >
                  <Play className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                  Watch Demo
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400 animate-in fade-in duration-800 delay-800">
                <div className="flex items-center hover:scale-105 transition-transform duration-300">
                  <CheckCircle className="mr-1.5 h-3.5 w-3.5 text-green-500 animate-pulse" />
                  Mobile-friendly
                </div>
                <div className="flex items-center hover:scale-105 transition-transform duration-300">
                  <CheckCircle className="mr-1.5 h-3.5 w-3.5 text-green-500 animate-pulse" />
                  Instant analysis
                </div>
                <div className="flex items-center hover:scale-105 transition-transform duration-300">
                  <CheckCircle className="mr-1.5 h-3.5 w-3.5 text-green-500 animate-pulse" />
                  Risk assessment
                </div>
              </div>
            </div>

            {/* Right Column - Visual Element */}
            <div className="relative lg:pl-6 animate-in fade-in slide-in-from-right duration-800 delay-300">
              <div className="relative">
                <div className="aspect-[4/3] bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg hover:scale-110 transition-transform duration-300">
                      <FileText className="h-8 w-8 text-blue-600 animate-pulse" />
                    </div>
                    <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">Document Analysis Preview</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">AI-powered insights in seconds</p>
                  </div>
                </div>

                {/* Floating Elements - Animated */}
                <div className="absolute -top-4 -right-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg border animate-in zoom-in duration-800 delay-1000 hover:scale-110 transition-transform duration-300">
                  <div className="flex items-center space-x-2">
                    <Brain className="h-4 w-4 text-purple-600 animate-pulse" />
                    <div>
                      <p className="text-xs font-semibold">AI Analysis</p>
                      <p className="text-xs text-gray-500">Claude 4 Sonnet</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg border animate-in zoom-in duration-800 delay-1200 hover:scale-110 transition-transform duration-300">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600 animate-pulse" />
                    <div>
                      <p className="text-xs font-semibold">Risk Detection</p>
                      <p className="text-xs text-gray-500">Automated</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Video Section - Full Width, Compact */}
      <section id="demo" className="py-10 bg-gray-50 dark:bg-gray-900/50">
        <div className="w-full px-4 lg:px-8 xl:px-12">
          <div className="grid lg:grid-cols-5 gap-8 items-center">
            {/* Left Content - 2 columns */}
            <div className="lg:col-span-2 space-y-4 animate-in fade-in slide-in-from-left duration-800">
              <div>
                <Badge className="mb-3 bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 text-xs hover:scale-105 transition-transform duration-300">
                  <Play className="mr-1.5 h-3 w-3 animate-pulse" />
                  See DigesText in action
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 animate-in fade-in slide-in-from-bottom duration-800 delay-200">
                  Transform Documents into Actionable Insights
                </h2>
                <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed animate-in fade-in slide-in-from-bottom duration-800 delay-400">
                  Watch how DigesText analyzes your documents, identifies risks, and provides intelligent insights
                  through our AI-powered assistant.
                </p>
              </div>
            </div>

            {/* Right Video - 3 columns */}
            <div className="lg:col-span-3 animate-in fade-in slide-in-from-right duration-800 delay-300">
              <div className="relative">
                <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 group">
                  <div className="text-center">
                    <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mb-3 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Play className="h-6 w-6 text-blue-600 ml-0.5 animate-pulse" />
                    </div>
                    <p className="text-base text-gray-600 dark:text-gray-400 font-medium">DigesText Demo</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">See document analysis in action</p>
                  </div>
                </div>
                <div className="absolute -bottom-3 -right-3 bg-white dark:bg-gray-800 rounded-lg p-2.5 shadow-lg border animate-in zoom-in duration-800 delay-1000 hover:scale-110 transition-transform duration-300">
                  <div className="flex items-center space-x-2">
                    <div className="flex -space-x-1">
                      <div className="w-5 h-5 bg-blue-500 rounded-full border-2 border-white animate-pulse" />
                      <div className="w-5 h-5 bg-purple-500 rounded-full border-2 border-white animate-pulse" />
                      <div className="w-5 h-5 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                    </div>
                    <span className="text-xs font-medium">5k+ documents analyzed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Points - Compact Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {[
              {
                icon: CheckCircle,
                title: "Instant Document Insights",
                desc: "Upload any document and get immediate analysis of key themes, concepts, and important information",
                color: "green",
                delay: "delay-200",
              },
              {
                icon: AlertTriangle,
                title: "AI Risk Assessment",
                desc: "Automatically identify potential risks, compliance issues, and areas requiring attention",
                color: "red",
                delay: "delay-400",
              },
              {
                icon: MessageCircle,
                title: "Real-time Chat with Your Data",
                desc: "Ask questions, get clarifications, and explore your documents through natural conversation",
                color: "blue",
                delay: "delay-600",
              },
              {
                icon: Smartphone,
                title: "Mobile-First Experience",
                desc: "Upload and analyze documents on-the-go from any device, anywhere",
                color: "purple",
                delay: "delay-800",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className={`flex items-start space-x-3 animate-in fade-in slide-in-from-bottom duration-800 ${feature.delay} hover:scale-105 transition-transform duration-300`}
              >
                <div
                  className={`w-8 h-8 bg-${feature.color}-100 dark:bg-${feature.color}-900/20 rounded-lg flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon
                    className={`h-4 w-4 text-${feature.color}-600 dark:text-${feature.color}-400 animate-pulse`}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Full Width Grid, Compact */}
      <section id="features" className="py-12">
        <div className="w-full px-4 lg:px-8 xl:px-12">
          <div className="text-center mb-8 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom duration-800">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">Powerful document analysis features</h2>
            <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              Everything you need to unlock insights from your documents, powered by Claude 4 Sonnet
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[
              {
                icon: Smartphone,
                title: "Mobile Document Upload",
                desc: "Upload documents anytime, anywhere from your mobile device. Fully optimized for on-the-go access",
                color: "blue",
                span: "xl:col-span-2",
                delay: "delay-200",
              },
              {
                icon: Brain,
                title: "Claude 4 Sonnet Analysis",
                desc: "Advanced AI-powered document analysis using the latest Claude 4 Sonnet model for superior insights",
                color: "purple",
                span: "xl:col-span-2",
                delay: "delay-400",
              },
              {
                icon: MessageCircle,
                title: "AI Chat Assistant",
                desc: "Chat directly with your documents. Ask questions, get clarifications, and explore content naturally",
                color: "green",
                span: "xl:col-span-2",
                delay: "delay-600",
              },
              {
                icon: AlertTriangle,
                title: "Risk Identification",
                desc: "Automatically identify potential risks, compliance issues, and areas requiring immediate attention",
                color: "red",
                span: "xl:col-span-2",
                delay: "delay-800",
              },
              {
                icon: Eye,
                title: "Key Insights Extraction",
                desc: "Extract and highlight the most important information, themes, and concepts from any document",
                color: "orange",
                span: "xl:col-span-2",
                delay: "delay-1000",
              },
              {
                icon: Shield,
                title: "Secure Processing",
                desc: "Your documents are processed securely with enterprise-grade privacy and data protection",
                color: "teal",
                span: "xl:col-span-2",
                delay: "delay-1200",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className={`${feature.span} border-0 shadow-sm hover:shadow-lg transition-all duration-500 group animate-in fade-in slide-in-from-bottom duration-800 ${feature.delay} hover:scale-105`}
              >
                <CardHeader className="pb-3">
                  <div
                    className={`w-10 h-10 bg-${feature.color}-100 dark:bg-${feature.color}-900/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon
                      className={`h-5 w-5 text-${feature.color}-600 dark:text-${feature.color}-400 animate-pulse`}
                    />
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{feature.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - Full Width with Side Content, Compact */}
      <section id="pricing" className="py-10 bg-gray-50 dark:bg-gray-900/50">
        <div className="w-full px-4 lg:px-8 xl:px-12">
          <div className="grid lg:grid-cols-3 gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-1 space-y-4 animate-in fade-in slide-in-from-left duration-800">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">Simple, affordable pricing</h2>
                <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                  Get access to Claude 4 Sonnet's advanced capabilities at an unbeatable price
                </p>
              </div>

              <div className="space-y-3">
                {[
                  "No setup fees or hidden costs",
                  "Cancel anytime, no questions asked",
                  "24/7 priority support included",
                ].map((benefit, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-2 animate-in fade-in slide-in-from-left duration-800 delay-${(index + 2) * 200} hover:scale-105 transition-transform duration-300`}
                  >
                    <CheckCircle className="h-4 w-4 text-green-500 animate-pulse" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Center Pricing Card */}
            <div className="lg:col-span-1 flex justify-center animate-in fade-in zoom-in duration-800 delay-400">
              <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-xl relative w-full max-w-sm hover:shadow-2xl transition-all duration-500 hover:scale-105 group">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 animate-bounce">
                  <Badge className="bg-blue-600 text-white px-3 py-1 text-xs">
                    <Star className="mr-1 h-3 w-3 animate-pulse" />
                    Best Value
                  </Badge>
                </div>

                <CardHeader className="text-center pb-4 pt-6">
                  <CardTitle className="text-xl">Pro Plan</CardTitle>
                  <div className="mt-3">
                    <span className="text-3xl font-bold group-hover:scale-110 transition-transform duration-300 inline-block">
                      $2.99
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">/month</span>
                  </div>
                  <CardDescription className="mt-2 text-sm">
                    Complete document analysis with Claude 4 Sonnet included
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {[
                      "Unlimited document uploads",
                      "Claude 4 Sonnet analysis included",
                      "AI chat assistant",
                      "Risk assessment & insights",
                      "Mobile app access",
                      "Priority support",
                    ].map((feature, index) => (
                      <div
                        key={index}
                        className={`flex items-center text-sm animate-in fade-in slide-in-from-left duration-500 delay-${(index + 1) * 100} hover:scale-105 transition-transform duration-300`}
                      >
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 animate-pulse" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 mt-4 hover:scale-105 transition-all duration-300 hover:shadow-lg group"
                    size="default"
                  >
                    Start Analyzing Documents
                    <ArrowRight className="ml-2 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>

                  <p className="text-center text-xs text-gray-600 dark:text-gray-400 animate-pulse">
                    7-day free trial • No credit card required
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Right Stats */}
            <div className="lg:col-span-1 space-y-4 animate-in fade-in slide-in-from-right duration-800 delay-600">
              {[
                { number: "5,000+", label: "Documents analyzed daily", color: "blue" },
                { number: "99.9%", label: "Uptime guarantee", color: "purple" },
                { number: "< 30s", label: "Average analysis time", color: "green" },
              ].map((stat, index) => (
                <div
                  key={index}
                  className={`text-center lg:text-left animate-in fade-in slide-in-from-right duration-800 delay-${(index + 8) * 100} hover:scale-105 transition-transform duration-300`}
                >
                  <div
                    className={`text-2xl font-bold text-${stat.color}-600 mb-1 hover:scale-110 transition-transform duration-300 inline-block`}
                  >
                    {stat.number}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Full Width, Compact */}
      <footer className="border-t bg-white dark:bg-gray-950 animate-in fade-in slide-in-from-bottom duration-800">
        <div className="w-full px-4 lg:px-8 xl:px-12 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            <div className="col-span-2 animate-in fade-in slide-in-from-left duration-800">
              <div className="flex items-center space-x-2 mb-3">
                <div className="relative">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 hover:scale-110 transition-transform duration-300" />
                  <Sparkles className="h-2 w-2 text-purple-500 absolute -top-0.5 -right-0.5 animate-pulse" />
                </div>
                <span className="text-base font-bold">DigesText</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                AI-powered document analysis and insights, powered by Claude 4 Sonnet. Transform your documents into
                actionable intelligence.
              </p>
            </div>

            {[
              { title: "Company", links: ["About", "Contact", "Careers"] },
              { title: "Product", links: ["Features", "Pricing", "Demo"] },
              { title: "Legal", links: ["Terms", "Privacy", "Security"] },
              { title: "Resources", links: ["Blog", "Help Center", "API Docs"] },
            ].map((section, sectionIndex) => (
              <div
                key={sectionIndex}
                className={`animate-in fade-in slide-in-from-bottom duration-800 delay-${(sectionIndex + 2) * 200}`}
              >
                <h3 className="font-semibold mb-3 text-sm">{section.title}</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link
                        href={`/${link.toLowerCase()}`}
                        className="hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-300 hover:scale-105 inline-block"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>  

          <div className="border-t mt-6 pt-6 flex flex-col md:flex-row items-center justify-between animate-in fade-in duration-800 delay-1000">
            <p className="text-sm text-gray-600 dark:text-gray-400">© 2024 DigesText. All rights reserved.</p>
            <div className="flex items-center space-x-4 mt-3 md:mt-0">
              <span className="text-sm text-gray-600 dark:text-gray-400">Powered by Claude 4 Sonnet</span>
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="text-xs hover:scale-105 transition-transform duration-300">
                  <Zap className="h-2.5 w-2.5 mr-1 animate-pulse" />
                  AI-Powered
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
