import { NextRequest, NextResponse } from 'next/server';
import { glmCode } from '@/lib/glm';

interface SceneInput {
  idx: number;
  prompt: string;
}

export async function POST(req: NextRequest) {
  try {
    const { scenes } = await req.json() as { scenes: SceneInput[] };
    if (!scenes?.length) {
      return NextResponse.json({ error: 'scenes is required' }, { status: 400 });
    }

    const combinedPrompt = buildBatchPrompt(scenes);
    const raw = await glmCode(combinedPrompt);

    // 각 씬 코드를 딜리미터로 분리 파싱
    const codes: Record<number, string> = {};
    for (const { idx } of scenes) {
      const regex = new RegExp(
        `===\\s*SCENE_${idx}\\s*START\\s*===\\s*\\n([\\s\\S]*?)\\n?===\\s*SCENE_${idx}\\s*END\\s*===`
      );
      const match = raw.match(regex);
      if (match) {
        const code = match[1]
          .replace(/```(?:tsx|typescript|ts)?\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        codes[idx] = code;
      } else {
        console.warn(`[/api/ai-code] Scene ${idx} not found in response`);
      }
    }

    return NextResponse.json({ codes });
  } catch (err) {
    console.error('[/api/ai-code]', err);
    return NextResponse.json({ error: 'Failed to generate scene code' }, { status: 500 });
  }
}

function buildBatchPrompt(scenes: SceneInput[]): string {
  const sceneList = scenes
    .map(s => `씬 인덱스 ${s.idx}:\n${s.prompt}`)
    .join('\n\n---\n\n');

  return `당신은 Remotion(React 기반 영상 프레임워크) 전문 개발자입니다.
아래 ${scenes.length}개의 씬 프롬프트를 보고, 각각의 Remotion 씬 컴포넌트를 작성하세요.

## 필수 규칙
1. 반드시 다음 import로 시작:
import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';

2. 컴포넌트 이름은 반드시 AiFreeScene으로 고정:
export const AiFreeScene: React.FC = () => { ... }

3. theme.ts 색상 토큰 반드시 사용:
- bg: #0E0E0E, text: #FDFFFF, primary: #00C896, accent: #FFCF00
- card: #1A1A1A, textMuted: #7A7978

4. AbsoluteFill을 루트 컨테이너로 사용
5. useCurrentFrame()으로 애니메이션 구현 (interpolate, spring 활용)
6. SVG로 아이콘/도형 직접 그릴 것 (외부 이미지/이모지 사용 금지)
7. 마크다운 코드블록(\`\`\`) 없이 코드만 출력

## 출력 형식 (반드시 준수, 각 씬을 아래 구분자로 감싸기):
=== SCENE_[인덱스] START ===
[tsx 코드]
=== SCENE_[인덱스] END ===

## 씬 목록:
${sceneList}`;
}
