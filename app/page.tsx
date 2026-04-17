'use client';

import { useState, useCallback, useRef } from 'react';
import { InputForm } from './components/InputForm';
import { ProgressTracker } from './components/ProgressTracker';
import { ResultPanel } from './components/ResultPanel';
import { ScriptReview } from './components/ScriptReview';
import { MediaInsertPanel } from './components/MediaInsertPanel';
import { SceneEditor } from './components/SceneEditor';
import { TTSReview } from './components/TTSReview';
import { CodeGenReview } from './components/CodeGenReview';
import { SubtitleSplitReview } from './components/SubtitleSplitReview';
import { SceneReview } from './components/SceneReview';
import type { Scene } from '../remotion/src/types';

/**
 * SSE 스트림을 청크 누적 방식으로 안전하게 파싱.
 * 대형 JSON 이벤트가 여러 ReadableStream 청크에 걸쳐 올 때도 정상 처리.
 */
function parseSSEMessages(
  chunk: string,
  buffer: { current: string },
): object[] {
  buffer.current += chunk;
  const results: object[] = [];

  // SSE 이벤트는 \n\n 으로 구분
  while (true) {
    const idx = buffer.current.indexOf('\n\n');
    if (idx === -1) break; // 아직 완전한 메시지 없음

    const message = buffer.current.slice(0, idx);
    buffer.current = buffer.current.slice(idx + 2);

    // data: 접두사인 라인만 처리
    const dataLines = message.split('\n').filter((l) => l.startsWith('data: '));
    for (const line of dataLines) {
      try {
        results.push(JSON.parse(line.slice(6)));
      } catch {
        // JSON 파싱 실패 — 무시
      }
    }
  }
  return results;
}

type PipelineStep = {
  step: string;
  status: 'loading' | 'done' | 'skipped' | 'failed';
  [key: string]: unknown;
};

