import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readdir, unlink, readFile } from 'fs/promises';
import Groq from 'groq-sdk';
import path from 'path';
import { execa } from 'execa';
import type { Scene } from '../../../remotion/src/types';

export const maxDuration = 600; // 10분

/**
 * Whisper 타이밍 + 원본 나레이션 텍스트 매핑.
 * 자막에 표시되는 word는 원본 대본(쉼표, 마침표 포함)을 사용하고,
 * start/end 타이밍만 Whisper에서 가져옴.
 */
function mapNarrationToTimings(
  narration: string,
  whisperWords: { word: string; start: number; end: number }[],
): { word: string; start: number; end: number }[] {
  const narrationWords = narration.trim().split(/\s+/);
  if (!narrationWords.length || !whisperWords.length) return [];

  const totalStart = whisperWords[0].start;
  const totalEnd = whisperWords[whisperWords.length - 1].end;

  if (narrationWords.length === whisperWords.length) {
    return narrationWords.map((word, i) => ({
      word,
      start: whisperWords[i].start,
      end: whisperWords[i].end,
    }));
  }

  const totalDuration = totalEnd - totalStart;
  const wordDuration = totalDuration / narrationWords.length;
  return narrationWords.map((word, i) => ({
    word,
    start: Math.round((totalStart + wordDuration * i) * 1000) / 1000,
    end: Math.round((totalStart + wordDuration * (i + 1)) * 1000) / 1000,
  }));
}

const REMOTION_DIR = path.join(process.cwd(), 'remotion');
const OUTPUT_DIR = path.join(process.cwd(), 'output');

/**
 * 오디오 파일의 실제 duration(초)을 WAV 헤더에서 계산.
 * 오디오 파일이 없거나 읽기 실패 시 null 반환.
 */
