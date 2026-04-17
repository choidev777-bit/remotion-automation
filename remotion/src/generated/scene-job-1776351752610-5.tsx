import React from 'react';
import { AbsoluteFill, Img, staticFile, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import { DynamicIcon } from '../templates/DynamicIcon';

export const AiFreeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const primaryOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const primaryScale = interpolate(frame, [0, 12], [0.96, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const supportOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bg,
        color: theme.colors.text,
        paddingBottom: 160,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 22,
          textAlign: 'center',
          maxWidth: 1100,
          padding: '0 80px',
        }}
      >
        <div
          style={{
            opacity: primaryOpacity,
            transform: `scale(${primaryScale})`,
            fontSize: 92,
            lineHeight: 1.06,
            fontWeight: 900,
            letterSpacing: -2,
            color: theme.colors.text,
            whiteSpace: 'pre-line',
          }}
        >
          평가 시스템은
          {'\n'}
          결과물
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            opacity: supportOpacity,
          }}
        >
          <DynamicIcon name="badge-check" size={28} color={theme.colors.primary} />
          <div
            style={{
              fontSize: 24,
              fontWeight: 500,
              color: theme.colors.textMuted,
            }}
          >
            장사에 진심인지의 증거
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
