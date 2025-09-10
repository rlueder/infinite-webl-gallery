/**
 * PreloadManager - Handles preloading of book covers for seamless infinite scrolling
 */

import { getISBNByIndex } from '../config/books.js'
import { createBookCoverUrl, createFallbackTexture, loadImageWithTimeout } from '../utils/texture.js'
import { debugLogger } from '../utils/debug.js'

export class PreloadManager {
  constructor() {
    // Cache for preloaded images
    this.imageCache = new Map()
    this.fallbackCache = new Map()
    
    // Preloading state
    this.preloadQueue = new Set()
    this.preloadingPromises = new Map()
    
    // Configuration
    this.config = {
      preloadDistance: 3, // How many covers ahead to preload
      maxCacheSize: 50,  // Maximum images to keep in cache (reduced for memory management)
      preloadTimeout: 5000, // Timeout for preloading requests
      preloadBuffer: 300  // Extra pixels beyond viewport to preload (increased)
    }
    
    debugLogger.info('PreloadManager', 'Preload manager initialized')
  }

  /**
   * Get a cached image or fallback for a book index
   * @param {number} bookIndex - Book index to get
   * @returns {HTMLImageElement|HTMLCanvasElement|null} Cached image or null
   */
  getCachedImage(bookIndex) {
    // Try image cache first
    if (this.imageCache.has(bookIndex)) {
      return this.imageCache.get(bookIndex)
    }
    
    // Try fallback cache
    if (this.fallbackCache.has(bookIndex)) {
      return this.fallbackCache.get(bookIndex)
    }
    
    return null
  }

  /**
   * Check if an image is being preloaded
   * @param {number} bookIndex - Book index to check
   * @returns {boolean} Whether image is being preloaded
   */
  isPreloading(bookIndex) {
    return this.preloadingPromises.has(bookIndex)
  }

  /**
   * Preload book covers based on current position and scroll direction
   * @param {number} currentIndex - Current book index
   * @param {Object} direction - Scroll direction {x, y}
   * @param {number} totalBooks - Total number of books available
   */
  preloadAround(currentIndex, direction, totalBooks) {
    const indicesToPreload = this.calculatePreloadIndices(currentIndex, direction, totalBooks)
    
    for (const index of indicesToPreload) {
      this.preloadBookCover(index)
    }
    
    // Clean up cache entries based on distance from current position
    this.cleanupByDistance(currentIndex, totalBooks)
    
    // Clean up old cache entries if still over limit
    this.cleanupCache()
  }

  /**
   * Preload covers for all currently visible and near-visible elements
   * @param {Array} mediaElements - Array of media elements with their positions
   * @param {Object} viewport - Viewport dimensions
   * @param {Object} screen - Screen dimensions
   */
  preloadVisibleAndNear(mediaElements, viewport, screen) {
    if (!mediaElements || mediaElements.length === 0) return
    
    // Preload ALL currently visible elements immediately
    mediaElements.forEach(media => {
      const bookIndex = media.loader.bookIndex
      if (!this.getCachedImage(bookIndex) && !this.isPreloading(bookIndex)) {
        this.preloadBookCover(bookIndex)
        debugLogger.debug('PreloadManager', `Preloading element: ${bookIndex}`)
      }
    })
  }

  /**
   * Preload entire rows/columns based on scroll position and direction
   * @param {Object} scrollState - Current scroll state
   * @param {Object} layout - Grid layout information
   * @param {Array} mediaElements - Array of media elements
   */
  preloadByGridPosition(scrollState, layout, mediaElements) {
    if (!mediaElements || mediaElements.length === 0 || !layout) return

    const { direction } = scrollState
    const velocity = scrollState.current
    
    // Calculate how many extra rows/columns to preload based on direction
    const extraRows = direction.y === 'down' ? 2 : direction.y === 'up' ? 2 : 1
    const extraCols = direction.x === 'right' ? 2 : direction.x === 'left' ? 2 : 1
    
    // Preload elements in the direction of scroll
    for (let i = 0; i < mediaElements.length; i++) {
      const media = mediaElements[i]
      const bookIndex = media.loader.bookIndex
      
      // Calculate grid position
      const col = i % layout.baseColumns
      const row = Math.floor(i / layout.baseColumns)
      
      // Determine if this element should be preloaded based on scroll direction
      let shouldPreload = false
      
      // Always preload visible area plus buffer
      if (row < layout.baseRows + extraRows && col < layout.baseColumns + extraCols) {
        shouldPreload = true
      }
      
      // Preload ahead in scroll direction
      if (direction.x === 'right' && col < layout.baseColumns + extraCols) {
        shouldPreload = true
      }
      if (direction.x === 'left' && col >= -extraCols) {
        shouldPreload = true
      }
      if (direction.y === 'down' && row < layout.baseRows + extraRows) {
        shouldPreload = true
      }
      if (direction.y === 'up' && row >= -extraRows) {
        shouldPreload = true
      }
      
      if (shouldPreload && !this.getCachedImage(bookIndex) && !this.isPreloading(bookIndex)) {
        this.preloadBookCover(bookIndex)
      }
    }
  }

