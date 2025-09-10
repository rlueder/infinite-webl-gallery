import { Renderer, Camera, Transform, Plane, Post, Vec2 } from 'ogl'

import { ELEMENT_CONFIG, ANIMATION_CONFIG } from './demo-combined/config/constants.js'
import { Media } from './demo-combined/components/Media.js'
import { ScrollManager } from './demo-combined/managers/ScrollManager.js'
import { MouseManager } from './demo-combined/managers/MouseManager.js'
import { ViewportManager } from './demo-combined/managers/ViewportManager.js'
import { PreloadManager } from './demo-combined/managers/PreloadManager.js'
import { debugLogger, DebugPanel } from './demo-combined/utils/debug.js'
import fragment from './demo-combined/fragment.glsl'

export default class App {
  constructor () {
    // Initialize debug logging
    this.initDebug()
    
    // Initialize managers
    this.initManagers()
    
    // Create WebGL components
    this.createRenderer()
    this.createCamera()
    this.createScene()
    this.createPost()
    
    // Create gallery
    this.createGallery()
    this.createGeometry()
    this.createMedias()
    
    // Initialize event handlers
    this.initEventHandlers()
    
    // Start the application
    this.onResize()
    this.update()
    
    // Start conservative initial preloading
    if (this.preloadManager && this.medias.length > 0) {
      // Only preload visible covers initially to prevent memory bloat
      const layout = this.viewportManager.calculateLayout(ELEMENT_CONFIG)
      const initialPreloadCount = Math.min(layout.total, 20) // Only preload visible + small buffer
      
      for (let i = 0; i < initialPreloadCount; i++) {
        const media = this.medias[i]
        if (media && media.loader) {
          this.preloadManager.preloadBookCover(media.loader.bookIndex)
        }
      }
      
      debugLogger.info('Preload', `Conservative initial preloading started for ${initialPreloadCount} covers`)
    }
    
    debugLogger.info('App', 'Application initialized successfully')
  }

  initDebug() {
    // Enable debug logging in development
    const isDebug = window.location.search.includes('debug=true')
    debugLogger.setEnabled(isDebug)
    
    if (isDebug) {
      this.debugPanel = new DebugPanel(debugLogger)
      debugLogger.info('Debug', 'Debug panel initialized - Press Ctrl/Cmd+D to toggle')
    }
  }

