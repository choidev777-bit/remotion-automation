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
 *
 * 전략:
 * 1. 오디오 전체 길이를 씬 수로 균등 분할한다.
 * 2. 각 경계를 가장 가까운 문장 끝(마침표/물음표 등) 단어로 스냅한다.
 * 3. 각 씬에 해당 구간의 WhisperWord[]를 포함시킨다 (자막용).
 */
export function assignTimings(
  words: WhisperWord[],
  sceneCount: number,
): SceneTiming[] {
  if (!words.length || !sceneCount) return [];

  const totalDuration = words[words.length - 1].end;
  const targetSliceSec = totalDuration / sceneCount;

  // 문장 끝 단어의 인덱스 목록
  const sentenceEndIndices = words
    .map((w, i) => (SENTENCE_ENDINGS.test(w.word) ? i : -1))
    .filter((i) => i >= 0);

  // 각 씬의 경계(단어 인덱스) 계산
  const boundaries: number[] = [0]; // 시작점

  for (let s = 1; s < sceneCount; s++) {
    const targetTime = targetSliceSec * s;
    // targetTime에 가장 가까운 단어 인덱스 찾기
    const closestIdx = words.reduce((best, w, i) => {
      return Math.abs(w.end - targetTime) < Math.abs(words[best].end - targetTime)
        ? i
        : best;
    }, 0);

    // 가까운 문장 끝 단어로 스냅 (±20% 범위 내)
    const snapRange = Math.max(3, Math.floor(words.length * 0.05));
    const nearSentenceEnd = sentenceEndIndices.find(
      (ei) => ei >= closestIdx - snapRange && ei <= closestIdx + snapRange
    );

    boundaries.push(nearSentenceEnd ?? closestIdx);
  }
  boundaries.push(words.length - 1); // 끝점

  // 경계로부터 SceneTiming 생성
  const timings: SceneTiming[] = [];

  for (let s = 0; s < sceneCount; s++) {
    const startWordIdx = s === 0 ? 0 : boundaries[s] + 1;
    const endWordIdx = boundaries[s + 1];

    const sliceWords = words.slice(startWordIdx, endWordIdx + 1);
    const startTime = sliceWords[0]?.start ?? 0;
    const endTime = sliceWords[sliceWords.length - 1]?.end ?? startTime + MIN_SCENE_SECONDS;

    const durationSec = Math.max(endTime - startTime, MIN_SCENE_SECONDS);
    const durationInFrames = Math.round(durationSec * FPS);

    timings.push({
      sceneIndex: s,
      durationInFrames,
      startTime,
      endTime,
      words: sliceWords,
    });
  }

  return timings;
}