  /**
   * Check if an element is near the viewport (including position and wrapping)
   * @param {Object} media - Media element with position and bounds
   * @param {Object} bounds - Extended viewport bounds
   * @returns {boolean} Whether element is near viewport
   */
  isElementNearViewport(media, bounds) {
    if (!media.element) return false
    
    const rect = media.element.getBoundingClientRect()
    
    // Check if element overlaps with extended bounds
    return !(rect.right < bounds.left || 
             rect.left > bounds.right || 
             rect.bottom < bounds.top || 
             rect.top > bounds.bottom)
  }

  /**
   * Calculate which book indices should be preloaded
   * @param {number} currentIndex - Current book index
   * @param {Object} direction - Scroll direction {x, y}
   * @param {number} totalBooks - Total number of books available
   * @returns {Array<number>} Array of indices to preload
   */
  calculatePreloadIndices(currentIndex, direction, totalBooks) {
    const indices = new Set()
    const distance = this.config.preloadDistance
    
    // Always preload immediate neighbors
    for (let i = -distance; i <= distance; i++) {
      if (i === 0) continue // Skip current index
      
      let index = (currentIndex + i + totalBooks) % totalBooks
      indices.add(index)
    }
    
    // Add extra preloading in scroll direction
    const extraDistance = distance * 2
    
    // Preload more in X direction based on scroll
    if (direction.x === 'right') {
      for (let i = 1; i <= extraDistance; i++) {
        let index = (currentIndex + i) % totalBooks
        indices.add(index)
      }
    } else if (direction.x === 'left') {
      for (let i = 1; i <= extraDistance; i++) {
        let index = (currentIndex - i + totalBooks) % totalBooks
        indices.add(index)
      }
    }
    
    // Preload more in Y direction based on scroll
    if (direction.y === 'down') {
      for (let i = 1; i <= extraDistance; i++) {
        let index = (currentIndex + i) % totalBooks
        indices.add(index)
      }
    } else if (direction.y === 'up') {
      for (let i = 1; i <= extraDistance; i++) {
        let index = (currentIndex - i + totalBooks) % totalBooks
        indices.add(index)
      }
    }
    
    return Array.from(indices)
  }

  /**
   * Preload a specific book cover
   * @param {number} bookIndex - Book index to preload
   * @returns {Promise<HTMLImageElement|HTMLCanvasElement>} Promise that resolves to the image
   */
  async preloadBookCover(bookIndex) {
    // Skip if already cached or preloading
    if (this.getCachedImage(bookIndex) || this.isPreloading(bookIndex)) {
      return this.getCachedImage(bookIndex) || this.preloadingPromises.get(bookIndex)
    }
    
    const isbn = getISBNByIndex(bookIndex)
    debugLogger.debug('PreloadManager', `Preloading book ${bookIndex} - ISBN: ${isbn}`)
    
    // Create and store the preloading promise
    const preloadPromise = this.loadBookCoverImage(bookIndex, isbn)
    this.preloadingPromises.set(bookIndex, preloadPromise)
    
    try {
      const image = await preloadPromise
      return image
    } finally {
      // Clean up the promise regardless of success/failure
      this.preloadingPromises.delete(bookIndex)
    }
  }

  /**
   * Load a book cover image with fallback
   * @param {number} bookIndex - Book index
   * @param {string} isbn - Book ISBN
   * @returns {Promise<HTMLImageElement|HTMLCanvasElement>} Promise that resolves to the image
   */
  async loadBookCoverImage(bookIndex, isbn) {
    try {
      // Try to load the book cover
      const imageUrl = createBookCoverUrl(isbn)
      const image = await loadImageWithTimeout(imageUrl, this.config.preloadTimeout)
      
      // Cache the successful image
      this.imageCache.set(bookIndex, image)
      debugLogger.debug('PreloadManager', `Successfully preloaded book ${bookIndex}`)
      
      return image
      
    } catch (error) {
      // Create and cache fallback
      debugLogger.debug('PreloadManager', `Creating fallback for book ${bookIndex}`)
      const fallback = createFallbackTexture()
      this.fallbackCache.set(bookIndex, fallback)
      
      return fallback
    }
  }

