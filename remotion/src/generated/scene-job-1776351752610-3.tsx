import React from 'react';
import { AbsoluteFill, Img, staticFile, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import { DynamicIcon } from '../templates/DynamicIcon';

export const AiFreeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const card1Frame = Math.round(4.8 * fps);
  const card2Frame = Math.round(9.2 * fps);
  const card3Frame = Math.round(13.5 * fps);

  const primaryOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const card1Opacity = interpolate(frame, [card1Frame, card1Frame + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const card1Y = interpolate(frame, [card1Frame, card1Frame + 12], [14, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const card2Opacity = interpolate(frame, [card2Frame, card2Frame + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const card2Y = interpolate(frame, [card2Frame, card2Frame + 12], [14, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const card3Opacity = interpolate(frame, [card3Frame, card3Frame + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const card3Y = interpolate(frame, [card3Frame, card3Frame + 12], [14, 0], {
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
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, opacity: primaryOpacity }}>
          <DynamicIcon name="folder-pen" size={46} color={theme.colors.primary} strokeWidth={2.4} />
          <div style={{ fontSize: 88, lineHeight: 1.04, fontWeight: 900, letterSpacing: -2 }}>
            상황별 답글 양식 저장
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              border: `2px solid ${theme.colors.border}`,
              borderRadius: 20,
              backgroundColor: theme.colors.card,
              padding: '20px 22px',
              opacity: card1Opacity,
              transform: `translateY(${card1Y}px)`,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 999,
                border: `2px solid ${theme.colors.primary}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              1
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 34, fontWeight: 800 }}>1점 답글</div>
              <div style={{ fontSize: 24, fontWeight: 500, color: theme.colors.textMuted }}>사과 + 재방문 유도</div>
            </div>
          </div>

          <div
            style={{
              border: `2px solid ${theme.colors.border}`,
              borderRadius: 20,
              backgroundColor: theme.colors.card,
              padding: '20px 22px',
              opacity: card2Opacity,
              transform: `translateY(${card2Y}px)`,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 999,
                border: `2px solid ${theme.colors.primary}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              3
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 34, fontWeight: 800 }}>3점 답글</div>
              <div style={{ fontSize: 24, fontWeight: 500, color: theme.colors.textMuted }}>친절한 설명 + 정리</div>
            </div>
          </div>

          <div
            style={{
              border: `2px solid ${theme.colors.border}`,
              borderRadius: 20,
              backgroundColor: theme.colors.card,
              padding: '20px 22px',
              opacity: card3Opacity,
              transform: `translateY(${card3Y}px)`,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 999,
                border: `2px solid ${theme.colors.primary}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              ↩
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 34, fontWeight: 800 }}>재방문 유도</div>
              <div style={{ fontSize: 24, fontWeight: 500, color: theme.colors.textMuted }}>복붙해서 바로 사용</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 2, color: theme.colors.textMuted }}>
          <DynamicIcon name="clipboard-paste" size={30} color={theme.colors.primary} strokeWidth={2.2} />
          <div style={{ fontSize: 24, fontWeight: 500 }}>친절하고 전문적인 사과·재방문 유도</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
