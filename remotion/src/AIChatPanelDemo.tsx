import React from 'react';
import {staticFile} from 'remotion';
import {CARD_CENTER_X, CARD_CENTER_Y, CARD_WIDTH} from './WorkflowGalleryDemo';

// Width must be wide enough so PROMPT_TEXT stays single line
// PROMPT_TEXT = ~87 chars. At fontSize 15px ~7.8px/char = ~679px text area.
// With avatar (36px) + gap (16px) + "You" col padding = ~72px overhead.
// So bubble width = 679 + 72 + 48 (padding each side) = ~800px min.
// We use CARD_WIDTH (1100+) so text is comfortably single line.
const BUBBLE_WIDTH = Math.max(CARD_WIDTH, 1200);

export const AIChatPanelDemo: React.FC<{
  chatVisible: boolean;
  chatOpacity: number;
  promptText: string;
}> = ({chatVisible, chatOpacity, promptText}) => {
  const logoUrl = staticFile('noderift-icon.jpg');
  if (!chatVisible) return null;

  const rise = (1 - chatOpacity) * 10;
  const scale = 0.97 + 0.03 * chatOpacity;

  return (
    <div
      style={{
        position: 'absolute',
        left: CARD_CENTER_X,
        top: CARD_CENTER_Y,
        width: BUBBLE_WIDTH,
        transform: `translate(-50%, -50%) translateY(${rise}px) scale(${scale})`,
        transformOrigin: 'center center',
        opacity: chatOpacity,
        zIndex: 30,
      }}
    >
      {/* Outer card — same style as gallery target card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
          borderRadius: 20,
          padding: '18px 28px',
          boxShadow: '0 16px 45px rgba(37, 99, 235, 0.45)',
          border: '1.5px solid rgba(59, 130, 246, 0.6)',
        }}
      >
        {/* Avatar */}
        <img
          src={logoUrl}
          alt="You"
          style={{width: 32, height: 32, borderRadius: 9, flexShrink: 0, objectFit: 'contain'}}
        />

        {/* "You" label inline + prompt on same line */}
        <div style={{display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0}}>
          <span style={{color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', flexShrink: 0}}>
            You
          </span>
          <span
            style={{
              color: '#FFF',
              fontSize: 15,
              fontWeight: 500,
              lineHeight: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {promptText}
          </span>
        </div>
      </div>
    </div>
  );
};
