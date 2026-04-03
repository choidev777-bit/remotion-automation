import React from 'react';
import {
  AbsoluteFill,
  Img,
  Video,
  staticFile,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { theme } from '../theme';
import type { UserMediaScene } from '../types';

export const UserMedia: React.FC<UserMediaScene> = ({ mediaSrc, mediaType, caption }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // 페이드인 (처음 0.5초) + 페이드아웃 (마지막 0.5초)
  const fadeFrames = Math.min(15, Math.floor(durationInFrames * 0.15));
  const opacity = interpolate(
    frame,
    [0, fadeFrames, durationInFrames - fadeFrames, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
        fontFamily: theme.font.family,
      }}
    >
      {mediaType === 'image' ? (
        <Img
          src={staticFile(mediaSrc)}
          style={{
            maxWidth: '100%',
            maxHeight: caption ? '85%' : '100%',
            objectFit: 'contain',
          }}
        />
      ) : (
        <Video
          src={staticFile(mediaSrc)}
          style={{
            maxWidth: '100%',
            maxHeight: caption ? '85%' : '100%',
            objectFit: 'contain',
          }}
          // 씬 길이만큼 재생 (오버런 없이)
          endAt={durationInFrames}
        />
      )}

      {caption && (
        <p
          style={{
            position: 'absolute',
            bottom: 32,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: theme.font.size.body,
            color: theme.colors.text,
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: '10px 24px',
            backdropFilter: 'blur(4px)',
          }}
        >
          {caption}
        </p>
      )}
    </AbsoluteFill>
  );
};
