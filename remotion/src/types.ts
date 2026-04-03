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
  nodes: { id: string; label: string }[];
  edges: { from: string; to: string }[];
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
  mediaSrc: string;        // "user-media/job-xxx-1234.mp4" (remotion/public/ 기준)
  mediaType: 'image' | 'video';
  caption?: string;
};

export type Scene =
  | TitleScene
  | CardListScene
  | FlowchartScene
  | HighlightTextScene
  | GifInsertScene
  | ImageInsertScene
  | AiFreeScene
  | UserMediaScene;

export type VideoConfig = {
  scenes: Scene[];
  audioSrc: string;
  fps: number;
  width: number;
  height: number;
};
