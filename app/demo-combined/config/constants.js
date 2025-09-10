/**
 * Configuration constants for the Combined Demo
 */

export const ELEMENT_CONFIG = {
  // Standard element dimensions in pixels
  WIDTH: 128,
  HEIGHT: 192,
  
  // Gap between elements
  GAP: 5
}

export const ANIMATION_CONFIG = {
  // Scroll animation
  SCROLL_EASE: 0.05,
  SCROLL_MULTIPLIER: {
    DRAG: 2,    // Mouse drag multiplier
    WHEEL: 0.5  // Mouse wheel multiplier
  },
  
  // Hover animation
  HOVER_EASE: 0.1,
  HOVER_SCALE: 1.3,
  HOVER_Z_OFFSET: 3.0,
  
  // WebGL effect strength multipliers
  STRENGTH_MULTIPLIER: 5
}

export const VIEWPORT_CONFIG = {
  // Camera settings
  CAMERA_FOV: 45,
  CAMERA_Z: 5,
  
  // Post-processing
  POST_STRENGTH_MULTIPLIER: 0.5
}

export const DEBUG_CONFIG = {
  // Debug panel settings
  ENABLED: process.env.NODE_ENV === 'development',
  TOGGLE_KEY: 'KeyD', // Press 'D' to toggle debug panel
  
  // Logging levels
  LOG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
  
  // Performance monitoring
  SHOW_FPS: true,
  SHOW_RENDER_TIME: true
}

export const API_CONFIG = {
  // Open Library API settings
  BOOK_COVER_URL: 'https://covers.openlibrary.org/b/isbn',
  COVER_SIZE: 'M', // S, M, L
  
  // Image loading
  CROSS_ORIGIN: 'anonymous',
  LOAD_TIMEOUT: 5000, // milliseconds
  
  // Fallback texture
  FALLBACK_COLORS: {
    SATURATION: 70,  // HSL saturation percentage
    LIGHTNESS: 50    // HSL lightness percentage
  }
}