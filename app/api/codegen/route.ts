import { NextRequest, NextResponse } from 'next/server';
import { glmCode } from '@/lib/glm';
import { AI_FREE_PROMPT } from '@/lib/prompts';
import { extractContentBlocks, formatContentBlocks, shouldInjectContentBlocks } from '@/lib/timing-utils';
import type { Scene } from '../../../remotion/src/types';
import fs from 'fs';
import path from 'path';

export const maxDuration = 600; // 10분

/**
 * 단일 배치의 ai_free 씬에 대한 코드 생성.
 * Body: { scenes: Scene[], sceneIndices: number[] }
 * Returns: { results: { idx: number, code: string | null, error?: string }[] }
 */
export async function POST(req: NextRequest) {
  const { scenes, sceneIndices } = await req.json() as {
    scenes: Scene[];
    sceneIndices: number[];
  };

  // 로고 폴더 스캔
  let availableLogos: string[] = [];
  try {
    const logoDir = path.join(process.cwd(), 'remotion/public/logos');
    if (fs.existsSync(logoDir)) {
      availableLogos = fs.readdirSync(logoDir)
        .filter(f => /\.(svg|png|jpg|webp)$/i.test(f))
        .filter(f => !f.startsWith('_'));
    }
  } catch { /* 빈 배열 */ }

  const logoList = availableLogos.length > 0
    ? availableLogos.join(', ')
    : '(아직 없음 — 모든 브랜드에 _placeholder.png 사용)';
  const designGuide = AI_FREE_PROMPT
    .replace('[AVAILABLE_LOGOS]', logoList)
    .replace(/## 씬 프롬프트:\s*$/, '').trim();

  // 배치 프롬프트 구성
  const batchScenes = sceneIndices.map(idx => ({ scene: scenes[idx], idx }));
  const sceneList = batchScenes
    .map(({ scene, idx }) => {
      const prompt = scene.prompt || `${(scene as { keyword?: string }).keyword}: ${scene.narration}`;
      const frames = scene.durationInFrames ?? 120;
      const sec = (frames / 30).toFixed(1);
      const narration = scene.narration ? `\n나레이션: "${scene.narration}"` : '';

      // words[]에서 콘텐츠 블록 추출
      let blockSection = '';
      const words = (scene as { words?: { word: string; start: number; end: number }[] }).words;
      if (words && words.length > 0) {
        const blocks = extractContentBlocks(words);
        if (shouldInjectContentBlocks(blocks, frames)) {
          blockSection = '\n콘텐츠 블록 타이밍:\n' + formatContentBlocks(blocks);
        }
      }

      const visualSection = prompt.trim().startsWith('{')
        ? `\nscenePlan JSON:\n${prompt}`
        : `\n비주얼: ${prompt}`;

      return `씬 인덱스 ${idx} (${frames}프레임, ${sec}초):${narration}${blockSection}${visualSection}`;
    })
    .join('\n\n---\n\n');

  const batchPrompt = `${designGuide}\n\n## 배치 출력 규칙\n아래 ${batchScenes.length}개의 씬 입력을 보고, 각각 독립적인 Remotion 씬 컴포넌트를 작성하세요.\n- scenePlan JSON이 있으면 layoutFamily, revealStrategy, timingPlan, elements, constraints를 **그대로 구현**하세요.\n- scenePlan JSON이 있으면 새 레이아웃을 다시 발명하지 마세요.\n- scenePlan JSON이 없고 구형 비주얼 텍스트만 있으면 보수적으로 해석하세요.\n- 마크다운 코드블록(\`\`\`) 없이 코드만 출력\n- **씬의 프레임 수와 초가 명시되어 있으므로, 모든 애니메이션은 해당 시간 안에 완료되어야 합니다.**\n\n## 출력 형식 (반드시 준수, 각 씬을 아래 구분자로 감싸기):\n=== SCENE_[인덱스] START ===\n[tsx 코드]\n=== SCENE_[인덱스] END ===\n\n## 씬 목록:\n${sceneList}`;

  try {
    console.log(`[codegen] 🚀 배치 시작 (씬 ${sceneIndices.join(',')}) — 모델: glm-4.7`);
    const start = Date.now();
    const raw = await glmCode(batchPrompt, 0.7, 1.0);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`[codegen] ⏱ 배치 (${sceneIndices.join(',')}) 소요: ${elapsed}초`);

    const results = batchScenes.map(({ idx }) => {
      const regex = new RegExp(
        `===\\s*SCENE_${idx}\\s*START\\s*===\\s*\\n([\\s\\S]*?)\\n?===\\s*SCENE_${idx}\\s*END\\s*===`
      );
      const match = raw.match(regex);
      if (match) {
        const code = match[1]
          .replace(/```(?:tsx|typescript|ts)?\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        return { idx, code };
      } else if (batchScenes.length === 1) {
        const code = raw
          .replace(/===\s*SCENE_\d+\s*(?:START|END)\s*===/g, '')
          .replace(/```(?:tsx|typescript|ts)?\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        return { idx, code };
      }
      return { idx, code: null, error: `씬 ${idx} 파싱 실패` };
    });

    return NextResponse.json({ results, elapsed });
  } catch (err) {
    console.error(`[codegen] 배치 실패:`, err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 },
    );
  }
}
