# YouTube 자동화 Phase 2: Pipeline API 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Next.js API Routes로 전체 영상 생성 파이프라인 구현. 주제 입력 → 대본 → 씬 JSON → ai_free 코드 생성 → GIF 검색 → TTS → Remotion 렌더링 → mp4 출력.

**Architecture:** 각 파이프라인 단계를 독립적인 API Route로 구현. 최종 `/api/pipeline`이 전체 단계를 오케스트레이션. SSE(Server-Sent Events)로 실시간 진행상황 스트리밍.

**Tech Stack:** Next.js 14 App Router API Routes, `@google/generative-ai`, `execa`, Tenor API (GIF 무료), Qwen3 TTS (로컬)

---

## 파일 구조 (Phase 2 완료 시)

```
youtube_generator/
├── app/api/
│   ├── script/route.ts        ← Task 2: 대본 생성
│   ├── scenes/route.ts        ← Task 3: 씬 JSON 분석
│   ├── ai-code/route.ts       ← Task 4: ai_free 씬 코드 생성
│   ├── gif/route.ts           ← Task 5: GIF 검색 (Tenor)
│   ├── tts/route.ts           ← Task 6: Qwen3 TTS 호출
│   ├── render/route.ts        ← Task 7: Remotion 렌더 트리거
│   └── pipeline/route.ts      ← Task 8: 전체 파이프라인 통합
├── lib/
│   ├── gemini.ts              ← Task 1: Gemini 클라이언트
│   └── prompts.ts             ← Task 1: 시스템 프롬프트 모음
├── remotion/src/
│   ├── generated/             ← Task 7: ai_free 코드 파일 동적 생성
│   └── GeneratedVideo.tsx     ← Task 7: 렌더용 동적 컴포지션
└── .env.local                 ← Task 1: API 키
```

---

## Task 1: 환경 설정 및 공통 라이브러리

**Files:**
- Create: `.env.local`
- Create: `lib/gemini.ts`
- Create: `lib/prompts.ts`

- [ ] **Step 1: 의존성 설치**

```bash
npm install @google/generative-ai execa
```

Expected: `package.json`에 두 패키지 추가됨

- [ ] **Step 2: `.env.local` 생성**

```bash
# .env.local (절대 커밋하지 말 것)
GEMINI_API_KEY=여기에_Google_AI_Studio_키_입력
TENOR_API_KEY=여기에_Tenor_API_키_입력
QWEN_TTS_URL=http://localhost:7860
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

- [ ] **Step 3: `lib/gemini.ts` 작성**

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const flashModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
});

export const proModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-pro',
});
```

- [ ] **Step 4: `lib/prompts.ts` 작성**

```typescript
export const SCRIPT_PROMPT = `
당신은 유튜브 교육 영상 전문 대본 작가입니다.
다음 규칙을 지켜 대본을 작성하세요:

1. 길이: 1,000~1,500자 (약 5~7분 분량)
2. 어조: 친근하고 명확하게. 전문 용어는 쉽게 풀어서.
3. 구조: 훅(30초) → 본론(4~5분) → 결론(30초)
4. 각 문장은 TTS가 자연스럽게 읽을 수 있도록 간결하게.
5. 한국어로 작성. 영어 용어는 괄호 안에 한국어 표기 병기.

주제:
`.trim();

export const SCENES_PROMPT = `
당신은 유튜브 영상 편집 전문가입니다.
아래 대본을 읽고, Remotion 영상을 위한 씬(scene) 목록을 JSON으로 생성하세요.

## 씬 타입 규칙
- title: 제목 슬라이드. 영상 시작이나 새 섹션 시작 시. durationInFrames: 90 (3초)
- card_list: 항목 3~4개 나열. durationInFrames: 120~150
- flowchart: 흐름 설명. 노드는 최대 5개. durationInFrames: 120
- highlight_text: 핵심 문장 강조. durationInFrames: 90
- gif_insert: 재미/이해를 위해 움짤이 효과적인 구간. keyword는 영어로. durationInFrames: 90
- ai_free: 위 타입으로 표현하기 어려운 독창적인 씬. prompt에 시각화 방법 구체적으로 기술.

