export const theme = {
  colors: {
    bg: '#0E0E0E',
    text: '#FDFFFF',
    primary: '#00C896',
    accent: '#FFCF00',
    card: '#1A1A1A',
    border: '#2A2A2A',
    textMuted: '#7A7978',
    primaryGlow: 'rgba(0, 200, 150, 0.15)',
  },
  font: {
    family: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
    size: {
      hero: 120,
      h1: 88,
      h2: 64,
      h3: 40,
      body: 32,
      small: 24,
    },
    weight: {
      regular: 400,
      medium: 500,
      bold: 700,
      black: 900,
    },
  },
  spacing: {
    xs: 12,
    sm: 24,
    md: 48,
    lg: 64,
    xl: 80,
    xxl: 120,
  },
  radius: {
    sm: 12,
    md: 20,
    lg: 32,
    full: 9999,
  },
  animation: {
    duration: {
      fast: 15,
      normal: 20,
      slow: 30,
    },
    spring: {
      damping: 15,
      stiffness: 100,
      mass: 1,
    },
    stagger: 8,
  },
  video: {
    width: 1920,
    height: 1080,
    fps: 30,
  },
} as const;

export type Theme = typeof theme;
