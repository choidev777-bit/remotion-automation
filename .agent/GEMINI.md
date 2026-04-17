# GEMINI.md — YouTube Generator 프로젝트 컨텍스트

## 프로젝트 개요

**YouTube Generator**는 주제(또는 대본)만 입력하면 AI가 대본 작성 → 씬 분할 → 비주얼 설계 → TTS 음성 생성 → 코드(Remotion TSX) 생성 → 영상 렌더링까지 자동으로 처리하는 **유튜브 정보 영상 자동 생성 파이프라인**입니다.

- **언어**: 한국어 (UI, 대본, 나레이션 모두 한국어)
- **영상 스타일**: 검정 배경 + 초록(#00DFA7) 강조색의 미니멀 정보 전달 영상 (유튜버 "노마드 코더" 스타일)
- **해상도**: 1920×1080, 30fps

---

## 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| **프론트엔드** | Next.js (App Router), React 19, TypeScript | `localhost:3000` |
| **영상 렌더링** | Remotion v4 (별도 서브 프로젝트) | `localhost:3001` (Studio) |
| **AI - 대본/씬/비주얼** | OpenAI — `gpt-5.4-nano` | `lib/glm.ts`의 `glmChat()` 함수 |
| **AI - 코드 생성** | OpenAI — `gpt-5.4-mini` | `lib/glm.ts`의 `glmCode()` 함수, Remotion TSX 코드 생성 전용 |
| **AI - 백업** | Google Gemini (`gemini-2.5-flash`, `gemini-2.5-pro`) | 현재 미사용, lib/gemini.ts에 설정됨 |
| **TTS (음성)** | Fish Speech v1.5 (로컬) | `localhost:8080`, 레퍼런스: `my_voice` |
| **STT (자막)** | Groq Whisper (`whisper-large-v3-turbo`) | 무료, word-level 타임스탬프 |
| **GIF 검색** | Klipy API | gif_insert 씬 타입용 |
| **오디오 후처리** | ffmpeg | 1.2배속 + loudnorm 정규화 |
| **아이콘** | lucide-react (`DynamicIcon`) | 케밥케이스 name 속성 사용 |
| **폰트** | Pretendard (영상), Inter (웹 UI) | |

---

## 폴더 구조

```
youtube_generator/
├── app/                        # Next.js App Router
│   ├── page.tsx                # 메인 페이지 (파이프라인 UI 컨트롤러)
│   ├── layout.tsx              # 루트 레이아웃 (Inter 폰트, 메타데이터)
│   ├── globals.css             # 전체 CSS 스타일
│   ├── components/             # React UI 컴포넌트
│   │   ├── InputForm.tsx       # 주제 입력 / 대본 직접 입력 폼
│   │   ├── ScriptReview.tsx    # 대본 리뷰 (승인/거절/편집)
│   │   ├── MediaInsertPanel.tsx # 미디어 삽입 패널 (이미지/비디오 업로드)
│   │   ├── SceneEditor.tsx     # 씬 편집기 (재렌더용)
│   │   ├── TTSReview.tsx       # TTS 리뷰 (재생/재생성/발음용 대본)
│   │   ├── CodeGenReview.tsx   # 코드 생성 리뷰 (배치별 수동 트리거)
│   │   ├── ProgressTracker.tsx # 진행 상황 표시
│   │   └── ResultPanel.tsx     # 결과 표시 (다운로드 링크)
│   └── api/                    # Next.js API Routes (서버 사이드)
│       ├── script/route.ts     # 대본 생성 (GLM)
│       ├── scenes/route.ts     # 씬 분할 (GLM)
│       ├── pipeline/route.ts   # ★ 메인 파이프라인 (SSE 스트리밍)
│       ├── tts/route.ts        # TTS 음성 생성 (Fish Speech + ffmpeg)
│       ├── whisper/route.ts    # Whisper STT (Groq, word-level)
│       ├── audio/route.ts      # 오디오 파일 서빙 (TTS 리뷰 재생용 프록시)
│       ├── codegen/route.ts    # 코드 생성 (GLM-4.7, 배치)
│       ├── ai-code/route.ts    # 코드 생성 (레거시/대안)
│       ├── render/route.ts     # Remotion 렌더링 + 미리보기
│       ├── re-render/route.ts  # 재렌더링 (씬 수정 후)
│       ├── gif/route.ts        # GIF 검색 (Klipy API)
│       ├── upload-media/route.ts # 미디어 업로드
│       └── download/route.ts   # 영상 다운로드
├── lib/                        # 공유 유틸리티
│   ├── gemini.ts               # Gemini AI 클라이언트 (백업)
│   ├── glm.ts                  # GLM(z.ai) 클라이언트 (메인 AI)
│   ├── prompts.ts              # ★ 모든 AI 프롬프트 정의
│   └── scene-grouper.ts       # Whisper 타이밍 → 씬 배분 로직 (⚠️ 현재 미사용 — 어디서도 import하지 않음)
├── remotion/                   # ★ Remotion 서브 프로젝트 (별도 package.json)
│   ├── src/
│   │   ├── index.ts            # Remotion 엔트리포인트
│   │   ├── Root.tsx            # 🔄 동적 생성: Composition 등록
│   │   ├── GeneratedVideo.tsx  # 🔄 동적 생성: 씬 시퀀스 조합
│   │   ├── DummyVideo.tsx      # 테스트용 더미 영상
│   │   ├── theme.ts            # 디자인 토큰 (색상, 폰트, 간격, 애니메이션)
│   │   ├── types.ts            # Scene 타입 정의 (12가지 씬 타입)
│   │   ├── generated/          # 🔄 동적 생성: AI 생성 씬 컴포넌트 (.tsx)
│   │   ├── templates/          # 정적 씬 템플릿 (12가지)
│   │   │   ├── Subtitle.tsx    # ★ Whisper 기반 실시간 자막
│   │   │   ├── TitleSlide.tsx
│   │   │   ├── CardList.tsx
│   │   │   ├── CodeBlock.tsx
│   │   │   ├── ComparisonTable.tsx
│   │   │   ├── Flowchart.tsx
│   │   │   ├── GifInsert.tsx
│   │   │   ├── HighlightText.tsx
│   │   │   ├── ImageInsert.tsx
│   │   │   ├── SplitScreen.tsx
│   │   │   ├── StatNumber.tsx
│   │   │   └── UserMedia.tsx
│   │   └── scenes/             # 테스트용 씬
│   └── public/                 # 정적 에셋
│       ├── audio/              # 🔄 TTS 생성 오디오 파일 (.wav)
│       ├── logos/              # 브랜드 로고 이미지
│       └── user-media/         # 🔄 사용자 업로드 미디어
├── output/                     # 🔄 렌더링 결과물 (.mp4, .tsx 백업)
├── fish-speech/                # Fish Speech v1.5 로컬 TTS 서버 (Git 서브모듈)
├── scripts/                    # 유틸리티 스크립트
│   └── test-one-scene.ts
├── .agent/                     # AI 에이전트 설정
│   ├── skills/                 # 스킬 정의 (fish-speech-tts 등)
│   └── rules/                  # 코딩 규칙
├── .env.local                  # 환경 변수 (API 키 — Git 미포함)
└── package.json                # 루트 패키지 (Next.js)
```

> 🔄 표시 = 파이프라인 실행 시 동적으로 생성/변경되는 파일

---

## 파이프라인 워크플로우

프론트엔드(`page.tsx`)에서 단계별로 API를 호출하며, 각 단계 사이에 사용자 리뷰/편집이 가능합니다.

```
[입력] → [대본 생성] → [대본 리뷰] → [자막 분할] → [씬 분할] → [미디어 삽입]
    → [TTS 생성 + Whisper STT] → [TTS 리뷰]
    → [비주얼 프롬프트 생성] → [비주얼 리뷰]
    → [코드 생성 (배치)] → [미리보기 (Remotion Studio)]
    → [최종 렌더링] → [다운로드]
```

> 💡 **핵심 설계**: TTS/Whisper로 word-level 타이밍을 먼저 확보한 뒤 비주얼/코드를 생성합니다.
> 이를 통해 AI 코드가 나레이터의 발화 시점에 맞춰 시각 요소를 등장시키는 **나레이션 싱크 애니메이션**이 가능합니다.

### 상세 단계

| # | 단계 | API | AI 모델 | 설명 |
|---|------|-----|---------|------|
| 1 | **대본 생성** | `POST /api/script` | gpt-5.4-nano | 주제 → 2000~4000자 한국어 대본 |
| 2 | **대본 리뷰** | (클라이언트) | — | 사용자가 대본 편집/승인/거절 |
| 2.5 | **자막 분할** | `POST /api/subtitle-split` | gpt-5.4-nano | 대본에 `/` 마커 삽입 (자막 청킹) |
| 3 | **씬 분할** | `POST /api/pipeline` (SSE) | gpt-5.4-nano | 대본 → 의미 단위 씬 JSON 배열 |
| 4 | **미디어 삽입** | `POST /api/upload-media` | — | 사용자가 씬에 이미지/비디오 삽입 |
| 5 | **TTS 생성** | `POST /api/tts` | — | Fish Speech v1.5 → WAV → ffmpeg 후처리 |
| 6 | **Whisper STT** | `POST /api/whisper` | Groq Whisper | Word-level 타임스탬프 → 실시간 자막 |
| 7 | **TTS 리뷰** | (클라이언트) | — | 재생/재생성/발음용 대본 편집 |
| 8 | **비주얼 프롬프트** | `POST /api/pipeline` (SSE) | gpt-5.4-nano | 씬별 화면 구성 지시문 생성 |
| 9 | **비주얼 리뷰** | (클라이언트) | — | 프롬프트 편집 |
| 10 | **코드 생성** | `POST /api/codegen` | gpt-5.4-mini | 배치별 Remotion TSX 코드 생성 (워드 타이밍 주입) |
| 11 | **미리보기** | `POST /api/render` (previewOnly) | — | 코드 저장 → Remotion Studio 열기 |
| 12 | **최종 렌더링** | `POST /api/render` | — | `npx remotion render` → MP4 |

### Phase 시스템

`page.tsx`의 `Phase` 타입으로 UI 상태를 관리합니다:

```
'input' → 'script-review' → 'subtitle-split' → 'building' → 'media-insert'
    → 'tts-gen' → 'tts-review' → 'visual-review'
    → 'code-gen' → 'preview' → 'rendering' → 'done'
    → 'editing' (씬 수정 모드)
```

### SSE 스트리밍

`/api/pipeline`은 **Server-Sent Events (SSE)** 로 실시간 진행 상황을 전달합니다:
- `data: {"step":"script","status":"loading"}` → `"done"`
- `data: {"step":"scenes","status":"done","scenes":[...],"jobId":"job-xxx"}`
- `data: {"step":"error","message":"..."}`

---

## 핵심 데이터 구조

### Scene 타입 (`remotion/src/types.ts`)

모든 씬의 공통 필드:
```typescript
type SceneBase = {
  durationInFrames: number;     // 30fps 기준 프레임 수
  narration?: string;            // 화면 표시용 대본
  ttsText?: string;              // 발음용 대본 (다를 경우만 설정)
  audioSrc?: string;             // "audio/audio-job-xxx.wav"
  words?: { word: string; start: number; end: number }[];  // 자막 타이밍
  prompt?: string;               // AI 비주얼 프롬프트
  generatedCode?: string;        // AI 생성 TSX 코드
};
```

12가지 씬 타입: `title`, `card_list`, `flowchart`, `highlight_text`, `gif_insert`, `image_insert`, `ai_free`, `user_media`, `split_screen`, `code_block`, `stat_number`, `comparison_table`

> **현재 실제로 사용되는 타입은 `ai_free`가 압도적 다수**. 다른 타입은 레거시/확장용.

### 동적 파일 생성 파이프라인

렌더링 시 `/api/render`가 다음 파일을 자동 생성합니다:
1. `remotion/src/generated/scene-{jobId}-{idx}.tsx` — AI 생성 씬 컴포넌트
2. `remotion/src/GeneratedVideo.tsx` — 씬 시퀀스 조합 (import + Series.Sequence)
3. `remotion/src/Root.tsx` — Composition 등록 (totalFrames 업데이트)
4. `output/{jobId}.tsx` — 코드 백업

---

## AI 프롬프트 시스템 (`lib/prompts.ts`)

4가지 핵심 프롬프트:

| 프롬프트 | 용도 | 출력 형식 |
|----------|------|-----------|
| `SCRIPT_PROMPT` | 대본 작성 | 평문 |
| `SCENES_PROMPT` | 씬 분할 | `{"scenes":[{"narration":"...","keyword":"..."}]}` |
| `VISUAL_PROMPT` | 비주얼 설계 | `{"prompts":["...", "..."]}` |
| `AI_FREE_PROMPT` | Remotion TSX 코드 생성 | TSX 코드 (구분자 `=== SCENE_N START/END ===`) |

### AI_FREE_PROMPT 핵심 규칙 (코드 생성 시 반드시 준수)

**색상 체계**:
- 배경: 순수 검정 (`theme.colors.bg` = `#000000`)
- 텍스트: 흰색 (`theme.colors.text` = `#FDFFFF`)
- 강조: 초록 (`theme.colors.primary` = `#00DFA7`)
- 카드: `theme.colors.card` = `#111111`
- 테두리: `theme.colors.border` = `#333333`
- 보조 텍스트: `theme.colors.textMuted` = `#9A9A9A`
  - ⚠️ **불일치 주의**: `theme.ts`에서는 `#9A9A9A`이지만, `lib/prompts.ts`의 AI 프롬프트에서는 `#7A7978`로 안내함. AI가 생성하는 코드는 `#7A7978` 기준으로 나올 수 있음.
- 악센트: `theme.colors.accent` = `#FFCF00` (현재 프롬프트에서 사용 안내 없음)
- 글로우: `theme.colors.primaryGlow` = `rgba(0, 223, 167, 0.15)` (프롬프트에서 글로우 사용 금지이므로 거의 미사용)

**레이아웃 규칙**:
- 하단 20% (y=864 이하) 비움 → 자막 영역
- 콘텐츠는 중앙 75% 영역 (x: 240~1680)
- 한 화면 요소 수: 2~7개

**금지 사항**:
- 배경 패턴/그라데이션/글로우 ❌
- CSS transition/animation/@keyframes ❌
- window/document/fetch/console.log ❌
- spring().to() ❌ (Remotion의 spring()은 숫자를 반환)
- 빨간색 외 색상 (노랑, 파랑, 보라) ❌

---

## 환경 변수 (`.env.local`)

### 현재 .env.local에 존재하는 변수
```
OPENAI_API_KEY=...       # OpenAI API 키 (대본/씬/코드 생성 — lib/glm.ts)
GROQ_API_KEY=...         # Groq Whisper API 키 (자막 STT)
KLIPY_API_KEY=...        # Klipy GIF 검색 API 키
NEXT_PUBLIC_BASE_URL=http://localhost:3000
QWEN_TTS_URL=http://localhost:7860   # ⚠️ 레거시: 코드에서 사용하지 않음
```

### 코드에서 참조하지만 .env.local에 없는 변수
```
FISH_TTS_URL             # tts/route.ts에서 참조. 미설정 시 'http://localhost:8080' 폴백.
GEMINI_API_KEY           # lib/gemini.ts에서 참조. 미설정 시 런타임 에러 가능 (현재 gemini.ts 미사용이므로 문제없음).
```

---

## 개발 환경 실행 방법

### 1. Next.js 개발 서버 (포트 3000)
```bash
npm run dev
```

### 2. Remotion Studio (포트 3001)
```bash
cd remotion
npx remotion studio src/index.ts
```

### 3. Fish Speech TTS 서버 (포트 8080) — TTS 사용 시
```bash
cd fish-speech
python -m tools.api_server
```

### 4. 전체 의존성 설치
```bash
npm install          # 루트 (Next.js)
cd remotion && npm install  # Remotion 서브 프로젝트
```

---

## TTS 워크플로우 상세

1. **텍스트 → Fish Speech v1.5** (`/api/tts`)
   - Reference: `my_voice` (사전 등록된 레퍼런스 음성)
   - 파라미터: `top_p=0.7`, `temperature=0.7`, `chunk_length=200`
2. **ffmpeg 후처리**: `atempo=1.2,loudnorm=I=-14:TP=-1:LRA=11`
3. **WAV 헤더 파싱** → duration 계산 → `durationInFrames` 설정
   - ⚠️ 파이프라인 시점의 duration이 부정확할 수 있으므로, `/api/render`에서 **실제 오디오 파일로부터 duration을 재계산**하여 최종 보정
4. **Groq Whisper STT** (`/api/whisper`) → word-level 타이밍
5. **타이밍 매핑**: 원본 narration 텍스트에 Whisper 타이밍 적용
   - 단어 수 일치 시 1:1 매핑
   - 불일치 시 전체 시간 균등 분배

### 발음용 대본 (ttsText)

화면에 표시되는 `narration`과 TTS에 전달하는 텍스트를 분리할 수 있습니다:
- `narration`: 화면 자막에 표시
- `ttsText`: TTS API에 전달 (발음 최적화)
- `ttsText` 미설정 시 `narration`을 그대로 사용

---

## 자막 시스템

`remotion/src/templates/Subtitle.tsx`:
- Whisper word-level 타이밍 기반 실시간 자막
- 구절 단위 그룹핑 (쉼표/문장부호 기준 + 최대 6단어)
- 시간 갭이 큰 지점에서 분할
- 화면 하단 중앙 배치 (bottom: 48px)
- 텍스트 스타일: 44px, fontWeight 800, 흰색, textShadow

---

## 코드 생성 구조

### 배치 처리

코드 생성은 **배치 단위**로 실행됩니다:
- `CodeGenReview.tsx`에서 사용자가 배치별로 수동 트리거
- API: `POST /api/codegen`
- 출력 구분자: `=== SCENE_{idx} START ===` / `=== SCENE_{idx} END ===`

> ⚠️ **배치 크기 불일치**: 두 곳에서 배치 크기가 다릅니다.
> - `CodeGenReview.tsx`: `BATCH_SIZE = 5` (프론트엔드 수동 코드 생성)
> - `pipeline/route.ts`: `BATCH_SIZE = 3` (자동 파이프라인 코드 생성)

### 코드 보정 (렌더 시)

`/api/render`에서 AI 생성 코드를 자동 보정합니다:
1. **import 교체**: 기존 import 모두 제거 → 표준 import로 강제 교체
   ```typescript
   import React from 'react';
   import { AbsoluteFill, Img, staticFile, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
   import { theme } from '../theme';
   import { DynamicIcon } from 'lucide-react/dynamic';
   ```
2. **export명 통일**: `export const {아무이름}` → `export const AiFreeScene`
3. **style 쉼표 누락 수정**: `{ opacity: val textAlign: 'center' }` → `{ opacity: val, textAlign: 'center' }`
4. **useVideoConfig 보정**: `sec = frame / fps` 패턴 사용 시 `useVideoConfig()` 및 `fps` 디스트럭처링 자동 삽입
5. **interpolate clamp 보정**: 옵션 객체 없는 3인자 `interpolate()` 호출에 `{extrapolateLeft:'clamp', extrapolateRight:'clamp'}` 자동 추가
6. **씬 duration 보정**: 각 씬의 오디오 파일을 실제로 읽어 WAV 헤더에서 duration을 계산하고, `durationInFrames`를 실제 오디오 길이에 맞게 자동 보정

---

## 나레이션 싱크 애니메이션

### 개요

AI가 생성하는 Remotion 씬 코드에서, **나레이터가 특정 키워드를 말하는 시점에 관련 시각 요소가 등장**하도록 합니다.

### 데이터 흐름

```
TTS 오디오 생성 → Whisper STT (word-level 타이밍) → words[] 확보
→ codegen 프롬프트에 핵심 키워드 타이밍 요약 주입
→ AI가 sec 기반 등장 시점으로 코드 생성
```

### 프롬프트 주입 형태

codegen API 호출 시, 씬에 `words[]`가 있으면 핵심 키워드(2자 이상, 최대 7개)를 추출하여 프롬프트에 추가:

```
씬 인덱스 3 (150프레임, 5.0초):
나레이션: "카파시의 LLM Wiki 개념이 핵심이에요"
워드 타이밍: "카파시의" → 0.3초, "LLM" → 0.6초, "Wiki" → 0.9초, "개념이" → 1.2초, "핵심이에요" → 1.5초
비주얼: 카드 목록으로 핵심 개념 정리
```

### 코드 패턴

AI가 생성하는 코드에서 사용하는 패턴:

```tsx
const frame = useCurrentFrame();
const { fps } = useVideoConfig();
const sec = frame / fps;

// 워드 타이밍 기반 등장
const titleOpacity = interpolate(sec, [0.3, 0.6], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
const card1Opacity = interpolate(sec, [0.8, 1.1], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
```

### 폴백 동작

- `words[]`가 없으면 (TTS 미사용, Whisper 실패 등): 기존 프레임 기반 stagger 패턴 유지
- 씬 리뷰에서 나레이션 수정 시: `words[]`와 `audioSrc` 자동 삭제 → 새 TTS에서 갱신

### pipeline 플래그

| 플래그 | 용도 |
|--------|------|
| `skipVisual` | 비주얼 프롬프트 생성 건너뛰기 (TTS만 먼저 실행 시) |
| `stopAfterTTS` | TTS 생성 후 중단 |
| `stopAfterVisual` | 비주얼 생성 후 중단 |

---

## 코딩 컨벤션

### 일반 규칙
- **언어**: TypeScript 엄격 모드
- **한국어 우선**: 모든 UI 텍스트, 주석, 로그 메시지는 한국어
- **에러 핸들링**: 모든 API 라우트에 try-catch + 콘솔 로그
- **재시도**: OpenAI 호출은 429 에러 시 지수 백오프 재시도 (10s → 20s → 40s)

### Remotion 씬 코드 규칙
- `theme.colors.xxx` 형식으로 색상 참조 (직접 hex 금지)
- `useCurrentFrame()` + `interpolate()` / `spring()` 으로 애니메이션
- DynamicIcon은 반드시 케밥케이스: `name="trending-up"` (camelCase 금지)
- 하단 20% (y ≥ 864) 에는 핵심 요소 배치 금지 (자막 영역)
- AbsoluteFill 루트 컨테이너 필수

### 파일 명명 규칙
- API 라우트: `app/api/{기능}/route.ts`
- 컴포넌트: PascalCase (`TTSReview.tsx`)
- AI 생성 씬: `scene-{jobId}-{index}.tsx`
- TTS 오디오: `audio-{jobId}.wav` (원본), `audio-{jobId}-v{N}-{timestamp}.wav` (재생성)

---

## 알려진 제한사항 & 주의점

1. **OpenAI API 레이트 리밋**: `gpt-5.4-mini` 코드 생성 시 429 에러 빈발 가능 → 지수 백오프 재시도 적용 (10s → 20s → 40s)
2. **Remotion 서브 프로젝트**: 루트 tsconfig에서 `remotion/` 디렉토리 exclude → 별도 빌드 체계
3. **동적 파일 생성**: `GeneratedVideo.tsx`, `Root.tsx`, `generated/*.tsx`는 렌더 시 매번 덮어씀 → 수동 편집 불가
4. **Fish Speech 서버**: 로컬에 GPU가 필요하며 서버가 꺼져 있으면 TTS 기능 비활성화
5. **출력 파일 관리**: `output/*.mp4`는 `.gitignore`에 포함, `output/*.tsx`는 코드 백업용
6. **Gemini API**: `lib/gemini.ts`에 설정은 되어 있으나 파이프라인에서 미사용. 또한 `.env.local`에 `GEMINI_API_KEY` 자체가 없어 import하면 런타임 에러 발생
13. **lib/glm.ts 파일명**: 파일명이 `glm.ts`이지만 실제로는 OpenAI SDK를 사용하고 `OPENAI_API_KEY`를 참조함. 하위 호환성을 위해 파일명은 유지됨.
7. **유튜브 조합 탭**: InputForm에 UI가 있으나 아직 미구현 (disabled 상태)
8. **TTSReview v1 duration 한계**: TTSReview에서 원본(v1)의 duration은 `scene.durationInFrames / 30`으로 역산한 값이며, 실제 오디오 파일 길이가 아님. 파이프라인이 durationInFrames를 잘못 설정했으면 v1의 duration도 틀림. → `/api/render`의 duration 보정으로 최종적으로 해결됨
9. **TTS UI 레이블 불일치**: `InputForm.tsx`에 "Qwen3 — 로컬 필요"라고 표시되지만, 실제 `tts/route.ts`는 Fish Speech v1.5 API를 호출함. UI 레이블이 오래된 상태
10. **textMuted 색상 불일치**: `theme.ts`에서는 `#9A9A9A`이지만 `lib/prompts.ts` AI 프롬프트에서는 `#7A7978`으로 안내 → AI 생성 코드에서 theme과 다른 색상이 하드코딩될 수 있음
11. **scene-grouper.ts 미사용**: `lib/scene-grouper.ts`의 `assignTimings()` 함수는 프로젝트 어디서도 import하지 않는 데드 코드
12. **QWEN_TTS_URL 레거시**: `.env.local`에 `QWEN_TTS_URL=http://localhost:7860`이 남아 있으나 코드에서 참조하지 않음
