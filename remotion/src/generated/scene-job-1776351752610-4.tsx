import React from 'react';
import { AbsoluteFill, Img, staticFile, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import { DynamicIcon } from '../templates/DynamicIcon';

export const AiFreeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const step2Frame = Math.round(1.2 * fps);
  const step3Frame = Math.round(10.5 * fps);
  const step4Frame = Math.round(16.8 * fps);

  const titleOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const step1Opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const step1Y = interpolate(frame, [0, 12], [14, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const step2Opacity = interpolate(frame, [step2Frame, step2Frame + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const step2Y = interpolate(frame, [step2Frame, step2Frame + 12], [14, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const step3Opacity = interpolate(frame, [step3Frame, step3Frame + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const step3Y = interpolate(frame, [step3Frame, step3Frame + 12], [14, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const step4Opacity = interpolate(frame, [step4Frame, step4Frame + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const step4Y = interpolate(frame, [step4Frame, step4Frame + 12], [14, 0], {
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
        paddingLeft: 64,
        paddingRight: 64,
      }}
    >
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, opacity: titleOpacity }}>
          <DynamicIcon name="list-ordered" size={46} color={theme.colors.primary} strokeWidth={2.4} />
          <div style={{ fontSize: 88, lineHeight: 1.04, fontWeight: 900, letterSpacing: -2 }}>3단계 정리</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: step1Opacity, transform: `translateY(${step1Y}px)` }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 999,
                border: `2px solid ${theme.colors.primary}`,
                backgroundColor: theme.colors.card,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              1
            </div>
            <div
              style={{
                flex: 1,
                border: `2px solid ${theme.colors.border}`,
                borderRadius: 18,
                backgroundColor: theme.colors.card,
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <DynamicIcon name="store" size={30} color={theme.colors.primary} strokeWidth={2.2} />
              <div style={{ fontSize: 34, fontWeight: 800 }}>매장 정보 채우기</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: Math.max(step1Opacity, step2Opacity) }}>
            <DynamicIcon name="arrow-down" size={30} color={theme.colors.textMuted} strokeWidth={2.2} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: step2Opacity, transform: `translateY(${step2Y}px)` }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 999,
                border: `2px solid ${theme.colors.primary}`,
                backgroundColor: theme.colors.card,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              2
            </div>
            <div
              style={{
                flex: 1,
                border: `2px solid ${theme.colors.border}`,
                borderRadius: 18,
                backgroundColor: theme.colors.card,
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <DynamicIcon name="search" size={30} color={theme.colors.primary} strokeWidth={2.2} />
              <div style={{ fontSize: 34, fontWeight: 800 }}>키워드 점검</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: Math.max(step2Opacity, step3Opacity) }}>
            <DynamicIcon name="arrow-down" size={30} color={theme.colors.textMuted} strokeWidth={2.2} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: step3Opacity, transform: `translateY(${step3Y}px)` }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 999,
                border: `2px solid ${theme.colors.primary}`,
                backgroundColor: theme.colors.card,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              3
            </div>
            <div
              style={{
                flex: 1,
                border: `2px solid ${theme.colors.border}`,
                borderRadius: 18,
                backgroundColor: theme.colors.card,
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <DynamicIcon name="message-square-reply" size={30} color={theme.colors.primary} strokeWidth={2.2} />
              <div style={{ fontSize: 34, fontWeight: 800 }}>답글 준비</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: Math.max(step3Opacity, step4Opacity) }}>
            <DynamicIcon name="arrow-down" size={30} color={theme.colors.textMuted} strokeWidth={2.2} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: step4Opacity, transform: `translateY(${step4Y}px)` }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 999,
                border: `2px solid ${theme.colors.primary}`,
                backgroundColor: theme.colors.card,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              ✓
            </div>
            <div
              style={{
                flex: 1,
                border: `2px solid ${theme.colors.border}`,
                borderRadius: 18,
                backgroundColor: theme.colors.card,
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <DynamicIcon name="clipboard-check" size={30} color={theme.colors.primary} strokeWidth={2.2} />
              <div style={{ fontSize: 34, fontWeight: 800 }}>바로 저장</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 2, color: theme.colors.textMuted }}>
          <DynamicIcon name="shield-check" size={30} color={theme.colors.primary} strokeWidth={2.2} />
          <div style={{ fontSize: 24, fontWeight: 500 }}>리뷰 점검 · 답글 양식 준비</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
