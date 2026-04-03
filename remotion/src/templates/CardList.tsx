import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import type { CardListScene } from '../types';

export const CardList: React.FC<CardListScene> = ({ heading, cards }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingOpacity = interpolate(frame, [0, theme.animation.duration.normal], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const headingY = interpolate(frame, [0, theme.animation.duration.normal], [30, 0], {
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
        padding: `0 ${theme.spacing.xxl}px`,
        fontFamily: theme.font.family,
      }}
    >
      {/* 섹션 제목 */}
      <h2
        style={{
          fontSize: theme.font.size.h2,
          fontWeight: theme.font.weight.bold,
          color: theme.colors.primary,
          margin: 0,
          marginBottom: theme.spacing.lg,
          opacity: headingOpacity,
          transform: `translateY(${headingY}px)`,
          textAlign: 'center',
          letterSpacing: '-1px',
        }}
      >
        {heading}
      </h2>

      {/* 카드 그리드 */}
      <div
        style={{
          display: 'flex',
          gap: theme.spacing.md,
          width: '100%',
          justifyContent: 'center',
        }}
      >
        {cards.map((card, i) => {
          const delay = i * theme.animation.stagger;
          const cardSpring = spring({ fps, frame: frame - delay, config: theme.animation.spring });
          const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);
          const cardY = interpolate(cardSpring, [0, 1], [60, 0]);

          return (
            <div
              key={i}
              style={{
                flex: '1 1 0',
                maxWidth: 480,
                backgroundColor: theme.colors.card,
                borderRadius: theme.radius.lg,
                border: `2px solid ${theme.colors.primary}`,
                padding: theme.spacing.lg,
                opacity: cardOpacity,
                transform: `translateY(${cardY}px)`,
                boxShadow: `0 0 32px ${theme.colors.primaryGlow}`,
              }}
            >
              {/* 번호 배지 */}
              <div
                style={{
                  display: 'inline-flex',
                  width: 48,
                  height: 48,
                  borderRadius: theme.radius.full,
                  backgroundColor: theme.colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: theme.font.size.body,
                  fontWeight: theme.font.weight.black,
                  color: '#000',
                  marginBottom: theme.spacing.sm,
                }}
              >
                {i + 1}
              </div>
              <h3
                style={{
                  fontSize: theme.font.size.h3,
                  fontWeight: theme.font.weight.bold,
                  color: theme.colors.text,
                  margin: 0,
                  marginBottom: card.desc ? theme.spacing.xs : 0,
                  letterSpacing: '-0.5px',
                }}
              >
                {card.name}
              </h3>
              {card.desc && (
                <p
                  style={{
                    fontSize: theme.font.size.small,
                    color: theme.colors.textMuted,
                    margin: 0,
                    marginTop: theme.spacing.xs,
                    lineHeight: 1.5,
                  }}
                >
                  {card.desc}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
