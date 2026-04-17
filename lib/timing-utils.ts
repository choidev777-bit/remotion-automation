/**
 * 나레이션 words[] 배열에서 문장 종결 부호 기반으로 콘텐츠 블록을 추출한다.
 * 비주얼 프롬프트 및 코드 생성 AI에 전달하여 프로그레시브 리빌 애니메이션을 구현.
 */

export interface ContentBlock {
  text: string;       // 해당 구간의 전체 텍스트
  startSec: number;   // 구간 시작 시각 (초)
  endSec: number;     // 구간 끝 시각 (초)
  keywords: string[]; // 핵심 키워드 (2자 이상, 최대 3개)
}

interface Word {
  word: string;
  start: number;
  end: number;
}

// 문장 종결 부호 패턴: 단어 끝 또는 한글 앞의 마침표/물음표/느낌표
// "확인하기.둘," 같은 합체 토큰에서도 마침표를 감지
const SENTENCE_END = /[.?!。](?=[가-힣]|$)/;

// 조사/어미 패턴 (키워드에서 제외)
const PARTICLE_PATTERN = /^(은|는|이|가|을|를|에|의|와|과|도|로|서|에서|으로|부터|까지|한|할|된|될|해|하는|하고|하면|합니다|입니다|있는|없는|있다|없다|그|이|저|것|수|등)$/;

/**
 * words[] 배열에서 마침표/물음표/느낌표 기반으로 콘텐츠 블록을 추출한다.
 *
 * @param words Whisper/매핑된 word-level 타이밍 배열
 * @returns 콘텐츠 블록 배열 (최소 1개)
 */
export function extractContentBlocks(words: Word[]): ContentBlock[] {
  if (!words || words.length === 0) return [];

  const rawBlocks: { words: Word[] }[] = [];
  let buf: Word[] = [];

  for (const w of words) {
    buf.push(w);
    if (SENTENCE_END.test(w.word)) {
      rawBlocks.push({ words: [...buf] });
      buf = [];
    }
  }
  // 마지막에 마침표 없이 남은 단어들 → 마지막 블록에 추가 또는 새 블록
  if (buf.length > 0) {
    if (rawBlocks.length > 0) {
      rawBlocks[rawBlocks.length - 1].words.push(...buf);
    } else {
      rawBlocks.push({ words: buf });
    }
  }

  if (rawBlocks.length === 0) return [];

  // 병합: 4자 이하(텍스트 길이)의 짧은 블록은 다음 블록에 병합
  const merged: { words: Word[] }[] = [];
  for (let i = 0; i < rawBlocks.length; i++) {
    const text = rawBlocks[i].words.map(w => w.word).join(' ').replace(/[.,!?。]/g, '').trim();
    if (text.length <= 4 && i < rawBlocks.length - 1) {
      // 다음 블록의 앞에 추가
      rawBlocks[i + 1].words = [...rawBlocks[i].words, ...rawBlocks[i + 1].words];
    } else if (text.length <= 4 && merged.length > 0) {
      // 마지막 블록이면서 짧은 경우 → 이전 블록에 추가
      merged[merged.length - 1].words.push(...rawBlocks[i].words);
    } else {
      merged.push(rawBlocks[i]);
    }
  }

  // ContentBlock 구조로 변환
  return merged.map(block => {
    const blockWords = block.words;
    const text = blockWords.map(w => w.word).join(' ');
    const startSec = blockWords[0].start;
    const endSec = blockWords[blockWords.length - 1].end;

    // 핵심 키워드 추출: 2자 이상, 조사 제외, 최대 3개
    const keywords = blockWords
      .map(w => w.word.replace(/[.,!?。…·'"]/g, '').trim())
      .filter(w => w.length >= 2 && !PARTICLE_PATTERN.test(w))
      .slice(0, 3);

    return { text, startSec, endSec, keywords };
  });
}

/**
 * 콘텐츠 블록 배열을 프롬프트용 텍스트로 포맷한다.
 */
export function formatContentBlocks(blocks: ContentBlock[]): string {
  if (blocks.length <= 1) return '';
  return blocks
    .map((b, i) => {
      const preview = b.text.length > 50 ? b.text.slice(0, 50) + '...' : b.text;
      return `  [블록${i + 1}] ${b.startSec.toFixed(1)}초~${b.endSec.toFixed(1)}초: "${preview}"`;
    })
    .join('\n');
}

/**
 * 콘텐츠 블록 타이밍을 실제 프롬프트에 주입할지 판단한다.
 * 짧은 씬이나 단순 씬에서는 발화 싱크가 오히려 화면을 잘게 쪼개기 쉬워서 기본적으로 제외한다.
 */
export function shouldInjectContentBlocks(
  blocks: ContentBlock[],
  durationInFrames?: number,
): boolean {
  if (!durationInFrames || blocks.length < 2) return false;

  const durationSec = durationInFrames / 30;

  // 짧은 씬은 내레이션 싱크보다 안정적인 고정 레이아웃이 낫다.
  if (durationSec < 5.5) return false;

  // 2블록 전환은 충분히 긴 씬일 때만 의미가 있다.
  if (blocks.length === 2) return durationSec >= 6.5;

  // 3블록 이상도 최소한의 전개 길이가 있어야 과잉 연출을 피할 수 있다.
  return durationSec >= 6.0;
}
