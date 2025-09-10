/**
 * Mathematical utility functions
 */

/**
 * Linear interpolation between two values
 * @param {number} start - Start value
 * @param {number} end - End value  
 * @param {number} factor - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export const lerp = (start, end, factor) => {
  return start + (end - start) * factor
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max)
}

/**
 * Map a value from one range to another
 * @param {number} value - Input value
 * @param {number} inMin - Input range minimum
 * @param {number} inMax - Input range maximum
 * @param {number} outMin - Output range minimum
 * @param {number} outMax - Output range maximum
 * @returns {number} Mapped value
 */
export const map = (value, inMin, inMax, outMin, outMax) => {
  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin
}

/**
 * Calculate distance between two points
 * @param {Object} point1 - First point {x, y}
 * @param {Object} point2 - Second point {x, y}
 * @returns {number} Distance between points
 */
export const distance = (point1, point2) => {
  const dx = point2.x - point1.x
  const dy = point2.y - point1.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Calculate magnitude of a vector
 * @param {Object} vector - Vector {x, y}
 * @returns {number} Vector magnitude
 */
export const magnitude = (vector) => {
  return Math.sqrt(vector.x * vector.x + vector.y * vector.y)
}

/**
 * Normalize a vector to unit length
 * @param {Object} vector - Vector to normalize {x, y}
 * @returns {Object} Normalized vector {x, y}
 */
export const normalize = (vector) => {
  const mag = magnitude(vector)
  if (mag === 0) return { x: 0, y: 0 }
  return { x: vector.x / mag, y: vector.y / mag }
}

/**
 * Calculate grid position from linear index
 * @param {number} index - Linear index
 * @param {number} cols - Number of columns
 * @returns {Object} Grid position {col, row}
 */
export const indexToGrid = (index, cols) => {
  return {
    col: index % cols,
    row: Math.floor(index / cols)
  }
}

/**
 * Calculate linear index from grid position
 * @param {number} col - Column position
 * @param {number} row - Row position
 * @param {number} cols - Number of columns
 * @returns {number} Linear index
 */
export const gridToIndex = (col, row, cols) => {
  return row * cols + col
}