export type TitleScene = {
  type: 'title';
  durationInFrames: number;
  title: string;
  subtitle?: string;
};

export type CardListScene = {
  type: 'card_list';
  durationInFrames: number;
  heading: string;
  cards: { name: string; desc?: string }[];
};

export type FlowchartScene = {
  type: 'flowchart';
  durationInFrames: number;
  heading: string;
  nodes: ({ id: string; label: string } | string)[];   // GLM이 string[]로 생성하는 경우도 허용
  edges?: { from: string; to: string }[];              // optional로 변경
};

export type HighlightTextScene = {
  type: 'highlight_text';
  durationInFrames: number;
  text: string;
  emphasis?: string;
};

export type GifInsertScene = {
  type: 'gif_insert';
  durationInFrames: number;
  keyword: string;
  gifUrl: string;
  caption?: string;
};

export type ImageInsertScene = {
  type: 'image_insert';
  durationInFrames: number;
  src: string;
  caption?: string;
};

export type AiFreeScene = {
  type: 'ai_free';
  durationInFrames: number;
  prompt: string;
  generatedCode: string;
};

export type UserMediaScene = {
  type: 'user_media';
  durationInFrames: number;
  mediaSrc: string;
  mediaType: 'image' | 'video';
  caption?: string;
  narration?: string;         // 별도 TTS용 텍스트 (없으면 무음)
  narrationAudioSrc?: string; // pipeline에서 TTS 생성 후 설정
};

export type SplitScreenScene = {
  type: 'split_screen';
  durationInFrames: number;
  left: { heading: string; points: string[] };
  right: { heading: string; points: string[] };
};

export type CodeBlockScene = {
  type: 'code_block';
  durationInFrames: number;
  language: string;
  code: string;
  caption?: string;
};

export type StatNumberScene = {
  type: 'stat_number';
  durationInFrames: number;
  stat: string;
  unit?: string;
  label: string;
};

export type ComparisonTableScene = {
  type: 'comparison_table';
  durationInFrames: number;
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
  audioSrc: string;
  fps: number;
  width: number;
  height: number;
};
