import { Renderer, Camera, Transform, Plane, Post, Vec2 } from 'ogl'
import NormalizeWheel from 'normalize-wheel'

import { lerp } from 'utils/math'

import fragment from './demo-2/post.glsl'
import Media from './demo-combined/Media'

export default class App {
  constructor () {
    this.scroll = {
      ease: 0.05,
      current: { x: 0, y: 0 },
      target: { x: 0, y: 0 },
      last: { x: 0, y: 0 }
    }

    // Disable auto scroll
    this.speed = { x: 0, y: 0 }

    // Mouse tracking for hover effects
    this.mouse = { x: 0, y: 0 }

    this.createRenderer()
    this.createCamera()
    this.createScene()
    this.createGallery()
    this.createPost()

    this.onResize()

    this.createGeometry()
    this.createMedias()

    this.update()

    this.addEventListeners()
  }

  createGallery () {
    this.gallery = document.querySelector('.demo-combined__gallery')
  }

  createRenderer () {
    this.renderer = new Renderer({
      alpha: true
    })

    this.gl = this.renderer.gl

    document.body.appendChild(this.gl.canvas)
  }

  createCamera () {
    this.camera = new Camera(this.gl)
    this.camera.fov = 45
    this.camera.position.z = 5
  }

  createScene () {
    this.scene = new Transform()
  }

  createPost () {
    this.post = new Post(this.gl)

    this.pass = this.post.addPass({
      fragment,
      uniforms: {
        uResolution: this.resolution,
        uStrength: { value: 0 }
      }
    })

    this.resolution = {
      value: new Vec2()
    }
  }

  createGeometry () {
    this.planeGeometry = new Plane(this.gl, {
      widthSegments: 20,
      heightSegments: 10
    })
  }

  createMedias () {
    this.mediasElements = document.querySelectorAll('.demo-combined__gallery__figure')
    this.medias = Array.from(this.mediasElements).map(element => {
      let media = new Media({
        element,
        geometry: this.planeGeometry,
        gl: this.gl,
        scene: this.scene,
        screen: this.screen,
        viewport: this.viewport,
        galleryWidth: this.galleryWidth,
        galleryHeight: this.galleryHeight
      })

      return media
    })
  }

  /**
   * Events.
   */
  onTouchDown (event) {
    this.isDown = true

    this.scroll.position = { ...this.scroll.current }
    this.start = {
      x: event.touches ? event.touches[0].clientX : event.clientX,
      y: event.touches ? event.touches[0].clientY : event.clientY
    }
  }

  onTouchMove (event) {
    if (!this.isDown) return

    const x = event.touches ? event.touches[0].clientX : event.clientX
    const y = event.touches ? event.touches[0].clientY : event.clientY
    const distanceX = (this.start.x - x) * 2
    const distanceY = (this.start.y - y) * 2

    this.scroll.target.x = this.scroll.position.x + distanceX
    this.scroll.target.y = this.scroll.position.y + distanceY
  }

  onTouchUp (event) {
    this.isDown = false
  }

  onWheel (event) {
    const normalized = NormalizeWheel(event)
    const speedX = normalized.pixelX
    const speedY = normalized.pixelY

    this.scroll.target.x += speedX * 0.5
    this.scroll.target.y += speedY * 0.5
  }

  /**
   * Resize.
   */
  onResize () {
    this.screen = {
      height: window.innerHeight,
      width: window.innerWidth
    }

    this.renderer.setSize(this.screen.width, this.screen.height)

    this.camera.perspective({
      aspect: this.gl.canvas.width / this.gl.canvas.height
    })

    const fov = this.camera.fov * (Math.PI / 180)
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z
    const width = height * this.camera.aspect

    this.viewport = {
      height,
      width
    }

    this.post.resize()

    this.resolution.value.set(this.gl.canvas.width, this.gl.canvas.height)

    this.galleryBounds = this.gallery.getBoundingClientRect()
    
    // Calculate dynamic grid dimensions based on actual gallery size
    // The gallery dimensions are set by the HTML script based on viewport
    const elementWidth = 128
    const elementHeight = 192
    const gap = 5
    
    // Calculate actual columns and rows from gallery bounds
    const actualCols = Math.floor((this.galleryBounds.width + gap) / (elementWidth + gap))
    const actualRows = Math.floor((this.galleryBounds.height + gap) / (elementHeight + gap))
    
    // For infinite wrapping, we need the full grid cycle including the gap to the next cycle
    const fullGridWidth = actualCols * (elementWidth + gap)
    const fullGridHeight = actualRows * (elementHeight + gap)
    
    this.galleryWidth = this.viewport.width * fullGridWidth / this.screen.width
    this.galleryHeight = this.viewport.height * fullGridHeight / this.screen.height

    if (this.medias) {
      this.medias.forEach(media => media.onResize({
        screen: this.screen,
        viewport: this.viewport,
        galleryWidth: this.galleryWidth,
        galleryHeight: this.galleryHeight
      }))
    }
  }

  /**
   * Update.
   */
  update () {
    // No auto scroll - only manual interaction moves the gallery
    
    this.scroll.current.x = lerp(this.scroll.current.x, this.scroll.target.x, this.scroll.ease)
    this.scroll.current.y = lerp(this.scroll.current.y, this.scroll.target.y, this.scroll.ease)

    // Determine direction for both axes
    this.direction = {
      x: this.scroll.current.x > this.scroll.last.x ? 'right' : 'left',
      y: this.scroll.current.y > this.scroll.last.y ? 'down' : 'up'
    }

    if (this.medias) {
      this.medias.forEach(media => media.update(this.scroll, this.direction, this.mouse))
    }

    // Calculate strength for post-processing effect based on both axes
    const strengthX = (this.scroll.current.x - this.scroll.last.x) / this.screen.width * 0.5
    const strengthY = (this.scroll.current.y - this.scroll.last.y) / this.screen.height * 0.5
    this.pass.uniforms.uStrength.value = Math.sqrt(strengthX * strengthX + strengthY * strengthY)

    this.post.render({
      scene: this.scene,
      camera: this.camera
    })

    this.scroll.last.x = this.scroll.current.x
    this.scroll.last.y = this.scroll.current.y

    window.requestAnimationFrame(this.update.bind(this))
  }

  /**
   * Listeners.
   */
  onMouseMove (event) {
    this.mouse.x = event.clientX
    this.mouse.y = event.clientY
  }

  addEventListeners () {
    window.addEventListener('resize', this.onResize.bind(this))

    window.addEventListener('mousewheel', this.onWheel.bind(this))
    window.addEventListener('wheel', this.onWheel.bind(this))

    window.addEventListener('mousedown', this.onTouchDown.bind(this))
    window.addEventListener('mousemove', this.onTouchMove.bind(this))
    window.addEventListener('mouseup', this.onTouchUp.bind(this))

    // Add dedicated mouse move listener for hover effects
    window.addEventListener('mousemove', this.onMouseMove.bind(this))

    window.addEventListener('touchstart', this.onTouchDown.bind(this))
    window.addEventListener('touchmove', this.onTouchMove.bind(this))
    window.addEventListener('touchend', this.onTouchUp.bind(this))
  }
}