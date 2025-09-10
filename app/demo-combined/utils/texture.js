/**
 * Texture creation and management utilities
 */

import { ELEMENT_CONFIG, API_CONFIG } from '../config/constants.js'

/**
 * Create a fallback colored texture when book covers fail to load
 * @param {number} hue - HSL hue value (0-360)
 * @returns {HTMLCanvasElement} Canvas element with colored texture
 */
export const createFallbackTexture = (hue = Math.random() * 360) => {
  const canvas = document.createElement('canvas')
  canvas.width = ELEMENT_CONFIG.WIDTH
  canvas.height = ELEMENT_CONFIG.HEIGHT
  
  const ctx = canvas.getContext('2d')
  
  // Generate HSL color with configured saturation and lightness
  const { SATURATION, LIGHTNESS } = API_CONFIG.FALLBACK_COLORS
  ctx.fillStyle = `hsl(${hue}, ${SATURATION}%, ${LIGHTNESS}%)`
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  return canvas
}

/**
 * Create book cover URL from ISBN
 * @param {string} isbn - Book ISBN
 * @returns {string} Open Library cover URL
 */
export const createBookCoverUrl = (isbn) => {
  const { BOOK_COVER_URL, COVER_SIZE } = API_CONFIG
  return `${BOOK_COVER_URL}/${isbn}-${COVER_SIZE}.jpg`
}

/**
 * Load image with timeout and error handling
 * @param {string} url - Image URL to load
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<HTMLImageElement>} Promise that resolves with loaded image
 */
export const loadImageWithTimeout = (url, timeout = API_CONFIG.LOAD_TIMEOUT) => {
  return new Promise((resolve, reject) => {
    const image = new Image()
    
    let timeoutId = setTimeout(() => {
      reject(new Error(`Image load timeout: ${url}`))
    }, timeout)
    
    image.onload = () => {
      clearTimeout(timeoutId)
      resolve(image)
    }
    
    image.onerror = () => {
      clearTimeout(timeoutId)
      reject(new Error(`Failed to load image: ${url}`))
    }
    
    image.crossOrigin = API_CONFIG.CROSS_ORIGIN
    image.src = url
  })
}

/**
 * Check if a texture is considered "empty" (black or transparent)
 * @param {HTMLImageElement|HTMLCanvasElement} textureImage - Image or canvas
 * @returns {boolean} Whether the texture appears empty
 */
export const isTextureEmpty = (textureImage) => {
  if (!textureImage) return true
  
  try {
    // Create a small canvas to sample the texture
    const testCanvas = document.createElement('canvas')
    testCanvas.width = 1
    testCanvas.height = 1
    const ctx = testCanvas.getContext('2d')
    
    ctx.drawImage(textureImage, 0, 0, 1, 1)
    const pixel = ctx.getImageData(0, 0, 1, 1).data
    
    // Check if pixel is black/transparent (all values near 0)
    const [r, g, b, a] = pixel
    return a < 25 || (r < 25 && g < 25 && b < 25)
  } catch (error) {
    // If we can't sample the texture, assume it's empty
    return true
  }
}

/**
 * Update WebGL texture with new image data
 * @param {Object} texture - OGL Texture instance
 * @param {HTMLImageElement|HTMLCanvasElement} image - New image data
 * @param {Array} uniformImageSizes - Reference to uImageSizes uniform
 */
export const updateTextureImage = (texture, image, uniformImageSizes) => {
  if (!texture || !image) return
  
  texture.image = image
  texture.needsUpdate = true
  
  // Always use consistent dimensions for shader calculations
  if (uniformImageSizes) {
    uniformImageSizes.value = [ELEMENT_CONFIG.WIDTH, ELEMENT_CONFIG.HEIGHT]
  }
}