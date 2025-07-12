import React from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs'
import { Alert, AlertDescription } from './ui/alert'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Upload, FileText, Brain, AlertTriangle, Loader2, Sparkles, Zap, Shield, Clock } from 'lucide-react'

function ModernUploadInterface({
  file,
  textInput,
  setTextInput,
  inputMode,
  setInputMode,
  handleFileChange,
  handleSubmit,
  loading,
  error
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      
      {/* Features Grid */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/40 rounded-xl mb-3 sm:mb-4">
              <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2 text-sm sm:text-base">Lightning Fast</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-300">Get comprehensive analysis in under 30 seconds</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 sm:col-span-1 lg:col-span-1">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl mb-3 sm:mb-4">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2 text-sm sm:text-base">Secure & Private</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-300">Your documents are processed securely and not stored</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900/40 rounded-xl mb-3 sm:mb-4">
              <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2 text-sm sm:text-base">AI-Powered</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-300">Advanced Claude AI for deep document understanding</p>
          </CardContent>
        </Card>
      </div> */}

      {/* Main Upload Card */}
      <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-4 sm:pb-6 px-4 sm:px-8 pt-6 sm:pt-8">
          <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Start Your Analysis
          </CardTitle>
          <p className="text-sm sm:text-base text-slate-600 dark:text-gray-300 mt-2">
            Choose your preferred method to upload and analyze your document
          </p>
        </CardHeader>
        
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <Tabs value={inputMode} onValueChange={setInputMode} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 sm:mb-8 bg-slate-100 dark:bg-gray-700 p-1 rounded-xl h-auto">
              <TabsTrigger 
                value="file" 
                className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:shadow-md rounded-lg py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm"
              >
                <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Upload File</span>
                <span className="sm:hidden">Upload</span>
                <Badge variant="secondary" className="ml-1 sm:ml-2 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 text-xs px-1.5 py-0.5">
                  PDF/DOCX
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="text" 
                className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:shadow-md rounded-lg py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm"
              >
                <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Paste Text</span>
                <span className="sm:hidden">Paste</span>
                <Badge variant="secondary" className="ml-1 sm:ml-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200 text-xs px-1.5 py-0.5">
                  Direct
                </Badge>
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit}>
              <TabsContent value="file" className="space-y-4 sm:space-y-6">
                <div className="relative group">
                  <div className="border-2 border-dashed border-slate-300 dark:border-gray-600 rounded-2xl p-8 sm:p-12 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 group-hover:bg-blue-50/50 dark:group-hover:bg-blue-900/10 touch-manipulation">
                    <Input
                      type="file"
                      id="file-input"
                      accept=".pdf,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="file-input" className="cursor-pointer block">
                      {file ? (
                        <div className="space-y-3 sm:space-y-4">
                          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full">
                            <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white break-all">{file.name}</p>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mt-1">Tap to change file</p>
                            <Badge className="mt-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 text-xs">
                              Ready for Analysis
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 sm:space-y-4">
                          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 dark:bg-gray-700 rounded-full group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                            <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">Drop your file here</p>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mt-1">or tap to browse</p>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-3 sm:mt-4 text-xs text-slate-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      <span>PDF, DOCX</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Max 10MB</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      <span>Secure</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="text" className="space-y-4 sm:space-y-6">
                <div className="space-y-3 sm:space-y-4">
                  <Textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Paste your document text here for instant analysis..."
                    className="min-h-[200px] sm:min-h-[300px] text-sm bg-white dark:bg-gray-700 border-slate-200 dark:border-gray-600 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-gray-400 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-gray-400">
                    <span className="hidden sm:inline">Maximum 50,000 characters</span>
                    <span className="sm:hidden">Max 50k chars</span>
                    <span className={textInput.length > 45000 ? 'text-amber-500' : ''}>
                      {textInput.length.toLocaleString()} / 50,000
                    </span>
                  </div>
                </div>
              </TabsContent>

              <div className="mt-6 sm:mt-8">
                <Button 
                  type="submit" 
                  disabled={loading || (inputMode === 'file' && !file) || (inputMode === 'text' && !textInput.trim())}
                  className="w-full h-12 sm:h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-600 dark:to-purple-600 dark:hover:from-blue-500 dark:hover:to-purple-500 text-white text-base sm:text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 touch-manipulation"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 animate-spin" />
                      <span className="hidden sm:inline">Analyzing Your Document...</span>
                      <span className="sm:hidden">Analyzing...</span>
                      <span className="ml-2 px-2 py-1 bg-white/20 rounded-md text-xs sm:text-sm">
                        <span className="hidden sm:inline">Please wait</span>
                        <span className="sm:hidden">Wait</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                      <span className="hidden sm:inline">Start AI Analysis</span>
                      <span className="sm:hidden">Analyze</span>
                      <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 ml-2 sm:ml-3" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            {error && (
              <Alert variant="destructive" className="mt-4 sm:mt-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-800 dark:text-red-200 text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Trust Indicators */}
      {/* <div className="text-center mt-8 sm:mt-12">
        <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mb-3 sm:mb-4">
          Trusted by professionals worldwide
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-8 opacity-60">
          <Badge variant="outline" className="px-2 py-1 sm:px-4 sm:py-2 text-xs">
            <span className="hidden sm:inline">Enterprise Security</span>
            <span className="sm:hidden">Secure</span>
          </Badge>
          <Badge variant="outline" className="px-2 py-1 sm:px-4 sm:py-2 text-xs">
            <span className="hidden sm:inline">GDPR Compliant</span>
            <span className="sm:hidden">GDPR</span>
          </Badge>
          <Badge variant="outline" className="px-2 py-1 sm:px-4 sm:py-2 text-xs">
            <span className="hidden sm:inline">SOC 2 Certified</span>
            <span className="sm:hidden">SOC 2</span>
          </Badge>
        </div>
      </div> */}
    </div>
  )
}

export default ModernUploadInterface 