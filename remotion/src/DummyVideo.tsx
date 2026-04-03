import React from 'react';
import { Series } from 'remotion';
import { TitleSlide } from './templates/TitleSlide';
import { CardList } from './templates/CardList';
import { Flowchart } from './templates/Flowchart';
import { HighlightText } from './templates/HighlightText';

export const DummyVideo: React.FC = () => {
  return (
    <Series>
      <Series.Sequence durationInFrames={90}>
        <TitleSlide
          type="title"
          durationInFrames={90}
          title="유튜브 자동화 시스템"
          subtitle="Remotion + Gemini API로 만드는 영상"
        />
      </Series.Sequence>
      <Series.Sequence durationInFrames={120}>
        <CardList
          type="card_list"
          durationInFrames={120}
          heading="핵심 기능 3가지"
          cards={[
            { name: '대본 생성', desc: 'Gemini 2.5 Flash로 자동 작성' },
            { name: 'TTS 음성', desc: 'Qwen3 TTS 로컬 생성' },
            { name: '자동 렌더링', desc: 'Remotion CLI로 mp4 완성' },
          ]}
        />
      </Series.Sequence>
      <Series.Sequence durationInFrames={90}>
        <Flowchart
          type="flowchart"
          durationInFrames={90}
          heading="파이프라인 흐름"
          nodes={[
            { id: '1', label: '대본 입력' },
            { id: '2', label: '씬 분석' },
            { id: '3', label: '렌더링' },
            { id: '4', label: 'MP4 완성' },
          ]}
          edges={[
            { from: '1', to: '2' },
            { from: '2', to: '3' },
            { from: '3', to: '4' },
          ]}
        />
      </Series.Sequence>
      <Series.Sequence durationInFrames={90}>
        <HighlightText
          type="highlight_text"
          durationInFrames={90}
          text="대본만 넣으면"
          emphasis="영상이 자동으로 만들어집니다"
        />
      </Series.Sequence>
    </Series>
  );
};
