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
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-950/95 dark:supports-[backdrop-filter]:bg-gray-950/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <Sparkles className="h-3 w-3 text-purple-500 absolute -top-0.5 -right-0.5" />
            </div>
            <span className="text-xl font-bold">DigesText</span>
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link
              href="#features"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              Pricing
            </Link>
            <Link
              href="#demo"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
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

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200/20 dark:bg-blue-800/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-200/20 dark:bg-purple-800/10 rounded-full blur-3xl" />
        </div>

        <div className="relative container">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-6 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
              <Zap className="mr-2 h-4 w-4" />
              Powered by Claude 4 Sonnet
            </Badge>

            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Unlock Document{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Insights
              </span>{" "}
            
            </h1>

            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300 sm:text-xl">
              Upload documents anywhere, anytime. DigesText analyzes content, extract key
              insights, assess risks, and provide an AI assistant you can chat with about your data.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4">
                <Upload className="mr-2 h-5 w-5" />
                Upload & Analyze
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4 bg-transparent">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>

            <div className="mt-8 flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
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
        </div>
      </section>

      {/* Demo Video Section */}
      <section id="demo" className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="container">
          <div className="mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4 bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200">
                  <Play className="mr-2 h-4 w-4" />
                  See DigesText in action
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
                  Transform Documents into Actionable Insights
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                  Watch how DigesText analyzes your documents, identifies risks, and provides intelligent insights
                  through our AI-powered assistant.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold">Instant Document Insights</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Upload any document and get immediate analysis of key themes, concepts, and important
                        information
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold">AI Risk Assessment</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Automatically identify potential risks, compliance issues, and areas requiring attention
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold">Real-time Chat with Your Data</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Ask questions, get clarifications, and explore your documents through natural conversation
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold">Mobile-First Experience</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Upload and analyze documents on-the-go from any device, anywhere
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg">
                      <Play className="h-8 w-8 text-blue-600 ml-1" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">DigesText Demo</p>
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
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Powerful document analysis features</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Everything you need to unlock insights from your documents, powered by Claude 4 Sonnet
            </p>
          </div>

          <div className="mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                    <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle>Mobile Document Upload</CardTitle>
                  <CardDescription>
                    Upload documents anytime, anywhere from your mobile device. Fully optimized for on-the-go access
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                    <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle>Claude 4 Sonnet Analysis</CardTitle>
                  <CardDescription>
                    Advanced AI-powered document analysis using the latest Claude 4 Sonnet model for superior insights
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
                    <MessageCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle>AI Chat Assistant</CardTitle>
                  <CardDescription>
                    Chat directly with your documents. Ask questions, get clarifications, and explore content naturally
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center mb-4">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle>Risk Identification</CardTitle>
                  <CardDescription>
                    Automatically identify potential risks, compliance issues, and areas requiring immediate attention
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mb-4">
                    <Eye className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <CardTitle>Key Insights Extraction</CardTitle>
                  <CardDescription>
                    Extract and highlight the most important information, themes, and concepts from any document
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/20 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                  </div>
                  <CardTitle>Secure Processing</CardTitle>
                  <CardDescription>
                    Your documents are processed securely with enterprise-grade privacy and data protection
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Affordable AI-powered analysis</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Get access to advanced capabilities at an unbeatable price
            </p>
          </div>

          <div className="mx-auto max-w-md">
            <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-xl relative">
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
                <CardDescription className="mt-4">
                  Complete document analysis
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Unlimited document uploads</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Latest Claude model analysis (Claude 4 Sonnet)</span>
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

                {/* <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                  7-day free trial • No credit card required
                </p> */}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-gray-950">
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <Sparkles className="h-2.5 w-2.5 text-purple-500 absolute -top-0.5 -right-0.5" />
                </div>
                <span className="text-lg font-bold">DigesText</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI-powered document analysis and insights.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <Link href="/about" className="hover:text-gray-900 dark:hover:text-gray-100">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-gray-900 dark:hover:text-gray-100">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="hover:text-gray-900 dark:hover:text-gray-100">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <Link href="/features" className="hover:text-gray-900 dark:hover:text-gray-100">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-gray-900 dark:hover:text-gray-100">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/demo" className="hover:text-gray-900 dark:hover:text-gray-100">
                    Demo
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <Link href="/terms" className="hover:text-gray-900 dark:hover:text-gray-100">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-gray-100">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="hover:text-gray-900 dark:hover:text-gray-100">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-12 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">© 2025 DigesText. All rights reserved.</p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <span className="text-sm text-gray-600 dark:text-gray-400">Powered by Claude 4 Sonnet (by Anthropic)</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
