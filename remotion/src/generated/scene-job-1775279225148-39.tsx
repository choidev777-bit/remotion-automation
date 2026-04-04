import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';

const particles = Array.from({ length: 60 }).map((_, i) => ({
  angle: Math.random() * 360,
  distance: Math.random() * 400 + 150,
  size: Math.random() * 15 + 5,
  delay: Math.random() * 30,
  color: i % 2 === 0 ? theme.accent : theme.primary,
}));

export const AiFreeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const textScale = spring({
    frame,
    fps,
    config: { damping: 200, mass: 0.5, stiffness: 100 },
  });
  const textGlow = interpolate(frame, [0, 90], [0, 20]);

  const bgGradientOpacity = interpolate(frame, [0, 120], [0, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at center, ${theme.accent}30 0%, ${theme.primary}15 60%, transparent 100%)`,
          opacity: bgGradientOpacity,
        }}
      />

      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: 'absolute' }}>
        {particles.map((p, i) => {
          const rad = (p.angle * Math.PI) / 180;
          const dist = interpolate(frame - p.delay, [0, 90], [0, p.distance], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const opacity = interpolate(frame - p.delay, [0, 90], [1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const rotation = interpolate(frame, [0, 90], [0, 360]);

          if (frame < p.delay) return null;

          const x = 960 + Math.cos(rad) * dist;
          const y = 540 + Math.sin(rad) * dist;

          return (
            <path
              key={i}
              d={`M${x} ${y - p.size} L${x + p.size / 4} ${y} L${x} ${y + p.size} L${x - p.size / 4} ${y} Z`}
              fill={p.color}
              opacity={opacity}
              transform={`rotate(${rotation}, ${x}, ${y})`}
            />
          );
        })}
      </svg>

      <div
        style={{
          fontSize: 200,
          fontWeight: 900,
          color: theme.text,
          transform: `scale(${textScale})`,
          textShadow: `0 0 ${textGlow}px ${theme.accent}, 0 0 ${textGlow * 2}px ${theme.primary}`,
          zIndex: 2,
          position: 'relative',
          letterSpacing: '0.05em',
        }}
      >
        도전
      </div>
    </AbsoluteFill>
  );
};