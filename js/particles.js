// High-Performance Magical Glitter Particle Physics Engine

import { getRandomColorFromPalette } from './palette.js';

export class ParticleSystem {
  constructor() {
    this.sparkles = []; // Active floating particles for cursor aura, bursts, and transient glitter
    this.ambientStars = []; // Background stardust
    this.maxSparkles = 1200;
  }

  initAmbientStars(width, height) {
    this.ambientStars = [];
    const count = Math.floor((width * height) / 12000);
    for (let i = 0; i < count; i++) {
      this.ambientStars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        baseRadius: 0.6 + Math.random() * 1.5,
        alpha: 0.2 + Math.random() * 0.6,
        twinkleSpeed: 0.02 + Math.random() * 0.04,
        twinklePhase: Math.random() * Math.PI * 2,
        color: Math.random() > 0.4 ? '#FFFFFF' : (Math.random() > 0.5 ? '#E0F2FE' : '#F3E8FF')
      });
    }
  }

  // Draw 4-point diamond sparkle star ✨
  drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius, rotation = 0, color = '#FFFFFF', alpha = 1) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.fillStyle = color;

    ctx.beginPath();
    // 4 primary sharp points with curved concave sides
    const step = Math.PI / spikes;
    let rot = -Math.PI / 2;

    for (let i = 0; i < spikes; i++) {
      let x = Math.cos(rot) * outerRadius;
      let y = Math.sin(rot) * outerRadius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      rot += step;

      x = Math.cos(rot) * innerRadius;
      y = Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.closePath();
    ctx.fill();

    // Central bright core
    ctx.beginPath();
    ctx.arc(0, 0, innerRadius * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    ctx.restore();
  }

  // Generate a burst of sparkles (used on pinch gesture and special effects)
  createSparkleBurst(x, y, paletteKey, count = 70, intensity = 1) {
    const burstCount = Math.floor(count * intensity);
    for (let i = 0; i < burstCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 9 * intensity;
      const size = 1.5 + Math.random() * 4.5;
      const isStar = Math.random() > 0.35;
      const color = getRandomColorFromPalette(paletteKey);

      this.sparkles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2, // slight upward kick
        friction: 0.93 + Math.random() * 0.04,
        gravity: 0.07 + Math.random() * 0.05,
        size: size,
        color: color,
        alpha: 1,
        decay: 0.012 + Math.random() * 0.02,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        isStar: isStar,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.2 + Math.random() * 0.3
      });
    }
  }

  // Generate transient cursor sparkles around fingertip
  createCursorAura(x, y, paletteKey, count = 3, intensity = 1) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 18 * intensity;
      const color = getRandomColorFromPalette(paletteKey);

      this.sparkles.push({
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5 - 0.5,
        friction: 0.95,
        gravity: -0.02, // float gently upward
        size: 1 + Math.random() * 2.8,
        color: color,
        alpha: 0.9,
        decay: 0.03 + Math.random() * 0.04,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.15,
        isStar: Math.random() > 0.45,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.25
      });
    }
  }

  // Update dynamic sparkles (physics & decay)
  update() {
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const p = this.sparkles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.vy += p.gravity;
      p.rotation += p.rotationSpeed;
      p.alpha -= p.decay;
      p.twinklePhase += p.twinkleSpeed;

      if (p.alpha <= 0 || p.size <= 0.1) {
        this.sparkles.splice(i, 1);
      }
    }

    // Safety cap
    if (this.sparkles.length > this.maxSparkles) {
      this.sparkles.splice(0, this.sparkles.length - this.maxSparkles);
    }
  }

  // Render transient sparkles and stars to the overlay FX canvas
  renderFX(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < this.sparkles.length; i++) {
      const p = this.sparkles[i];
      const twinkle = 0.7 + 0.3 * Math.sin(p.twinklePhase);
      const renderAlpha = Math.max(0, p.alpha * twinkle);

      if (p.isStar) {
        const outer = p.size * 2.8 * twinkle;
        const inner = outer * 0.25;
        this.drawStar(ctx, p.x, p.y, 4, outer, inner, p.rotation, p.color, renderAlpha);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * twinkle, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = renderAlpha;
        ctx.fill();

        // Extra glowing core
        if (p.size > 2) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.globalAlpha = renderAlpha;
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }

  // Render ambient celestial background stars
  renderAmbientStars(ctx) {
    ctx.save();
    for (let i = 0; i < this.ambientStars.length; i++) {
      const s = this.ambientStars[i];
      s.twinklePhase += s.twinkleSpeed;
      const alpha = s.alpha * (0.6 + 0.4 * Math.sin(s.twinklePhase));

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.baseRadius, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = alpha;
      ctx.fill();
    }
    ctx.restore();
  }
}
