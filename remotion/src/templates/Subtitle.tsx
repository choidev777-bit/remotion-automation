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
  narration?: string;
  audioOffsetSec?: number;
}

/**
 * narration에 / 구분자가 있으면 그 기준으로 자막 청크를 분할.
 * / 구분자가 없으면 쉼표·마침표 기준 폴백.
 * 각 청크의 타이밍은 Whisper word 타이밍에서 매핑.
 */
export const Subtitle: React.FC<SubtitleProps> = ({ words, narration, audioOffsetSec = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentSec = frame / fps - audioOffsetSec;

  if (!words || words.length === 0) return null;

  // narration에 /가 있는지 확인
  const hasSlashDelimiter = narration && narration.includes('/');

  let chunks: { text: string; start: number; end: number }[];

  if (hasSlashDelimiter) {
    // / 구분자 기반 분할
    const rawChunks = narration.split('/').map((c: string) => c.trim()).filter((c: string) => c.length > 0);

    // 각 청크의 단어를 Whisper 타이밍에 순서대로 매핑
    chunks = [];
    let wordIdx = 0;

    for (const chunkText of rawChunks) {
      const chunkWords = chunkText.split(/\s+/).filter((w: string) => w.length > 0);
      const startWordIdx = wordIdx;
      const endWordIdx = Math.min(wordIdx + chunkWords.length - 1, words.length - 1);

      if (startWordIdx < words.length) {
        chunks.push({
          text: chunkText,
          start: words[startWordIdx].start,
          end: words[Math.min(endWordIdx, words.length - 1)].end,
        });
      }

      wordIdx += chunkWords.length;
    }
  } else {
    // 폴백: 쉼표·마침표 기준 분할
    chunks = [];
    let buf: Word[] = [];

    const flushBuf = () => {
      if (buf.length === 0) return;
      chunks.push({
        text: buf.map((w) => w.word).join(' ').trim(),
        start: buf[0].start,
        end: buf[buf.length - 1].end,
      });
      buf = [];
    };

    for (const w of words) {
      buf.push(w);
      if (/[.?!。,]/.test(w.word) || w === words[words.length - 1]) {
        flushBuf();
      }
    }
  }

  // 현재 시간에 해당하는 청크 찾기
  const active = chunks.find(
    (s) => currentSec >= s.start - 0.05 && currentSec <= s.end + 0.05
  );

  if (!active) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 48,
        left: '10%',
        right: '10%',
        textAlign: 'center',
        fontFamily: theme.font.family,
        zIndex: 999,
      }}
    >
      <span
        style={{
          fontSize: 44,
          fontWeight: 800,
          color: '#ffffff',
          lineHeight: 1.4,
          letterSpacing: '-0.5px',
          textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.9)',
        }}
      >
        {active.text}
      </span>
    </div>
  );
};