## 응답 형식 (JSON만 출력, 설명 없이)
{
  "scenes": [
    { "type": "title", "durationInFrames": 90, "title": "...", "subtitle": "..." },
    { "type": "card_list", "durationInFrames": 120, "heading": "...", "cards": [{ "name": "...", "desc": "..." }] },
    { "type": "flowchart", "durationInFrames": 120, "heading": "...", "nodes": [{ "id": "1", "label": "..." }], "edges": [{ "from": "1", "to": "2" }] },
    { "type": "highlight_text", "durationInFrames": 90, "text": "...", "emphasis": "..." },
    { "type": "gif_insert", "durationInFrames": 90, "keyword": "...", "gifUrl": "" },
    { "type": "ai_free", "durationInFrames": 120, "prompt": "...", "generatedCode": "" }
  ]
}

## 제약사항
- 씬 총 개수: 8~12개
- ai_free는 최대 3개

대본:
`.trim();

export const AI_FREE_PROMPT = `
당신은 Remotion(React 기반 영상 프레임워크) 전문 개발자입니다.
아래 프롬프트를 보고, Remotion 씬용 React 컴포넌트 코드를 작성하세요.

## 필수 규칙
1. 반드시 다음 import로 시작:
   import React from 'react';
   import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
   import { theme } from '../theme';

2. 컴포넌트 이름은 반드시 AiFreeScene으로 고정:
   export const AiFreeScene: React.FC = () => { ... }

