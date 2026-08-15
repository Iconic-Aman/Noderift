import React from 'react';

const CENTER_TOP = 320;

export const AIChatPanelDemo: React.FC<{
  chatVisible: boolean;
  isDocked: boolean;
  chatY: number;
  chatOpacity: number;
  typedText: string;
  showCursorBlink: boolean;
  promptText: string;
}> = ({chatVisible, chatOpacity, typedText, showCursorBlink}) => {
  if (!chatVisible) return null;

  const scale = 0.95 + 0.05 * chatOpacity;
  const rise = (1 - chatOpacity) * 20;

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: CENTER_TOP,
        transform: `translate(-50%, ${rise}px) scale(${scale})`,
        transformOrigin: 'top center',
        opacity: chatOpacity,
        width: 860,
      }}
    >
      <div style={{display: 'flex', alignItems: 'flex-start', gap: 16}}>
        {/* User avatar */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            background: '#1E293B',
            border: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" />
          </svg>
        </div>

        {/* Name + Prompt bubble */}
        <div style={{flex: 1}}>
          <div style={{color: '#94A3B8', fontSize: 14, fontWeight: 500, marginBottom: 8}}>You</div>
          <div
            style={{
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              borderRadius: '4px 20px 20px 20px',
              padding: '18px 24px',
              color: '#FFF',
              fontSize: 21,
              fontWeight: 500,
              lineHeight: 1.45,
              boxShadow: '0 12px 35px rgba(37, 99, 235, 0.4)',
              minHeight: 32,
            }}
          >
            {typedText}
            {showCursorBlink && <span>|</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
