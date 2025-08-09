// Document caching utilities for improved performance and offline access

const CACHE_KEYS = {
  DOCUMENTS: 'digestgpt_cached_documents',
  COLLECTIONS: 'digestgpt_cached_collections',
  APP_STATE: 'digestgpt_app_state',
  LAST_UPDATED: 'digestgpt_cache_last_updated'
}

const CACHE_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

class DocumentCache {
  // Check if cache is expired
  static isCacheExpired() {
    const lastUpdated = localStorage.getItem(CACHE_KEYS.LAST_UPDATED)
    if (!lastUpdated) return true
    
    const lastUpdatedTime = parseInt(lastUpdated, 10)
    const now = Date.now()
    return (now - lastUpdatedTime) > CACHE_EXPIRY
  }

  // Update cache timestamp
  static updateCacheTimestamp() {
    localStorage.setItem(CACHE_KEYS.LAST_UPDATED, Date.now().toString())
  }

  // Cache documents
  static cacheDocuments(documents) {
    try {
      const cacheData = {
        documents,
        timestamp: Date.now()
      }
      localStorage.setItem(CACHE_KEYS.DOCUMENTS, JSON.stringify(cacheData))
      this.updateCacheTimestamp()
    } catch (error) {
      console.warn('Failed to cache documents:', error)
    }
  }

  // Get cached documents
  static getCachedDocuments() {
    try {
      const cached = localStorage.getItem(CACHE_KEYS.DOCUMENTS)
      if (!cached) return null
      
      const parsedCache = JSON.parse(cached)
      return parsedCache.documents || null
    } catch (error) {
      console.warn('Failed to retrieve cached documents:', error)
      return null
    }
  }

  // Cache collections
  static cacheCollections(collections) {
    try {
      const cacheData = {
        collections,
        timestamp: Date.now()
      }
      localStorage.setItem(CACHE_KEYS.COLLECTIONS, JSON.stringify(cacheData))
      this.updateCacheTimestamp()
    } catch (error) {
      console.warn('Failed to cache collections:', error)
    }
  }

  // Get cached collections
  static getCachedCollections() {
    try {
      const cached = localStorage.getItem(CACHE_KEYS.COLLECTIONS)
      if (!cached) return null
      
      const parsedCache = JSON.parse(cached)
      return parsedCache.collections || null
    } catch (error) {
      console.warn('Failed to retrieve cached collections:', error)
      return null
    }
  }

  // Cache app state (currentView, activePanel, selectedDocumentId, etc.)
  static cacheAppState(state) {
    try {
      const cacheData = {
        ...state,
        timestamp: Date.now()
      }
      localStorage.setItem(CACHE_KEYS.APP_STATE, JSON.stringify(cacheData))
    } catch (error) {
      console.warn('Failed to cache app state:', error)
    }
  }

  // Get cached app state
  static getCachedAppState() {
    try {
      const cached = localStorage.getItem(CACHE_KEYS.APP_STATE)
      if (!cached) return null
      
      const parsedCache = JSON.parse(cached)
      // Remove timestamp before returning
      const { timestamp, ...state } = parsedCache
      return state
    } catch (error) {
      console.warn('Failed to retrieve cached app state:', error)
      return null
    }
  }

  // Cache individual document's full data
  static cacheDocument(documentId, documentData) {
    try {
      const cacheKey = `digestgpt_doc_${documentId}`
      const cacheData = {
        data: documentData,
        timestamp: Date.now()
      }
      localStorage.setItem(cacheKey, JSON.stringify(cacheData))
    } catch (error) {
      console.warn(`Failed to cache document ${documentId}:`, error)
    }
  }

  // Get cached individual document
  static getCachedDocument(documentId) {
    try {
      const cacheKey = `digestgpt_doc_${documentId}`
      const cached = localStorage.getItem(cacheKey)
      if (!cached) return null
      
      const parsedCache = JSON.parse(cached)
      return parsedCache.data || null
    } catch (error) {
      console.warn(`Failed to retrieve cached document ${documentId}:`, error)
      return null
    }
  }

  // Clear all cache
  static clearCache() {
    try {
      Object.values(CACHE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
      
      // Clear individual document caches
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('digestgpt_doc_')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      console.log('Cache cleared successfully')
    } catch (error) {
      console.warn('Failed to clear cache:', error)
    }
  }

  // Check if we have cached data for a document
  static hasDocumentCache(documentId) {
    const cacheKey = `digestgpt_doc_${documentId}`
    return localStorage.getItem(cacheKey) !== null
  }

  // Remove cached document when deleted
  static removeCachedDocument(documentId) {
    try {
      const cacheKey = `digestgpt_doc_${documentId}`
      localStorage.removeItem(cacheKey)
      console.log(`Removed cached document: ${documentId}`)
    } catch (error) {
      console.warn(`Failed to remove cached document ${documentId}:`, error)
    }
  }

  // Get cache info for debugging
  static getCacheInfo() {
    const documents = this.getCachedDocuments()
    const collections = this.getCachedCollections()
    const appState = this.getCachedAppState()
    const lastUpdated = localStorage.getItem(CACHE_KEYS.LAST_UPDATED)
    const isExpired = this.isCacheExpired()
    
    return {
      hasDocuments: !!documents,
      documentsCount: documents?.length || 0,
      hasCollections: !!collections,
      collectionsCount: collections?.length || 0,
      hasAppState: !!appState,
      lastUpdated: lastUpdated ? new Date(parseInt(lastUpdated, 10)).toISOString() : null,
      isExpired
    }
  }
}

export default DocumentCache