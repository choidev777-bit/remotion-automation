import React from 'react';
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
      durationInFrames={4230}
      fps={theme.video.fps}
      width={theme.video.width}
      height={theme.video.height}
      defaultProps={{}}
    />
  </>
);
