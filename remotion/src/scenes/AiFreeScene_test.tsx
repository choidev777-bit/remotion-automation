import React from 'react';
import { AbsoluteFill, Img, staticFile, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import { Check, X } from 'lucide-react';

export const AiFreeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 왼쪽 카드 애니메이션
  const leftDelay = 8;
  const leftO = interpolate(frame, [leftDelay, leftDelay + 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const leftX = interpolate(frame, [leftDelay, leftDelay + 18], [-60, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // 오른쪽 카드 애니메이션
  const rightDelay = 16;
  const rightO = interpolate(frame, [rightDelay, rightDelay + 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const rightX = interpolate(frame, [rightDelay, rightDelay + 18], [60, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // VS 텍스트 애니메이션
  const vsDelay = 24;
  const vsScale = spring({ frame: frame - vsDelay, fps, config: { damping: 10, stiffness: 120 } });
  const vsO = interpolate(frame, [vsDelay, vsDelay + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // 하단 배너 애니메이션
  const bannerDelay = 40;
  const bannerO = interpolate(frame, [bannerDelay, bannerDelay + 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const bannerY = interpolate(frame, [bannerDelay, bannerDelay + 18], [24, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // 아이콘 등장
  const iconLeftO = interpolate(frame, [leftDelay + 10, leftDelay + 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const iconRightO = interpolate(frame, [rightDelay + 10, rightDelay + 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: theme.colors.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {/* 상단 타이틀 */}
      <div style={{ opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), transform: `translateY(${interpolate(frame, [0, 15], [20, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`, marginBottom: 60 }}>
        <p style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textMuted, textAlign: 'center', margin: 0, letterSpacing: 2 }}>
          컨텍스트 기억력 비교
        </p>
      </div>

      {/* VS 비교 메인 영역 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, position: 'relative' }}>
        {/* 왼쪽 ChatGPT 카드 */}
        <div style={{ opacity: leftO, transform: `translateX(${leftX}px)`, width: 460, background: theme.colors.card, border: `1px solid ${theme.colors.border}`, borderRadius: 20, padding: '40px 36px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <Img src={staticFile('logos/_placeholder.png')} style={{ width: 56, height: 56, objectFit: 'contain', opacity: 0.9 }} />
          <p style={{ fontSize: 30, fontWeight: 800, color: theme.colors.text, margin: 0, textAlign: 'center' }}>ChatGPT</p>
          <div style={{ width: '60%', height: 1, background: theme.colors.border }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,68,68,0.1)', border: '1.5px solid #FF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: iconLeftO }}>
              <X size={28} color="#FF4444" strokeWidth={2.5} />
            </div>
            <p style={{ fontSize: 21, fontWeight: 600, color: theme.colors.textMuted, textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
              대화가 끊기면<br />맥락 초기화
            </p>
          </div>
        </div>

        {/* 가운데 VS 영역 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 120, position: 'relative' }}>
          {/* 수직 구분선 위쪽 */}
          <div style={{ width: 1, height: 60, background: theme.colors.border, opacity: vsO }} />
          {/* VS 원형 배지 */}
          <div style={{ opacity: vsO, transform: `scale(${vsScale})`, width: 64, height: 64, borderRadius: '50%', background: '#181818', border: `2px solid ${theme.colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '12px 0' }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: theme.colors.text }}>VS</span>
          </div>
          {/* 수직 구분선 아래쪽 */}
          <div style={{ width: 1, height: 60, background: theme.colors.border, opacity: vsO }} />
        </div>

        {/* 오른쪽 Claude 카드 */}
        <div style={{ opacity: rightO, transform: `translateX(${rightX}px)`, width: 460, background: theme.colors.card, border: `1px solid ${theme.colors.primary}33`, borderRadius: 20, padding: '40px 36px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <Img src={staticFile('logos/_placeholder.png')} style={{ width: 56, height: 56, objectFit: 'contain', opacity: 0.9 }} />
          <p style={{ fontSize: 30, fontWeight: 800, color: theme.colors.text, margin: 0, textAlign: 'center' }}>Claude</p>
          <div style={{ width: '60%', height: 1, background: theme.colors.border }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,200,150,0.1)', border: `1.5px solid ${theme.colors.primary}`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: iconRightO }}>
              <Check size={28} color={theme.colors.primary} strokeWidth={2.5} />
            </div>
            <p style={{ fontSize: 21, fontWeight: 600, color: theme.colors.textMuted, textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
              대화 맥락을<br />최대 <span style={{ color: theme.colors.primary, fontWeight: 700 }}>20만 토큰</span> 기억
            </p>
          </div>
        </div>
      </div>

      {/* 하단 초록 배너 */}
      <div style={{ opacity: bannerO, transform: `translateY(${bannerY}px)`, marginTop: 60 }}>
        <div style={{ border: `1.5px solid ${theme.colors.primary}`, borderRadius: 14, padding: '18px 44px', display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(0,200,150,0.05)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: theme.colors.primary }} />
          <span style={{ fontSize: 24, fontWeight: 700, color: theme.colors.text }}>상황에 맞는 AI를 골라 쓰세요</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};