async function getAudioDurationFromFile(audioSrc: string): Promise<number | null> {
  try {
    const filePath = path.join(REMOTION_DIR, 'public', audioSrc);
    const buf = await readFile(filePath);
    if (buf.length <= 44) return null;
    const sampleRate = buf.readUInt32LE(24);
    const bitsPerSample = buf.readUInt16LE(34);
    const numChannels = buf.readUInt16LE(22);
    const dataSize = buf.length - 44;
    if (sampleRate > 0 && bitsPerSample > 0 && numChannels > 0) {
      return dataSize / (sampleRate * numChannels * (bitsPerSample / 8));
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * splitScript(/ 포함)에서 씬의 clean narration에 해당하는 구간을 찾아
 * / 마커가 포함된 버전을 반환합니다.
 */
function findSplitNarration(narration: string, splitScript: string): string | null {
  if (!narration?.trim() || !splitScript) return null;
  // splitScript에서 / 를 제거한 버전을 만들어 narration 위치를 찾는다
  const cleanSplit = splitScript.replace(/\s*\/\s*/g, ' ').replace(/\s+/g, ' ');
  const cleanNarr = narration.replace(/\s+/g, ' ').trim();
  const idx = cleanSplit.indexOf(cleanNarr);
  if (idx === -1) return null;

  // whitespace 판별 helper (\n, \r, \t, 공백 모두 포함)
  const isWs = (ch: string) => /\s/.test(ch);

  // cleanSplit에서의 문자 위치를 splitScript의 문자 위치로 매핑
  // cleanSplit[ci] → splitScript[si] 매핑 테이블 생성
  const mapping: number[] = []; // mapping[ci] = si
  let si = 0;
  for (let ci = 0; ci < cleanSplit.length; ci++) {
    // splitScript에서 / 기호와 그 주변 공백을 건너뛴다
    while (si < splitScript.length && splitScript[si] === '/') {
      si++;
      while (si < splitScript.length && isWs(splitScript[si])) si++;
    }
    // 공백 정규화: cleanSplit에서 공백이면 splitScript에서도 공백/개행 위치로 이동
    if (cleanSplit[ci] === ' ') {
      while (si < splitScript.length && isWs(splitScript[si])) si++;
      // / 뒤 공백일 수도 있음
      if (si < splitScript.length && splitScript[si] === '/') {
        si++;
        while (si < splitScript.length && isWs(splitScript[si])) si++;
      }
      mapping.push(si - 1); // 공백 위치
    } else {
      // splitScript에서도 / 와 공백을 건너뛰고 실제 문자에 도달
      while (si < splitScript.length && (splitScript[si] === '/' || isWs(splitScript[si]))) {
        if (splitScript[si] === '/') {
          si++;
          while (si < splitScript.length && isWs(splitScript[si])) si++;
        } else {
          // 공백이면 다음이 / 인지 확인
          const nextNonWs = si;
          let tmp = si;
          while (tmp < splitScript.length && isWs(splitScript[tmp])) tmp++;
          if (tmp < splitScript.length && splitScript[tmp] === '/') {
            si = tmp; // / 로 이동하여 루프 계속
          } else {
            break; // 일반 공백이므로 탈출
          }
        }
      }
      mapping.push(si);
      si++;
    }
  }

  if (idx >= mapping.length) return null;
  const start = mapping[idx];
  const endClean = idx + cleanNarr.length - 1;
  const end = endClean < mapping.length ? mapping[endClean] : splitScript.length - 1;

  return splitScript.slice(start, end + 1).trim();
}

function buildGeneratedVideoCode(
  scenes: Scene[],
  jobId: string,
  audioDurations: Map<number, number>,
  splitScript?: string,
): string {
  const aiImports = scenes
    .map((s, i) =>
      s.type === 'ai_free'
        ? `import { AiFreeScene as AI${i} } from './generated/scene-${jobId}-${i}';`
        : ''
    )
    .filter(Boolean)
    .join('\n');

  // words 필드가 있는 씬이 하나라도 있으면 Subtitle import
  const hasAnySubtitles = scenes.some((s) => (s as any).words?.length > 0);
  const subtitleImport = hasAnySubtitles
    ? `import { Subtitle } from './templates/Subtitle';`
    : '';

  // 씬별 시퀀스 생성
  const sequences = scenes
    .map((s, i) => {
      // 오디오 파일의 실제 길이가 있으면 그걸 사용, 없으면 기존 값 유지
      const audioDur = audioDurations.get(i);
      const d = audioDur
        ? Math.max(60, Math.round(audioDur * 30))
        : s.durationInFrames;
      const audioSrc = (s as { audioSrc?: string }).audioSrc;
      const words = (s as { words?: { word: string; start: number; end: number }[] }).words;
      
      // words를 제외한 씬 데이터 (컴포넌트 props에 불필요한 데이터 제외)
      const { words: _w, ...sceneWithoutWords } = s as any;

      // 씬 컴포넌트 렌더링
      let componentJsx = '';
      if (s.type === 'title')
        componentJsx = `<TitleSlide {...(${JSON.stringify(sceneWithoutWords)} as any)} />`;
      else if (s.type === 'card_list')
        componentJsx = `<CardList {...(${JSON.stringify(sceneWithoutWords)} as any)} />`;
      else if (s.type === 'flowchart')
        componentJsx = `<Flowchart {...(${JSON.stringify(sceneWithoutWords)} as any)} />`;
      else if (s.type === 'highlight_text')
        componentJsx = `<HighlightText {...(${JSON.stringify(sceneWithoutWords)} as any)} />`;
      else if (s.type === 'gif_insert')
        componentJsx = `<GifInsert {...(${JSON.stringify(sceneWithoutWords)} as any)} />`;
      else if (s.type === 'image_insert')
        componentJsx = `<ImageInsert {...(${JSON.stringify(sceneWithoutWords)} as any)} />`;
      else if (s.type === 'user_media')
        componentJsx = `<UserMedia {...(${JSON.stringify(sceneWithoutWords)} as any)} />`;
      else if (s.type === 'split_screen')
        componentJsx = `<SplitScreen {...(${JSON.stringify(sceneWithoutWords)} as any)} />`;
      else if (s.type === 'code_block')
        componentJsx = `<CodeBlock {...(${JSON.stringify(sceneWithoutWords)} as any)} />`;
      else if (s.type === 'stat_number')
        componentJsx = `<StatNumber {...(${JSON.stringify(sceneWithoutWords)} as any)} />`;
      else if (s.type === 'comparison_table')
        componentJsx = `<ComparisonTable {...(${JSON.stringify(sceneWithoutWords)} as any)} />`;
      else if (s.type === 'ai_free')
        componentJsx = `<AI${i} />`;
      else return '';

      // 씬별 오디오
      const audioJsx = audioSrc
        ? `<Audio src={staticFile("${audioSrc}")} />`
        : '';

      // 씬별 자막 (words가 있는 경우만)
      // narration은 원본(/ 없음). splitScript에서 해당 구간을 찾아 / 마커 포함 버전을 Subtitle에 전달.
      const narration = (s as { narration?: string }).narration;
      const splitNarration = narration && splitScript
        ? findSplitNarration(narration, splitScript)
        : null;
      const subtitleJsx = words && words.length > 0
        ? `<Subtitle words={${JSON.stringify(words)}}${splitNarration ? ` narration={${JSON.stringify(splitNarration)}}` : ''} />`
        : '';

      return `      <Series.Sequence durationInFrames={${d}}>${componentJsx}${audioJsx}${subtitleJsx}</Series.Sequence>`;
    })
    .filter(Boolean)
    .join('\n');

  return `import React from 'react';
import { Series, Sequence, Audio, staticFile, AbsoluteFill } from 'remotion';
import { TitleSlide } from './templates/TitleSlide';
import { CardList } from './templates/CardList';
import { Flowchart } from './templates/Flowchart';
import { HighlightText } from './templates/HighlightText';
import { GifInsert } from './templates/GifInsert';
import { ImageInsert } from './templates/ImageInsert';
import { UserMedia } from './templates/UserMedia';
import { SplitScreen } from './templates/SplitScreen';
import { CodeBlock } from './templates/CodeBlock';
import { StatNumber } from './templates/StatNumber';
import { ComparisonTable } from './templates/ComparisonTable';
${subtitleImport}
${aiImports}

export const GeneratedVideo: React.FC = () => (
  <AbsoluteFill>
    <Series>
${sequences}
    </Series>
  </AbsoluteFill>
);
`;
}

function buildRootCode(totalFrames: number): string {
  return `import React from 'react';
import { Composition } from 'remotion';
import { GeneratedVideo } from './GeneratedVideo';
import { theme } from './theme';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="GeneratedVideo"
      component={GeneratedVideo}
      durationInFrames={${totalFrames}}
      fps={theme.video.fps}
      width={theme.video.width}
      height={theme.video.height}
      defaultProps={{}}
    />
  </>
);
`;
}

export async function POST(req: NextRequest) {
  try {
    const { jobId, scenes, splitScript, previewOnly } = (await req.json()) as {
      jobId: string;
      scenes: Scene[];
      splitScript?: string;
      previewOnly?: boolean;
    };

    if (!jobId || !scenes?.length) {
      return NextResponse.json({ error: 'jobId and scenes are required' }, { status: 400 });
    }

    const genDir = path.join(REMOTION_DIR, 'src', 'generated');
    await mkdir(genDir, { recursive: true });
    await mkdir(OUTPUT_DIR, { recursive: true });

    // 0. 현재 디렉토리 상태를 먼저 기록한다.
    //  Studio가 열려 있는 동안 기존 파일을 먼저 지우면
    //  GeneratedVideo가 아직 예전 import를 가리키는 순간 module not found가 날 수 있다.
    let previousGeneratedFiles: string[] = [];
    try {
      previousGeneratedFiles = (await readdir(genDir)).filter((f) => f.endsWith('.tsx'));
    } catch {
      previousGeneratedFiles = [];
    }

    // 1. ai_free 씬 코드 파일로 저장
    const STANDARD_IMPORTS = `import React from 'react';
import { AbsoluteFill, Img, staticFile, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import { DynamicIcon } from '../templates/DynamicIcon';
`;
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      if (scene.type === 'ai_free' && scene.generatedCode) {
        let code = scene.generatedCode;

        // 보정 1: 기존 import 블록 전부 제거 후 표준 import로 교체
        //  → 부분 import 누락(spring 등) 방지
        code = code.replace(/^import\s+.*?;\s*$/gm, '');
        code = STANDARD_IMPORTS + '\n' + code.trimStart();

        // 보정 2: export명을 AiFreeScene으로 강제 통일
        //  → AI가 Scene5, Scene8 등 임의 이름을 쓰는 문제 방지
        code = code.replace(
          /export\s+const\s+\w+/,
          'export const AiFreeScene'
        );

        // 보정 3: style 객체 프로퍼티 사이 쉼표 누락 자동 수정
        // e.g. { opacity: val textAlign: 'center' } → { opacity: val, textAlign: 'center' }
        code = code.replace(
          /(\w+(?:['"\]]|\d))\s+([\w]+)\s*:/g,
          '$1, $2:'
        );

        // 보정 4: sec = frame / fps 패턴 사용 시 useVideoConfig 디스트럭처링 보정
        //  → AI가 `const { fps } = useVideoConfig();`를 누락하거나 fps를 직접 선언하는 경우
        if (/\bframe\s*\/\s*fps\b/.test(code) || /\bsec\s*[>=<]/.test(code)) {
          // useVideoConfig()가 호출되지 않으면 추가
          if (!/useVideoConfig\s*\(\s*\)/.test(code)) {
            // useCurrentFrame() 바로 뒤에 useVideoConfig() 삽입
            code = code.replace(
              /(const\s+frame\s*=\s*useCurrentFrame\s*\(\s*\)\s*;)/,
              '$1\n  const { fps } = useVideoConfig();'
            );
          }
          // useVideoConfig()는 있지만 fps가 디스트럭처링되지 않은 경우
          if (/useVideoConfig\s*\(\s*\)/.test(code) && !/\bfps\b/.test(code.match(/const\s*\{[^}]*\}\s*=\s*useVideoConfig/)?.[0] ?? '')) {
            code = code.replace(
              /const\s*\{([^}]*)\}\s*=\s*useVideoConfig\s*\(\s*\)/,
              (match, inner) => {
                if (/\bfps\b/.test(inner)) return match;
                return `const { ${inner.trim()}, fps } = useVideoConfig()`;
              }
            );
          }
        }

        // 보정 5: interpolate 호출에 옵션 객체가 누락된 경우 clamp 추가
        // interpolate(val, [a,b], [c,d]) → interpolate(val, [a,b], [c,d], {extrapolateLeft:'clamp', extrapolateRight:'clamp'})
        // 이미 옵션 객체({)가 있으면 건너뜀
        code = code.replace(
          /interpolate\(([^,]+),\s*(\[[^\]]+\]),\s*(\[[^\]]+\])\s*\)/g,
          (match) => {
            // 이미 4번째 인자(옵션 객체)가 있으면 원본 유지
            if (match.includes('{')) return match;
            return match.slice(0, -1) + ", {extrapolateLeft:'clamp', extrapolateRight:'clamp'})";
          }
        );

        // 보정 6: lucide DynamicIcon은 iconName이 아니라 name prop을 사용한다.
        //  → 생성 코드가 iconName을 쓰면 Remotion Studio에서
        //    "[lucide-react]: Name in Lucide DynamicIcon not found"가 반복 발생한다.
        code = code.replace(/<DynamicIcon([^>]*?)\biconName=/g, '<DynamicIcon$1name=');

        await writeFile(
          path.join(genDir, `scene-${jobId}-${i}.tsx`),
          code,
          'utf-8'
        );
      }
    }

    // 2. 렌더 직전: 각 씬의 오디오 파일로 Whisper 자동 재실행 → words 타임스탬프 동기화
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    for (const scene of scenes) {
      const s = scene as any;
      if (!s.audioSrc) continue;
      try {
        const audioFullPath = path.join(REMOTION_DIR, 'public', s.audioSrc);
        const audioBuffer = await readFile(audioFullPath);
        const transcription = await groq.audio.transcriptions.create({
          file: new File([audioBuffer], 'audio.wav', { type: 'audio/wav' }),
          model: 'whisper-large-v3-turbo',
          language: 'ko',
          response_format: 'verbose_json',
          timestamp_granularities: ['word'],
        }) as any;
        const whisperWords = (transcription.words ?? []).map((w: any) => ({
          word: w.word.trim(),
          start: Math.round(w.start * 1000) / 1000,
          end: Math.round(w.end * 1000) / 1000,
        }));
        // 원본 나레이션이 있으면 원본 텍스트 + Whisper 타이밍 매핑 (/ 구분자는 제거)
        if (s.narration?.trim()) {
          const cleanNarration = s.narration.replace(/\s*\/\s*/g, ' ').replace(/\s+/g, ' ').trim();
          s.words = mapNarrationToTimings(cleanNarration, whisperWords);
        } else {
          s.words = whisperWords;
        }
        console.log(`[render] ✅ Whisper 재실행 완료: ${s.audioSrc} (${s.words.length}단어, narration매핑: ${!!s.narration})`);
      } catch (e) {
        console.warn(`[render] ⚠️ Whisper 실패 (기존 words 유지): ${s.audioSrc}`, e);
      }
    }

    // 3. 오디오 파일의 실제 duration 계산 (씬 길이 보정용)
    const audioDurations = new Map<number, number>();
    for (let i = 0; i < scenes.length; i++) {
      const audioSrc = (scenes[i] as { audioSrc?: string }).audioSrc;
      if (audioSrc) {
        const dur = await getAudioDurationFromFile(audioSrc);
        if (dur !== null && dur > 0) {
          const correctedFrames = Math.max(60, Math.round(dur * 30));
          if (correctedFrames !== scenes[i].durationInFrames) {
            console.log(`[render] 🔧 씬 ${i} duration 보정: ${scenes[i].durationInFrames} → ${correctedFrames} (오디오 ${dur.toFixed(2)}초)`);
          }
          audioDurations.set(i, dur);
        }
      }
    }

    // 4. GeneratedVideo.tsx 동적 생성
    const videoCode = buildGeneratedVideoCode(scenes, jobId, audioDurations, splitScript);
    await writeFile(path.join(REMOTION_DIR, 'src', 'GeneratedVideo.tsx'), videoCode, 'utf-8');
    // 코드 백업: output/{jobId}.tsx 로 저장 (나중에 수정 가능하도록)
    await writeFile(path.join(OUTPUT_DIR, `${jobId}.tsx`), videoCode, 'utf-8');

    // 5. Root.tsx 업데이트 (보정된 duration 기준)
    const totalFrames = scenes.reduce((sum, s, i) => {
      const audioDur = audioDurations.get(i);
      const frames = audioDur
        ? Math.max(60, Math.round(audioDur * 30))
        : s.durationInFrames;
      return sum + frames;
    }, 0);
    await writeFile(path.join(REMOTION_DIR, 'src', 'Root.tsx'), buildRootCode(totalFrames), 'utf-8');

    // 5. GeneratedVideo가 새 job을 가리키기 시작한 뒤 오래된 generated 파일을 정리한다.
    //  이렇게 해야 Studio가 파일 교체 중간 상태를 덜 보게 된다.
    try {
      const keep = new Set(
        scenes
          .map((scene, i) => (scene.type === 'ai_free' && scene.generatedCode ? `scene-${jobId}-${i}.tsx` : null))
          .filter((f): f is string => Boolean(f))
      );
      await Promise.all(
        previousGeneratedFiles
          .filter((f) => !keep.has(f))
          .map((f) => unlink(path.join(genDir, f)).catch(() => {}))
      );
    } catch {
      // cleanup 실패는 preview/render 자체를 막지 않음
    }

    // 미리보기 모드: 코드만 저장하고 렌더링 건너뛰기
    if (previewOnly) {
      return NextResponse.json({
        status: 'preview-ready',
        jobId,
        totalFrames,
        previewUrl: 'http://localhost:3001', // Remotion Studio 기본 포트
      });
    }

    // 5. Remotion 렌더 실행
    const outputFile = path.join(OUTPUT_DIR, `${jobId}.mp4`);
    await execa('npx', ['remotion', 'render', 'src/index.ts', 'GeneratedVideo', outputFile], {
      cwd: REMOTION_DIR,
      stdio: 'inherit',
    });

    return NextResponse.json({
      status: 'done',
      outputPath: `output/${jobId}.mp4`,
    });
  } catch (err) {
    console.error('[/api/render]', err);
    return NextResponse.json({ error: 'Render failed', detail: String(err) }, { status: 500 });
  }
}
