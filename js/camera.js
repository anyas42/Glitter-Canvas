// Webcam Stream and MediaPipe Hands Integration Manager

export class CameraManager {
  constructor(videoElement, pipCanvas, onResultsCallback) {
    this.videoElement = videoElement;
    this.pipCanvas = pipCanvas;
    this.pipCtx = pipCanvas.getContext('2d');
    this.onResultsCallback = onResultsCallback;

    this.stream = null;
    this.hands = null;
    this.camera = null;
    this.isRunning = false;

    this.showLandmarks = true;
    this.fps = 0;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;

    // Connections between the 21 MediaPipe hand landmarks for skeleton wireframe
    this.HAND_CONNECTIONS = [
      [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8],       // Index
      [5, 9], [9, 10], [10, 11], [11, 12],  // Middle
      [9, 13], [13, 14], [14, 15], [15, 16],// Ring
      [13, 17], [17, 18], [18, 19], [19, 20],// Pinky
      [0, 17]                               // Palm base
    ];
  }

  async checkPermission() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Webcam API is not supported in this browser. Please use Google Chrome, Brave, or Safari.');
    }
    return true;
  }

  async initMediaPipe() {
    // Check if MediaPipe is available from CDN
    if (!window.Hands) {
      throw new Error('MediaPipe Hands library is still loading or could not be loaded from CDN. Please check your internet connection and refresh.');
    }

    this.hands = new window.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1, // 0 = Lite, 1 = Full (optimal for Mac)
      minDetectionConfidence: 0.65,
      minTrackingConfidence: 0.65
    });

    this.hands.onResults((results) => {
      this.handleResults(results);
    });
  }

  async start() {
    await this.checkPermission();
    await this.initMediaPipe();

    const constraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      },
      audio: false
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement.srcObject = this.stream;
      await this.videoElement.play();

      // Setup PIP Canvas resolution
      this.pipCanvas.width = this.videoElement.videoWidth || 320;
      this.pipCanvas.height = this.videoElement.videoHeight || 240;

      this.isRunning = true;
      this.processVideoLoop();

      return true;
    } catch (err) {
      console.error('Webcam start error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('Camera permission was denied. Please allow camera access in your browser address bar and refresh.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        throw new Error('No webcam found on your device. Please ensure your camera is connected.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        throw new Error('Webcam is already in use by another application (e.g. Zoom, FaceTime). Please close it and retry.');
      } else {
        throw err;
      }
    }
  }

  async processVideoLoop() {
    if (!this.isRunning) return;

    if (this.videoElement.readyState >= 2) {
      try {
        await this.hands.send({ image: this.videoElement });
      } catch (e) {
        // Suppress transient frame drop errors
      }
    }

    if (this.isRunning) {
      requestAnimationFrame(() => this.processVideoLoop());
    }
  }

  handleResults(results) {
    // Measure FPS
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFrameTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFrameTime));
      this.frameCount = 0;
      this.lastFrameTime = now;
    }

    // Render PIP webcam feed
    this.renderPipPreview(results);

    // Forward landmarks to application
    const landmarks = (results.multiHandLandmarks && results.multiHandLandmarks.length > 0)
      ? results.multiHandLandmarks[0]
      : null;

    if (this.onResultsCallback) {
      this.onResultsCallback(landmarks, this.fps);
    }
  }

  renderPipPreview(results) {
    const ctx = this.pipCtx;
    const w = this.pipCanvas.width;
    const h = this.pipCanvas.height;

    ctx.save();
    // Mirror the preview
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(this.videoElement, 0, 0, w, h);

    // Subtle dark tint to make landmarks pop
    ctx.fillStyle = 'rgba(7, 5, 20, 0.25)';
    ctx.fillRect(0, 0, w, h);

    if (this.showLandmarks && results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];

      // Draw skeleton wireframe
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.65)';
      ctx.lineWidth = 2;
      for (const [startIdx, endIdx] of this.HAND_CONNECTIONS) {
        const p1 = landmarks[startIdx];
        const p2 = landmarks[endIdx];
        ctx.beginPath();
        ctx.moveTo(p1.x * w, p1.y * h);
        ctx.lineTo(p2.x * w, p2.y * h);
        ctx.stroke();
      }

      // Draw glowing landmark joints
      for (let i = 0; i < landmarks.length; i++) {
        const p = landmarks[i];
        ctx.beginPath();
        const isTip = [4, 8, 12, 16, 20].includes(i);
        const isIndex = i === 8;

        ctx.arc(p.x * w, p.y * h, isIndex ? 5 : (isTip ? 3.5 : 2.5), 0, Math.PI * 2);
        ctx.fillStyle = isIndex ? '#FFD700' : (isTip ? '#FF1493' : '#00F0FF');
        ctx.fill();
      }
    }

    ctx.restore();
  }

  stop() {
    this.isRunning = false;
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }
}
