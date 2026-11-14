// Color Palettes and Glitter Aesthetics Definition

export const PALETTES = {
  gold: {
    id: 'gold',
    name: '24K Imperial Gold',
    primary: '#FFD700',
    secondary: '#FFA500',
    tertiary: '#FFE082',
    highlight: '#FFFFFF',
    glow: 'rgba(255, 215, 0, 0.7)',
    colors: ['#FFD700', '#FFE57F', '#FFC107', '#FFA000', '#FFF8E1', '#FFFFFF'],
    swatch: 'linear-gradient(135deg, #FFE259 0%, #FFA751 100%)'
  },
  silver: {
    id: 'silver',
    name: 'Starlight Silver',
    primary: '#E2E8F0',
    secondary: '#CBD5E1',
    tertiary: '#94A3B8',
    highlight: '#FFFFFF',
    glow: 'rgba(226, 232, 240, 0.7)',
    colors: ['#FFFFFF', '#F8FAFC', '#E2E8F0', '#CBD5E1', '#94A3B8', '#E0F2FE'],
    swatch: 'linear-gradient(135deg, #FFFFFF 0%, #94A3B8 100%)'
  },
  pink: {
    id: 'pink',
    name: 'Neon Hot Pink',
    primary: '#FF1493',
    secondary: '#FF69B4',
    tertiary: '#FF80DF',
    highlight: '#FFF0F5',
    glow: 'rgba(255, 20, 147, 0.75)',
    colors: ['#FF1493', '#FF69B4', '#FF85C0', '#F72585', '#FFB6C1', '#FFFFFF'],
    swatch: 'linear-gradient(135deg, #FF1493 0%, #FF80DF 100%)'
  },
  purple: {
    id: 'purple',
    name: 'Cosmic Amethyst',
    primary: '#A855F7',
    secondary: '#8B5CF6',
    tertiary: '#C084FC',
    highlight: '#F3E8FF',
    glow: 'rgba(168, 85, 247, 0.75)',
    colors: ['#A855F7', '#8B5CF6', '#7C3AED', '#C084FC', '#E9D5FF', '#FFFFFF'],
    swatch: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)'
  },
  electricBlue: {
    id: 'electricBlue',
    name: 'Electric Cyan Blue',
    primary: '#00F0FF',
    secondary: '#0099FF',
    tertiary: '#38BDF8',
    highlight: '#E0F7FF',
    glow: 'rgba(0, 240, 255, 0.8)',
    colors: ['#00F0FF', '#00B4D8', '#0077B6', '#38BDF8', '#90E0EF', '#FFFFFF'],
    swatch: 'linear-gradient(135deg, #00F0FF 0%, #0072FF 100%)'
  },
  rainbow: {
    id: 'rainbow',
    name: 'Chromatic Rainbow',
    isRainbow: true,
    primary: '#FF007F',
    secondary: '#00F0FF',
    tertiary: '#FFD700',
    highlight: '#FFFFFF',
    glow: 'rgba(255, 255, 255, 0.85)',
    colors: ['#FF0055', '#FF7700', '#FFDD00', '#00FF66', '#00F0FF', '#7928CA', '#FF007F'],
    swatch: 'linear-gradient(135deg, #FF007F, #FF7700, #FFDD00, #00FF66, #00F0FF, #7928CA)'
  },
  emeraldGreen: {
    id: 'emeraldGreen',
    name: 'Mythic Emerald',
    primary: '#00FF88',
    secondary: '#10B981',
    tertiary: '#34D399',
    highlight: '#D1FAE5',
    glow: 'rgba(0, 255, 136, 0.75)',
    colors: ['#00FF88', '#10B981', '#059669', '#34D399', '#6EE7B7', '#FFFFFF'],
    swatch: 'linear-gradient(135deg, #00FF88 0%, #047857 100%)'
  },
  roseGold: {
    id: 'roseGold',
    name: 'Luxe Rose Gold',
    primary: '#F472B6',
    secondary: '#FB7185',
    tertiary: '#FBBF24',
    highlight: '#FFF1F2',
    glow: 'rgba(244, 114, 182, 0.75)',
    colors: ['#F472B6', '#FB7185', '#FDA4AF', '#FCD34D', '#FDE68A', '#FFFFFF'],
    swatch: 'linear-gradient(135deg, #F472B6 0%, #F59E0B 100%)'
  }
};

export const PALETTE_KEYS = Object.keys(PALETTES);

let rainbowHueCounter = 0;

export function getRandomColorFromPalette(paletteKey) {
  const palette = PALETTES[paletteKey] || PALETTES.gold;
  if (palette.isRainbow) {
    rainbowHueCounter = (rainbowHueCounter + 7) % 360;
    return `hsl(${rainbowHueCounter}, 100%, 65%)`;
  }
  const colors = palette.colors;
  return colors[Math.floor(Math.random() * colors.length)];
}

export function getPaletteGlow(paletteKey) {
  const palette = PALETTES[paletteKey] || PALETTES.gold;
  if (palette.isRainbow) {
    return `hsla(${rainbowHueCounter}, 100%, 65%, 0.8)`;
  }
  return palette.glow;
}
