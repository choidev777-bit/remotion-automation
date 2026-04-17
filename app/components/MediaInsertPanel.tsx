'use client';

import React, { useRef, useState } from 'react';
import type { Scene, UserMediaScene } from '../../remotion/src/types';

interface MediaInsertPanelProps {
  scenes: Scene[];
  jobId: string;
  onChange: (newScenes: Scene[]) => void;
}

/** 씬 데이터에서 미리보기 텍스트 추출 */
function getScenePreview(scene: Scene): string {
  switch (scene.type) {
    case 'title':
      return [scene.title, scene.subtitle].filter(Boolean).join('\n');
    case 'highlight_text':
      return [scene.text, scene.emphasis ? `강조: ${scene.emphasis}` : ''].filter(Boolean).join('\n');
    case 'card_list':
      return [scene.heading, ...scene.cards.map((c) => `• ${c.name}${c.desc ? ': ' + c.desc : ''}`)].join('\n');
    case 'flowchart':
      return [scene.heading, ...scene.nodes.map((n) => `→ ${typeof n === 'string' ? n : n.label}`)].join('\n');
    case 'split_screen':
      return [
        `[왼] ${scene.left.heading}`,
        ...scene.left.points.map((p) => `  • ${p}`),
        `[오] ${scene.right.heading}`,
        ...scene.right.points.map((p) => `  • ${p}`),
      ].join('\n');
    case 'code_block':
      return [scene.language, scene.code.slice(0, 120), scene.caption].filter(Boolean).join('\n');
    case 'stat_number':
      return `${scene.stat}${scene.unit ?? ''} — ${scene.label}`;
    case 'comparison_table':
      return [scene.headers.join(' | '), ...scene.rows.map((r) => r.join(' | '))].join('\n');
    case 'gif_insert':
      return [scene.keyword, scene.caption].filter(Boolean).join(' — ');
    case 'user_media':
      return [scene.caption, scene.narration ? `🔊 "${scene.narration}"` : '🔇 무음'].filter(Boolean).join('\n');
    case 'ai_free':
      return (scene as unknown as { narration?: string }).narration || scene.prompt || '';
    default:
      return '';
  }
}

const TYPE_LABELS: Record<string, string> = {
  title: '제목',
  card_list: '카드리스트',
  flowchart: '순서도',
  highlight_text: '핵심문장',
  gif_insert: 'GIF',
  image_insert: '이미지',
  user_media: '📷 내 미디어',
  ai_free: 'AI 커스텀',
  split_screen: '좌우 비교',
  code_block: '코드 블록',
  stat_number: '숫자 통계',
  comparison_table: '비교표',
};