3. theme.ts의 색상 토큰 반드시 사용:
   - 배경: theme.colors.bg (#0E0E0E)
   - 텍스트: theme.colors.text (#FDFFFF)
   - 강조: theme.colors.primary (#00C896)
   - 서브강조: theme.colors.accent (#FFCF00)
   - 카드배경: theme.colors.card (#1A1A1A)
   - 흐린텍스트: theme.colors.textMuted (#7A7978)

4. AbsoluteFill을 루트 컨테이너로 사용
5. useCurrentFrame()으로 애니메이션 구현
6. SVG로 아이콘/도형 직접 그릴 것 (외부 이미지/이모지 사용 금지)
7. 코드만 출력. 설명, 마크다운 코드블록 없이.

## 씬 프롬프트:
`.trim();
```

- [ ] **Step 5: Commit**

```bash
git add lib/ .env.local
git commit -m "feat: add Gemini client and prompt templates"
```

---

## Task 2: `/api/script/route.ts` — 대본 생성

**Files:** `app/api/script/route.ts`

**Request:** `POST { "topic": "GPT-4o가 뭔지 5분 안에 설명하기" }`
**Response:** `{ "script": "안녕하세요!..." }`

- [ ] **Step 1: `app/api/script/route.ts` 작성**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { flashModel } from '@/lib/gemini';
import { SCRIPT_PROMPT } from '@/lib/prompts';

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();
    if (!topic?.trim()) {
      return NextResponse.json({ error: 'topic is required' }, { status: 400 });
    }
    const result = await flashModel.generateContent(SCRIPT_PROMPT + topic);
    return NextResponse.json({ script: result.response.text() });
  } catch (err) {
    console.error('[/api/script]', err);
    return NextResponse.json({ error: 'Failed to generate script' }, { status: 500 });
  }
}
```

- [ ] **Step 2: 테스트**

```bash
curl -X POST http://localhost:3000/api/script \
  -H "Content-Type: application/json" \
  -d '{"topic": "AI 에이전트란 무엇인가"}'
```

Expected: `{ "script": "..." }` 반환, 1,000자 이상 한국어 대본

- [ ] **Step 3: Commit**

```bash
git add app/api/script/
git commit -m "feat: add /api/script - Gemini 2.5 Flash script generation"
```

---

## Task 3: `/api/scenes/route.ts` — 씬 JSON 분석

**Files:** `app/api/scenes/route.ts`

**Request:** `POST { "script": "..." }`
**Response:** `{ "scenes": [...] }`

- [ ] **Step 1: `app/api/scenes/route.ts` 작성**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { flashModel } from '@/lib/gemini';
import { SCENES_PROMPT } from '@/lib/prompts';
import type { Scene } from '../../../remotion/src/types';

export async function POST(req: NextRequest) {
  try {
    const { script } = await req.json();
    if (!script?.trim()) {
      return NextResponse.json({ error: 'script is required' }, { status: 400 });
    }
    const result = await flashModel.generateContent(SCENES_PROMPT + script);
    const raw = result.response.text();

    // Gemini가 마크다운 코드블록으로 감쌀 수 있음 → 제거
    const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonStr) as { scenes: Scene[] };

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('[/api/scenes]', err);
    return NextResponse.json({ error: 'Failed to analyze scenes' }, { status: 500 });
  }
}
```

- [ ] **Step 2: 테스트**

```bash
curl -X POST http://localhost:3000/api/scenes \
  -H "Content-Type: application/json" \
  -d '{"script": "AI 에이전트는 스스로 계획하고 행동하는 AI 시스템입니다..."}'
```

Expected: 8~12개 씬이 포함된 `{ "scenes": [...] }` 반환

- [ ] **Step 3: Commit**

```bash
git add app/api/scenes/
git commit -m "feat: add /api/scenes - Gemini 2.5 Flash scene analysis"
```

---

## Task 4: `/api/ai-code/route.ts` — ai_free 씬 코드 생성

**Files:** `app/api/ai-code/route.ts`

**Request:** `POST { "prompt": "X(잘못된것)와 체크(올바른것) 비교 화면" }`
**Response:** `{ "code": "import React from 'react';..." }`

- [ ] **Step 1: `app/api/ai-code/route.ts` 작성**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { proModel } from '@/lib/gemini';
import { AI_FREE_PROMPT } from '@/lib/prompts';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }
    const result = await proModel.generateContent(AI_FREE_PROMPT + prompt);
    let code = result.response.text();

    // 마크다운 코드블록 제거
    code = code.replace(/```(?:tsx|typescript|ts)?\n?/g, '').replace(/```\n?/g, '').trim();

    if (!code.includes('AiFreeScene')) {
      throw new Error('Generated code missing AiFreeScene export');
    }
    return NextResponse.json({ code });
  } catch (err) {
    console.error('[/api/ai-code]', err);
    return NextResponse.json({ error: 'Failed to generate scene code' }, { status: 500 });
  }
}
```

- [ ] **Step 2: 테스트**

```bash
curl -X POST http://localhost:3000/api/ai-code \
  -H "Content-Type: application/json" \
  -d '{"prompt": "X(회색원)와 체크(초록원)를 화면 중앙에 위아래로 배치. SVG로 직접 그릴 것."}'
```

Expected: `export const AiFreeScene` 포함된 유효한 TSX 코드 반환

- [ ] **Step 3: Commit**

```bash
git add app/api/ai-code/
git commit -m "feat: add /api/ai-code - Gemini 2.5 Pro ai_free code generation"
```

---

## Task 5: `/api/gif/route.ts` — GIF 검색

**Files:** `app/api/gif/route.ts`

**Request:** `GET /api/gif?keyword=confused+thinking`
**Response:** `{ "gifUrl": "https://media.tenor.com/..." }`

> **Tenor API 키 발급:** [https://developers.google.com/tenor](https://developers.google.com/tenor) → 무료, Google 계정 필요

- [ ] **Step 1: `app/api/gif/route.ts` 작성**

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const keyword = req.nextUrl.searchParams.get('keyword');
    if (!keyword) {
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 });
    }
    const params = new URLSearchParams({
      q: keyword,
      key: process.env.TENOR_API_KEY!,
      limit: '5',
      media_filter: 'gif',
      contentfilter: 'medium',
    });
    const res = await fetch(`https://tenor.googleapis.com/v2/search?${params}`);
    const data = await res.json();

    if (!data.results?.length) {
      return NextResponse.json({ error: 'No GIF found' }, { status: 404 });
    }
    const gifUrl: string = data.results[0].media_formats.gif.url;
    return NextResponse.json({ gifUrl });
  } catch (err) {
    console.error('[/api/gif]', err);
    return NextResponse.json({ error: 'GIF search failed' }, { status: 500 });
  }
}
```

- [ ] **Step 2: 테스트**

```bash
curl "http://localhost:3000/api/gif?keyword=confused+person"
```

Expected: `{ "gifUrl": "https://media.tenor.com/..." }`

- [ ] **Step 3: Commit**

```bash
git add app/api/gif/
git commit -m "feat: add /api/gif - Tenor GIF search"
```

---

## Task 6: `/api/tts/route.ts` — Qwen3 TTS 음성 생성

**Files:** `app/api/tts/route.ts`

> **전제조건:** Pinokio에서 Qwen3 TTS가 실행 중이어야 함.
> Qwen3 TTS가 없는 경우 이 Task는 SKIP. 렌더 시 audioSrc를 빈 문자열로 처리.

- [ ] **Step 1: `app/api/tts/route.ts` 작성**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { text, jobId } = await req.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }
    // Qwen3 TTS Gradio API 호출
    const ttsRes = await fetch(`${process.env.QWEN_TTS_URL}/api/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [text, null, 1.0] }),
    });
    if (!ttsRes.ok) throw new Error(`TTS server error: ${ttsRes.status}`);

    const ttsData = await ttsRes.json();
    const audioBase64: string = ttsData.data[0].data.split(',')[1];
    const audioBuffer = Buffer.from(audioBase64, 'base64');

    // remotion/public/ 에 저장
    const outputDir = path.join(process.cwd(), 'remotion', 'public');
    await mkdir(outputDir, { recursive: true });
    const filename = `audio-${jobId ?? Date.now()}.wav`;
    await writeFile(path.join(outputDir, filename), audioBuffer);

    return NextResponse.json({ audioSrc: `/audio/${filename}` });
  } catch (err) {
    console.error('[/api/tts]', err);
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/tts/
git commit -m "feat: add /api/tts - Qwen3 TTS local server integration"
```

---

## Task 7: `/api/render/route.ts` — Remotion 렌더 트리거

**Files:**
- Create: `app/api/render/route.ts`
- Create: `remotion/src/generated/.gitkeep`

> **핵심 메커니즘:**
> 1. ai_free 씬의 `generatedCode` → `remotion/src/generated/scene-{jobId}-{i}.tsx` 파일로 저장
> 2. `remotion/src/GeneratedVideo.tsx` 동적 생성 (씬 배열 기반 imports + JSX)
> 3. `Root.tsx` 업데이트 (GeneratedVideo Composition 등록)
> 4. `execa`로 `npx remotion render` 실행
> 5. `output/{jobId}.mp4` 반환

- [ ] **Step 1: `remotion/src/generated/` 폴더 생성**

```bash
mkdir remotion/src/generated
echo "" > remotion/src/generated/.gitkeep
```

- [ ] **Step 2: `app/api/render/route.ts` 작성**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { execa } from 'execa';
import type { Scene } from '../../../remotion/src/types';

const REMOTION_DIR = path.join(process.cwd(), 'remotion');
const OUTPUT_DIR = path.join(process.cwd(), 'output');

function buildGeneratedVideoCode(scenes: Scene[], audioSrc: string, jobId: string): string {
  const aiImports = scenes
    .map((s, i) => s.type === 'ai_free'
      ? `import { AiFreeScene as AI${i} } from './generated/scene-${jobId}-${i}';`
      : '')
    .filter(Boolean)
    .join('\n');

  const sequences = scenes.map((s, i) => {
    const d = s.durationInFrames;
    if (s.type === 'title')           return `<Series.Sequence durationInFrames={${d}}><TitleSlide {...${JSON.stringify(s)}} /></Series.Sequence>`;
    if (s.type === 'card_list')       return `<Series.Sequence durationInFrames={${d}}><CardList {...${JSON.stringify(s)}} /></Series.Sequence>`;
    if (s.type === 'flowchart')       return `<Series.Sequence durationInFrames={${d}}><Flowchart {...${JSON.stringify(s)}} /></Series.Sequence>`;
    if (s.type === 'highlight_text')  return `<Series.Sequence durationInFrames={${d}}><HighlightText {...${JSON.stringify(s)}} /></Series.Sequence>`;
    if (s.type === 'gif_insert')      return `<Series.Sequence durationInFrames={${d}}><GifInsert {...${JSON.stringify(s)}} /></Series.Sequence>`;
    if (s.type === 'image_insert')    return `<Series.Sequence durationInFrames={${d}}><ImageInsert {...${JSON.stringify(s)}} /></Series.Sequence>`;
    if (s.type === 'ai_free')         return `<Series.Sequence durationInFrames={${d}}><AI${i} /></Series.Sequence>`;
    return '';
  }).filter(Boolean).join('\n        ');

  return `import React from 'react';
import { Series, Audio } from 'remotion';
import { TitleSlide } from './templates/TitleSlide';
import { CardList } from './templates/CardList';
import { Flowchart } from './templates/Flowchart';
import { HighlightText } from './templates/HighlightText';
import { GifInsert } from './templates/GifInsert';
import { ImageInsert } from './templates/ImageInsert';
${aiImports}

export const GeneratedVideo: React.FC = () => (
  <>
    ${audioSrc ? `<Audio src="${audioSrc}" />` : ''}
    <Series>
      ${sequences}
    </Series>
  </>
);
`;
}

export async function POST(req: NextRequest) {
  try {
    const { jobId, scenes, audioSrc = '' } = await req.json() as { jobId: string; scenes: Scene[]; audioSrc: string };
    if (!jobId || !scenes?.length) return NextResponse.json({ error: 'jobId and scenes required' }, { status: 400 });

    const genDir = path.join(REMOTION_DIR, 'src', 'generated');
    await mkdir(genDir, { recursive: true });
    await mkdir(OUTPUT_DIR, { recursive: true });

    // ai_free 씬 파일 저장
    for (let i = 0; i < scenes.length; i++) {
      const s = scenes[i];
      if (s.type === 'ai_free' && s.generatedCode) {
        await writeFile(path.join(genDir, `scene-${jobId}-${i}.tsx`), s.generatedCode, 'utf-8');
      }
    }

    // GeneratedVideo.tsx 생성
    const totalFrames = scenes.reduce((sum, s) => sum + s.durationInFrames, 0);
    await writeFile(path.join(REMOTION_DIR, 'src', 'GeneratedVideo.tsx'), buildGeneratedVideoCode(scenes, audioSrc, jobId), 'utf-8');

    // Root.tsx 업데이트
    const rootCode = `import React from 'react';
import { Composition } from 'remotion';
import { DummyVideo } from './DummyVideo';
import { GeneratedVideo } from './GeneratedVideo';
import { theme } from './theme';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="DummyVideo" component={DummyVideo} durationInFrames={390} fps={theme.video.fps} width={theme.video.width} height={theme.video.height} defaultProps={{}} />
    <Composition id="GeneratedVideo" component={GeneratedVideo} durationInFrames={${totalFrames}} fps={theme.video.fps} width={theme.video.width} height={theme.video.height} defaultProps={{}} />
  </>
);
`;
    await writeFile(path.join(REMOTION_DIR, 'src', 'Root.tsx'), rootCode, 'utf-8');

    // Remotion 렌더 실행
    const outputFile = path.join(OUTPUT_DIR, `${jobId}.mp4`);
    await execa('npx', ['remotion', 'render', 'src/index.ts', 'GeneratedVideo', outputFile], {
      cwd: REMOTION_DIR,
      stdio: 'inherit',
    });

    return NextResponse.json({ status: 'done', outputPath: `output/${jobId}.mp4` });
  } catch (err) {
    console.error('[/api/render]', err);
    return NextResponse.json({ error: 'Render failed', detail: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/render/ remotion/src/generated/
git commit -m "feat: add /api/render - dynamic Remotion render pipeline"
```

