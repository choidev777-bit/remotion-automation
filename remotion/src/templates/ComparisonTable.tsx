import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { theme } from '../theme';
import type { ComparisonTableScene } from '../types';

export const ComparisonTable: React.FC<ComparisonTableScene> = ({ headers, rows }) => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  const cellStyle: React.CSSProperties = {
    padding: '16px 24px',
    fontSize: 26,
    color: theme.colors.text,
    borderBottom: `1px solid ${theme.colors.border}`,
    wordBreak: 'keep-all',
    overflowWrap: 'break-word',
    textAlign: 'center',
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bg,
        fontFamily: theme.font.family,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.lg,
        opacity: fadeIn,
      }}
    >
      <table
        style={{
          borderCollapse: 'collapse',
          width: '85%',
          maxWidth: 1400,
          borderRadius: theme.radius.md,
          overflow: 'hidden',
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        {/* Header */}
        <thead>
          <tr>
            {headers.map((h, ci) => (
              <th
                key={ci}
                style={{
                  ...cellStyle,
                  backgroundColor: theme.colors.card,
                  color: ci === 0 ? theme.colors.textMuted : theme.colors.primary,
                  fontWeight: theme.font.weight.bold,
                  fontSize: 28,
                  borderBottom: `2px solid ${theme.colors.primary}`,
                  opacity: interpolate(frame, [ci * 5, ci * 5 + 12], [0, 1], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  }),
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {rows.map((row, ri) => {
            const rowDelay = 10 + ri * 6;
            const rowOpacity = interpolate(frame, [rowDelay, rowDelay + 10], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });

            return (
              <tr
                key={ri}
                style={{
                  opacity: rowOpacity,
                  backgroundColor: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                }}
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    style={{
                      ...cellStyle,
                      color: ci === 0 ? theme.colors.textMuted : theme.colors.text,
                      fontWeight: ci === 0 ? theme.font.weight.medium : theme.font.weight.regular,
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </AbsoluteFill>
  );
};
