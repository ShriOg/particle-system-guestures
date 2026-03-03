/* ========================================
   FICTIONAL PHYSICS ENGINE - RENDER ENGINE
   Core rendering system with effects
======================================== */

'use strict';

class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        
        this.width = 0;
        this.height = 0;
        this.centerX = 0;
        this.centerY = 0;

        // Mouse tracking for parallax
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseOffsetX = 0;
        this.mouseOffsetY = 0;

        // Formation rotation
        this.rotationAngle = 0;

        // Breathing glow state
        this.breathingPhase = 0;
        this.breathingValue = 0;

        // Shockwave effect state
        this.shockwaves = [];

        // Canvas scale pulse state
        this.scalePulse = 1;
        this.scalePulseStart = 0;
        this.scalePulseActive = false;

        // Welcome text positions cache
        this.welcomePositions = null;

        this.resize();
        this.initParticles();
        this.setupMouseTracking();
    }

    /**
     * Handle canvas resize
     */
    resize() {
        const displayWidth = window.innerWidth;
        const displayHeight = window.innerHeight;
        
        this.canvas.width = displayWidth;
        this.canvas.height = displayHeight;
        
        this.width = displayWidth;
        this.height = displayHeight;
        this.centerX = Math.floor(this.width / 2);
        this.centerY = Math.floor(this.height / 2);

        this.welcomePositions = null;
        this.ctx.imageSmoothingEnabled = true;
    }

    /**
     * Setup mouse tracking for parallax
     */
    setupMouseTracking() {
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            // Calculate offset from center
            this.mouseOffsetX = (this.mouseX - this.centerX);
            this.mouseOffsetY = (this.mouseY - this.centerY);
        });

        // Touch support
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.mouseX = e.touches[0].clientX;
                this.mouseY = e.touches[0].clientY;
                this.mouseOffsetX = (this.mouseX - this.centerX);
                this.mouseOffsetY = (this.mouseY - this.centerY);
            }
        });
    }

    /**
     * Initialize all particles with depth
     */
    initParticles() {
        this.particles = [];
        
        for (let i = 0; i < CONFIG.particles.count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * Math.max(this.width, this.height) * 0.6;
            const x = this.centerX + Math.cos(angle) * distance;
            const y = this.centerY + Math.sin(angle) * distance;
            this.particles.push(new Particle(x, y, i));
        }
    }

    /**
     * Generate welcome text positions
     */
    generateWelcomePositions() {
        this.welcomePositions = Utils.generateTextPositions(
            CONFIG.welcome.text,
            CONFIG.welcome.fontSize,
            CONFIG.welcome.fontFamily,
            CONFIG.particles.count,
            this.width,
            this.height
        );
        return this.welcomePositions;
    }

    /**
     * Update breathing glow animation
     */
    updateBreathing(time) {
        this.breathingPhase = time * CONFIG.physics.breathingSpeed;
        this.breathingValue = (Math.sin(this.breathingPhase) + 1) / 2; // 0-1
    }

    /**
     * Update formation rotation
     */
    updateRotation(deltaTime, isActive) {
        const speed = CONFIG.rotation.baseSpeed * 
            (isActive ? CONFIG.rotation.activeMultiplier : 1);
        this.rotationAngle += speed * deltaTime;
        
        // Keep angle in reasonable range
        if (this.rotationAngle > Math.PI * 2) {
            this.rotationAngle -= Math.PI * 2;
        }
    }

    /**
     * Update all particles in idle mode
     */
    updateIdle(time) {
        this.updateBreathing(time);
        const len = this.particles.length;
        for (let i = 0; i < len; i++) {
            this.particles[i].updateIdle(this.width, this.height, time, this.breathingValue);
        }
    }

    /**
     * Update all particles in formation (smooth interpolation)
     */
    updateFormationSmooth(time) {
        const len = this.particles.length;
        for (let i = 0; i < len; i++) {
            this.particles[i].updateFormationSmooth(time, this.rotationAngle, this.centerX, this.centerY);
        }
    }

    /**
     * Update all particles dissolving from formation
     */
    updateDissolve(progress, time) {
        const len = this.particles.length;
        for (let i = 0; i < len; i++) {
            this.particles[i].updateDissolve(progress, time);
        }
    }

    /**
     * Update particle colors
     */
    updateColors(toActive, progress) {
        const len = this.particles.length;
        for (let i = 0; i < len; i++) {
            this.particles[i].updateColor(toActive, progress);
        }
    }

    /**
     * Set formation targets for all particles
     */
    setFormation(formationType) {
        let positions;

        if (formationType === 'welcome') {
            const textPos = this.generateWelcomePositions();
            positions = formationManager.generate('welcome', this.particles.length, 
                this.centerX, this.centerY, 0, textPos);
        } else if (formationManager.hasFormation(formationType)) {
            const radius = Math.min(this.width, this.height) * 0.35;
            positions = formationManager.generate(formationType, this.particles.length,
                this.centerX, this.centerY, radius);
        }

        if (positions && positions.length > 0) {
            const len = this.particles.length;
            for (let i = 0; i < len; i++) {
                const pos = positions[i] || positions[positions.length - 1];
                this.particles[i].setTarget(pos.x, pos.y, pos.z);
            }
        }
    }

    /**
     * Freeze all particles (impact effect)
     */
    freezeParticles(duration) {
        const len = this.particles.length;
        for (let i = 0; i < len; i++) {
            this.particles[i].freeze(duration);
        }
    }

    /**
     * Trigger brightness pulse on all particles
     */
    pulseParticles(intensity) {
        const len = this.particles.length;
        for (let i = 0; i < len; i++) {
            this.particles[i].pulseAlpha(intensity);
        }
    }

    /**
     * Trigger radial shockwave effect
     */
    triggerShockwave() {
        this.shockwaves.push({
            x: this.centerX,
            y: this.centerY,
            radius: 0,
            alpha: 0.6,
            startTime: performance.now()
        });
    }

    /**
     * Update shockwave effects
     */
    updateShockwaves(time) {
        const toRemove = [];
        
        for (let i = 0; i < this.shockwaves.length; i++) {
            const sw = this.shockwaves[i];
            const elapsed = time - sw.startTime;
            const progress = elapsed / CONFIG.visuals.shockwaveDuration;
            
            if (progress >= 1) {
                toRemove.push(i);
                continue;
            }
            
            sw.radius = progress * CONFIG.visuals.shockwaveMaxRadius;
            sw.alpha = 0.6 * (1 - Utils.easing.easeOutCubic(progress));
        }
        
        // Remove completed shockwaves (reverse order)
        for (let i = toRemove.length - 1; i >= 0; i--) {
            this.shockwaves.splice(toRemove[i], 1);
        }
    }

    /**
     * Trigger canvas scale pulse
     */
    triggerScalePulse() {
        this.scalePulseActive = true;
        this.scalePulseStart = performance.now();
    }

    /**
     * Update canvas scale pulse
     */
    updateScalePulse(time) {
        if (!this.scalePulseActive) {
            this.scalePulse = 1;
            return;
        }
        
        const elapsed = time - this.scalePulseStart;
        const progress = elapsed / CONFIG.visuals.pulseDuration;
        
        if (progress >= 1) {
            this.scalePulseActive = false;
            this.scalePulse = 1;
            return;
        }
        
        // Pulse: 1 -> 1.02 -> 1
        const pulseProgress = Math.sin(progress * Math.PI);
        this.scalePulse = 1 + CONFIG.visuals.pulseScale * pulseProgress;
    }

    /**
     * Draw shockwave effects
     */
    drawShockwaves() {
        for (const sw of this.shockwaves) {
            this.ctx.beginPath();
            this.ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(180, 100, 255, ${sw.alpha})`;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Inner glow
            this.ctx.beginPath();
            this.ctx.arc(sw.x, sw.y, sw.radius * 0.95, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(255, 200, 255, ${sw.alpha * 0.5})`;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
    }

    /**
     * Sort particles by depth (back to front)
     */
    sortByDepth() {
        this.particles.sort((a, b) => a.z - b.z);
    }

    /**
     * Draw all particles with effects
     */
    draw(glowIntensity, shouldSort = true) {
        const time = performance.now();
        
        // Update effects
        this.updateShockwaves(time);
        this.updateScalePulse(time);
        
        // Apply canvas scale pulse
        if (this.scalePulse !== 1) {
            this.ctx.save();
            this.ctx.translate(this.centerX, this.centerY);
            this.ctx.scale(this.scalePulse, this.scalePulse);
            this.ctx.translate(-this.centerX, -this.centerY);
        }
        
        // Motion trail effect
        this.ctx.fillStyle = `rgba(0, 0, 0, ${CONFIG.visuals.trailOpacity})`;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Sort by depth for proper layering (only occasionally for performance)
        if (shouldSort) {
            this.sortByDepth();
        }
        
        // Draw particles with parallax
        const len = this.particles.length;
        for (let i = 0; i < len; i++) {
            this.particles[i].draw(this.ctx, glowIntensity, this.mouseOffsetX, this.mouseOffsetY);
        }
        
        // Draw shockwaves on top
        this.drawShockwaves();
        
        // Reset shadow and transform
        this.ctx.shadowBlur = 0;
        this.ctx.shadowColor = 'transparent';
        
        if (this.scalePulse !== 1) {
            this.ctx.restore();
        }
    }

    /**
     * Clear canvas
     */
    clear() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
}
