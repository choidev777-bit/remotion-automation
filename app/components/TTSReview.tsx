'use client';

import { useState, useCallback, useRef } from 'react';
import type { Scene } from '../../remotion/src/types';

type TTSCandidate = {
  audioSrc: string;
  duration: number;
};

type SceneTTSState = {
  candidates: TTSCandidate[];
  selectedIdx: number;
  isRegenerating: boolean;
  ttsText: string;  // 발음용 대본 (빈 문자열이면 narration 사용)
};

type Props = {
  scenes: Scene[];
  jobId: string;
  onApprove: (updatedScenes: Scene[]) => void;
};

export function TTSReview({ scenes, jobId, onApprove }: Props) {
  // 나레이션이 있는 씬만 추출
  const narrationIndices = scenes
    .map((s, i) => (s.narration ? i : -1))
    .filter((i) => i >= 0);

  // 씬별 TTS 상태: 초기값은 파이프라인에서 생성된 기존 TTS
  const [ttsStates, setTtsStates] = useState<Record<number, SceneTTSState>>(() => {
    const initial: Record<number, SceneTTSState> = {};
    for (const idx of narrationIndices) {
      const scene = scenes[idx];
      const audioSrc = (scene as { audioSrc?: string }).audioSrc;
      if (audioSrc) {
        initial[idx] = {
          candidates: [{ audioSrc, duration: scene.durationInFrames / 30 }],
          selectedIdx: 0,
          isRegenerating: false,
          ttsText: (scene as { ttsText?: string }).ttsText || scene.narration || '',
        };
      } else {
        initial[idx] = { candidates: [], selectedIdx: 0, isRegenerating: false, ttsText: scene.narration || '' };
      }
    }
    return initial;
  });

  const audioRefs = useRef<Record<number, HTMLAudioElement | null>>({});

  // 특정 씬 TTS 재생성
  const handleRegenerate = useCallback(async (sceneIdx: number) => {
    const scene = scenes[sceneIdx];
    if (!scene.narration) return;

    // ✅ ttsStates에서 직접 읽기 (setState updater 안에서 읽으면 비동기라 반영 안 됨)
    const candidateNum = (ttsStates[sceneIdx]?.candidates.length ?? 0) + 1;

    setTtsStates((prev) => ({
      ...prev,
      [sceneIdx]: { ...prev[sceneIdx], isRegenerating: true },
    }));

    try {
      // timestamp를 붙여 파일명 충돌 완전 방지
      const ttsJobId = `${jobId}-scene-${sceneIdx}-v${candidateNum}-${Date.now()}`;
      // 발음용 대본이 있으면 그걸 사용, 없으면 원본 narration
      const currentTtsText = ttsStates[sceneIdx]?.ttsText;
      const textForTTS = currentTtsText?.trim() || scene.narration;

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textForTTS, jobId: ttsJobId }),
      });

      if (!res.ok) throw new Error(`TTS 실패: ${res.status}`);
      const { audioSrc, duration } = await res.json();

      // Whisper STT
      let words: { word: string; start: number; end: number }[] | undefined;
      try {
        const whisperRes = await fetch('/api/whisper', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioPath: audioSrc }),
        });
        if (whisperRes.ok) {
          const whisperData = await whisperRes.json();
          if (whisperData.words?.length > 0) {
            words = whisperData.words;
          }
        }
      } catch { /* whisper 실패 무시 */ }

      const newCandidate = { audioSrc, duration, words };

      setTtsStates((prev) => {
        const state = prev[sceneIdx];
        const newCandidates = [...state.candidates, newCandidate];
        return {
          ...prev,
          [sceneIdx]: {
            candidates: newCandidates,
            selectedIdx: newCandidates.length - 1,
            isRegenerating: false,
            ttsText: state.ttsText,
          },
        };
      });
    } catch (err) {
      console.error(`[TTSReview] 씬 ${sceneIdx} 재생성 실패:`, err);
      setTtsStates((prev) => ({
        ...prev,
        [sceneIdx]: { ...prev[sceneIdx], isRegenerating: false },
      }));
    }
  }, [scenes, jobId, ttsStates]);

  // 후보 선택
  const handleSelect = useCallback((sceneIdx: number, candidateIdx: number) => {
    setTtsStates((prev) => ({
      ...prev,
      [sceneIdx]: { ...prev[sceneIdx], selectedIdx: candidateIdx },
    }));
  }, []);

  // 재생
  const handlePlay = useCallback((sceneIdx: number, audioSrc: string) => {
    // 다른 오디오 정지
    Object.values(audioRefs.current).forEach((el) => {
      if (el) { el.pause(); el.currentTime = 0; }
    });

    const audio = audioRefs.current[sceneIdx];
    if (audio) {
      // audioSrc: "audio/audio-xxx.wav" → basename만 추출
      const filename = audioSrc.split('/').pop() ?? audioSrc;
      audio.src = `/api/audio?file=${encodeURIComponent(filename)}`;
      audio.play().catch(() => {});
    }
  }, []);

  // 전체 승인 → 선택된 TTS로 씬 업데이트
  const handleApproveAll = useCallback(() => {
    const updatedScenes = scenes.map((scene, idx) => {
      const state = ttsStates[idx];
      if (!state || state.candidates.length === 0) return scene;

      const selected = state.candidates[state.selectedIdx];
      return {
        ...scene,
        audioSrc: selected.audioSrc,
        durationInFrames: Math.max(60, Math.round(selected.duration * 30)),
        ...(state.ttsText?.trim() && state.ttsText.trim() !== scene.narration?.trim() ? { ttsText: state.ttsText.trim() } : {}),
      };
    });
    onApprove(updatedScenes);
  }, [scenes, ttsStates, onApprove]);

  return (
    <div className="card">
      <p className="card-title">🔊 TTS 리뷰</p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
        각 씬의 음성을 확인하세요. 마음에 들지 않으면 재생성할 수 있습니다.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 600, overflowY: 'auto', marginBottom: 20 }}>
        {narrationIndices.map((idx) => {
          const scene = scenes[idx];
          const state = ttsStates[idx];
          if (!state) return null;

          return (
            <div
              key={idx}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '14px 16px',
              }}
            >
              {/* 씬 헤더 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>씬 {idx + 1}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {state.candidates.length}개 후보
                </span>
              </div>

              {/* 나레이션 텍스트 (화면 표시용) */}
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px', lineHeight: 1.6 }}>
                📝 {scene.narration}
              </p>

              {/* 발음용 대본 편집 */}
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  🔤 발음용 대본 (비워두면 원본 사용)
                </label>
                <input
                  type="text"
                  value={state.ttsText}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTtsStates((prev) => ({
                      ...prev,
                      [idx]: { ...prev[idx], ttsText: val },
                    }));
                  }}
                  placeholder={scene.narration}
                  style={{
                    width: '100%',
                    fontSize: 12,
                    padding: '6px 10px',
                    background: 'var(--bg-card)',
                    border: (state.ttsText?.trim() && state.ttsText.trim() !== scene.narration?.trim()) ? '1px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: 6,
                    color: 'var(--text)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* TTS 후보 목록 */}
              {state.candidates.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                  {state.candidates.map((candidate, cIdx) => (
                    <div
                      key={cIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 10px',
                        background: state.selectedIdx === cIdx ? 'rgba(0,210,106,0.15)' : 'var(--bg-card)',
                        border: state.selectedIdx === cIdx ? '1px solid var(--primary)' : '1px solid var(--border)',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                      onClick={() => handleSelect(idx, cIdx)}
                    >
                      <span style={{ fontSize: 12, fontWeight: state.selectedIdx === cIdx ? 700 : 400 }}>
                        {state.selectedIdx === cIdx ? '✅' : '⬜'} v{cIdx + 1}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', flex: 1 }}>
                        {candidate.duration.toFixed(1)}초
                      </span>
                      <button
                        style={{
                          background: 'none', border: 'none', color: 'var(--primary)',
                          cursor: 'pointer', fontSize: 14, padding: '2px 6px',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlay(idx, candidate.audioSrc);
                        }}
                      >
                        ▶️
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 숨겨진 오디오 엘리먼트 */}
              <audio
                ref={(el) => { audioRefs.current[idx] = el; }}
                preload="none"
              />

              {/* 재생성 버튼 */}
              <button
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  color: 'var(--text)',
                  fontSize: 12,
                  padding: '6px 14px',
                  cursor: state.isRegenerating ? 'not-allowed' : 'pointer',
                  opacity: state.isRegenerating ? 0.6 : 1,
                }}
                disabled={state.isRegenerating}
                onClick={() => handleRegenerate(idx)}
              >
                {state.isRegenerating ? '⏳ 재생성 중...' : '🔄 재생성'}
              </button>
            </div>
          );
        })}
      </div>

      <button
        className="btn-primary"
        style={{ width: '100%' }}
        onClick={handleApproveAll}
      >
        ✅ TTS 승인 — AI 씬 코드 생성
      </button>
    </div>
  );
}
