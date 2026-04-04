import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';

interface Word {
  word: string;
  start: number;
  end: number;
}

interface SubtitleProps {
  words: Word[];
  audioOffsetSec?: number; // 오디오 시작 오프셋 (기본 0)
}

/**
 * Whisper word-level 타임스탬프 기반 자막 오버레이.
 * 현재 프레임 시간에 해당하는 단어를 화면 하단에 표시한다.
 * 최대 2개 단어를 그룹으로 묶어 표시 (가독성).
 */
export const Subtitle: React.FC<SubtitleProps> = ({ words, audioOffsetSec = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const currentSec = frame / fps - audioOffsetSec;

  // 현재 시각에 표시할 단어 그룹 찾기
  const activeWords = words.filter(
    (w) => currentSec >= w.start - 0.05 && currentSec <= w.end + 0.05
  );

  // 현재 단어 + 앞뒤 컨텍스트 (최대 6단어 한 줄)
  const currentWordIdx = words.findIndex(
    (w) => currentSec >= w.start - 0.05 && currentSec <= w.end + 0.05
  );

  const contextStart = Math.max(0, currentWordIdx - 2);
  const contextEnd = Math.min(words.length - 1, currentWordIdx + 3);
  const contextWords = currentWordIdx >= 0 ? words.slice(contextStart, contextEnd + 1) : [];

  if (contextWords.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 48,
        left: '10%',
        right: '10%',
        textAlign: 'center',
        fontFamily: theme.font.family,
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '4px',
        zIndex: 999,
      }}
    >
      {contextWords.map((w, i) => {
        const isActive = activeWords.some((aw) => aw.word === w.word && aw.start === w.start);
        return (
          <span
            key={`${w.start}-${i}`}
            style={{
              fontSize: 28,
              fontWeight: isActive ? 800 : 500,
              color: isActive ? theme.colors.primary : 'rgba(255,255,255,0.75)',
              backgroundColor: 'rgba(0,0,0,0.65)',
              padding: '4px 10px',
              borderRadius: 8,
              lineHeight: 1.4,
              transition: 'color 0.1s',
              backdropFilter: 'blur(4px)',
              letterSpacing: '-0.3px',
            }}
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
};
