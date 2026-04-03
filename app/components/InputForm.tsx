'use client';

import { useState } from 'react';

type Props = {
  onGenerate: (topic: string, useTTS: boolean) => void;
  isRunning: boolean;
};

const TABS = ['주제로 생성', '대본 직접 입력', '유튜브 조합'] as const;

const PLACEHOLDER = [
  '예: AI 에이전트란 무엇인가',
  '대본을 직접 붙여넣으세요...',
  '유튜브 링크를 한 줄에 하나씩 입력 (추후 지원)',
];

export function InputForm({ onGenerate, isRunning }: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const [topic, setTopic] = useState('');
  const [script, setScript] = useState('');
  const [useTTS, setUseTTS] = useState(false);

  const canSubmit =
    !isRunning &&
    ((activeTab === 0 && topic.trim().length > 0) ||
      (activeTab === 1 && script.trim().length > 0));

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (activeTab === 0) onGenerate(topic.trim(), useTTS);
    // 다른 탭은 Phase 확장 시
  };

  return (
    <div className="card">
      <p className="card-title">영상 만들기</p>

      {/* 탭 */}
      <div className="tabs">
        {TABS.map((label, i) => (
          <button
            key={i}
            className={`tab${activeTab === i ? ' active' : ''}`}
            onClick={() => setActiveTab(i)}
            disabled={isRunning}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 입력 영역 */}
      {activeTab === 0 && (
        <input
          id="topic-input"
          className="input-field"
          type="text"
          placeholder={PLACEHOLDER[0]}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={isRunning}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoFocus
        />
      )}

      {activeTab === 1 && (
        <textarea
          id="script-input"
          className="input-field"
          placeholder={PLACEHOLDER[1]}
          value={script}
          onChange={(e) => setScript(e.target.value)}
          disabled={isRunning}
        />
      )}

      {activeTab === 2 && (
        <textarea
          className="input-field"
          placeholder={PLACEHOLDER[2]}
          disabled
        />
      )}

      {/* TTS 토글 */}
      <div className="toggle-row">
        <span className="toggle-label">🔊 TTS 음성 자동 생성 (Qwen3 — 로컬 필요)</span>
        <button
          className={`toggle${useTTS ? ' on' : ''}`}
          onClick={() => setUseTTS(!useTTS)}
          disabled={isRunning}
          aria-label="TTS 토글"
        />
      </div>

      {/* 생성 버튼 */}
      <button
        id="generate-btn"
        className="btn-primary"
        onClick={handleSubmit}
        disabled={!canSubmit}
      >
        {isRunning ? '⏳  영상 생성 중...' : '🎬  영상 생성하기'}
      </button>
    </div>
  );
}
