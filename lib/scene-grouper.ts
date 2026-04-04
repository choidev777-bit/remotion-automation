export interface WhisperWord {
  word: string;
  start: number; // seconds
  end: number;
}

export interface SceneTiming {
  sceneIndex: number;
  durationInFrames: number;
  startTime: number;
  endTime: number;
  words: WhisperWord[];
}

const SENTENCE_ENDINGS = /[.!?。…]/;
const MIN_SCENE_SECONDS = 2;
const FPS = 30;

/**
 * Whisper words를 씬 개수에 맞게 균등 배분한다.
 * user_media 씬은 배분 대상에서 제외 (자체 오디오 또는 무음).
 *
 * @param skipIndices - 타이밍 배분에서 제외할 씬 인덱스 (user_media 등)
 */
export function assignTimings(
  words: WhisperWord[],
  sceneCount: number,
  skipIndices: number[] = [],
): SceneTiming[] {
  if (!words.length || !sceneCount) return [];

  const skipSet = new Set(skipIndices);
  const targetSceneCount = sceneCount - skipSet.size;

  if (targetSceneCount <= 0) return [];

  const totalDuration = words[words.length - 1].end;
  const targetSliceSec = totalDuration / targetSceneCount;

  // 문장 끝 단어의 인덱스 목록
  const sentenceEndIndices = words
    .map((w, i) => (SENTENCE_ENDINGS.test(w.word) ? i : -1))
    .filter((i) => i >= 0);

  // 실제 배분 대상 씬 인덱스 목록
  const targetIndices = Array.from({ length: sceneCount }, (_, i) => i)
    .filter((i) => !skipSet.has(i));

  // 각 씬의 경계(단어 인덱스) 계산
  const boundaries: number[] = [0];

  for (let s = 1; s < targetSceneCount; s++) {
    const targetTime = targetSliceSec * s;
    const closestIdx = words.reduce((best, w, i) => {
      return Math.abs(w.end - targetTime) < Math.abs(words[best].end - targetTime)
        ? i
        : best;
    }, 0);

    const snapRange = Math.max(3, Math.floor(words.length * 0.05));
    const nearSentenceEnd = sentenceEndIndices.find(
      (ei) => ei >= closestIdx - snapRange && ei <= closestIdx + snapRange
    );

    boundaries.push(nearSentenceEnd ?? closestIdx);
  }
  boundaries.push(words.length - 1);

  // 경계로부터 SceneTiming 생성 (배분 대상 씬에만)
  const timings: SceneTiming[] = [];

  for (let s = 0; s < targetSceneCount; s++) {
    const startWordIdx = s === 0 ? 0 : boundaries[s] + 1;
    const endWordIdx = boundaries[s + 1];

    const sliceWords = words.slice(startWordIdx, endWordIdx + 1);
    const startTime = sliceWords[0]?.start ?? 0;
    const endTime = sliceWords[sliceWords.length - 1]?.end ?? startTime + MIN_SCENE_SECONDS;

    const durationSec = Math.max(endTime - startTime, MIN_SCENE_SECONDS);
    const durationInFrames = Math.round(durationSec * FPS);

    timings.push({
      sceneIndex: targetIndices[s],  // 원래 씬 인덱스 매핑
      durationInFrames,
      startTime,
      endTime,
      words: sliceWords,
    });
  }

  return timings;
}
