/**
 * MediaLoader - Handles book cover loading and fallback texture creation
 */

import { getISBNByIndex } from '../config/books.js'
import { createBookCoverUrl, createFallbackTexture, loadImageWithTimeout, updateTextureImage } from '../utils/texture.js'

/**
 * Global book counter for sequential display
 */
let globalBookIndex = 0

export class MediaLoader {
  constructor(texture, program) {
    this.texture = texture
    this.program = program
    this.isLoading = false
    this.isFallbackTexture = false
    this.isbn = null
    this.bookIndex = globalBookIndex++
  }

  /**
   * Load book cover or create fallback texture
   * @returns {Promise<void>}
   */
  async load() {
    if (this.isLoading) return
    
    this.isLoading = true
    this.isbn = getISBNByIndex(this.bookIndex)
    
    console.log(`Loading book cover ${this.bookIndex} - ISBN:`, this.isbn)
    
    try {
      // Try to load the book cover
      const imageUrl = createBookCoverUrl(this.isbn)
      const image = await loadImageWithTimeout(imageUrl)
      
      // Successfully loaded - update texture
      console.log('Successfully loaded image for ISBN:', this.isbn)
      this.isFallbackTexture = false
      this.updateTexture(image)
      
    } catch (error) {
      // Failed to load - create fallback
      console.warn('Failed to load image for ISBN:', this.isbn, 'creating fallback')
      this.createFallback()
    } finally {
      this.isLoading = false
    }
  }

  /**
   * Create fallback colored texture
   */
  createFallback() {
    console.log('Creating fallback texture for book index:', this.bookIndex)
    this.isFallbackTexture = true
    
    const canvas = createFallbackTexture()
    this.updateTexture(canvas)
  }

  /**
   * Update the WebGL texture with new image data
   * @param {HTMLImageElement|HTMLCanvasElement} image - New texture image
   */
  updateTexture(image) {
    updateTextureImage(
      this.texture,
      image,
      this.program.uniforms.uImageSizes
    )
  }

  /**
   * Get loader info for debugging
   * @returns {Object} Loader information
   */
  getInfo() {
    return {
      bookIndex: this.bookIndex,
      isbn: this.isbn,
      isFallback: this.isFallbackTexture,
      isLoading: this.isLoading
    }
  }

  /**
   * Reset global book counter (for testing)
   */
  static resetGlobalIndex() {
    globalBookIndex = 0
  }
}