'use client';

import React, { useState } from 'react';
import type { Scene } from '../../remotion/src/types';

interface SceneEditorProps {
  scenes: Scene[];
  jobId: string;
  onRerender: (modifiedScenes: Scene[], originalJobId: string) => void;
  onCancel: () => void;
}

/* 씬별 편집 가능한 필드를 문자열로 직렬화/역직렬화해 generic textarea로 처리 */
function sceneToEditText(scene: Scene): string {
  switch (scene.type) {
    case 'title':
      return [scene.title, scene.subtitle ?? ''].join('\n');
    case 'highlight_text':
      return [scene.text, scene.emphasis ?? ''].join('\n');
    case 'card_list':
      return [
        scene.heading,
        ...scene.cards.map((c) => `${c.name}${c.desc ? ': ' + c.desc : ''}`),
      ].join('\n');
    case 'flowchart':
      return [scene.heading, ...scene.nodes.map((n) => typeof n === 'string' ? n : n.label)].join('\n');
    case 'split_screen':
      return [
        `[왼쪽] ${scene.left.heading}`,
        ...scene.left.points.map((p) => `- ${p}`),
        `[오른쪽] ${scene.right.heading}`,
        ...scene.right.points.map((p) => `- ${p}`),
      ].join('\n');
    case 'code_block':
      return [scene.language, scene.code, scene.caption ?? ''].join('\n---\n');
    case 'stat_number':
      return [`${scene.stat}${scene.unit ?? ''}`, scene.label].join('\n');
    case 'comparison_table':
      return [
        scene.headers.join(' | '),
        ...scene.rows.map((r) => r.join(' | ')),
      ].join('\n');
    case 'gif_insert':
      return [scene.keyword, scene.caption ?? ''].join('\n');
    case 'user_media':
      return scene.caption ?? '';
    case 'ai_free':
      return scene.prompt;
    default:
      return '';
  }
}

function editTextToScene(scene: Scene, text: string): Scene {
  const lines = text.split('\n');
  switch (scene.type) {
    case 'title':
      return { ...scene, title: lines[0] ?? scene.title, subtitle: lines[1] };
    case 'highlight_text':
      return { ...scene, text: lines[0] ?? scene.text, emphasis: lines[1] };
    case 'card_list': {
      const [heading, ...cardLines] = lines;
      const cards = cardLines.filter(Boolean).map((l) => {
        const [name, ...rest] = l.split(':');
        return { name: name.trim(), desc: rest.join(':').trim() || undefined };
      });
      return { ...scene, heading: heading ?? scene.heading, cards };
    }
    case 'flowchart': {
      const [heading, ...nodeLines] = lines;
      const nodes = nodeLines.filter(Boolean).map((l, i) => ({
        id: String(i + 1),
        label: l,
      }));
      const edges = nodes.slice(0, -1).map((n, i) => ({
        from: n.id,
        to: String(i + 2),
      }));
      return { ...scene, heading: heading ?? scene.heading, nodes, edges };
    }
    case 'split_screen': {
      const leftLines: string[] = [];
      const rightLines: string[] = [];
      let current: 'left' | 'right' = 'left';
      let leftHeading = scene.left.heading;
      let rightHeading = scene.right.heading;
      for (const l of lines) {
        if (l.startsWith('[왼쪽]')) { leftHeading = l.replace('[왼쪽]', '').trim(); current = 'left'; }
        else if (l.startsWith('[오른쪽]')) { rightHeading = l.replace('[오른쪽]', '').trim(); current = 'right'; }
        else if (l.startsWith('- ')) {
          (current === 'left' ? leftLines : rightLines).push(l.slice(2));
        }
      }
      return {
        ...scene,
        left: { heading: leftHeading, points: leftLines.length ? leftLines : scene.left.points },
        right: { heading: rightHeading, points: rightLines.length ? rightLines : scene.right.points },
      };
    }
    case 'code_block': {
      const [lang, code, caption] = text.split('\n---\n');
      return { ...scene, language: lang?.trim() ?? scene.language, code: code ?? scene.code, caption };
    }
    case 'stat_number': {
      const [statLine, ...labelLines] = lines;
      const match = statLine?.match(/^([\d,.]+)(.*)$/);
      return {
        ...scene,
        stat: match?.[1] ?? scene.stat,
        unit: match?.[2]?.trim() || scene.unit,
        label: labelLines.join(' ') || scene.label,
      };
    }
    case 'comparison_table': {
      const [headerLine, ...rowLines] = lines.filter(Boolean);
      const headers = headerLine?.split('|').map((h) => h.trim()) ?? scene.headers;
      const rows = rowLines.map((r) => r.split('|').map((c) => c.trim()));
      return { ...scene, headers, rows: rows.length ? rows : scene.rows };
    }
    case 'gif_insert':
      return { ...scene, keyword: lines[0] ?? scene.keyword, caption: lines[1] };
    case 'user_media':
      return { ...scene, caption: text };
    case 'ai_free':
      return { ...scene, prompt: text };
    default:
      return scene;
  }
}

