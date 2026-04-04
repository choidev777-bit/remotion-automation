import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import type { StatNumberScene } from '../types';

export const StatNumber: React.FC<StatNumberScene> = ({ stat, unit, label }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // 숫자 카운트업 애니메이션
  const numericValue = parseFloat(stat.replace(/,/g, ''));
  const isNumeric = !isNaN(numericValue);

  const progress = spring({
    frame,
    fps,
    config: { damping: 30, stiffness: 80, mass: 1 },
  });

  const displayValue = isNumeric
    ? Math.round(numericValue * progress).toLocaleString()
    : stat;

  const fadeIn = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
  const scaleUp = interpolate(frame, [0, 20], [0.6, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bg,
        fontFamily: theme.font.family,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadeIn,
      }}
    >
      {/* Number + Unit */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 12,
          transform: `scale(${scaleUp})`,
        }}
      >
        <span
          style={{
            fontSize: theme.font.size.hero,
            fontWeight: theme.font.weight.black,
            color: theme.colors.primary,
            letterSpacing: -3,
            lineHeight: 1,
          }}
        >
          {displayValue}
        </span>
        {unit && (
          <span
            style={{
              fontSize: theme.font.size.h2,
              fontWeight: theme.font.weight.bold,
              color: theme.colors.accent,
            }}
          >
            {unit}
          </span>
        )}
      </div>

      {/* Label */}
      <p
        style={{
          marginTop: theme.spacing.md,
          fontSize: theme.font.size.h3,
          fontWeight: theme.font.weight.medium,
          color: theme.colors.text,
          textAlign: 'center',
          wordBreak: 'keep-all',
          overflowWrap: 'break-word',
          maxWidth: '80%',
          opacity: interpolate(frame, [15, 30], [0, 1], { extrapolateRight: 'clamp' }),
        }}
      >
        {label}
      </p>

      {/* Decorative line */}
      <div
        style={{
          marginTop: theme.spacing.sm,
          width: interpolate(frame, [20, 40], [0, 200], { extrapolateRight: 'clamp' }),
          height: 3,
          backgroundColor: theme.colors.primary,
          borderRadius: 2,
        }}
      />
    </AbsoluteFill>
  );
};
