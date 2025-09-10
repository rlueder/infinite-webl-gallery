/**
 * MediaRenderer - Handles WebGL mesh creation and rendering setup
 */

import { Mesh, Program, Texture } from 'ogl'
import { ELEMENT_CONFIG, ANIMATION_CONFIG } from '../config/constants.js'
import fragment from '../fragment.glsl'
import vertex from '../vertex.glsl'

export class MediaRenderer {
  constructor(gl, geometry, scene, viewport) {
    this.gl = gl
    this.geometry = geometry
    this.scene = scene
    this.viewport = viewport
    
    this.mesh = null
    this.program = null
    this.texture = null
    
    this.createMesh()
  }

  /**
   * Create WebGL mesh with shaders and uniforms
   */
  createMesh() {
    // Create texture
    this.texture = new Texture(this.gl, {
      generateMipmaps: false
    })

    // Create shader program
    this.program = new Program(this.gl, {
      fragment,
      vertex,
      uniforms: {
        tMap: { value: this.texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [ELEMENT_CONFIG.WIDTH, ELEMENT_CONFIG.HEIGHT] },
        uViewportSizes: { value: [this.viewport.width, this.viewport.height] },
        uStrength: { value: 0 },
        uColor: { value: [1.0, 1.0, 1.0, 1.0] }, // White default
        uHoverScale: { value: 1.0 }
      },
      transparent: true
    })

    // Create mesh
    this.mesh = new Mesh(this.gl, {
      geometry: this.geometry,
      program: this.program
    })

    this.mesh.setParent(this.scene)
  }

  /**
   * Update viewport-related uniforms
   * @param {Object} viewport - New viewport dimensions
   */
  updateViewport(viewport) {
    this.viewport = viewport
    
    if (this.program && this.program.uniforms.uViewportSizes) {
      this.program.uniforms.uViewportSizes.value = [viewport.width, viewport.height]
    }
  }

  /**
   * Update plane sizes uniform (called after scaling changes)
   * @param {number} scaleX - X scale value
   * @param {number} scaleY - Y scale value
   */
  updatePlaneSizes(scaleX, scaleY) {
    if (this.program && this.program.uniforms.uPlaneSizes) {
      this.program.uniforms.uPlaneSizes.value = [scaleX, scaleY]
    }
  }

  /**
   * Update strength uniform for scroll effects
   * @param {number} strength - Effect strength value
   */
  updateStrength(strength) {
    if (this.program && this.program.uniforms.uStrength) {
      this.program.uniforms.uStrength.value = strength
    }
  }

  /**
   * Update hover scale uniform
   * @param {number} scale - Hover scale value
   */
  updateHoverScale(scale) {
    if (this.program && this.program.uniforms.uHoverScale) {
      this.program.uniforms.uHoverScale.value = scale
    }
  }

  /**
   * Get the WebGL mesh
   * @returns {Mesh} The mesh instance
   */
  getMesh() {
    return this.mesh
  }

  /**
   * Get the texture instance
   * @returns {Texture} The texture instance
   */
  getTexture() {
    return this.texture
  }

  /**
   * Get the shader program
   * @returns {Program} The program instance
   */
  getProgram() {
    return this.program
  }

  /**
   * Dispose of WebGL resources
   */
  dispose() {
    if (this.mesh) {
      this.mesh.setParent(null)
    }
    
    if (this.texture) {
      this.texture.dispose()
    }
    
    if (this.program) {
      this.program.dispose()
    }
  }
}