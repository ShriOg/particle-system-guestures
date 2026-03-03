/* ========================================
   FICTIONAL PHYSICS ENGINE - UTILITIES
   Math helpers, easing functions, color utilities
======================================== */

'use strict';

const Utils = {
    /**
     * Linear interpolation between two values
     */
    lerp(start, end, t) {
        return start + (end - start) * t;
    },

    /**
     * Interpolate between two HSL colors
     */
    lerpColor(color1, color2, t) {
        return {
            h: this.lerp(color1.h, color2.h, t),
            s: this.lerp(color1.s, color2.s, t),
            l: this.lerp(color1.l, color2.l, t)
        };
    },

    /**
     * Convert HSL object to CSS string
     */
    hslToString(hsl, alpha = 1) {
        return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${alpha})`;
    },

    /**
     * Calculate distance between two points
     */
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },

    /**
     * Get random value in range
     */
    randomRange(min, max) {
        return Math.random() * (max - min) + min;
    },

    /**
     * Clamp value between min and max
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    /**
     * Map value from one range to another
     */
    map(value, inMin, inMax, outMin, outMax) {
        return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    },

    /**
     * Easing functions for smooth animations
     */
    easing: {
        easeInOutCubic(t) {
            return t < 0.5 
                ? 4 * t * t * t 
                : 1 - Math.pow(-2 * t + 2, 3) / 2;
        },

        easeOutCubic(t) {
            return 1 - Math.pow(1 - t, 3);
        },

        easeInCubic(t) {
            return t * t * t;
        },

        easeOutQuart(t) {
            return 1 - Math.pow(1 - t, 4);
        },

        easeInOutQuad(t) {
            return t < 0.5 
                ? 2 * t * t 
                : 1 - Math.pow(-2 * t + 2, 2) / 2;
        },

        easeOutElastic(t) {
            const c4 = (2 * Math.PI) / 3;
            return t === 0 ? 0 : t === 1 ? 1 :
                Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
        },

        easeOutBack(t) {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        }
    },

    /**
     * Generate text positions using offscreen canvas sampling
     * Ensures proper centering and dense letter fill
     */
    generateTextPositions(text, fontSize, fontFamily, targetCount, canvasWidth, canvasHeight) {
        // Create offscreen canvas at actual size
        const offscreen = document.createElement('canvas');
        const ctx = offscreen.getContext('2d');
        
        offscreen.width = canvasWidth;
        offscreen.height = canvasHeight;

        // Clear canvas with black
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Calculate center coordinates
        const cx = Math.floor(canvasWidth / 2);
        const cy = Math.floor(canvasHeight / 2);

        // Calculate responsive font size based on canvas width
        // Scale with viewport while maintaining readability
        const responsiveFontSize = Math.min(
            Math.floor(canvasWidth * 0.12),  // 12% of width
            Math.floor(canvasHeight * 0.25), // 25% of height max
            fontSize * 1.5
        );

        // Draw white text centered
        ctx.font = `bold ${responsiveFontSize}px ${fontFamily}`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, cx, cy);

        // Get pixel data
        const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
        const data = imageData.data;

        // Find all positions where text exists
        // Use tighter sampling (step = 3) for denser particle fill
        const allPositions = [];
        const step = 3;

        for (let y = 0; y < canvasHeight; y += step) {
            for (let x = 0; x < canvasWidth; x += step) {
                const idx = (y * canvasWidth + x) * 4;
                if (data[idx] > 128) {  // Lower threshold for better edge detection
                    allPositions.push({ x, y });
                }
            }
        }

        // Fallback if no text found
        if (allPositions.length < 10) {
            for (let i = 0; i < targetCount; i++) {
                const t = i / targetCount;
                const angle = t * Math.PI * 2 * 3;
                const r = 50 + t * 150;
                allPositions.push({
                    x: cx + Math.cos(angle) * r,
                    y: cy + Math.sin(angle) * r * 0.4
                });
            }
        }

        // Shuffle for random distribution
        for (let i = allPositions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allPositions[i], allPositions[j]] = [allPositions[j], allPositions[i]];
        }

        // Build final positions array with sub-pixel jitter for smoothness
        const positions = [];
        for (let i = 0; i < targetCount; i++) {
            const base = allPositions[i % allPositions.length];
            // Add small jitter for particles reusing positions
            const jitter = i >= allPositions.length ? this.randomRange(-1.5, 1.5) : 0;
            positions.push({
                x: base.x + jitter,
                y: base.y + jitter
            });
        }

        return positions;
    }
};

// Freeze Utils object
Object.freeze(Utils.easing);
Object.freeze(Utils);
