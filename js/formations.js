/* ========================================
   FICTIONAL PHYSICS ENGINE - FORMATIONS
   Legacy compatibility layer (uses FormationManager)
   Kept for backward compatibility
======================================== */

'use strict';

// Legacy Formations object - delegates to formationManager
const Formations = {
    circle: (count, cx, cy, radius) => formationManager.generate('circle', count, cx, cy, radius),
    sphere: (count, cx, cy, radius) => formationManager.generate('sphere', count, cx, cy, radius),
    infinity: (count, cx, cy, radius) => formationManager.generate('infinity', count, cx, cy, radius),
    mandala: (count, cx, cy, radius) => formationManager.generate('mandala', count, cx, cy, radius),
    welcome: (count, cx, cy, radius, textPositions) => formationManager.generate('welcome', count, cx, cy, radius, textPositions)
};
