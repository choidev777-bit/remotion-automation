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
  const supportOpacity = interpolate(frame, [0, 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const numberValue = interpolate(frame, [0, 48], [12, 98], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const arrowShift = interpolate(frame, [0, 20], [10, 0], {
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
          gap: 24,
          textAlign: 'center',
          maxWidth: 1120,
          padding: '0 80px',
        }}
      >
        <div
          style={{
            opacity: primaryOpacity,
            transform: `scale(${primaryScale})`,
            fontSize: 88,
            lineHeight: 1.06,
            fontWeight: 900,
            letterSpacing: -2,
            color: theme.colors.text,
            whiteSpace: 'pre-line',
          }}
        >
          경쟁 우위 기회
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            opacity: supportOpacity,
          }}
        >
          <DynamicIcon name="badge-check" size={30} color={theme.colors.primary} />
          <div
            style={{
              fontSize: 25,
              fontWeight: 500,
              color: theme.colors.textMuted,
            }}
          >
            노력을 숫자로 증명
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            marginTop: 10,
            opacity: supportOpacity,
          }}
        >
          <div
            style={{
              fontSize: 82,
              fontWeight: 900,
              color: theme.colors.primary,
              letterSpacing: -2,
              minWidth: 150,
              textAlign: 'right',
            }}
          >
            {Math.round(numberValue)}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: theme.colors.textMuted,
              fontSize: 24,
              fontWeight: 500,
            }}
          >
            <DynamicIcon name="arrow-right" size={26} color={theme.colors.textMuted} style={{ transform: `translateX(${arrowShift}px)` }} />
            변화 이후의 반전 효과
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
