import { NextRequest } from 'next/server';
import { glmChat, glmCode } from '@/lib/glm';
import { SCENES_PROMPT, VISUAL_PROMPT, AI_FREE_PROMPT } from '@/lib/prompts';
import type { Scene } from '../../../remotion/src/types';
import { extractContentBlocks, formatContentBlocks, shouldInjectContentBlocks } from '@/lib/timing-utils';
import fs from 'fs';
import path from 'path';

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

/**
 * Whisper의 word-level 타이밍을 원본 나레이션 텍스트에 매핑.
 * Whisper가 인식한 텍스트(오타 가능) 대신 원본 나레이션 단어를 사용.
 */
function mapNarrationToTimings(
  narration: string,
  whisperWords: { word: string; start: number; end: number }[],
): { word: string; start: number; end: number }[] {
  const narrationWords = narration.trim().split(/\s+/);
  if (!narrationWords.length || !whisperWords.length) return [];

  // 단어 수가 같으면 1:1 매핑 (Whisper 타이밍 + 원본 텍스트)
  if (narrationWords.length === whisperWords.length) {
    return narrationWords.map((word, i) => ({
      word,
      start: whisperWords[i].start,
      end: whisperWords[i].end,
    }));
  }

  // 단어 수 불일치: 글자 비율 기반 매핑 (Whisper 타이밍 보존)
  // 각 나레이션 단어의 글자 위치 비율에 가장 가까운 Whisper 단어의 타이밍 사용
  const totalNarChars = narrationWords.reduce((sum, w) => sum + w.length, 0);
  const totalWhisperChars = whisperWords.reduce((sum, w) => sum + w.word.length, 0);

  // Whisper 단어별 글자 중심 비율 사전 계산
  const whisperMidRatios: number[] = [];
  let wCharAcc = 0;
  for (const w of whisperWords) {
    whisperMidRatios.push((wCharAcc + w.word.length / 2) / totalWhisperChars);
    wCharAcc += w.word.length;
  }

  const result: { word: string; start: number; end: number }[] = [];
  let nCharAcc = 0;

  for (const nWord of narrationWords) {
    const narMidRatio = (nCharAcc + nWord.length / 2) / totalNarChars;

    // 글자 비율이 가장 가까운 Whisper 단어 탐색
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < whisperWords.length; i++) {
      const dist = Math.abs(whisperMidRatios[i] - narMidRatio);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    result.push({
      word: nWord,
      start: whisperWords[bestIdx].start,
      end: whisperWords[bestIdx].end,
    });

    nCharAcc += nWord.length;
  }

  // 단조 증가 보장: 이전 단어보다 start가 빠르면 보정
  for (let i = 1; i < result.length; i++) {
    if (result[i].start < result[i - 1].start) {
      result[i].start = result[i - 1].start;
    }
    if (result[i].end < result[i].start) {
      result[i].end = result[i].start;
    }
  }

  return result;
}

// Next.js route segment config: 최대 실행 시간 확장 (TTS + 렌더 포함)
export const maxDuration = 3600; // 60분 — ai_free 15개+ Thinking Mode 대응

