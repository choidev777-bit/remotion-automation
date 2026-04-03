import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion';
import { theme } from '../theme';
import type { ImageInsertScene } from '../types';

export const ImageInsert: React.FC<ImageInsertScene> = ({ src, caption }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, theme.animation.duration.normal], [0, 1], {
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
        padding: theme.spacing.xl,
        fontFamily: theme.font.family,
        opacity,
      }}
    >
      <Img
        src={src}
        style={{
          maxWidth: '90%',
          maxHeight: caption ? '78%' : '90%',
          borderRadius: theme.radius.lg,
          objectFit: 'contain',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}
      />
      {caption && (
        <p
          style={{
            fontSize: theme.font.size.body,
            color: theme.colors.textMuted,
            margin: `${theme.spacing.md}px 0 0 0`,
            textAlign: 'center',
          }}
        >
          {caption}
        </p>
      )}
    </AbsoluteFill>
  );
};
