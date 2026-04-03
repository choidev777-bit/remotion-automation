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

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bg,
        padding: theme.spacing.xxl,
        fontFamily: theme.font.family,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <h2
        style={{
          fontSize: theme.font.size.h2,
          fontWeight: theme.font.weight.bold,
          color: theme.colors.text,
          margin: 0,
          marginBottom: theme.spacing.xl,
          opacity: headingOpacity,
        }}
      >
        {heading}
      </h2>
      <div style={{ display: 'flex', gap: theme.spacing.md, flexWrap: 'wrap' }}>
        {cards.map((card, i) => {
          const delay = i * theme.animation.stagger;
          const cardSpring = spring({
            fps,
            frame: frame - delay,
            config: theme.animation.spring,
          });
          const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);
          const cardY = interpolate(cardSpring, [0, 1], [40, 0]);

          return (
            <div
              key={i}
              style={{
                flex: '1 1 260px',
                backgroundColor: theme.colors.card,
                borderRadius: theme.radius.lg,
                border: `2px solid ${theme.colors.border}`,
                padding: theme.spacing.lg,
                opacity: cardOpacity,
                transform: `translateY(${cardY}px)`,
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  width: 36,
                  height: 36,
                  borderRadius: theme.radius.full,
                  backgroundColor: theme.colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: theme.font.size.body,
                  fontWeight: theme.font.weight.bold,
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
