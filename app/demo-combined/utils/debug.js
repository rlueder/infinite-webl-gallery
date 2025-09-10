/**
 * Debug utilities for monitoring and debugging the gallery application
 */

export class DebugLogger {
  constructor(enabled = false) {
    this.enabled = enabled
    this.logs = []
    this.maxLogs = 1000
    this.prefix = '[Gallery]'
  }

  /**
   * Enable or disable debug logging
   * @param {boolean} enabled - Whether to enable logging
   */
  setEnabled(enabled) {
    this.enabled = enabled
  }

  /**
   * Log a message with timestamp
   * @param {string} level - Log level (info, warn, error, debug)
   * @param {string} category - Category of the log
   * @param {string} message - Message to log
   * @param {*} data - Additional data to log
   */
  log(level, category, message, data = null) {
    if (!this.enabled) return

    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      category,
      message,
      data
    }

    this.logs.push(logEntry)

    // Keep logs within limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Console output
    const consoleMessage = `${this.prefix} [${level.toUpperCase()}] [${category}] ${message}`
    
    switch (level) {
      case 'error':
        console.error(consoleMessage, data || '')
        break
      case 'warn':
        console.warn(consoleMessage, data || '')
        break
      case 'info':
        console.info(consoleMessage, data || '')
        break
      case 'debug':
      default:
        console.log(consoleMessage, data || '')
        break
    }
  }

  info(category, message, data) { this.log('info', category, message, data) }
  warn(category, message, data) { this.log('warn', category, message, data) }
  error(category, message, data) { this.log('error', category, message, data) }
  debug(category, message, data) { this.log('debug', category, message, data) }

  /**
   * Get recent logs
   * @param {number} count - Number of recent logs to return
   * @param {string} level - Filter by log level
   * @param {string} category - Filter by category
   * @returns {Array} Filtered log entries
   */
  getLogs(count = 50, level = null, category = null) {
    let filteredLogs = this.logs

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level)
    }

    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category)
    }

    return filteredLogs.slice(-count)
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = []
  }
}

export class DebugPanel {
  constructor(logger) {
    this.logger = logger
    this.panel = null
    this.isVisible = false
    this.updateInterval = null
    this.stats = {
      fps: 0,
      frameTime: 0,
      lastFrameTime: performance.now()
    }
    
    this.createPanel()
  }

  /**
   * Create debug panel HTML structure
   */
  createPanel() {
    this.panel = document.createElement('div')
    this.panel.id = 'debug-panel'
    this.panel.innerHTML = `
      <div class="debug-header">
        <h3>Gallery Debug Panel</h3>
        <button id="debug-toggle">Toggle</button>
        <button id="debug-clear">Clear Logs</button>
      </div>
      <div class="debug-content">
        <div class="debug-section">
          <h4>Performance</h4>
          <div id="debug-performance">
            <div>FPS: <span id="debug-fps">0</span></div>
            <div>Frame Time: <span id="debug-frame-time">0</span>ms</div>
          </div>
        </div>
        <div class="debug-section">
          <h4>State</h4>
          <div id="debug-state"></div>
        </div>
        <div class="debug-section">
          <h4>Recent Logs</h4>
          <div id="debug-logs"></div>
        </div>
      </div>
    `

    this.addStyles()
    document.body.appendChild(this.panel)
    this.bindEvents()
  }