  /**
   * Clean up cache entries based on distance from current position
   * @param {number} currentIndex - Current book index
   * @param {number} totalBooks - Total number of books
   */
  cleanupByDistance(currentIndex, totalBooks) {
    if (!totalBooks) return
    
    const cleanupDistance = this.config.preloadDistance * 4 // Clean up beyond 4x preload distance
    const cleanedUp = []
    
    // Clean up image cache
    for (const [bookIndex, image] of this.imageCache) {
      const distance = Math.min(
        Math.abs(bookIndex - currentIndex),
        Math.abs(bookIndex - currentIndex + totalBooks),
        Math.abs(bookIndex - currentIndex - totalBooks)
      )
      
      if (distance > cleanupDistance) {
        this.disposeImage(image)
        this.imageCache.delete(bookIndex)
        cleanedUp.push(bookIndex)
      }
    }
    
    // Clean up fallback cache
    for (const [bookIndex, canvas] of this.fallbackCache) {
      const distance = Math.min(
        Math.abs(bookIndex - currentIndex),
        Math.abs(bookIndex - currentIndex + totalBooks),
        Math.abs(bookIndex - currentIndex - totalBooks)
      )
      
      if (distance > cleanupDistance) {
        this.disposeImage(canvas)
        this.fallbackCache.delete(bookIndex)
        cleanedUp.push(bookIndex)
      }
    }
    
    if (cleanedUp.length > 0) {
      debugLogger.debug('PreloadManager', `Distance-based cleanup: ${cleanedUp.length} items removed`)
    }
  }

  /**
   * Clean up old cache entries to prevent memory leaks
   */
  cleanupCache() {
    const totalCached = this.imageCache.size + this.fallbackCache.size
    
    if (totalCached > this.config.maxCacheSize) {
      // Remove oldest entries from image cache first
      const imagesToRemove = Math.min(this.imageCache.size, totalCached - this.config.maxCacheSize)
      const imageKeys = Array.from(this.imageCache.keys()).slice(0, imagesToRemove)
      
      for (const key of imageKeys) {
        const image = this.imageCache.get(key)
        this.disposeImage(image)
        this.imageCache.delete(key)
      }
      
      // Also clean up fallback cache if still over limit
      const remainingToRemove = totalCached - imagesToRemove - this.config.maxCacheSize
      if (remainingToRemove > 0) {
        const fallbackKeys = Array.from(this.fallbackCache.keys()).slice(0, remainingToRemove)
        for (const key of fallbackKeys) {
          const canvas = this.fallbackCache.get(key)
          this.disposeImage(canvas)
          this.fallbackCache.delete(key)
        }
      }
      
      debugLogger.debug('PreloadManager', `Cleaned up ${imagesToRemove} cached images`)
    }
  }

  /**
   * Properly dispose of an image/canvas to help with garbage collection
   * @param {HTMLImageElement|HTMLCanvasElement} image - Image to dispose
   */
  disposeImage(image) {
    if (!image) return
    
    try {
      // For HTMLImageElement, clear the src to break the reference
      if (image instanceof HTMLImageElement) {
        image.src = ''
        image.onload = null
        image.onerror = null
      }
      
      // For HTMLCanvasElement, clear the canvas
      if (image instanceof HTMLCanvasElement) {
        const ctx = image.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, image.width, image.height)
        }
        image.width = 0
        image.height = 0
      }
    } catch (error) {
      debugLogger.warn('PreloadManager', 'Error disposing image:', error)
    }
  }

  /**
   * Clear all caches
   */
  clearCache() {
    // Dispose all cached images properly
    for (const image of this.imageCache.values()) {
      this.disposeImage(image)
    }
    for (const canvas of this.fallbackCache.values()) {
      this.disposeImage(canvas)
    }
    
    this.imageCache.clear()
    this.fallbackCache.clear()
    this.preloadQueue.clear()
    
    // Cancel ongoing preloads
    for (const [index, promise] of this.preloadingPromises) {
      // Promises can't be cancelled, but we can ignore their results
      promise.catch(() => {}) // Ignore errors from cancelled preloads
    }
    this.preloadingPromises.clear()
    
    debugLogger.info('PreloadManager', 'All caches cleared')
  }

  /**
   * Update configuration
   * @param {Object} config - New configuration options
   */
  updateConfig(config) {
    this.config = { ...this.config, ...config }
    debugLogger.info('PreloadManager', 'Configuration updated', this.config)
  }

  /**
   * Get debug information
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    return {
      imageCacheSize: this.imageCache.size,
      fallbackCacheSize: this.fallbackCache.size,
      preloadingCount: this.preloadingPromises.size,
      config: this.config
    }
  }

  /**
   * Dispose of resources
   */
  dispose() {
    this.clearCache()
    debugLogger.info('PreloadManager', 'Preload manager disposed')
  }
}