# YouTube 자동화 Phase 3: Dashboard UI 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Next.js App Router 기반 대시보드 UI 구현. 사용자가 주제를 입력하고 버튼 한 번으로 영상을 생성하며, SSE 스트리밍으로 실시간 진행상황을 확인하고, 완성된 mp4를 다운로드할 수 있는 페이지.

**Architecture:** 단일 페이지(`app/page.tsx`) + 클라이언트 컴포넌트 3개. `/api/pipeline` SSE 스트림을 구독하여 UI 상태를 실시간 갱신.

**Tech Stack:** Next.js 14 App Router, React Client Components, CSS Modules, EventSource (SSE)

---

## 파일 구조 (Phase 3 완료 시)

```
youtube_generator/
├── app/
│   ├── page.tsx               ← Task 1: 메인 페이지 (서버 컴포넌트 래퍼)
│   ├── layout.tsx             ← Task 1: 글로벌 레이아웃 + 폰트
│   ├── globals.css            ← Task 2: 디자인 시스템 CSS
│   └── components/
│       ├── InputForm.tsx      ← Task 3: 입력 폼 (주제/대본/유튜브 탭)
│       ├── ProgressTracker.tsx ← Task 4: 실시간 진행상황 표시
│       └── ResultPanel.tsx    ← Task 5: 완성 영상 다운로드
```

---

## Task 1: 레이아웃 및 메인 페이지 뼈대

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: `app/layout.tsx` 수정 — 폰트 + 메타데이터**

```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '유튜브 영상 자동 생성기',
  description: '주제만 입력하면 AI가 대본, 씬, 음성, 영상까지 자동으로 만들어 드립니다.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: `app/page.tsx` 수정 — 메인 페이지 컴포지션**

```tsx
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

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No stream');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          const data = JSON.parse(line.slice(6)) as PipelineStep;

          if (data.step === 'error') {
            setError(data.message as string);
          } else if (data.step === 'render' && data.status === 'done') {
            setResult({ outputPath: data.outputPath as string, jobId: data.jobId as string });
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
    } finally {
      setIsRunning(false);
    }
  }, []);

  return (
    <main className="container">
      <header className="header">
        <div className="logo-badge">AI</div>
        <h1 className="title">유튜브 영상 자동 생성기</h1>
        <p className="subtitle">주제만 입력하면 AI가 영상을 만들어 드립니다</p>
      </header>

      <InputForm onGenerate={handleGenerate} isRunning={isRunning} />

      {steps.length > 0 && <ProgressTracker steps={steps} />}

      {error && <div className="error-box">{error}</div>}

      {result && <ResultPanel outputPath={result.outputPath} jobId={result.jobId} />}
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx app/page.tsx
git commit -m "feat: Phase 3 - dashboard layout and main page"
```

---

## Task 2: 글로벌 CSS 디자인 시스템

**Files:**
- Modify: `app/globals.css`

> 대시보드도 Remotion 영상과 동일한 다크 테마 컬러 팔레트를 사용.

- [ ] **Step 1: `app/globals.css` 작성**

```css
:root {
  --bg: #0E0E0E;
  --bg-card: #1A1A1A;
  --bg-input: #141414;
  --text: #FDFFFF;
  --text-muted: #7A7978;
  --primary: #00C896;
  --primary-glow: rgba(0, 200, 150, 0.15);
  --accent: #FFCF00;
  --border: #2A2A2A;
  --danger: #FF4D4F;
  --radius: 16px;
  --radius-sm: 10px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

.container {
  max-width: 720px;
  margin: 0 auto;
  padding: 48px 24px 80px;
}

/* ─── Header ─── */
.header {
  text-align: center;
  margin-bottom: 48px;
}

.logo-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: var(--primary);
  color: #000;
  font-weight: 900;
  font-size: 18px;
  margin-bottom: 20px;
}

.title {
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.5px;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 16px;
  color: var(--text-muted);
}

/* ─── Card (공통) ─── */
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 28px;
  margin-bottom: 24px;
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 20px;
}

/* ─── Input ─── */
.input-field {
  width: 100%;
  padding: 14px 18px;
  background: var(--bg-input);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s;
}

.input-field:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-glow);
}

.input-field::placeholder {
  color: var(--text-muted);
}

textarea.input-field {
  min-height: 140px;
  resize: vertical;
  line-height: 1.6;
}

/* ─── Tabs ─── */
.tabs {
  display: flex;
  gap: 4px;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  padding: 4px;
  margin-bottom: 20px;
}

.tab {
  flex: 1;
  padding: 10px 0;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}

.tab:hover {
  color: var(--text);
}

.tab.active {
  background: var(--bg-card);
  color: var(--primary);
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

/* ─── Toggle ─── */
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.toggle-label {
  font-size: 14px;
  color: var(--text-muted);
}

.toggle {
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: var(--border);
  cursor: pointer;
  border: none;
  transition: background 0.2s;
}

.toggle.on {
  background: var(--primary);
}

.toggle::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  transition: transform 0.2s;
}

