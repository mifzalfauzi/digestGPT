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
    <div className="max-w-4xl mx-auto px-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-full mb-6">
          <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">AI-Powered Document Analysis</span>
        </div>
        
        <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent mb-4">
          Transform Documents into Insights
        </h1>
        <p className="text-xl text-slate-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Upload your PDFs or documents to get instant AI-powered summaries, key insights, and risk assessments in seconds.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-xl mb-4">
              <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Lightning Fast</h3>
            <p className="text-sm text-slate-600 dark:text-gray-300">Get comprehensive analysis in under 30 seconds</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20">
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl mb-4">
              <Shield className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Secure & Private</h3>
            <p className="text-sm text-slate-600 dark:text-gray-300">Your documents are processed securely and not stored</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-xl mb-4">
              <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">AI-Powered</h3>
            <p className="text-sm text-slate-600 dark:text-gray-300">Advanced Claude AI for deep document understanding</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Upload Card */}
      <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
            Start Your Analysis
          </CardTitle>
          <p className="text-slate-600 dark:text-gray-300">
            Choose your preferred method to upload and analyze your document
          </p>
        </CardHeader>
        
        <CardContent className="p-8">
          <Tabs value={inputMode} onValueChange={setInputMode} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 dark:bg-gray-700 p-1 rounded-xl">
              <TabsTrigger 
                value="file" 
                className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:shadow-md rounded-lg"
              >
                <Upload className="h-4 w-4" />
                Upload File
                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                  PDF/DOCX
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="text" 
                className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:shadow-md rounded-lg"
              >
                <FileText className="h-4 w-4" />
                Paste Text
                <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                  Direct
                </Badge>
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit}>
              <TabsContent value="file" className="space-y-6">
                <div className="relative group">
                  <div className="border-2 border-dashed border-slate-300 dark:border-gray-600 rounded-2xl p-12 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 group-hover:bg-blue-50/50 dark:group-hover:bg-blue-900/10">
                    <Input
                      type="file"
                      id="file-input"
                      accept=".pdf,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="file-input" className="cursor-pointer block">
                      {file ? (
                        <div className="space-y-4">
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full">
                            <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-xl font-semibold text-slate-900 dark:text-white">{file.name}</p>
                            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Click to change file</p>
                            <Badge className="mt-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
                              Ready for Analysis
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-gray-700 rounded-full group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                            <Upload className="h-8 w-8 text-slate-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-xl font-semibold text-slate-900 dark:text-white">Drop your file here</p>
                            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">or click to browse</p>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      <span>PDF, DOCX supported</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Max 10MB</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      <span>Secure processing</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="text" className="space-y-6">
                <div className="space-y-4">
                  <Textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Paste your document text here for instant analysis..."
                    className="min-h-[300px] text-sm bg-white dark:bg-gray-700 border-slate-200 dark:border-gray-600 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-gray-400 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-gray-400">
                    <span>Maximum 50,000 characters</span>
                    <span className={textInput.length > 45000 ? 'text-amber-500' : ''}>
                      {textInput.length.toLocaleString()} / 50,000
                    </span>
                  </div>
                </div>
              </TabsContent>

              <div className="mt-8">
                <Button 
                  type="submit" 
                  disabled={loading || (inputMode === 'file' && !file) || (inputMode === 'text' && !textInput.trim())}
                  className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-600 dark:to-purple-600 dark:hover:from-blue-500 dark:hover:to-purple-500 text-white text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                      Analyzing Your Document...
                      <span className="ml-2 px-2 py-1 bg-white/20 rounded-md text-sm">
                        Please wait
                      </span>
                    </>
                  ) : (
                    <>
                      <Brain className="h-5 w-5 mr-3" />
                      Start AI Analysis
                      <Sparkles className="h-4 w-4 ml-3" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            {error && (
              <Alert variant="destructive" className="mt-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Trust Indicators */}
      <div className="text-center mt-12">
        <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">
          Trusted by professionals worldwide
        </p>
        <div className="flex items-center justify-center gap-8 opacity-60">
          <Badge variant="outline" className="px-4 py-2">Enterprise Security</Badge>
          <Badge variant="outline" className="px-4 py-2">GDPR Compliant</Badge>
          <Badge variant="outline" className="px-4 py-2">SOC 2 Certified</Badge>
        </div>
      </div>
    </div>
  )
}

export default ModernUploadInterface 