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
    code = code
      .replace(/```(?:tsx|typescript|ts)?\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    if (!code.includes('AiFreeScene')) {
      throw new Error('Generated code missing AiFreeScene export');
    }

    return NextResponse.json({ code });
  } catch (err) {
    console.error('[/api/ai-code]', err);
    return NextResponse.json({ error: 'Failed to generate scene code' }, { status: 500 });
  }
}
