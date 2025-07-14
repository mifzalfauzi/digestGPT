import React, { useState } from 'react'
import { 
  FileText, 
  Upload, 
  MessageCircle, 
  BarChart2, 
  TrendingUp, 
  Clock, 
  Archive, 
  Database, 
  Zap, 
  Shield,
  Menu,
  X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Button } from '../components/ui/button'
import ModernSidebar from '../components/ModernSidebar'

function Dashboard() {
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Placeholder data - will be replaced with actual API data
  const [usageStats, setUsageStats] = useState({
    documentsUploaded: 42,
    chatInteractions: 156,
    totalFileSize: 1024, // in MB
    monthlyLimit: {
      documents: 100,
      chatInteractions: 500,
      fileSize: 5120 // 5GB
    }
  })

  const calculatePercentage = (current, total) => {
    return Math.min(Math.round((current / total) * 100), 100)
  }

  const handleNewDocument = () => {
    // Navigate to new document upload
    window.location.href = '/assistant'
  }

  const handleCasualChat = () => {
    // Navigate to casual chat
    window.location.href = '/assistant'
  }

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Wider Sidebar */}
      <div
        className={`hidden lg:block fixed left-0 top-0 h-full z-30 transition-all duration-300 ${
          sidebarCollapsed ? "w-20" : "w-80"
        }`}
      >
        <ModernSidebar
          onNewDocument={handleNewDocument}
          onHome={() => window.location.href = '/'}
          currentDocument="Dashboard"
          isDemoMode={false}
          bypassAPI={false}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onCasualChat={handleCasualChat}
          documents={[]}
          selectedDocumentId={null}
          collections={[]}
        />
      </div>

      {/* Professional Full-Width Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 shadow-lg">
        <div className="flex items-center justify-between p-2 sm:p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hover:bg-gray-100 dark:hover:bg-gray-800 p-1.5 rounded-lg"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center">
              <BarChart2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 dark:from-white dark:to-blue-200 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Usage Analytics</p>
            </div>
          </div>
          <div className="w-8 sm:w-10"></div>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-80"
        } pt-12 sm:pt-14 lg:pt-0 h-full overflow-y-auto`}
      >
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 lg:p-10">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Usage Dashboard
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your monthly usage and analytics
                  </p>
                </div>
              </div>
            </div>

            {/* Rest of the existing Dashboard content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Documents Uploaded */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Documents Uploaded
                  </CardTitle>
                  <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {usageStats.documentsUploaded} / {usageStats.monthlyLimit.documents}
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-2">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ 
                        width: `${calculatePercentage(usageStats.documentsUploaded, usageStats.monthlyLimit.documents)}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {calculatePercentage(usageStats.documentsUploaded, usageStats.monthlyLimit.documents)}% of monthly limit
                  </p>
                </CardContent>
              </Card>

              {/* Chat Interactions */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Chat Interactions
                  </CardTitle>
                  <MessageCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {usageStats.chatInteractions} / {usageStats.monthlyLimit.chatInteractions}
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-2">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full" 
                      style={{ 
                        width: `${calculatePercentage(usageStats.chatInteractions, usageStats.monthlyLimit.chatInteractions)}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {calculatePercentage(usageStats.chatInteractions, usageStats.monthlyLimit.chatInteractions)}% of monthly limit
                  </p>
                </CardContent>
              </Card>

              {/* Total File Size */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total File Size
                  </CardTitle>
                  <Database className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {usageStats.totalFileSize} MB / {usageStats.monthlyLimit.fileSize} MB
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-2">
                    <div 
                      className="bg-purple-600 h-2.5 rounded-full" 
                      style={{ 
                        width: `${calculatePercentage(usageStats.totalFileSize, usageStats.monthlyLimit.fileSize)}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {calculatePercentage(usageStats.totalFileSize, usageStats.monthlyLimit.fileSize)}% of storage limit
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Usage Tabs */}
            <Tabs defaultValue="documents" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-200 dark:bg-gray-800">
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documents
                </TabsTrigger>
                <TabsTrigger value="chats" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Chat Interactions
                </TabsTrigger>
                <TabsTrigger value="storage" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Storage
                </TabsTrigger>
              </TabsList>
              
              {/* Documents Tab */}
              <TabsContent value="documents">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Document Upload History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Detailed document upload history coming soon...
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Chats Tab */}
              <TabsContent value="chats">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-green-600" />
                      Chat Interaction Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Detailed chat interaction history coming soon...
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Storage Tab */}
              <TabsContent value="storage">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-purple-600" />
                      Storage Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Detailed storage usage breakdown coming soon...
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Usage Tips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Usage Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <Zap className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                      Optimize document uploads to save storage space
                    </li>
                    <li className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      Manage your monthly usage to avoid hitting limits
                    </li>
                    <li className="flex items-start gap-2">
                      <Archive className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                      Regularly archive or remove unused documents
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Account Security */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    Account Security
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Two-Factor Authentication
                      </span>
                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">
                        Enabled
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Last Login
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Today at 10:30 AM
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <ModernSidebar
              onNewDocument={handleNewDocument}
              onHome={() => window.location.href = '/'}
              currentDocument="Dashboard"
              onClose={() => setSidebarOpen(false)}
              isDemoMode={false}
              bypassAPI={false}
              collapsed={false}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              onCasualChat={handleCasualChat}
              documents={[]}
              selectedDocumentId={null}
              collections={[]}
            />
          </div>
        </>
      )}
    </div>
  )
}

export default Dashboard 