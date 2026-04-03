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

    // Gemini가 마크다운 코드블록으로 감쌀 경우 제거
    const jsonStr = raw
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(jsonStr) as { scenes: Scene[] };

    if (!Array.isArray(parsed.scenes)) {
      throw new Error('Invalid response: scenes array missing');
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('[/api/scenes]', err);
    return NextResponse.json({ error: 'Failed to analyze scenes' }, { status: 500 });
  }
}
