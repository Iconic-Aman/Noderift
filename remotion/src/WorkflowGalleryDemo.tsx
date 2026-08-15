import React from 'react';
import {AbsoluteFill, interpolate, staticFile} from 'remotion';
import {PROMPT_TEXT} from './constants';
import {CursorDot, clampProgress} from './components';

const CARDS = [
  {id: 0, text: 'Summarize new Slack messages daily', x: 280, y: 260, phase: 0},
  {id: 1, text: 'Backup Google Drive files weekly', x: 1400, y: 240, phase: 1.2},
  {id: 2, text: PROMPT_TEXT, x: 960, y: 480, isTarget: true, phase: 2.1},
  {id: 3, text: 'Post new blog articles to Twitter', x: 300, y: 720, phase: 3.4},
  {id: 4, text: 'Sync Stripe payments to Notion', x: 1420, y: 700, phase: 4.5},
  {id: 5, text: 'Alert Slack on new GitHub issue', x: 860, y: 840, phase: 5.2},
];

export const WorkflowGalleryDemo: React.FC<{frame: number}> = ({frame}) => {
  if (frame < 310 || frame > 560) return null;

  const f = frame - 310; // local frame 0 to 250
  const logoUrl = staticFile('noderift-icon.jpg');

  // Morph values (localFrame 210->250)
  const morphT = clampProgress(f, 210, 250);
  const targetX = interpolate(morphT, [0, 1], [960, 960]);
  const targetY = interpolate(morphT, [0, 1], [480, 380]);
  const targetWidth = interpolate(morphT, [0, 1], [720, 860]);
  const isMorphed = morphT > 0.8;

  return (
    <AbsoluteFill style={{background: '#0B0F19', zIndex: 40, fontFamily: 'Inter, system-ui, sans-serif'}}>
      <AbsoluteFill style={{backgroundImage: `radial-gradient(rgba(148, 163, 184, 0.15) 1px, transparent 1px)`, backgroundSize: '32px 32px', opacity: 0.7}} />

      {/* Cards list */}
      {CARDS.map((card, i) => {
        const staggerStart = i * 7;
        const inProgress = clampProgress(f, staggerStart, staggerStart + 18);
        if (inProgress <= 0) return null;

        // Step 5: non-target clear away (165->200)
        const clearProgress = card.isTarget ? 0 : clampProgress(f, 165 + i * 4, 195 + i * 4);
        const cardOpacity = inProgress * (1 - clearProgress);
        const cardScale = (0.85 + 0.15 * inProgress) * (1 - 0.2 * clearProgress);

        if (cardOpacity <= 0) return null;

        // Step 2: idle floating drift (50->110)
        const bobY = Math.sin(f * 0.08 + card.phase) * 5;

        // Step 4: target highlight (150->165)
        const highlightT = card.isTarget ? clampProgress(f, 150, 165) : 0;
        const borderColor = highlightT > 0 ? '#3B82F6' : 'rgba(71, 85, 105, 0.5)';
        const shadow = highlightT > 0 ? '0 0 35px rgba(59, 130, 246, 0.5)' : '0 10px 30px rgba(0, 0, 0, 0.4)';

        const posX = card.isTarget ? targetX : card.x;
        const posY = (card.isTarget ? targetY : card.y) + bobY;
        const widthVal = card.isTarget ? targetWidth : (card.text.length > 50 ? 720 : 380);

        return (
          <div
            key={card.id}
            style={{
              position: 'absolute',
              left: posX,
              top: posY,
              width: widthVal,
              transform: `translate(-50%, -50%) scale(${cardScale})`,
              opacity: cardOpacity,
              background: card.isTarget && isMorphed ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(16px)',
              border: `1.5px solid ${borderColor}`,
              borderRadius: card.isTarget && isMorphed ? 20 : 16,
              padding: '16px 24px',
              color: '#F8FAFC',
              fontSize: 16,
              fontWeight: 500,
              boxShadow: shadow,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <img src={logoUrl} alt="Icon" style={{width: 28, height: 28, borderRadius: 8, flexShrink: 0}} />
            <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1}}>
              {card.text}
            </span>
          </div>
        );
      })}

      {/* Step 3 & 4: Cursor movement & click target card */}
      <CursorDot
        frame={f}
        fromX={1600} fromY={300}
        toX={960} toY={480}
        moveStart={110} moveEnd={150}
        clickFrame={150}
        visibleFrom={105} visibleTo={170}
      />
    </AbsoluteFill>
  );
};
