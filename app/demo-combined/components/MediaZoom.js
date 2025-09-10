/**
 * MediaZoom - Handles center-distance based zoom animation
 */

import { ANIMATION_CONFIG } from '../config/constants.js'
import { webglToScreen } from '../utils/coordinates.js'
import { lerp } from '../utils/math.js'

export class MediaZoom {
  constructor() {
    this.state = {
      scale: 1.0,
      targetScale: 1.0,
      distanceFromCenter: 0
    }
    
    this.config = {
      ease: ANIMATION_CONFIG.HOVER_EASE,
      // Define concentric zoom areas as percentages of screen diagonal
      zoomAreas: [
        { maxDistance: 0.15, scale: 1.1 },   // Center area: 1.1x zoom
        { maxDistance: 0.35, scale: 1.05 },  // Middle area: 1.05x zoom
        { maxDistance: 1.0, scale: 1.0 }     // Outer area: normal size
      ]
    }
  }

  /**
   * Calculate distance from element center to screen center
   * @param {Object} mesh - WebGL mesh
   * @param {Object} viewport - Viewport dimensions
   * @param {Object} screen - Screen dimensions
   * @returns {number} Normalized distance from center (0-1)
   */
  calculateDistanceFromCenter(mesh, viewport, screen) {
    if (!mesh) return 1.0

    // Convert WebGL mesh position to screen coordinates
    const screenPosition = webglToScreen(mesh, viewport, screen)
    
    // Screen center
    const centerX = screen.width / 2
    const centerY = screen.height / 2
    
    // Calculate distance from element center to screen center
    const deltaX = screenPosition.x - centerX
    const deltaY = screenPosition.y - centerY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    // Normalize by screen diagonal to get 0-1 range
    const screenDiagonal = Math.sqrt(screen.width * screen.width + screen.height * screen.height)
    return Math.min(distance / screenDiagonal, 1.0)
  }

  /**
   * Determine target scale based on distance from center
   * @param {number} normalizedDistance - Distance from center (0-1)
   * @returns {number} Target scale value
   */
  getTargetScale(normalizedDistance) {
    // Find the appropriate zoom area
    for (const area of this.config.zoomAreas) {
      if (normalizedDistance <= area.maxDistance) {
        return area.scale
      }
    }
    
    // Fallback to normal scale
    return 1.0
  }

  /**
   * Update zoom based on distance from screen center
   * @param {Object} mesh - WebGL mesh
   * @param {Object} viewport - Viewport dimensions
   * @param {Object} screen - Screen dimensions
   * @param {boolean} debugMode - Whether to log debug info
   * @returns {boolean} Whether scale changed significantly
   */
  update(mesh, viewport, screen, debugMode = false) {
    const oldTargetScale = this.state.targetScale
    
    // Calculate distance from center
    this.state.distanceFromCenter = this.calculateDistanceFromCenter(mesh, viewport, screen)
    
    // Determine target scale based on distance
    this.state.targetScale = this.getTargetScale(this.state.distanceFromCenter)
    
    // Animate scale smoothly
    this.state.scale = lerp(this.state.scale, this.state.targetScale, this.config.ease)
    
    // Check if scale changed significantly
    const scaleChanged = Math.abs(oldTargetScale - this.state.targetScale) > 0.01
    
    if (debugMode && scaleChanged) {
      console.log(`Zoom changed: distance=${this.state.distanceFromCenter.toFixed(3)}, scale=${this.state.targetScale.toFixed(2)}`)
    }
    
    return scaleChanged
  }

  /**
   * Get current zoom scale value
   * @returns {number} Current scale value
   */
  getScale() {
    return this.state.scale
  }

  /**
   * Get zoom state for debugging
   * @returns {Object} Current zoom state
   */
  getState() {
    return {
      scale: this.state.scale,
      targetScale: this.state.targetScale,
      distanceFromCenter: this.state.distanceFromCenter,
      zoomArea: this.getCurrentZoomArea()
    }
  }

  /**
   * Get current zoom area name for debugging
   * @returns {string} Current zoom area
   */
  getCurrentZoomArea() {
    const distance = this.state.distanceFromCenter
    
    if (distance <= this.config.zoomAreas[0].maxDistance) {
      return 'center (1.1x)'
    } else if (distance <= this.config.zoomAreas[1].maxDistance) {
      return 'middle (1.05x)'
    } else {
      return 'outer (1x)'
    }
  }

  /**
   * Reset zoom state
   */
  reset() {
    this.state.scale = 1.0
    this.state.targetScale = 1.0
    this.state.distanceFromCenter = 0
  }

  /**
   * Update configuration
   * @param {Object} config - New configuration options
   */
  updateConfig(config) {
    this.config = { ...this.config, ...config }
  }

  /**
   * Update zoom area configuration
   * @param {Array} zoomAreas - Array of {maxDistance, scale} objects
   */
  updateZoomAreas(zoomAreas) {
    this.config.zoomAreas = zoomAreas
  }
}