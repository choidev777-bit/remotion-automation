import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { theme } from '../theme';
import type { HighlightTextScene } from '../types';

export const HighlightText: React.FC<HighlightTextScene> = ({ text, emphasis }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, theme.animation.duration.slow], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const emphasisOpacity = interpolate(
    frame,
    [theme.animation.duration.slow, theme.animation.duration.slow + 15],
    [0, 1],
    { extrapolateRight: 'clamp' }
  );
  const emphasisScale = interpolate(
    frame,
    [theme.animation.duration.slow, theme.animation.duration.slow + 15],
    [0.8, 1],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `0 ${theme.spacing.xxl}px`,
        fontFamily: theme.font.family,
      }}
    >
      <p
        style={{
          fontSize: theme.font.size.h1,
          fontWeight: theme.font.weight.bold,
          color: theme.colors.text,
          textAlign: 'center',
          lineHeight: 1.3,
          margin: 0,
          opacity: progress,
          letterSpacing: '-2px',
        }}
      >
        {text}
      </p>
      {emphasis && (
        <div
          style={{
            marginTop: theme.spacing.lg,
            padding: `${theme.spacing.sm}px ${theme.spacing.lg}px`,
            backgroundColor: theme.colors.accent,
            borderRadius: theme.radius.md,
            fontSize: theme.font.size.h2,
            fontWeight: theme.font.weight.black,
            color: '#000',
            opacity: emphasisOpacity,
            transform: `scale(${emphasisScale})`,
            letterSpacing: '-1px',
          }}
        >
          {emphasis}
        </div>
      )}
    </AbsoluteFill>
  );
};
