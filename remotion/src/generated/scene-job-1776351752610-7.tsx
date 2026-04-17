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
  const badgeOpacity = interpolate(frame, [0, 16], [0, 1], {
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
          width: '100%',
          maxWidth: 1280,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
          padding: '0 80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18,
            opacity: primaryOpacity,
            transform: `scale(${primaryScale})`,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 90,
              lineHeight: 1.05,
              fontWeight: 900,
              letterSpacing: -2,
              color: theme.colors.text,
              whiteSpace: 'pre-line',
            }}
          >
            점수 설정 버튼 확인
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              width: 'fit-content',
              margin: '0 auto',
              padding: '10px 18px',
              border: `2px solid ${theme.colors.border}`,
              borderRadius: 999,
              backgroundColor: theme.colors.card,
              opacity: badgeOpacity,
            }}
          >
            <DynamicIcon name="sparkles" size={22} color={theme.colors.primary} />
            <div style={{ fontSize: 24, fontWeight: 700, color: theme.colors.text }}>
              구독 부탁
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            opacity: supportOpacity,
            color: theme.colors.textMuted,
            fontSize: 24,
            fontWeight: 500,
          }}
        >
          <DynamicIcon name="arrow-right-circle" size={26} color={theme.colors.primary} />
          오늘 바로 접속
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 8,
            opacity: supportOpacity,
          }}
        >
          <Img
            src={staticFile('naver_smart_place.jpg')}
            style={{
              width: 220,
              height: 220,
              objectFit: 'contain',
              borderRadius: 24,
              border: `2px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.card,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
