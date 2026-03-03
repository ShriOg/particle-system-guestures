/* ========================================
   FICTIONAL PHYSICS ENGINE - PARTICLE CLASS
   Individual particle with depth, physics, and rendering
======================================== */

'use strict';

class Particle {
    constructor(x, y, index) {
        this.index = index;

        // Position (x, y, z for depth)
        this.x = x;
        this.y = y;
        this.z = Math.random(); // Depth layer 0-1 (0=back, 1=front)

        // Target position for formations
        this.targetX = x;
        this.targetY = y;
        this.targetZ = this.z;

        // Home/idle position (updates during idle)
        this.homeX = x;
        this.homeY = y;

        // Velocity
        this.vx = Utils.randomRange(-CONFIG.particles.baseSpeed, CONFIG.particles.baseSpeed);
        this.vy = Utils.randomRange(-CONFIG.particles.baseSpeed, CONFIG.particles.baseSpeed);

        // Velocity frozen state (for impact effect)
        this.frozen = false;
        this.freezeEndTime = 0;

        // Visual properties
        this.baseRadius = Utils.randomRange(CONFIG.particles.minRadius, CONFIG.particles.maxRadius);
        this.radius = this.baseRadius;
        this.baseAlpha = Utils.randomRange(0.5, 0.95);
        this.alpha = this.baseAlpha;

        // Color (interpolation factor)
        this.colorT = Math.random();
        this.hsl = Utils.lerpColor(
            CONFIG.colors.idle.primary,
            CONFIG.colors.idle.secondary,
            this.colorT
        );

        // Animation phase for organic movement
        this.phase = Math.random() * Math.PI * 2;
        this.frequency = Utils.randomRange(0.8, 1.2);
        this.orbitAngle = Math.random() * Math.PI * 2;

        // State tracking
        this.transitionProgress = 0;
        this.inFormation = false;
    }

    /**
     * Get depth-scaled radius
     */
    getScaledRadius() {
        const scale = CONFIG.depth.radiusScale.min + 
            this.z * (CONFIG.depth.radiusScale.max - CONFIG.depth.radiusScale.min);
        return this.radius * scale;
    }

    /**
     * Get depth-scaled alpha (further = dimmer)
     */
    getScaledAlpha() {
        const depthFade = 0.5 + this.z * 0.5;
        return this.alpha * depthFade;
    }

    /**
     * Get depth-scaled velocity multiplier
     */
    getVelocityScale() {
        return CONFIG.depth.speedScale.min + 
            this.z * (CONFIG.depth.speedScale.max - CONFIG.depth.speedScale.min);
    }

    /**
     * Set target position for formation
     */
    setTarget(x, y, z = null) {
        this.targetX = x;
        this.targetY = y;
        if (z !== null) this.targetZ = z;
    }

    /**
     * Freeze velocity (impact effect)
     */
    freeze(duration) {
        this.frozen = true;
        this.freezeEndTime = performance.now() + duration;
    }

    /**
     * Check and update freeze state
     */
    updateFreezeState(time) {
        if (this.frozen && time >= this.freezeEndTime) {
            this.frozen = false;
        }
    }

    /**
     * Apply parallax offset based on mouse position
     */
    applyParallax(mouseOffsetX, mouseOffsetY) {
        const parallax = CONFIG.depth.parallaxStrength * this.z;
        return {
            x: this.x + mouseOffsetX * parallax,
            y: this.y + mouseOffsetY * parallax
        };
    }

    /**
     * Update particle in idle floating mode (cinematic)
     */
    updateIdle(width, height, time, breathing) {
        this.updateFreezeState(time);
        if (this.frozen) return;

        this.inFormation = false;
        const velScale = this.getVelocityScale();

        // Ambient noise field (Perlin-like behavior using sin)
        const noiseX = Math.sin(this.x * CONFIG.physics.noiseScale + time * 0.0005 + this.phase);
        const noiseY = Math.cos(this.y * CONFIG.physics.noiseScale + time * 0.0006 + this.phase * 1.3);

        // Organic floating with depth-based orbit drift
        const timeScale = time * CONFIG.physics.orbitSpeed * this.frequency;
        this.orbitAngle += CONFIG.physics.orbitSpeed * velScale;

        // Apply forces
        this.vx += (Math.sin(timeScale + this.phase) * CONFIG.physics.idleForce +
                    noiseX * CONFIG.physics.noiseStrength * 0.01) * velScale;
        this.vy += (Math.cos(timeScale * 1.1 + this.phase * 1.3) * CONFIG.physics.idleForce +
                    noiseY * CONFIG.physics.noiseStrength * 0.01) * velScale;

        // Apply friction
        this.vx *= CONFIG.physics.friction;
        this.vy *= CONFIG.physics.friction;

        // Clamp velocity (scaled by depth)
        const maxSpeed = CONFIG.particles.maxSpeed * velScale;
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > maxSpeed) {
            const scale = maxSpeed / speed;
            this.vx *= scale;
            this.vy *= scale;
        }

