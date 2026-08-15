import React from 'react';
import {interpolate} from 'remotion';
import {SparklesIcon} from './icons';

const CENTER_X = 960;
const BUTTON_Y = 480;
const PROMPT_TOP = 320;

export const AIChatPanelDemo: React.FC<{
  chatVisible: boolean;
  isDocked: boolean;
  chatY: number;
  chatOpacity: number;
  typedText: string;
  showCursorBlink: boolean;
  promptText: string;
  frame: number;
  aiModeClickFrame: number;
}> = ({chatVisible, chatOpacity, typedText, showCursorBlink, frame, aiModeClickFrame}) => {
  // Animated Centered AI Mode Button before prompt begins
  const buttonAppear = interpolate(frame, [95, 120], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const buttonScale = interpolate(frame, [95, 120, aiModeClickFrame - 3, aiModeClickFrame], [0.7, 1, 1, 0.9], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const isClicked = frame >= aiModeClickFrame;
  const clickWave = interpolate(frame, [aiModeClickFrame, aiModeClickFrame + 15], [1, 2.2], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const waveOpacity = interpolate(frame, [aiModeClickFrame, aiModeClickFrame + 15], [0.8, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Pulse animation for idle button
  const pulseGlow = 0.5 + 0.3 * Math.sin(frame * 0.15);

  return (
    <>
      {/* Centered Animated AI Mode Button (appears before click) */}
      {!isClicked && buttonAppear > 0 && (
        <div
          style={{
            position: 'absolute',
            left: CENTER_X,
            top: BUTTON_Y,
            transform: `translate(-50%, -50%) scale(${buttonScale})`,
            zIndex: 40,
            opacity: buttonAppear,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              border: '1px solid rgba(147, 197, 253, 0.6)',
              borderRadius: 40,
              padding: '16px 36px',
              color: '#FFF',
              fontSize: 22,
              fontWeight: 700,
              boxShadow: `0 0 ${30 * pulseGlow}px rgba(37, 99, 235, ${pulseGlow})`,
              cursor: 'pointer',
            }}
          >
            <SparklesIcon size={24} color="#FFF" />
            <span>AI Mode</span>
          </div>
        </div>
      )}

      {/* Click ripple shockwave animation */}
      {isClicked && waveOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            left: CENTER_X,
            top: BUTTON_Y,
            width: 200,
            height: 60,
            borderRadius: 40,
            border: '2px solid #60A5FA',
            transform: `translate(-50%, -50%) scale(${clickWave})`,
            opacity: waveOpacity,
            pointerEvents: 'none',
            zIndex: 39,
          }}
        />
      )}

      {/* User prompt typing block (expands after click) */}
      {chatVisible && isClicked && (
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
                  minHeight: 32,
                }}
              >
                {typedText}
                {showCursorBlink && <span>|</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
