import React from 'react';
import { AbsoluteFill, Img, staticFile, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import { DynamicIcon } from '../templates/DynamicIcon';

export const AiFreeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phaseSwapFrame = Math.round(6.4 * fps);

  const primaryOpacity = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const primaryScale = interpolate(frame, [0, 14], [0.97, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const phaseTwoOpacity = interpolate(frame, [phaseSwapFrame, phaseSwapFrame + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const phaseOneDim = interpolate(frame, [phaseSwapFrame, phaseSwapFrame + 10], [1, 0.18], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const bannerScale = interpolate(frame, [0, 12], [0.98, 1], {
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
        justifyContent: 'center',
        paddingLeft: 72,
        paddingRight: 72,
      }}
    >
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 34 }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              width: 'fit-content',
              margin: '0 auto',
              border: `2px solid ${theme.colors.border}`,
              borderRadius: 22,
              backgroundColor: theme.colors.card,
              padding: '18px 26px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              opacity: primaryOpacity,
              transform: `scale(${bannerScale})`,
            }}
          >
            <DynamicIcon name="alert-triangle" size={44} color={theme.colors.primary} strokeWidth={2.4} />
            <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.1 }}>3개월 안에만 변경 가능</div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'center',
            gap: 24,
            opacity: phaseOneDim,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              minWidth: 180,
            }}
          >
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: 999,
                border: `2px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.card,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 900,
              }}
            >
              예전
            </div>
            <div style={{ fontSize: 24, fontWeight: 500, color: theme.colors.textMuted, textAlign: 'center' }}>
              1년 뒤에도 수정 가능
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <DynamicIcon name="arrow-right" size={34} color={theme.colors.textMuted} strokeWidth={2.2} />
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              minWidth: 180,
            }}
          >
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: 999,
                border: `2px solid ${theme.colors.primary}`,
                backgroundColor: theme.colors.card,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 900,
              }}
            >
              이제
            </div>
            <div style={{ fontSize: 24, fontWeight: 500, color: theme.colors.textMuted, textAlign: 'center' }}>
              글쓴 날 기준 3개월
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 18,
            opacity: phaseTwoOpacity,
            marginTop: 6,
          }}
        >
          <DynamicIcon name="clock-3" size={50} color={theme.colors.primary} strokeWidth={2.4} />
          <div style={{ fontSize: 88, lineHeight: 1, fontWeight: 900, letterSpacing: -2 }}>3개월</div>
          <div style={{ fontSize: 24, fontWeight: 500, color: theme.colors.textMuted, maxWidth: 320 }}>
            글쓴 날 기준으로만 점수 변경
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
