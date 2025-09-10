/**
 * Media - Main orchestrator for individual gallery elements
 * Coordinates between renderer, loader, position, and hover components
 */

import { ANIMATION_CONFIG } from '../config/constants.js'
import { MediaRenderer } from './MediaRenderer.js'
import { MediaLoader } from './MediaLoader.js'
import { MediaPosition } from './MediaPosition.js'
import { MediaHover } from './MediaHover.js'
import { magnitude } from '../utils/math.js'

export class Media {
  constructor({ element, geometry, gl, scene, screen, viewport, galleryWidth, galleryHeight }) {
    this.element = element
    this.gl = gl
    this.scene = scene
    this.screen = screen
    this.viewport = viewport

    // Initialize components
    this.renderer = new MediaRenderer(gl, geometry, scene, viewport)
    this.position = new MediaPosition(element, screen, viewport, galleryWidth, galleryHeight)
    this.hover = new MediaHover()
    this.loader = new MediaLoader(this.renderer.getTexture(), this.renderer.getProgram())

    // Start loading book cover
    this.loader.load()

    // Initial positioning
    this.position.update(this.renderer.getMesh(), { current: { x: 0, y: 0 } }, { x: 'right', y: 'down' })
  }

  /**
   * Update all components for the current frame
   * @param {Object} scroll - Scroll state {current, last}
   * @param {Object} direction - Scroll direction {x, y}
   * @param {Object} mouse - Mouse position {x, y}
   * @param {boolean} debugMode - Whether to enable debug logging
   */
  update(scroll, direction, mouse, debugMode = false) {
    const mesh = this.renderer.getMesh()
    if (!mesh) return

    // Update position and handle wrapping
    const wrapping = this.position.update(mesh, scroll, direction)
    
    // Update renderer with new scale values
    this.renderer.updatePlaneSizes(mesh.scale.x, mesh.scale.y)

    // Update hover state
    const hoverChanged = this.hover.update(mouse, mesh, this.viewport, this.screen, debugMode)
    
    // Update hover scale in renderer
    this.renderer.updateHoverScale(this.hover.getScale())

    // Calculate and update scroll strength effect
    const strengthX = ((scroll.current.x - scroll.last.x) / this.screen.width) * ANIMATION_CONFIG.STRENGTH_MULTIPLIER
    const strengthY = ((scroll.current.y - scroll.last.y) / this.screen.height) * ANIMATION_CONFIG.STRENGTH_MULTIPLIER
    const totalStrength = magnitude({ x: strengthX, y: strengthY })
    
    this.renderer.updateStrength(totalStrength)

    return {
      wrapping,
      hoverChanged,
      strength: totalStrength
    }
  }

  /**
   * Handle resize events
   * @param {Object} sizes - New dimensions {screen, viewport, galleryWidth, galleryHeight}
   */
  onResize(sizes) {
    if (sizes.screen) this.screen = sizes.screen
    if (sizes.viewport) this.viewport = sizes.viewport

    // Update renderer viewport
    this.renderer.updateViewport(this.viewport)

    // Update position dimensions
    this.position.updateDimensions(
      this.screen,
      this.viewport,
      sizes.galleryWidth || this.position.galleryWidth,
      sizes.galleryHeight || this.position.galleryHeight
    )

    // Re-run positioning
    const mesh = this.renderer.getMesh()
    if (mesh) {
      this.position.update(mesh, { current: { x: 0, y: 0 } }, { x: 'right', y: 'down' })
    }
  }

  /**
   * Get debug information about this media element
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    const mesh = this.renderer.getMesh()
    
    return {
      loader: this.loader.getInfo(),
      hover: this.hover.getState(),
      position: {
        extra: this.position.getExtra(),
        bounds: this.position.getBounds(),
        meshPosition: mesh ? { x: mesh.position.x, y: mesh.position.y } : null,
        meshScale: mesh ? { x: mesh.scale.x, y: mesh.scale.y } : null
      }
    }
  }

  /**
   * Check if this element is using a fallback texture
   * @returns {boolean} Whether using fallback
   */
  isFallback() {
    return this.loader.isFallbackTexture
  }

  /**
   * Check if this element is currently hovered
   * @returns {boolean} Whether hovered
   */
  isHovered() {
    return this.hover.isHovered()
  }

  /**
   * Get the WebGL mesh for external access
   * @returns {Mesh} The mesh instance
   */
  getMesh() {
    return this.renderer.getMesh()
  }

  /**
   * Dispose of all resources
   */
  dispose() {
    this.renderer.dispose()
    this.hover.reset()
  }
}