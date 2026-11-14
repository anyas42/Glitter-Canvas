// Web Audio API Synthesizer for Magical Glitter Audio FX

class MagicalAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.lastDrawSoundTime = 0;
    this.drawFreqIndex = 0;
    // Pentatonic scale frequencies for harmonious fairy sparkle sounds
    this.scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.50, 1174.66, 1318.51];
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  // Soft sparkle twinkle when finger moves while drawing
  playDrawSparkle(speed = 1) {
    if (this.isMuted) return;
    const now = performance.now();
    if (now - this.lastDrawSoundTime < 80) return; // rate limit for smooth audio
    this.lastDrawSoundTime = now;

    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const baseFreq = this.scale[this.drawFreqIndex % this.scale.length];
      this.drawFreqIndex = (this.drawFreqIndex + 1) % this.scale.length;

      // Add a slight shimmer/vibrato
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * (0.95 + Math.random() * 0.1), this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.ctx.currentTime + 0.12);

      const volume = Math.min(0.08, 0.03 + speed * 0.02);
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.16);
    } catch (e) {
      // Audio context might be restricted before interaction
    }
  }

  // Spectacular burst sound effect when pinch gesture explodes sparkles
  playSparkleBurst() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Play 4 rapid staggered sparkling bells
      const chord = [880.0, 1108.73, 1318.51, 1760.0];
      chord.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.8, now + idx * 0.04 + 0.3);

        gain.gain.setValueAtTime(0.08, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.45);
      });
    } catch (e) {}
  }

  // Harmonic chime when changing color palette
  playColorChange() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [659.25, 880.0, 1318.51]; // E5, A5, E6
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);

        gain.gain.setValueAtTime(0.09, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.38);
      });
    } catch (e) {}
  }

  // Smooth airy whoosh when eraser is wiping
  playEraserSwoosh() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = performance.now();
    if (now - this.lastDrawSoundTime < 200) return;
    this.lastDrawSoundTime = now;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.26);
    } catch (e) {}
  }
}

export const audioFx = new MagicalAudio();
