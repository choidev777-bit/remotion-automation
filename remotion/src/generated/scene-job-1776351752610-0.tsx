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
  const supportOpacity = interpolate(frame, [6, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bg,
        color: theme.colors.text,
        paddingBottom: 160,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 80,
        paddingRight: 80,
      }}
    >
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            opacity: primaryOpacity,
            transform: `scale(${primaryScale})`,
          }}
        >
          <DynamicIcon name="shield-alert" size={54} color={theme.colors.primary} strokeWidth={2.4} />
          <div
            style={{
              fontSize: 92,
              lineHeight: 1.05,
              fontWeight: 900,
              letterSpacing: -2,
              textAlign: 'center',
            }}
          >
            3개월 방어 매뉴얼
          </div>
        </div>

        <div
          style={{
            marginTop: 22,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            opacity: supportOpacity,
          }}
        >
          <div
            style={{
              border: `2px solid ${theme.colors.border}`,
              borderRadius: 999,
              padding: '10px 18px',
              backgroundColor: theme.colors.card,
              color: theme.colors.textMuted,
              fontSize: 24,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            위기 대처용
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 500,
              color: theme.colors.textMuted,
            }}
          >
            당장 문서화
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
