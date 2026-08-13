import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate} from 'remotion';
import {PROMPT_TEXT, THINKING_STEPS, NODES} from './constants';
import {CursorDot, NodeCard, Connector, PulseDot, clampProgress} from './components';
import {TopNavbar} from './components/demo/TopNavbar';
import {AIChatPanelDemo} from './components/demo/AIChatPanelDemo';
import {ThinkingLogDemo} from './components/demo/ThinkingLogDemo';
import {EndCardDemo} from './components/demo/EndCardDemo';
import {IntroCardDemo} from './components/demo/IntroCardDemo';

const T = {
  logoIn: [80, 100] as const,
  aiModeClick: 135,
  promptBarSlideUp: [135, 155] as const,
  typingStart: 155,
  typingEnd: 245,
  submitClick: 265,
  promptDock: [265, 285] as const,
  thinkingStart: 285,
  thinkingStep: 40,
  nodesStart: 420,
  nodeGap: 40,
  connectorsStart: 540,
  connectorGap: 40,
  connectorDuration: 28,
  runButtonAppear: 630,
  runClick: 660,
  runStart: 680,
  runEnd: 800,
  downloadAppear: 810,
  downloadClick: 835,
  endCardStart: 860,
};

export const TOTAL_DURATION = 900; // ~30s @ 30fps

export const NoderiftDemo: React.FC = () => {
  const frame = useCurrentFrame();

  const logoOpacity = clampProgress(frame, T.logoIn[0], T.logoIn[1]);
  const pillActive = frame >= T.aiModeClick;

  const barT = clampProgress(frame, T.promptBarSlideUp[0], T.promptBarSlideUp[1]);
  const chatVisible = frame >= T.promptBarSlideUp[0];
  const chatY = interpolate(barT, [0, 1], [1160, 520]);
  const chatOpacity = clampProgress(frame, T.promptBarSlideUp[0], T.promptBarSlideUp[0] + 12);

  const charCount = Math.round(clampProgress(frame, T.typingStart, T.typingEnd) * PROMPT_TEXT.length);
  const typedText = PROMPT_TEXT.slice(0, charCount);
  const showCursorBlink = frame < T.typingEnd && Math.floor(frame / 10) % 2 === 0;

  const isDocked = frame >= T.promptDock[0];
  const thinkingVisible = frame >= T.thinkingStart && frame < T.nodesStart + 40;

  const runButtonVisible = frame >= T.runButtonAppear;
  const runButtonOpacity = clampProgress(frame, T.runButtonAppear, T.runButtonAppear + 15);
  const runClicked = frame >= T.runClick;
  const runFinished = frame >= T.runEnd;

  const downloadVisible = frame >= T.downloadAppear;
  const downloadOpacity = clampProgress(frame, T.downloadAppear, T.downloadAppear + 15);
  const downloadClicked = frame >= T.downloadClick;
  const downloadClickT = clampProgress(frame, T.downloadClick - 6, T.downloadClick + 6);
  const downloadScale = 1 + 0.08 * Math.sin(downloadClickT * Math.PI);

  const arrivalFrames = NODES.map(
    (_, i) => T.runStart + ((T.runEnd - T.runStart) * i) / (NODES.length - 1)
  );

  const endCardT = clampProgress(frame, T.endCardStart, T.endCardStart + 20);
  const contentFadeOut = interpolate(
    frame,
    [T.endCardStart - 10, T.endCardStart + 10],
    [1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );

  return (
    <AbsoluteFill style={{background: '#0B0F19', fontFamily: 'Inter, system-ui, sans-serif'}}>
      {/* Intro title card hook */}
      <IntroCardDemo frame={frame} />

      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(rgba(148, 163, 184, 0.15) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
          opacity: 0.7,
        }}
      />

      <AbsoluteFill style={{opacity: contentFadeOut}}>
        <TopNavbar
          logoOpacity={logoOpacity}
          pillActive={pillActive}
          runButtonVisible={runButtonVisible}
          runButtonOpacity={runButtonOpacity}
          runClicked={runClicked}
          runFinished={runFinished}
        />

        {downloadVisible && (
          <div
            style={{
              position: 'absolute',
              left: 960,
              top: 760,
              transform: `translateX(-50%) scale(${downloadScale})`,
              padding: '14px 28px',
              borderRadius: 12,
              border: `1px solid ${downloadClicked ? '#22C55E' : 'rgba(71, 85, 105, 0.6)'}`,
              background: downloadClicked ? '#22C55E' : 'rgba(30, 41, 59, 0.9)',
              color: downloadClicked ? '#fff' : '#F8FAFC',
              fontSize: 16,
              fontWeight: 600,
              opacity: downloadOpacity,
              boxShadow: downloadClicked ? '0 0 25px rgba(34, 197, 94, 0.5)' : '0 10px 30px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            {downloadClicked ? '✓ Downloaded Excel File' : '⬇ Download Excel Output'}
          </div>
        )}

        <CursorDot frame={frame} fromX={1700} fromY={200} toX={1820} toY={28} moveStart={120} moveEnd={T.aiModeClick} clickFrame={T.aiModeClick} visibleFrom={115} visibleTo={T.aiModeClick + 15} />
        <CursorDot frame={frame} fromX={1820} fromY={28} toX={1360} toY={865} moveStart={T.typingEnd} moveEnd={T.submitClick} clickFrame={T.submitClick} visibleFrom={T.typingEnd - 5} visibleTo={T.submitClick + 15} />
        <CursorDot frame={frame} fromX={960} fromY={700} toX={1790} toY={28} moveStart={635} moveEnd={T.runClick} clickFrame={T.runClick} visibleFrom={630} visibleTo={T.runClick + 15} />
        <CursorDot frame={frame} fromX={1790} fromY={28} toX={960} toY={760} moveStart={815} moveEnd={T.downloadClick} clickFrame={T.downloadClick} visibleFrom={810} visibleTo={T.downloadClick + 15} />

        <AIChatPanelDemo
          chatVisible={chatVisible}
          isDocked={isDocked}
          chatY={chatY}
          chatOpacity={chatOpacity}
          typedText={typedText}
          showCursorBlink={showCursorBlink}
          promptText={PROMPT_TEXT}
        />

        <ThinkingLogDemo
          thinkingVisible={thinkingVisible}
          frame={frame}
          thinkingStart={T.thinkingStart}
          thinkingStep={T.thinkingStep}
          steps={THINKING_STEPS}
        />

        {NODES.map((node, i) => {
          const appearFrame = T.nodesStart + i * T.nodeGap;
          return (
            <NodeCard
              key={node.title}
              frame={frame}
              appearFrame={appearFrame}
              node={node}
              runFrame={arrivalFrames[i]}
              doneFrame={arrivalFrames[i] + 25}
            />
          );
        })}

        {NODES.slice(0, -1).map((_, i) => {
          const drawStart = T.connectorsStart + i * T.connectorGap;
          return (
            <Connector
              key={`conn-${i}`}
              frame={frame}
              drawStart={drawStart}
              drawEnd={drawStart + T.connectorDuration}
              fromNode={NODES[i]}
              toNode={NODES[i + 1]}
            />
          );
        })}

        <PulseDot frame={frame} nodes={NODES} arrivalFrames={arrivalFrames} />
      </AbsoluteFill>

      <EndCardDemo endCardT={endCardT} />
    </AbsoluteFill>
  );
};
