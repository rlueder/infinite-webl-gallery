/**
 * ScrollManager - Handles all scroll-related logic and state management
 */

import { ANIMATION_CONFIG } from '../config/constants.js'
import { lerp } from '../utils/math.js'

export class ScrollManager {
  constructor() {
    this.state = {
      ease: ANIMATION_CONFIG.SCROLL_EASE,
      current: { x: 0, y: 0 },
      target: { x: 0, y: 0 },
      last: { x: 0, y: 0 },
      direction: { x: 'right', y: 'down' }
    }
    
    this.isScrolling = false
    this.scrollTimeout = null
  }

  /**
   * Update scroll position with easing
   */
  update() {
    // Store last position for direction calculation
    this.state.last.x = this.state.current.x
    this.state.last.y = this.state.current.y

    // Smooth scroll with easing
    this.state.current.x = lerp(this.state.current.x, this.state.target.x, this.state.ease)
    this.state.current.y = lerp(this.state.current.y, this.state.target.y, this.state.ease)

    // Calculate direction
    this.state.direction.x = this.state.current.x > this.state.last.x ? 'right' : 'left'
    this.state.direction.y = this.state.current.y > this.state.last.y ? 'down' : 'up'

    // Update scrolling state
    const isMoving = Math.abs(this.state.current.x - this.state.target.x) > 0.1 || 
                    Math.abs(this.state.current.y - this.state.target.y) > 0.1

    if (isMoving) {
      this.isScrolling = true
      this.resetScrollTimeout()
    }
  }

  /**
   * Add scroll offset (for drag events)
   * @param {number} deltaX - X offset to add
   * @param {number} deltaY - Y offset to add
   */
  addScroll(deltaX, deltaY) {
    this.state.target.x += deltaX
    this.state.target.y += deltaY
  }

  /**
   * Set absolute scroll target
   * @param {number} x - Target X position
   * @param {number} y - Target Y position
   */
  setTarget(x, y) {
    this.state.target.x = x
    this.state.target.y = y
  }

  /**
   * Handle wheel scroll events
   * @param {WheelEvent} event - Wheel event
   */
  handleWheel(event) {
    const deltaX = event.deltaX || 0
    const deltaY = event.deltaY || 0
    
    this.addScroll(
      deltaX * ANIMATION_CONFIG.SCROLL_MULTIPLIER.WHEEL,
      deltaY * ANIMATION_CONFIG.SCROLL_MULTIPLIER.WHEEL
    )
  }

  /**
   * Handle drag scroll events
   * @param {number} startX - Start X position
   * @param {number} startY - Start Y position
   * @param {number} currentX - Current X position
   * @param {number} currentY - Current Y position
   * @param {Object} initialScrollPosition - Initial scroll position when drag started
   */
  handleDrag(startX, startY, currentX, currentY, initialScrollPosition) {
    const distanceX = (startX - currentX) * ANIMATION_CONFIG.SCROLL_MULTIPLIER.DRAG
    const distanceY = (startY - currentY) * ANIMATION_CONFIG.SCROLL_MULTIPLIER.DRAG

    this.state.target.x = initialScrollPosition.x + distanceX
    this.state.target.y = initialScrollPosition.y + distanceY
  }

  /**
   * Reset scroll timeout for detecting when scrolling stops
   */
  resetScrollTimeout() {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout)
    }
    
    this.scrollTimeout = setTimeout(() => {
      this.isScrolling = false
    }, 100) // Consider scrolling stopped after 100ms of no movement
  }

  /**
   * Get current scroll state (read-only copy)
   * @returns {Object} Current scroll state
   */
  getState() {
    return {
      current: { ...this.state.current },
      target: { ...this.state.target },
      last: { ...this.state.last },
      direction: { ...this.state.direction },
      isScrolling: this.isScrolling
    }
  }

  /**
   * Get scroll velocity
   * @returns {Object} Velocity {x, y}
   */
  getVelocity() {
    return {
      x: this.state.current.x - this.state.last.x,
      y: this.state.current.y - this.state.last.y
    }
  }

  /**
   * Check if currently scrolling
   * @returns {boolean} Whether actively scrolling
   */
  isActivelyScrolling() {
    return this.isScrolling
  }

  /**
   * Reset scroll position
   */
  reset() {
    this.state.current = { x: 0, y: 0 }
    this.state.target = { x: 0, y: 0 }
    this.state.last = { x: 0, y: 0 }
    this.state.direction = { x: 'right', y: 'down' }
    this.isScrolling = false
    
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout)
      this.scrollTimeout = null
    }
  }

  /**
   * Update configuration
   * @param {Object} config - New configuration
   */
  updateConfig(config) {
    if (config.ease !== undefined) {
      this.state.ease = config.ease
    }
  }

  /**
   * Dispose of resources
   */
  dispose() {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout)
      this.scrollTimeout = null
    }
  }
}