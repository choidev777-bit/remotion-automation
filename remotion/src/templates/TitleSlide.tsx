import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { theme } from '../theme';
import type { TitleScene } from '../types';

export const TitleSlide: React.FC<TitleScene> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, theme.animation.duration.normal], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(frame, [0, theme.animation.duration.normal], [30, 0], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xxl,
        fontFamily: theme.font.family,
      }}
    >
      <div
        style={{
          width: 80,
          height: 6,
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.primary,
          marginBottom: theme.spacing.lg,
          opacity,
        }}
      />
      <h1
        style={{
          fontSize: theme.font.size.hero,
          fontWeight: theme.font.weight.black,
          color: theme.colors.text,
          textAlign: 'center',
          margin: 0,
          marginBottom: subtitle ? theme.spacing.md : 0,
          opacity,
          transform: `translateY(${translateY}px)`,
          lineHeight: 1.2,
        }}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          style={{
            fontSize: theme.font.size.h3,
            fontWeight: theme.font.weight.regular,
            color: theme.colors.textMuted,
            textAlign: 'center',
            margin: 0,
            opacity,
            transform: `translateY(${translateY}px)`,
          }}
        >
          {subtitle}
        </p>
      )}
    </AbsoluteFill>
  );
};
