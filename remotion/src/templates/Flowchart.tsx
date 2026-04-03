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
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, flexWrap: 'wrap' }}>
        {nodes.map((node, i) => {
          const delay = i * 10;
          const opacity = interpolate(
            frame,
            [delay, delay + theme.animation.duration.normal],
            [0, 1],
            { extrapolateRight: 'clamp' }
          );
          const hasEdgeOut = edges.some((e) => e.from === node.id);

          return (
            <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
              <div
                style={{
                  padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                  backgroundColor: theme.colors.card,
                  border: `2px solid ${theme.colors.primary}`,
                  borderRadius: theme.radius.md,
                  fontSize: theme.font.size.body,
                  fontWeight: theme.font.weight.bold,
                  color: theme.colors.text,
                  opacity,
                  minWidth: 140,
                  textAlign: 'center',
                }}
              >
                {node.label}
              </div>
              {hasEdgeOut && (
                <div
                  style={{
                    fontSize: theme.font.size.h2,
                    color: theme.colors.primary,
                    opacity,
                    fontWeight: theme.font.weight.bold,
                    lineHeight: 1,
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
