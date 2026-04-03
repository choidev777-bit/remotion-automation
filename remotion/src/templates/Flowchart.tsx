import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { theme } from '../theme';
import type { FlowchartScene } from '../types';

export const Flowchart: React.FC<FlowchartScene> = ({ heading, nodes, edges }) => {
  const frame = useCurrentFrame();

  const headingOpacity = interpolate(frame, [0, theme.animation.duration.normal], [0, 1], {
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
        fontFamily: theme.font.family,
        padding: `0 ${theme.spacing.xxl}px`,
      }}
    >
      <h2
        style={{
          fontSize: theme.font.size.h2,
          fontWeight: theme.font.weight.bold,
          color: theme.colors.primary,
          margin: 0,
          marginBottom: theme.spacing.xl,
          opacity: headingOpacity,
          letterSpacing: '-1px',
        }}
      >
        {heading}
      </h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
        {nodes.map((node, i) => {
          const delay = i * 10;
          const opacity = interpolate(
            frame,
            [delay, delay + theme.animation.duration.normal],
            [0, 1],
            { extrapolateRight: 'clamp' }
          );
          const translateY = interpolate(
            frame,
            [delay, delay + theme.animation.duration.normal],
            [30, 0],
            { extrapolateRight: 'clamp' }
          );
          const hasEdgeOut = edges.some((e) => e.from === node.id);

          return (
            <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
              {/* 노드 박스 */}
              <div
                style={{
                  padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                  backgroundColor: theme.colors.card,
                  border: `2px solid ${theme.colors.primary}`,
                  borderRadius: theme.radius.md,
                  fontSize: theme.font.size.h3,
                  fontWeight: theme.font.weight.bold,
                  color: theme.colors.text,
                  opacity,
                  transform: `translateY(${translateY}px)`,
                  minWidth: 180,
                  textAlign: 'center',
                  boxShadow: `0 0 24px ${theme.colors.primaryGlow}`,
                }}
              >
                {node.label}
              </div>
              {/* 화살표 */}
              {hasEdgeOut && (
                <div
                  style={{
                    fontSize: theme.font.size.h2,
                    color: theme.colors.primary,
                    opacity,
                    fontWeight: theme.font.weight.bold,
                    lineHeight: 1,
                    textShadow: `0 0 16px ${theme.colors.primary}`,
                  }}
                >
                  →
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
