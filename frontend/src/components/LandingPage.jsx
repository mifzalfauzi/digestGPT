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
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-950/95 dark:supports-[backdrop-filter]:bg-gray-950/60">
        <div className="w-full max-w-none px-6 lg:px-12 xl:px-16 flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <Sparkles className="h-3 w-3 text-purple-500 absolute -top-0.5 -right-0.5" />
            </div>
            <span className="text-xl font-bold">DigesText</span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
            <Link
              href="#features"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="#demo"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              Demo
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="hidden md:inline-flex">
              Sign In
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Full Width */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/20 dark:bg-blue-800/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/20 dark:bg-purple-800/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-indigo-100/10 to-blue-100/10 dark:from-indigo-900/5 dark:to-blue-900/5 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full px-6 lg:px-12 xl:px-16 py-20 sm:py-32">
          {/* Hero Content - Two Column Layout */}
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-none">
            {/* Left Column - Content */}
            <div className="space-y-8">
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 w-fit">
                <Zap className="mr-2 h-4 w-4" />
                Powered by Claude 4 Sonnet
              </Badge>

              <div className="space-y-6">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight leading-none">
                  Unlock Document{" "}
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Insights
                  </span>{" "}
                  Instantly
                </h1>

                <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                  Upload documents anywhere, anytime. DigesText uses Claude 4 Sonnet to analyze content, extract key
                  insights, assess risks, and provide an AI assistant you can chat with about your data.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4">
                  <Upload className="mr-2 h-5 w-5" />
                  Upload & Analyze
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-4 bg-transparent">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-8 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Mobile-friendly
                </div>
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Instant analysis
                </div>
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Risk assessment
                </div>
              </div>
            </div>

            {/* Right Column - Visual Element */}
            <div className="relative lg:pl-8">
              <div className="relative">
                <div className="aspect-[4/3] bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-2xl">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg">
                      <FileText className="h-12 w-12 text-blue-600" />
                    </div>
                    <p className="text-xl text-gray-600 dark:text-gray-400 font-medium">Document Analysis Preview</p>
                    <p className="text-gray-500 dark:text-gray-500 mt-2">AI-powered insights in seconds</p>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-6 -right-6 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-xl border">
                  <div className="flex items-center space-x-3">
                    <Brain className="h-6 w-6 text-purple-600" />
                    <div>
                      <p className="text-sm font-semibold">AI Analysis</p>
                      <p className="text-xs text-gray-500">Claude 4 Sonnet</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-xl border">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                    <div>
                      <p className="text-sm font-semibold">Risk Detection</p>
                      <p className="text-xs text-gray-500">Automated</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Video Section - Full Width */}
      <section id="demo" className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="w-full px-6 lg:px-12 xl:px-16">
          <div className="grid lg:grid-cols-5 gap-16 items-center">
            {/* Left Content - 2 columns */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <Badge className="mb-4 bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200">
                  <Play className="mr-2 h-4 w-4" />
                  See DigesText in action
                </Badge>
                <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
                  Transform Documents into Actionable Insights
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  Watch how DigesText analyzes your documents, identifies risks, and provides intelligent insights
                  through our AI-powered assistant.
                </p>
              </div>
            </div>

            {/* Right Video - 3 columns */}
            <div className="lg:col-span-3">
              <div className="relative">
                <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-2xl">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg">
                      <Play className="h-8 w-8 text-blue-600 ml-1" />
                    </div>
                    <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">DigesText Demo</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">See document analysis in action</p>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg border">
                  <div className="flex items-center space-x-2">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white" />
                      <div className="w-6 h-6 bg-purple-500 rounded-full border-2 border-white" />
                      <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white" />
                    </div>
                    <span className="text-sm font-medium">5k+ documents analyzed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Points - Full Width Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Instant Document Insights</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Upload any document and get immediate analysis of key themes, concepts, and important information
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">AI Risk Assessment</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Automatically identify potential risks, compliance issues, and areas requiring attention
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Real-time Chat with Your Data</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Ask questions, get clarifications, and explore your documents through natural conversation
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Smartphone className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Mobile-First Experience</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Upload and analyze documents on-the-go from any device, anywhere
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Full Width Grid */}
      <section id="features" className="py-20">
        <div className="w-full px-6 lg:px-12 xl:px-16">
          <div className="text-center mb-16 max-w-4xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">Powerful document analysis features</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Everything you need to unlock insights from your documents, powered by Claude 4 Sonnet
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-8">
            <Card className="xl:col-span-2 border-0 shadow-sm hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Smartphone className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-xl">Mobile Document Upload</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Upload documents anytime, anywhere from your mobile device. Fully optimized for on-the-go access
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="xl:col-span-2 border-0 shadow-sm hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Brain className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-xl">Claude 4 Sonnet Analysis</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Advanced AI-powered document analysis using the latest Claude 4 Sonnet model for superior insights
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="xl:col-span-2 border-0 shadow-sm hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <MessageCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-xl">AI Chat Assistant</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Chat directly with your documents. Ask questions, get clarifications, and explore content naturally
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="xl:col-span-2 border-0 shadow-sm hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle className="text-xl">Risk Identification</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Automatically identify potential risks, compliance issues, and areas requiring immediate attention
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="xl:col-span-2 border-0 shadow-sm hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Eye className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle className="text-xl">Key Insights Extraction</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Extract and highlight the most important information, themes, and concepts from any document
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="xl:col-span-2 border-0 shadow-sm hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-8 w-8 text-teal-600 dark:text-teal-400" />
                </div>
                <CardTitle className="text-xl">Secure Processing</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Your documents are processed securely with enterprise-grade privacy and data protection
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section - Full Width with Side Content */}
      <section id="pricing" className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="w-full px-6 lg:px-12 xl:px-16">
          <div className="grid lg:grid-cols-3 gap-16 items-center">
            {/* Left Content */}
            <div className="lg:col-span-1 space-y-6">
              <div>
                <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">Simple, affordable pricing</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  Get access to Claude 4 Sonnet's advanced capabilities at an unbeatable price
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">No setup fees or hidden costs</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">Cancel anytime, no questions asked</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">24/7 priority support included</span>
                </div>
              </div>
            </div>

            {/* Center Pricing Card */}
            <div className="lg:col-span-1 flex justify-center">
              <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-2xl relative w-full max-w-md">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-4 py-1">
                    <Star className="mr-1 h-3 w-3" />
                    Best Value
                  </Badge>
                </div>

                <CardHeader className="text-center pb-8 pt-8">
                  <CardTitle className="text-2xl">Pro Plan</CardTitle>
                  <div className="mt-4">
                    <span className="text-5xl font-bold">$2.99</span>
                    <span className="text-gray-600 dark:text-gray-400">/month</span>
                  </div>
                  <CardDescription className="mt-4 text-base">
                    Complete document analysis with Claude 4 Sonnet included
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span>Unlimited document uploads</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span>Claude 4 Sonnet analysis included</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span>AI chat assistant</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span>Risk assessment & insights</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span>Mobile app access</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span>Priority support</span>
                    </div>
                  </div>

                  <Button className="w-full bg-blue-600 hover:bg-blue-700 mt-8" size="lg">
                    Start Analyzing Documents
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                    7-day free trial • No credit card required
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Right Stats */}
            <div className="lg:col-span-1 space-y-8">
              <div className="text-center lg:text-left">
                <div className="text-4xl font-bold text-blue-600 mb-2">5,000+</div>
                <p className="text-gray-600 dark:text-gray-400">Documents analyzed daily</p>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-4xl font-bold text-purple-600 mb-2">99.9%</div>
                <p className="text-gray-600 dark:text-gray-400">Uptime guarantee</p>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-4xl font-bold text-green-600 mb-2">&lt; 30s</div>
                <p className="text-gray-600 dark:text-gray-400">Average analysis time</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Full Width */}
      <footer className="border-t bg-white dark:bg-gray-950">
        <div className="w-full px-6 lg:px-12 xl:px-16 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <Sparkles className="h-2.5 w-2.5 text-purple-500 absolute -top-0.5 -right-0.5" />
                </div>
                <span className="text-lg font-bold">DigesText</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                AI-powered document analysis and insights, powered by Claude 4 Sonnet. Transform your documents into
                actionable intelligence.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
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
              <h3 className="font-semibold mb-4">Product</h3>
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
              <h3 className="font-semibold mb-4">Legal</h3>
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

            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <Link href="/blog" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/api" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                    API Docs
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-12 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">© 2024 DigesText. All rights reserved.</p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <span className="text-sm text-gray-600 dark:text-gray-400">Powered by Claude 4 Sonnet</span>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
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
