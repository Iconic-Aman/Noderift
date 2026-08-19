import React from 'react';
import {AbsoluteFill, interpolate, spring, staticFile, useVideoConfig} from 'remotion';
import {PROMPT_TEXT} from './constants';
import {clampProgress} from './components';

// Shared constants — chat bubble must use these same values
export const CARD_CENTER_X = 960;
export const CARD_CENTER_Y = 480;
export const CARD_WIDTH = 1100;

const CARDS = [
  {id: 0, text: 'Check Gmail every hour and text me if an email from my boss arrives', x: 340, y: 260, phase: 0},
  {id: 1, text: 'Scrape a news site every morning and email me the top headlines', x: 1450, y: 220, phase: 1.2},
  {id: 2, text: PROMPT_TEXT, x: CARD_CENTER_X, y: CARD_CENTER_Y, isTarget: true, phase: 2.1},
  {id: 3, text: 'Run a Python script on new webhook data and save the results to my database', x: 320, y: 730, phase: 3.4},
  {id: 4, text: 'Every Friday at 5 PM, query my database for pending orders and email me the list', x: 1460, y: 710, phase: 4.5},
  {id: 5, text: 'Watch for new webhook events and send an SMS alert when one comes in', x: 880, y: 860, phase: 5.2},
];

export const WorkflowGalleryDemo: React.FC<{frame: number}> = ({frame}) => {
  // Extend window by 20 frames to overlap with chat bubble (crossfade)
  if (frame < 325 || frame > 495) return null;

  const {fps} = useVideoConfig();
  const f = frame - 325;
  const logoUrl = staticFile('noderift-icon.jpg');

  // Morph: card glides to exact chat-bubble position (120->150)
  const morphT = clampProgress(f, 120, 150);
  const targetWidth = interpolate(morphT, [0, 1], [CARD_WIDTH, CARD_WIDTH]);

  // Crossfade-out: gallery fades out as chat fades in (150->170)
  const galleryOut = interpolate(f, [150, 170], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{fontFamily: 'Inter, system-ui, sans-serif'}}>


      {CARDS.map((card, i) => {
        const staggerStart = i * 4;
        const inProgress = clampProgress(f, staggerStart, staggerStart + 12);
        if (inProgress <= 0) return null;

        const clearProgress = card.isTarget ? 0 : clampProgress(f, 95 + i * 2, 115 + i * 2);
        const cardOpacity = inProgress * (1 - clearProgress) * galleryOut;
        const cardScale = (0.88 + 0.12 * inProgress) * (1 - 0.2 * clearProgress);

        if (cardOpacity <= 0) return null;

        const bobY = Math.sin(f * 0.1 + card.phase) * 4;

        // Selection animation: target card starts dark like others, then lights up blue (frames 65->85)
        const selectT = card.isTarget ? clampProgress(f, 65, 85) : 0;
        
        const initialWidth = card.text.length > 40 ? 520 : 360;
        const widthVal = card.isTarget ? interpolate(morphT, [0, 1], [initialWidth, targetWidth]) : initialWidth;

        const selectSpring = card.isTarget
          ? spring({fps, frame: f - 65, config: {damping: 14, stiffness: 120, mass: 0.8}})
          : 0;
        const selectPop = card.isTarget ? interpolate(selectSpring, [0, 0.5, 1], [1, 1.05, 1]) : 1;

        // Morph scale during transition to chat bubble
        const morphSpring = card.isTarget
          ? spring({fps, frame: f - 120, config: {damping: 18, stiffness: 100, mass: 1}})
          : 1;
        const scaleBoost = card.isTarget 
          ? cardScale * selectPop * interpolate(morphSpring, [0, 1], [1, 1.02]) 
          : cardScale;

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
              transform: `translate(-50%, -50%) scale(${scaleBoost})`,
              opacity: cardOpacity,
              background: selectT > 0
                ? `linear-gradient(135deg, rgba(37, 99, 235, ${selectT}) 0%, rgba(29, 78, 216, ${selectT}) 100%), rgba(15, 23, 42, 0.9)`
                : 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(16px)',
              border: `1.5px solid ${borderColor}`,
              borderRadius: selectT > 0 ? 20 : 16,
              padding: '18px 24px',
              color: '#F8FAFC',
              fontSize: selectT > 0 ? 17 : 16,
              fontWeight: 500,
              boxShadow: shadow,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <img src={logoUrl} alt="Icon" style={{width: 28, height: 28, borderRadius: 8, flexShrink: 0}} />
            <span style={{whiteSpace: card.isTarget && morphT > 0.5 ? 'normal' : 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, lineHeight: 1.4}}>
              {card.text}
            </span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