type Phase = 'input' | 'script-review' | 'subtitle-split' | 'subtitle-review' | 'building' | 'scene-review' | 'visual-review' | 'media-insert' | 'tts-gen' | 'tts-review' | 'code-gen' | 'rendering' | 'preview' | 'done' | 'editing';

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
  const [approvedScript, setApprovedScript] = useState<string>('');  // 승인된 대본 보존
  const [splitScript, setSplitScript] = useState<string>('');  // / 구분자 삽입된 대본
  const [isSubtitleSplitting, setIsSubtitleSplitting] = useState(false);
  const [useTTS, setUseTTS] = useState(true);  // TTS 토글 상태
  // 재편집용 — 렌더 완료 후 씬 데이터 보존
  const [finalScenes, setFinalScenes] = useState<Scene[]>([]);
  const [finalJobId, setFinalJobId] = useState<string>('');

  // Phase 1: 대본만 생성 → 리뷰 대기
  const handleGenerateScript = useCallback(async (inputTopic: string, ttsEnabled: boolean) => {
    setUseTTS(ttsEnabled);  // 토글 상태 저장
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

  // 대본 직접 입력 → 바로 script-review
  const handleDirectScript = useCallback((directScript: string, tts: boolean) => {
    setUseTTS(tts);
    setTopic('직접 입력');
    setPendingScript(directScript);
    setPhase('script-review');
  }, []);

  // Phase 2: 승인된 대본 → 자막 분할 (AI가 / 삽입)
  const handleApproveScript = useCallback(async (finalScript: string) => {
    setPendingScript(null);
    setApprovedScript(finalScript);
    setIsSubtitleSplitting(true);
    setPhase('subtitle-split');
    setError(null);

    try {
      const res = await fetch('/api/subtitle-split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: finalScript }),
      });
      if (!res.ok) throw new Error(`자막 분할 실패 (${res.status})`);
      const { script: result } = await res.json();
      setSplitScript(result);
      setPhase('subtitle-review');
    } catch (err) {
      setError(String(err));
      setPendingScript(finalScript);
      setPhase('script-review');
    } finally {
      setIsSubtitleSplitting(false);
    }
  }, []);

  // Phase: 자막 분할 리뷰 승인 → 씬 분할
  // splitScript(/ 포함)는 별도 보관하고, 씬 분할 AI에는 원본 대본을 전달
  const handleApproveSubtitleSplit = useCallback(async (finalSplitScript: string) => {
    setSplitScript(finalSplitScript);
    setPhase('building');
    setSteps([]);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, script: approvedScript, useTTS, stopAfterScenes: true }),
      });

      if (!res.body) throw new Error('No response stream');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const sseBuffer = { current: '' };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const messages = parseSSEMessages(text, sseBuffer);

        for (const msg of messages) {
          const data = msg as PipelineStep;

          if (data.step === 'error') {
            setError(data.message as string);
            setPhase('subtitle-review');
          } else if (data.step === 'scenes' && data.status === 'done') {
            const scenes = data.scenes as Scene[];
            const jobId = data.jobId as string;
            setPendingScenes(scenes);
            setPendingJobId(jobId);
            setPhase('scene-review');
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
        }
      }
    } catch (err) {
      setError(String(err));
      setPhase('subtitle-review');
    }
  }, [topic, useTTS, approvedScript]);

  // Phase: 씬 분할 리뷰 승인 → 미디어 삽입
  const handleApproveSceneReview = useCallback((reviewedScenes: Scene[]) => {
    setPendingScenes(reviewedScenes);
    setPhase('media-insert');
  }, []);

  // Phase: 미디어 삽입 완료 → TTS 생성 (비주얼 건너뛰기)
  const handleGoToVisual = useCallback(async (scenesWithMedia: Scene[]) => {
    setPendingScenes(scenesWithMedia);
    setPhase('tts-gen');
    setSteps([
      { step: 'script', status: 'done' },
      { step: 'scenes', status: 'done' },
      { step: 'tts', status: 'loading' },
    ]);
    setError(null);

    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          script: approvedScript,
          useTTS,
          scenes: scenesWithMedia,
          jobId: pendingJobId,
          skipToRender: true,
          skipVisual: true,
          stopAfterTTS: true,
        }),
      });

      if (!res.body) throw new Error('No response stream');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const sseBuffer = { current: '' };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const messages = parseSSEMessages(text, sseBuffer);

        for (const msg of messages) {
          const data = msg as PipelineStep;

          if (data.step === 'error') {
            setError(data.message as string);
            setPhase('media-insert');
          } else if (data.step === 'tts' && data.status === 'done') {
            const updatedScenes = data.scenes as Scene[];
            setPendingScenes(updatedScenes);
            setPhase('tts-review');
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
        }
      }
    } catch (err) {
      setError(String(err));
      setPhase('media-insert');
    }
  }, [topic, approvedScript, useTTS, pendingJobId]);

  // Phase: 비주얼 승인 → 코드 생성 화면으로
  const handleApproveVisual = useCallback((scenesWithVisual: Scene[]) => {
    setPendingScenes(scenesWithVisual);
    setPhase('code-gen');
    setError(null);
  }, []);

  // Phase: TTS 승인 → 비주얼 프롬프트 생성 (stopAfterVisual)
  const handleApproveTTS = useCallback(async (scenesWithTTS: Scene[]) => {
    setPendingScenes(scenesWithTTS);
    setPhase('building');
    setSteps([
      { step: 'script', status: 'done' },
      { step: 'scenes', status: 'done' },
      { step: 'tts', status: 'done' },
      { step: 'visual-prompt', status: 'loading' },
    ]);
    setError(null);

    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          script: approvedScript,
          useTTS: false,  // TTS는 이미 완료됨 — 중복 실행 방지
          scenes: scenesWithTTS,
          jobId: pendingJobId,
          skipToRender: true,
          stopAfterVisual: true,
        }),
      });

      if (!res.body) throw new Error('No response stream');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const sseBuffer = { current: '' };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const messages = parseSSEMessages(text, sseBuffer);

        for (const msg of messages) {
          const data = msg as PipelineStep;

          if (data.step === 'error') {
            setError(data.message as string);
            setPhase('tts-review');
          } else if (data.step === 'visual-prompt' && data.status === 'done') {
            const scenes = data.scenes as Scene[];
            setPendingScenes(scenes);
            setPhase('visual-review');
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
        }
      }
    } catch (err) {
      setError(String(err));
      setPhase('tts-review');
    }
  }, [topic, approvedScript, useTTS, pendingJobId]);

  // Phase: 코드 생성 완료 → 미리보기
  const handleCodeGenComplete = useCallback((scenesWithCode: Scene[]) => {
    setFinalScenes(scenesWithCode);
    setFinalJobId(pendingJobId);
    setPhase('preview');
  }, [pendingJobId]);

  // Phase 4: 재편집 → re-render
  const handleRerender = useCallback(async (modifiedScenes: Scene[], originalJobId: string) => {
    setPhase('rendering');
    setSteps([]);
    setError(null);

    try {
      const res = await fetch('/api/re-render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalJobId, scenes: modifiedScenes }),
      });
      if (!res.ok) throw new Error(`재렌더 실패 (${res.status})`);
      const { outputPath, jobId: newJobId } = await res.json();
      setResult({ outputPath, jobId: newJobId });
      setFinalScenes(modifiedScenes);
      setFinalJobId(newJobId);
      setPhase('done');
    } catch (err) {
      setError(String(err));
      setPhase('done'); // 에러 시 done으로 복귀
    }
  }, []);

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
          onDirectScript={handleDirectScript}
          isRunning={isGeneratingScript || phase === 'building'}
          initialUseTTS={useTTS}
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

      {/* Phase: 자막 분할 중 */}
      {phase === 'subtitle-split' && isSubtitleSplitting && (
        <div className="loading-box">
          <span className="spinner" />
          <span>AI가 자막을 분할하는 중...</span>
        </div>
      )}

      {/* Phase: 자막 분할 리뷰 */}
      {phase === 'subtitle-review' && splitScript && (
        <SubtitleSplitReview
          script={splitScript}
          onApprove={handleApproveSubtitleSplit}
          onBack={() => {
            setPendingScript(approvedScript);
            setPhase('script-review');
          }}
        />
      )}

      {/* Phase: 씬 분할 리뷰 */}
      {phase === 'scene-review' && pendingScenes.length > 0 && (
        <SceneReview
          scenes={pendingScenes}
          onApprove={handleApproveSceneReview}
          onBack={() => {
            setPhase('subtitle-review');
          }}
        />
      )}

      {/* Phase: 미디어 삽입 */}
      {phase === 'media-insert' && pendingScenes.length > 0 && (
        <div className="card">
          <p className="card-title">단계 — 미디어 삽입 (선택)</p>
          <MediaInsertPanel
            scenes={pendingScenes}
            jobId={pendingJobId}
            onChange={setPendingScenes}
          />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              id="go-to-visual"
              className="btn-primary"
              style={{ width: '100%' }}
              onClick={() => handleGoToVisual(pendingScenes)}
            >
              🎧 다음: TTS 생성
            </button>
          </div>
        </div>
      )}

      {/* Phase: 비주얼 프롬프트 리뷰 */}
      {phase === 'visual-review' && pendingScenes.length > 0 && (
        <div className="card">
          <p className="card-title">🎨 비주얼 설계 확인</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            각 씬의 비주얼 프롬프트를 확인/수정하세요. AI가 이 지시문대로 코드를 생성합니다.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 500, overflowY: 'auto', marginBottom: 20 }}>
            {pendingScenes.map((scene, idx) => (
              scene.type === 'ai_free' && (
                <div key={idx} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>씬 {idx + 1}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{scene.narration}</span>
                  </div>
                  <textarea
                    value={scene.prompt || ''}
                    onChange={(e) => {
                      const updated = [...pendingScenes];
                      updated[idx] = { ...updated[idx], prompt: e.target.value };
                      setPendingScenes(updated);
                    }}
                    rows={2}
                    style={{
                      width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: 6, color: 'var(--text)', fontSize: 13, padding: '8px 10px',
                      fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', outline: 'none',
                    }}
                  />
                </div>
              )
            ))}
          </div>
          <button
            className="btn-primary"
            style={{ width: '100%' }}
            onClick={() => handleApproveVisual(pendingScenes)}
          >
            ✅ 코드 생성 시작
          </button>
        </div>
      )}

      {/* Phase: TTS 리뷰 */}
      {phase === 'tts-review' && pendingScenes.length > 0 && (
        <TTSReview
          scenes={pendingScenes}
          jobId={pendingJobId}
          onApprove={handleApproveTTS}
        />
      )}

      {/* Phase: 코드 생성 (배치별 수동) */}
      {phase === 'code-gen' && pendingScenes.length > 0 && (
        <CodeGenReview
          scenes={pendingScenes}
          onComplete={handleCodeGenComplete}
        />
      )}



      {/* 에러 */}
      {error && <div className="error-box">⚠️ {error}</div>}

      {/* 진행 상황 */}
      {steps.length > 0 && phase !== 'preview' && <ProgressTracker steps={steps} />}

      {/* Phase: 미리보기 */}
      {phase === 'preview' && (
        <div className="card" style={{ textAlign: 'center' }}>
          <p className="card-title">🎬 미리보기 준비 완료</p>
          <p style={{ color: '#b2bec3', marginBottom: 16 }}>
            미리보기를 누르면 Remotion Studio에서 영상을 확인할 수 있습니다.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              id="preview-btn"
              className="btn-primary"
              style={{ background: '#6c5ce7' }}
              disabled={phase !== 'preview'}
              onClick={async () => {
                setError(null);
                const btn = document.getElementById('preview-btn') as HTMLButtonElement;
                if (btn) { btn.textContent = '⏳ 파일 저장 중...'; btn.disabled = true; }
                try {
                  const res = await fetch('/api/render', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jobId: finalJobId, scenes: finalScenes, splitScript, previewOnly: true }),
                  });
                  const data = await res.json();
                  if (data.error) {
                    setError(data.error);
                  } else {
                    window.open('http://localhost:3001', '_blank');
                  }
                } catch (err) {
                  setError(String(err));
                } finally {
                  if (btn) { btn.textContent = '👁️ 미리보기'; btn.disabled = false; }
                }
              }}
            >
              👁️ 미리보기
            </button>
            <button
              id="render-from-preview"
              className="btn-primary"
              onClick={() => {
                setPhase('rendering');
                setSteps([]);
                fetch('/api/render', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ jobId: finalJobId, scenes: finalScenes, splitScript }),
                })
                  .then(r => r.json())
                  .then(data => {
                    if (data.outputPath) {
                      setResult({ outputPath: data.outputPath, jobId: finalJobId });
                      setPhase('done');
                    } else {
                      setError(data.error || '렌더링 실패');
                      setPhase('preview');
                    }
                  })
                  .catch(err => {
                    setError(String(err));
                    setPhase('preview');
                  });
              }}
            >
              ✅ 최종 렌더링
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setPhase('editing')}
            >
              ✏️ 씬 수정하기
            </button>
          </div>
        </div>
      )}

      {/* 완료 결과 */}
      {result && phase === 'done' && (
        <>
          <ResultPanel outputPath={result.outputPath} jobId={result.jobId} />
          {finalScenes.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button
                id="open-scene-editor"
                className="btn btn-secondary"
                onClick={() => setPhase('editing')}
              >
                ✏️ 씬 수정하기
              </button>
            </div>
          )}
        </>
      )}

      {/* 씬 수정 모드 */}
      {phase === 'editing' && finalScenes.length > 0 && (
        <SceneEditor
          scenes={finalScenes}
          jobId={finalJobId}
          onRerender={handleRerender}
          onCancel={() => setPhase(result ? 'done' : 'preview')}
        />
      )}
    </main>
  );
}
