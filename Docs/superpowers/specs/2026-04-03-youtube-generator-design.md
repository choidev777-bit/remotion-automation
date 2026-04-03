# YouTube 자동 생성기 설계 문서

**Goal:** 대본(또는 주제/유튜브 링크)을 입력하면 Remotion 기반의 영상(.mp4)을 자동으로 생성하는 All-in-one 자동화 시스템

**Architecture:** Next.js 14 대시보드 + Remotion 영상 프로젝트를 하나의 repo에서 관리. API routes가 파이프라인 각 단계를 순차 실행.

**Tech Stack:** Next.js 14, Remotion, Gemini API (Google AI Studio), Qwen3 TTS (로컬), Clippy API, yt-dlp, OpenAI Whisper

---

## 1. 영상 스타일

- **기본**: 기술 교육/개념 설명 스타일 (메이커 에반, 데이터팝콘 참조)
  - 도식, 흐름도, 카드 리스트, 강조 텍스트 등 도형/텍스트 중심
- **옵션**: 화면 녹화 클립 삽입, 이미지 삽입, GIF(움짤) 삽입 가능

---

## 2. 파이프라인 흐름

```
[1단계] 대본 준비 (3가지 모드 중 선택)
  A) 직접 입력  - 텍스트박스에 대본 붙여넣기
  B) 주제 → AI  - 주제 입력 → Claude API가 대본 작성
  C) 유튜브 링크 → AI
     - 링크 여러 개 입력
     - yt-dlp로 각 영상 자막 추출
     - Claude API가 자막들을 조합하여 새 대본 작성

[2단계] 음성 준비 (2가지 모드 중 선택)
  A) 직접 녹음  - mp3/wav 파일 업로드
  B) TTS 자동   - Qwen3 TTS (로컬) 로 음성 파일 생성
     - 커스텀 보이스 등록 가능 (3~10초 샘플)
     - Qwen3 TTS는 Pinokio로 설치, 로컬 서버로 구동

[3단계] 씬 분석
  - Claude API가 대본을 읽고 씬 목록 JSON 생성
  - 각 씬의 타입, 콘텐츠, 타이밍 결정
  - GIF가 필요한 씬에는 gif_insert 타입 지정

[4단계] GIF 검색 (gif_insert 씬에 한함)
  - Clippy API로 씬 내용에 어울리는 GIF 자동 검색
  - 검색 결과 중 가장 적합한 GIF URL 선택

[5단계] Remotion 렌더링
  - 씬 JSON + 음성 파일 → remotion/public/ 에 배치
  - npx remotion render 실행
  - output/ 폴더에 mp4 저장

[6단계] 완성
  - 대시보드에서 다운로드 버튼 표시
```

---

## 3. 씬 타입 목록

| 타입 | 설명 |
|------|------|
| `title` | 제목 슬라이드 (큰 제목 + 부제목) |
| `card_list` | 카드 3~4개 나열 |
| `flowchart` | 흐름도 (노드 + 화살표) |
| `highlight_text` | 핵심 문장 강조 표시 |
| `gif_insert` | Clippy GIF 자동 검색 후 삽입 |
| `image_insert` | 직접 업로드한 이미지/화면녹화 삽입 |
| `ai_free` | Claude가 대본 내용에 맞게 자유 생성 |

---

## 4. 프로젝트 구조

```
youtube_generator/
├── app/
│   ├── page.tsx                  ← 메인 대시보드 UI
│   └── api/
│       ├── script/route.ts       ← 대본 생성 (3가지 모드)
│       ├── tts/route.ts          ← Qwen3 TTS 호출
│       ├── scenes/route.ts       ← 씬 분석 → JSON
│       ├── gif/route.ts          ← Clippy GIF 검색
│       └── render/route.ts       ← Remotion 렌더 트리거
├── remotion/
│   └── src/
│       ├── theme.ts              ← 디자인 시스템
│       ├── templates/
│       │   ├── TitleSlide.tsx
│       │   ├── CardList.tsx
│       │   ├── Flowchart.tsx
│       │   ├── HighlightText.tsx
│       │   ├── GifInsert.tsx
│       │   └── ImageInsert.tsx
│       ├── Root.tsx              ← 씬 조합 + 렌더링 진입점
│       └── types.ts              ← SceneData 타입 정의
├── output/                       ← 완성 mp4 저장
├── docs/superpowers/specs/       ← 설계 문서
└── .env.local                    ← API 키 관리
```

