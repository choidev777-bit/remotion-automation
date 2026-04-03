# YouTube 자동화 Phase 1: Foundation 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Next.js 14 + Remotion 프로젝트 초기화, 디자인 시스템 구성, 6개 씬 템플릿 구현

**Architecture:** youtube_generator 폴더에 Next.js App Router 앱을 초기화하고, 같은 repo 내 `remotion/` 폴더에 Remotion 프로젝트를 구성한다. 공유 타입은 `remotion/src/types.ts`에, 디자인 토큰은 `remotion/src/theme.ts`에 정의한다.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Remotion 4.x, Google Fonts (Pretendard)

---

## 파일 구조 (Phase 1 완료 시)

```
youtube_generator/
├── app/
│   ├── layout.tsx
│   └── page.tsx              ← placeholder ("Coming soon")
├── remotion/
│   ├── package.json
│   └── src/
│       ├── types.ts           ← Scene 타입 정의
│       ├── theme.ts           ← 디자인 시스템
│       ├── Root.tsx           ← 씬 조합 진입점
│       ├── DummyVideo.tsx     ← 개발/테스트용 더미 영상
│       └── templates/
│           ├── TitleSlide.tsx
│           ├── CardList.tsx
│           ├── Flowchart.tsx
│           ├── HighlightText.tsx
│           ├── GifInsert.tsx
│           └── ImageInsert.tsx
├── package.json
└── .env.local                 ← API 키 (Phase 2에서 사용)
```

---

## Task 1: Next.js 프로젝트 초기화

**Files:**
- Create: `package.json`, `app/layout.tsx`, `app/page.tsx`, `tsconfig.json`

- [ ] **Step 1: 사용 가능한 옵션 확인**

```bash
npx -y create-next-app@latest --help
```

- [ ] **Step 2: Next.js 초기화 (non-interactive)**

```bash
npx -y create-next-app@latest ./ --typescript --eslint --app --no-tailwind --no-src-dir --import-alias "@/*" --yes
```

Expected: `app/`, `public/`, `package.json`, `tsconfig.json` 생성됨

- [ ] **Step 3: 개발 서버 실행 확인**

```bash
npm run dev
```

Expected: `http://localhost:3000` 접속 시 Next.js 기본 페이지 표시

- [ ] **Step 4: placeholder 페이지로 교체**

`app/page.tsx` 전체를 다음으로 교체:

```tsx
export default function Home() {
  return (
    <main style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>YouTube 자동 생성기</h1>
      <p>Coming soon — Phase 3에서 구현 예정</p>
    </main>
  );
}
```

- [ ] **Step 5: output 폴더 생성**

```bash
mkdir output
echo "*.mp4" > output/.gitignore
```

- [ ] **Step 6: Commit**

```bash
git init
git add .
git commit -m "feat: initialize Next.js 14 project"
```

---

## Task 2: Remotion 프로젝트 초기화

**Files:**
- Create: `remotion/package.json`, `remotion/src/index.ts`

- [ ] **Step 1: remotion 폴더 생성 및 초기화**

```bash
mkdir remotion
cd remotion
npm init -y
```

- [ ] **Step 2: Remotion 의존성 설치**

```bash
npm install remotion @remotion/cli @remotion/player react react-dom
npm install -D typescript @types/react @types/react-dom
```

- [ ] **Step 3: `remotion/tsconfig.json` 생성**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
```

- [ ] **Step 4: `remotion/package.json` scripts 수정**

```json
{
  "scripts": {
    "studio": "npx remotion studio src/index.ts",
    "render": "npx remotion render src/index.ts DummyVideo"
  }
}
```

- [ ] **Step 5: Remotion 설치 확인**

```bash
cd remotion && npx remotion --version
```

Expected: Remotion 버전 출력 (예: `4.x.x`)

- [ ] **Step 6: Commit**

```bash
git add remotion/
git commit -m "feat: initialize Remotion project"
```

---

## Task 3: 타입 정의 (types.ts)

**Files:**
- Create: `remotion/src/types.ts`

- [ ] **Step 1: `remotion/src/types.ts` 작성**

```typescript
export type TitleScene = {
  type: 'title';
  durationInFrames: number;
  title: string;
  subtitle?: string;
};