  /**
   * Add CSS styles for the debug panel
   */
  addStyles() {
    if (document.getElementById('debug-panel-styles')) return

    const style = document.createElement('style')
    style.id = 'debug-panel-styles'
    style.textContent = `
      #debug-panel {
        position: fixed;
        top: 10px;
        right: 10px;
        width: 350px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        font-family: monospace;
        font-size: 12px;
        border-radius: 5px;
        padding: 10px;
        z-index: 10000;
        max-height: 80vh;
        overflow-y: auto;
        display: none;
      }
      
      #debug-panel.visible {
        display: block;
      }
      
      .debug-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        border-bottom: 1px solid #333;
        padding-bottom: 5px;
      }
      
      .debug-header h3 {
        margin: 0;
        font-size: 14px;
      }
      
      .debug-header button {
        background: #333;
        color: white;
        border: none;
        padding: 3px 8px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 10px;
        margin-left: 5px;
      }
      
      .debug-header button:hover {
        background: #555;
      }
      
      .debug-section {
        margin-bottom: 15px;
      }
      
      .debug-section h4 {
        margin: 0 0 5px 0;
        color: #ccc;
        font-size: 12px;
      }
      
      #debug-performance div,
      #debug-state div,
      #debug-logs div {
        margin: 2px 0;
        padding: 2px 0;
      }
      
      #debug-logs {
        max-height: 200px;
        overflow-y: auto;
        font-size: 11px;
      }
      
      .debug-log-entry {
        margin: 1px 0;
        padding: 2px 5px;
        border-radius: 2px;
      }
      
      .debug-log-error { background: rgba(255, 0, 0, 0.2); }
      .debug-log-warn { background: rgba(255, 255, 0, 0.2); }
      .debug-log-info { background: rgba(0, 0, 255, 0.2); }
      .debug-log-debug { background: rgba(128, 128, 128, 0.2); }
      
      .debug-key {
        color: #87ceeb;
        font-weight: bold;
      }
      
      .debug-value {
        color: #98fb98;
      }
    `
    
    document.head.appendChild(style)
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    const toggleBtn = this.panel.querySelector('#debug-toggle')
    const clearBtn = this.panel.querySelector('#debug-clear')

    toggleBtn.addEventListener('click', () => {
      this.toggle()
    })

    clearBtn.addEventListener('click', () => {
      this.logger.clearLogs()
      this.updateLogs()
    })

    // Keyboard shortcut (Ctrl/Cmd + D)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        this.toggle()
      }
    })
  }

  /**
   * Show the debug panel
   */
  show() {
    this.isVisible = true
    this.panel.classList.add('visible')
    this.startUpdating()
  }

  /**
   * Hide the debug panel
   */
  hide() {
    this.isVisible = false
    this.panel.classList.remove('visible')
    this.stopUpdating()
  }

  /**
   * Toggle debug panel visibility
   */
  toggle() {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }

  /**
   * Start periodic updates
   */
  startUpdating() {
    if (this.updateInterval) return
    
    this.updateInterval = setInterval(() => {
      this.updatePerformance()
      this.updateLogs()
    }, 250)
  }

  /**
   * Stop periodic updates
   */
  stopUpdating() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
  }

  /**
   * Update performance metrics
   */
  updatePerformance() {
    const now = performance.now()
    const deltaTime = now - this.stats.lastFrameTime
    
    this.stats.frameTime = deltaTime
    this.stats.fps = Math.round(1000 / deltaTime)
    this.stats.lastFrameTime = now

    const fpsElement = this.panel.querySelector('#debug-fps')
    const frameTimeElement = this.panel.querySelector('#debug-frame-time')
    
    if (fpsElement) fpsElement.textContent = this.stats.fps
    if (frameTimeElement) frameTimeElement.textContent = this.stats.frameTime.toFixed(1)
  }

  /**
   * Update state display
   * @param {Object} state - Current application state
   */
  updateState(state) {
    if (!this.isVisible) return

    const stateElement = this.panel.querySelector('#debug-state')
    if (!stateElement || !state) return

    const formatValue = (value) => {
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          return `[${value.length}]`
        }
        return JSON.stringify(value, null, 2)
      }
      return String(value)
    }

    const createStateHTML = (obj, depth = 0) => {
      let html = ''
      const indent = '  '.repeat(depth)
      
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null && depth < 2) {
          html += `${indent}<span class="debug-key">${key}:</span><br>`
          html += createStateHTML(value, depth + 1)
        } else {
          html += `${indent}<span class="debug-key">${key}:</span> <span class="debug-value">${formatValue(value)}</span><br>`
        }
      }
      
      return html
    }

    // Add memory information to state
    const stateWithMemory = {
      ...state,
      memory: this.getMemoryInfo()
    }

    stateElement.innerHTML = createStateHTML(stateWithMemory)
  }

  /**
   * Get memory information from performance API
   * @returns {Object} Memory information
   */
  getMemoryInfo() {
    if (!performance.memory) {
      return { error: 'Memory API not available' }
    }

    const memory = performance.memory
    const formatBytes = (bytes) => {
      const mb = bytes / (1024 * 1024)
      return `${mb.toFixed(1)} MB`
    }

    return {
      used: formatBytes(memory.usedJSHeapSize),
      total: formatBytes(memory.totalJSHeapSize),
      limit: formatBytes(memory.jsHeapSizeLimit),
      usage: `${((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(1)}%`
    }
  }

  /**
   * Update logs display
   */
  updateLogs() {
    if (!this.isVisible) return

    const logsElement = this.panel.querySelector('#debug-logs')
    if (!logsElement) return

    const logs = this.logger.getLogs(20)
    
    logsElement.innerHTML = logs.map(log => {
      const time = new Date(log.timestamp).toLocaleTimeString()
      return `<div class="debug-log-entry debug-log-${log.level}">
        [${time}] [${log.category}] ${log.message}
      </div>`
    }).join('')

    // Auto-scroll to bottom
    logsElement.scrollTop = logsElement.scrollHeight
  }

  /**
   * Dispose of resources
   */
  dispose() {
    this.stopUpdating()
    
    if (this.panel) {
      this.panel.remove()
    }
    
    const styles = document.getElementById('debug-panel-styles')
    if (styles) {
      styles.remove()
    }
  }
}

// Create global debug instance
export const debugLogger = new DebugLogger(false) // Start disabled by default