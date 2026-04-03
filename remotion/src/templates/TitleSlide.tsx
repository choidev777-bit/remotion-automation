import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { theme } from '../theme';
import type { TitleScene } from '../types';

export const TitleSlide: React.FC<TitleScene> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, theme.animation.duration.normal], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(frame, [0, theme.animation.duration.normal], [40, 0], {
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
        fontFamily: theme.font.family,
      }}
    >
      {/* 상단 강조 바 */}
      <div
        style={{
          width: 64,
          height: 5,
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.primary,
          marginBottom: theme.spacing.lg,
          opacity,
          boxShadow: `0 0 20px ${theme.colors.primary}`,
        }}
      />
      {/* 메인 제목 */}
      <h1
        style={{
          fontSize: theme.font.size.hero,
          fontWeight: theme.font.weight.black,
          color: theme.colors.text,
          textAlign: 'center',
          margin: 0,
          marginBottom: subtitle ? theme.spacing.sm : 0,
          opacity,
          transform: `translateY(${translateY}px)`,
          lineHeight: 1.15,
          letterSpacing: '-2px',
          padding: `0 ${theme.spacing.xxl}px`,
        }}
      >
        {title}
      </h1>
      {/* 부제목 */}
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
            letterSpacing: '-0.5px',
          }}
        >
          {subtitle}
        </p>
      )}
    </AbsoluteFill>
  );
};
