/**
 * Coordinate transformation utilities
 * Handles conversions between WebGL viewport space and screen pixel space
 */

/**
 * Convert WebGL plane position to screen coordinates
 * @param {Object} plane - The WebGL plane object
 * @param {Object} viewport - Viewport dimensions
 * @param {Object} screen - Screen dimensions  
 * @returns {Object} Screen coordinates {x, y}
 */
export const webglToScreen = (plane, viewport, screen) => {
  if (!plane || !plane.position) {
    return { x: 0, y: 0 }
  }
  
  const x = (plane.position.x / viewport.width) * screen.width + (screen.width / 2)
  const y = -(plane.position.y / viewport.height) * screen.height + (screen.height / 2)
  
  return { x, y }
}

/**
 * Convert WebGL plane scale to screen dimensions
 * @param {Object} plane - The WebGL plane object
 * @param {Object} viewport - Viewport dimensions
 * @param {Object} screen - Screen dimensions
 * @returns {Object} Screen dimensions {width, height}
 */
export const webglScaleToScreen = (plane, viewport, screen) => {
  if (!plane || !plane.scale) {
    return { width: 0, height: 0 }
  }
  
  const width = (plane.scale.x / viewport.width) * screen.width
  const height = (plane.scale.y / viewport.height) * screen.height
  
  return { width, height }
}

/**
 * Convert pixel dimensions to WebGL viewport units
 * @param {number} pixelWidth - Width in pixels
 * @param {number} pixelHeight - Height in pixels
 * @param {Object} viewport - Viewport dimensions
 * @param {Object} screen - Screen dimensions
 * @returns {Object} Viewport dimensions {width, height}
 */
export const pixelsToViewport = (pixelWidth, pixelHeight, viewport, screen) => {
  const width = (pixelWidth / screen.width) * viewport.width
  const height = (pixelHeight / screen.height) * viewport.height
  
  return { width, height }
}

/**
 * Calculate element bounds in screen space accounting for scroll and wrapping
 * @param {Object} bounds - Original DOM bounds
 * @param {Object} scroll - Current scroll position
 * @param {Object} extra - Infinite scroll wrapping offset
 * @returns {Object} Adjusted bounds {left, top, right, bottom, width, height}
 */
export const calculateVisualBounds = (bounds, scroll, extra) => {
  const left = bounds.left - scroll.x - extra.x
  const top = bounds.top - scroll.y - extra.y
  
  return {
    left,
    top,
    right: left + bounds.width,
    bottom: top + bounds.height,
    width: bounds.width,
    height: bounds.height
  }
}

/**
 * Check if a point is within bounds
 * @param {Object} point - Point coordinates {x, y}
 * @param {Object} bounds - Bounds {left, top, right, bottom}
 * @returns {boolean} Whether point is within bounds
 */
export const isPointInBounds = (point, bounds) => {
  return point.x >= bounds.left && 
         point.x <= bounds.right && 
         point.y >= bounds.top && 
         point.y <= bounds.bottom
}

/**
 * Calculate center point from bounds
 * @param {Object} bounds - Bounds object
 * @returns {Object} Center point {x, y}
 */
export const getBoundsCenter = (bounds) => {
  return {
    x: bounds.left + bounds.width / 2,
    y: bounds.top + bounds.height / 2
  }
}