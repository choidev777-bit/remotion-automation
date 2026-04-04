import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { theme } from '../theme';
import type { CodeBlockScene } from '../types';

export const CodeBlock: React.FC<CodeBlockScene> = ({ language, code, caption }) => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const slideUp = interpolate(frame, [0, 20], [30, 0], { extrapolateRight: 'clamp' });

  const lines = code.split('\n');

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bg,
        fontFamily: theme.font.family,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.lg,
        opacity: fadeIn,
        transform: `translateY(${slideUp}px)`,
      }}
    >
      {/* Language badge */}
      <div
        style={{
          alignSelf: 'flex-start',
          marginLeft: 120,
          marginBottom: theme.spacing.xs,
          backgroundColor: theme.colors.primary,
          color: '#000',
          padding: '6px 18px',
          borderRadius: `${theme.radius.sm}px ${theme.radius.sm}px 0 0`,
          fontSize: theme.font.size.small,
          fontWeight: theme.font.weight.bold,
          textTransform: 'uppercase',
        }}
      >
        {language}
      </div>

      {/* Code area */}
      <div
        style={{
          backgroundColor: '#111111',
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
          width: '80%',
          maxHeight: '70%',
          overflow: 'hidden',
        }}
      >
        {lines.map((line, i) => {
          const lineDelay = i * 3;
          const lineOpacity = interpolate(frame, [lineDelay, lineDelay + 10], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 20,
                opacity: lineOpacity,
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  color: theme.colors.textMuted,
                  fontSize: 22,
                  fontFamily: "'Courier New', monospace",
                  minWidth: 36,
                  textAlign: 'right',
                  userSelect: 'none',
                }}
              >
                {i + 1}
              </span>
              <span
                style={{
                  color: theme.colors.text,
                  fontSize: 24,
                  fontFamily: "'Courier New', monospace",
                  whiteSpace: 'pre',
                  wordBreak: 'keep-all',
                }}
              >
                {line}
              </span>
            </div>
          );
        })}
      </div>

      {/* Caption */}
      {caption && (
        <p
          style={{
            marginTop: theme.spacing.sm,
            fontSize: theme.font.size.small,
            color: theme.colors.textMuted,
            textAlign: 'center',
            wordBreak: 'keep-all',
          }}
        >
          {caption}
        </p>
      )}
    </AbsoluteFill>
  );
};
