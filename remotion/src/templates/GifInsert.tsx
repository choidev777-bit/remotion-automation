import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion';
import { theme } from '../theme';
import type { GifInsertScene } from '../types';

export const GifInsert: React.FC<GifInsertScene> = ({ gifUrl, caption }) => {
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
      {gifUrl ? (
        <Img
          src={gifUrl}
          style={{
            maxWidth: '80%',
            maxHeight: caption ? '75%' : '85%',
            borderRadius: theme.radius.lg,
            objectFit: 'contain',
          }}
        />
      ) : (
        /* GIF URL이 없을 때 플레이스홀더 */
        <div
          style={{
            width: '60%',
            height: '60%',
            borderRadius: theme.radius.lg,
            backgroundColor: theme.colors.card,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 80,
          }}
        >
          🎬
        </div>
      )}
      {caption && (
        <p
          style={{
            fontSize: theme.font.size.body,
            color: theme.colors.textMuted,
            marginTop: theme.spacing.md,
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
