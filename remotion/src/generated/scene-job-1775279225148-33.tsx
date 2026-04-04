import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';

const mapPoints = [
  { x: 350, y: 280 }, { x: 450, y: 300 }, { x: 500, y: 350 }, { x: 400, y: 320 }, { x: 380, y: 250 },
  { x: 480, y: 480 }, { x: 520, y: 550 }, { x: 490, y: 620 }, { x: 450, y: 530 },
  { x: 900, y: 280 }, { x: 950, y: 300 }, { x: 980, y: 260 }, { x: 920, y: 240 },
  { x: 950, y: 420 }, { x: 980, y: 480 }, { x: 960, y: 550 }, { x: 920, y: 470 },
  { x: 1100, y: 300 }, { x: 1200, y: 280 }, { x: 1300, y: 320 }, { x: 1350, y: 280 }, 
  { x: 1400, y: 350 }, { x: 1150, y: 350 }, { x: 1250, y: 380 }, { x: 1350, y: 400 },
  { x: 1350, y: 650 }, { x: 1400, y: 680 }, { x: 1300, y: 660 }, { x: 1380, y: 720 }
];

export const AiFreeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A192F' }}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080">
        <path d="M300,220 L450,180 L550,250 L530,380 L420,400 L320,350 L280,300 Z" fill={theme.card} opacity={0.3} />
        <path d="M430,430 L550,410 L580,520 L530,650 L460,630 L420,520 Z" fill={theme.card} opacity={0.3} />
        <path d="M880,220 L960,190 L1020,230 L990,310 L920,320 L870,280 Z" fill={theme.card} opacity={0.3} />
        <path d="M900,380 L1000,360 L1040,460 L990,600 L920,580 L880,460 Z" fill={theme.card} opacity={0.3} />
        <path d="M1050,200 L1250,170 L1450,230 L1400,380 L1250,420 L1100,380 L1050,280 Z" fill={theme.card} opacity={0.3} />
        <path d="M1280,620 L1420,600 L1470,700 L1380,750 L1280,710 Z" fill={theme.card} opacity={0.3} />

        {mapPoints.map((point, index) => {
          const delay = index * 4;
          const progress = spring({
            frame: frame - delay,
            fps,
            config: { damping: 200, stiffness: 100 },
          });

          const rippleProgress = interpolate(frame - delay, [0, 40], [0, 1], {
            extrapolateRight: 'clamp',
          });
          const rippleScale = interpolate(rippleProgress, [0, 1], [0.5, 3]);
          const rippleOpacity = interpolate(rippleProgress, [0, 1], [0.6, 0]);

          if (frame < delay) return null;

          return (
            <g key={index} transform={`translate(${point.x}, ${point.y})`}>
              <circle
                r={20 * rippleScale}
                fill="none"
                stroke={theme.accent}
                strokeWidth="2"
                opacity={rippleOpacity}
              />
              <circle r={6 * progress} fill={theme.accent} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};