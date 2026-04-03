import React from 'react';
import { Composition } from 'remotion';
import { DummyVideo } from './DummyVideo';
import { theme } from './theme';

export const RemotionRoot: React.FC = () => {
  return (
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
    </>
  );
};
