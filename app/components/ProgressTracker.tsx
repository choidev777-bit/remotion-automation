'use client';

type Step = {
  step: string;
  status: 'loading' | 'done' | 'skipped' | 'failed';
  [key: string]: unknown;
};

type Props = {
  steps: Step[];
};

const STEP_LABELS: Record<string, { label: string; emoji: string }> = {
  script:          { label: '대본 생성',              emoji: '📝' },
  scenes:          { label: '씬 분석',                emoji: '🎬' },
  'visual-prompt': { label: '비주얼 설계',             emoji: '🎨' },
  'ai-code':       { label: 'AI 씬 코드 생성',        emoji: '🤖' },
  gif:             { label: 'GIF 검색',               emoji: '🖼️' },
  tts:             { label: 'TTS 음성 생성',           emoji: '🔊' },
  'tts-narration': { label: '미디어 나레이션 TTS',      emoji: '🎙️' },
  whisper:         { label: '음성 타임스탬프 분석',      emoji: '📊' },
  sync:            { label: '씬-오디오 싱크',           emoji: '🔗' },
  render:          { label: '영상 렌더링',              emoji: '⚙️' },
};

const STATUS_ICON: Record<string, string> = {
  done:    '✓',
  skipped: '—',
  failed:  '✕',
};

export function ProgressTracker({ steps }: Props) {
  const visible = steps.filter((s) => s.step !== 'error');

  return (
    <div className="card">
      <p className="card-title">진행 상황</p>
      <ul className="progress-list">
        {visible.map((s) => {
          const info = STEP_LABELS[s.step] ?? { label: s.step, emoji: '•' };
          return (
            <li key={s.step} className="progress-item">
              {/* 상태 아이콘 */}
              <span className={`progress-icon ${s.status}`}>
                {s.status !== 'loading' ? STATUS_ICON[s.status] : ''}
              </span>

              {/* 이모지 + 레이블 */}
              <span style={{ flex: 1 }}>
                <span style={{ marginRight: 8 }}>{info.emoji}</span>
                {info.label}
              </span>

              {/* 부가 정보 */}
              {s.status === 'done' && s.step === 'scenes' && (
                <span className="progress-meta">{String(s.count)}개 씬</span>
              )}
              {s.status === 'skipped' && (
                <span className="progress-meta">건너뜀</span>
              )}
              {s.status === 'loading' && (
                <span className="progress-meta" style={{ color: 'var(--primary)' }}>
                  처리 중...
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
