import React from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs'
import { Alert, AlertDescription } from './ui/alert'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Upload, FileText, Brain, AlertTriangle, Loader2, Sparkles, Zap, Shield, Clock, X, CheckCircle } from 'lucide-react'

function ModernUploadInterface({
  file,
  textInput,
  setTextInput,
  inputMode,
  setInputMode,
  handleFileChange,
  handleSubmit,
  loading,
  error,
  // Multi-document props
  handleMultipleFileChange,
  documents = [],
  stagedFiles = [],
  removeStagedFile,
  clearStagedFiles,
  // Collection props
  collectionName,
  setCollectionName,
  handleCollectionUpload
}) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Professional Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
          What would you analyze?
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-gray-300 max-w-2xl mx-auto">
          Upload documents and get instant AI-powered insights, analysis, and answers
        </p>
      </div>

      {/* Main Upload Card - Compact and Professional */}
      <Card className="shadow-2xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm animate-fade-in-scale">
        <CardContent className="p-6">
          <Tabs value={inputMode} onValueChange={setInputMode} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100 dark:bg-gray-700 p-1 rounded-xl h-auto">
              <TabsTrigger 
                value="file" 
                className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:shadow-md rounded-lg py-2.5 px-3 text-sm transition-all duration-200 font-medium"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Single File</span>
                <span className="sm:hidden">File</span>
                <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 text-xs px-1.5 py-0.5">
                  PDF/DOCX
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="collection" 
                className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:shadow-md rounded-lg py-2.5 px-3 text-sm transition-all duration-200 font-medium"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Collection</span>
                <span className="sm:hidden">Collection</span>
                <Badge variant="secondary" className="ml-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 text-xs px-1.5 py-0.5">
                  Multiple
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="text" 
                className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:shadow-md rounded-lg py-2.5 px-3 text-sm transition-all duration-200 font-medium"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Paste Text</span>
                <span className="sm:hidden">Text</span>
                <Badge variant="secondary" className="ml-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200 text-xs px-1.5 py-0.5">
                  Direct
                </Badge>
              </TabsTrigger>
            </TabsList>

            <form onSubmit={inputMode === 'collection' ? handleCollectionUpload : handleSubmit}>
              <TabsContent value="file" className="space-y-4 animate-tab-enter">
                <div className="relative group">
                  <div className="border-2 border-dashed border-slate-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 group-hover:bg-blue-50/30 dark:group-hover:bg-blue-900/10 touch-manipulation">
                    <Input
                      type="file"
                      id="file-input"
                      accept=".pdf,.docx"
                      multiple
                      onChange={(e) => {
                        if (handleMultipleFileChange && e.target.files.length > 1) {
                          handleMultipleFileChange(e.target.files)
                        } else {
                          handleFileChange(e)
                        }
                      }}
                      className="hidden"
                    />
                    <label htmlFor="file-input" className="cursor-pointer block">
                      {file || stagedFiles.length > 0 ? (
                        <div className="space-y-3">
                          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full">
                            <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            {stagedFiles.length > 1 ? (
                              <>
                                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                                  {stagedFiles.length} files ready
                                </p>
                                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Click to add more</p>
                              </>
                            ) : stagedFiles.length === 1 ? (
                              <>
                                <p className="text-lg font-semibold text-slate-900 dark:text-white break-all">
                                  {stagedFiles[0].name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Click to add more</p>
                              </>
                            ) : (
                              <>
                                <p className="text-lg font-semibold text-slate-900 dark:text-white break-all">
                                  {file?.name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Click to change</p>
                              </>
                            )}
                            <Badge className="mt-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 text-xs">
                              Ready for Analysis
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 dark:bg-gray-700 rounded-full group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                            <Upload className="h-6 w-6 text-slate-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-slate-900 dark:text-white">Drop files here</p>
                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">or click to browse • Multiple files supported</p>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                  
                  {/* Compact File Info */}
                  <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      <span>PDF, DOCX</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Max 5MB</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      <span>Secure</span>
                    </div>
                  </div>
                  
                  {/* Compact Staged Files Display */}
                  {stagedFiles.length > 0 && (
                    <div className="mt-4 p-3 bg-slate-50 dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                          Files ({stagedFiles.length})
                        </h4>
                        <Button
                          type="button"
                          onClick={clearStagedFiles}
                          variant="outline"
                          size="sm"
                          className="text-xs h-6 px-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border-red-300 hover:border-red-400"
                        >
                          Clear
                        </Button>
                      </div>
                      <div className="grid gap-1 max-h-24 overflow-y-auto">
                        {stagedFiles.map((stagedFile, index) => (
                          <div 
                            key={index} 
                            className="flex items-center justify-between p-1.5 bg-white dark:bg-gray-700 rounded border border-slate-200 dark:border-gray-600"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <FileText className="h-3 w-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                                  {stagedFile.name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-gray-400">
                                  {(stagedFile.size / 1024 / 1024).toFixed(1)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              onClick={() => removeStagedFile(index)}
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="collection" className="space-y-4 animate-tab-enter">
                {/* Collection Name Input */}
                <div className="space-y-2">
                  <label htmlFor="collection-name" className="text-sm font-medium text-slate-700 dark:text-gray-300">
                    Collection Name
                  </label>
                  <Input
                    id="collection-name"
                    type="text"
                    value={collectionName || ''}
                    onChange={(e) => setCollectionName(e.target.value)}
                    placeholder="e.g., Marketing Plan Docs, Research Project A"
                    className="bg-white dark:bg-gray-700 border-slate-200 dark:border-gray-600 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-gray-400"
                  />
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    Give your collection a descriptive name
                  </p>
                </div>

                {/* Collection Upload Area */}
                <div className="relative group">
                  <div className="border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-xl p-8 text-center hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-300 group-hover:bg-purple-50/30 dark:group-hover:bg-purple-900/10 touch-manipulation">
                    <Input
                      type="file"
                      id="collection-input"
                      accept=".pdf,.docx"
                      multiple
                      onChange={(e) => {
                        if (handleMultipleFileChange && e.target.files.length > 1) {
                          handleMultipleFileChange(e.target.files)
                        } else {
                          handleFileChange(e)
                        }
                      }}
                      className="hidden"
                    />
                    <label htmlFor="collection-input" className="cursor-pointer block">
                      {stagedFiles.length > 0 ? (
                        <div className="space-y-3">
                          <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-full">
                            <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-slate-900 dark:text-white">
                              {stagedFiles.length} files selected
                            </p>
                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Click to add more</p>
                            {collectionName && (
                              <Badge className="mt-2 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 text-xs">
                                {collectionName}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 dark:bg-gray-700 rounded-full group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40 transition-colors">
                            <Upload className="h-6 w-6 text-slate-400 dark:text-gray-500 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-slate-900 dark:text-white">Upload Collection</p>
                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Select multiple files to create a collection</p>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                  
                  {/* Compact File Info */}
                  <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      <span>PDF, DOCX</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Max 10MB each</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      <span>Organized</span>
                    </div>
                  </div>
                  
                  {/* Compact Staged Files Display for Collection */}
                  {stagedFiles.length > 0 && (
                    <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                          Collection Files ({stagedFiles.length})
                        </h4>
                        <Button
                          type="button"
                          onClick={clearStagedFiles}
                          variant="outline"
                          size="sm"
                          className="text-xs h-6 px-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border-red-300 hover:border-red-400"
                        >
                          Clear
                        </Button>
                      </div>
                      <div className="grid gap-1 max-h-24 overflow-y-auto">
                        {stagedFiles.map((stagedFile, index) => (
                          <div 
                            key={index} 
                            className="flex items-center justify-between p-1.5 bg-white dark:bg-gray-700 rounded border border-purple-200 dark:border-purple-600"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <FileText className="h-3 w-3 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                                  {stagedFile.name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-gray-400">
                                  {(stagedFile.size / 1024 / 1024).toFixed(1)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              onClick={() => removeStagedFile(index)}
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="text" className="space-y-4 animate-tab-enter">
                <div className="space-y-3">
                  <Textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Paste your document text here for instant analysis..."
                    className="min-h-[200px] text-sm bg-white dark:bg-gray-700 border-slate-200 dark:border-gray-600 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-gray-400 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-gray-400">
                    <span>Maximum 50,000 characters</span>
                    <span className={textInput.length > 45000 ? 'text-amber-500' : ''}>
                      {textInput.length.toLocaleString()} / 50,000
                    </span>
                  </div>
                </div>
              </TabsContent>

              {/* Professional Submit Button */}
              <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-gray-700/50">
                <Button 
                  type="submit" 
                  disabled={loading || 
                    (inputMode === 'file' && !file && stagedFiles.length === 0) || 
                    (inputMode === 'collection' && (stagedFiles.length === 0 || !collectionName?.trim())) || 
                    (inputMode === 'text' && !textInput.trim())}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-600 dark:to-purple-600 dark:hover:from-blue-500 dark:hover:to-purple-500 text-white text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 touch-manipulation"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span>Analyzing Document...</span>
                      <span className="ml-2 px-2 py-1 bg-white/20 rounded text-xs">
                        Please wait
                      </span>
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      <span>
                        {inputMode === 'collection' ? 'Start Collection Analysis' : 'Start AI Analysis'}
                      </span>
                      <Sparkles className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            {error && (
              <Alert variant="destructive" className="mt-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-800 dark:text-red-200 text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default ModernUploadInterface 