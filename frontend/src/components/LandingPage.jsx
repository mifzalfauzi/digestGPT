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
      {/* Header - Compact */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-950/95 dark:supports-[backdrop-filter]:bg-gray-950/60">
        <div className="container mx-auto px-4 flex h-14 items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <Sparkles className="h-2.5 w-2.5 text-purple-500 absolute -top-0.5 -right-0.5" />
            </div>
            <span className="text-lg font-bold">Drop2Chat</span>
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <a
              href="#features"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              Pricing
            </a>
            <a
              href="#demo"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              Demo
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            <Link to="/signin">
            <Button variant="ghost" className="hidden md:inline-flex text-sm">
              Sign In
            </Button>
            </Link>
            <Link to="/signup">
            <Button className="bg-blue-600 hover:bg-blue-700 text-sm">
              Get Started
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
            </Link>
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Centered & Compact */}
      <section className="relative overflow-hidden scroll-smooth">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-200/20 dark:bg-blue-800/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-200/20 dark:bg-purple-800/10 rounded-full blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <div className="text-center lg:text-left">
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 mb-6 text-xs">
                <Zap className="mr-1.5 h-3 w-3" />
                Powered by Claude 4 Sonnet
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
                Unlock Document{" "}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Insights</span>{" "}
                
              </h1>

              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                Upload documents anywhere, anytime. Drop2Chat uses Claude 4 Sonnet to analyze content, extract key insights,
                assess risks, and provide an AI assistant you can chat with about your data.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-base px-8">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload & Analyze
                </Button>
                <Button variant="outline" size="lg" className="text-base px-8 bg-transparent">
                  <Play className="mr-2 h-4 w-4" />
                  Watch Demo
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <CheckCircle className="mr-1.5 h-3.5 w-3.5 text-green-500" />
                  Mobile-friendly
                </div>
                <div className="flex items-center">
                  <CheckCircle className="mr-1.5 h-3.5 w-3.5 text-green-500" />
                  Instant analysis
                </div>
                <div className="flex items-center">
                  <CheckCircle className="mr-1.5 h-3.5 w-3.5 text-green-500" />
                  Risk assessment
                </div>
              </div>
            </div>

            {/* Right Side - Placeholder */}
            <div className="flex items-center justify-center">
              <div className="w-full max-w-md h-96 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-700 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mb-4 mx-auto">
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

      {/* Demo Video Section - Centered */}
      <section id="demo" className="py-16 bg-gray-50 dark:bg-gray-900/50 scroll-smooth">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4 bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 text-xs">
            <Play className="mr-1.5 h-3 w-3" />
            See Drop2Chat in action
          </Badge>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 max-w-3xl mx-auto">
            Transform Documents into Actionable Insights
          </h2>

          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-12 max-w-2xl mx-auto">
            Watch how DigesText analyzes your documents, identifies risks, and provides intelligent insights through our
            AI-powered assistant.
          </p>

          {/* Demo Video - Centered */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-xl">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg">
                    <Play className="h-8 w-8 text-blue-600 ml-0.5" />
                  </div>
                  <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">Drop2Chat Demo</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">See document analysis in action</p>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg border">
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-1">
                    <div className="w-5 h-5 bg-blue-500 rounded-full border-2 border-white" />
                    <div className="w-5 h-5 bg-purple-500 rounded-full border-2 border-white" />
                    <div className="w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
                  </div>
                  <span className="text-sm font-medium">5k+ documents analyzed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Points - Compact 2x2 Grid */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="flex items-start space-x-4 text-left">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-base mb-2">Instant Document Insights</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload any document and get immediate analysis of key themes, concepts, and important information
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 text-left">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-base mb-2">AI Risk Assessment</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Automatically identify potential risks, compliance issues, and areas requiring attention
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 text-left">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-base mb-2">Real-time Chat with Your Data</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ask questions, get clarifications, and explore your documents through natural conversation
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 text-left">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Smartphone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-base mb-2">Mobile-First Experience</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload and analyze documents on-the-go from any device, anywhere
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Compact 3-Column Grid */}
      <section id="features" className="py-16 scroll-smooth">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Powerful document analysis features</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-12 max-w-2xl mx-auto">
            Everything you need to unlock insights from your documents, powered by Claude 4 Sonnet
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 group text-left">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-lg">Mobile Document Upload</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Upload documents anytime, anywhere from your mobile device. Fully optimized for on-the-go access
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 group text-left">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-lg">Claude 4 Sonnet Analysis</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Advanced AI-powered document analysis using the latest Claude 4 Sonnet model for superior insights
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 group text-left">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <MessageCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-lg">AI Chat Assistant</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Chat directly with your documents. Ask questions, get clarifications, and explore content naturally
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 group text-left">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle className="text-lg">Risk Identification</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Automatically identify potential risks, compliance issues, and areas requiring immediate attention
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 group text-left">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Eye className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle className="text-lg">Key Insights Extraction</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Extract and highlight the most important information, themes, and concepts from any document
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 group text-left">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                </div>
                <CardTitle className="text-lg">Secure Processing</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Your documents are processed securely with enterprise-grade privacy and data protection
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section - Centered Single Column */}
      <section id="pricing" className="py-16 bg-gray-50 dark:bg-gray-900/50 scroll-smooth">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Simple, affordable pricing</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-12 max-w-2xl mx-auto">
            Get access to Claude 4 Sonnet's advanced capabilities at an unbeatable price
          </p>

          {/* Centered Pricing Card */}
          <div className="max-w-8xl mx-auto mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-2 border-yellow-200 dark:border-yellow-800 shadow-xl flex flex-col justify-between">
        <CardHeader className="text-center pb-6 pt-8">
          <CardTitle className="text-2xl">Free Plan</CardTitle>
          <div className="mt-4">
            <span className="text-4xl font-bold">$0</span>
            <span className="text-lg text-gray-600 dark:text-gray-400">/month</span>
          </div>
          <CardDescription className="mt-3 text-base">For first-time users</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col justify-between flex-1">
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
              <span>Claude 4 Sonnet analysis included</span>
            </div>
            <div className="flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
              <span>Risk assessment & insights</span>
            </div>
            <div className="flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
              <span>Accessible on any device</span>
            </div>
            <div className="flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
              <span>1 document upload</span>
            </div>
            <div className="flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
              <span>3 chat assistant interactions</span>
            </div>
          </div>

          <div className="flex justify-start pt-6">
            <Button className="bg-white hover:bg-yellow-700 px-4 py-2 text-sm" size="sm">
              Start 
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Standard Plan */}
      <Card className="border-2 border-green-200 dark:border-green-800 shadow-xl flex flex-col justify-between">
        <CardHeader className="text-center pb-6 pt-8">
          <CardTitle className="text-2xl">Standard Plan</CardTitle>
          <div className="mt-4">
            <span className="text-4xl font-bold">$3.99</span>
            <span className="text-lg text-gray-600 dark:text-gray-400">/month</span>
          </div>
          <CardDescription className="mt-3 text-base">For moderate document analysis</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col justify-between flex-1">
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
              <span>All features of the Free Plan</span>
            </div>
            {/* <div className="flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
              <span>Risk assessment & insights</span>
            </div>
            <div className="flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
              <span>Accessible on any device</span>
            </div> */}
            <div className="flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
              <span>Priority support</span>
            </div>
            <div className="flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
              <span>50 document uploads</span>
            </div>
            <div className="flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
              <span>100 chat assistant interactions</span>
            </div>
            <div className="flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
              <span>100k tokens per month</span>
            </div>
          </div>

          <div className="flex justify-start pt-6">
            <Button className="bg-white hover:bg-green-700 px-4 py-2 text-sm" size="sm">
              Get Standard   
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pro Plan */}
      <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-xl flex flex-col justify-between relative">
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-blue-600 text-white px-4 py-1 text-sm">
            <Star className="mr-1 h-3 w-3" />
            Best Value
          </Badge>
        </div>

        <CardHeader className="text-center pb-6 pt-8">
          <CardTitle className="text-2xl">Pro Plan</CardTitle>
          <div className="mt-4">
            <span className="text-4xl font-bold">$6.99</span>
            <span className="text-lg text-gray-600 dark:text-gray-400">/month</span>
          </div>
          <CardDescription className="mt-3 text-base">For large document analysis</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col justify-between flex-1">
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
              <span>All features of the Standard Plan</span>
            </div>
            <div className="flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
              <span>120 document uploads</span>
            </div>
            <div className="flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
              <span>350 chat assistant interactions</span>
            </div>
            <div className="flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
              <span>350k tokens per month</span>
            </div>
          </div>

          <div className="flex justify-start pt-6">
            <Button className="bg-white hover:bg-blue-700 px-4 py-2 text-sm" size="sm">
              Get Pro   
            </Button>
          </div>
        </CardContent>
      </Card>
              
            </div>
          </div>
          

          

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">5,000+</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Documents analyzed daily</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">99.9%</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Uptime guarantee</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">&lt; 30s</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Average analysis time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Compact */}
      <footer className="border-t bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <Sparkles className="h-2 w-2 text-purple-500 absolute -top-0.5 -right-0.5" />
                </div>
                <span className="text-lg font-bold">Drop2Chat</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI-powered document analysis and insights, powered by Claude 4 Sonnet.
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
            <p className="text-sm text-gray-600 dark:text-gray-400">© 2025 Drop2Chat. All rights reserved.</p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <span className="text-sm text-gray-600 dark:text-gray-400">Powered by Claude 4 Sonnet</span>
              <Badge variant="outline" className="text-xs">
                <Zap className="h-2.5 w-2.5 mr-1" />
                AI-Powered
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
 