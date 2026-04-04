import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { theme } from '../theme';
import type { FlowchartScene } from '../types';

export const Flowchart: React.FC<FlowchartScene> = ({ heading, nodes, edges }) => {
  const frame = useCurrentFrame();

  const headingOpacity = interpolate(frame, [0, theme.animation.duration.normal], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // nodes가 string[] 또는 {id, label}[] 둘 다 허용
  const normalizedNodes = (nodes ?? []).map((n, i) => {
    if (typeof n === 'string') return { id: String(i), label: n };
    return {
      id: String((n as { id?: string | number }).id ?? i),
      label: (n as { label?: string }).label ?? '',
    };
  });

  // edges가 없거나 잘못된 경우 빈 배열로 폴백
  const safeEdges = Array.isArray(edges) ? edges : [];

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

      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, flexWrap: 'wrap', justifyContent: 'center' }}>
        {normalizedNodes.map((node, i) => {
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
          // edges가 있으면 edges 기준, 없으면 마지막 노드 제외 모두 화살표 표시
          const hasEdgeOut = safeEdges.length > 0
            ? safeEdges.some((e) => String(e.from) === node.id)
            : i < normalizedNodes.length - 1;

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
                  minWidth: 160,
                  textAlign: 'center',
                  boxShadow: `0 0 24px ${theme.colors.primaryGlow}`,
                  wordBreak: 'keep-all',
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
