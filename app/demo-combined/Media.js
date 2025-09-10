import { Mesh, Program, Texture } from 'ogl'

import fragment from './fragment.glsl'
import vertex from './vertex.glsl'

// Global book counter to ensure sequential display
let globalBookIndex = 0

export default class {
  constructor ({ element, geometry, gl, scene, screen, viewport, galleryWidth, galleryHeight }) {
    this.element = element
    this.image = this.element.querySelector('img')

    this.extra = { x: 0, y: 0 }
    this.geometry = geometry
    this.gl = gl
    this.scene = scene
    this.screen = screen
    this.viewport = viewport
    this.galleryWidth = galleryWidth
    this.galleryHeight = galleryHeight

    // Hover state management
    this.hover = {
      isHovered: false,
      scale: 1.0,
      targetScale: 1.0,
      ease: 0.1
    }

    this.createMesh()
    this.createBounds()

    this.onResize()
  }

  createMesh () {
    const image = new Image()
    const texture = new Texture(this.gl, {
      generateMipmaps: false
    })

    this.program = new Program(this.gl, {
      fragment,
      vertex,
      uniforms: {
        tMap: { value: texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [128, 192] }, // Standard size
        uViewportSizes: { value: [this.viewport.width, this.viewport.height] },
        uStrength: { value: 0 },
        uColor: { value: [1.0, 1.0, 1.0, 1.0] }, // White default
        uHoverScale: { value: 1.0 } // Hover scaling factor
      },
      transparent: true
    })

    // Generate a random ISBN and load book cover
    this.loadBookCover(image, texture)

    this.plane = new Mesh(this.gl, {
      geometry: this.geometry,
      program: this.program
    })

    this.plane.setParent(this.scene)
  }

  // Get next ISBN sequentially to avoid duplicates
  generateISBN () {
    // Use a pool of real book ISBNs that are known to have covers on Open Library
    const isbns = [
      '9780547928227', // The Hobbit
      '9780345339683', // The Lord of the Rings
      '9780439708180', // Harry Potter and the Sorcerer's Stone
      '9780061120084', // To Kill a Mockingbird
      '9780486282114', // Pride and Prejudice
      '9780743273565', // The Great Gatsby
      '9780141439518', // Jane Eyre
      '9780316769174', // The Catcher in the Rye
      '9780062315007', // The Alchemist
      '9780452284234', // One Hundred Years of Solitude
      '9780060935467', // To the Lighthouse
      '9780141182605', // 1984
      '9780060850524', // Brave New World
      '9780679783268', // Beloved
      '9780684801221', // The Old Man and the Sea
      '9780679601395', // The Sun Also Rises
      '9780525478812', // The Fault in Our Stars
      '9780375842207', // Life of Pi
      '9780812993547', // Where the Crawdads Sing
      '9780593138885', // The Seven Husbands of Evelyn Hugo
      '9780345816023', // Ready Player One
      '9780593085417', // Project Hail Mary
      '9780440180296', // The Handmaid's Tale
      '9781594744769', // Educated
      '9780735219090', // Where the Forest Meets the Stars
      '9780441172719', // Dune
      '9780064471046', // The Lion, the Witch and the Wardrobe
      '9780307588371', // Gone Girl
      '9780307269751', // The Girl with the Dragon Tattoo
      '9781594631931', // The Kite Runner
      '9780399501487', // The Help
      '9780439023528', // The Hunger Games
      '9780316015844', // Twilight
      '9781400079983', // Middlesex
      '9780307277671', // The Catcher in the Rye (alt)
      '9780451524935', // Animal Farm
      '9780140283334', // Slaughterhouse-Five
      '9780143039433', // The Kite Runner (alt)
      '9780544003415', // The Lord of the Rings (alt)
      '9780804139038'  // Educated (alt)
    ]
    
    // Get current book and increment global counter
    const selectedISBN = isbns[globalBookIndex % isbns.length]
    globalBookIndex++
    
    return selectedISBN
  }