async function post(path: string, body: object, timeoutMs = 30_000, maxRetries = 1) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`${path} failed (${res.status}): ${err}`);
      }
      return res.json();
    } catch (err) {
      clearTimeout(timer);
      const isFetchError = err instanceof TypeError && String(err).includes('fetch failed');
      if (isFetchError && attempt < maxRetries) {
        console.warn(`[pipeline] ${path} fetch failed, 재시도 ${attempt}/${maxRetries}...`);
        await new Promise((r) => setTimeout(r, 2000)); // 2초 대기 후 재시도
        continue;
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}

export async function POST(req: NextRequest) {
  const {
    topic,
    script: preApprovedScript,
    useTTS = true,
    stopAfterScenes = false,  // true: 씬 생성 후 중단
    stopAfterVisual = false,  // true: 비주얼 프롬프트 생성 후 중단
    stopAfterTTS = false,     // true: TTS 생성 후 중단
    stopAfterCodeGen = false, // true: 코드 생성 후 중단
    skipToRender = false,     // true: scenes 배열을 외부에서 받아 바로 렌더
    skipVisual = false,       // true: 비주얼 프롬프트 생성 건너뛰기 (TTS만 먼저 실행 시 사용)
    scenes: externalScenes,   // skipToRender 시 사용할 씬 데이터
    jobId: externalJobId,     // skipToRender 시 기존 jobId
    previewOnly = false,      // true: 렌더링 건너뛰고 미리보기 모드
  } = await req.json();
  const jobId = externalJobId ?? `job-${Date.now()}`;
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(ctrl) {
      const emit = (data: object) => {
        try { ctrl.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`)); } catch { /* client disconnected */ }
      };

      try {
        // Step 1: 대본 — 이미 승인된 대본이 있으면 사용, 없으면 생성
        let script: string;
        if (preApprovedScript) {
          script = preApprovedScript;
          emit({ step: 'script', status: 'done' });
        } else {
          emit({ step: 'script', status: 'loading' });
          const res = await post('/api/script', { topic }, 600_000);  // 10분
          script = res.script;
          emit({ step: 'script', status: 'done' });
        }


        // Step 2: 씬 데이터 준비
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let scenes: any[];
        if (skipToRender && externalScenes) {
          scenes = externalScenes;
          emit({ step: 'scenes', status: 'done', count: scenes.length });
        } else {
          emit({ step: 'scenes', status: 'loading' });

          // 1단계: 의미 단위 분할 (lightweight)
          let rawScenes: { narration: string; keyword: string }[];
          const MAX_SCENE_RETRIES = 2;
          let sceneLastError = '';
          for (let attempt = 0; attempt <= MAX_SCENE_RETRIES; attempt++) {
            if (attempt > 0) console.log(`[pipeline/scenes] 재시도 ${attempt}/${MAX_SCENE_RETRIES}...`);
            try {
              const raw = await glmChat(SCENES_PROMPT + script, undefined, 0.6);
              const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
              const parsed = JSON.parse(jsonStr) as { scenes: { narration: string; keyword: string }[] };
              if (!Array.isArray(parsed.scenes)) throw new Error('scenes 배열 없음');
              rawScenes = parsed.scenes;
              break;
            } catch (err) {
              sceneLastError = String(err).slice(0, 200);
              console.error(`[pipeline/scenes] 실패: ${sceneLastError}`);
              if (attempt === MAX_SCENE_RETRIES) throw new Error(`씬 분석 실패: ${sceneLastError}`);
            }
          }

          // 2단계: 모든 씬을 ai_free 타입으로 변환
          scenes = rawScenes!.map((s) => ({
            type: 'ai_free' as const,
            durationInFrames: 120,
            narration: s.narration,
            keyword: s.keyword,
            prompt: '',        // 코드 생성 시 narration 기반으로 자동 생성
            generatedCode: '',
          }));

          console.log(`[pipeline/scenes] ✅ ${scenes.length}개 씬 분할 완료`);
          emit({ step: 'scenes', status: 'done', count: scenes.length, scenes, jobId });

          if (stopAfterScenes) {
            await new Promise(r => setTimeout(r, 100)); // flush 대기
            ctrl.close();
            return;
          }
        }

        // Step 3: TTS 생성 (비주얼 프롬프트보다 먼저 — words[] 확보)
        if (useTTS) {
          const narrationScenes = scenes
            .map((s: { narration?: string }, idx: number) => ({ idx, narration: s.narration }))
            .filter(({ narration }: { narration?: string }) => narration?.trim());

          if (narrationScenes.length > 0) {
            emit({ step: 'tts', status: 'loading', total: narrationScenes.length });
            let successCount = 0;
            let failCount = 0;
            let subtitleCount = 0;

            for (const { idx, narration } of narrationScenes) {
              // TTS와 Whisper에는 / 구분자를 제거한 순수 텍스트 사용
              const cleanNarration = narration?.replace(/\s*\/\s*/g, ' ').replace(/\s+/g, ' ').trim();
              try {
                const ttsJobId = `${jobId}-scene-${idx}`;
                const { audioSrc: src, duration } = await post('/api/tts', {
                  text: cleanNarration,
                  jobId: ttsJobId,
                }, 120_000);

                scenes[idx].audioSrc = src;

                if (duration && duration > 0) {
                  scenes[idx].durationInFrames = Math.max(60, Math.round(duration * 30));
                } else {
                  const estimatedSec = (cleanNarration?.length ?? 30) / 5.5;
                  scenes[idx].durationInFrames = Math.max(60, Math.round(estimatedSec * 30));
                }

                // Whisper STT
                try {
                  const whisperRes = await post('/api/whisper', { audioPath: src }, 120_000);
                  if (whisperRes.words?.length > 0 && cleanNarration) {
                    scenes[idx].words = mapNarrationToTimings(cleanNarration, whisperRes.words);
                    subtitleCount++;
                  }
                } catch (whisperErr) {
                  console.warn(`[pipeline/whisper] scene ${idx} failed:`, whisperErr);
                }

                successCount++;
                emit({ step: 'tts', status: 'loading', progress: `${successCount + failCount}/${narrationScenes.length}` });
              } catch (ttsErr) {
                console.error(`[pipeline/tts] scene ${idx} failed:`, ttsErr);
                failCount++;
                const estimatedSec = (narration?.length ?? 30) / 5.5;
                scenes[idx].durationInFrames = Math.max(60, Math.round(estimatedSec * 30));
              }
            }

            if (successCount > 0) {
              emit({ step: 'tts', status: 'done', successCount, failCount, subtitleCount, total: narrationScenes.length, scenes, jobId });
            } else {
              emit({ step: 'tts', status: 'skipped', reason: `All ${failCount} TTS calls failed` });
            }
          } else {
            emit({ step: 'tts', status: 'skipped', reason: 'No narration text in scenes' });
          }
        } else {
          // TTS 미사용: 텍스트 기반 durationInFrames 추정
          for (const scene of scenes) {
            if (scene.narration?.trim() && scene.durationInFrames === 120) {
              const estimatedSec = scene.narration.length / 5.5;
              scene.durationInFrames = Math.max(60, Math.round(estimatedSec * 30));
            }
          }
          emit({ step: 'tts', status: 'done', successCount: 0, failCount: 0, subtitleCount: 0, total: 0, scenes, jobId });
        }

        if (stopAfterTTS) {
          await new Promise(r => setTimeout(r, 100)); // flush 대기
          ctrl.close();
          return;
        }

        // Step 4: 비주얼 프롬프트 생성 (TTS 이후 — words[] 콘텐츠 블록 활용)
        const aiFreeScenes = scenes
          .map((scene: { type: string; narration?: string; keyword?: string; prompt?: string }, idx: number) => ({ scene, idx }))
          .filter(({ scene }: { scene: { type: string } }) => scene.type === 'ai_free');

        const needsVisual = aiFreeScenes.filter(({ scene }: { scene: { prompt?: string } }) => !scene.prompt);

        if (!skipVisual && needsVisual.length > 0) {
          emit({ step: 'visual-prompt', status: 'loading' });

          console.log(`[pipeline/visual] ${needsVisual.length}개 씬 비주얼 프롬프트 생성 (1개씩 순차, 모델: gpt-5.4-mini)...`);
          let totalGenerated = 0;

          for (let i = 0; i < needsVisual.length; i++) {
            const { scene, idx } = needsVisual[i] as { scene: { narration?: string; keyword?: string; words?: { word: string; start: number; end: number }[]; prompt?: string; durationInFrames?: number }, idx: number };

            // 씬 1개에 대한 입력 구성
            const visualFrames = !useTTS && scene.narration?.trim() && scene.durationInFrames === 120
              ? Math.max(60, Math.round((scene.narration.length / 5.5) * 30))
              : (scene.durationInFrames ?? 120);
            const visualSec = (visualFrames / 30).toFixed(1);
            let sceneText = `씬 ${idx + 1} [${scene.keyword ?? ''}]: "${scene.narration ?? ''}"\n씬 길이: ${visualSec}초 (${visualFrames}프레임)`;
            if (scene.words && scene.words.length > 0) {
              const blocks = extractContentBlocks(scene.words);
              if (shouldInjectContentBlocks(blocks, visualFrames)) {
                sceneText += `\n콘텐츠 블록 타이밍:\n${formatContentBlocks(blocks)}`;
                console.log(`[pipeline/visual] 씬 ${idx + 1}: ${blocks.length}개 콘텐츠 블록 추출`);
              }
            }

            emit({ step: 'visual-prompt', status: 'loading', progress: `${totalGenerated}/${needsVisual.length}개 완료 (씬 ${idx + 1} 처리 중)` });

            // 최대 2회 시도 (실패 시 1회 재시도)
            for (let attempt = 0; attempt < 2; attempt++) {
              try {
                const visualRaw = await glmChat(VISUAL_PROMPT + sceneText, 'gpt-5.4-mini', 1.0);
                const cleaned = visualRaw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                const parsed = JSON.parse(cleaned);
                const scenePlan = parsed?.scenePlan ? parsed : null;

                if (scenePlan) {
                  scene.prompt = JSON.stringify(scenePlan);
                  totalGenerated++;
                  console.log(`[pipeline/visual] ✅ 씬 ${idx + 1}: ${scenePlan.scenePlan.layoutFamily}/${scenePlan.scenePlan.revealStrategy}`);
                  break; // 성공 → 다음 씬으로
                } else {
                  console.warn(`[pipeline/visual] ⚠️ 씬 ${idx + 1}: scenePlan 비어있음 (시도 ${attempt + 1}/2)`);
                }
              } catch (e) {
                console.warn(`[pipeline/visual] ⚠️ 씬 ${idx + 1}: 파싱 실패 (시도 ${attempt + 1}/2)`);
              }
            }
          }

          console.log(`[pipeline/visual] ✅ 총 ${totalGenerated}/${needsVisual.length}개 비주얼 프롬프트 생성 완료`);
          emit({ step: 'visual-prompt', status: 'done', scenes, jobId });
        }

        if (stopAfterVisual) {
          await new Promise(r => setTimeout(r, 100)); // flush 대기
          ctrl.close();
          return;
        }

        // TTS 미사용 시 텍스트 기반 durationInFrames 추정
        if (!useTTS) {
          for (const scene of scenes) {
            if (scene.narration?.trim() && scene.durationInFrames === 120) {
              const estimatedSec = scene.narration.length / 5.5;
              scene.durationInFrames = Math.max(60, Math.round(estimatedSec * 30));
            }
          }
        }

        // Step 5: 코드 생성 (TTS 후 — 정확한 프레임 수 전달)
        if (aiFreeScenes.length > 0) {
          emit({ step: 'ai-code', status: 'loading' });

          // 로고 폴더 스캔 → 가용 로고 목록을 프롬프트에 주입
          let availableLogos: string[] = [];
          try {
            const logoDir = path.join(process.cwd(), 'remotion/public/logos');
            if (fs.existsSync(logoDir)) {
              availableLogos = fs.readdirSync(logoDir)
                .filter(f => /\.(svg|png|jpg|webp)$/i.test(f))
                .filter(f => !f.startsWith('_')); // 플레이스홀더 제외
            }
          } catch { /* 로고 폴더 없으면 빈 배열 */ }
          const logoList = availableLogos.length > 0
            ? availableLogos.join(', ')
            : '(아직 없음 — 모든 브랜드에 _placeholder.png 사용)';
          const designGuide = AI_FREE_PROMPT
            .replace('[AVAILABLE_LOGOS]', logoList)
            .replace(/## 씬 프롬프트:\s*$/, '').trim();

          // prompt-rules는 이제 AI_FREE_PROMPT에 통합됨 (별도 파일 주입 불필요)
          const BATCH_SIZE = 3;
          const CONCURRENCY = 1;
          const COOLDOWN_MS = 15_000; // 병렬 라운드 간 15초 쿨다운

          // 배치 목록 생성
          const batches: typeof aiFreeScenes[] = [];
          for (let i = 0; i < aiFreeScenes.length; i += BATCH_SIZE) {
            batches.push(aiFreeScenes.slice(i, i + BATCH_SIZE));
          }
          const totalBatches = batches.length;

          /** 단일 배치 처리 */
          const processBatch = async (batch: typeof aiFreeScenes, batchNum: number) => {
            console.log(`[pipeline/ai-code] 배치 ${batchNum}/${totalBatches} (${batch.length}개 씬)`);

            const sceneList = batch
              .map(({ scene, idx }: { scene: { narration?: string; keyword?: string; prompt?: string; durationInFrames?: number; words?: { word: string; start: number; end: number }[] }, idx: number }) => {
                const prompt = scene.prompt || `${scene.keyword}: ${scene.narration}`;
                const frames = scenes[idx].durationInFrames ?? 120;
                const sec = (frames / 30).toFixed(1);
                const narration = scene.narration ? `\n나레이션: "${scene.narration}"` : '';

                // 콘텐츠 블록 타이밍 주입
                let blockSection = '';
                const sceneWords = scenes[idx].words ?? scene.words;
                if (sceneWords && sceneWords.length > 0) {
                  const blocks = extractContentBlocks(sceneWords);
                  if (shouldInjectContentBlocks(blocks, frames)) {
                    blockSection = '\n콘텐츠 블록 타이밍:\n' + formatContentBlocks(blocks);
                  }
                }

                const visualSection = prompt.trim().startsWith('{')
                  ? `\nscenePlan JSON:\n${prompt}`
                  : `\n비주얼: ${prompt}`;

                return `씬 인덱스 ${idx} (${frames}프레임, ${sec}초):${narration}${blockSection}${visualSection}`;
              })
              .join('\n\n---\n\n');

            const batchPrompt = `${designGuide}\n\n## 배치 출력 규칙\n아래 ${batch.length}개의 씬 입력을 보고, 각각 독립적인 Remotion 씬 컴포넌트를 작성하세요.\n- scenePlan JSON이 있으면 layoutFamily, revealStrategy, timingPlan, elements, constraints를 **그대로 구현**하세요.\n- scenePlan JSON이 있으면 새 레이아웃을 다시 발명하지 마세요.\n- scenePlan JSON이 없고 구형 비주얼 텍스트만 있으면 보수적으로 해석하세요.\n- 마크다운 코드블록(\`\`\`) 없이 코드만 출력\n- **씬의 프레임 수와 초가 명시되어 있으므로, 모든 애니메이션은 해당 시간 안에 완료되어야 합니다.**\n\n## 출력 형식 (반드시 준수, 각 씬을 아래 구분자로 감싸기):\n=== SCENE_[인덱스] START ===\n[tsx 코드]\n=== SCENE_[인덱스] END ===\n\n## 씬 목록:\n${sceneList}`;

            const codeStart = Date.now();
            const raw = await glmCode(batchPrompt, 0.7, 1.0);
            const codeSec = ((Date.now() - codeStart) / 1000).toFixed(1);
            console.log(`[pipeline/ai-code] ⏱ 배치 ${batchNum} glmCode 소요: ${codeSec}초`);

            for (const { scene, idx } of batch) {
              const regex = new RegExp(
                `===\\s*SCENE_${idx}\\s*START\\s*===\\s*\\n([\\s\\S]*?)\\n?===\\s*SCENE_${idx}\\s*END\\s*===`
              );
              const match = raw.match(regex);
              if (match) {
                const code = match[1]
                  .replace(/```(?:tsx|typescript|ts)?\n?/g, '')
                  .replace(/```\n?/g, '')
                  .trim();
                (scene as { generatedCode?: string }).generatedCode = code;
              } else if (batch.length === 1) {
                console.warn(`[pipeline/ai-code] Scene ${idx} 정규식 실패 → raw 폴백 사용`);
                const code = raw
                  .replace(/===\s*SCENE_\d+\s*(?:START|END)\s*===/g, '')
                  .replace(/```(?:tsx|typescript|ts)?\n?/g, '')
                  .replace(/```\n?/g, '')
                  .trim();
                (scene as { generatedCode?: string }).generatedCode = code;
              } else {
                console.warn(`[pipeline/ai-code] Scene ${idx} not found in batch ${batchNum}`);
              }
            }

            console.log(`[pipeline/ai-code] ✅ 배치 ${batchNum}/${totalBatches} 완료`);
            emit({ step: 'ai-code-batch', status: 'done', batch: batchNum, total: totalBatches, elapsed: codeSec, sceneIdx: batch[0].idx });
          };

          // 병렬 라운드 실행 (CONCURRENCY개씩)
          for (let roundStart = 0; roundStart < batches.length; roundStart += CONCURRENCY) {
            const round = batches.slice(roundStart, roundStart + CONCURRENCY);
            const roundNum = Math.floor(roundStart / CONCURRENCY) + 1;

            if (round.length > 1) {
              console.log(`[pipeline/ai-code] 🔀 라운드 ${roundNum}: ${round.length}개 배치 병렬 실행`);
            }

            await Promise.all(
              round.map((batch, i) => processBatch(batch, roundStart + i + 1))
            );

            // 다음 라운드 전 쿨다운 (마지막 라운드 제외)
            if (roundStart + CONCURRENCY < batches.length) {
              console.log(`[pipeline/ai-code] ⏸ ${COOLDOWN_MS / 1000}초 쿨다운...`);
              await new Promise(r => setTimeout(r, COOLDOWN_MS));
            }
          }

          emit({ step: 'ai-code', status: 'done', scenes, jobId });
        }

        if (stopAfterCodeGen) {
          ctrl.close();
          return;
        }

        // Step 6: GIF URL 검색
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
              } catch { /* GIF 실패 무시 */ }
            }
          }
          emit({ step: 'gif', status: 'done', count: gifCount });
        }

        // Step 7: Remotion 렌더 (또는 미리보기)
        emit({ step: 'render', status: 'loading' });
        const renderResult = await post('/api/render', {
          jobId,
          scenes,
          previewOnly,
        }, 600_000);

        if (previewOnly) {
          emit({
            step: 'render',
            status: 'preview-ready',
            jobId,
            scenes,
            previewUrl: renderResult.previewUrl,
          });
        } else {
          emit({ step: 'render', status: 'done', outputPath: renderResult.outputPath, jobId });
        }
      } catch (err) {
        emit({ step: 'error', status: 'failed', message: String(err) });
      } finally {
        try { ctrl.close(); } catch { /* already closed */ }
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
