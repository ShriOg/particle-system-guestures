/* ========================================
   FICTIONAL PHYSICS ENGINE - CONFIGURATION
   Central configuration for all engine parameters
======================================== */

'use strict';

const CONFIG = {
    // Particle settings (optimized for 60fps)
    particles: {
        count: 600,
        minRadius: 1,
        maxRadius: 2.5,
        baseSpeed: 0.3,
        maxSpeed: 2
    },

    // Depth system (fake 3D)
    depth: {
        minZ: 0,
        maxZ: 1,
        radiusScale: { min: 0.4, max: 1.0 },     // radius *= (0.4 + z * 0.6)
        speedScale: { min: 0.5, max: 1.0 },      // velocity *= (0.5 + z * 0.5)
        parallaxStrength: 0.02                    // mouse parallax multiplier
    },

    // Color palettes
    colors: {
        idle: {
            primary: { h: 270, s: 65, l: 55 },    // Soft purple
            secondary: { h: 220, s: 75, l: 50 }   // Soft blue
        },
        active: {
            primary: { h: 280, s: 85, l: 60 },    // Neon violet
            secondary: { h: 350, s: 75, l: 45 }   // Deep crimson
        }
    },

    // Transition settings
    transitions: {
        duration: 2000,
        welcomeHoldTime: 2000,
        dissolveDuration: 1800,
        impactFreezeDuration: 150,                // Freeze on gesture detect (ms)
        interpolationSpeed: 0.08                  // Smooth lerp factor
    },

    // Physics settings
    physics: {
        friction: 0.97,
        returnForce: 0.015,
        idleForce: 0.008,
        orbitSpeed: 0.0003,                       // Idle orbit drift
        breathingSpeed: 0.002,                    // Glow breathing rate
        breathingIntensity: 0.15,                 // Glow breathing amplitude
        noiseScale: 0.003,                        // Ambient noise field scale
        noiseStrength: 0.5                        // Ambient noise force
    },

    // Visual settings (optimized glow for performance)
    visuals: {
        trailOpacity: 0.12,
        maxGlow: 8,
        minGlow: 2,
        shockwaveSpeed: 400,                      // px per second
        shockwaveDuration: 600,                   // ms
        shockwaveMaxRadius: 500,                  // px
        pulseScale: 0.02,                         // Canvas scale pulse (1 + pulseScale)
        pulseDuration: 300                        // ms
    },

    // Rotation settings
    rotation: {
        baseSpeed: 0.0005,                        // radians per frame
        activeMultiplier: 1.5                     // Speed increase when active
    },

    // Welcome text settings
    welcome: {
        text: 'WELCOME',
        fontSize: 120,
        fontFamily: 'Arial, Helvetica, sans-serif'
    },

    // Gesture mapping
    gestures: {
        openPalm: 'circle',
        fist: 'sphere',
        twoFingers: 'infinity',
        prayer: 'mandala'
    },

    // Mode display names
    modeNames: {
        idle: 'IDLE',
        welcome: 'WELCOME',
        circle: 'ENERGY RING',
        sphere: 'SPHERE CLUSTER',
        infinity: 'SPATIAL DISTORTION',
        mandala: 'RITUAL MANDALA'
    }
};

// Freeze config to prevent accidental modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.particles);
Object.freeze(CONFIG.colors);
Object.freeze(CONFIG.colors.idle);
Object.freeze(CONFIG.colors.active);
Object.freeze(CONFIG.transitions);
Object.freeze(CONFIG.physics);
Object.freeze(CONFIG.visuals);
Object.freeze(CONFIG.welcome);
Object.freeze(CONFIG.gestures);
Object.freeze(CONFIG.modeNames);