  // Load book cover from Open Library API
  async loadBookCover (image, texture) {
    const isbn = this.generateISBN()
    console.log(`Loading book cover ${globalBookIndex - 1} - ISBN:`, isbn)
    
    // Open Library direct cover API - no rate limits, no API key needed
    const imageUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`
    
    // Load the book cover image
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      console.log('Successfully loaded image for ISBN:', isbn)
      this.isFallbackTexture = false // Flag for debugging
      texture.image = image
      texture.needsUpdate = true
      // Use consistent dimensions for all elements regardless of actual image size
      this.program.uniforms.uImageSizes.value = [128, 192]
    }
    image.onerror = () => {
      console.warn('Failed to load image for ISBN:', isbn, 'creating fallback')
      this.createFallbackTexture(texture)
    }
    image.src = imageUrl
  }

  // Create fallback colored texture if API fails
  createFallbackTexture (texture) {
    console.log('Creating fallback texture')
    this.isFallbackTexture = true // Flag for debugging
    
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 192
    const ctx = canvas.getContext('2d')
    
    // Generate a random color for fallback
    const hue = Math.random() * 360
    ctx.fillStyle = `hsl(${hue}, 70%, 50%)`
    ctx.fillRect(0, 0, 128, 192)
    
    texture.image = canvas
    texture.needsUpdate = true
    this.program.uniforms.uImageSizes.value = [128, 192]
  }

  createBounds () {
    this.bounds = this.element.getBoundingClientRect()

    this.updateScale()
    this.updateX()
    this.updateY()

    // Always update plane sizes uniform after scaling
    this.plane.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y]
  }

  updateScale () {
    // Fixed size: 128x192 pixels converted to viewport units
    // All elements should have exactly the same size regardless of HTML bounds
    const targetWidth = (128 / this.screen.width) * this.viewport.width
    const targetHeight = (192 / this.screen.height) * this.viewport.height
    
    this.plane.scale.x = targetWidth
    this.plane.scale.y = targetHeight
  }

  updateX (x = 0) {
    this.plane.position.x = (-(this.viewport.width / 2) + (this.plane.scale.x / 2) + ((this.bounds.left - x) / this.screen.width) * this.viewport.width) - this.extra.x
  }

  updateY (y = 0) {
    this.plane.position.y = ((this.viewport.height / 2) - (this.plane.scale.y / 2) - ((this.bounds.top - y) / this.screen.height) * this.viewport.height) - this.extra.y
  }

  update (scroll, direction, mouse) {
    this.updateScale()
    this.updateX(scroll.current.x)
    this.updateY(scroll.current.y)
    this.updateHover(mouse, scroll)

    // Ensure plane sizes uniform is always correct
    this.plane.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y]

    // Handle wrapping for both X and Y axes
    const planeOffsetX = this.plane.scale.x / 2
    const planeOffsetY = this.plane.scale.y / 2
    const viewportOffsetX = this.viewport.width / 2
    const viewportOffsetY = this.viewport.height / 2

    // Trigger wrapping earlier - when element starts to exit viewport, not when completely gone
    // Add a buffer equal to one element size to ensure seamless infinite scrolling
    const bufferX = this.plane.scale.x
    const bufferY = this.plane.scale.y

    this.isBeforeX = this.plane.position.x + planeOffsetX < -viewportOffsetX + bufferX
    this.isAfterX = this.plane.position.x - planeOffsetX > viewportOffsetX - bufferX
    this.isBeforeY = this.plane.position.y + planeOffsetY < -viewportOffsetY + bufferY
    this.isAfterY = this.plane.position.y - planeOffsetY > viewportOffsetY - bufferY

    // X-axis wrapping
    if (direction.x === 'right' && this.isBeforeX) {
      this.extra.x -= this.galleryWidth
      this.isBeforeX = false
      this.isAfterX = false
    }

    if (direction.x === 'left' && this.isAfterX) {
      this.extra.x += this.galleryWidth
      this.isBeforeX = false
      this.isAfterX = false
    }

    // Y-axis wrapping (matching demo-1 logic exactly)
    if (direction.y === 'up' && this.isBeforeY) {
      this.extra.y -= this.galleryHeight
      this.isBeforeY = false
      this.isAfterY = false
    }

    if (direction.y === 'down' && this.isAfterY) {
      this.extra.y += this.galleryHeight
      this.isBeforeY = false
      this.isAfterY = false
    }

    // Calculate strength based on both axes movement
    const strengthX = ((scroll.current.x - scroll.last.x) / this.screen.width) * 5
    const strengthY = ((scroll.current.y - scroll.last.y) / this.screen.height) * 5
    this.plane.program.uniforms.uStrength.value = Math.sqrt(strengthX * strengthX + strengthY * strengthY)
  }

  /**
   * Hover Effects.
   */
  checkMouseHover (mouse, scroll) {
    if (!mouse || !scroll || !this.plane) return false

    // Convert WebGL plane position to screen coordinates
    // The plane position is in WebGL space, we need to convert it to screen pixels
    const planeScreenX = (this.plane.position.x / this.viewport.width) * this.screen.width + (this.screen.width / 2)
    const planeScreenY = -(this.plane.position.y / this.viewport.height) * this.screen.height + (this.screen.height / 2)

    // Calculate element dimensions in screen space
    const elementScreenWidth = (this.plane.scale.x / this.viewport.width) * this.screen.width
    const elementScreenHeight = (this.plane.scale.y / this.viewport.height) * this.screen.height

    // Define hover area around the plane's actual position
    const halfWidth = elementScreenWidth / 2
    const halfHeight = elementScreenHeight / 2

    // Check if mouse is within hover area centered on element
    const isHovering = mouse.x >= planeScreenX - halfWidth && 
                      mouse.x <= planeScreenX + halfWidth && 
                      mouse.y >= planeScreenY - halfHeight && 
                      mouse.y <= planeScreenY + halfHeight

    // Debug hover for fallback textures
    if (isHovering && this.isFallbackTexture) {
      console.log('Fallback texture hover:', {
        mouse: { x: mouse.x, y: mouse.y },
        planeScreen: { x: planeScreenX, y: planeScreenY },
        planeWebGL: { x: this.plane.position.x, y: this.plane.position.y },
        scale: { x: this.plane.scale.x, y: this.plane.scale.y },
        elementDimensions: { width: elementScreenWidth, height: elementScreenHeight }
      })
    }

    return isHovering
  }

  updateHover (mouse, scroll) {
    // Check if mouse is hovering over this element
    const isHovering = this.checkMouseHover(mouse, scroll)
    
    if (isHovering && !this.hover.isHovered) {
      this.hover.isHovered = true
      this.hover.targetScale = 1.3 // Scale up by 30%
      console.log('Hover started')
    } else if (!isHovering && this.hover.isHovered) {
      this.hover.isHovered = false
      this.hover.targetScale = 1.0 // Return to normal size
      console.log('Hover ended')
    }

    // Smooth lerp animation for hover scale
    this.hover.scale += (this.hover.targetScale - this.hover.scale) * this.hover.ease
    
    // Update shader uniform
    if (this.plane && this.plane.program && this.plane.program.uniforms && this.plane.program.uniforms.uHoverScale) {
      this.plane.program.uniforms.uHoverScale.value = this.hover.scale
    }
  }

  /**
   * Events.
   */
  onResize (sizes) {
    this.extra = { x: 0, y: 0 }

    if (sizes) {
      const { galleryWidth, galleryHeight, screen, viewport } = sizes

      if (galleryWidth) this.galleryWidth = galleryWidth
      if (galleryHeight) this.galleryHeight = galleryHeight
      if (screen) this.screen = screen
      if (viewport) {
        this.viewport = viewport
        this.plane.program.uniforms.uViewportSizes.value = [this.viewport.width, this.viewport.height]
      }
    }

    this.createBounds()
  }
}