---

## Task 8: `/api/pipeline/route.ts` — 전체 파이프라인 통합

**Files:** `app/api/pipeline/route.ts`

**Request:** `POST { "topic": "AI 에이전트란?", "useTTS": false }`
**Response:** SSE 스트림 → 각 단계별 진행상황 → 최종 outputPath

- [ ] **Step 1: `app/api/pipeline/route.ts` 작성**

```typescript
import { NextRequest } from 'next/server';

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

async function post(path: string, body: object) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

export async function POST(req: NextRequest) {
  const { topic, useTTS = true } = await req.json();
  const jobId = `job-${Date.now()}`;
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(ctrl) {
      const emit = (data: object) => ctrl.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));
      try {
        // 1. 대본 생성
        emit({ step: 'script', status: 'loading' });
        const { script } = await post('/api/script', { topic });
        emit({ step: 'script', status: 'done' });

        // 2. 씬 분석
        emit({ step: 'scenes', status: 'loading' });
        const { scenes } = await post('/api/scenes', { script });
        emit({ step: 'scenes', status: 'done', count: scenes.length });

        // 3. ai_free 코드 생성
        emit({ step: 'ai-code', status: 'loading' });
        for (const scene of scenes) {
          if (scene.type === 'ai_free') {
            const { code } = await post('/api/ai-code', { prompt: scene.prompt });
            scene.generatedCode = code;
          }
        }
        emit({ step: 'ai-code', status: 'done' });

        // 4. GIF URL 검색
        emit({ step: 'gif', status: 'loading' });
        for (const scene of scenes) {
          if (scene.type === 'gif_insert') {
            try {
              const r = await fetch(`${BASE}/api/gif?keyword=${encodeURIComponent(scene.keyword)}`);
              if (r.ok) scene.gifUrl = (await r.json()).gifUrl;
            } catch { /* GIF 실패 무시 */ }
          }
        }
        emit({ step: 'gif', status: 'done' });

        // 5. TTS 음성 생성
        let audioSrc = '';
        if (useTTS) {
          emit({ step: 'tts', status: 'loading' });
          try {
            const { audioSrc: src } = await post('/api/tts', { text: script, jobId });
            audioSrc = src;
            emit({ step: 'tts', status: 'done', audioSrc });
          } catch {
            emit({ step: 'tts', status: 'skipped' });
          }
        }

        // 6. Remotion 렌더
        emit({ step: 'render', status: 'loading' });
        const { outputPath } = await post('/api/render', { jobId, scenes, audioSrc });
        emit({ step: 'render', status: 'done', outputPath, jobId });

      } catch (err) {
        emit({ step: 'error', status: 'failed', message: String(err) });
      } finally {
        ctrl.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
```

