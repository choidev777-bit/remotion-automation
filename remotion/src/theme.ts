export const theme = {
  colors: {
    bg: '#F9FAFB',
    text: '#000000',
    primary: '#09E85E',
    accent: '#F5B700',
    card: '#FFFFFF',
    border: '#E5E7EB',
    textMuted: '#6B7280',
  },
  font: {
    family: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
    size: {
      hero: 72,
      h1: 56,
      h2: 40,
      h3: 28,
      body: 24,
      small: 18,
    },
    weight: {
      regular: 400,
      medium: 500,
      bold: 700,
      black: 900,
    },
  },
  spacing: {
    xs: 8,
    sm: 16,
    md: 32,
    lg: 48,
    xl: 64,
    xxl: 96,
  },
  radius: {
    sm: 8,
    md: 16,
    lg: 24,
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
