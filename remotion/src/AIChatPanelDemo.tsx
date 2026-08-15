import React from 'react';

const PROMPT_TOP = 320;

export const AIChatPanelDemo: React.FC<{
  chatVisible: boolean;
  chatOpacity: number;
  promptText: string;
}> = ({chatVisible, chatOpacity, promptText}) => {
  if (!chatVisible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: PROMPT_TOP,
        transform: `translate(-50%, ${(1 - chatOpacity) * 20}px) scale(${0.95 + 0.05 * chatOpacity})`,
        transformOrigin: 'top center',
        opacity: chatOpacity,
        width: 860,
        zIndex: 30,
      }}
    >
      <div style={{display: 'flex', alignItems: 'flex-start', gap: 16}}>
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
            }}
          >
            {promptText}
          </div>
        </div>
      </div>
    </div>
  );
};
