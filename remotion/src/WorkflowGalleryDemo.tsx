import React from 'react';
import {AbsoluteFill, interpolate, spring, staticFile, useVideoConfig} from 'remotion';
import {PROMPT_TEXT} from './constants';
import {clampProgress} from './components';

export const CARD_CENTER_X = 960;
export const CARD_CENTER_Y = 480;
export const CARD_WIDTH = 980;

const CARDS = [
  {id: 0, text: 'Check Gmail every hour and text me if an email from my boss arrives', x: 340, y: 260, phase: 0},
  {id: 1, text: 'Scrape a news site every morning and email me the top headlines', x: 1450, y: 220, phase: 1.2},
  {id: 2, text: PROMPT_TEXT, x: CARD_CENTER_X, y: CARD_CENTER_Y, isTarget: true, phase: 2.1},
  {id: 3, text: 'Run a Python script on new webhook data and save the results to my database', x: 320, y: 730, phase: 3.4},
  {id: 4, text: 'Every Friday at 5 PM, query my database for pending orders and email me the list', x: 1460, y: 710, phase: 4.5},
  {id: 5, text: 'Watch for new webhook events and send an SMS alert when one comes in', x: 880, y: 860, phase: 5.2},
];

export const WorkflowGalleryDemo: React.FC<{frame: number; nodesStart: number}> = ({frame, nodesStart}) => {
  if (frame < 345 || frame >= nodesStart) return null;

  const {fps} = useVideoConfig();
  const f = frame - 345;
  const logoUrl = staticFile('noderift-icon.jpg');

  // Fade out at end when nodes start
  const fadeOutAtEnd = clampProgress(frame, nodesStart - 15, nodesStart);

  return (
    <AbsoluteFill style={{fontFamily: 'Inter, system-ui, sans-serif'}}>
      {CARDS.map((card, i) => {
        const staggerStart = i * 4;
        const inProgress = clampProgress(f, staggerStart, staggerStart + 12);
        if (inProgress <= 0) return null;

        // Disappear animation for other cards starts at f = 65
        const clearProgress = card.isTarget ? 0 : clampProgress(f, 65 + i * 2, 85 + i * 2);
        const cardOpacity = card.isTarget
          ? inProgress * (1 - fadeOutAtEnd)
          : inProgress * (1 - clearProgress);

        const cardScale = card.isTarget ? 1 : (0.88 + 0.12 * inProgress) * (1 - 0.2 * clearProgress);

        if (cardOpacity <= 0) return null;

        const bobY = Math.sin(f * 0.1 + card.phase) * 4;

        // Selection & expand simultaneously the moment others start disappearing (f = 65 -> 90)
        const selectT = card.isTarget ? clampProgress(f, 60, 78) : 0;
        const expandT = card.isTarget ? clampProgress(f, 65, 88) : 0;
        const selectSpring = card.isTarget
          ? spring({fps, frame: f - 60, config: {damping: 14, stiffness: 120, mass: 0.8}})
          : 0;
        const selectPop = card.isTarget ? 1 + 0.02 * selectSpring : 1;

        const initialWidth = 520;
        const widthVal = card.isTarget
          ? interpolate(expandT, [0, 1], [initialWidth, CARD_WIDTH])
          : (card.text.length > 40 ? 520 : 360);

        const borderColor = selectT > 0
          ? `rgba(59, 130, 246, ${0.5 + 0.5 * selectT})`
          : 'rgba(71, 85, 105, 0.5)';
        const shadow = selectT > 0
          ? `0 16px 45px rgba(37, 99, 235, ${0.45 * selectT})`
          : '0 10px 30px rgba(0, 0, 0, 0.4)';

        return (
          <div
            key={card.id}
            style={{
              position: 'absolute',
              left: card.x,
              top: card.y + (card.isTarget ? 0 : bobY),
              width: widthVal,
              transform: `translate(-50%, -50%) scale(${cardScale * selectPop})`,
              opacity: cardOpacity,
              background: selectT > 0
                ? `linear-gradient(135deg, rgba(37, 99, 235, ${selectT}) 0%, rgba(29, 78, 216, ${selectT}) 100%), rgba(15, 23, 42, 0.9)`
                : 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(16px)',
              border: `1.5px solid ${borderColor}`,
              borderRadius: 18,
              padding: '16px 24px',
              color: '#F8FAFC',
              fontSize: selectT > 0 ? 16 : 15,
              fontWeight: 500,
              boxShadow: shadow,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              zIndex: card.isTarget ? 20 : 10,
            }}
          >
            <img src={logoUrl} alt="Icon" style={{width: 28, height: 28, borderRadius: 8, flexShrink: 0}} />
            <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, lineHeight: 1.4}}>
              {card.text}
            </span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
