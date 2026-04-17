import { NextRequest, NextResponse } from 'next/server';

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

export async function POST(req: NextRequest) {
  try {
    const { originalJobId, scenes } = (await req.json()) as {
      originalJobId: string;
      scenes: object[];
    };

    if (!originalJobId || !scenes?.length) {
      return NextResponse.json(
        { error: 'originalJobId and scenes are required' },
        { status: 400 },
      );
    }

    // 새 jobId로 재렌더 (덮어쓰기 방지)
    const newJobId = `re-${originalJobId}-${Date.now()}`;

    // scenes 배열에 audioSrc, words 필드가 이미 포함되어 있으므로 별도 처리 불필요
    const renderRes = await fetch(`${BASE}/api/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: newJobId,
        scenes,
      }),
    });

    if (!renderRes.ok) {
      const err = await renderRes.text();
      throw new Error(`Render failed: ${err}`);
    }

    const { outputPath } = await renderRes.json();
    return NextResponse.json({ outputPath, jobId: newJobId });
  } catch (err) {
    console.error('[/api/re-render]', err);
    return NextResponse.json(
      { error: 'Re-render failed', detail: String(err) },
      { status: 500 },
    );
  }
}
