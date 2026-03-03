/* ========================================
   FICTIONAL PHYSICS ENGINE - FORMATION MANAGER
   Modular pattern generator with depth support
======================================== */

'use strict';

class FormationManager {
    constructor() {
        this.formations = new Map();
        this.registerDefaultFormations();
    }

    /**
     * Register a new formation pattern
     * @param {string} name - Formation identifier
     * @param {Function} generator - Function(count, cx, cy, radius) => [{x, y, z}]
     */
    addFormation(name, generator) {
        this.formations.set(name, generator);
    }

    /**
     * Check if formation exists
     */
    hasFormation(name) {
        return this.formations.has(name);
    }

    /**
     * Generate formation positions
     * @param {string} name - Formation name
     * @param {number} count - Particle count
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @param {number} radius - Formation radius
     * @param {...any} extraArgs - Additional arguments (e.g., textPositions for welcome)
     */
    generate(name, count, cx, cy, radius, ...extraArgs) {
        const generator = this.formations.get(name);
        if (!generator) {
            return this.generateIdle(count, cx, cy);
        }
        return generator(count, cx, cy, radius, ...extraArgs);
    }

    /**
     * Default idle scattered formation
     */
    generateIdle(count, cx, cy) {
        const positions = [];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 300 + 100;
            positions.push({
                x: cx + Math.cos(angle) * dist,
                y: cy + Math.sin(angle) * dist,
                z: Math.random()
            });
        }
        return positions;
    }

    /**
     * Register all default formations
     */
    registerDefaultFormations() {
        // ============================================
        // CIRCLE (Energy Ring) - Gesture: Open Palm
        // ============================================
        this.addFormation('circle', (count, cx, cy, radius) => {
            const positions = [];
            const rings = 3;
            const particlesPerRing = Math.floor(count / rings);

            for (let ring = 0; ring < rings; ring++) {
                const ringRadius = radius * (0.5 + ring * 0.25);
                const ringZ = 0.3 + ring * 0.3; // Depth varies by ring
                const ringCount = ring === rings - 1
                    ? count - (rings - 1) * particlesPerRing
                    : particlesPerRing;

                for (let i = 0; i < ringCount; i++) {
                    const angle = (i / ringCount) * Math.PI * 2;
                    const variation = Utils.randomRange(-5, 5);
                    const zVariation = Utils.randomRange(-0.1, 0.1);

                    positions.push({
                        x: cx + Math.cos(angle) * (ringRadius + variation),
                        y: cy + Math.sin(angle) * (ringRadius + variation),
                        z: Utils.clamp(ringZ + zVariation, 0, 1)
                    });
                }
            }
            return positions;
        });

        // ============================================
        // SPHERE (Dense Cluster) - Gesture: Fist
        // ============================================
        this.addFormation('sphere', (count, cx, cy, radius) => {
            const positions = [];
            const goldenAngle = Math.PI * (3 - Math.sqrt(5));

            for (let i = 0; i < count; i++) {
                const t = i / count;
                const inclination = Math.acos(1 - 2 * t);
                const azimuth = goldenAngle * i;

                // 3D sphere projection
                const r = radius * Math.pow(t, 0.35);
                const x = cx + r * Math.sin(inclination) * Math.cos(azimuth);
                const y = cy + r * Math.sin(inclination) * Math.sin(azimuth) * 0.65;
                
                // Z from 3D sphere (normalized)
                const z3d = Math.cos(inclination);
                const z = (z3d + 1) / 2; // Map -1..1 to 0..1

                positions.push({ x, y, z });
            }
            return positions;
        });

        // ============================================
        // INFINITY (Spatial Distortion) - Gesture: Two Fingers
        // ============================================
        this.addFormation('infinity', (count, cx, cy, radius) => {
            const positions = [];
            const a = radius * 1.1;

            for (let i = 0; i < count; i++) {
                const t = (i / count) * Math.PI * 2;
                
                // Lemniscate of Bernoulli
                const scale = 2 / (3 - Math.cos(2 * t));
                let x = cx + scale * Math.cos(t) * a;
                let y = cy + (scale * Math.sin(2 * t) / 2) * a * 0.55;

                // Organic variation
                const offset = Utils.randomRange(-8, 8);
                x += offset * Math.sin(t * 3);
                y += offset * Math.cos(t * 3);

                // Depth follows the twist
                const z = 0.3 + Math.abs(Math.sin(t)) * 0.5 + Utils.randomRange(-0.1, 0.1);

                positions.push({ x, y, z: Utils.clamp(z, 0, 1) });
            }
            return positions;
        });

        // ============================================
        // MANDALA (Ritual Pattern) - Gesture: Prayer
        // ============================================
        this.addFormation('mandala', (count, cx, cy, radius) => {
            const positions = [];
            const petals = 6;
            const layers = 5;
            const particlesPerLayer = Math.floor(count / layers);

            for (let layer = 0; layer < layers; layer++) {
                const layerRadius = radius * (0.15 + layer * 0.2);
                const layerZ = 0.2 + layer * 0.15;
                const layerCount = layer === layers - 1
                    ? count - (layers - 1) * particlesPerLayer
                    : particlesPerLayer;

                for (let i = 0; i < layerCount; i++) {
                    const baseAngle = (i / layerCount) * Math.PI * 2;
                    
                    // Petal effect
                    const petalOffset = Math.sin(baseAngle * petals) * (layerRadius * 0.35);
                    const r = layerRadius + petalOffset;
                    const variation = Utils.randomRange(-3, 3);
                    const zVariation = Utils.randomRange(-0.08, 0.08);

                    positions.push({
                        x: cx + Math.cos(baseAngle) * (r + variation),
                        y: cy + Math.sin(baseAngle) * (r + variation),
                        z: Utils.clamp(layerZ + zVariation, 0, 1)
                    });
                }
            }
            return positions;
        });

        // ============================================
        // WELCOME TEXT (Special formation)
        // ============================================
        this.addFormation('welcome', (count, cx, cy, radius, textPositions) => {
            if (textPositions && textPositions.length > 0) {
                return textPositions.map(pos => ({
                    x: pos.x,
                    y: pos.y,
                    z: Utils.randomRange(0.4, 0.8)
                }));
            }
            return this.generateIdle(count, cx, cy);
        });
    }

    /**
     * Get list of available formations
     */
    getFormationNames() {
        return Array.from(this.formations.keys());
    }
}

// Create global instance
const formationManager = new FormationManager();
