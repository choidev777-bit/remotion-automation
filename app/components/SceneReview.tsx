'use client';

import React, { useState } from 'react';
import type { Scene } from '../../remotion/src/types';

interface SceneReviewProps {
  scenes: Scene[];
  onApprove: (scenes: Scene[]) => void;
  onBack: () => void;
}

/**
 * 씬 분할 리뷰 UI.
 * AI가 분할한 씬 목록을 보여주고, 씬 편집/삭제/추가가 가능.
 */
export const SceneReview: React.FC<SceneReviewProps> = ({
  scenes: initialScenes,
  onApprove,
  onBack,
}) => {
  const [scenes, setScenes] = useState<Scene[]>(initialScenes);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  const handleEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditText(scenes[idx].narration || '');
  };

  const handleSaveEdit = () => {
    if (editingIdx === null) return;
    const updated = [...scenes];
    const original = updated[editingIdx];
    const narrationChanged = original.narration !== editText;
    updated[editingIdx] = {
      ...original,
      narration: editText,
      // 나레이션이 변경되면 이전 TTS/Whisper 데이터 무효화
      ...(narrationChanged ? { words: undefined, audioSrc: undefined } : {}),
    };
    setScenes(updated);
    setEditingIdx(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingIdx(null);
    setEditText('');
  };

  const handleDelete = (idx: number) => {
    setScenes(scenes.filter((_, i) => i !== idx));
    if (editingIdx === idx) {
      setEditingIdx(null);
      setEditText('');
    }
  };

  const handleAdd = (afterIdx: number) => {
    const newScene: Scene = {
      type: 'ai_free',
      durationInFrames: 120,
      narration: '',
      prompt: '',
      generatedCode: '',
    };
    const updated = [...scenes];
    updated.splice(afterIdx + 1, 0, newScene);
    setScenes(updated);
    // 새 씬 바로 편집 모드로 진입
    setEditingIdx(afterIdx + 1);
    setEditText('');
  };

  return (
    <div className="script-review">
      <div className="script-review-header">
        <h2 className="script-review-title">🎬 씬 분할 검토</h2>
        <span className="script-meta">
          {scenes.length}개 씬
        </span>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
        AI가 나눈 씬을 확인하세요. 나레이션 수정, 씬 삭제, 씬 추가가 가능합니다.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 600, overflowY: 'auto', marginBottom: 20, paddingRight: 4 }}>
        {scenes.map((scene, idx) => (
          <React.Fragment key={idx}>
            <div
              style={{
                background: editingIdx === idx ? 'rgba(0, 200, 150, 0.04)' : 'var(--bg-input)',
                border: `1px solid ${editingIdx === idx ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '14px 16px',
                transition: 'border-color 0.15s',
              }}
            >
              {/* 헤더 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: editingIdx === idx ? 10 : 0 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, background: 'var(--primary-glow)',
                  color: 'var(--primary)', padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap',
                }}>
                  씬 {idx + 1}
                </span>
                {(scene as any).keyword && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {(scene as any).keyword}
                  </span>
                )}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  {editingIdx === idx ? (
                    <>
                      <button
                        className="scene-editor-btn scene-editor-btn--confirm"
                        onClick={handleSaveEdit}
                      >
                        ✓ 저장
                      </button>
                      <button
                        className="scene-editor-btn scene-editor-btn--cancel"
                        onClick={handleCancelEdit}
                      >
                        취소
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="scene-editor-btn"
                        onClick={() => handleEdit(idx)}
                      >
                        ✏️ 편집
                      </button>
                      <button
                        className="scene-editor-btn scene-editor-btn--delete"
                        onClick={() => handleDelete(idx)}
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 내용 */}
              {editingIdx === idx ? (
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 6, color: 'var(--text)', fontSize: 13, padding: '10px 12px',
                    fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
                    outline: 'none', lineHeight: 1.6,
                  }}
                  autoFocus
                />
              ) : (
                <p style={{
                  fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6,
                  margin: '6px 0 0', wordBreak: 'keep-all', overflowWrap: 'break-word',
                }}>
                  {scene.narration || <em style={{ opacity: 0.5 }}>나레이션 없음</em>}
                </p>
              )}
            </div>

            {/* 씬 사이 추가 버튼 */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                className="timeline-insert-btn"
                title={`씬 ${idx + 1} 뒤에 추가`}
                onClick={() => handleAdd(idx)}
              >
                +
              </button>
            </div>
          </React.Fragment>
        ))}
      </div>

      <div className="script-actions">
        <button
          id="scene-review-back"
          className="btn btn-secondary"
          onClick={onBack}
        >
          ← 자막 분할로 돌아가기
        </button>
        <button
          id="scene-review-approve"
          className="btn btn-primary"
          disabled={scenes.length === 0}
          onClick={() => onApprove(scenes)}
        >
          ✅ 승인 · 미디어 삽입으로
        </button>
      </div>
    </div>
  );
};
