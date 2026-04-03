import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { text, jobId } = await req.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    const ttsUrl = process.env.QWEN_TTS_URL ?? 'http://localhost:7860';

    // Qwen3 TTS Gradio API 호출
    const ttsRes = await fetch(`${ttsUrl}/api/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [text, null, 1.0] }),
    });

    if (!ttsRes.ok) {
      throw new Error(`TTS server error: ${ttsRes.status}`);
    }

    const ttsData = await ttsRes.json();
    const audioBase64: string = ttsData.data[0].data.split(',')[1];
    const audioBuffer = Buffer.from(audioBase64, 'base64');

    // remotion/public/audio/ 에 저장
    const outputDir = path.join(process.cwd(), 'remotion', 'public', 'audio');
    await mkdir(outputDir, { recursive: true });

    const filename = `audio-${jobId ?? Date.now()}.wav`;
    const filePath = path.join(outputDir, filename);
    await writeFile(filePath, audioBuffer);

    return NextResponse.json({
      audioSrc: `audio/${filename}`,
      filePath,
    });
  } catch (err) {
    console.error('[/api/tts]', err);
    return NextResponse.json({ error: 'TTS failed', detail: String(err) }, { status: 500 });
  }
}
