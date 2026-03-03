/* ========================================
   FICTIONAL PHYSICS ENGINE - MAIN ENGINE
   Cinematic particle system with depth and effects
======================================== */

'use strict';

class FictionalPhysicsEngine {
    constructor() {
        // DOM elements
        this.canvas = document.getElementById('canvas');
        this.video = document.getElementById('video');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.gestureIndicator = document.getElementById('gestureIndicator');
        this.indicatorText = document.querySelector('.indicatorText');
        this.helpPanel = document.getElementById('helpPanel');

        // Core systems
        this.particleSystem = null;
        this.handDetection = null;
        this.transformationController = null;

        // Animation state
        this.lastTime = 0;
        this.isRunning = false;
        this.frameCount = 0;
        this.sortFrame = 0;

        // Initialize
        this.init();
    }

    /**
     * Initialize all engine systems
     */
    async init() {
        // Set up particle system (render engine)
        this.particleSystem = new ParticleSystem(this.canvas);

        // Set up transformation controller (transition manager)
        this.transformationController = new TransformationController(
            this.particleSystem,
            (mode, displayName) => this.updateUI(mode, displayName)
        );

        // Set up hand detection (gesture manager)
        this.handDetection = new HandDetection(
            this.video,
            (gesture) => this.transformationController.handleGesture(gesture)
        );

        // Set up event listeners
        this.setupEventListeners();

        // Initialize hand detection (async)
        const handDetectionReady = await this.handDetection.init();

        // Hide loading overlay with fade
        setTimeout(() => {
            this.loadingOverlay.classList.add('hidden');
        }, 500);

        // Start welcome sequence
        setTimeout(() => {
            this.transformationController.startWelcome();
        }, 600);

        // Show UI after welcome sequence starts dissolving
        setTimeout(() => {
            this.gestureIndicator.classList.add('visible');
            if (this.helpPanel) this.helpPanel.classList.add('visible');
        }, 5500);

        // Start animation loop
        this.isRunning = true;
        this.lastTime = performance.now();
        this.animate();
    }

    /**
     * Set up window event listeners
     */
    setupEventListeners() {
        // Handle window resize with debounce
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.handleResize(), 100);
        });

        // Handle visibility change (pause when hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });

        // Keyboard controls
        window.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    /**
     * Handle window resize
     */
    handleResize() {
        this.particleSystem.resize();

        const currentMode = this.transformationController.getCurrentMode();
        if (currentMode !== 'idle') {
            this.particleSystem.setFormation(currentMode);
        }
    }

    /**
     * Keyboard controls for demo mode
     */
    handleKeyboard(e) {
        if (!this.transformationController.isWelcomeComplete()) return;

        const keyMap = {
            '1': 'openPalm',
            '2': 'fist',
            '3': 'twoFingers',
            '4': 'prayer',
            '0': null,
            'Escape': null
        };

        if (keyMap.hasOwnProperty(e.key)) {
            this.transformationController.handleGesture(keyMap[e.key]);
        }
    }

    /**
     * Update UI elements
     */
    updateUI(mode, displayName) {
        if (this.indicatorText) {
            this.indicatorText.textContent = displayName;
        }

        if (this.gestureIndicator) {
            if (mode !== 'idle') {
                this.gestureIndicator.classList.add('active');
            } else {
                this.gestureIndicator.classList.remove('active');
            }
        }
    }

    /**
     * Main animation loop (optimized single loop)
     */
    animate() {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        const deltaTime = Math.min(currentTime - this.lastTime, 50);
        this.lastTime = currentTime;

        // Update transition/state systems
        this.transformationController.update(currentTime, deltaTime);

        // Determine if we should sort by depth (every 10 frames for performance)
        this.sortFrame++;
        const shouldSort = this.sortFrame % 10 === 0;

        // Render with glow intensity and optional depth sort
        const glowIntensity = this.transformationController.getGlowIntensity();
        this.particleSystem.draw(glowIntensity, shouldSort);

        this.frameCount++;

        requestAnimationFrame(() => this.animate());
    }

    /**
     * Pause engine
     */
    pause() {
        this.isRunning = false;
    }

    /**
     * Resume engine
     */
    resume() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            this.animate();
        }
    }

    // ========================================
    // PUBLIC API - Extensible interface
    // ========================================

    /**
     * Add custom formation pattern
     * @param {string} name - Formation identifier
     * @param {Function} generator - (count, cx, cy, radius) => [{x, y, z}]
     */
    addFormation(name, generator) {
        formationManager.addFormation(name, generator);
    }

    /**
     * Get available formations
     */
    getFormations() {
        return formationManager.getFormationNames();
    }

    /**
     * Get engine statistics
     */
    getStats() {
        return {
            particleCount: this.particleSystem.particles.length,
            currentMode: this.transformationController.getCurrentMode(),
            isActive: this.transformationController.getIsActive(),
            fps: this.frameCount,
            shockwaveCount: this.particleSystem.shockwaves.length
        };
    }

    /**
     * Reset frame counter (for FPS measurement)
     */
    resetFrameCount() {
        this.frameCount = 0;
    }
}

// ========================================
// BOOTSTRAP
// ========================================

window.addEventListener('DOMContentLoaded', () => {
    // Create global engine instance
    window.fictionalPhysics = new FictionalPhysicsEngine();

    // Log keyboard controls
    console.info(
        '%cFictionalPhysics Engine',
        'color: #8a2be2; font-size: 14px; font-weight: bold;'
    );
    console.info(
        '%cKeyboard Controls: 1=Ring, 2=Sphere, 3=Infinity, 4=Mandala, 0/Esc=Idle',
        'color: #666; font-size: 11px;'
    );
});
