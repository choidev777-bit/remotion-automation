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
  const {
    topic,
    script: preApprovedScript,
    useTTS = true,
    stopAfterScenes = false,  // true: 씨 생성 후 중단 (미디어 삽입 대기)
    skipToRender = false,     // true: scenes 배열을 외부에서 받아 바로 렌더
    scenes: externalScenes,   // skipToRender 시 사용할 씩 데이터
    jobId: externalJobId,     // skipToRender 시 기존 jobId
  } = await req.json();
  const jobId = externalJobId ?? `job-${Date.now()}`;
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


        // Step 2-4: 씬 관련 로직 (외부 씬 데이터가 없을 때만)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let scenes: any[];
        if (skipToRender && externalScenes) {
          // 외부에서 무언가 받은 씩 (미디어 삽입 후)
          scenes = externalScenes;
          emit({ step: 'scenes', status: 'done', count: scenes.length });
        } else {
          // Step 2: 씩 분석
          emit({ step: 'scenes', status: 'loading' });
          const { scenes: generatedScenes } = await post('/api/scenes', { script });
          scenes = generatedScenes;
          emit({ step: 'scenes', status: 'done', count: scenes.length, scenes, jobId });

          // stopAfterScenes: 쐩 생성 후 정지 (미디어 삽입 단계 대기)
          if (stopAfterScenes) {
            ctrl.close();
            return;
          }

          // Step 3: ai_free 쐩 코드 생성
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
              if ((scene as { type: string; keyword?: string }).type === 'gif_insert') {
                try {
                  const s = scene as { type: string; keyword: string; gifUrl?: string };
                  const r = await fetch(
                    `${BASE}/api/gif?keyword=${encodeURIComponent(s.keyword)}`
                  );
                  if (r.ok) {
                    const { gifUrl } = await r.json();
                    s.gifUrl = gifUrl;
                  }
                } catch {
                  // GIF 검색 실패 시 스킵
                }
              }
            }
            emit({ step: 'gif', status: 'done' });
          }
        }

        // Step 5: 메인 TTS 음성 생성 (선택)
        let audioSrc = '';
        let whisperWords: { word: string; start: number; end: number }[] = [];
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

        // Step 5.1: user_media narration 별도 TTS 생성
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userMediaIndices: number[] = [];
        for (let i = 0; i < scenes.length; i++) {
          const s = scenes[i] as { type: string; narration?: string; narrationAudioSrc?: string };
          if (s.type === 'user_media') {
            userMediaIndices.push(i);
            if (s.narration?.trim()) {
              emit({ step: 'tts-narration', status: 'loading', sceneIndex: i });
              try {
                const narrationJobId = `${jobId}-narration-${i}`;
                const { audioSrc: narSrc } = await post('/api/tts', {
                  text: s.narration,
                  jobId: narrationJobId,
                });
                s.narrationAudioSrc = narSrc;

                // narration 오디오 길이 측정 (Whisper duration 활용)
                try {
                  const { duration } = await post('/api/whisper', { audioPath: narSrc });
                  scenes[i].durationInFrames = Math.max(60, Math.round(duration * 30));
                } catch {
                  // Whisper 실패 시 텍스트 기반 예상 시간
                  scenes[i].durationInFrames = Math.max(60, Math.round((s.narration.length / 5.5) * 30));
                }

                emit({ step: 'tts-narration', status: 'done', sceneIndex: i, narrationAudioSrc: narSrc });
              } catch {
                emit({ step: 'tts-narration', status: 'skipped', sceneIndex: i, reason: 'TTS failed' });
                // TTS 실패 시 무음 유지 (기존 duration 그대로)
              }
            }
            // narration 없는 user_media는 기존 durationInFrames 유지 (무음)
          }
        }

        // Step 5.5: 메인 Whisper STT (word-level 타임스탬프 추출)
        if (audioSrc) {
          emit({ step: 'whisper', status: 'loading' });
          try {
            const { words, duration } = await post('/api/whisper', { audioPath: audioSrc });
            whisperWords = words;
            emit({ step: 'whisper', status: 'done', wordCount: words.length, duration });

            // Step 5.6: scene-grouper — user_media 씬은 건너뛰고 나머지에만 오디오 배분
            if (words.length > 0 && scenes.length > 0) {
              const { assignTimings } = await import('../../../lib/scene-grouper');
              const timings = assignTimings(words, scenes.length, userMediaIndices);
              for (const t of timings) {
                if (scenes[t.sceneIndex]) {
                  scenes[t.sceneIndex].durationInFrames = t.durationInFrames;
                }
              }
              emit({ step: 'sync', status: 'done', message: `${scenes.length - userMediaIndices.length}개 씬 오디오 싱크 완료 (user_media ${userMediaIndices.length}개 제외)` });
            }
          } catch (err) {
            emit({ step: 'whisper', status: 'skipped', reason: String(err) });
          }
        }

        // Step 6: Remotion 렌더
        emit({ step: 'render', status: 'loading' });
        const { outputPath } = await post('/api/render', {
          jobId,
          scenes,
          audioSrc,
          whisperWords,  // 자막용
        });
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
