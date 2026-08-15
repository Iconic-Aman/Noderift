import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate} from 'remotion';
import {PROMPT_TEXT, THINKING_STEPS, NODES} from './constants';
import {CursorDot, NodeCard, Connector, PulseDot, clampProgress} from './components';
import {TopNavbar} from './components/demo/TopNavbar';
import {EndCardDemo} from './components/demo/EndCardDemo';
import {IntroCardDemo} from './components/demo/IntroCardDemo';
import {WorkflowGalleryDemo} from './WorkflowGalleryDemo';
import {AIChatPanelDemo} from './AIChatPanelDemo';
import {ThinkingLogDemo} from './ThinkingLogDemo';

const T = {
  logoIn: [310, 330] as const,
  thinkingStart: 560,
  thinkingStep: 40,
  nodesStart: 685,
  nodeGap: 40,
  connectorsStart: 805,
  connectorGap: 40,
  connectorDuration: 28,
  runButtonAppear: 895,
  runClick: 925,
  runStart: 945,
  runEnd: 1065,
  downloadAppear: 1075,
  downloadClick: 1100,
  endCardStart: 1125,
};

export const TOTAL_DURATION = 1165;

export const NoderiftDemo: React.FC = () => {
  const frame = useCurrentFrame();

  const logoOpacity = clampProgress(frame, T.logoIn[0], T.logoIn[1]);

  const chatVisible = frame >= 560 && frame < T.nodesStart;
  const chatOpacity = interpolate(
    frame,
    [560, 580, T.nodesStart - 30, T.nodesStart],
    [1, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );

  const thinkingVisible = frame >= T.thinkingStart && frame < T.nodesStart;

  const runButtonVisible = frame >= T.runButtonAppear;
  const runButtonOpacity = clampProgress(frame, T.runButtonAppear, T.runButtonAppear + 15);
  const runClicked = frame >= T.runClick;
  const runFinished = frame >= T.runEnd;

  const downloadVisible = frame >= T.downloadAppear;
  const downloadOpacity = clampProgress(frame, T.downloadAppear, T.downloadAppear + 15);
  const downloadClicked = frame >= T.downloadClick;
  const downloadClickT = clampProgress(frame, T.downloadClick - 6, T.downloadClick + 6);
  const downloadScale = 1 + 0.08 * Math.sin(downloadClickT * Math.PI);

  const arrivalFrames = NODES.map((_, i) => T.runStart + ((T.runEnd - T.runStart) * i) / (NODES.length - 1));
  const endCardT = clampProgress(frame, T.endCardStart, T.endCardStart + 20);
  const contentFadeOut = interpolate(frame, [T.endCardStart - 10, T.endCardStart + 10], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: '#0B0F19', fontFamily: 'Inter, system-ui, sans-serif'}}>
      <IntroCardDemo frame={frame} />
      <WorkflowGalleryDemo frame={frame} />

      <AbsoluteFill style={{backgroundImage: `radial-gradient(rgba(148, 163, 184, 0.15) 1px, transparent 1px)`, backgroundSize: '32px 32px', opacity: 0.7}} />

      <AbsoluteFill style={{opacity: contentFadeOut}}>
        <TopNavbar logoOpacity={logoOpacity} pillActive={true} runButtonVisible={runButtonVisible} runButtonOpacity={runButtonOpacity} runClicked={runClicked} runFinished={runFinished} />

        {downloadVisible && (
          <div style={{position: 'absolute', left: 960, top: 760, transform: `translateX(-50%) scale(${downloadScale})`, padding: '14px 28px', borderRadius: 12, border: `1px solid ${downloadClicked ? '#22C55E' : 'rgba(71, 85, 105, 0.6)'}`, background: downloadClicked ? '#22C55E' : 'rgba(30, 41, 59, 0.9)', color: downloadClicked ? '#fff' : '#F8FAFC', fontSize: 16, fontWeight: 600, opacity: downloadOpacity, boxShadow: downloadClicked ? '0 0 25px rgba(34, 197, 94, 0.5)' : '0 10px 30px rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'center', gap: 10}}>
            {downloadClicked ? '✓ Downloaded Excel File' : '⬇ Download Excel Output'}
          </div>
        )}

        <CursorDot frame={frame} fromX={960} fromY={700} toX={1790} toY={28} moveStart={900} moveEnd={T.runClick} clickFrame={T.runClick} visibleFrom={895} visibleTo={T.runClick + 15} />
        <CursorDot frame={frame} fromX={1790} fromY={28} toX={960} toY={760} moveStart={1080} moveEnd={T.downloadClick} clickFrame={T.downloadClick} visibleFrom={1075} visibleTo={T.downloadClick + 15} />

        <AIChatPanelDemo chatVisible={chatVisible} chatOpacity={chatOpacity} promptText={PROMPT_TEXT} />
        <ThinkingLogDemo thinkingVisible={thinkingVisible} frame={frame} thinkingStart={T.thinkingStart} thinkingStep={T.thinkingStep} steps={THINKING_STEPS} />

        {NODES.map((node, i) => (
          <NodeCard key={node.title} frame={frame} appearFrame={T.nodesStart + i * T.nodeGap} node={node} runFrame={arrivalFrames[i]} doneFrame={arrivalFrames[i] + 25} />
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
