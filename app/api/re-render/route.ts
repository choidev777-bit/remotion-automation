import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

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

    // 기존 오디오 경로 재사용 (audio 또는 wav 확장자 모두 시도)
    const audioExtensions = ['wav', 'mp3'];
    let audioSrc = '';
    for (const ext of audioExtensions) {
      const candidate = `audio/audio-${originalJobId}.${ext}`;
      const fullPath = path.join(process.cwd(), 'remotion', 'public', candidate);
      try {
        await readFile(fullPath);
        audioSrc = candidate;
        break;
      } catch {
        // 해당 경로에 파일 없음 — 다음 시도
      }
    }

    // 기존 Whisper 단어 데이터 재사용
    let whisperWords: object[] = [];
    try {
      const wordsPath = path.join(
        process.cwd(),
        'remotion',
        'src',
        'generated',
        `words-${originalJobId}.json`,
      );
      const raw = await readFile(wordsPath, 'utf-8');
      whisperWords = JSON.parse(raw);
    } catch {
      // Whisper 데이터 없으면 자막 없이 진행
    }

    // 새 jobId로 재렌더 (덮어쓰기 방지)
    const newJobId = `re-${originalJobId}-${Date.now()}`;

    const renderRes = await fetch(`${BASE}/api/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: newJobId,
        scenes,
        audioSrc,
        whisperWords,
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
