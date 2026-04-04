import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';

export const AiFreeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps, width, height } = useVideoConfig();

  // Wave animation
  const waveAnimationProgress = spring({
    frame: frame,
    fps,
    config: {
      damping: 200,
      stiffness: 100,
    },
    durationInFrames: fps * 3, // Wave appears over 3 seconds
  });

  const waveY = interpolate(waveAnimationProgress, [0, 1], [0, -height * 0.6], {
    extrapolateRight: 'clamp',
  });
  const waveScaleX = interpolate(waveAnimationProgress, [0, 1], [0.8, 1.1], {
    extrapolateRight: 'clamp',
  });
  const waveOpacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateLeft: 'clamp',
  });

  // Fearful person animation
  const fearfulStartFrame = fps * 0.5;
  const fearfulEndFrame = fps * 4;

  const fearfulOpacity = interpolate(frame, [fearfulStartFrame, fearfulStartFrame + fps * 1.5, fearfulEndFrame], [0, 1, 0.2], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fearfulX = interpolate(frame, [fearfulStartFrame, fearfulStartFrame + fps * 2, fearfulEndFrame], [width * 0.1, width * 0.05, width * -0.1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fearfulY = interpolate(frame, [fearfulStartFrame, fearfulStartFrame + fps * 1], [height * 0.75, height * 0.8], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fearfulScale = interpolate(frame, [fearfulStartFrame, fearfulStartFrame + fps * 1.5], [0.8, 0.6], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fearfulRotate = interpolate(frame, [fearfulStartFrame, fearfulStartFrame + fps * 0.5, fearfulStartFrame + fps * 1], [0, -5, 5], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fearfulTremble = interpolate(frame % (fps / 4), [0, fps / 8, fps / 4], [0, 0.5, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });


  // Surfer animation
  const surferStartFrame = fps * 2;
  const surferEnterProgress = spring({
    frame: frame - surferStartFrame,
    fps,
    config: {
      damping: 200,
      stiffness: 100,
    },
    durationInFrames: fps * 2,
  });

  const surferX = interpolate(surferEnterProgress, [0, 1], [width * 0.1, width * 0.7], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const surferY = interpolate(surferEnterProgress, [0, 1], [height * 0.7, height * 0.3], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const surferRotate = interpolate(surferEnterProgress, [0, 1], [-10, 5], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const surferOpacity = interpolate(frame, [surferStartFrame - fps * 0.5, surferStartFrame], [0, 1], {
    extrapolateLeft: 'clamp',
  });

  // Small AI symbol above the wave or in the background
  const aiSymbolOpacity = interpolate(frame, [0, fps * 1], [0, 0.15], {
    extrapolateLeft: 'clamp',
  });
  const aiSymbolScale = interpolate(frame, [0, fps * 2], [0.8, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const aiSymbolRotate = interpolate(frame, [0, durationInFrames], [0, 360], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg, overflow: 'hidden' }}>
        {/* AI Symbol in background (subtle) */}
        <div
            style={{
                position: 'absolute',
                left: '50%',
                top: '20%',
                transform: `translate(-50%, -50%) scale(${aiSymbolScale}) rotate(${aiSymbolRotate}deg)`,
                opacity: aiSymbolOpacity,
                zIndex: 0,
            }}
        >
            <svg width="150" height="150" viewBox="0 0 150 150">
                {/* Brain-like shape or abstract AI icon */}
                <path
                    d="M75 10 A60 60 0 0 1 135 70 C135 100, 100 140, 75 140 C50 140, 15 100, 15 70 A60 60 0 0 1 75 10 Z"
                    fill={theme.textMuted}
                    opacity={0.3}
                />
                <circle cx="75" cy="70" r="15" fill={theme.textMuted} opacity={0.5} />
                <circle cx="50" cy="50" r="8" fill={theme.textMuted} opacity={0.5} />
                <circle cx="100" cy="50" r="8" fill={theme.textMuted} opacity={0.5} />
                <circle cx="50" cy="90" r="8" fill={theme.textMuted} opacity={0.5} />
                <circle cx="100" cy="90" r="8" fill={theme.textMuted} opacity={0.5} />
            </svg>
        </div>


      {/* The Wave */}
      <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: height * 1.2, // Make the container taller to ensure wave fills
          transform: `translateY(${waveY}px)`,
          transformOrigin: 'bottom center',
          opacity: waveOpacity,
      }}>
        <svg
          width={width * 1.5}
          height={height * 1.2}
          viewBox={`0 0 ${width * 1.5} ${height * 1.2}`}
          style={{
            position: 'absolute',
            bottom: 0,
            left: -width * 0.25,
            transform: `scaleX(${waveScaleX})`,
            transformOrigin: 'bottom center',
          }}
        >
          {/* First layer of wave */}
          <path
            d={`M0 ${height * 1.2} Q${width * 0.375} ${height * 1.2 - height * 0.2}, ${width * 0.75} ${height * 1.2 - height * 0.1} T${width * 1.125} ${height * 1.2 - height * 0.3} T${width * 1.5} ${height * 1.2 - height * 0.1} V${height * 1.2} Z`}
            fill={theme.primary}
            opacity={0.8}
          />
          {/* Second layer (slightly higher) */}
          <path
            d={`M0 ${height * 1.2 - height * 0.05} Q${width * 0.375} ${height * 1.2 - height * 0.25}, ${width * 0.75} ${height * 1.2 - height * 0.15} T${width * 1.125} ${height * 1.2 - height * 0.35} T${width * 1.5} ${height * 1.2 - height * 0.15} V${height * 1.2 - height * 0.05} Z`}
            fill={theme.primary}
            opacity={0.9}
          />
          {/* Third layer (crest, highest) */}
          <path
            d={`M0 ${height * 1.2 - height * 0.1} Q${width * 0.375} ${height * 1.2 - height * 0.3}, ${width * 0.75} ${height * 1.2 - height * 0.2} T${width * 1.125} ${height * 1.2 - height * 0.4} T${width * 1.5} ${height * 1.2 - height * 0.2} V${height * 1.2 - height * 0.1} Z`}
            fill={theme.primary}
            opacity={1}
          />
        </svg>
      </div>


      {/* Fearful Person */}
      <div
        style={{
          position: 'absolute',
          left: fearfulX,
          top: fearfulY,
          opacity: fearfulOpacity,
          transform: `scale(${fearfulScale}) rotate(${fearfulRotate + fearfulTremble}deg)`,
          transformOrigin: 'center bottom',
          zIndex: 1,
        }}
      >
        <svg width="60" height="80" viewBox="0 0 60 80">
          <circle cx="30" cy="15" r="10" fill={theme.textMuted} /> {/* Head */}
          <path d="M30 25 V45 H20 M30 45 L40 45 M20 45 L15 55 M40 45 L45 55" stroke={theme.textMuted} strokeWidth="4" fill="none" strokeLinecap="round" /> {/* Body + Arms */}
          <path d="M25 55 L20 65 M35 55 L40 65" stroke={theme.textMuted} strokeWidth="4" fill="none" strokeLinecap="round" /> {/* Legs */}
          <path d="M20 18 C25 25, 35 25, 40 18" fill="none" stroke={theme.textMuted} strokeWidth="2" strokeLinecap="round" /> {/* Sad/Scared Mouth */}
          <circle cx="25" cy="12" r="1" fill={theme.textMuted} /> {/* Eye */}
          <circle cx="35" cy="12" r="1" fill={theme.textMuted} /> {/* Eye */}
        </svg>
      </div>

      {/* Surfing Person */}
      <div
        style={{
          position: 'absolute',
          left: surferX,
          top: surferY,
          opacity: surferOpacity,
          transform: `rotate(${surferRotate}deg) scale(0.9)`,
          transformOrigin: 'center bottom',
          zIndex: 2,
        }}
      >
        {/* Surfboard */}
        <svg width="120" height="40" viewBox="0 0 120 40" style={{ position: 'absolute', top: 30, left: -30 }}>
            <ellipse cx="60" cy="20" rx="55" ry="15" fill={theme.accent} />
        </svg>

        {/* Person */}
        <svg width="70" height="100" viewBox="0 0 70 100">
            <circle cx="35" cy="15" r="12" fill={theme.text} /> {/* Head */}
            <path d="M35 27 V55 H25 M35 55 L45 55 M25 55 L20 65 M45 55 L50 65" stroke={theme.text} strokeWidth="5" fill="none" strokeLinecap="round"/> {/* Body + Arms */}
            <path d="M30 65 L25 80 M40 65 L45 80" stroke={theme.text} strokeWidth="5" fill="none" strokeLinecap="round"/> {/* Legs */}
            <path d="M28 17 C30 20, 40 20, 42 17" fill="none" stroke={theme.text} strokeWidth="2" strokeLinecap="round"/> {/* Smile */}
            <circle cx="30" cy="12" r="1.5" fill={theme.text} /> {/* Eye */}
            <circle cx="40" cy="12" r="1.5" fill={theme.text} /> {/* Eye */}
        </svg>
      </div>
    </AbsoluteFill>
  );
};