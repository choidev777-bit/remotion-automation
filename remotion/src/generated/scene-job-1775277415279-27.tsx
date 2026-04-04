import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';

export const AiFreeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Central figure entrance
  const centralScale = spring({ frame, fps, config: { damping: 12, mass: 0.8 } });
  const centralY = interpolate(centralScale, [0, 1], [60, 0]);

  // Title fade in
  const titleOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const titleY = interpolate(frame, [30, 50], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Subtitle fade in
  const subtitleOpacity = interpolate(frame, [50, 70], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Define AI robots with roles
  const robots = [
    { angle: 0, role: 'code', label: '개발', color: theme.primary },
    { angle: 30, role: 'design', label: '디자인', color: '#FF6B9D' },
    { angle: 60, role: 'marketing', label: '마케팅', color: theme.accent },
    { angle: 90, role: 'data', label: '데이터', color: '#6C8EFF' },
    { angle: 120, role: 'video', label: '영상', color: '#FF8A50' },
    { angle: 150, role: 'write', label: '카피', color: '#B06CFF' },
    { angle: 180, role: 'seo', label: 'SEO', color: '#00D4AA' },
    { angle: 210, role: 'pm', label: 'PM', color: '#FF5C8A' },
    { angle: 240, role: 'qa', label: 'QA', color: '#5CB8FF' },
    { angle: 270, role: 'analytics', label: '분석', color: '#FFD044' },
    { angle: 300, role: 'support', label: 'CS', color: '#7BFF8A' },
    { angle: 330, role: 'strategy', label: '전략', color: '#FF7EB3' },
  ];

  const renderRoleIcon = (role: string, color: string, size: number) => {
    const s = size;
    switch (role) {
      case 'code':
        return (
          <svg width={s} height={s} viewBox="0 0 40 40">
            <path d="M13 10L3 20L13 30" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M27 10L37 20L27 30" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="23" y1="6" x2="17" y2="34" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );
      case 'design':
        return (
          <svg width={s} height={s} viewBox="0 0 40 40">
            <circle cx="14" cy="14" r="6" fill="none" stroke={color} strokeWidth="2.5" />
            <circle cx="26" cy="14" r="6" fill="none" stroke={color} strokeWidth="2.5" />
            <circle cx="20" cy="24" r="6" fill="none" stroke={color} strokeWidth="2.5" />
            <path d="M17 19L20 18L23 19" stroke={color} strokeWidth="2" fill="none" />
          </svg>
        );
      case 'marketing':
        return (
          <svg width={s} height={s} viewBox="0 0 40 40">
            <path d="M8 30L8 14L32 8L32 24" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="8" cy="32" r="3" fill={color} />
            <circle cx="32" cy="26" r="3" fill={color} />
          </svg>
        );
      case 'data':
        return (
          <svg width={s} height={s} viewBox="0 0 40 40">
            <rect x="5" y="22" width="6" height="14" rx="1" fill={color} opacity="0.6" />
            <rect x="14" y="14" width="6" height="22" rx="1" fill={color} opacity="0.8" />
            <rect x="23" y="8" width="6" height="28" rx="1" fill={color} />
            <rect x="32" y="18" width="6" height="18" rx="1" fill={color} opacity="0.7" />
          </svg>
        );
      case 'video':
        return (
          <svg width={s} height={s} viewBox="0 0 40 40">
            <rect x="4" y="10" width="24" height="20" rx="3" fill="none" stroke={color} strokeWidth="2.5" />
            <polygon points="34,16 34,28 40,24 40,12" fill={color} opacity="0.8" />
            <polygon points="14,16 14,26 22,21" fill={color} />
          </svg>
        );
      case 'write':
        return (
          <svg width={s} height={s} viewBox="0 0 40 40">
            <path d="M28 6L34 12L14 32L6 34L8 26L28 6Z" fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
            <line x1="24" y1="10" x2="30" y2="16" stroke={color} strokeWidth="2" />
          </svg>
        );
      case 'seo':
        return (
          <svg width={s} height={s} viewBox="0 0 40 40">
            <circle cx="18" cy="18" r="10" fill="none" stroke={color} strokeWidth="2.5" />
            <line x1="25" y1="25" x2="34" y2="34" stroke={color} strokeWidth="3" strokeLinecap="round" />
            <line x1="12" y1="16" x2="24" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="20" x2="20" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case 'pm':
        return (
          <svg width={s} height={s} viewBox="0 0 40 40">
            <rect x="6" y="6" width="28" height="28" rx="3" fill="none" stroke={color} strokeWidth="2.5" />
            <line x1="6" y1="14" x2="34" y2="14" stroke={color} strokeWidth="2" />
            <rect x="10" y="18" width="8" height="3" rx="1" fill={color} opacity="0.7" />
            <rect x="10" y="24" width="14" height="3" rx="1" fill={color} opacity="0.5" />
            <circle cx="12" cy="10" r="2" fill={color} />
          </svg>
        );
      case 'qa':
        return (
          <svg width={s} height={s} viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="12" fill="none" stroke={color} strokeWidth="2.5" />
            <path d="M14 20L18 24L26 16" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'analytics':
        return (
          <svg width={s} height={s} viewBox="0 0 40 40">
            <path d="M6 34L6 6" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M6 34L38 34" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
            <polyline points="10,26 18,18 24,22 34,10" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="34" cy="10" r="3" fill={color} />
          </svg>
        );
      case 'support':
        return (
          <svg width={s} height={s} viewBox="0 0 40 40">
            <path d="M8 20C8 12 14 6 22 6C28 6 32 10 33 14" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M32 20C32 28 26 34 18 34C12 34 8 30 7 26" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M30 8L33 14L27 16" fill={color} opacity="0.8" />
            <path d="M10 32L7 26L13 24" fill={color} opacity="0.8" />
          </svg>
        );
      case 'strategy':
        return (
          <svg width={s} height={s} viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="14" fill="none" stroke={color} strokeWidth="2" opacity="0.5" />
            <circle cx="20" cy="20" r="8" fill="none" stroke={color} strokeWidth="2" opacity="0.7" />
            <circle cx="20" cy="20" r="3" fill={color} />
            <line x1="20" y1="6" x2="20" y2="10" stroke={color} strokeWidth="2" />
            <line x1="20" y1="30" x2="20" y2="34" stroke={color} strokeWidth="2" />
            <line x1="6" y1="20" x2="10" y2="20" stroke={color} strokeWidth="2" />
            <line x1="30" y1="20" x2="34" y2="20" stroke={color} strokeWidth="2" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Particles
  const particles = Array.from({ length: 50 }, (_, i) => {
    const angle = (i / 50) * Math.PI * 2;
    const baseRadius = 180 + (i % 3) * 60;
    const speed = 0.3 + (i % 5) * 0.15;
    const particleFrame = Math.max(0, frame - 20 - (i % 10));
    const particleOpacity = interpolate(particleFrame, [0, 20, 120, 150], [0, 0.8, 0.8, 0], { extrapolateRight: 'clamp' });
    const particleRadius = baseRadius + Math.sin(frame * speed * 0.05 + i) * 20;
    const px = 540 + Math.cos(angle + frame * 0.003 * speed) * particleRadius;
    const py = 400 + Math.sin(angle + frame * 0.003 * speed) * particleRadius * 0.6;
    const pSize = 2 + (i % 3) * 1.5;
    const colors = [theme.primary, theme.accent, '#FF6B9D', '#6C8EFF', '#B06CFF'];
    const pColor = colors[i % colors.length];

    return (
      <div
        key={`p-${i}`}
        style={{
          position: 'absolute',
          left: px - pSize / 2,
          top: py - pSize / 2,
          width: pSize,
          height: pSize,
          borderRadius: '50%',
          backgroundColor: pColor,
          opacity: particleOpacity,
          boxShadow: `0 0 ${pSize * 3}px ${pColor}, 0 0 ${pSize * 6}px ${pColor}40`,
        }}
      />
    );
  });

  // Glow ring pulses
  const glowPulse = interpolate(frame, [0, 60, 120], [0.3, 0.8, 0.3]);

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg, overflow: 'hidden' }}>
      {/* Background stage gradient */}
      <AbsoluteFill>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 800,
            height: 800,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${theme.primary}10 0%, transparent 70%)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${theme.accent}08 0%, transparent 70%)`,
          }}
        />
        {/* Spotlight from top */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 300,
            height: 600,
            background: `linear-gradient(180deg, ${theme.primary}15 0%, transparent 100%)`,
            clipPath: 'polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)',
            opacity: 0.6,
          }}
        />
      </AbsoluteFill>

      {/* Glow rings */}
      {[200, 280, 360].map((radius, idx) => {
        const ringOpacity = interpolate(
          frame,
          [20 + idx * 10, 40 + idx * 10],
          [0, glowPulse * (0.15 - idx * 0.03)],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
        return (
          <div
            key={`ring-${idx}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: radius * 2,
              height: radius * 2,
              transform: `translate(-50%, -50%)`,
              borderRadius: '50%',
              border: `1px solid ${theme.primary}`,
              opacity: ringOpacity,
              boxShadow: `0 0 20px ${theme.primary}30, inset 0 0 20px ${theme.primary}10`,
            }}
          />
        );
      })}

      {/* Particles */}
      {particles}

      {/* AI Robots circle */}
      {robots.map((robot, idx) => {
        const angleRad = (robot.angle * Math.PI) / 180;
        const radius = 240;
        const robotDelay = 15 + idx * 4;
        const robotSpring = spring({ frame: Math.max(0, frame - robotDelay), fps, config: { damping: 10, mass: 0.6 } });
        const robotOpacity = interpolate(robotSpring, [0, 1], [0, 1]);
        const robotScale = robotSpring;
        const bobOffset = Math.sin(frame * 0.04 + idx * 0.8) * 5;
        const orbitOffset = Math.sin(frame * 0.02 + idx) * 8;

        const rx = 540 + Math.cos(angleRad) * (radius + orbitOffset);
        const ry = 380 + Math.sin(angleRad) * ((radius + orbitOffset) * 0.45) + bobOffset;

        const iconFloat = Math.sin(frame * 0.05 + idx * 1.2) * 3;

        return (
          <div
            key={`robot-${idx}`}
            style={{
              position: 'absolute',
              left: rx - 30,
              top: ry - 40,
              width: 60,
              height: 80,
              opacity: robotOpacity,
              transform: `scale(${robotScale})`,
            }}
          >
            {/* Robot body glow */}
            <div
              style={{
                position: 'absolute',
                top: 10,
                left: 15,
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${robot.color}40 0%, transparent 70%)`,
                filter: `blur(4px)`,
              }}
            />
            {/* Robot head */}
            <div
              style={{
                position: 'absolute',
                top: 12,
                left: 17,
                width: 26,
                height: 22,
                borderRadius: 8,
                backgroundColor: `${theme.card}`,
                border: `1.5px solid ${robot.color}80`,
                boxShadow: `0 0 12px ${robot.color}40`,
              }}
            >
              {/* Eyes */}
              <div style={{ position: 'absolute', top: 7, left: 5, width: 5, height: 5, borderRadius: '50%', backgroundColor: robot.color, boxShadow: `0 0 4px ${robot.color}` }} />
              <div style={{ position: 'absolute', top: 7, right: 5, width: 5, height: 5, borderRadius: '50%', backgroundColor: robot.color, boxShadow: `0 0 4px ${robot.color}` }} />
            </div>
            {/* Antenna */}
            <div style={{ position: 'absolute', top: 5, left: 28, width: 2, height: 10, backgroundColor: robot.color, opacity: 0.6 }} />
            <div style={{ position: 'absolute', top: 2, left: 26, width: 6, height: 6, borderRadius: '50%', backgroundColor: robot.color, opacity: 0.8, boxShadow: `0 0 6px ${robot.color}` }} />
            {/* Role icon floating above */}
            <div
              style={{
                position: 'absolute',
                top: -20 + iconFloat,
                left: 15,
                width: 30,
                height: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {renderRoleIcon(robot.role, robot.color, 22)}
            </div>
            {/* Label */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 9,
                color: theme.textMuted,
                whiteSpace: 'nowrap',
                fontFamily: 'sans-serif',
                textAlign: 'center',
              }}
            >
              {robot.label}
            </div>
          </div>
        );
      })}

      {/* Central figure - Conductor */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${centralY}px) scale(${centralScale})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Figure glow */}
        <div
          style={{
            position: 'absolute',
            top: -20,
            left: -40,
            width: 120,
            height: 160,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${theme.primary}25 0%, transparent 70%)`,
            filter: 'blur(15px)',
          }}
        />

        {/* Person SVG */}
        <svg width="80" height="120" viewBox="0 0 80 120">
          {/* Body */}
          <path
            d="M40 45 C40 45 20 50 18 75 L16 110 L28 110 L32 85 L40 80 L48 85 L52 110 L64 110 L62 75 C60 50 40 45 40 45Z"
            fill={theme.card}
            stroke={theme.primary}
            strokeWidth="1.5"
          />
          {/* Suit detail line */}
          <line x1="40" y1="55" x2="40" y2="80" stroke={theme.primary} strokeWidth="1" opacity="0.5" />
          {/* Head */}
          <circle cx="40" cy="30" r="16" fill={theme.card} stroke={theme.primary} strokeWidth="1.5" />
          {/* Face features */}
          <circle cx="34" cy="28" r="1.5" fill={theme.primary} />
          <circle cx="46" cy="28" r="1.5" fill={theme.primary} />
          <path d="M36 35 Q40 38 44 35" stroke={theme.primary} strokeWidth="1.2" fill="none" />
          {/* Hair */}
          <path d="M24 25 Q26 12 40 10 Q54 12 56 25" fill="#2A2A2A" stroke="none" />
          {/* Right arm holding baton */}
          <path
            d="M56 55 L68 42 L74 30"
            stroke={theme.primary}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          {/* Left arm */}
          <path
            d="M24 55 L14 65 L10 75"
            stroke={theme.primary}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          {/* Baton */}
          <line x1="74" y1="30" x2="78" y2="16" stroke={theme.accent} strokeWidth="2.5" strokeLinecap="round" />
          {/* Baton tip glow */}
          <circle cx="78" cy="14" r="4" fill={theme.accent} opacity="0.8">
            <animate attributeName="r" values="3;5;3" dur="1s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;1;0.6" dur="1s" repeatCount="indefinite" />
          </circle>
          <circle cx="78" cy="14" r="8" fill={theme.accent} opacity="0.2">
            <animate attributeName="r" values="6;10;6" dur="1s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      {/* Connection lines from center to robots */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {robots.map((robot, idx) => {
          const angleRad = (robot.angle * Math.PI) / 180;
          const radius = 240;
          const lineDelay = 30 + idx * 3;
          const lineOpacity = interpolate(frame, [lineDelay, lineDelay + 20], [0, 0.12], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const rx = 540 + Math.cos(angleRad) * radius;
          const ry = 380 + Math.sin(angleRad) * (radius * 0.45);

          return (
            <line
              key={`line-${idx}`}
              x1={540}
              y1={380}
              x2={rx}
              y2={ry}
              stroke={robot.color}
              strokeWidth="0.8"
              opacity={lineOpacity}
              strokeDasharray="4 4"
            />
          );
        })}
      </svg>

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div
          style={{
            fontSize: 42,
            fontWeight: 800,
            color: theme.text,
            fontFamily: 'sans-serif',
            textShadow: `0 0 30px ${theme.primary}50`,
            letterSpacing: '-1px',
          }}
        >
          AI 팀을 지휘하라
        </div>
      </div>

      {/* Subtitle */}
      <div
        style={{
          position: 'absolute',
          bottom: 70,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: subtitleOpacity,
        }}
      >
        <div
          style={{
            fontSize: 20,
            color: theme.textMuted,
            fontFamily: 'sans-serif',
            maxWidth: 600,
            margin: '0 auto',
            lineHeight: 1.6,
          }}
        >
          당신이 프로듀서, AI가 당신의 팀
        </div>
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            gap: 16,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {['개발', '디자인', '마케팅', '영상', '분석'].map((tag, i) => {
            const tagOpacity = interpolate(frame, [70 + i * 5, 80 + i * 5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            const tagColors = [theme.primary, '#FF6B9D', theme.accent, '#FF8A50', '#FFD044'];
            return (
              <span
                key={tag}
                style={{
                  fontSize: 14,
                  color: tagColors[i],
                  border: `1px solid ${tagColors[i]}40`,
                  padding: '4px 14px',
                  borderRadius: 20,
                  backgroundColor: `${tagColors[i]}10`,
                  opacity: tagOpacity,
                  fontFamily: 'sans-serif',
                }}
              >
                {tag}
              </span>
            );
          })}
        </div>
      </div>

      {/* Bottom decorative line */}
      <div
        style={{
          position: 'absolute',
          bottom: 50,
          left: '50%',
          transform: 'translateX(-50%)',
          width: interpolate(frame, [80, 120], [0, 300], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          height: 1,
          background: `linear-gradient(90deg, transparent, ${theme.primary}60, transparent)`,
        }}
      />

      {/* Ambient light streaks */}
      {[0, 1, 2, 3, 4].map((i) => {
        const streakAngle = (i * 72 + frame * 0.3) * (Math.PI / 180);
        const streakOpacity = interpolate(frame, [40, 60], [0, 0.06], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) * (0.5 + Math.sin(frame * 0.03 + i) * 0.5);
        return (
          <div
            key={`streak-${i}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 600,
              height: 2,
              transform: `translate(-50%, -50%) rotate(${(i * 72 + frame * 0.3)}deg)`,
              background: `linear-gradient(90deg, transparent, ${theme.primary}, transparent)`,
              opacity: streakOpacity,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};