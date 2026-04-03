'use client';

import React, { useRef, useState } from 'react';
import type { Scene, UserMediaScene } from '../../remotion/src/types';

interface MediaInsertPanelProps {
  scenes: Scene[];
  jobId: string;
  onChange: (newScenes: Scene[]) => void;
}

export const MediaInsertPanel: React.FC<MediaInsertPanelProps> = ({
  scenes,
  jobId,
  onChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{
    mode: 'insert' | 'replace'; // 케이스 A or B
    targetIndex: number;         // 삽입 위치(A) 또는 교체할 씬 인덱스(B)
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [durationSec, setDurationSec] = useState(5);

  const triggerUpload = (mode: 'insert' | 'replace', targetIndex: number) => {
    setPending({ mode, targetIndex });
    setDurationSec(5);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pending) return;
    e.target.value = ''; // 같은 파일 재선택 가능하게 초기화

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('jobId', jobId);

      const res = await fetch('/api/upload-media', { method: 'POST', body: formData });
      if (!res.ok) throw new Error((await res.json()).error);
      const { mediaSrc, mediaType } = await res.json();

      const newScene: UserMediaScene = {
        type: 'user_media',
        durationInFrames: durationSec * 30,
        mediaSrc,
        mediaType,
        caption: '',
      };

      const next = [...scenes];

      if (pending.mode === 'insert') {
        // 케이스 A: targetIndex 뒤에 삽입
        next.splice(pending.targetIndex + 1, 0, newScene);
      } else {
        // 케이스 B: targetIndex 씬을 교체
        next[pending.targetIndex] = {
          ...newScene,
          durationInFrames: scenes[pending.targetIndex].durationInFrames, // 기존 길이 유지
        };
      }

      onChange(next);
    } catch (err) {
      alert('업로드 실패: ' + String(err));
    } finally {
      setUploading(false);
      setPending(null);
    }
  };

  const removeScene = (idx: number) => {
    const next = scenes.filter((_, i) => i !== idx);
    onChange(next);
  };

  const getSceneLabel = (scene: Scene, idx: number): string => {
    const typeLabels: Record<string, string> = {
      title: '제목',
      card_list: '카드리스트',
      flowchart: '순서도',
      highlight_text: '핵심문장',
      gif_insert: 'GIF',
      image_insert: '이미지',
      user_media: '📷 내 미디어',
      ai_free: 'AI 커스텀',
    };
    return `씬 ${idx + 1}: ${typeLabels[scene.type] ?? scene.type}`;
  };

  return (
    <div className="media-panel">
      <div className="media-panel-header">
        <h3 className="media-panel-title">🎬 미디어 삽입</h3>
        <p className="media-panel-desc">
          씬 사이에 삽입하거나, 기존 씬의 비주얼을 내 사진/영상으로 교체할 수 있습니다.
        </p>
      </div>

      {/* 표시 시간 설정 (케이스 A 삽입 시만 적용) */}
      <div className="media-duration-row">
        <label className="media-duration-label">삽입 씬 표시 시간</label>
        <div className="media-duration-control">
          <input
            type="range"
            min={2}
            max={30}
            value={durationSec}
            onChange={(e) => setDurationSec(Number(e.target.value))}
            className="media-duration-slider"
          />
          <span className="media-duration-value">{durationSec}초</span>
        </div>
      </div>

      {/* 씬 타임라인 */}
      <div className="scene-timeline">
        {scenes.map((scene, idx) => (
          <React.Fragment key={idx}>
            {/* 케이스 A: 씬 앞에 삽입 버튼 (첫 씬 앞) */}
            {idx === 0 && (
              <button
                className="timeline-insert-btn"
                onClick={() => triggerUpload('insert', -1)}
                disabled={uploading}
                title="맨 앞에 삽입"
              >
                +
              </button>
            )}

            {/* 씬 카드 */}
            <div className={`timeline-scene ${scene.type === 'user_media' ? 'timeline-scene--user' : ''}`}>
              <div className="timeline-scene-label">{getSceneLabel(scene, idx)}</div>
              <div className="timeline-scene-duration">
                {(scene.durationInFrames / 30).toFixed(1)}s
              </div>
              <div className="timeline-scene-actions">
                {/* 케이스 B: 비주얼 교체 */}
                <button
                  className="timeline-btn timeline-btn--replace"
                  onClick={() => triggerUpload('replace', idx)}
                  disabled={uploading}
                  title="이 씬을 내 미디어로 교체"
                >
                  🔄
                </button>
                {/* user_media 씬은 삭제 가능 */}
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

            {/* 케이스 A: 씬 뒤에 삽입 버튼 */}
            <button
              className="timeline-insert-btn"
              onClick={() => triggerUpload('insert', idx)}
              disabled={uploading}
              title={`씬 ${idx + 1} 뒤에 삽입`}
            >
              {uploading && pending?.mode === 'insert' && pending?.targetIndex === idx
                ? '⏳'
                : '+'}
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

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/mp4,video/webm,video/mov"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
};
