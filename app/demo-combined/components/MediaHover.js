/**
 * MediaHover - Handles hover detection and animation
 */

import { ANIMATION_CONFIG } from '../config/constants.js'
import { webglToScreen, webglScaleToScreen, isPointInBounds } from '../utils/coordinates.js'
import { lerp } from '../utils/math.js'

export class MediaHover {
  constructor() {
    this.state = {
      isHovered: false,
      scale: 1.0,
      targetScale: 1.0
    }
    
    this.config = {
      ease: ANIMATION_CONFIG.HOVER_EASE,
      hoverScale: ANIMATION_CONFIG.HOVER_SCALE
    }
  }

  /**
   * Check if mouse is hovering over element using WebGL coordinates
   * @param {Object} mouse - Mouse position {x, y}
   * @param {Object} mesh - WebGL mesh
   * @param {Object} viewport - Viewport dimensions
   * @param {Object} screen - Screen dimensions
   * @returns {boolean} Whether mouse is hovering
   */
  checkHover(mouse, mesh, viewport, screen) {
    if (!mouse || !mesh) return false

    // Convert WebGL mesh position to screen coordinates
    const screenPosition = webglToScreen(mesh, viewport, screen)
    const screenDimensions = webglScaleToScreen(mesh, viewport, screen)

    // Calculate bounds around the element center
    const bounds = {
      left: screenPosition.x - screenDimensions.width / 2,
      right: screenPosition.x + screenDimensions.width / 2,
      top: screenPosition.y - screenDimensions.height / 2,
      bottom: screenPosition.y + screenDimensions.height / 2
    }

    return isPointInBounds(mouse, bounds)
  }

  /**
   * Update hover state and animation
   * @param {Object} mouse - Mouse position
   * @param {Object} mesh - WebGL mesh
   * @param {Object} viewport - Viewport dimensions
   * @param {Object} screen - Screen dimensions
   * @param {boolean} debugMode - Whether to log debug info
   * @returns {boolean} Whether hover state changed
   */
  update(mouse, mesh, viewport, screen, debugMode = false) {
    const wasHovering = this.state.isHovered
    const isHovering = this.checkHover(mouse, mesh, viewport, screen)
    
    let stateChanged = false

    // Update hover state
    if (isHovering && !this.state.isHovered) {
      this.state.isHovered = true
      this.state.targetScale = this.config.hoverScale
      stateChanged = true
      
      if (debugMode) {
        console.log('Hover started')
      }
    } else if (!isHovering && this.state.isHovered) {
      this.state.isHovered = false
      this.state.targetScale = 1.0
      stateChanged = true
      
      if (debugMode) {
        console.log('Hover ended')
      }
    }

    // Animate scale
    this.state.scale = lerp(this.state.scale, this.state.targetScale, this.config.ease)

    return stateChanged
  }

  /**
   * Get current hover scale value
   * @returns {number} Current scale value
   */
  getScale() {
    return this.state.scale
  }

  /**
   * Check if currently hovered
   * @returns {boolean} Hover state
   */
  isHovered() {
    return this.state.isHovered
  }

  /**
   * Get hover state for debugging
   * @returns {Object} Current hover state
   */
  getState() {
    return {
      isHovered: this.state.isHovered,
      scale: this.state.scale,
      targetScale: this.state.targetScale
    }
  }

  /**
   * Reset hover state
   */
  reset() {
    this.state.isHovered = false
    this.state.scale = 1.0
    this.state.targetScale = 1.0
  }

  /**
   * Update configuration
   * @param {Object} config - New configuration options
   */
  updateConfig(config) {
    this.config = { ...this.config, ...config }
  }
}