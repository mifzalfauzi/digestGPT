import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Typewriter } from "react-simple-typewriter"
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
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useState } from "react"

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handlePlanClick = (planType) => {
    if (isAuthenticated) {
      // User is authenticated, redirect to assistant
      navigate('/assistant');
    } else {
      // User is not authenticated, redirect to sign in
      navigate('/signin');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 scroll-smooth">
      {/* Header - Mobile Responsive */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 dark:bg-[#121212]/95 dark:backdrop-blur-md dark:supports-[backdrop-filter]:bg-[#121212]/80 shadow-sm">
        <div className="container mx-auto px-4 flex h-14 items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-base sm:text-lg md:text-xl font-bold text-center">
              drop
              <span className="text-blue-400">2</span>
              chat
              <span className="text-red-500">*</span>
            </h1>
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <a
              href="#features"
              className="text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-gray-100 transition-colors"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-gray-100 transition-colors"
            >
              Pricing
            </a>
            <a
              href="#demo"
              className="text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-gray-100 transition-colors"
            >
              Demo
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            {/* Mobile Sign In Button */}
            <Link to="/signin" className="md:hidden">
              <Button size="sm" className="text-xs px-3 py-1 bg-white text-black hover:bg-black hover:text-white">
                Get Started
              </Button>
            </Link>
            
            {/* Desktop Get Started Button */}
            <Link to="/signin" className="hidden md:inline-flex">
              <Button variant="ghost" className="text-sm bg-white text-black hover:bg-black hover:text-white">
                Get Started
              </Button>
            </Link>

            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed top-14 left-0 right-0 bg-white/95 backdrop-blur-md dark:bg-[#121212]/95 dark:backdrop-blur-md border-b shadow-lg z-40">
            <div className="container mx-auto px-4 py-4">
              <nav className="flex flex-col space-y-4">
                <a
                  href="#features"
                  className="text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-gray-100 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Features
                </a>
                <a
                  href="#pricing"
                  className="text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-gray-100 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Pricing
                </a>
                <a
                  href="#demo"
                  className="text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-gray-100 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Demo
                </a>
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section - Mobile Responsive */}
      <section className="relative overflow-hidden scroll-smooth pt-14">
        <div className="absolute inset-0 dark:bg-[#121212]" />

        <div className="relative container mx-auto px-4 py-8 sm:py-16">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-24 items-center">
            {/* Left Side - Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-4 sm:mb-6">
                <span className="bg-black dark:bg-white bg-clip-text text-transparent block sm:whitespace-nowrap">
                  <Typewriter
                    words={["Obtain Valuable Insights", "SmartDoc Summary", "Assess Risks On-The-Go", "Identify Key Concepts", "Instant SWOT Analysis"]}
                    loop={true}
                    cursor={true}
                    cursorStyle="|"
                    typeSpeed={70}
                    deleteSpeed={70}
                    delaySpeed={1000}
                  />
                </span>
              </h1>
              
              <p className="text-base sm:text-lg leading-relaxed dark:text-gray-300 mt-4 sm:mt-8 mb-4 sm:mb-6 text-center lg:text-left">
                Have a conversation with your documents anywhere, anytime.
              </p>

              <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6 sm:mb-8 text-center lg:text-left">
                <span className="font-bold inline-block">
                  drop
                  <span className="text-blue-400">2</span>
                  chat
                  <span className="text-red-500">*</span>
                </span>{' '}
                introduces <span className="font-bold inline-block">
                  Elva
                  <span className="text-red-500">*</span>
                </span> (powered by Claude 4 Sonnet), an AI assistant that analyzes your documents, extracts key insights, identifies potential risks, and generates a concise executive summary.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start mb-6 sm:mb-8">
                <Button
                  size="default"
                  className="bg-blue-700 dark:bg-white hover:bg-black hover:text-white dark:text-black dark:hover:bg-black dark:hover:text-white px-6 sm:px-8 text-sm sm:text-base"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload & Analyze
                </Button>

                <Button size="default" className="text-white px-6 sm:px-8 bg-[#000000] hover:bg-white hover:text-black text-sm sm:text-base">
                  <Play className="mr-2 h-4 w-4" />
                  Watch Demo
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-6 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <CheckCircle className="mr-1.5 h-3 sm:h-3.5 w-3 sm:w-3.5 text-green-500" />
                  Mobile-friendly
                </div>
                <div className="flex items-center">
                  <CheckCircle className="mr-1.5 h-3 sm:h-3.5 w-3 sm:w-3.5 text-green-500" />
                  Instant analysis
                </div>
                <div className="flex items-center">
                  <CheckCircle className="mr-1.5 h-3 sm:h-3.5 w-3 sm:w-3.5 text-green-500" />
                  Risk assessment
                </div>
              </div>
            </div>

            {/* Right Side - Placeholder - Hidden on mobile */}
            <div className="hidden lg:flex items-center justify-center lg:justify-end">
              <div className="w-full max-w-md h-96 dark:bg-black rounded-2xl border-2 border-dashed border-blue-200 dark:border-black flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-black rounded-full flex items-center justify-center mb-4 mx-auto">
                    <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Content Placeholder
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Add your content here
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Video Section - Mobile Responsive */}
      <section id="demo" className="py-8 sm:py-16 bg-gray-50 dark:bg-[#121212] scroll-smooth">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-3 sm:mb-4 bg-purple-100 text-purple-800 dark:bg-black dark:text-white text-xs px-2 py-1">
            <Play className="mr-1.5 h-3 w-3 inline" />
            See&nbsp;
            <span className="inline-block">
              Elva
              <span className="text-red-500">*</span>
            </span>
            &nbsp;in action
          </Badge>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 sm:mb-4 max-w-3xl mx-auto">
            Transform Documents into Actionable Insights
          </h2>

          <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-8 sm:mb-12 max-w-2xl mx-auto">
             <span className="font-bold inline-block">
                  Elva
                  <span className="text-red-500">*</span>
                  </span> analyzes documents, identifies risks, and provides intelligent insights.
          </p>

          {/* Demo Video - Mobile Responsive */}
          <div className="max-w-4xl mx-auto mb-8 sm:mb-12">
            <div className="relative">
              <div className="aspect-video bg-black dark:bg-black rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-xl">
                <div className="text-center px-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mb-3 sm:mb-4 mx-auto shadow-lg">
                    <Play className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 ml-0.5" />
                  </div>
                  <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 font-medium">
                    <span className="inline-block">
                      drop
                      <span className="text-blue-400">2</span>
                      chat
                      <span className="text-red-500">*</span>
                    </span> Demo
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">See document analysis in action</p>
                </div>
              </div>
              <div className="absolute -bottom-2 sm:-bottom-4 -right-2 sm:-right-4 bg-white dark:bg-gray-800 rounded-lg p-2 sm:p-3 shadow-lg border">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <div className="flex -space-x-1">
                    <div className="w-3 h-3 sm:w-5 sm:h-5 bg-blue-500 rounded-full border-2 border-white" />
                    <div className="w-3 h-3 sm:w-5 sm:h-5 bg-purple-500 rounded-full border-2 border-white" />
                    <div className="w-3 h-3 sm:w-5 sm:h-5 bg-green-500 rounded-full border-2 border-white" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium">5k+ docs analyzed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Points - Mobile Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
            <div className="flex items-start space-x-3 sm:space-x-4 text-left">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">Instant Document Insights</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Upload any document and get immediate analysis of key themes, concepts, and important information
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 sm:space-x-4 text-left">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">AI Risk Assessment</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Automatically identify potential risks, compliance issues, and areas requiring attention
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 sm:space-x-4 text-left">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">Real-time Chat</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Ask questions, get clarifications, and explore your documents through natural conversation
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 sm:space-x-4 text-left">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">Mobile-First Experience</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Upload and analyze documents on-the-go from any device, anywhere
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Mobile Responsive Grid */}
      <section id="features" className="py-8 sm:py-16 scroll-smooth dark:bg-[#121212]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 sm:mb-4">Powerful document analysis features</h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-8 sm:mb-12 max-w-2xl mx-auto">
            Everything you need to unlock insights from your documents
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
            <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 group text-left dark:bg-black">
              <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Smartphone className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-base sm:text-lg">Mobile Document Upload</CardTitle>
                <CardDescription className="text-xs sm:text-sm leading-relaxed">
                  Upload documents anytime, anywhere from your mobile device. Fully optimized for on-the-go access
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 group text-left dark:bg-black">
              <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-base sm:text-lg">Claude 4 Sonnet Analysis</CardTitle>
                <CardDescription className="text-xs sm:text-sm leading-relaxed">
                  Advanced AI-powered document analysis using the latest Claude 4 Sonnet model for superior insights
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 group text-left dark:bg-black">
              <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-base sm:text-lg">AI Chat Assistant</CardTitle>
                <CardDescription className="text-xs sm:text-sm leading-relaxed">
                  Chat directly with your documents. Ask questions, get clarifications, and explore content naturally
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 group text-left dark:bg-black">
              <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle className="text-base sm:text-lg">Risk Identification</CardTitle>
                <CardDescription className="text-xs sm:text-sm leading-relaxed">
                  Automatically identify potential risks, compliance issues, and areas requiring immediate attention
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 group text-left dark:bg-black">
              <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle className="text-base sm:text-lg">Key Insights Extraction</CardTitle>
                <CardDescription className="text-xs sm:text-sm leading-relaxed">
                  Extract and highlight the most important information, themes, and concepts from any document
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 group text-left dark:bg-black">
              <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-100 dark:bg-teal-900/20 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600 dark:text-teal-400" />
                </div>
                <CardTitle className="text-base sm:text-lg">Secure Processing</CardTitle>
                <CardDescription className="text-xs sm:text-sm leading-relaxed">
                  Your documents are processed securely with enterprise-grade privacy and data protection
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section - Mobile Responsive */}
      <section id="pricing" className="py-8 sm:py-16 bg-gray-50 scroll-smooth dark:bg-[#121212]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 sm:mb-4">Simple, affordable pricing</h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-8 sm:mb-12 max-w-2xl mx-auto">
            Get access to intelligent document capabilities at an unbeatable price
          </p>

          {/* Mobile-First Pricing Cards */}
          <div className="max-w-7xl mx-auto mb-8 sm:mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <Card className="shadow-xl flex flex-col justify-between dark:bg-black">
                <CardHeader className="text-center pb-4 sm:pb-6 pt-6 sm:pt-8 px-4 sm:px-6">
                  <CardTitle className="text-xl sm:text-2xl">Free Plan</CardTitle>
                  <div className="mt-3 sm:mt-4">
                    <span className="text-3xl sm:text-4xl font-bold">$0</span>
                    <span className="text-sm sm:text-lg text-gray-600 dark:text-gray-400">/month</span>
                  </div>
                  <CardDescription className="mt-2 sm:mt-3 text-sm sm:text-base">For first-time users</CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col justify-between flex-1 px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center text-xs sm:text-sm font-medium text-gray-300">
                      <span>Includes</span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                      <span>Claude 4 Sonnet analysis</span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                      <span>Risk assessment & insights</span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                      <span>Accessible on any device</span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                      <span>1 document upload</span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                      <span>3 chat assistant interactions</span>
                    </div>
                  </div>

                  <div className="flex justify-start pt-4 sm:pt-6">
                    <Button className="bg-white w-full hover:bg-yellow-700 hover:text-white px-3 sm:px-4 py-2 text-xs sm:text-sm" size="sm" onClick={() => handlePlanClick('free')}>
                      Try drop2chat*
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Standard Plan */}
              <Card className="shadow-xl flex flex-col justify-between dark:bg-black">
                <CardHeader className="text-center pb-4 sm:pb-6 pt-6 sm:pt-8 px-4 sm:px-6">
                  <CardTitle className="text-xl sm:text-2xl">Standard Plan</CardTitle>
                  <div className="mt-3 sm:mt-4">
                    <span className="text-3xl sm:text-4xl font-bold">$3.99</span>
                    <span className="text-sm sm:text-lg text-gray-600 dark:text-gray-400">/month</span>
                  </div>
                  <CardDescription className="mt-2 sm:mt-3 text-sm sm:text-base">Ideal for students, hobbyists, and casual users</CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col justify-between flex-1 px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center text-xs sm:text-sm font-medium text-gray-300">
                      <span>All features of the Free Plan, plus</span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                      <span>Priority support</span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                      <span>50 document uploads</span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                      <span>100 chat assistant interactions</span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                      <span>100k tokens per month</span>
                    </div>
                  </div>

                  <div className="flex justify-start pt-4 sm:pt-6">
                    <Button 
                      onClick={() => handlePlanClick('standard')}
                      className="bg-white w-full hover:bg-green-700 hover:text-white px-3 sm:px-4 py-2 text-xs sm:text-sm" 
                      size="sm"
                    >
                      Try drop2chat*
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Pro Plan */}
              <Card className="shadow-xl flex flex-col justify-between relative dark:bg-black">
                <div className="absolute -top-2 sm:-top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-3 sm:px-4 py-1 text-xs sm:text-sm">
                    <Star className="mr-1 h-3 w-3" />
                    Best Value
                  </Badge>
                </div>

                <CardHeader className="text-center pb-4 sm:pb-6 pt-6 sm:pt-8 px-4 sm:px-6">
                  <CardTitle className="text-xl sm:text-2xl">Pro Plan</CardTitle>
                  <div className="mt-3 sm:mt-4">
                    <span className="text-3xl sm:text-4xl font-bold">$7.99</span>
                    <span className="text-sm sm:text-lg text-gray-600 dark:text-gray-400">/month</span>
                  </div>
                  <CardDescription className="mt-2 sm:mt-3 text-sm sm:text-base">Perfect for researchers and professionals</CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col justify-between flex-1 px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center text-xs sm:text-sm font-medium text-gray-300">
                      <span>All features of the Standard Plan, plus</span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                      <span>150 document uploads</span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                      <span>350 chat assistant interactions</span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                      <span>350k tokens per month</span>
                    </div>
                  </div>

                  <div className="flex justify-start pt-4 sm:pt-6">
                    <Button 
                      onClick={() => handlePlanClick('pro')}
                      className="bg-white w-full hover:bg-blue-700 hover:text-white px-3 sm:px-4 py-2 text-xs sm:text-sm" 
                      size="sm"
                    >
                      Try drop2chat*
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Stats Row - Mobile Responsive */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold dark:text-white mb-1 sm:mb-2">5,000+</div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Documents analyzed daily</p>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold dark:text-white mb-1 sm:mb-2">99.9%</div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Uptime guarantee</p>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold dark:text-white mb-1 sm:mb-2">&lt; 60s</div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Average analysis time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Compact */}
      <footer className="border-t bg-white dark:bg-[#121212]">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">

                <h1 className="text-lg sm:text-xl font-bold text-center">
                  drop
                  <span className="text-blue-400">2</span>
                  chat
                  <span className="text-red-500">*</span>
                </h1>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Document analysis and insights, powered by Claude 4 Sonnet through <span className="text-center inline-block font-bold">Elva<span className="text-red-500">*</span></span>.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-sm">Company</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <Link href="/about" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-sm">Product</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <Link href="/features" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/demo" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                    Demo
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-sm">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <Link href="/terms" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">© 2025  <span className="font-bold text-center inline-block">
              drop
              <span className="text-blue-400">2</span>
              chat
              <span className="text-red-500">*</span>
            </span>{' '}. All rights reserved.</p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <span className="text-sm text-gray-600 dark:text-gray-400">Powered by Claude 4 Sonnet</span>
              {/* <Badge variant="outline" className="text-xs">
                <Zap className="h-2.5 w-2.5 mr-1" />
                AI-Powered
              </Badge> */}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