        // Update position
        this.x += this.vx;
        this.y += this.vy;

        // Soft boundary wrapping
        const margin = 50;
        if (this.x < -margin) this.x = width + margin;
        if (this.x > width + margin) this.x = -margin;
        if (this.y < -margin) this.y = height + margin;
        if (this.y > height + margin) this.y = -margin;

        // Update home position for smooth transitions
        this.homeX = this.x;
        this.homeY = this.y;

        // Breathing glow effect
        this.radius = this.baseRadius * (1 + breathing * CONFIG.physics.breathingIntensity);
        this.alpha = this.baseAlpha * (0.85 + breathing * 0.15);
    }

    /**
     * Update particle with smooth interpolation toward target
     */
    updateFormationSmooth(time, rotationAngle, cx, cy) {
        this.updateFreezeState(time);
        if (this.frozen) return;

        this.inFormation = true;
        const speed = CONFIG.transitions.interpolationSpeed;

        // Apply rotation to target position around center
        const relX = this.targetX - cx;
        const relY = this.targetY - cy;
        const cos = Math.cos(rotationAngle);
        const sin = Math.sin(rotationAngle);
        const rotatedX = cx + relX * cos - relY * sin;
        const rotatedY = cy + relX * sin + relY * cos;

        // Smooth interpolation (no snapping)
        this.x += (rotatedX - this.x) * speed;
        this.y += (rotatedY - this.y) * speed;
        this.z += (this.targetZ - this.z) * speed * 0.5;

        // Subtle vibration for energy feel
        const vibration = 0.5;
        this.x += Math.sin(time * 0.02 + this.phase) * vibration;
        this.y += Math.cos(time * 0.02 + this.phase * 1.2) * vibration;

        // Update home for transition tracking
        this.homeX = this.x;
        this.homeY = this.y;

        // Scale up slightly during formation
        this.radius = this.baseRadius * 1.2;
        this.alpha = Utils.clamp(this.baseAlpha + 0.15, 0, 1);
    }

    /**
     * Update particle dissolving from formation
     */
    updateDissolve(progress, time) {
        this.updateFreezeState(time);
        if (this.frozen) return;

        const easedProgress = Utils.easing.easeOutCubic(progress);

        // Move from current position toward a random drift
        const driftX = Math.sin(this.phase) * 120 * easedProgress;
        const driftY = Math.cos(this.phase) * 120 * easedProgress;

        // Blend between formation position and drifted position
        this.x = Utils.lerp(this.targetX, this.targetX + driftX, easedProgress);
        this.y = Utils.lerp(this.targetY, this.targetY + driftY, easedProgress);

        // Update home to current for smooth idle transition
        this.homeX = this.x;
        this.homeY = this.y;

        // Visual fade during dissolve
        this.alpha = Utils.lerp(this.baseAlpha + 0.2, this.baseAlpha, easedProgress);
        this.radius = Utils.lerp(this.baseRadius * 1.3, this.baseRadius, easedProgress);

        this.inFormation = false;
    }

    /**
     * Trigger brightness pulse (impact effect)
     */
    pulseAlpha(intensity) {
        this.alpha = Utils.clamp(this.baseAlpha + intensity * 0.4, 0, 1);
    }

    /**
     * Update color based on active state
     */
    updateColor(toActive, progress) {
        const fromPalette = toActive ? CONFIG.colors.idle : CONFIG.colors.active;
        const toPalette = toActive ? CONFIG.colors.active : CONFIG.colors.idle;

        const fromColor = Utils.lerpColor(fromPalette.primary, fromPalette.secondary, this.colorT);
        const toColor = Utils.lerpColor(toPalette.primary, toPalette.secondary, this.colorT);

        this.hsl = Utils.lerpColor(fromColor, toColor, progress);
    }

    /**
     * Draw particle to canvas (optimized with depth)
     */
    draw(ctx, glowIntensity, mouseOffsetX = 0, mouseOffsetY = 0) {
        // Apply parallax
        const pos = this.applyParallax(mouseOffsetX, mouseOffsetY);
        const scaledRadius = this.getScaledRadius();
        const scaledAlpha = this.getScaledAlpha();

        // Calculate glow (limited to 8 for performance)
        const glow = CONFIG.visuals.minGlow + glowIntensity * (CONFIG.visuals.maxGlow - CONFIG.visuals.minGlow);

        // Pre-calculate colors
        const colorStr = Utils.hslToString(this.hsl, scaledAlpha);
        const glowColorStr = Utils.hslToString(this.hsl, scaledAlpha * 0.5);

        // Set shadow
        ctx.shadowBlur = Math.min(glow * (0.5 + this.z * 0.5), 8);
        ctx.shadowColor = glowColorStr;

        // Draw particle
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, scaledRadius, 0, Math.PI * 2);
        ctx.fillStyle = colorStr;
        ctx.fill();
    }
}
