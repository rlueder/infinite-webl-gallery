/**
 * ViewportManager - Handles viewport sizing and resize events
 */

export class ViewportManager {
  constructor() {
    this.state = {
      screen: { width: 0, height: 0 },
      viewport: { width: 0, height: 0 },
      galleryDimensions: { width: 0, height: 0 },
      pixelRatio: window.devicePixelRatio || 1
    }
    
    this.callbacks = {
      onResize: null
    }
    
    this.resizeTimeout = null
    
    this.updateDimensions()
  }

  /**
   * Initialize viewport manager
   * @param {HTMLElement} canvas - Canvas element for WebGL context
   */
  init(canvas) {
    this.canvas = canvas
    
    // Set up resize listener with debouncing
    window.addEventListener('resize', this.handleResize.bind(this))
    
    // Initial setup
    this.updateCanvas()
  }

  /**
   * Set resize callback
   * @param {Function} callback - Callback function for resize events
   */
  onResize(callback) {
    this.callbacks.onResize = callback
  }

  /**
   * Handle window resize events with debouncing
   */
  handleResize() {
    // Debounce resize events
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout)
    }
    
    this.resizeTimeout = setTimeout(() => {
      this.updateDimensions()
      this.updateCanvas()
      
      if (this.callbacks.onResize) {
        this.callbacks.onResize(this.getState())
      }
    }, 100) // 100ms debounce
  }

  /**
   * Update screen and viewport dimensions
   */
  updateDimensions() {
    // Update pixel ratio
    this.state.pixelRatio = window.devicePixelRatio || 1
    
    // Update screen dimensions
    this.state.screen = {
      width: window.innerWidth,
      height: window.innerHeight
    }
    
    // Update WebGL viewport dimensions
    this.state.viewport = {
      width: window.innerWidth * this.state.pixelRatio,
      height: window.innerHeight * this.state.pixelRatio
    }
  }

  /**
   * Calculate gallery dimensions based on element configuration
   * @param {Object} elementConfig - Element configuration {width, height, gap}
   * @param {Object} layout - Layout configuration {columns, rows}
   */
  updateGalleryDimensions(elementConfig, layout) {
    if (!elementConfig || !layout) return
    
    this.state.galleryDimensions = {
      width: layout.columns * (elementConfig.WIDTH + elementConfig.GAP) - elementConfig.GAP,
      height: layout.rows * (elementConfig.HEIGHT + elementConfig.GAP) - elementConfig.GAP
    }
  }

  /**
   * Update canvas size and WebGL viewport
   */
  updateCanvas() {
    if (!this.canvas) return
    
    // Set canvas size
    this.canvas.width = this.state.viewport.width
    this.canvas.height = this.state.viewport.height
    
    // Set CSS size
    this.canvas.style.width = `${this.state.screen.width}px`
    this.canvas.style.height = `${this.state.screen.height}px`
  }

  /**
   * Get current viewport state
   * @returns {Object} Current viewport state
   */
  getState() {
    return {
      screen: { ...this.state.screen },
      viewport: { ...this.state.viewport },
      galleryDimensions: { ...this.state.galleryDimensions },
      pixelRatio: this.state.pixelRatio
    }
  }

  /**
   * Get screen dimensions
   * @returns {Object} Screen dimensions {width, height}
   */
  getScreen() {
    return { ...this.state.screen }
  }

  /**
   * Get viewport dimensions
   * @returns {Object} Viewport dimensions {width, height}
   */
  getViewport() {
    return { ...this.state.viewport }
  }

  /**
   * Get gallery dimensions
   * @returns {Object} Gallery dimensions {width, height}
   */
  getGalleryDimensions() {
    return { ...this.state.galleryDimensions }
  }

  /**
   * Get pixel ratio
   * @returns {number} Device pixel ratio
   */
  getPixelRatio() {
    return this.state.pixelRatio
  }

  /**
   * Calculate aspect ratio
   * @returns {number} Screen aspect ratio
   */
  getAspectRatio() {
    return this.state.screen.width / this.state.screen.height
  }

  /**
   * Check if viewport is in portrait mode
   * @returns {boolean} Whether in portrait mode
   */
  isPortrait() {
    return this.state.screen.width < this.state.screen.height
  }

  /**
   * Check if viewport is in landscape mode
   * @returns {boolean} Whether in landscape mode
   */
  isLandscape() {
    return this.state.screen.width > this.state.screen.height
  }

  /**
   * Calculate how many elements fit in current viewport
   * @param {Object} elementConfig - Element configuration {width, height, gap}
   * @returns {Object} Layout {columns, rows, total}
   */
  calculateLayout(elementConfig) {
    if (!elementConfig) return { columns: 0, rows: 0, total: 0 }
    
    const elementWidth = elementConfig.WIDTH + elementConfig.GAP
    const elementHeight = elementConfig.HEIGHT + elementConfig.GAP
    
    const columns = Math.ceil(this.state.screen.width / elementWidth) + 2 // +2 for buffer
    const rows = Math.ceil(this.state.screen.height / elementHeight) + 2 // +2 for buffer
    
    return {
      columns,
      rows,
      total: columns * rows
    }
  }

  /**
   * Convert screen coordinates to normalized coordinates (-1 to 1)
   * @param {number} x - Screen X coordinate
   * @param {number} y - Screen Y coordinate
   * @returns {Object} Normalized coordinates {x, y}
   */
  screenToNormalized(x, y) {
    return {
      x: (x / this.state.screen.width) * 2 - 1,
      y: -((y / this.state.screen.height) * 2 - 1) // Flip Y axis for WebGL
    }
  }

  /**
   * Convert normalized coordinates to screen coordinates
   * @param {number} x - Normalized X coordinate (-1 to 1)
   * @param {number} y - Normalized Y coordinate (-1 to 1)
   * @returns {Object} Screen coordinates {x, y}
   */
  normalizedToScreen(x, y) {
    return {
      x: ((x + 1) / 2) * this.state.screen.width,
      y: ((-y + 1) / 2) * this.state.screen.height // Flip Y axis from WebGL
    }
  }

  /**
   * Get debug information
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    return {
      screen: this.state.screen,
      viewport: this.state.viewport,
      galleryDimensions: this.state.galleryDimensions,
      pixelRatio: this.state.pixelRatio,
      aspectRatio: this.getAspectRatio(),
      orientation: this.isPortrait() ? 'portrait' : 'landscape'
    }
  }

  /**
   * Dispose of resources
   */
  dispose() {
    window.removeEventListener('resize', this.handleResize.bind(this))
    
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout)
      this.resizeTimeout = null
    }
  }
}