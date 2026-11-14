// Main Application Controller for AI Glitter Canvas

import { PALETTES, PALETTE_KEYS, getRandomColorFromPalette, getPaletteGlow } from './palette.js';
import { ParticleSystem } from './particles.js';
import { GestureRecognizer, GESTURE_TYPES } from './gesture.js';
import { GlitterCanvas } from './canvas.js';
import { CameraManager } from './camera.js';
import { audioFx } from './audio.js';

class GlitterApp {
  constructor() {
    // DOM Elements
    this.bgCanvas = document.getElementById('bgCanvas');
    this.drawCanvas = document.getElementById('drawCanvas');
    this.fxCanvas = document.getElementById('fxCanvas');
    this.webcamVideo = document.getElementById('webcamVideo');
    this.pipCanvas = document.getElementById('pipCanvas');

    // UI Badges and Controls
    this.gestureBadge = document.getElementById('gestureBadge');
    this.gestureName = document.getElementById('gestureName');
    this.fpsValue = document.getElementById('fpsValue');
    this.paletteContainer = document.getElementById('paletteContainer');
    this.welcomeModal = document.getElementById('welcomeModal');
    this.tutorialModal = document.getElementById('tutorialModal');
    this.saveModal = document.getElementById('saveModal');
    this.toast = document.getElementById('toast');

    // Sliders
    this.brushSizeSlider = document.getElementById('brushSizeSlider');
    this.densitySlider = document.getElementById('densitySlider');
    this.intensitySlider = document.getElementById('intensitySlider');
    this.scatterSlider = document.getElementById('scatterSlider');

    // Buttons
    this.btnStartDrawing = document.getElementById('btnStartDrawing');
    this.btnShowTutorial = document.getElementById('btnShowTutorial');
    this.btnCloseTutorial = document.getElementById('btnCloseTutorial');
    this.btnUndo = document.getElementById('btnUndo');
    this.btnRedo = document.getElementById('btnRedo');
    this.btnClear = document.getElementById('btnClear');
    this.btnSave = document.getElementById('btnSave');
    this.btnAudioToggle = document.getElementById('btnAudioToggle');
    this.btnFullscreen = document.getElementById('btnFullscreen');
    this.btnTogglePip = document.getElementById('btnTogglePip');
    this.btnToggleSkeleton = document.getElementById('btnToggleSkeleton');

    // State
    this.currentPalette = 'gold';
    this.activePointer = null; // { x, y } in screen pixels
    this.activePalm = null;
    this.currentGesture = GESTURE_TYPES.NONE;
    this.colorChangeProgress = 0;
    this.mouseDrawing = false;
    this.mouseErasing = false;

    // Core Engines
    this.canvasEngine = new GlitterCanvas(this.bgCanvas, this.drawCanvas, this.fxCanvas);
    this.particleEngine = new ParticleSystem();
    this.gestureEngine = new GestureRecognizer();
    this.cameraManager = new CameraManager(
      this.webcamVideo,
      this.pipCanvas,
      (landmarks, fps) => this.onHandTrackingResults(landmarks, fps)
    );

    this.init();
  }

  init() {
    this.particleEngine.initAmbientStars(window.innerWidth, window.innerHeight);
    this.buildPaletteUI();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    this.updateUndoRedoUI();

    // Start 60fps Animation Loop
    requestAnimationFrame((t) => this.animationLoop(t));

    // Handle window resize
    window.addEventListener('resize', () => {
      this.canvasEngine.resize(window.innerWidth, window.innerHeight);
      this.particleEngine.initAmbientStars(window.innerWidth, window.innerHeight);
    });
  }

  buildPaletteUI() {
    this.paletteContainer.innerHTML = '';
    PALETTE_KEYS.forEach((key, index) => {
      const palette = PALETTES[key];
      const button = document.createElement('button');
      button.className = `palette-btn ${key === this.currentPalette ? 'active' : ''}`;
      button.setAttribute('data-palette', key);
      button.setAttribute('title', `${palette.name} (Key: ${index + 1})`);
      button.style.background = palette.swatch;

      // Glow effect on active
      if (key === this.currentPalette) {
        button.style.boxShadow = `0 0 16px ${palette.glow}, inset 0 0 6px #fff`;
      }

      button.addEventListener('click', () => {
        this.selectPalette(key, true);
      });

      this.paletteContainer.appendChild(button);
    });
  }

  selectPalette(paletteKey, playSound = false) {
    if (!PALETTES[paletteKey]) return;
    this.currentPalette = paletteKey;
    this.canvasEngine.currentPalette = paletteKey;

    // Update UI Swatches
    const buttons = this.paletteContainer.querySelectorAll('.palette-btn');
    buttons.forEach(btn => {
      const key = btn.getAttribute('data-palette');
      if (key === paletteKey) {
        btn.classList.add('active');
        btn.style.boxShadow = `0 0 18px ${PALETTES[key].glow}, inset 0 0 8px #fff`;
      } else {
        btn.classList.remove('active');
        btn.style.boxShadow = 'none';
      }
    });

    if (playSound) {
      audioFx.playColorChange();
    }
    this.showToast(`Switched to ${PALETTES[paletteKey].name} ✨`);
  }