const TYPE_LABEL: Record<string, string> = {
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

export const SceneEditor: React.FC<SceneEditorProps> = ({
  scenes: initialScenes,
  jobId,
  onRerender,
  onCancel,
}) => {
  const [scenes, setScenes] = useState<Scene[]>(initialScenes);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [isRerendering, setIsRerendering] = useState(false);

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditText(sceneToEditText(scenes[idx]));
  };

  const confirmEdit = () => {
    if (editingIdx === null) return;
    const updated = [...scenes];
    updated[editingIdx] = editTextToScene(scenes[editingIdx], editText);
    setScenes(updated);
    setEditingIdx(null);
  };

  const cancelEdit = () => setEditingIdx(null);

  const deleteScene = (idx: number) => {
    if (!confirm(`씬 ${idx + 1}을 삭제할까요?`)) return;
    setScenes(scenes.filter((_, i) => i !== idx));
  };

  const handleRerender = async () => {
    setIsRerendering(true);
    onRerender(scenes, jobId);
  };

  return (
    <div className="scene-editor">
      <div className="scene-editor-header">
        <h3 className="scene-editor-title">✏️ 씬 수정</h3>
        <p className="scene-editor-desc">
          수정할 씬을 클릭하고 내용을 변경한 뒤 재렌더 버튼을 누르세요. TTS는 재사용되어 빠르게 처리됩니다.
        </p>
      </div>

      <div className="scene-editor-list">
        {scenes.map((scene, idx) => (
          <div
            key={idx}
            className={`scene-editor-card ${editingIdx === idx ? 'scene-editor-card--active' : ''}`}
          >
            <div className="scene-editor-card-header">
              <span className="scene-editor-badge">{TYPE_LABEL[scene.type] ?? scene.type}</span>
              <span className="scene-editor-idx">씬 {idx + 1}</span>
              <div className="scene-editor-card-actions">
                {editingIdx === idx ? (
                  <>
                    <button className="scene-editor-btn scene-editor-btn--confirm" onClick={confirmEdit}>
                      확인
                    </button>
                    <button className="scene-editor-btn scene-editor-btn--cancel" onClick={cancelEdit}>
                      취소
                    </button>
                  </>
                ) : (
                  <>
                    <button className="scene-editor-btn scene-editor-btn--edit" onClick={() => startEdit(idx)}>
                      ✏️
                    </button>
                    <button className="scene-editor-btn scene-editor-btn--delete" onClick={() => deleteScene(idx)}>
                      🗑
                    </button>
                  </>
                )}
              </div>
            </div>

            {editingIdx === idx ? (
              <textarea
                className="scene-editor-textarea"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={6}
              />
            ) : (
              <p className="scene-editor-preview">
                {sceneToEditText(scene).slice(0, 80) || '(내용 없음)'}
                {sceneToEditText(scene).length > 80 ? '…' : ''}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="scene-editor-footer">
        <button className="btn btn-secondary" onClick={onCancel} disabled={isRerendering}>
          취소
        </button>
        <button
          id="rerender-btn"
          className="btn btn-primary"
          onClick={handleRerender}
          disabled={isRerendering}
        >
          {isRerendering ? (
            <><span className="spinner" /> 재렌더링 중…</>
          ) : (
            '🎬 수정본 렌더링'
          )}
        </button>
      </div>
    </div>
  );
};
