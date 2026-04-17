import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 600; // 10분
import { glmChat } from '@/lib/glm';
import { SCENES_PROMPT } from '@/lib/prompts';
import type { Scene } from '../../../remotion/src/types';

export async function POST(req: NextRequest) {
  try {
    const { script } = await req.json();
    if (!script?.trim()) {
      return NextResponse.json({ error: 'script is required' }, { status: 400 });
    }

    const MAX_RETRIES = 2;
    let lastError = '';

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        console.log(`[/api/scenes] 재시도 ${attempt}/${MAX_RETRIES}...`);
      }

      // 1) GLM 호출
      let raw: string;
      try {
        raw = await glmChat(SCENES_PROMPT + script, undefined, 0.6);
      } catch (glmErr) {
        lastError = `GLM API 호출 실패: ${String(glmErr).slice(0, 200)}`;
        console.error(`[/api/scenes] ${lastError}`);
        continue;  // 재시도
      }

      // 2) 마크다운 코드블록 제거
      const jsonStr = raw
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // 3) JSON 파싱
      let parsed: { scenes: Scene[] };
      try {
        parsed = JSON.parse(jsonStr) as { scenes: Scene[] };
      } catch (parseErr) {
        lastError = `씬 JSON 파싱 실패 (응답 ${raw.length}자 중 잘림 가능)`;
        console.error(`[/api/scenes] ${lastError}:`, parseErr);
        console.error('[/api/scenes] GLM 원본 응답 (마지막 200자):', raw.slice(-200));
        continue;  // 재시도
      }

      // 4) 구조 검증
      if (!Array.isArray(parsed.scenes)) {
        lastError = `씬 구조 오류 — scenes 배열이 없습니다 (keys: ${Object.keys(parsed).join(', ')})`;
        console.error(`[/api/scenes] ${lastError}`);
        continue;  // 재시도
      }

      // 성공
      if (attempt > 0) {
        console.log(`[/api/scenes] ✅ 재시도 ${attempt}회 만에 성공 (${parsed.scenes.length}개 씬)`);
      }
      return NextResponse.json(parsed);
    }

    // 모든 재시도 실패
    return NextResponse.json(
      { error: `씬 분석 실패 (${MAX_RETRIES + 1}회 시도): ${lastError}` },
      { status: 502 },
    );
  } catch (err) {
    console.error('[/api/scenes] 예상치 못한 에러:', err);
    return NextResponse.json({ error: `씬 분석 실패: ${String(err).slice(0, 200)}` }, { status: 500 });
  }
}
