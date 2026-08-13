import React from 'react';
import {Composition} from 'remotion';
import {NoderiftDemo, TOTAL_DURATION} from './NoderiftDemo';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="NoderiftDemo"
      component={NoderiftDemo}
      durationInFrames={TOTAL_DURATION}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