.toggle.on::after {
  transform: translateX(20px);
}

/* ─── Button ─── */
.btn-primary {
  width: 100%;
  padding: 16px;
  background: var(--primary);
  color: #000;
  font-size: 16px;
  font-weight: 700;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 20px;
}

.btn-primary:hover:not(:disabled) {
  filter: brightness(1.1);
  transform: translateY(-1px);
  box-shadow: 0 4px 20px var(--primary-glow);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary.running {
  background: var(--border);
  color: var(--text-muted);
}

/* ─── Progress ─── */
.progress-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.progress-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid var(--border);
  font-size: 15px;
}

.progress-item:last-child {
  border-bottom: none;
}

.progress-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.progress-icon.loading {
  border: 2.5px solid var(--border);
  border-top-color: var(--primary);
  animation: spin 0.8s linear infinite;
}

.progress-icon.done {
  background: var(--primary);
  color: #000;
}

.progress-icon.skipped {
  background: var(--border);
  color: var(--text-muted);
}

.progress-icon.failed {
  background: var(--danger);
  color: #fff;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ─── Result ─── */
.result-box {
  text-align: center;
  padding: 40px 28px;
}

.result-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.result-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
}

.result-subtitle {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 28px;
}

.btn-download {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 32px;
  background: var(--accent);
  color: #000;
  font-size: 16px;
  font-weight: 700;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.btn-download:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

/* ─── Error ─── */
.error-box {
  background: rgba(255, 77, 79, 0.1);
  border: 1px solid var(--danger);
  border-radius: var(--radius-sm);
  padding: 16px 20px;
  color: var(--danger);
  font-size: 14px;
  margin-bottom: 24px;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "feat: Phase 3 - dark dashboard CSS design system"
```

---

## Task 3: InputForm 컴포넌트

**Files:**
- Create: `app/components/InputForm.tsx`

> 3가지 입력 모드를 탭으로 제공:
> - **주제 입력** → topic 전달
> - **대본 직접 입력** → 향후 직접 대본 모드 (Phase 2 확장 시)
> - **유튜브 링크** → 향후 yt-dlp 연동 (Phase 2 확장 시)
>
> 현재는 **주제 입력** 모드만 `/api/pipeline`과 연결.

- [ ] **Step 1: `app/components/InputForm.tsx` 작성**

```tsx
'use client';

import { useState } from 'react';

type Props = {
  onGenerate: (topic: string, useTTS: boolean) => void;
  isRunning: boolean;
};

const TABS = ['주제로 생성', '대본 직접 입력', '유튜브 조합'] as const;

export function InputForm({ onGenerate, isRunning }: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const [topic, setTopic] = useState('');
  const [script, setScript] = useState('');
  const [useTTS, setUseTTS] = useState(false);

  const handleSubmit = () => {
    if (activeTab === 0 && topic.trim()) {
      onGenerate(topic.trim(), useTTS);
    }
    // 나머지 탭은 Phase 확장 시 구현
  };

  const canSubmit =
    !isRunning &&
    ((activeTab === 0 && topic.trim().length > 0) ||
     (activeTab === 1 && script.trim().length > 0));

  return (
    <div className="card">
      <p className="card-title">영상 만들기</p>

      {/* 탭 */}
      <div className="tabs">
        {TABS.map((label, i) => (
          <button
            key={i}
            className={`tab ${activeTab === i ? 'active' : ''}`}
            onClick={() => setActiveTab(i)}
            disabled={isRunning}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 탭 내용 */}
      {activeTab === 0 && (
        <input
          className="input-field"
          type="text"
          placeholder="예: AI 에이전트란 무엇인가"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={isRunning}
          onKeyDown={(e) => e.key === 'Enter' && canSubmit && handleSubmit()}
        />
      )}

      {activeTab === 1 && (
        <textarea
          className="input-field"
          placeholder="대본을 직접 붙여넣으세요..."
          value={script}
          onChange={(e) => setScript(e.target.value)}
          disabled={isRunning}
        />
      )}

      {activeTab === 2 && (
        <textarea
          className="input-field"
          placeholder="유튜브 링크를 한 줄에 하나씩 입력하세요...&#10;(추후 지원 예정)"
          disabled
        />
      )}

      {/* TTS 토글 */}
      <div className="toggle-row">
        <span className="toggle-label">🔊 TTS 음성 자동 생성 (Qwen3)</span>
        <button
          className={`toggle ${useTTS ? 'on' : ''}`}
          onClick={() => setUseTTS(!useTTS)}
          disabled={isRunning}
        />
      </div>

      {/* 생성 버튼 */}
      <button
        className={`btn-primary ${isRunning ? 'running' : ''}`}
        onClick={handleSubmit}
        disabled={!canSubmit}
      >
        {isRunning ? '⏳ 영상 생성 중...' : '🎬 영상 생성하기'}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/InputForm.tsx
git commit -m "feat: Phase 3 - InputForm component with tabs"
```

---

## Task 4: ProgressTracker 컴포넌트

**Files:**
- Create: `app/components/ProgressTracker.tsx`

> SSE 스트림에서 받은 단계별 상태를 실시간으로 표시.

- [ ] **Step 1: `app/components/ProgressTracker.tsx` 작성**

```tsx
'use client';

type Step = {
  step: string;
  status: 'loading' | 'done' | 'skipped' | 'failed';
  [key: string]: unknown;
};

type Props = {
  steps: Step[];
};

const STEP_LABELS: Record<string, string> = {
  script: '대본 생성',
  scenes: '씬 분석',
  'ai-code': 'AI 씬 코드 생성',
  gif: 'GIF 검색',
  tts: 'TTS 음성 생성',
  render: '영상 렌더링',
};

const STEP_ICONS: Record<string, string> = {
  done: '✓',
  skipped: '—',
  failed: '✕',
};

export function ProgressTracker({ steps }: Props) {
  return (
    <div className="card">
      <p className="card-title">진행 상황</p>
      <ul className="progress-list">
        {steps
          .filter((s) => s.step !== 'error')
          .map((s) => (
            <li key={s.step} className="progress-item">
              <span className={`progress-icon ${s.status}`}>
                {s.status !== 'loading' && (STEP_ICONS[s.status] ?? '')}
              </span>
              <span style={{ flex: 1 }}>
                {STEP_LABELS[s.step] ?? s.step}
              </span>
              {s.status === 'done' && s.step === 'scenes' && (
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  {String(s.count)}개 씬
                </span>
              )}
              {s.status === 'skipped' && (
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  건너뜀
                </span>
              )}
            </li>
          ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/ProgressTracker.tsx
git commit -m "feat: Phase 3 - ProgressTracker SSE status component"
```

---

## Task 5: ResultPanel 컴포넌트

**Files:**
- Create: `app/components/ResultPanel.tsx`
- Create: `app/api/download/route.ts`

> 렌더링 완료 후 mp4 다운로드 링크를 제공.

- [ ] **Step 1: `app/api/download/route.ts` 작성 — 파일 다운로드 API**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get('jobId');
  if (!jobId) {
    return NextResponse.json({ error: 'jobId required' }, { status: 400 });
  }

  try {
    const filePath = path.join(process.cwd(), 'output', `${jobId}.mp4`);
    const buffer = await readFile(filePath);

    return new Response(buffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${jobId}.mp4"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
```

- [ ] **Step 2: `app/components/ResultPanel.tsx` 작성**

```tsx
'use client';

type Props = {
  outputPath: string;
  jobId: string;
};

export function ResultPanel({ outputPath, jobId }: Props) {
  return (
    <div className="card">
      <div className="result-box">
        <div className="result-icon">🎉</div>
        <h2 className="result-title">영상이 완성되었습니다!</h2>
        <p className="result-subtitle">{outputPath}</p>
        <a
          href={`/api/download?jobId=${jobId}`}
          className="btn-download"
          download
        >
          📥 MP4 다운로드
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/components/ResultPanel.tsx app/api/download/
git commit -m "feat: Phase 3 - ResultPanel + download API"
```

---

## Task 6: 통합 테스트

- [ ] **Step 1: 개발 서버 실행**

```bash
npm run dev
```

- [ ] **Step 2: 브라우저 테스트**

`http://localhost:3000` 접속 후:

1. "주제로 생성" 탭이 기본 선택되어 있는지 확인
2. `AI 에이전트란 무엇인가` 입력
3. TTS 토글 OFF 확인 (Qwen3 없으면 꺼야 함)
4. "🎬 영상 생성하기" 클릭
5. 진행 상황 카드에 각 단계가 실시간으로 표시되는지 확인
6. 완료 후 "🎉 영상이 완성되었습니다!" + 다운로드 버튼 표시 확인
7. 다운로드 클릭 시 mp4 파일 다운로드 확인

Expected 소요시간: useTTS=false 기준 약 3~7분

- [ ] **Step 3: 최종 Commit**

```bash
git add .
git commit -m "feat: Phase 3 complete - dashboard UI with real-time pipeline tracking"
```

---

## 완료 기준 (Definition of Done)

- [ ] `http://localhost:3000` 접속 시 다크 테마 대시보드 표시
- [ ] 3개 탭 UI 정상 동작 (현재 "주제로 생성"만 활성)
- [ ] TTS 토글 ON/OFF 동작
- [ ] "영상 생성하기" 클릭 시 `/api/pipeline` SSE 스트림 구독
- [ ] 각 단계(대본→씬→코드→GIF→렌더) 진행상황 실시간 표시
- [ ] 완료 후 다운로드 버튼 표시 및 mp4 다운로드 정상

---

## 다음 단계: Phase 4 (선택)

- 유튜브 링크 모드 (yt-dlp + Whisper 자막 추출)
- 대본 직접 입력 모드 연결
- 씬 미리보기/편집 UI (생성된 씬 JSON 수정)
- 히스토리 (이전 생성 영상 목록)
