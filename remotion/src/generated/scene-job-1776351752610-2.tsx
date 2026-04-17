import React from 'react';
import { AbsoluteFill, Img, staticFile, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import { DynamicIcon } from '../templates/DynamicIcon';

export const AiFreeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phaseTwoFrame = Math.round(2.2 * fps);
  const supportFrame = Math.round(4.8 * fps);

  const primaryOpacity = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const primaryScale = interpolate(frame, [0, 14], [0.96, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const phaseTwoOpacity = interpolate(frame, [phaseTwoFrame, phaseTwoFrame + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const supportOpacity = interpolate(frame, [supportFrame, supportFrame + 14], [0, 1], {
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
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 28, alignItems: 'center' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            opacity: primaryOpacity,
            transform: `scale(${primaryScale})`,
          }}
        >
          <div style={{ fontSize: 88, lineHeight: 1, fontWeight: 900, letterSpacing: -2, textAlign: 'center' }}>
            수정 유도
          </div>
          <DynamicIcon name="arrow-right-left" size={46} color={theme.colors.primary} strokeWidth={2.4} />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            opacity: phaseTwoOpacity,
          }}
        >
          <div
            style={{
              border: `2px solid ${theme.colors.border}`,
              borderRadius: 999,
              padding: '10px 18px',
              backgroundColor: theme.colors.card,
              fontSize: 24,
              fontWeight: 700,
              color: theme.colors.textMuted,
            }}
          >
            1~2점
          </div>
          <DynamicIcon name="arrow-right" size={30} color={theme.colors.textMuted} strokeWidth={2.2} />
          <div style={{ fontSize: 24, fontWeight: 500, color: theme.colors.textMuted }}>손님 마음 돌리기</div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            opacity: supportOpacity,
          }}
        >
          <DynamicIcon name="calendar-clock" size={36} color={theme.colors.primary} strokeWidth={2.2} />
          <div style={{ fontSize: 88, lineHeight: 1, fontWeight: 900, letterSpacing: -2 }}>3개월</div>
          <div style={{ fontSize: 24, fontWeight: 500, color: theme.colors.textMuted }}>제한 시간 안에</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