  initManagers() {
    // Initialize scroll manager
    this.scrollManager = new ScrollManager()
    
    // Initialize mouse manager
    this.mouseManager = new MouseManager()
    
    // Initialize viewport manager
    this.viewportManager = new ViewportManager()
    
    // Initialize preload manager
    this.preloadManager = new PreloadManager()
    
    // Throttle preloading to avoid performance issues
    this.lastPreloadCheck = 0
    this.preloadCheckInterval = 50 // Check every 50ms for more responsive preloading
    
    debugLogger.info('Managers', 'All managers initialized')
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
        screen: this.viewportManager.getScreen(),
        viewport: this.viewportManager.getViewport(),
        galleryWidth: this.viewportManager.getGalleryDimensions().width,
        galleryHeight: this.viewportManager.getGalleryDimensions().height,
        preloadManager: this.preloadManager
      })

      return media
    })
    
    debugLogger.info('Media', `Created ${this.medias.length} media elements`)
  }

  initEventHandlers() {
    // Initialize viewport manager with canvas
    this.viewportManager.init(this.gl.canvas)
    
    // Initialize mouse manager with canvas
    this.mouseManager.init(this.gl.canvas)
    
    // Set up mouse callbacks
    this.mouseManager.setCallbacks({
      onMove: (position) => {
        // Mouse position updates are handled automatically
      },
      onDragStart: (dragData) => {
        // Set initial scroll position for drag
        dragData.initialScroll = this.scrollManager.getState().current
        debugLogger.debug('Input', 'Drag started', dragData)
      },
      onDrag: (dragData) => {
        this.scrollManager.handleDrag(
          dragData.start.x,
          dragData.start.y,
          dragData.current.x,
          dragData.current.y,
          dragData.initialScroll
        )
      },
      onDragEnd: (dragData) => {
        debugLogger.debug('Input', 'Drag ended', dragData)
      }
    })
    
    // Set up viewport resize callback
    this.viewportManager.onResize((state) => {
      this.onResize(state)
    })
    
    // Set up wheel event handling
    this.gl.canvas.addEventListener('wheel', (event) => {
      this.scrollManager.handleWheel(event)
    })
    
    debugLogger.info('Events', 'Event handlers initialized')
  }

  /**
   * Resize.
   */
  onResize (viewportState = null) {
    // Get current viewport state from manager
    const state = viewportState || this.viewportManager.getState()
    
    // Update renderer
    this.renderer.setSize(state.screen.width, state.screen.height)

    // Update camera
    this.camera.perspective({
      aspect: this.gl.canvas.width / this.gl.canvas.height
    })

    // Calculate WebGL viewport
    const fov = this.camera.fov * (Math.PI / 180)
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z
    const width = height * this.camera.aspect
    const viewport = { width, height }

    // Update viewport manager with WebGL viewport
    this.viewportManager.state.viewport = {
      width: this.gl.canvas.width,
      height: this.gl.canvas.height
    }

    // Update post processing
    this.post.resize()
    this.resolution.value.set(this.gl.canvas.width, this.gl.canvas.height)

    // Calculate gallery dimensions using constants
    const galleryBounds = this.gallery.getBoundingClientRect()
    const layout = this.viewportManager.calculateLayout(ELEMENT_CONFIG)
    
    // Calculate full grid dimensions for infinite wrapping
    // The wrapping distance should be the exact spacing between the start of one cycle
    // and the start of the next cycle. This is simply: columns * (width + gap)
    // because each element occupies (width + gap) space, including the last element
    const fullGridWidth = layout.baseColumns * (ELEMENT_CONFIG.WIDTH + ELEMENT_CONFIG.GAP)
    const fullGridHeight = layout.baseRows * (ELEMENT_CONFIG.HEIGHT + ELEMENT_CONFIG.GAP)
    
    // Convert to WebGL space
    const galleryWidth = viewport.width * fullGridWidth / state.screen.width
    const galleryHeight = viewport.height * fullGridHeight / state.screen.height
    
    // Update viewport manager with gallery dimensions
    this.viewportManager.updateGalleryDimensions(ELEMENT_CONFIG, {
      columns: layout.baseColumns, // Use base layout for seamless wrapping
      rows: layout.baseRows
    })

    // Update media elements
    if (this.medias) {
      this.medias.forEach(media => media.onResize({
        screen: state.screen,
        viewport: viewport,
        galleryWidth: galleryWidth,
        galleryHeight: galleryHeight
      }))
    }
    
    debugLogger.info('Resize', 'Application resized', {
      screen: state.screen,
      viewport: viewport,
      layout: layout,
      galleryDimensions: {
        fullGridWidth,
        fullGridHeight,
        galleryWidth,
        galleryHeight,
        elementSpacing: ELEMENT_CONFIG.WIDTH + ELEMENT_CONFIG.GAP,
        calculations: {
          baseColumns: layout.baseColumns,
          elementWidth: ELEMENT_CONFIG.WIDTH,
          gap: ELEMENT_CONFIG.GAP,
          totalWidth: layout.baseColumns * (ELEMENT_CONFIG.WIDTH + ELEMENT_CONFIG.GAP),
          screenWidth: state.screen.width,
          elementSpacing: ELEMENT_CONFIG.WIDTH + ELEMENT_CONFIG.GAP,
          coverage: (layout.baseColumns * (ELEMENT_CONFIG.WIDTH + ELEMENT_CONFIG.GAP)) / state.screen.width
        }
      }
    })
  }

  /**
   * Update.
   */
  update () {
    // Update scroll manager
    this.scrollManager.update()
    
    // Get current scroll state and mouse position
    const scrollState = this.scrollManager.getState()
    const mousePosition = this.mouseManager.getPosition()
    const screenState = this.viewportManager.getScreen()
    
    // Drag handling is done via callbacks set in initEventHandlers

    // Update media elements
    if (this.medias) {
      this.medias.forEach(media => media.update(
        scrollState,
        scrollState.direction
      ))
    }

    // Throttled preloading based on grid position and scroll direction
    const now = performance.now()
    if (this.preloadManager && this.medias && (now - this.lastPreloadCheck) > this.preloadCheckInterval) {
      // Get current layout for grid-based preloading
      const layout = this.viewportManager.calculateLayout(ELEMENT_CONFIG)
      
      // Preload all visible elements immediately
      this.preloadManager.preloadVisibleAndNear(
        this.medias, 
        this.viewportManager.getViewport(),
        screenState
      )
      
      // Grid-based predictive preloading
      this.preloadManager.preloadByGridPosition(
        scrollState,
        layout,
        this.medias
      )
      
      // Also trigger directional preloading when actively scrolling
      if (this.scrollManager.isActivelyScrolling()) {
        const centerBookIndex = Math.floor(this.medias.length / 2)
        this.preloadManager.preloadAround(centerBookIndex, scrollState.direction, this.medias.length)
      }
      
      this.lastPreloadCheck = now
    }

    // Calculate scroll velocity for post-processing effect
    const scrollVelocity = this.scrollManager.getVelocity()
    const strengthX = scrollVelocity.x / screenState.width * ANIMATION_CONFIG.STRENGTH_MULTIPLIER
    const strengthY = scrollVelocity.y / screenState.height * ANIMATION_CONFIG.STRENGTH_MULTIPLIER
    const totalStrength = Math.sqrt(strengthX * strengthX + strengthY * strengthY)
    
    this.pass.uniforms.uStrength.value = totalStrength

    // Render scene
    this.post.render({
      scene: this.scene,
      camera: this.camera
    })

    // Update debug panel if enabled
    if (this.debugPanel) {
      this.debugPanel.updateState({
        scroll: scrollState,
        mouse: this.mouseManager.getState(),
        viewport: this.viewportManager.getDebugInfo(),
        preload: this.preloadManager.getDebugInfo(),
        performance: {
          totalStrength: totalStrength,
          mediaCount: this.medias ? this.medias.length : 0
        }
      })
    }

    window.requestAnimationFrame(this.update.bind(this))
  }

  /**
   * Dispose of all resources and clean up
   */
  dispose() {
    // Dispose of managers
    if (this.scrollManager) {
      this.scrollManager.dispose()
    }
    
    if (this.mouseManager) {
      this.mouseManager.dispose()
    }
    
    if (this.viewportManager) {
      this.viewportManager.dispose()
    }
    
    if (this.preloadManager) {
      this.preloadManager.dispose()
    }
    
    // Dispose of debug panel
    if (this.debugPanel) {
      this.debugPanel.dispose()
    }
    
    // Dispose of media elements
    if (this.medias) {
      this.medias.forEach(media => media.dispose())
    }
    
    debugLogger.info('App', 'Application disposed successfully')
  }
}