export type CardListScene = {
  type: 'card_list';
  durationInFrames: number;
  heading: string;
  cards: { name: string; desc?: string }[];
};

export type FlowchartScene = {
  type: 'flowchart';
  durationInFrames: number;
  heading: string;
  nodes: { id: string; label: string }[];
  edges: { from: string; to: string }[];
};

export type HighlightTextScene = {
  type: 'highlight_text';
  durationInFrames: number;
  text: string;
  emphasis?: string;
};

export type GifInsertScene = {
  type: 'gif_insert';
  durationInFrames: number;
  keyword: string;
  gifUrl: string;
  caption?: string;
};

export type ImageInsertScene = {
  type: 'image_insert';
  durationInFrames: number;
  src: string;
  caption?: string;
};

export type AiFreeScene = {
  type: 'ai_free';
  durationInFrames: number;
  prompt: string;
  generatedCode: string;
};

export type Scene =
  | TitleScene
  | CardListScene
  | FlowchartScene
  | HighlightTextScene
  | GifInsertScene
  | ImageInsertScene
  | AiFreeScene;

export type VideoConfig = {
  scenes: Scene[];
  audioSrc: string;
  fps: number;
  width: number;
  height: number;
};
```

- [ ] **Step 2: Commit**

```bash
git add remotion/src/types.ts
git commit -m "feat: add Scene type definitions"
```

---

## Task 4: 디자인 시스템 (theme.ts)

**Files:**
- Create: `remotion/src/theme.ts`

- [ ] **Step 1: `remotion/src/theme.ts` 작성**

```typescript
export const theme = {
  colors: {
    bg: '#F9FAFB',
    text: '#000000',
    primary: '#09E85E',
    accent: '#F5B700',
    card: '#FFFFFF',
    border: '#E5E7EB',
    textMuted: '#6B7280',
  },
  font: {
    family: 'Pretendard, -apple-system, sans-serif',
    size: {
      hero: 72,
      h1: 56,
      h2: 40,
      h3: 28,
      body: 24,
      small: 18,
    },
    weight: {
      regular: 400,
      medium: 500,
      bold: 700,
      black: 900,
    },
  },
  spacing: {
    xs: 8,
    sm: 16,
    md: 32,
    lg: 48,
    xl: 64,
    xxl: 96,
  },
  radius: {
    sm: 8,
    md: 16,
    lg: 24,
    full: 9999,
  },
  animation: {
    duration: {
      fast: 15,    // 0.5초 @30fps
      normal: 20,  // 0.67초
      slow: 30,    // 1초
    },
    spring: {
      damping: 15,
      stiffness: 100,
      mass: 1,
    },
    stagger: 8,    // 카드 순차 등장 간격 (프레임)
  },
  video: {
    width: 1920,
    height: 1080,
    fps: 30,
  },
} as const;

export type Theme = typeof theme;
```

- [ ] **Step 2: Commit**

```bash
git add remotion/src/theme.ts
git commit -m "feat: add design system theme"
```

---

## Task 5: TitleSlide 템플릿

**Files:**
- Create: `remotion/src/templates/TitleSlide.tsx`

- [ ] **Step 1: `remotion/src/templates/TitleSlide.tsx` 작성**

```tsx
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { theme } from '../theme';
import type { TitleScene } from '../types';

export const TitleSlide: React.FC<TitleScene> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, theme.animation.duration.normal], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(frame, [0, theme.animation.duration.normal], [30, 0], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xxl,
        fontFamily: theme.font.family,
      }}
    >
      {/* 강조 바 */}
      <div
        style={{
          width: 80,
          height: 6,
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.primary,
          marginBottom: theme.spacing.lg,
          opacity,
        }}
      />
      {/* 제목 */}
      <h1
        style={{
          fontSize: theme.font.size.hero,
          fontWeight: theme.font.weight.black,
          color: theme.colors.text,
          textAlign: 'center',
          margin: 0,
          marginBottom: theme.spacing.md,
          opacity,
          transform: `translateY(${translateY}px)`,
          lineHeight: 1.2,
        }}
      >
        {title}
      </h1>
      {/* 부제목 */}
      {subtitle && (
        <p
          style={{
            fontSize: theme.font.size.h3,
            fontWeight: theme.font.weight.regular,
            color: theme.colors.textMuted,
            textAlign: 'center',
            margin: 0,
            opacity,
            transform: `translateY(${translateY}px)`,
          }}
        >
          {subtitle}
        </p>
      )}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add remotion/src/templates/TitleSlide.tsx
