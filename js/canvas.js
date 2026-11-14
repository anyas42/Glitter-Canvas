// Multi-Layered Glitter Canvas Engine, Continuous Interpolation, and Artwork Management

import { getRandomColorFromPalette, getPaletteGlow } from './palette.js';

export class GlitterCanvas {
  constructor(bgCanvas, drawCanvas, fxCanvas) {
    this.bgCanvas = bgCanvas;
    this.drawCanvas = drawCanvas;
    this.fxCanvas = fxCanvas;

    this.bgCtx = bgCanvas.getContext('2d');
    this.drawCtx = drawCanvas.getContext('2d', { willReadFrequently: true });
    this.fxCtx = fxCanvas.getContext('2d');

    // Drawing settings
    this.brushSize = 16; // base radius
    this.particleDensity = 2.2; // multiplier
    this.intensity = 1.0; // glow and brightness multiplier
    this.scatter = 1.0; // path scatter width
    this.currentPalette = 'gold';

    // State tracking
    this.lastPoint = null;
    this.isDrawing = false;
    this.isErasing = false;
    this.eraserRadius = 45;

    // Undo / Redo history
    this.history = [];
    this.redoStack = [];
    this.maxHistory = 25;
    this.isStrokeActive = false;

    // Live glimmer particles on top of drawn canvas to make artwork sparkle perpetually
    this.canvasGlimmers = [];
    this.maxGlimmers = 450;

    // Resize observer / window sync
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2); // crisp retina support

