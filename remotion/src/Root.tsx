import React from 'react';
import { Composition } from 'remotion';
import { GeneratedVideo } from './GeneratedVideo';
import { theme } from './theme';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="GeneratedVideo"
      component={GeneratedVideo}
      durationInFrames={2607}
      fps={theme.video.fps}
      width={theme.video.width}
      height={theme.video.height}
      defaultProps={{}}
    />
  </>
);
