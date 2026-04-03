'use client';

import { useState, useCallback } from 'react';
import { InputForm } from './components/InputForm';
import { ProgressTracker } from './components/ProgressTracker';
import { ResultPanel } from './components/ResultPanel';
import { ScriptReview } from './components/ScriptReview';
import { MediaInsertPanel } from './components/MediaInsertPanel';
import type { Scene } from '../remotion/src/types';

type PipelineStep = {
  step: string;
  status: 'loading' | 'done' | 'skipped' | 'failed';
  [key: string]: unknown;
};

type Phase = 'input' | 'script-review' | 'building' | 'media-insert' | 'rendering' | 'done';

export default function Home() {
  const [phase, setPhase] = useState<Phase>('input');
  const [topic, setTopic] = useState('');
  const [pendingScript, setPendingScript] = useState<string | null>(null);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [result, setResult] = useState<{ outputPath: string; jobId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 미디어 삽입용
  const [pendingScenes, setPendingScenes] = useState<Scene[]>([]);
  const [pendingJobId, setPendingJobId] = useState<string>('');

  // Phase 1: 대본만 생성 → 리뷰 대기
  const handleGenerateScript = useCallback(async (inputTopic: string, _useTTS: boolean) => {
    setTopic(inputTopic);
    setIsGeneratingScript(true);
    setError(null);
    setPendingScript(null);

    try {
      const res = await fetch('/api/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: inputTopic }),
      });
      if (!res.ok) throw new Error(`대본 생성 실패 (${res.status})`);
      const { script } = await res.json();
      setPendingScript(script);
      setPhase('script-review');
    } catch (err) {
      setError(String(err));
    } finally {
      setIsGeneratingScript(false);
    }
  }, []);

  // Phase 2: 승인된 대본으로 씬 생성 (미디어 삽입 전 단계)
  const handleApproveScript = useCallback(async (finalScript: string) => {
    setPendingScript(null);
    setPhase('building');
    setSteps([]);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, script: finalScript, useTTS: true, stopAfterScenes: true }),
      });

      if (!res.body) throw new Error('No response stream');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6)) as PipelineStep;

            if (data.step === 'error') {
              setError(data.message as string);
              setPhase('input');
            } else if (data.step === 'scenes' && data.status === 'done') {
              // 씬 생성 완료 → 미디어 삽입 단계로
              const scenes = data.scenes as Scene[];
              const jobId = data.jobId as string;
              setPendingScenes(scenes);
              setPendingJobId(jobId);
              setPhase('media-insert');
            }

            setSteps((prev) => {
              const idx = prev.findIndex((s) => s.step === data.step);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = data;
                return next;
              }
              return [...prev, data];
            });
          } catch {
            // JSON 파싱 실패 무시
          }
        }
      }
    } catch (err) {
      setError(String(err));
      setPhase('input');
    }
  }, [topic]);

  // Phase 3: 미디어 삽입 완료 → 렌더링
  const handleConfirmMediaAndRender = useCallback(async (finalScenes: Scene[]) => {
    setPhase('rendering');
    setSteps([]);
    setError(null);

    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          jobId: pendingJobId,
          scenes: finalScenes,
          useTTS: true,
          skipToRender: true,
        }),
      });

      if (!res.body) throw new Error('No response stream');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6)) as PipelineStep;

            if (data.step === 'error') {
              setError(data.message as string);
            } else if (data.step === 'render' && data.status === 'done') {
              setResult({
                outputPath: data.outputPath as string,
                jobId: data.jobId as string,
              });
              setPhase('done');
            }

            setSteps((prev) => {
              const idx = prev.findIndex((s) => s.step === data.step);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = data;
                return next;
              }
              return [...prev, data];
            });
          } catch {
            // JSON 파싱 실패 무시
          }
        }
      }
    } catch (err) {
      setError(String(err));
    }
  }, [topic, pendingJobId]);

  // 대본 재생성 — 입력 단계로 돌아가기
  const handleRejectScript = useCallback(() => {
    setPendingScript(null);
    setPhase('input');
    setError(null);
  }, []);

  return (
    <main className="container">
      {/* Header */}
      <header className="header">
        <div className="logo-badge">AI</div>
        <h1 className="title">유튜브 영상 자동 생성기</h1>
        <p className="subtitle">주제만 입력하면 AI가 영상을 만들어 드립니다</p>
      </header>

      {/* Phase: 입력 (building 단계까지만 표시) */}
      {(phase === 'input' || phase === 'building' || phase === 'done') && (
        <InputForm
          onGenerate={handleGenerateScript}
          isRunning={isGeneratingScript || phase === 'building'}
        />
      )}

      {/* 대본 생성 중 */}
      {isGeneratingScript && (
        <div className="loading-box">
          <span className="spinner" />
          <span>대본 생성 중...</span>
        </div>
      )}

      {/* Phase: 대본 리뷰 */}
      {phase === 'script-review' && pendingScript && (
        <ScriptReview
          script={pendingScript}
          onApprove={handleApproveScript}
          onReject={handleRejectScript}
        />
      )}

      {/* Phase: 미디어 삽입 */}
      {phase === 'media-insert' && pendingScenes.length > 0 && (
        <div className="card">
          <p className="card-title">단계 3 — 미디어 삽입 (선택)</p>
          <MediaInsertPanel
            scenes={pendingScenes}
            jobId={pendingJobId}
            onChange={setPendingScenes}
          />
          <button
            id="confirm-media-render"
            className="btn-primary"
            onClick={() => handleConfirmMediaAndRender(pendingScenes)}
          >
            🎬 영상 생성 시작
          </button>
        </div>
      )}

      {/* 에러 */}
      {error && <div className="error-box">⚠️ {error}</div>}

      {/* 진행 상황 */}
      {steps.length > 0 && <ProgressTracker steps={steps} />}

      {/* 완료 결과 */}
      {result && <ResultPanel outputPath={result.outputPath} jobId={result.jobId} />}
    </main>
  );
}
