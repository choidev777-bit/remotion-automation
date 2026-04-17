import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { execa } from 'execa';

// 개별 TTS 타임아웃 10분
export const maxDuration = 600;

const SPEED = 1.2;
const LOUDNORM = 'loudnorm=I=-14:TP=-1:LRA=11';
const AUDIO_FILTER = `atempo=${SPEED},${LOUDNORM}`;

export async function POST(req: NextRequest) {
  try {
    const { text, jobId } = await req.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    // Fish Speech API 서버 (tools/api_server.py)
    const ttsUrl = process.env.FISH_TTS_URL ?? 'http://localhost:8080';

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 600_000); // 10분

    // Fish Speech v1.5 REST API: POST /v1/tts
    const ttsRes = await fetch(`${ttsUrl}/v1/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text,
        reference_id: 'my_voice',
        normalize: false,
        format: 'wav',
        streaming: false,
        chunk_length: 200,
        top_p: 0.7,
        repetition_penalty: 1.2,
        temperature: 0.7,
        seed: Math.floor(Math.random() * 2147483647),
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!ttsRes.ok) {
      const errBody = await ttsRes.text().catch(() => '');
      throw new Error(`Fish Speech API error: ${ttsRes.status} — ${errBody.slice(0, 200)}`);
    }

    const audioBuffer = Buffer.from(await ttsRes.arrayBuffer());

    // remotion/public/audio/ 에 저장
    const outputDir = path.join(process.cwd(), 'remotion', 'public', 'audio');
    await mkdir(outputDir, { recursive: true });

    const filename = `audio-${jobId ?? Date.now()}.wav`;
    const rawFilename = `raw-${filename}`;
    const rawPath = path.join(outputDir, rawFilename);
    const finalPath = path.join(outputDir, filename);

    // 1. raw 파일 저장
    await writeFile(rawPath, audioBuffer);

    // 2. ffmpeg 후처리: 1.2배속 + 볼륨 정규화
    try {
      await execa('ffmpeg', [
        '-y', '-i', rawPath,
        '-filter:a', AUDIO_FILTER,
        finalPath,
      ]);
      // raw 파일 삭제
      await unlink(rawPath).catch(() => {});
      console.log(`[tts] ✅ 후처리 완료: ${SPEED}x + loudnorm → ${filename}`);
    } catch (ffmpegErr) {
      // ffmpeg 실패 시 raw를 그대로 사용
      console.warn(`[tts] ⚠️ ffmpeg 후처리 실패, raw 사용:`, ffmpegErr);
      const { rename } = await import('fs/promises');
      await rename(rawPath, finalPath);
    }

    // WAV 헤더에서 duration 계산 (후처리된 파일 기준)
    const { readFile } = await import('fs/promises');
    const finalBuffer = await readFile(finalPath);
    let duration = 0;
    if (finalBuffer.length > 44) {
      const sampleRate = finalBuffer.readUInt32LE(24);
      const bitsPerSample = finalBuffer.readUInt16LE(34);
      const numChannels = finalBuffer.readUInt16LE(22);
      const dataSize = finalBuffer.length - 44;
      if (sampleRate > 0 && bitsPerSample > 0 && numChannels > 0) {
        duration = dataSize / (sampleRate * numChannels * (bitsPerSample / 8));
      }
    }

    return NextResponse.json({
      audioSrc: `audio/${filename}`,
      filePath: finalPath,
      duration,
    });
  } catch (err) {
    console.error('[/api/tts]', err);
    return NextResponse.json({ error: 'TTS failed', detail: String(err) }, { status: 500 });
  }
}
