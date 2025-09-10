/**
 * MediaPosition - Handles element positioning and infinite scroll wrapping
 */

import { ELEMENT_CONFIG, ANIMATION_CONFIG } from '../config/constants.js'
import { pixelsToViewport } from '../utils/coordinates.js'

export class MediaPosition {
  constructor(element, screen, viewport, galleryWidth, galleryHeight) {
    this.element = element
    this.screen = screen
    this.viewport = viewport
    this.galleryWidth = galleryWidth
    this.galleryHeight = galleryHeight
    
    // Infinite scroll wrapping offset
    this.extra = { x: 0, y: 0 }
    
    // DOM bounds cache
    this.bounds = null
    
    this.updateBounds()
  }

  /**
   * Update element bounds from DOM
   */
  updateBounds() {
    this.bounds = this.element.getBoundingClientRect()
  }

  /**
   * Calculate WebGL scale for consistent element sizing
   * @param {Object} mesh - WebGL mesh to update
   */
  updateScale(mesh) {
    if (!mesh) return
    
    // Convert pixel dimensions to viewport units
    const { width, height } = pixelsToViewport(
      ELEMENT_CONFIG.WIDTH,
      ELEMENT_CONFIG.HEIGHT,
      this.viewport,
      this.screen
    )
    
    mesh.scale.x = width
    mesh.scale.y = height
  }

  /**
   * Update X position accounting for scroll and wrapping
   * @param {Object} mesh - WebGL mesh to update
   * @param {number} scrollX - Current X scroll position
   */
  updateX(mesh, scrollX = 0) {
    if (!mesh || !this.bounds) return
    
    const halfWidth = mesh.scale.x / 2
    const viewportHalfWidth = this.viewport.width / 2
    
    // Calculate position in WebGL space
    const screenToViewport = (this.bounds.left - scrollX) / this.screen.width * this.viewport.width
    mesh.position.x = -viewportHalfWidth + halfWidth + screenToViewport - this.extra.x
  }

  /**
   * Update Y position accounting for scroll and wrapping
   * @param {Object} mesh - WebGL mesh to update
   * @param {number} scrollY - Current Y scroll position
   */
  updateY(mesh, scrollY = 0) {
    if (!mesh || !this.bounds) return
    
    const halfHeight = mesh.scale.y / 2
    const viewportHalfHeight = this.viewport.height / 2
    
    // Calculate position in WebGL space (Y is inverted)
    const screenToViewport = (this.bounds.top - scrollY) / this.screen.height * this.viewport.height
    mesh.position.y = viewportHalfHeight - halfHeight - screenToViewport - this.extra.y
  }

  /**
   * Handle infinite scroll wrapping
   * @param {Object} mesh - WebGL mesh
   * @param {Object} direction - Scroll direction {x, y}
   * @returns {Object} Wrapping status {wrappedX, wrappedY}
   */
  handleWrapping(mesh, direction) {
    if (!mesh) return { wrappedX: false, wrappedY: false }
    
    const planeOffsetX = mesh.scale.x / 2
    const planeOffsetY = mesh.scale.y / 2
    const viewportOffsetX = this.viewport.width / 2
    const viewportOffsetY = this.viewport.height / 2

    // Add buffer for smooth wrapping
    const bufferX = mesh.scale.x
    const bufferY = mesh.scale.y

    const isBeforeX = mesh.position.x + planeOffsetX < -viewportOffsetX + bufferX
    const isAfterX = mesh.position.x - planeOffsetX > viewportOffsetX - bufferX
    const isBeforeY = mesh.position.y + planeOffsetY < -viewportOffsetY + bufferY
    const isAfterY = mesh.position.y - planeOffsetY > viewportOffsetY - bufferY

    let wrappedX = false
    let wrappedY = false

    // X-axis wrapping
    if (direction.x === 'right' && isBeforeX) {
      this.extra.x -= this.galleryWidth
      wrappedX = true
    } else if (direction.x === 'left' && isAfterX) {
      this.extra.x += this.galleryWidth
      wrappedX = true
    }

    // Y-axis wrapping
    if (direction.y === 'up' && isBeforeY) {
      this.extra.y -= this.galleryHeight
      wrappedY = true
    } else if (direction.y === 'down' && isAfterY) {
      this.extra.y += this.galleryHeight
      wrappedY = true
    }

    return { wrappedX, wrappedY }
  }

  /**
   * Update all positioning for the current frame
   * @param {Object} mesh - WebGL mesh
   * @param {Object} scroll - Current scroll state
   * @param {Object} direction - Scroll direction
   */
  update(mesh, scroll, direction) {
    this.updateScale(mesh)
    this.updateX(mesh, scroll.current.x)
    this.updateY(mesh, scroll.current.y)
    
    return this.handleWrapping(mesh, direction)
  }

  /**
   * Update viewport and gallery dimensions
   * @param {Object} screen - Screen dimensions
   * @param {Object} viewport - Viewport dimensions
   * @param {number} galleryWidth - Gallery width
   * @param {number} galleryHeight - Gallery height
   */
  updateDimensions(screen, viewport, galleryWidth, galleryHeight) {
    this.screen = screen
    this.viewport = viewport
    this.galleryWidth = galleryWidth
    this.galleryHeight = galleryHeight
    
    // Reset extra offset on resize
    this.extra = { x: 0, y: 0 }
    this.updateBounds()
  }

  /**
   * Get current extra offset for debugging
   * @returns {Object} Extra offset {x, y}
   */
  getExtra() {
    return { ...this.extra }
  }

  /**
   * Get current bounds for debugging
   * @returns {Object} Element bounds
   */
  getBounds() {
    return this.bounds
  }
}