---

## 5. 디자인 시스템 (theme.ts)

```typescript
export const theme = {
  colors: {
    bg: '#F9FAFB',       // 배경 (밝은 그레이)
    text: '#000000',     // 일반 텍스트
    primary: '#09E85E',  // 강조 (그린)
    accent: '#F5B700',   // 포인트 (옐로우)
    card: '#FFFFFF',     // 카드 배경
  },
  font: {
    family: 'Pretendard',
  },
  animation: {
    duration: { fast: 15, normal: 20, slow: 30 }, // 프레임 수 (30fps 기준)
    spring: { damping: 15 },
    stagger: 8,          // 순차 등장 간격 (프레임)
  },
}
```

---

## 6. 씬 JSON 구조

```typescript
// types.ts
type Scene =
  | { type: 'title';          durationInFrames: number; title: string; subtitle?: string }
  | { type: 'card_list';      durationInFrames: number; title: string; cards: { name: string; desc?: string }[] }
  | { type: 'flowchart';      durationInFrames: number; title: string; nodes: Node[]; edges: Edge[] }
  | { type: 'highlight_text'; durationInFrames: number; text: string; emphasis?: string }
  | { type: 'gif_insert';     durationInFrames: number; keyword: string; gifUrl?: string }
  | { type: 'image_insert';   durationInFrames: number; src: string; caption?: string }
  | { type: 'ai_free';        durationInFrames: number; prompt: string; generatedCode: string }
  // ai_free: Claude가 씬 분석 단계에서 prompt를 보고 Remotion TSX 컴포넌트 코드를 직접 생성.
  // generatedCode는 theme.ts를 import하고 AbsoluteFill을 루트로 하는 완성된 React 컴포넌트 문자열.

type VideoConfig = {
  scenes: Scene[];
  audioSrc: string;    // 음성 파일 경로
  fps: number;         // 30
  width: number;       // 1920
  height: number;      // 1080
}
```

---

## 7. 대시보드 UI 흐름

```
┌─────────────────────────────────────┐
│  🎬 유튜브 영상 자동 생성기          │
├─────────────────────────────────────┤
│  [대본 모드 탭]                      │
│  ○ 직접 입력  ○ 주제로 생성  ○ 유튜브 조합 │
│                                     │
│  [대본 입력/생성 영역]               │
│                                     │
│  [음성 탭]                          │
│  ○ TTS 자동  ○ 직접 녹음            │
│                                     │
│  [🎬 영상 생성] 버튼                 │
│                                     │
│  ─── 진행 상황 ───                  │
│  ✅ 대본 준비 완료                   │
│  🔄 씬 분석 중...                   │
│  ○ GIF 검색                         │
│  ○ 렌더링                           │
│                                     │
│  [📥 다운로드] (완성 후 표시)        │
└─────────────────────────────────────┘
```

---

## 8. API 키 요구사항

| 서비스 | 모델 | 용도 | 비용 |
|--------|------|------|------|
| Gemini API (Google AI Studio) | `gemini-2.5-flash` | 대본 생성, 씬 분석 → JSON | **무료** |
| Gemini API (Google AI Studio) | `gemini-2.5-pro` | ai_free 씬 코드 생성 (Remotion 스킬 문서 주입) | **무료** |
| Qwen3 TTS | — | 음성 생성 (로컬, 커스텀 보이스) | **무료** (GPU 필요) |
| Clippy API | — | GIF 검색 | 무료 티어 존재 |
| OpenAI API (Whisper) | — | 직접 녹음 파일 싱크 | 종량제 |
| yt-dlp | — | 유튜브 자막 추출 | 무료 (CLI 도구) |

---

## 9. 렌더링 스펙

- **해상도**: 1920×1080 (16:9)
- **FPS**: 30
- **렌더링**: 로컬 (`npx remotion render`)
- **출력**: `output/YYYY-MM-DD-HH-mm-<title>.mp4`
