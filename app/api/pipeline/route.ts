import { NextRequest } from 'next/server';

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

async function post(path: string, body: object) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${path} failed (${res.status}): ${err}`);
  }
  return res.json();
}

export async function POST(req: NextRequest) {
  const { topic, script: preApprovedScript, useTTS = true } = await req.json();
  const jobId = `job-${Date.now()}`;
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(ctrl) {
      const emit = (data: object) =>
        ctrl.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        // Step 1: 대본 — 이미 승인된 대본이 있으면 사용, 없으면 생성
        let script: string;
        if (preApprovedScript) {
          script = preApprovedScript;
          emit({ step: 'script', status: 'done' });
        } else {
          emit({ step: 'script', status: 'loading' });
          const res = await post('/api/script', { topic });
          script = res.script;
          emit({ step: 'script', status: 'done' });
        }


        // Step 2: 씬 분석
        emit({ step: 'scenes', status: 'loading' });
        const { scenes } = await post('/api/scenes', { script });
        emit({ step: 'scenes', status: 'done', count: scenes.length });

        // Step 3: ai_free 씬 코드 생성 (배치 처리 → Gemini API 1회 호출)
        const aiFreeScenes = scenes
          .map((scene: { type: string; prompt?: string }, idx: number) => ({ scene, idx }))
          .filter(({ scene }: { scene: { type: string } }) => scene.type === 'ai_free');

        if (aiFreeScenes.length > 0) {
          emit({ step: 'ai-code', status: 'loading' });
          const { codes } = await post('/api/ai-code', {
            scenes: aiFreeScenes.map(({ scene, idx }: { scene: { prompt?: string }, idx: number }) => ({
              idx,
              prompt: scene.prompt ?? '',
            })),
          });
          for (const { scene, idx } of aiFreeScenes) {
            if (codes[idx]) {
              (scene as { generatedCode?: string }).generatedCode = codes[idx];
            }
          }
          emit({ step: 'ai-code', status: 'done' });
        }

        // Step 4: GIF URL 검색
        const gifCount = scenes.filter((s: { type: string }) => s.type === 'gif_insert').length;
        if (gifCount > 0) {
          emit({ step: 'gif', status: 'loading' });
          for (const scene of scenes) {
            if (scene.type === 'gif_insert') {
              try {
                const r = await fetch(
                  `${BASE}/api/gif?keyword=${encodeURIComponent(scene.keyword)}`
                );
                if (r.ok) {
                  const { gifUrl } = await r.json();
                  scene.gifUrl = gifUrl;
                }
              } catch {
                // GIF 검색 실패 시 해당 씬 스킵 (영상 생성은 계속)
              }
            }
          }
          emit({ step: 'gif', status: 'done' });
        }

        // Step 5: TTS 음성 생성 (선택)
        let audioSrc = '';
        if (useTTS) {
          emit({ step: 'tts', status: 'loading' });
          try {
            const { audioSrc: src } = await post('/api/tts', { text: script, jobId });
            audioSrc = src;
            emit({ step: 'tts', status: 'done', audioSrc });
          } catch {
            emit({ step: 'tts', status: 'skipped', reason: 'TTS server unavailable' });
          }
        }

        // Step 6: Remotion 렌더
        emit({ step: 'render', status: 'loading' });
        const { outputPath } = await post('/api/render', { jobId, scenes, audioSrc });
        emit({ step: 'render', status: 'done', outputPath, jobId });
      } catch (err) {
        emit({ step: 'error', status: 'failed', message: String(err) });
      } finally {
        ctrl.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
