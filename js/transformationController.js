/* ========================================
   FICTIONAL PHYSICS ENGINE - TRANSITION MANAGER
   Cinematic state transitions with impact effects
======================================== */

'use strict';

class TransformationController {
    constructor(particleSystem, onModeChange) {
        this.particleSystem = particleSystem;
        this.onModeChange = onModeChange || (() => {});

        // State management
        this.currentMode = 'idle';
        this.targetMode = 'idle';
        this.previousMode = 'idle';
        this.isActive = false;

        // Transition progress (smooth interpolation replaces rigid progress)
        this.transitionProgress = 0;
        this.transitionDirection = 0;

        // Welcome sequence state
        this.welcomePhase = 'forming';
        this.welcomeStartTime = 0;
        this.welcomeComplete = false;

        // Intensity for visual effects
        this.intensity = 0;
        this.targetIntensity = 0;

        // Impact effect state
        this.impactPending = false;
        this.lastGestureTime = 0;

        // Gesture to formation mapping
        this.gestureMap = CONFIG.gestures;

        // Depth sorting counter (don't sort every frame)
        this.sortCounter = 0;
    }

    /**
     * Start the welcome sequence
     */
    startWelcome() {
        this.welcomePhase = 'forming';
        this.welcomeStartTime = performance.now();
        this.targetMode = 'welcome';
        this.transitionDirection = 1;
        this.transitionProgress = 0;

        this.particleSystem.setFormation('welcome');
        this.onModeChange('welcome', CONFIG.modeNames.welcome);
    }

    /**
     * Handle gesture detection with impact effects
     */
    handleGesture(gesture) {
        if (!this.welcomeComplete) return;

        const newMode = gesture ? this.gestureMap[gesture] : 'idle';

        if (newMode && newMode !== this.targetMode) {
            this.previousMode = this.currentMode;
            this.targetMode = newMode;

            if (newMode === 'idle') {
                // Dissolve to idle
                this.transitionDirection = -1;
                this.isActive = false;
            } else {
                // Trigger impact effects
                this.triggerImpactEffects();

                // Form new pattern
                this.particleSystem.setFormation(newMode);
                this.transitionDirection = 1;
                this.isActive = true;

                // Don't reset progress - allows smooth formation switching
                if (this.currentMode === 'idle') {
                    this.transitionProgress = 0;
                }
            }

            this.onModeChange(newMode, CONFIG.modeNames[newMode] || 'UNKNOWN');
        }
    }

    /**
     * Trigger impact effects on gesture detection
     */
    triggerImpactEffects() {
        const now = performance.now();
        
        // Prevent rapid-fire effects
        if (now - this.lastGestureTime < 300) return;
        this.lastGestureTime = now;

        // 1. Freeze particles momentarily
        this.particleSystem.freezeParticles(CONFIG.transitions.impactFreezeDuration);

        // 2. Brightness pulse
        this.particleSystem.pulseParticles(1);

        // 3. Trigger shockwave
        this.particleSystem.triggerShockwave();

        // 4. Canvas scale pulse
        this.particleSystem.triggerScalePulse();

        this.impactPending = false;
    }

    /**
     * Update transformation state
     */
    update(time, deltaTime) {
        // Handle welcome sequence
        if (!this.welcomeComplete) {
            this.updateWelcomeSequence(time, deltaTime);
            return;
        }

        // Normal operation with smooth interpolation
        this.updateNormalTransition(time, deltaTime);
    }

    /**
     * Update welcome sequence phases
     */
    updateWelcomeSequence(time, deltaTime) {
        const transitionSpeed = deltaTime / CONFIG.transitions.duration;

        switch (this.welcomePhase) {
            case 'forming':
                this.transitionProgress += transitionSpeed;
                
                if (this.transitionProgress >= 1) {
                    this.transitionProgress = 1;
                    this.welcomePhase = 'holding';
                    this.welcomeStartTime = time;
                }

                this.intensity = Utils.easing.easeOutQuart(this.transitionProgress);
                
                // Use smooth formation update
                this.particleSystem.updateRotation(deltaTime, true);
                this.particleSystem.updateFormationSmooth(time);
                this.particleSystem.updateColors(true, this.transitionProgress * 0.5);
                break;

            case 'holding':
                const holdElapsed = time - this.welcomeStartTime;
                
                if (holdElapsed >= CONFIG.transitions.welcomeHoldTime) {
                    this.welcomePhase = 'dissolving';
                    this.welcomeStartTime = time;
                    this.transitionProgress = 0;
                }

                this.intensity = 1;
                this.particleSystem.updateRotation(deltaTime, true);
                this.particleSystem.updateFormationSmooth(time);
                break;

            case 'dissolving':
                const dissolveSpeed = deltaTime / CONFIG.transitions.dissolveDuration;
                this.transitionProgress += dissolveSpeed;

                if (this.transitionProgress >= 1) {
                    this.transitionProgress = 1;
                    this.welcomePhase = 'complete';
                    this.welcomeComplete = true;
                    this.currentMode = 'idle';
                    this.targetMode = 'idle';
                    this.transitionDirection = 0;
                    this.isActive = false;
                    this.onModeChange('idle', CONFIG.modeNames.idle);
                }

                this.intensity = Utils.easing.easeOutCubic(1 - this.transitionProgress);
                this.particleSystem.updateDissolve(this.transitionProgress, time);
                this.particleSystem.updateColors(false, this.transitionProgress);
                break;
        }
    }

    /**
     * Update normal transition with smooth interpolation
     */
    updateNormalTransition(time, deltaTime) {
        const transitionSpeed = deltaTime / CONFIG.transitions.duration;

        // Update transition progress
        if (this.transitionDirection !== 0) {
            this.transitionProgress += this.transitionDirection * transitionSpeed;
            this.transitionProgress = Utils.clamp(this.transitionProgress, 0, 1);

            if (this.transitionProgress <= 0) {
                this.transitionDirection = 0;
                this.currentMode = 'idle';
                this.isActive = false;
            } else if (this.transitionProgress >= 1) {
                this.transitionDirection = 0;
                this.currentMode = this.targetMode;
            }
        }

        // Smooth intensity interpolation
        this.targetIntensity = this.isActive ? 1 : 0;
        this.intensity += (this.targetIntensity - this.intensity) * 0.1;

        // Update rotation (continuous)
        this.particleSystem.updateRotation(deltaTime, this.isActive);

        // Depth sort every 10 frames for performance
        this.sortCounter++;
        const shouldSort = this.sortCounter % 10 === 0;

        // Update particles based on state
        if (this.isActive || this.transitionProgress > 0) {
            this.particleSystem.updateFormationSmooth(time);
        } else {
            this.particleSystem.updateIdle(time);
        }

        // Update colors
        this.particleSystem.updateColors(this.isActive, this.transitionProgress);
    }

    /**
     * Get current glow intensity for rendering
     */
    getGlowIntensity() {
        // Add breathing effect to base intensity
        const breathing = this.particleSystem.breathingValue || 0;
        return this.intensity + breathing * 0.2 * (1 - this.intensity);
    }

    /**
     * Check if welcome sequence is complete
     */
    isWelcomeComplete() {
        return this.welcomeComplete;
    }

    /**
     * Get current mode
     */
    getCurrentMode() {
        return this.currentMode;
    }

    /**
     * Get transition progress
     */
    getProgress() {
        return this.transitionProgress;
    }

    /**
     * Check if currently in active formation
     */
    getIsActive() {
        return this.isActive;
    }
}
