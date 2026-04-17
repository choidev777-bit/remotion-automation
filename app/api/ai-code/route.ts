import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export const maxDuration = 1800; // 30분 — ai_free 15개+ Thinking Mode 대응
import { glmCode } from '@/lib/glm';
import { AI_FREE_PROMPT } from '@/lib/prompts';

interface SceneInput {
  idx: number;
  prompt: string;   // scenePlan JSON 또는 구형 비주얼 텍스트
  keyword?: string; // 핵심 주제 키워드
}

// 파이프라인에 필요한 Remotion 스킬 파일 목록
const SKILL_FILES = [
  'animations.md',     // 필수: useCurrentFrame, CSS 금지
  'timing.md',         // 필수: interpolate, spring, easing
  'gifs.md',           // 필수: AnimatedImage 사용법
  'text-animations.md', // 권장: 텍스트 효과
  'sequencing.md',     // 권장: 씬 순서/딜레이
  'fonts.md',          // 권장: 폰트 로딩
];

const SKILLS_DIR = path.join(
  process.cwd(),
  '.agent', 'skills', 'remotion', 'skills', 'skills', 'remotion', 'rules',
);

/** 스킬 파일들을 읽어서 하나의 텍스트로 합침 */
async function loadSkillRules(): Promise<string> {
  const parts: string[] = [];
  for (const file of SKILL_FILES) {
    try {
      const content = await readFile(path.join(SKILLS_DIR, file), 'utf-8');
      // YAML frontmatter 제거 (--- ... --- 블록)
      const cleaned = content.replace(/^---[\s\S]*?---\s*\n/, '').trim();
      parts.push(`### ${file.replace('.md', '')}\n${cleaned}`);
    } catch {
      console.warn(`[ai-code] Skill file not found: ${file}`);
    }
  }
  return parts.join('\n\n');
}

export async function POST(req: NextRequest) {
  try {
    const { scenes } = await req.json() as { scenes: SceneInput[] };
    if (!scenes?.length) {
      return NextResponse.json({ error: 'scenes is required' }, { status: 400 });
    }

    const combinedPrompt = await buildBatchPrompt(scenes);
    const raw = await glmCode(combinedPrompt, 0.7, 1.0);

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

async function buildBatchPrompt(scenes: SceneInput[]): Promise<string> {
  const sceneList = scenes
    .map((s) => {
      const visualSection = s.prompt.trim().startsWith('{')
        ? `scenePlan JSON:\n${s.prompt}`
        : `비주얼: ${s.prompt}`;

      return `씬 인덱스 ${s.idx} [주제: ${s.keyword ?? ''}]:\n${visualSection}`;
    })
    .join('\n\n---\n\n');

  // Remotion 스킬 규칙 로드
  const skillRules = await loadSkillRules();

  // AI_FREE_PROMPT에서 마지막 "## 씬 프롬프트:\n" 부분 제거 (배치 형식에서 별도 관리)
  const designGuide = AI_FREE_PROMPT.replace(/## 씬 프롬프트:\s*$/, '').trim();

  return `${designGuide}

## Remotion 베스트 프랙티스 (반드시 준수)
${skillRules}

## 배치 출력 규칙
아래 ${scenes.length}개의 씬 입력을 보고, 각각 독립적인 Remotion 씬 컴포넌트를 작성하세요.
- scenePlan JSON이 있으면 layoutFamily, revealStrategy, timingPlan, elements, constraints를 **그대로 구현**하세요.
- scenePlan JSON이 있으면 새 레이아웃을 다시 발명하지 마세요.
- scenePlan JSON이 없고 구형 비주얼 텍스트만 있으면 보수적으로 해석하세요.
- 마크다운 코드블록(\`\`\`) 없이 코드만 출력

## 출력 형식 (반드시 준수, 각 씬을 아래 구분자로 감싸기):
=== SCENE_[인덱스] START ===
[tsx 코드]
=== SCENE_[인덱스] END ===

## 씬 목록:
${sceneList}`;
}
