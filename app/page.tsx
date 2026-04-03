'use client';

import { useState, useCallback } from 'react';
import { InputForm } from './components/InputForm';
import { ProgressTracker } from './components/ProgressTracker';
import { ResultPanel } from './components/ResultPanel';

type PipelineStep = {
  step: string;
  status: 'loading' | 'done' | 'skipped' | 'failed';
  [key: string]: unknown;
};

export default function Home() {
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [result, setResult] = useState<{ outputPath: string; jobId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async (topic: string, useTTS: boolean) => {
    setIsRunning(true);
    setSteps([]);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, useTTS }),
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
    } finally {
      setIsRunning(false);
    }
  }, []);

  return (
    <main className="container">
      {/* Header */}
      <header className="header">
        <div className="logo-badge">AI</div>
        <h1 className="title">유튜브 영상 자동 생성기</h1>
        <p className="subtitle">주제만 입력하면 AI가 영상을 만들어 드립니다</p>
      </header>

      {/* 입력 폼 */}
      <InputForm onGenerate={handleGenerate} isRunning={isRunning} />

      {/* 에러 */}
      {error && <div className="error-box">⚠️ {error}</div>}

      {/* 진행 상황 */}
      {steps.length > 0 && <ProgressTracker steps={steps} />}

      {/* 완료 결과 */}
      {result && <ResultPanel outputPath={result.outputPath} jobId={result.jobId} />}
    </main>
  );
}
