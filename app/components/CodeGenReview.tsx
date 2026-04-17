'use client';

import { useState, useCallback } from 'react';
import type { Scene } from '../../remotion/src/types';

type BatchState = {
  indices: number[];
  status: 'idle' | 'loading' | 'done' | 'error';
  elapsed?: string;
  error?: string;
};

type Props = {
  scenes: Scene[];
  onComplete: (updatedScenes: Scene[]) => void;
};

const BATCH_SIZE = 5;

export function CodeGenReview({ scenes, onComplete }: Props) {
  // ai_free 씬만 추출
  const aiFreeIndices = scenes
    .map((s, i) => (s.type === 'ai_free' ? i : -1))
    .filter((i) => i >= 0);

  // 배치 분할
  const [batches] = useState<BatchState[]>(() => {
    const result: BatchState[] = [];
    for (let i = 0; i < aiFreeIndices.length; i += BATCH_SIZE) {
      result.push({
        indices: aiFreeIndices.slice(i, i + BATCH_SIZE),
        status: 'idle',
      });
    }
    return result;
  });

  const [batchStates, setBatchStates] = useState<BatchState[]>(batches);
  const [generatedCodes, setGeneratedCodes] = useState<Record<number, string>>({});

  const handleGenerateBatch = useCallback(async (batchIdx: number) => {
    const batch = batchStates[batchIdx];
    if (!batch || batch.status === 'loading') return;

    setBatchStates((prev) => {
      const next = [...prev];
      next[batchIdx] = { ...next[batchIdx], status: 'loading', error: undefined };
      return next;
    });

    try {
      const res = await fetch('/api/codegen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenes,
          sceneIndices: batch.indices,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const { results, elapsed } = await res.json();

      // 생성된 코드 저장
      const newCodes: Record<number, string> = {};
      let allParsed = true;
      for (const r of results) {
        if (r.code) {
          newCodes[r.idx] = r.code;
        } else {
          allParsed = false;
        }
      }

      setGeneratedCodes((prev) => ({ ...prev, ...newCodes }));
      setBatchStates((prev) => {
        const next = [...prev];
        next[batchIdx] = {
          ...next[batchIdx],
          status: allParsed ? 'done' : 'error',
          elapsed,
          error: allParsed ? undefined : '일부 씬 파싱 실패',
        };
        return next;
      });
    } catch (err) {
      setBatchStates((prev) => {
        const next = [...prev];
        next[batchIdx] = {
          ...next[batchIdx],
          status: 'error',
          error: String(err),
        };
        return next;
      });
    }
  }, [batchStates, scenes]);

  const allDone = batchStates.every((b) => b.status === 'done');

  const handleComplete = useCallback(() => {
    const updatedScenes = scenes.map((scene, idx) => {
      const code = generatedCodes[idx];
      if (code) {
        return { ...scene, generatedCode: code };
      }
      return scene;
    });
    onComplete(updatedScenes);
  }, [scenes, generatedCodes, onComplete]);

  return (
    <div className="card">
      <p className="card-title">🤖 AI 씬 코드 생성</p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
        배치별로 생성 버튼을 눌러 코드를 생성하세요. 실패 시 다시 시도할 수 있습니다.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 500, overflowY: 'auto', marginBottom: 20 }}>
        {batchStates.map((batch, bIdx) => (
          <div
            key={bIdx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 16px',
              background: 'var(--bg-input)',
              border: `1px solid ${batch.status === 'done' ? 'var(--primary)' : batch.status === 'error' ? '#e74c3c' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {/* 상태 아이콘 */}
            <span style={{ fontSize: 16, flexShrink: 0 }}>
              {batch.status === 'done' && '✅'}
              {batch.status === 'loading' && '⏳'}
              {batch.status === 'error' && '❌'}
              {batch.status === 'idle' && '⬜'}
            </span>

            {/* 배치 정보 */}
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                배치 {bIdx + 1}/{batchStates.length}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                씬 {batch.indices.map(i => i + 1).join(', ')}
              </span>
              {batch.elapsed && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                  ({batch.elapsed}초)
                </span>
              )}
              {batch.error && (
                <div style={{ fontSize: 11, color: '#e74c3c', marginTop: 4 }}>
                  {batch.error}
                </div>
              )}
            </div>

            {/* 생성/재시도 버튼 */}
            {batch.status !== 'loading' && batch.status !== 'done' && (
              <button
                style={{
                  background: batch.status === 'error' ? '#e74c3c' : 'var(--primary)',
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '6px 14px',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                onClick={() => handleGenerateBatch(bIdx)}
              >
                {batch.status === 'error' ? '🔄 다시 시도' : '▶️ 생성'}
              </button>
            )}

            {batch.status === 'loading' && (
              <span className="spinner" style={{ flexShrink: 0 }} />
            )}
          </div>
        ))}
      </div>

      <button
        className="btn-primary"
        style={{ width: '100%', opacity: allDone ? 1 : 0.4 }}
        disabled={!allDone}
        onClick={handleComplete}
      >
        {allDone ? '✅ 코드 생성 완료 — 미리보기' : `⏳ ${batchStates.filter(b => b.status === 'done').length}/${batchStates.length} 배치 완료`}
      </button>
    </div>
  );
}