    this.resize(this.width, this.height);
  }

  resize(w, h) {
    this.width = w;
    this.height = h;

    // Save existing drawing if any
    let tempCanvas = null;
    if (this.drawCanvas.width > 0 && this.drawCanvas.height > 0) {
      tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.drawCanvas.width;
      tempCanvas.height = this.drawCanvas.height;
      tempCanvas.getContext('2d').drawImage(this.drawCanvas, 0, 0);
    }

    [this.bgCanvas, this.drawCanvas, this.fxCanvas].forEach(c => {
      c.width = w * this.dpr;
      c.height = h * this.dpr;
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
    });

    [this.bgCtx, this.drawCtx, this.fxCtx].forEach(ctx => {
      ctx.scale(this.dpr, this.dpr);
    });

    this.renderBackground();

    // Restore drawn artwork
    if (tempCanvas) {
      this.drawCtx.save();
      this.drawCtx.drawImage(tempCanvas, 0, 0, tempCanvas.width / this.dpr, tempCanvas.height / this.dpr);
      this.drawCtx.restore();
    } else {
      this.saveHistoryState();
    }
  }

  renderBackground() {
    const ctx = this.bgCtx;
    const w = this.width;
    const h = this.height;

    // Deep cosmic midnight gradient with subtle purple vignette
    const grad = ctx.createRadialGradient(w * 0.5, h * 0.45, 100, w * 0.5, h * 0.5, Math.max(w, h) * 0.85);
    grad.addColorStop(0, '#0c071e'); // cosmic deep violet core
    grad.addColorStop(0.5, '#070514'); // obsidian midnight
    grad.addColorStop(1, '#020108'); // abyssal black edges

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle ethereal ambient nebula glow
    const nebulaGrad = ctx.createRadialGradient(w * 0.3, h * 0.3, 0, w * 0.3, h * 0.3, w * 0.45);
    nebulaGrad.addColorStop(0, 'rgba(88, 28, 135, 0.08)');
    nebulaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = nebulaGrad;
    ctx.fillRect(0, 0, w, h);
  }

  saveHistoryState() {
    try {
      const imgData = this.drawCtx.getImageData(0, 0, this.drawCanvas.width, this.drawCanvas.height);
      this.history.push(imgData);
      if (this.history.length > this.maxHistory) {
        this.history.shift();
      }
      this.redoStack = []; // clear redo on new action
    } catch (e) {
      console.warn('History snapshot failed', e);
    }
  }

  undo() {
    if (this.history.length <= 1) return false;
    const current = this.history.pop();
    this.redoStack.push(current);
    const prev = this.history[this.history.length - 1];

    this.drawCtx.putImageData(prev, 0, 0);
    this.canvasGlimmers = []; // refresh glimmers
    return true;
  }

  redo() {
    if (this.redoStack.length === 0) return false;
    const next = this.redoStack.pop();
    this.history.push(next);
    this.drawCtx.putImageData(next, 0, 0);
    this.canvasGlimmers = [];
    return true;
  }

  canUndo() {
    return this.history.length > 1;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clearCanvas() {
    this.saveHistoryState();
    this.drawCtx.clearRect(0, 0, this.width, this.height);
    this.canvasGlimmers = [];
  }

  startStroke(x, y) {
    this.isStrokeActive = true;
    this.lastPoint = { x, y };
    this.addGlitterStamp(x, y, 0);
  }

  endStroke() {
    if (this.isStrokeActive) {
      this.isStrokeActive = false;
      this.lastPoint = null;
      this.saveHistoryState();
    }
  }

  // Draw smooth continuous glitter ribbon between points
  drawSegmentTo(currX, currY) {
    if (!this.lastPoint) {
      this.startStroke(currX, currY);
      return;
    }

    const prevX = this.lastPoint.x;
    const prevY = this.lastPoint.y;
    const dx = currX - prevX;
    const dy = currY - prevY;
    const dist = Math.hypot(dx, dy);

    // Continuous sub-pixel stepping: stamp every 3.5 pixels
    const stepSize = Math.max(2.5, 5 - this.particleDensity * 0.5);
    const steps = Math.max(1, Math.floor(dist / stepSize));

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const interpX = prevX + dx * t;
      const interpY = prevY + dy * t;
      this.addGlitterStamp(interpX, interpY, dist);
    }

    this.lastPoint = { x: currX, y: currY };
  }

  // Add a cluster of realistic sparkling glitter particles around (x, y)
  addGlitterStamp(cx, cy, moveSpeed = 0) {
    const ctx = this.drawCtx;
    const baseRadius = this.brushSize;
    const density = Math.floor(6 * this.particleDensity);
    const paletteKey = this.currentPalette;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter'; // magical additive glow

    // 1. Soft glowing core along the path
    const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 0.9);
    coreGlow.addColorStop(0, getPaletteGlow(paletteKey));
    coreGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius * 0.9, 0, Math.PI * 2);
    ctx.fill();

    // 2. Scatter sparkling glitter flecks
    for (let i = 0; i < density; i++) {
      // Gaussian distribution for natural dense center with loose perimeter dust
      const angle = Math.random() * Math.PI * 2;
      const radDist = (Math.random() ** 1.8) * baseRadius * this.scatter;
      const px = cx + Math.cos(angle) * radDist;
      const py = cy + Math.sin(angle) * radDist;

      const pSize = (0.7 + Math.random() * 2.2) * this.intensity;
      const color = getRandomColorFromPalette(paletteKey);
      const alpha = 0.6 + Math.random() * 0.4;

      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.fill();

      // Occasionally add persistent star twinkle points
      if (Math.random() < 0.12 && this.canvasGlimmers.length < this.maxGlimmers) {
        this.canvasGlimmers.push({
          x: px,
          y: py,
          size: pSize * 2.5,
          color: color,
          paletteKey: paletteKey,
          twinkleSpeed: 0.05 + Math.random() * 0.08,
          twinklePhase: Math.random() * Math.PI * 2
        });
      }
    }

    // 3. Crisp diamond highlight stars directly on the stroke
    if (Math.random() < 0.35) {
      const starColor = getRandomColorFromPalette(paletteKey);
      const starSize = (2 + Math.random() * 3.5) * this.intensity;
      this.drawDiamondStar(ctx, cx + (Math.random() - 0.5) * baseRadius * 0.5, cy + (Math.random() - 0.5) * baseRadius * 0.5, starSize, starColor);
    }

    ctx.restore();
  }

  // Draw 4-pointed diamond star flare on canvas
  drawDiamondStar(ctx, x, y, size, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    // 4 sharp flares
    ctx.moveTo(x, y - size);
    ctx.quadraticCurveTo(x, y, x + size, y);
    ctx.quadraticCurveTo(x, y, x, y + size);
    ctx.quadraticCurveTo(x, y, x - size, y);
    ctx.quadraticCurveTo(x, y, x, y - size);
    ctx.closePath();
    ctx.fill();

    // Hot white center
    ctx.beginPath();
    ctx.arc(x, y, size * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.restore();
  }

  // Erase smooth area under palm or eraser pointer
  eraseAt(cx, cy, radius = this.eraserRadius) {
    const ctx = this.drawCtx;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';

    // Soft feathered circular mask for natural erasing
    const grad = ctx.createRadialGradient(cx, cy, radius * 0.4, cx, cy, radius);
    grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
    grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.85)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Filter out removed glimmers
    const r2 = radius * radius;
    this.canvasGlimmers = this.canvasGlimmers.filter(g => {
      const dx = g.x - cx;
      const dy = g.y - cy;
      return (dx * dx + dy * dy) > r2;
    });
  }

  // Render perpetually twinkling glimmers over drawn artwork
  renderGlimmers(fxCtx) {
    if (this.canvasGlimmers.length === 0) return;
    fxCtx.save();
    fxCtx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < this.canvasGlimmers.length; i++) {
      const g = this.canvasGlimmers[i];
      g.twinklePhase += g.twinkleSpeed;
      const val = Math.sin(g.twinklePhase);
      if (val > 0.4) {
        const alpha = (val - 0.4) / 0.6;
        const outer = g.size * (1 + 0.5 * val);

        fxCtx.fillStyle = g.color;
        fxCtx.globalAlpha = alpha * 0.85;

        // Draw cross flare
        fxCtx.beginPath();
        fxCtx.moveTo(g.x, g.y - outer);
        fxCtx.lineTo(g.x, g.y + outer);
        fxCtx.moveTo(g.x - outer, g.y);
        fxCtx.lineTo(g.x + outer, g.y);
        fxCtx.lineWidth = 1.2;
        fxCtx.strokeStyle = '#FFFFFF';
        fxCtx.stroke();

        fxCtx.beginPath();
        fxCtx.arc(g.x, g.y, outer * 0.3, 0, Math.PI * 2);
        fxCtx.fillStyle = '#FFFFFF';
        fxCtx.fill();
      }
    }
    fxCtx.restore();
  }

  // Export artwork as high-resolution PNG
  exportArtwork(includeBackground = true) {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this.drawCanvas.width;
    exportCanvas.height = this.drawCanvas.height;
    const expCtx = exportCanvas.getContext('2d');

    if (includeBackground) {
      // Draw background
      expCtx.drawImage(this.bgCanvas, 0, 0);
    }

    // Draw the artwork
    expCtx.drawImage(this.drawCanvas, 0, 0);

    // Subtle artist watermark in bottom right corner
    if (includeBackground) {
      expCtx.save();
      expCtx.font = `italic ${Math.round(14 * this.dpr)}px Inter, sans-serif`;
      expCtx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      expCtx.textAlign = 'right';
      expCtx.fillText('AI Glitter Canvas ✨', exportCanvas.width - 24 * this.dpr, exportCanvas.height - 24 * this.dpr);
      expCtx.restore();
    }

    const dataUrl = exportCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    link.download = `glitter-art-${timestamp}.png`;
    link.href = dataUrl;
    link.click();

    return true;
  }
}
