import React from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs'
import { Alert, AlertDescription } from './ui/alert'
import { Upload, FileText, Brain, AlertTriangle, Loader2 } from 'lucide-react'

function UploadInterface({
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
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Analyze Your Document
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Upload PDFs, DOCX files, or paste text to get AI-powered insights
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <Tabs value={inputMode} onValueChange={setInputMode} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="file" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Paste Text
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="file" className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                <Input
                  type="file"
                  id="file-input"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="file-input" className="cursor-pointer block">
                  {file ? (
                    <div className="space-y-3">
                      <FileText className="h-12 w-12 mx-auto text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-lg font-medium text-gray-900 dark:text-white">{file.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Click to change file</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500" />
                      <div>
                        <p className="text-lg font-medium text-gray-900 dark:text-white">Choose PDF or DOCX file</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">or drag and drop</p>
                      </div>
                    </div>
                  )}
                </label>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Supported formats: PDF, DOCX (max 10MB)
              </p>
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              <Textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste your document text here..."
                className="min-h-[200px] text-sm bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Maximum 50,000 characters
              </p>
            </TabsContent>

            <Button 
              type="submit" 
              disabled={loading || (inputMode === 'file' && !file) || (inputMode === 'text' && !textInput.trim())}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white py-3"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing Document...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Analyze Document
                </>
              )}
            </Button>
          </form>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </Tabs>
      </div>
    </div>
  )
}

export default UploadInterface 