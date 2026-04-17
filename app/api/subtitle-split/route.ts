import { NextRequest, NextResponse } from 'next/server';
import { glmChat } from '@/lib/glm';
import { SUBTITLE_SPLIT_PROMPT } from '@/lib/prompts';

export async function POST(req: NextRequest) {
  try {
    const { script } = await req.json();
    if (!script?.trim()) {
      return NextResponse.json({ error: '대본이 비어있습니다' }, { status: 400 });
    }

    const result = await glmChat(SUBTITLE_SPLIT_PROMPT + script, undefined, 0.3);

    // AI가 마크다운 코드블록으로 감쌌을 수 있으니 제거
    const cleaned = result
      .replace(/```[a-z]*\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    return NextResponse.json({ script: cleaned });
  } catch (err) {
    console.error('[subtitle-split] 에러:', err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 },
    );
  }
}
