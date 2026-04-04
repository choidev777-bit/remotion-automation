import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import type { SplitScreenScene } from '../types';

export const SplitScreen: React.FC<SplitScreenScene> = ({ left, right }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const slideL = interpolate(frame, [0, 20], [-60, 0], { extrapolateRight: 'clamp' });
  const slideR = interpolate(frame, [5, 25], [60, 0], { extrapolateRight: 'clamp' });

  const sideStyle = (offset: number): React.CSSProperties => ({
    flex: 1,
    padding: theme.spacing.md,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    opacity: fadeIn,
    transform: `translateX(${offset}px)`,
  });

  const headingStyle: React.CSSProperties = {
    fontSize: theme.font.size.h3,
    fontWeight: theme.font.weight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    letterSpacing: -0.5,
    wordBreak: 'keep-all',
  };

  const pointStyle: React.CSSProperties = {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    lineHeight: 1.6,
    marginBottom: theme.spacing.xs,
    wordBreak: 'keep-all',
    overflowWrap: 'break-word',
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bg,
        fontFamily: theme.font.family,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
      }}
    >
      {/* Left */}
      <div style={sideStyle(slideL)}>
        <h2 style={headingStyle}>{left.heading}</h2>
        {left.points.map((p, i) => (
          <p key={i} style={pointStyle}>• {p}</p>
        ))}
      </div>

      {/* Divider */}
      <div
        style={{
          width: 2,
          background: `linear-gradient(180deg, transparent, ${theme.colors.primary}, transparent)`,
          opacity: fadeIn,
        }}
      />

      {/* Right */}
      <div style={sideStyle(slideR)}>
        <h2 style={{ ...headingStyle, color: theme.colors.accent }}>{right.heading}</h2>
        {right.points.map((p, i) => (
          <p key={i} style={pointStyle}>• {p}</p>
        ))}
      </div>
    </AbsoluteFill>
  );
};
