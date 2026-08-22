import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate} from 'remotion';
import {THINKING_STEPS, NODES} from './constants';
import {NodeCard, Connector, PulseDot, clampProgress} from './components';

import {EndCardDemo} from './components/demo/EndCardDemo';
import {IntroCardDemo} from './components/demo/IntroCardDemo';
import {WorkflowGalleryDemo} from './WorkflowGalleryDemo';
import {ThinkingLogDemo} from './ThinkingLogDemo';

const T = {
  logoIn: [345, 365] as const,
  thinkingStart: 435,
  thinkingStep: 18,
  nodesStart: 525,
  nodeGap: 24,
  connectorsStart: 565,
  connectorGap: 18,
  connectorDuration: 16,
  runButtonAppear: 595,
  runClick: 600,
  runStart: 605,
  runEnd: 645,
  downloadAppear: 655,
  downloadClick: 670,
  endCardStart: 700,
};

export const TOTAL_DURATION = 740;

export const NoderiftDemo: React.FC = () => {
  const frame = useCurrentFrame();

  const thinkingVisible = frame >= T.thinkingStart && frame < T.nodesStart;
  const zoomScale = interpolate(
    frame,
    [430, 460, T.nodesStart - 10, T.nodesStart + 15],
    [1, 1.22, 1.22, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );

  const downloadVisible = frame >= T.downloadAppear;
  const downloadOpacity = clampProgress(frame, T.downloadAppear, T.downloadAppear + 10);
  const downloadClicked = frame >= T.downloadClick;
  const downloadClickT = clampProgress(frame, T.downloadClick - 4, T.downloadClick + 4);
  const downloadScale = 1 + 0.08 * Math.sin(downloadClickT * Math.PI);

  const arrivalFrames = NODES.map((_, i) => T.runStart + ((T.runEnd - T.runStart) * i) / (NODES.length - 1));
  const endCardT = clampProgress(frame, T.endCardStart, T.endCardStart + 15);
  const contentFadeOut = interpolate(frame, [T.endCardStart - 8, T.endCardStart + 8], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: '#0B0F19', fontFamily: 'Inter, system-ui, sans-serif'}}>
      <IntroCardDemo frame={frame} />

      <AbsoluteFill style={{backgroundImage: `radial-gradient(rgba(148, 163, 184, 0.15) 1px, transparent 1px)`, backgroundSize: '32px 32px', opacity: 0.7}} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${zoomScale})`,
          transformOrigin: '960px 520px',
        }}
      >
        <WorkflowGalleryDemo frame={frame} nodesStart={T.nodesStart} />
        <ThinkingLogDemo thinkingVisible={thinkingVisible} frame={frame} thinkingStart={T.thinkingStart} thinkingStep={T.thinkingStep} steps={THINKING_STEPS} />
      </div>

      <AbsoluteFill style={{opacity: contentFadeOut}}>
        {downloadVisible && (
          <div style={{position: 'absolute', left: 960, top: 760, transform: `translateX(-50%) scale(${downloadScale})`, padding: '14px 28px', borderRadius: 12, border: `1px solid ${downloadClicked ? '#22C55E' : 'rgba(71, 85, 105, 0.6)'}`, background: downloadClicked ? '#22C55E' : 'rgba(30, 41, 59, 0.9)', color: downloadClicked ? '#fff' : '#F8FAFC', fontSize: 16, fontWeight: 600, opacity: downloadOpacity, boxShadow: downloadClicked ? '0 0 25px rgba(34, 197, 94, 0.5)' : '0 10px 30px rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'center', gap: 10}}>
            {downloadClicked ? '✓ Downloaded Excel File' : '⬇ Download Excel Output'}
          </div>
        )}

        {NODES.map((node, i) => (
          <NodeCard key={node.title} frame={frame} appearFrame={T.nodesStart + i * T.nodeGap} node={node} runFrame={arrivalFrames[i]} doneFrame={arrivalFrames[i] + 20} />
        ))}

        {NODES.slice(0, -1).map((_, i) => (
          <Connector key={`conn-${i}`} frame={frame} drawStart={T.connectorsStart + i * T.connectorGap} drawEnd={T.connectorsStart + i * T.connectorGap + T.connectorDuration} fromNode={NODES[i]} toNode={NODES[i + 1]} />
        ))}

        <PulseDot frame={frame} nodes={NODES} arrivalFrames={arrivalFrames} />
      </AbsoluteFill>

      <EndCardDemo endCardT={endCardT} />
    </AbsoluteFill>
  );
};
