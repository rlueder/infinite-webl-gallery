/**
 * MouseManager - Handles mouse/touch input and drag interactions
 */

import { ANIMATION_CONFIG } from '../config/constants.js'

export class MouseManager {
  constructor() {
    this.state = {
      position: { x: 0, y: 0 },
      lastPosition: { x: 0, y: 0 },
      isDragging: false,
      dragStart: { x: 0, y: 0 },
      dragCurrent: { x: 0, y: 0 },
      dragInitialScroll: { x: 0, y: 0 }
    }
    
    this.config = {
      dragThreshold: ANIMATION_CONFIG.DRAG_THRESHOLD || 5
    }
    
    this.callbacks = {
      onMove: null,
      onDragStart: null,
      onDrag: null,
      onDragEnd: null
    }
  }

  /**
   * Initialize mouse event listeners
   * @param {HTMLElement} element - Element to attach listeners to
   */
  init(element) {
    this.element = element
    
    // Mouse events
    element.addEventListener('mousemove', this.handleMouseMove.bind(this))
    element.addEventListener('mousedown', this.handleMouseDown.bind(this))
    element.addEventListener('mouseup', this.handleMouseUp.bind(this))
    element.addEventListener('mouseleave', this.handleMouseLeave.bind(this))
    
    // Touch events for mobile
    element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false })
    element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false })
    element.addEventListener('touchend', this.handleTouchEnd.bind(this))
    element.addEventListener('touchcancel', this.handleTouchCancel.bind(this))
  }

  /**
   * Set callback functions
   * @param {Object} callbacks - Callback functions
   */
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  /**
   * Handle mouse move events
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseMove(event) {
    this.updatePosition(event.clientX, event.clientY)
    
    if (this.state.isDragging) {
      this.updateDrag(event.clientX, event.clientY)
    }
    
    if (this.callbacks.onMove) {
      this.callbacks.onMove(this.state.position)
    }
  }

  /**
   * Handle mouse down events
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseDown(event) {
    this.startDrag(event.clientX, event.clientY)
  }

  /**
   * Handle mouse up events
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseUp(event) {
    this.endDrag()
  }

  /**
   * Handle mouse leave events
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseLeave(event) {
    this.state.position = { x: -1, y: -1 } // Off-screen position
    this.endDrag()
    
    if (this.callbacks.onMove) {
      this.callbacks.onMove(this.state.position)
    }
  }

  /**
   * Handle touch start events
   * @param {TouchEvent} event - Touch event
   */
  handleTouchStart(event) {
    event.preventDefault()
    
    const touch = event.touches[0]
    this.updatePosition(touch.clientX, touch.clientY)
    this.startDrag(touch.clientX, touch.clientY)
    
    if (this.callbacks.onMove) {
      this.callbacks.onMove(this.state.position)
    }
  }

  /**
   * Handle touch move events
   * @param {TouchEvent} event - Touch event
   */
  handleTouchMove(event) {
    event.preventDefault()
    
    const touch = event.touches[0]
    this.updatePosition(touch.clientX, touch.clientY)
    
    if (this.state.isDragging) {
      this.updateDrag(touch.clientX, touch.clientY)
    }
    
    if (this.callbacks.onMove) {
      this.callbacks.onMove(this.state.position)
    }
  }

  /**
   * Handle touch end events
   * @param {TouchEvent} event - Touch event
   */
  handleTouchEnd(event) {
    this.endDrag()
  }

  /**
   * Handle touch cancel events
   * @param {TouchEvent} event - Touch event
   */
  handleTouchCancel(event) {
    this.endDrag()
  }

  /**
   * Update mouse position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  updatePosition(x, y) {
    this.state.lastPosition = { ...this.state.position }
    this.state.position = { x, y }
  }

  /**
   * Start drag interaction
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  startDrag(x, y, initialScrollPosition = { x: 0, y: 0 }) {
    this.state.isDragging = true
    this.state.dragStart = { x, y }
    this.state.dragCurrent = { x, y }
    this.state.dragInitialScroll = { ...initialScrollPosition }
    
    if (this.callbacks.onDragStart) {
      this.callbacks.onDragStart({
        start: this.state.dragStart,
        initialScroll: this.state.dragInitialScroll
      })
    }
  }

  /**
   * Update drag state
   * @param {number} x - Current X coordinate
   * @param {number} y - Current Y coordinate
   */
  updateDrag(x, y) {
    if (!this.state.isDragging) return
    
    this.state.dragCurrent = { x, y }
    
    // Check if we've moved enough to consider it a real drag
    const dragDistance = Math.sqrt(
      Math.pow(x - this.state.dragStart.x, 2) + 
      Math.pow(y - this.state.dragStart.y, 2)
    )
    
    if (dragDistance >= this.config.dragThreshold && this.callbacks.onDrag) {
      this.callbacks.onDrag({
        start: this.state.dragStart,
        current: this.state.dragCurrent,
        initialScroll: this.state.dragInitialScroll
      })
    }
  }

  /**
   * End drag interaction
   */
  endDrag() {
    if (this.state.isDragging && this.callbacks.onDragEnd) {
      this.callbacks.onDragEnd({
        start: this.state.dragStart,
        end: this.state.dragCurrent,
        initialScroll: this.state.dragInitialScroll
      })
    }
    
    this.state.isDragging = false
    this.state.dragStart = { x: 0, y: 0 }
    this.state.dragCurrent = { x: 0, y: 0 }
    this.state.dragInitialScroll = { x: 0, y: 0 }
  }

  /**
   * Get current mouse state
   * @returns {Object} Current mouse state
   */
  getState() {
    return {
      position: { ...this.state.position },
      lastPosition: { ...this.state.lastPosition },
      isDragging: this.state.isDragging,
      dragStart: { ...this.state.dragStart },
      dragCurrent: { ...this.state.dragCurrent }
    }
  }

  /**
   * Get current mouse position
   * @returns {Object} Current position {x, y}
   */
  getPosition() {
    return { ...this.state.position }
  }

  /**
   * Check if currently dragging
   * @returns {boolean} Whether currently dragging
   */
  isDragging() {
    return this.state.isDragging
  }

  /**
   * Get mouse velocity
   * @returns {Object} Velocity {x, y}
   */
  getVelocity() {
    return {
      x: this.state.position.x - this.state.lastPosition.x,
      y: this.state.position.y - this.state.lastPosition.y
    }
  }

  /**
   * Reset mouse state
   */
  reset() {
    this.state.position = { x: 0, y: 0 }
    this.state.lastPosition = { x: 0, y: 0 }
    this.endDrag()
  }

  /**
   * Update configuration
   * @param {Object} config - New configuration
   */
  updateConfig(config) {
    this.config = { ...this.config, ...config }
  }

  /**
   * Dispose of resources and remove event listeners
   */
  dispose() {
    if (this.element) {
      // Mouse events
      this.element.removeEventListener('mousemove', this.handleMouseMove.bind(this))
      this.element.removeEventListener('mousedown', this.handleMouseDown.bind(this))
      this.element.removeEventListener('mouseup', this.handleMouseUp.bind(this))
      this.element.removeEventListener('mouseleave', this.handleMouseLeave.bind(this))
      
      // Touch events
      this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this))
      this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this))
      this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this))
      this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this))
    }
    
    this.reset()
  }
}