// 모든 씬에 공통으로 들어가는 필드
type SceneBase = {
  durationInFrames: number;
  narration?: string;        // 화면에 표시되는 대본 텍스트
  ttsText?: string;           // 발음용 대본 (설정 시 TTS에 이 텍스트 사용, 미설정 시 narration 사용)
  audioSrc?: string;         // 생성된 오디오 파일 경로
  words?: { word: string; start: number; end: number }[];  // Whisper word-level 타임스탬프 (자막용)
  prompt?: string;           // scenePlan JSON 또는 구형 비주얼 프롬프트 (ai_free 씬에서 주로 사용)
  generatedCode?: string;    // AI 생성 TSX 코드 (ai_free 씬에서 주로 사용)
};

export type TitleScene = SceneBase & {
  type: 'title';
  title: string;
  subtitle?: string;
};

export type CardListScene = SceneBase & {
  type: 'card_list';
  heading: string;
  cards: { name: string; desc?: string }[];
};

export type FlowchartScene = SceneBase & {
  type: 'flowchart';
  heading: string;
  nodes: ({ id: string; label: string } | string)[];
  edges?: { from: string; to: string }[];
};

export type HighlightTextScene = SceneBase & {
  type: 'highlight_text';
  text: string;
  emphasis?: string;
};

export type GifInsertScene = SceneBase & {
  type: 'gif_insert';
  keyword: string;
  gifUrl: string;
  caption?: string;
};

export type ImageInsertScene = SceneBase & {
  type: 'image_insert';
  src: string;
  caption?: string;
};

export type AiFreeScene = SceneBase & {
  type: 'ai_free';
  prompt: string;
  generatedCode: string;
};

export type UserMediaScene = SceneBase & {
  type: 'user_media';
  mediaSrc: string;
  mediaType: 'image' | 'video';
  caption?: string;
  narrationAudioSrc?: string;
};

export type SplitScreenScene = SceneBase & {
  type: 'split_screen';
  left: { heading: string; points: string[] };
  right: { heading: string; points: string[] };
};

export type CodeBlockScene = SceneBase & {
  type: 'code_block';
  language: string;
  code: string;
  caption?: string;
};

export type StatNumberScene = SceneBase & {
  type: 'stat_number';
  stat: string;
  unit?: string;
  label: string;
};

export type ComparisonTableScene = SceneBase & {
  type: 'comparison_table';
  headers: string[];
  rows: string[][];
};

export type Scene =
  | TitleScene
  | CardListScene
  | FlowchartScene
  | HighlightTextScene
  | GifInsertScene
  | ImageInsertScene
  | AiFreeScene
  | UserMediaScene
  | SplitScreenScene
  | CodeBlockScene
  | StatNumberScene
  | ComparisonTableScene;

export type VideoConfig = {
  scenes: Scene[];
  fps: number;
  width: number;
  height: number;
};
