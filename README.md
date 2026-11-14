# ✨ AI Hand Gesture Controlled Glitter Canvas

A visually stunning, real-time interactive art installation web application that turns your laptop webcam into a magical glitter wand. Track your hands in real time and draw glowing, sparkling glitter ribbons in the air.

![AI Glitter Canvas](https://img.shields.io/badge/MediaPipe-Hands%20AI-00F0FF?style=for-the-badge)
![Web Audio](https://img.shields.io/badge/Web%20Audio-Synthesizer-FFD700?style=for-the-badge)
![Canvas 60FPS](https://img.shields.io/badge/Canvas-60FPS%20Retina-FF1493?style=for-the-badge)

---

## 🌟 Key Features

1. **AI Hand Tracking & Air Drawing**:
   - Ultra-low latency tracking using **MediaPipe Hands** in the browser.
   - Index fingertip acts as the luminous drawing pointer.
   - Adaptive exponential smoothing filter eliminates jitter while maintaining instant responsiveness.
   - Continuous sub-pixel interpolation prevents gaps during fast hand strokes.

2. **Magical Glitter Particle Engine**:
   - Multi-layer canvas with additive glow blending (`lighter`).
   - Faceted glitter flecks, 4-point diamond starbursts (✨), and cosmic dust motes.
   - Perpetual glimmer twinkling so your drawn artwork stays glistening and alive.
   - Firework-style sparkle explosion bursts on pinch gesture.

3. **5 Intuitive AI Hand Gestures**:
   - ☝️ **Index Finger Raised**: **DRAW** continuous glowing glitter ribbons.
   - 🖐️ **Open Palm**: **ERASE** portions of the artwork with a soft holographic eraser aura.
   - ✊ **Closed Fist**: **PAUSE** drawing (freely hover cursor across screen without painting).
   - ✌️ **Two Fingers Raised (Peace)**: **CHANGE COLOUR** (radial charging arc cycles through 8 palettes with a crystal chime).
   - 👌 **Thumb & Index Pinch**: **SPARKLE BURST** (detonates a spectacular firework shower of starry sparkles).

4. **8 Luxury Glitter Palettes**:
   - 🌟 **24K Imperial Gold**
   - ❄️ **Starlight Silver**
   - 💖 **Neon Hot Pink**
   - 💜 **Cosmic Amethyst**
   - ⚡ **Electric Cyan Blue**
   - 🌈 **Chromatic Rainbow**
   - 🍃 **Mythic Emerald**
   - 🌸 **Luxe Rose Gold**

5. **Luxury Glassmorphism UI**:
   - Deep midnight purple & cosmic stardust background.
   - Floating glassmorphism tool panel with live sliders:
     - **Brush Size** (6px to 42px)
     - **Particle Density** (Low, Medium, High, Ultra)
     - **Glow & Sparkle Intensity** (50% to 200%)
     - **Scatter Dust** (Sharp to Cosmic Dust)
   - Real-time gesture HUD badge with dynamic glowing states.
   - Picture-in-Picture webcam preview with skeletal wireframe overlay toggle and FPS meter.
   - Built-in Web Audio API synthesizer for fairy chimes, sparkle sweeps, and burst bells.

6. **Artwork Management**:
   - **Undo & Redo** with 25 snapshot history stack.
   - **Clear Canvas** button.
   - **Save Artwork**: Export high-resolution PNG with either **Cosmic Midnight Background** or **Transparent PNG** (strokes only).
   - Full mouse & trackpad fallback drawing mode.

---

## 🚀 How to Run Locally

### Option 1: Using Node.js (Recommended)

1. Open your Terminal and navigate to the project directory:
   ```bash
   cd /Users/anyasingh/.gemini/antigravity/scratch/glitter-canvas
   ```

2. Start the local server:
   ```bash
   npm start
   ```
   *(Or simply `node server.js`)*

3. Open your browser (Google Chrome, Brave, or Safari recommended for MediaPipe):
   ```
   http://localhost:3000
   ```

### Option 2: Using Python 3

```bash
cd /Users/anyasingh/.gemini/antigravity/scratch/glitter-canvas
python3 -m http.server 3000
```
Then visit `http://localhost:3000`.

---

## 🖐️ Gesture Cheat Sheet

| Gesture | Action | Visual Feedback | Sound Effect |
| :--- | :--- | :--- | :--- |
| **☝️ Index Up** | **Draw** | Glowing cursor aura + continuous glitter ribbon | Sparkling chime arpeggios |
| **🖐️ Open Palm** | **Erase** | Holographic pink dashed circle wipes canvas | Soft airy whoosh |
| **✊ Closed Fist** | **Pause** | Starlight idle dot, no drawing | Silent |
| **✌️ Two Fingers** | **Change Color** | Blue charging ring around finger cycles palette | Ascending crystal bells |
| **👌 Pinch** | **Sparkle Burst** | Explosive firework of 80+ floating star sparkles | Cascading bell chime |

---

## ⌨️ Keyboard Shortcuts

- `Ctrl + Z` / `Cmd + Z`: Undo
- `Ctrl + Y` / `Cmd + Shift + Z`: Redo
- `C`: Clear Canvas
- `S`: Save Artwork modal
- `M`: Toggle Sound FX Mute/Unmute
- `T`: Open Hand Gesture Tutorial
- `1` – `8`: Quick select glitter palettes
- `Mouse Left Drag`: Draw with glitter
- `Mouse Right Drag` / `Shift + Drag`: Erase
- `Double Click`: Sparkle Burst

---

## 💡 Tips for the Best Experience

1. **Lighting**: Ensure your hand is reasonably well lit against the background for high-confidence landmark tracking.
2. **Camera Distance**: Keep your hand approximately 1.5 to 3 feet from your laptop webcam so your hand is fully visible in frame.
3. **MacBook Camera Permissions**: When prompted by your browser, click **"Allow"** to grant camera access. On macOS, ensure your browser has camera access enabled under *System Settings > Privacy & Security > Camera*.
4. **Retina Display Crispness**: The canvas automatically detects your Mac's `devicePixelRatio` to render razor-sharp glitter particles on Retina screens.
