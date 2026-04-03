import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { audioPath } = await req.json();
    if (!audioPath) {
      return NextResponse.json({ error: 'audioPath is required' }, { status: 400 });
    }

    // audioPath: "audio/audio-job-xxx.wav" (remotion/public/ 기준 상대경로)
    const fullPath = path.join(process.cwd(), 'remotion', 'public', audioPath);
    const audioBuffer = await readFile(fullPath);

    // Groq Whisper API 호출 (word-level 타임스탬프 포함)
    const transcription = await groq.audio.transcriptions.create({
      file: new File([audioBuffer], 'audio.wav', { type: 'audio/wav' }),
      model: 'whisper-large-v3-turbo', // 무료, 빠름
      language: 'ko',
      response_format: 'verbose_json',  // word-level 타임스탬프 포함
      timestamp_granularities: ['word'],
    });

    // words 배열 정규화
    const words = (transcription.words ?? []).map((w) => ({
      word: w.word.trim(),
      start: Math.round(w.start * 1000) / 1000,
      end: Math.round(w.end * 1000) / 1000,
    }));

    return NextResponse.json({
      language: transcription.language,
      duration: transcription.duration,
      words,
    });
  } catch (err) {
    console.error('[/api/whisper]', err);
    return NextResponse.json({ error: 'Whisper failed', detail: String(err) }, { status: 500 });
  }
}