git commit -m "feat: add TitleSlide template"
```

---

## Task 6: CardList 템플릿

**Files:**
- Create: `remotion/src/templates/CardList.tsx`

- [ ] **Step 1: `remotion/src/templates/CardList.tsx` 작성**

```tsx
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import type { CardListScene } from '../types';

export const CardList: React.FC<CardListScene> = ({ heading, cards }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingOpacity = interpolate(frame, [0, theme.animation.duration.normal], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bg,
        padding: theme.spacing.xxl,
        fontFamily: theme.font.family,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      {/* 섹션 제목 */}
      <h2
        style={{
          fontSize: theme.font.size.h2,
          fontWeight: theme.font.weight.bold,
          color: theme.colors.text,
          margin: 0,
          marginBottom: theme.spacing.xl,
          opacity: headingOpacity,
        }}
      >
        {heading}
      </h2>
      {/* 카드 목록 */}
      <div style={{ display: 'flex', gap: theme.spacing.md, flexWrap: 'wrap' }}>
        {cards.map((card, i) => {
          const delay = i * theme.animation.stagger;
          const cardSpring = spring({
            fps,
            frame: frame - delay,
            config: theme.animation.spring,
          });
          const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);
          const cardY = interpolate(cardSpring, [0, 1], [40, 0]);

          return (
            <div
              key={i}
              style={{
                flex: '1 1 260px',
                backgroundColor: theme.colors.card,
                borderRadius: theme.radius.lg,
                border: `2px solid ${theme.colors.border}`,
                padding: theme.spacing.lg,
                opacity: cardOpacity,
                transform: `translateY(${cardY}px)`,
              }}
            >
              {/* 인덱스 배지 */}
              <div
                style={{
                  display: 'inline-flex',
                  width: 36,
                  height: 36,
                  borderRadius: theme.radius.full,
                  backgroundColor: theme.colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: theme.font.size.body,
                  fontWeight: theme.font.weight.bold,
                  color: '#000',
                  marginBottom: theme.spacing.sm,
                }}
              >
                {i + 1}
              </div>
              <h3
                style={{
                  fontSize: theme.font.size.h3,
                  fontWeight: theme.font.weight.bold,
                  color: theme.colors.text,
                  margin: 0,
                  marginBottom: card.desc ? theme.spacing.xs : 0,
                }}
              >
                {card.name}
              </h3>
              {card.desc && (
                <p
                  style={{
                    fontSize: theme.font.size.small,
                    color: theme.colors.textMuted,
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {card.desc}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add remotion/src/templates/CardList.tsx
git commit -m "feat: add CardList template"
```

---

## Task 7: HighlightText 템플릿

**Files:**
- Create: `remotion/src/templates/HighlightText.tsx`

- [ ] **Step 1: `remotion/src/templates/HighlightText.tsx` 작성**

```tsx
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { theme } from '../theme';
import type { HighlightTextScene } from '../types';

export const HighlightText: React.FC<HighlightTextScene> = ({ text, emphasis }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, theme.animation.duration.slow], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xxl,
        fontFamily: theme.font.family,
      }}
    >
      <p
        style={{
          fontSize: theme.font.size.h1,
          fontWeight: theme.font.weight.bold,
          color: theme.colors.text,
          textAlign: 'center',
          lineHeight: 1.4,
          margin: 0,
          opacity: progress,
        }}
      >
        {text}
      </p>
      {emphasis && (
        <div
          style={{
            marginTop: theme.spacing.lg,
            padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
            backgroundColor: theme.colors.accent,
            borderRadius: theme.radius.md,
            fontSize: theme.font.size.h3,
            fontWeight: theme.font.weight.black,
            color: '#000',
            opacity: interpolate(frame, [theme.animation.duration.slow, theme.animation.duration.slow + 15], [0, 1], { extrapolateRight: 'clamp' }),
          }}
        >
          {emphasis}
        </div>
      )}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add remotion/src/templates/HighlightText.tsx
git commit -m "feat: add HighlightText template"
```

---

## Task 8: GifInsert + ImageInsert 템플릿

**Files:**
- Create: `remotion/src/templates/GifInsert.tsx`
- Create: `remotion/src/templates/ImageInsert.tsx`

- [ ] **Step 1: `remotion/src/templates/GifInsert.tsx` 작성**

```tsx
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion';
import { theme } from '../theme';
import type { GifInsertScene } from '../types';

export const GifInsert: React.FC<GifInsertScene> = ({ gifUrl, caption }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, theme.animation.duration.normal], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xl,
        fontFamily: theme.font.family,
        opacity,
      }}
    >
      <Img
        src={gifUrl}
        style={{
          maxWidth: '80%',
          maxHeight: caption ? '75%' : '85%',
          borderRadius: theme.radius.lg,
          objectFit: 'contain',
        }}
      />
      {caption && (
        <p style={{ fontSize: theme.font.size.body, color: theme.colors.textMuted, marginTop: theme.spacing.md }}>
          {caption}
        </p>
      )}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: `remotion/src/templates/ImageInsert.tsx` 작성**

```tsx
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion';
import { theme } from '../theme';
import type { ImageInsertScene } from '../types';

export const ImageInsert: React.FC<ImageInsertScene> = ({ src, caption }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, theme.animation.duration.normal], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xl,
        fontFamily: theme.font.family,
        opacity,
      }}
    >
      <Img
        src={src}
        style={{
          maxWidth: '90%',
          maxHeight: caption ? '78%' : '90%',
          borderRadius: theme.radius.lg,
          objectFit: 'contain',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}
      />
      {caption && (
        <p style={{ fontSize: theme.font.size.body, color: theme.colors.textMuted, marginTop: theme.spacing.md }}>
          {caption}
        </p>
      )}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 3: Commit**

```bash
git add remotion/src/templates/
git commit -m "feat: add GifInsert and ImageInsert templates"
```

---

## Task 9: Flowchart 템플릿

**Files:**
- Create: `remotion/src/templates/Flowchart.tsx`

- [ ] **Step 1: `remotion/src/templates/Flowchart.tsx` 작성**

```tsx
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { theme } from '../theme';
import type { FlowchartScene } from '../types';

export const Flowchart: React.FC<FlowchartScene> = ({ heading, nodes, edges }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bg,
        padding: theme.spacing.xxl,
        fontFamily: theme.font.family,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <h2 style={{ fontSize: theme.font.size.h2, fontWeight: theme.font.weight.bold, color: theme.colors.text, margin: 0, marginBottom: theme.spacing.xl }}>
        {heading}
      </h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, flexWrap: 'wrap' }}>
        {nodes.map((node, i) => {
          const delay = i * 10;
          const opacity = interpolate(frame, [delay, delay + theme.animation.duration.normal], [0, 1], { extrapolateRight: 'clamp' });
          const isLast = i === nodes.length - 1;

          // edges에서 이 노드에서 나가는 엣지가 있는지 확인
          const hasEdge = edges.some(e => e.from === node.id) && !isLast;

          return (
            <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
              {/* 노드 박스 */}
              <div
                style={{
                  padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                  backgroundColor: theme.colors.card,
                  border: `2px solid ${theme.colors.primary}`,
                  borderRadius: theme.radius.md,
                  fontSize: theme.font.size.body,
                  fontWeight: theme.font.weight.bold,
                  color: theme.colors.text,
                  opacity,
                  minWidth: 140,
                  textAlign: 'center',
                }}
              >
                {node.label}
              </div>
              {/* 화살표 */}
              {hasEdge && (
                <div style={{
                  fontSize: theme.font.size.h2,
                  color: theme.colors.primary,
                  opacity,
                  fontWeight: theme.font.weight.bold,
                }}>
                  →
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add remotion/src/templates/Flowchart.tsx
git commit -m "feat: add Flowchart template"
```

---

## Task 10: Root.tsx 씬 조합 + DummyVideo

**Files:**
- Create: `remotion/src/Root.tsx`
- Create: `remotion/src/DummyVideo.tsx`
- Create: `remotion/src/index.ts`

- [ ] **Step 1: `remotion/src/Root.tsx` 작성**

```tsx
import { Composition } from 'remotion';
import { DummyVideo } from './DummyVideo';
import { theme } from './theme';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DummyVideo"
        component={DummyVideo}
        durationInFrames={300}
        fps={theme.video.fps}
        width={theme.video.width}
        height={theme.video.height}
        defaultProps={{}}
      />
    </>
  );
};
```

- [ ] **Step 2: `remotion/src/DummyVideo.tsx` 작성 (모든 템플릿 순서대로 테스트)**

```tsx
import { Series } from 'remotion';
import { TitleSlide } from './templates/TitleSlide';
import { CardList } from './templates/CardList';
import { Flowchart } from './templates/Flowchart';
import { HighlightText } from './templates/HighlightText';

export const DummyVideo: React.FC = () => {
  return (
    <Series>
      <Series.Sequence durationInFrames={90}>
        <TitleSlide type="title" durationInFrames={90} title="유튜브 자동화 시스템" subtitle="Remotion + Gemini API로 만드는 영상" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={120}>
        <CardList
          type="card_list"
          durationInFrames={120}
          heading="핵심 기능 3가지"
          cards={[
            { name: '대본 생성', desc: 'Gemini 2.5 Flash로 자동 작성' },
            { name: 'TTS 음성', desc: 'Qwen3 TTS 로컬 생성' },
            { name: '자동 렌더링', desc: 'Remotion CLI로 mp4 완성' },
          ]}
        />
      </Series.Sequence>
      <Series.Sequence durationInFrames={90}>
        <Flowchart
          type="flowchart"
          durationInFrames={90}
          heading="파이프라인 흐름"
          nodes={[
            { id: '1', label: '대본 입력' },
            { id: '2', label: '씬 분석' },
            { id: '3', label: '렌더링' },
            { id: '4', label: 'MP4 완성' },
          ]}
          edges={[
            { from: '1', to: '2' },
            { from: '2', to: '3' },
            { from: '3', to: '4' },
          ]}
        />
      </Series.Sequence>
      <Series.Sequence durationInFrames={90}>
        <HighlightText type="highlight_text" durationInFrames={90} text="대본만 넣으면" emphasis="영상이 자동으로 만들어집니다" />
      </Series.Sequence>
    </Series>
  );
};
```

- [ ] **Step 3: `remotion/src/index.ts` 작성**

```typescript
import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';

registerRoot(RemotionRoot);
```

- [ ] **Step 4: Remotion Studio에서 시각적 확인**

```bash
cd remotion && npm run studio
```

Expected: 브라우저에서 DummyVideo 프리뷰 확인. TitleSlide → CardList → Flowchart → HighlightText 순서로 재생됨.

- [ ] **Step 5: 테스트 렌더링 (mp4 생성 확인)**

```bash
cd remotion && npx remotion render src/index.ts DummyVideo ../output/test-phase1.mp4
```

Expected: `output/test-phase1.mp4` 파일 생성됨 (약 10초 분량)

- [ ] **Step 6: Commit**

```bash
git add remotion/src/
git commit -m "feat: add Root.tsx scene compositor and DummyVideo test"
```

---

## Phase 1 완료 확인 체크리스트

- [ ] `npm run dev` → `http://localhost:3000` 접속 가능
- [ ] `cd remotion && npm run studio` → Remotion Studio에서 DummyVideo 재생 가능
- [ ] `output/test-phase1.mp4` 렌더링 성공
- [ ] TitleSlide, CardList, Flowchart, HighlightText가 스튜디오에서 올바르게 표시됨
- [ ] 색상이 theme.ts 값과 일치함 (`#F9FAFB` 배경, `#09E85E` 강조)

**→ 모두 통과하면 Phase 2 (Pipeline API) 진행**
