// AI Hand Gesture Recognition and Landmark Smoothing Engine

export const GESTURE_TYPES = {
  DRAW: 'DRAW',
  ERASE: 'ERASE',
  PAUSE: 'PAUSE',
  CHANGE_COLOR: 'CHANGE_COLOR',
  PINCH_BURST: 'PINCH_BURST',
  NONE: 'NONE'
};

export class GestureRecognizer {
  constructor() {
    this.smoothedPointer = { x: 0.5, y: 0.5, active: false };
    this.smoothedPalm = { x: 0.5, y: 0.5 };
    this.lastRawPointer = null;

    // Cooldown timers and states
    this.colorChangeHoldTimer = 0;
    this.colorChangeCooldown = 0;
    this.colorChangeProgress = 0; // 0 to 1 for visual UI charging arc
    this.lastPinchTriggerTime = 0;
    this.pinchCooldown = 400; // ms

    this.currentGesture = GESTURE_TYPES.NONE;
    this.confidence = 0;

    // Gesture history buffer for stable majority voting
    this.gestureHistory = [];
    this.historyLength = 4;
  }

  // Euclidean distance between two 2D/3D landmarks
  dist(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = (p1.z || 0) - (p2.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // Smooth pointer coordinates using adaptive exponential smoothing
  smoothCoordinates(rawX, rawY) {
    if (!this.smoothedPointer.active) {
      this.smoothedPointer.x = rawX;
      this.smoothedPointer.y = rawY;
      this.smoothedPointer.active = true;
      return { x: rawX, y: rawY };
    }

    const distMoved = Math.hypot(rawX - this.smoothedPointer.x, rawY - this.smoothedPointer.y);
    // Dynamic alpha: fast movement gets higher responsiveness (0.75), slow gets ultra-smooth stability (0.3)
    const alpha = Math.min(0.85, Math.max(0.32, distMoved * 12));

    this.smoothedPointer.x += (rawX - this.smoothedPointer.x) * alpha;
    this.smoothedPointer.y += (rawY - this.smoothedPointer.y) * alpha;

    return { x: this.smoothedPointer.x, y: this.smoothedPointer.y };
  }

  // Analyze 21 hand landmarks from MediaPipe Hands
  processLandmarks(landmarks, now = performance.now()) {
    if (!landmarks || landmarks.length < 21) {
      this.currentGesture = GESTURE_TYPES.NONE;
      this.smoothedPointer.active = false;
      this.colorChangeProgress = 0;
      return {
        gesture: GESTURE_TYPES.NONE,
        pointer: null,
        palmCenter: null,
        colorChangeProgress: 0,
        triggerColorChange: false,
        triggerPinchBurst: false
      };
    }

    // Mirroring: user faces camera, so flip X coordinate for natural mirror canvas mapping
    const pts = landmarks.map(p => ({
      x: 1.0 - p.x,
      y: p.y,
      z: p.z || 0
    }));

    const wrist = pts[0];
    const thumbTip = pts[4];
    const thumbIP = pts[3];
    const thumbMCP = pts[2];

    const indexTip = pts[8];
    const indexDIP = pts[7];
    const indexPIP = pts[6];
    const indexMCP = pts[5];

    const middleTip = pts[12];
    const middlePIP = pts[10];
    const middleMCP = pts[9];

    const ringTip = pts[16];
    const ringPIP = pts[14];
    const ringMCP = pts[13];

    const pinkyTip = pts[20];
    const pinkyPIP = pts[18];
    const pinkyMCP = pts[17];

    // Reference scale: distance between wrist (0) and middle MCP (9)
    const handScale = Math.max(0.001, this.dist(wrist, middleMCP));

    // Finger extension checks (distance from tip to wrist vs PIP to wrist)
    const isIndexExtended = this.dist(indexTip, wrist) > this.dist(indexPIP, wrist) * 1.18;
    const isMiddleExtended = this.dist(middleTip, wrist) > this.dist(middlePIP, wrist) * 1.18;
    const isRingExtended = this.dist(ringTip, wrist) > this.dist(ringPIP, wrist) * 1.18;
    const isPinkyExtended = this.dist(pinkyTip, wrist) > this.dist(pinkyPIP, wrist) * 1.18;

    // Thumb extension check: distance between thumb tip and index MCP
    const thumbIndexMcpDist = this.dist(thumbTip, indexMCP);
    const isThumbExtended = thumbIndexMcpDist > handScale * 0.75;

    // Pinch check: distance between thumb tip and index tip
    const pinchDist = this.dist(thumbTip, indexTip) / handScale;
    const isPinching = pinchDist < 0.38;

    // Compute palm center (centroid of wrist, index MCP, middle MCP, pinky MCP)
    const palmRaw = {
      x: (wrist.x + indexMCP.x + middleMCP.x + pinkyMCP.x) * 0.25,
      y: (wrist.y + indexMCP.y + middleMCP.y + pinkyMCP.y) * 0.25
    };
    this.smoothedPalm.x += (palmRaw.x - this.smoothedPalm.x) * 0.4;
    this.smoothedPalm.y += (palmRaw.y - this.smoothedPalm.y) * 0.4;

    // Smooth index fingertip as drawing pointer
    const pointer = this.smoothCoordinates(indexTip.x, indexTip.y);

    let detectedGesture = GESTURE_TYPES.NONE;
    let triggerColorChange = false;
    let triggerPinchBurst = false;

    // 1. PINCH BURST CHECK (Highest priority instantaneous gesture)
    if (isPinching) {
      detectedGesture = GESTURE_TYPES.PINCH_BURST;
      if (now - this.lastPinchTriggerTime > this.pinchCooldown) {
        this.lastPinchTriggerTime = now;
        triggerPinchBurst = true;
      }
    }
    // 2. OPEN PALM (ERASE MODE) - All 4 or 5 fingers extended and spread
    else if (isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended) {
      detectedGesture = GESTURE_TYPES.ERASE;
    }
    // 3. TWO FINGERS RAISED (PEACE SIGN -> CHANGE COLOR)
    // Index and Middle are extended, Ring and Pinky are curled
    else if (isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      detectedGesture = GESTURE_TYPES.CHANGE_COLOR;

      if (now > this.colorChangeCooldown) {
        this.colorChangeHoldTimer += 16.6; // approx 60fps delta
        this.colorChangeProgress = Math.min(1.0, this.colorChangeHoldTimer / 450); // charge for 450ms

        if (this.colorChangeProgress >= 1.0) {
          triggerColorChange = true;
          this.colorChangeCooldown = now + 800; // 800ms cooldown after trigger
          this.colorChangeHoldTimer = 0;
          this.colorChangeProgress = 0;
        }
      }
    }
    // 4. CLOSED FIST (PAUSE) - All 4 main fingers curled
    else if (!isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      detectedGesture = GESTURE_TYPES.PAUSE;
    }
    // 5. INDEX FINGER RAISED (DRAW) - Only index finger extended
    else if (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      detectedGesture = GESTURE_TYPES.DRAW;
    }
    else {
      detectedGesture = GESTURE_TYPES.PAUSE;
    }

    // Reset color change charging if not holding two fingers
    if (detectedGesture !== GESTURE_TYPES.CHANGE_COLOR) {
      this.colorChangeHoldTimer = 0;
      this.colorChangeProgress = 0;
    }

    // Smooth gesture transitions using history buffer
    this.gestureHistory.push(detectedGesture);
    if (this.gestureHistory.length > this.historyLength) {
      this.gestureHistory.shift();
    }

    // Find majority gesture in history
    const counts = {};
    for (const g of this.gestureHistory) {
      counts[g] = (counts[g] || 0) + 1;
    }
    let majorityGesture = detectedGesture;
    let maxCount = 0;
    for (const g in counts) {
      if (counts[g] > maxCount) {
        maxCount = counts[g];
        majorityGesture = g;
      }
    }

    this.currentGesture = majorityGesture;

    return {
      gesture: this.currentGesture,
      rawGesture: detectedGesture,
      pointer: pointer,
      palmCenter: this.smoothedPalm,
      handScale: handScale,
      colorChangeProgress: this.colorChangeProgress,
      triggerColorChange: triggerColorChange,
      triggerPinchBurst: triggerPinchBurst
    };
  }

  reset() {
    this.smoothedPointer.active = false;
    this.gestureHistory = [];
    this.currentGesture = GESTURE_TYPES.NONE;
    this.colorChangeHoldTimer = 0;
    this.colorChangeProgress = 0;
  }
}