export const MediaInsertPanel: React.FC<MediaInsertPanelProps> = ({
  scenes,
  jobId,
  onChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  // 삽입 폼 상태
  const [insertForm, setInsertForm] = useState<{
    mode: 'insert' | 'replace';
    targetIndex: number;
  } | null>(null);
  const [insertFile, setInsertFile] = useState<File | null>(null);
  const [insertNarration, setInsertNarration] = useState('');
  const [insertDurationSec, setInsertDurationSec] = useState(5);

  const estimatedSec = insertNarration.trim()
    ? Math.max(2, Math.round(insertNarration.trim().length / 5.5))  // 한국어 ~5.5자/초
    : null;

  const toggleExpand = (idx: number) => {
    setExpandedIdx(expandedIdx === idx ? null : idx);
  };

  // 삽입 폼 열기
  const openInsertForm = (mode: 'insert' | 'replace', targetIndex: number) => {
    setInsertForm({ mode, targetIndex });
    setInsertFile(null);
    setInsertNarration('');
    setInsertDurationSec(5);
  };

  const closeInsertForm = () => {
    setInsertForm(null);
    setInsertFile(null);
    setInsertNarration('');
  };

  // 삽입 확정
  const confirmInsert = async () => {
    if (!insertFile || !insertForm) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', insertFile);
      formData.append('jobId', jobId);

      const res = await fetch('/api/upload-media', { method: 'POST', body: formData });
      if (!res.ok) throw new Error((await res.json()).error);
      const { mediaSrc, mediaType } = await res.json();

      const hasNarration = insertNarration.trim().length > 0;
      const duration = hasNarration
        ? (estimatedSec ?? 5) * 30  // 나레이션 있으면 예상 시간 기반 (TTS 후 정확히 재할당)
        : insertDurationSec * 30;    // 나레이션 없으면 수동 설정

      const newScene: UserMediaScene = {
        type: 'user_media',
        durationInFrames: duration,
        mediaSrc,
        mediaType,
        caption: '',
        narration: hasNarration ? insertNarration.trim() : undefined,
      };

      const next = [...scenes];

      if (insertForm.mode === 'insert') {
        next.splice(insertForm.targetIndex + 1, 0, newScene);
      } else {
        next[insertForm.targetIndex] = {
          ...newScene,
          durationInFrames: scenes[insertForm.targetIndex].durationInFrames,
        };
      }

      onChange(next);
      closeInsertForm();
    } catch (err) {
      alert('업로드 실패: ' + String(err));
    } finally {
      setUploading(false);
    }
  };

  const removeScene = (idx: number) => {
    const next = scenes.filter((_, i) => i !== idx);
    onChange(next);
  };

  return (
    <div className="media-panel">
      <div className="media-panel-header">
        <h3 className="media-panel-title">🎬 미디어 삽입</h3>
        <p className="media-panel-desc">
          씬을 클릭하면 내용을 미리보기합니다. + 버튼으로 사이에 미디어를 삽입할 수 있습니다.
        </p>
      </div>

      {/* 씬 타임라인 */}
      <div className="scene-timeline">
        {scenes.map((scene, idx) => (
          <React.Fragment key={idx}>
            {/* 맨 앞 삽입 버튼 */}
            {idx === 0 && (
              <button
                className="timeline-insert-btn"
                onClick={() => openInsertForm('insert', -1)}
                disabled={uploading}
                title="맨 앞에 삽입"
              >
                +
              </button>
            )}

            {/* 씬 카드 */}
            <div
              className={`timeline-scene ${scene.type === 'user_media' ? 'timeline-scene--user' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="timeline-scene-label">
                  씬 {idx + 1}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="timeline-scene-duration">
                    {(scene.durationInFrames / 30).toFixed(1)}s
                  </div>
                  <div className="timeline-scene-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="timeline-btn timeline-btn--replace"
                      onClick={() => {
                        setInsertForm({ mode: 'replace', targetIndex: idx });
                        fileInputRef.current?.click();
                      }}
                      disabled={uploading}
                      title="이 씬을 내 미디어로 교체"
                    >
                      🔄
                    </button>
                    {scene.type === 'user_media' && (
                      <button
                        className="timeline-btn timeline-btn--remove"
                        onClick={() => removeScene(idx)}
                        title="이 씬 삭제"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 대본 항상 표시 */}
              <div className="timeline-scene-preview">
                <pre>{getScenePreview(scene)}</pre>
              </div>
            </div>

            {/* 삽입 폼 (이 씬 뒤에 표시) */}
            {insertForm && insertForm.mode === 'insert' && insertForm.targetIndex === idx && (
              <div className="insert-form" onClick={(e) => e.stopPropagation()}>
                <div className="insert-form-header">
                  📎 씬 {idx + 1} 뒤에 미디어 삽입
                </div>

                {/* 파일 선택 */}
                <div className="insert-form-file">
                  <input
                    type="file"
                    accept="image/*,video/mp4,video/webm,video/mov"
                    onChange={(e) => setInsertFile(e.target.files?.[0] ?? null)}
                    className="insert-form-input"
                  />
                  {insertFile && (
                    <span className="insert-form-filename">✅ {insertFile.name}</span>
                  )}
                </div>

                {/* 나레이션 입력 */}
                <div className="insert-form-narration">
                  <label className="insert-form-label">
                    🔊 나레이션 (선택 — 비우면 무음)
                  </label>
                  <textarea
                    className="insert-form-textarea"
                    placeholder="이 화면에서 읽을 문장을 입력하세요..."
                    value={insertNarration}
                    onChange={(e) => setInsertNarration(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* 조건부: 나레이션 있으면 예상 시간, 없으면 슬라이더 */}
                {insertNarration.trim() ? (
                  <div className="insert-form-estimate">
                    ⏱ 예상 재생 시간: 약 <strong>{estimatedSec}초</strong>
                    <span className="insert-form-estimate-note">
                      (실제 시간은 TTS 생성 후 자동 결정됩니다)
                    </span>
                  </div>
                ) : (
                  <div className="insert-form-duration">
                    <label className="insert-form-label">표시 시간</label>
                    <div className="media-duration-control">
                      <input
                        type="range"
                        min={2}
                        max={30}
                        value={insertDurationSec}
                        onChange={(e) => setInsertDurationSec(Number(e.target.value))}
                        className="media-duration-slider"
                      />
                      <span className="media-duration-value">{insertDurationSec}초</span>
                    </div>
                  </div>
                )}

                {/* 버튼 */}
                <div className="insert-form-actions">
                  <button className="btn btn-secondary" onClick={closeInsertForm}>
                    취소
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={confirmInsert}
                    disabled={!insertFile || uploading}
                  >
                    {uploading ? '⏳ 업로드 중...' : '📎 삽입'}
                  </button>
                </div>
              </div>
            )}

            {/* 맨 앞 삽입 폼 */}
            {idx === 0 && insertForm && insertForm.mode === 'insert' && insertForm.targetIndex === -1 && (
              <div className="insert-form" onClick={(e) => e.stopPropagation()}>
                <div className="insert-form-header">📎 맨 앞에 미디어 삽입</div>
                <div className="insert-form-file">
                  <input
                    type="file"
                    accept="image/*,video/mp4,video/webm,video/mov"
                    onChange={(e) => setInsertFile(e.target.files?.[0] ?? null)}
                    className="insert-form-input"
                  />
                  {insertFile && <span className="insert-form-filename">✅ {insertFile.name}</span>}
                </div>
                <div className="insert-form-narration">
                  <label className="insert-form-label">🔊 나레이션 (선택 — 비우면 무음)</label>
                  <textarea
                    className="insert-form-textarea"
                    placeholder="이 화면에서 읽을 문장을 입력하세요..."
                    value={insertNarration}
                    onChange={(e) => setInsertNarration(e.target.value)}
                    rows={3}
                  />
                </div>
                {insertNarration.trim() ? (
                  <div className="insert-form-estimate">
                    ⏱ 예상 재생 시간: 약 <strong>{estimatedSec}초</strong>
                    <span className="insert-form-estimate-note">(실제 시간은 TTS 생성 후 자동 결정됩니다)</span>
                  </div>
                ) : (
                  <div className="insert-form-duration">
                    <label className="insert-form-label">표시 시간</label>
                    <div className="media-duration-control">
                      <input type="range" min={2} max={30} value={insertDurationSec}
                        onChange={(e) => setInsertDurationSec(Number(e.target.value))}
                        className="media-duration-slider" />
                      <span className="media-duration-value">{insertDurationSec}초</span>
                    </div>
                  </div>
                )}
                <div className="insert-form-actions">
                  <button className="btn btn-secondary" onClick={closeInsertForm}>취소</button>
                  <button className="btn btn-primary" onClick={confirmInsert}
                    disabled={!insertFile || uploading}>
                    {uploading ? '⏳ 업로드 중...' : '📎 삽입'}
                  </button>
                </div>
              </div>
            )}

            {/* 씬 뒤 삽입 버튼 */}
            <button
              className="timeline-insert-btn"
              onClick={() => openInsertForm('insert', idx)}
              disabled={uploading}
              title={`씬 ${idx + 1} 뒤에 삽입`}
            >
              +
            </button>
          </React.Fragment>
        ))}
      </div>

      {uploading && (
        <div className="media-uploading">
          <span className="spinner" />
          <span>업로드 중...</span>
        </div>
      )}

      {/* 교체 모드 전용 파일 입력 (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/mp4,video/webm,video/mov"
        style={{ display: 'none' }}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file || !insertForm || insertForm.mode !== 'replace') return;
          e.target.value = '';

          setUploading(true);
          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('jobId', jobId);
            const res = await fetch('/api/upload-media', { method: 'POST', body: formData });
            if (!res.ok) throw new Error((await res.json()).error);
            const { mediaSrc, mediaType } = await res.json();

            const original = scenes[insertForm.targetIndex];
            const next = [...scenes];
            next[insertForm.targetIndex] = {
              type: 'user_media',
              durationInFrames: original.durationInFrames,
              mediaSrc,
              mediaType,
              caption: '',
              // 기존 씬의 대본 및 TTS 데이터 보존
              narration: original.narration,
              ...(original.ttsText ? { ttsText: original.ttsText } : {}),
              ...(original.audioSrc ? { audioSrc: original.audioSrc } : {}),
              ...(original.words ? { words: original.words } : {}),
            } as UserMediaScene;
            onChange(next);
          } catch (err) {
            alert('업로드 실패: ' + String(err));
          } finally {
            setUploading(false);
            setInsertForm(null);
          }
        }}
      />
    </div>
  );
};