- [ ] **Step 2: 통합 테스트**

```bash
curl -X POST http://localhost:3000/api/pipeline \
  -H "Content-Type: application/json" \
  -d '{"topic": "AI 에이전트란 무엇인가", "useTTS": false}' \
  --no-buffer
```

Expected:
```
data: {"step":"script","status":"loading"}
data: {"step":"script","status":"done"}
data: {"step":"scenes","status":"loading"}
...
data: {"step":"render","status":"done","outputPath":"output/job-xxx.mp4","jobId":"job-xxx"}
```
`output/` 폴더에 mp4 파일 생성 확인.

- [ ] **Step 3: Commit**

```bash
git add app/api/pipeline/
git commit -m "feat: add /api/pipeline - full video generation orchestration with SSE"
```

---

## 완료 기준 (Definition of Done)

- [ ] `GEMINI_API_KEY`가 `.env.local`에 설정되어 있음
- [ ] `/api/script` → 1,000자 이상 한국어 대본 반환
- [ ] `/api/scenes` → 8개 이상 씬 JSON 반환
- [ ] `/api/ai-code` → `export const AiFreeScene` 포함 유효한 TSX 코드 반환
- [ ] `/api/gif` → Tenor gifUrl 반환 (Tenor API 키 필요)
- [ ] `/api/render` → `output/{jobId}.mp4` 생성 확인
- [ ] `/api/pipeline` 한 번 호출로 전체 파이프라인 실행 및 mp4 완성

---

## 다음 단계: Phase 3

Phase 3 대시보드 UI:
- 탭 기반 입력 폼 (직접입력 / 주제생성 / 유튜브조합)
- 실시간 파이프라인 진행상황 표시 (SSE 구독)
- 완성된 영상 미리보기 + 다운로드 버튼
