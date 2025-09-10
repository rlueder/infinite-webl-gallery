import { Mesh, Program, Texture } from 'ogl'

import fragment from './fragment.glsl'
import vertex from './vertex.glsl'

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
    // Generate random color for this element
    const hue = Math.random() * 360
    const saturation = 50 + Math.random() * 50 // 50-100%
    const lightness = 40 + Math.random() * 40 // 40-80%
    
    const randomColor = this.hslToRgb(hue, saturation, lightness)

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
        uColor: { value: [randomColor[0]/255, randomColor[1]/255, randomColor[2]/255, 1.0] }, // Normalize RGB to 0-1 range
        uHoverScale: { value: 1.0 } // Hover scaling factor
      },
      transparent: true
    })

    // Always create a colored texture since we want random colors
    // Create a 1x1 pixel canvas with the random color
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = `rgb(${randomColor[0]}, ${randomColor[1]}, ${randomColor[2]})`
    ctx.fillRect(0, 0, 1, 1)
    
    texture.image = canvas
    this.program.uniforms.uImageSizes.value = [1, 1]

    this.plane = new Mesh(this.gl, {
      geometry: this.geometry,
      program: this.program
    })

    this.plane.setParent(this.scene)
  }

  // Convert HSL to RGB
  hslToRgb (h, s, l) {
    h /= 360
    s /= 100
    l /= 100
    
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }

    let r, g, b

    if (s === 0) {
      r = g = b = l // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1/3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1/3)
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
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
    if (!mouse || !scroll) return false

    // Calculate the actual visual position accounting for scroll and infinite wrapping
    const visualX = this.bounds.left - scroll.current.x - this.extra.x
    const visualY = this.bounds.top - scroll.current.y - this.extra.y

    // Calculate element center in screen space
    const centerX = visualX + (this.bounds.width / 2)
    const centerY = visualY + (this.bounds.height / 2)

    // Define hover area around the center
    const halfWidth = this.bounds.width / 2
    const halfHeight = this.bounds.height / 2

    // Check if mouse is within hover area centered on element
    return mouse.x >= centerX - halfWidth && 
           mouse.x <= centerX + halfWidth && 
           mouse.y >= centerY - halfHeight && 
           mouse.y <= centerY + halfHeight
  }

  updateHover (mouse, scroll) {
    // Check if mouse is hovering over this element
    const isHovering = this.checkMouseHover(mouse, scroll)
    
    if (isHovering && !this.hover.isHovered) {
      this.hover.isHovered = true
      this.hover.targetScale = 1.3 // Scale up by 30%
    } else if (!isHovering && this.hover.isHovered) {
      this.hover.isHovered = false
      this.hover.targetScale = 1.0 // Return to normal size
    }

    // Smooth lerp animation for hover scale
    this.hover.scale += (this.hover.targetScale - this.hover.scale) * this.hover.ease
    
    // Update shader uniform
    this.plane.program.uniforms.uHoverScale.value = this.hover.scale
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