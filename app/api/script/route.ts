import { NextRequest, NextResponse } from 'next/server';
import { glmChat } from '@/lib/glm';
import { SCRIPT_PROMPT } from '@/lib/prompts';

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();
    if (!topic?.trim()) {
      return NextResponse.json({ error: 'topic is required' }, { status: 400 });
    }

    const script = await glmChat(SCRIPT_PROMPT + topic);

    return NextResponse.json({ script });
  } catch (err) {
    console.error('[/api/script]', err);
    return NextResponse.json({ error: 'Failed to generate script' }, { status: 500 });
  }
}
