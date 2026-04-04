import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';

export const AiFreeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Arrow animation
  const arrowScale = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });
  const arrowOpacity = interpolate(frame, [15, 30], [0, 1], { extrapolateLeft: 'clamp' });

  // Left side people icons stagger
  const peopleOpacity = (index: number) => {
    const delay = 20 + index * 5;
    return interpolate(frame, [delay, delay + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  };
  const peopleSlideX = (index: number) => {
    const delay = 20 + index * 5;
    return interpolate(frame, [delay, delay + 15], [-40 - index * 10, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  };

  // Left floating text
  const leftTextY = interpolate(frame % 120, [0, 60, 120], [-6, 6, -6]);
  const leftTextOpacity = interpolate(frame, [40, 55], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Robot icon spring
  const robotDelay = 25;
  const robotScale = spring({ frame: Math.max(0, frame - robotDelay), fps, config: { damping: 10, stiffness: 100 } });
  const robotOpacity = interpolate(frame, [robotDelay, robotDelay + 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Right floating text
  const rightTextY = interpolate(frame % 100, [0, 50, 100], [-5, 5, -5]);
  const rightTextOpacity = interpolate(frame, [35, 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Bottom glow text
  const bottomTextOpacity = interpolate(frame, [50, 65], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const glowPulse = interpolate(frame % 90, [0, 45, 90], [0.4, 1, 0.4]);
  const glowBlur = interpolate(frame % 90, [0, 45, 90], [4, 12, 4]);

  // VS badge
  const vsScale = spring({ frame: Math.max(0, frame - 30), fps, config: { damping: 8, stiffness: 120 } });

  // Person icon SVG component
  const PersonIcon = ({ x, opacity, offsetX, color }: { x: number; opacity: number; offsetX: number; color: string }) => (
    <g style={{ transform: `translateX(${offsetX}px)`, opacity }}>
      <circle cx={x} cy="85" r="12" fill={color} />
      <path d={`M${x - 16},115 Q${x - 16},100 ${x},100 Q${x + 16},100 ${x + 16},115 L${x + 16},128 Q${x + 16},132 ${x + 12},132 L${x + 8},132 L${x + 6},145 L${x - 6},145 L${x - 8},132 L${x - 12},132 Q${x - 16},132 ${x - 16},128 Z`} fill={color} />
    </g>
  );

  // Robot icon SVG
  const RobotIcon = () => (
    <g>
      {/* Antenna */}
      <line x1="100" y1="30" x2="100" y2="15" stroke={theme.primary} strokeWidth="3" />
      <circle cx="100" cy="12" r="5" fill={theme.primary} />
      {/* Head */}
      <rect x="75" y="30" width="50" height="40" rx="8" fill={theme.primary} />
      {/* Eyes */}
      <rect x="85" y="42" width="10" height="10" rx="2" fill="#0E0E0E" />
      <rect x="105" y="42" width="10" height="10" rx="2" fill="#0E0E0E" />
      {/* Eye pupils */}
      <rect x="88" y="45" width="4" height="4" rx="1" fill="#FDFFFF" />
      <rect x="108" y="45" width="4" height="4" rx="1" fill="#FDFFFF" />
      {/* Mouth */}
      <rect x="88" y="58" width="24" height="4" rx="2" fill="#0E0E0E" />
      {/* Body */}
      <rect x="80" y="72" width="40" height="45" rx="6" fill={theme.primary} opacity="0.85" />
      {/* Body detail */}
      <rect x="90" y="82" width="20" height="3" rx="1.5" fill="#0E0E0E" opacity="0.3" />
      <rect x="90" y="90" width="20" height="3" rx="1.5" fill="#0E0E0E" opacity="0.3" />
      {/* Arms */}
      <rect x="62" y="76" width="16" height="12" rx="4" fill={theme.primary} opacity="0.7" />
      <rect x="122" y="76" width="16" height="12" rx="4" fill={theme.primary} opacity="0.7" />
      {/* Legs */}
      <rect x="85" y="118" width="12" height="20" rx="4" fill={theme.primary} opacity="0.7" />
      <rect x="103" y="118" width="12" height="20" rx="4" fill={theme.primary} opacity="0.7" />
    </g>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg, fontFamily: 'sans-serif', overflow: 'hidden' }}>
      {/* Left panel - dark */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '48%',
          height: '100%',
          background: `linear-gradient(135deg, #0E0E0E 0%, #1a1a1a 100%)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Cost label badges */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            display: 'flex',
            gap: 10,
            opacity: leftTextOpacity,
            transform: `translateY(${leftTextY}px)`,
          }}
        >
          {['인건비', '복리후생', '4대보험'].map((label, i) => (
            <div
              key={label}
              style={{
                backgroundColor: 'rgba(255, 60, 60, 0.15)',
                border: '1px solid rgba(255, 60, 60, 0.4)',
                borderRadius: 8,
                padding: '8px 16px',
                color: '#FF6B6B',
                fontSize: 18,
                fontWeight: 700,
                opacity: interpolate(frame, [45 + i * 6, 55 + i * 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
                transform: `translateY(${interpolate(frame, [45 + i * 6, 55 + i * 6], [15, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Overlapping people icons */}
        <svg width="200" height="160" viewBox="0 0 200 160">
          {[0, 1, 2, 3, 4].map((i) => (
            <PersonIcon
              key={i}
              x={60 + i * 22}
              opacity={peopleOpacity(i) * (0.5 + i * 0.1)}
              offsetX={peopleSlideX(i)}
              color={`rgba(255, 107, 107, ${0.35 + i * 0.05})`}
            />
          ))}
        </svg>

        {/* X mark */}
        <div
          style={{
            opacity: leftTextOpacity,
            marginTop: 12,
          }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40">
            <line x1="8" y1="8" x2="32" y2="32" stroke="#FF6B6B" strokeWidth="4" strokeLinecap="round" />
            <line x1="32" y1="8" x2="8" y2="32" stroke="#FF6B6B" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Right panel - bright */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: '48%',
          height: '100%',
          background: `linear-gradient(135deg, #0d1f1a 0%, #0a2e22 100%)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Cost text */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            opacity: rightTextOpacity,
            transform: `translateY(${rightTextY}px)`,
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(0, 200, 150, 0.12)',
              border: `1px solid rgba(0, 200, 150, 0.35)`,
              borderRadius: 8,
              padding: '8px 20px',
              color: theme.primary,
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            월 구독료 몇 만 원
          </div>
        </div>

        {/* Robot icon */}
        <div
          style={{
            opacity: robotOpacity,
            transform: `scale(${robotScale})`,
          }}
        >
          <svg width="200" height="150" viewBox="60 0 80 150">
            <RobotIcon />
          </svg>
        </div>

        {/* Check mark */}
        <div style={{ opacity: rightTextOpacity, marginTop: 12 }}>
          <svg width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" fill="none" stroke={theme.primary} strokeWidth="3" />
            <polyline points="12,20 18,26 28,14" fill="none" stroke={theme.primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Center large arrow */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) scale(${arrowScale})`,
          opacity: arrowOpacity,
          zIndex: 10,
        }}
      >
        <svg width="120" height="120" viewBox="0 0 120 120">
          {/* Arrow body */}
          <defs>
            <linearGradient id="arrowGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FF6B6B" />
              <stop offset="100%" stopColor={theme.primary} />
            </linearGradient>
            <filter id="arrowShadow">
              <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor={theme.primary} floodOpacity="0.5" />
            </filter>
          </defs>
          {/* Left side (red fading) */}
          <polygon points="10,50 55,50 55,35 85,60 55,85 55,70 10,70" fill="url(#arrowGrad)" filter="url(#arrowShadow)" />
        </svg>
      </div>

      {/* VS badge at top center */}
      <div
        style={{
          position: 'absolute',
          top: '8%',
          left: '50%',
          transform: `translate(-50%, 0) scale(${vsScale})`,
          zIndex: 15,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: `linear-gradient(135deg, #FF6B6B, ${theme.primary})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 900,
            color: theme.text,
            boxShadow: `0 0 20px rgba(0, 200, 150, 0.4)`,
          }}
        >
          VS
        </div>
      </div>

      {/* Bottom glowing text */}
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          opacity: bottomTextOpacity,
          zIndex: 10,
        }}
      >
        {/* Glow layer */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            height: 60,
            backgroundColor: theme.primary,
            borderRadius: 30,
            filter: `blur(${glowBlur}px)`,
            opacity: glowPulse * 0.35,
          }}
        />
        {/* Text */}
        <div
          style={{
            position: 'relative',
            fontSize: 32,
            fontWeight: 800,
            color: theme.primary,
            letterSpacing: 2,
            textShadow: `0 0 10px rgba(0, 200, 150, ${glowPulse * 0.6})`,
          }}
        >
          초기 자본 최소화
        </div>
        <div
          style={{
            position: 'relative',
            fontSize: 15,
            fontWeight: 500,
            color: theme.textMuted,
            marginTop: 8,
            opacity: interpolate(frame, [65, 80], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          }}
        >
          최소의 비용으로 최대의 효율을 경험하세요
        </div>
      </div>

      {/* Decorative particles */}
      {[...Array(6)].map((_, i) => {
        const startX = i < 3 ? 10 + i * 12 : 55 + (i - 3) * 12;
        const startY = 60 + (i % 2) * 20;
        const particleOpacity = interpolate(
          frame,
          [60 + i * 4, 70 + i * 4],
          [0, 0.4],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
        const particleY = interpolate(frame % 150, [0, 75, 150], [startY, startY - 5, startY]);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${startX}%`,
              top: `${particleY}%`,
              width: i < 3 ? 4 : 3,
              height: i < 3 ? 4 : 3,
              borderRadius: '50%',
              backgroundColor: i < 3 ? '#FF6B6B' : theme.primary,
              opacity: particleOpacity,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};