  cycleNextPalette() {
    const currentIndex = PALETTE_KEYS.indexOf(this.currentPalette);
    const nextIndex = (currentIndex + 1) % PALETTE_KEYS.length;
    const nextKey = PALETTE_KEYS[nextIndex];
    this.selectPalette(nextKey, true);

    // Trigger visual ripple burst at pointer position
    if (this.activePointer) {
      this.particleEngine.createSparkleBurst(
        this.activePointer.x,
        this.activePointer.y,
        nextKey,
        35,
        1.2
      );
    }
  }

  setupEventListeners() {
    // Welcome / Start Drawing button
    this.btnStartDrawing.addEventListener('click', async () => {
      audioFx.init();
      this.welcomeModal.classList.add('hidden');
      this.showToast('Requesting camera access... 🎥');
      try {
        await this.cameraManager.start();
        this.showToast('Hand tracking active! Raise your index finger to draw ✨');
      } catch (err) {
        this.showToast(err.message, 6000);
        console.error(err);
      }
    });

    // Tutorial modal
    this.btnShowTutorial.addEventListener('click', () => {
      this.tutorialModal.classList.remove('hidden');
    });
    this.btnCloseTutorial.addEventListener('click', () => {
      this.tutorialModal.classList.add('hidden');
    });

    // Undo / Redo
    this.btnUndo.addEventListener('click', () => this.handleUndo());
    this.btnRedo.addEventListener('click', () => this.handleRedo());

    // Clear Canvas
    this.btnClear.addEventListener('click', () => {
      this.canvasEngine.clearCanvas();
      this.updateUndoRedoUI();
      this.showToast('Canvas cleared ✨');
    });

    // Save Artwork
    this.btnSave.addEventListener('click', () => {
      this.saveModal.classList.remove('hidden');
    });

    document.getElementById('btnSaveCosmic').addEventListener('click', () => {
      this.canvasEngine.exportArtwork(true);
      this.saveModal.classList.add('hidden');
      this.showToast('Artwork saved with Cosmic Background! 🌌');
    });

    document.getElementById('btnSaveTransparent').addEventListener('click', () => {
      this.canvasEngine.exportArtwork(false);
      this.saveModal.classList.add('hidden');
      this.showToast('Artwork saved as Transparent PNG! ✨');
    });

    document.getElementById('btnCloseSave').addEventListener('click', () => {
      this.saveModal.classList.add('hidden');
    });

    // Audio Toggle
    this.btnAudioToggle.addEventListener('click', () => {
      const isMuted = audioFx.toggleMute();
      this.btnAudioToggle.innerHTML = isMuted ? '🔇' : '🔔';
      this.btnAudioToggle.setAttribute('title', isMuted ? 'Unmute Sound FX' : 'Mute Sound FX');
      this.showToast(isMuted ? 'Sound FX Muted' : 'Sound FX Enabled 🎶');
    });

    // Fullscreen
    this.btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // PIP Camera Controls
    this.btnTogglePip.addEventListener('click', () => {
      const pip = document.getElementById('pipContainer');
      pip.classList.toggle('collapsed');
      this.btnTogglePip.textContent = pip.classList.contains('collapsed') ? '➕' : '➖';
    });

    this.btnToggleSkeleton.addEventListener('click', () => {
      this.cameraManager.showLandmarks = !this.cameraManager.showLandmarks;
      this.btnToggleSkeleton.classList.toggle('active', this.cameraManager.showLandmarks);
      this.showToast(this.cameraManager.showLandmarks ? 'Skeletal tracking overlay ON' : 'Skeletal overlay OFF');
    });

    // Sliders with dynamic value labels
    const brushSizeVal = document.getElementById('brushSizeVal');
    const densityVal = document.getElementById('densityVal');
    const intensityVal = document.getElementById('intensityVal');
    const scatterVal = document.getElementById('scatterVal');

    this.brushSizeSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.canvasEngine.brushSize = val;
      if (brushSizeVal) brushSizeVal.textContent = `${Math.round(val)}px`;
    });

    this.densitySlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.canvasEngine.particleDensity = val;
      if (densityVal) {
        densityVal.textContent = val < 1.4 ? 'Low' : (val < 2.5 ? 'Medium' : (val < 3.5 ? 'High' : 'Ultra'));
      }
    });

    this.intensitySlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.canvasEngine.intensity = val;
      if (intensityVal) intensityVal.textContent = `${Math.round(val * 100)}%`;
    });

    this.scatterSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.canvasEngine.scatter = val;
      if (scatterVal) {
        scatterVal.textContent = val < 0.8 ? 'Sharp' : (val < 1.4 ? 'Velvet' : 'Cosmic Dust');
      }
    });

    // Mouse & Touch Fallback Drawing
    this.setupPointerFallback();
  }

  setupPointerFallback() {
    const target = this.fxCanvas;

    const onPointerDown = (e) => {
      audioFx.init();
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (e.button === 2 || e.shiftKey) {
        // Erase mode
        this.mouseErasing = true;
        this.canvasEngine.eraseAt(x, y);
        audioFx.playEraserSwoosh();
      } else {
        // Draw mode
        this.mouseDrawing = true;
        this.canvasEngine.startStroke(x, y);
        this.particleEngine.createCursorAura(x, y, this.currentPalette, 5, this.canvasEngine.intensity);
        audioFx.playDrawSparkle(1);
      }
      this.activePointer = { x, y };
    };

    const onPointerMove = (e) => {
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.activePointer = { x, y };

      if (this.mouseDrawing) {
        this.canvasEngine.drawSegmentTo(x, y);
        this.particleEngine.createCursorAura(x, y, this.currentPalette, 2, this.canvasEngine.intensity);
        audioFx.playDrawSparkle(1);
      } else if (this.mouseErasing) {
        this.canvasEngine.eraseAt(x, y);
        audioFx.playEraserSwoosh();
      }
    };

    const onPointerUp = () => {
      if (this.mouseDrawing) {
        this.canvasEngine.endStroke();
        this.updateUndoRedoUI();
      }
      this.mouseDrawing = false;
      this.mouseErasing = false;
    };

    target.addEventListener('mousedown', onPointerDown);
    target.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    // Double-click for sparkle burst
    target.addEventListener('dblclick', (e) => {
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.particleEngine.createSparkleBurst(x, y, this.currentPalette, 75, this.canvasEngine.intensity);
      audioFx.playSparkleBurst();
    });

    target.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Don't trigger if user is in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const key = e.key.toLowerCase();

      if ((e.metaKey || e.ctrlKey) && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) this.handleRedo();
        else this.handleUndo();
      } else if ((e.metaKey || e.ctrlKey) && key === 'y') {
        e.preventDefault();
        this.handleRedo();
      } else if (key === 'c') {
        this.canvasEngine.clearCanvas();
        this.updateUndoRedoUI();
        this.showToast('Canvas cleared ✨');
      } else if (key === 's') {
        e.preventDefault();
        this.saveModal.classList.remove('hidden');
      } else if (key === 'm') {
        this.btnAudioToggle.click();
      } else if (key === 't') {
        this.tutorialModal.classList.toggle('hidden');
      } else if (key >= '1' && key <= '8') {
        const idx = parseInt(key) - 1;
        if (idx < PALETTE_KEYS.length) {
          this.selectPalette(PALETTE_KEYS[idx], true);
        }
      }
    });
  }

  handleUndo() {
    if (this.canvasEngine.undo()) {
      this.updateUndoRedoUI();
      this.showToast('Undo ↩️');
    }
  }

  handleRedo() {
    if (this.canvasEngine.redo()) {
      this.updateUndoRedoUI();
      this.showToast('Redo ↪️');
    }
  }

  updateUndoRedoUI() {
    this.btnUndo.disabled = !this.canvasEngine.canUndo();
    this.btnRedo.disabled = !this.canvasEngine.canRedo();
  }

  // Handle hand landmark frame from CameraManager
  onHandTrackingResults(landmarks, fps) {
    this.fpsValue.textContent = fps || '--';

    const result = this.gestureEngine.processLandmarks(landmarks);
    this.currentGesture = result.gesture;
    this.colorChangeProgress = result.colorChangeProgress;

    // Convert normalized coordinates (0-1) to canvas pixels
    if (result.pointer) {
      this.activePointer = {
        x: result.pointer.x * this.canvasEngine.width,
        y: result.pointer.y * this.canvasEngine.height
      };
    } else if (!this.mouseDrawing) {
      this.activePointer = null;
    }

    if (result.palmCenter) {
      this.activePalm = {
        x: result.palmCenter.x * this.canvasEngine.width,
        y: result.palmCenter.y * this.canvasEngine.height
      };
    } else {
      this.activePalm = null;
    }

    // Process Gesture Actions
    if (result.triggerColorChange) {
      this.cycleNextPalette();
    }

    if (result.triggerPinchBurst && this.activePointer) {
      this.particleEngine.createSparkleBurst(
        this.activePointer.x,
        this.activePointer.y,
        this.currentPalette,
        80,
        this.canvasEngine.intensity
      );
      audioFx.playSparkleBurst();
      this.showToast('Sparkle Burst! ✨');
    }

    // Drawing Gesture
    if (this.currentGesture === GESTURE_TYPES.DRAW && this.activePointer) {
      this.canvasEngine.drawSegmentTo(this.activePointer.x, this.activePointer.y);
      this.particleEngine.createCursorAura(
        this.activePointer.x,
        this.activePointer.y,
        this.currentPalette,
        2,
        this.canvasEngine.intensity
      );
      audioFx.playDrawSparkle(1.2);
    } else if (this.canvasEngine.isStrokeActive) {
      this.canvasEngine.endStroke();
      this.updateUndoRedoUI();
    }

    // Erasing Gesture (Open Palm)
    if (this.currentGesture === GESTURE_TYPES.ERASE && this.activePalm) {
      const eraseRadius = (result.handScale || 0.15) * this.canvasEngine.width * 0.45;
      this.canvasEngine.eraseAt(this.activePalm.x, this.activePalm.y, eraseRadius);
      audioFx.playEraserSwoosh();
    }

    this.updateGestureBadge();
  }

  updateGestureBadge() {
    let name = 'READY';
    let icon = '✨';
    let className = 'idle';

    switch (this.currentGesture) {
      case GESTURE_TYPES.DRAW:
        name = 'DRAWING';
        icon = '✨';
        className = 'drawing';
        break;
      case GESTURE_TYPES.ERASE:
        name = 'ERASER MODE';
        icon = '🧹';
        className = 'erasing';
        break;
      case GESTURE_TYPES.PAUSE:
        name = 'PAUSED';
        icon = '⏸';
        className = 'paused';
        break;
      case GESTURE_TYPES.CHANGE_COLOR:
        name = 'CYCLING COLOR';
        icon = '🎨';
        className = 'charging';
        break;
      case GESTURE_TYPES.PINCH_BURST:
        name = 'SPARKLE BURST';
        icon = '💥';
        className = 'burst';
        break;
      default:
        name = 'TRACKING';
        icon = '🖐️';
        className = 'idle';
    }

    this.gestureName.textContent = name;
    this.gestureBadge.className = `gesture-badge ${className}`;
  }

  // 60FPS Render & Animation Loop
  animationLoop() {
    const fxCtx = this.canvasEngine.fxCtx;
    fxCtx.clearRect(0, 0, this.canvasEngine.width, this.canvasEngine.height);

    // 1. Update and render active floating sparkles & physics
    this.particleEngine.update();
    this.particleEngine.renderFX(fxCtx);

    // 2. Render perpetual shimmer stars over drawn artwork
    this.canvasEngine.renderGlimmers(fxCtx);

    // 3. Render glowing cursor, holographic eraser, or charging arc
    this.renderCursorAndOverlays(fxCtx);

    requestAnimationFrame((t) => this.animationLoop(t));
  }

  renderCursorAndOverlays(ctx) {
    // Holographic Eraser Circle when in ERASE mode
    if (this.currentGesture === GESTURE_TYPES.ERASE && this.activePalm) {
      const cx = this.activePalm.x;
      const cy = this.activePalm.y;
      const radius = this.canvasEngine.eraserRadius * 1.5;

      ctx.save();
      // Outer neon dashed ring
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#FF0055';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      ctx.stroke();

      // Soft red/pink translucent glow
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 0, 85, 0.12)';
      ctx.fill();

      // Label
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillStyle = '#FF0055';
      ctx.textAlign = 'center';
      ctx.fillText('ERASER', cx, cy - radius - 10);
      ctx.restore();
    }

    // Drawing Pointer or Cursor Aura
    if (this.activePointer) {
      const px = this.activePointer.x;
      const py = this.activePointer.y;
      const palette = PALETTES[this.currentPalette];

      ctx.save();

      // If charging color change, draw a glowing radial progress arc around pointer
      if (this.colorChangeProgress > 0) {
        ctx.beginPath();
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (Math.PI * 2 * this.colorChangeProgress);
        ctx.arc(px, py, 26, startAngle, endAngle);
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.shadowColor = '#00F0FF';
        ctx.shadowBlur = 12;
        ctx.stroke();
      }

      // Glowing cursor dot
      ctx.shadowColor = palette.glow;
      ctx.shadowBlur = 18;

      ctx.beginPath();
      ctx.arc(px, py, this.canvasEngine.brushSize * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = palette.primary;
      ctx.fill();

      // Inner brilliant white core
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      ctx.restore();
    }
  }

  showToast(message, duration = 3000) {
    if (!this.toast) return;
    this.toast.textContent = message;
    this.toast.classList.remove('hidden');
    this.toast.classList.add('visible');

    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toast.classList.remove('visible');
      setTimeout(() => this.toast.classList.add('hidden'), 300);
    }, duration);
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.glitterApp = new GlitterApp();
});
