import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { execa } from 'execa';
import type { Scene } from '../../../remotion/src/types';

const REMOTION_DIR = path.join(process.cwd(), 'remotion');
const OUTPUT_DIR = path.join(process.cwd(), 'output');

function buildGeneratedVideoCode(
  scenes: Scene[],
  audioSrc: string,
  jobId: string,
  hasSubtitles: boolean,
): string {
  const aiImports = scenes
    .map((s, i) =>
      s.type === 'ai_free'
        ? `import { AiFreeScene as AI${i} } from './generated/scene-${jobId}-${i}';`
        : ''
    )
    .filter(Boolean)
    .join('\n');

  const sequences = scenes
    .map((s, i) => {
      const d = s.durationInFrames;
      const props = JSON.stringify(s).replace(/"/g, "'");
      if (s.type === 'title')
        return `      <Series.Sequence durationInFrames={${d}}><TitleSlide {...(${JSON.stringify(s)} as any)} /></Series.Sequence>`;
      if (s.type === 'card_list')
        return `      <Series.Sequence durationInFrames={${d}}><CardList {...(${JSON.stringify(s)} as any)} /></Series.Sequence>`;
      if (s.type === 'flowchart')
        return `      <Series.Sequence durationInFrames={${d}}><Flowchart {...(${JSON.stringify(s)} as any)} /></Series.Sequence>`;
      if (s.type === 'highlight_text')
        return `      <Series.Sequence durationInFrames={${d}}><HighlightText {...(${JSON.stringify(s)} as any)} /></Series.Sequence>`;
      if (s.type === 'gif_insert')
        return `      <Series.Sequence durationInFrames={${d}}><GifInsert {...(${JSON.stringify(s)} as any)} /></Series.Sequence>`;
      if (s.type === 'image_insert')
        return `      <Series.Sequence durationInFrames={${d}}><ImageInsert {...(${JSON.stringify(s)} as any)} /></Series.Sequence>`;
      if (s.type === 'user_media')
        return `      <Series.Sequence durationInFrames={${d}}><UserMedia {...(${JSON.stringify(s)} as any)} /></Series.Sequence>`;
      if (s.type === 'split_screen')
        return `      <Series.Sequence durationInFrames={${d}}><SplitScreen {...(${JSON.stringify(s)} as any)} /></Series.Sequence>`;
      if (s.type === 'code_block')
        return `      <Series.Sequence durationInFrames={${d}}><CodeBlock {...(${JSON.stringify(s)} as any)} /></Series.Sequence>`;
      if (s.type === 'stat_number')
        return `      <Series.Sequence durationInFrames={${d}}><StatNumber {...(${JSON.stringify(s)} as any)} /></Series.Sequence>`;
      if (s.type === 'comparison_table')
        return `      <Series.Sequence durationInFrames={${d}}><ComparisonTable {...(${JSON.stringify(s)} as any)} /></Series.Sequence>`;
      if (s.type === 'ai_free')
        return `      <Series.Sequence durationInFrames={${d}}><AI${i} /></Series.Sequence>`;
      return '';
    })
    .filter(Boolean)
    .join('\n');

  const subtitleImport = hasSubtitles
    ? `import { Subtitle } from './templates/Subtitle';
import subtitleWords from './generated/words-${jobId}.json';`
    : '';

  const subtitleLayer = hasSubtitles
    ? `    <Subtitle words={subtitleWords} />`
    : '';

  return `import React from 'react';
import { Series, Audio, staticFile, AbsoluteFill } from 'remotion';
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
    ${audioSrc ? `<Audio src={staticFile("${audioSrc}")} />` : ''}
    <Series>
${sequences}
    </Series>
${subtitleLayer}
  </AbsoluteFill>
);
`;
}

function buildRootCode(totalFrames: number): string {
  return `import React from 'react';
import { Composition } from 'remotion';
import { DummyVideo } from './DummyVideo';
import { GeneratedVideo } from './GeneratedVideo';
import { theme } from './theme';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="DummyVideo"
      component={DummyVideo}
      durationInFrames={390}
      fps={theme.video.fps}
      width={theme.video.width}
      height={theme.video.height}
      defaultProps={{}}
    />
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
    const { jobId, scenes, audioSrc = '', whisperWords = [] } = (await req.json()) as {
      jobId: string;
      scenes: Scene[];
      audioSrc: string;
      whisperWords: { word: string; start: number; end: number }[];
    };

    if (!jobId || !scenes?.length) {
      return NextResponse.json({ error: 'jobId and scenes are required' }, { status: 400 });
    }

    const genDir = path.join(REMOTION_DIR, 'src', 'generated');
    await mkdir(genDir, { recursive: true });
    await mkdir(OUTPUT_DIR, { recursive: true });

    // 1. ai_free 씬 코드 파일로 저장
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      if (scene.type === 'ai_free' && scene.generatedCode) {
        await writeFile(
          path.join(genDir, `scene-${jobId}-${i}.tsx`),
          scene.generatedCode,
          'utf-8'
        );
      }
    }

    // 2. whisperWords를 JSON 파일로 저장 (자막용)
    const hasSubtitles = whisperWords.length > 0;
    if (hasSubtitles) {
      await writeFile(
        path.join(genDir, `words-${jobId}.json`),
        JSON.stringify(whisperWords),
        'utf-8',
      );
    }

    // 3. GeneratedVideo.tsx 동적 생성
    const videoCode = buildGeneratedVideoCode(scenes, audioSrc, jobId, hasSubtitles);
    await writeFile(path.join(REMOTION_DIR, 'src', 'GeneratedVideo.tsx'), videoCode, 'utf-8');

    // 3. Root.tsx 업데이트
    const totalFrames = scenes.reduce((sum, s) => sum + s.durationInFrames, 0);
    await writeFile(path.join(REMOTION_DIR, 'src', 'Root.tsx'), buildRootCode(totalFrames), 'utf-8');

    // 4. Remotion 렌더 실행
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
