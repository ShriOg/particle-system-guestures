/* ========================================
   FICTIONAL PHYSICS ENGINE - HAND DETECTION
   MediaPipe Hands integration for gesture recognition
======================================== */

'use strict';

class HandDetection {
    constructor(videoElement, onGestureDetected) {
        this.video = videoElement;
        this.onGestureDetected = onGestureDetected;
        
        this.hands = null;
        this.camera = null;
        this.isInitialized = false;
        
        // Gesture stability tracking
        this.currentGesture = null;
        this.lastDetectedGesture = null;
        this.gestureStability = 0;
        this.requiredStability = 6; // Frames needed to confirm gesture
        
        // Timing
        this.lastDetectionTime = 0;
        this.detectionCooldown = 100; // ms between detections
    }

    /**
     * Initialize MediaPipe Hands and camera
     */
    async init() {
        try {
            // Check if MediaPipe is loaded
            if (typeof Hands === 'undefined') {
                console.warn('MediaPipe Hands not loaded');
                return false;
            }

            // Initialize Hands
            this.hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                }
            });

            this.hands.setOptions({
                maxNumHands: 2,
                modelComplexity: 1,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.5
            });

            this.hands.onResults((results) => this.processResults(results));

            // Initialize camera
            this.camera = new Camera(this.video, {
                onFrame: async () => {
                    if (this.hands && this.isInitialized) {
                        await this.hands.send({ image: this.video });
                    }
                },
                width: 320,
                height: 240
            });

            await this.camera.start();
            this.isInitialized = true;

            // Show video element
            this.video.classList.add('visible');

            return true;
        } catch (error) {
            console.warn('Hand detection initialization failed:', error);
            return false;
        }
    }

    /**
     * Process MediaPipe results
     */
    processResults(results) {
        const now = performance.now();
        
        // Apply cooldown
        if (now - this.lastDetectionTime < this.detectionCooldown) {
            return;
        }
        this.lastDetectionTime = now;

        // No hands detected
        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            this.updateGestureStability(null);
            return;
        }

        // Check for prayer hands (requires two hands)
        if (results.multiHandLandmarks.length === 2) {
            if (this.detectPrayerHands(results.multiHandLandmarks)) {
                this.updateGestureStability('prayer');
                return;
            }
        }

        // Analyze single hand gesture
        const landmarks = results.multiHandLandmarks[0];
        const gesture = this.classifyGesture(landmarks);
        this.updateGestureStability(gesture);
    }

    /**
     * Classify hand gesture from landmarks
     */
    classifyGesture(landmarks) {
        const fingers = this.getFingerStates(landmarks);
        const { index, middle, ring, pinky } = fingers;

        // Open palm: all fingers extended
        if (index && middle && ring && pinky) {
            return 'openPalm';
        }

        // Two fingers: index and middle extended only
        if (index && middle && !ring && !pinky) {
            return 'twoFingers';
        }

        // Fist: all fingers closed
        if (!index && !middle && !ring && !pinky) {
            return 'fist';
        }

        return null;
    }

    /**
     * Determine which fingers are extended
     */
    getFingerStates(landmarks) {
        // Landmark indices: tip and pip for each finger
        const checkExtended = (tipIdx, pipIdx, isThumb = false) => {
            const tip = landmarks[tipIdx];
            const pip = landmarks[pipIdx];

            if (isThumb) {
                // Thumb: check horizontal distance
                return Math.abs(tip.x - pip.x) > 0.04;
            }

            // Other fingers: tip should be above pip (lower y value)
            return tip.y < pip.y - 0.02;
        };

        return {
            thumb: checkExtended(4, 3, true),
            index: checkExtended(8, 6),
            middle: checkExtended(12, 10),
            ring: checkExtended(16, 14),
            pinky: checkExtended(20, 18)
        };
    }

    /**
     * Detect prayer hands gesture (two hands together)
     */
    detectPrayerHands(handsLandmarks) {
        if (handsLandmarks.length !== 2) return false;

        const hand1 = handsLandmarks[0];
        const hand2 = handsLandmarks[1];

        // Get palm centers
        const palm1 = hand1[9];
        const palm2 = hand2[9];

        // Calculate distance between palms
        const distance = Utils.distance(palm1.x, palm1.y, palm2.x, palm2.y);

        // Hands should be close together
        if (distance < 0.12) {
            // Check if fingers are pointing upward
            const tip1Y = hand1[12].y;
            const tip2Y = hand2[12].y;
            const wrist1Y = hand1[0].y;
            const wrist2Y = hand2[0].y;

            // Tips should be above wrists
            if (tip1Y < wrist1Y && tip2Y < wrist2Y) {
                return true;
            }
        }

        return false;
    }

    /**
     * Update gesture stability counter
     */
    updateGestureStability(gesture) {
        if (gesture === this.lastDetectedGesture) {
            this.gestureStability++;

            if (this.gestureStability >= this.requiredStability) {
                if (gesture !== this.currentGesture) {
                    this.currentGesture = gesture;
                    this.onGestureDetected(gesture);
                }
            }
        } else {
            this.lastDetectedGesture = gesture;
            this.gestureStability = 0;
        }
    }

    /**
     * Get current detected gesture
     */
    getCurrentGesture() {
        return this.currentGesture;
    }

    /**
     * Check if hand detection is active
     */
    isActive() {
        return this.isInitialized;
    }
}
