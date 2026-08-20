import React from 'react';
import {staticFile} from 'remotion';
import {SparklesIcon, UserIcon, SendIcon} from '../../icons';

interface AIChatPanelDemoProps {
  chatVisible: boolean;
  isDocked: boolean;
  chatY: number;
  chatOpacity: number;
  typedText: string;
  showCursorBlink: boolean;
  promptText: string;
}

export const AIChatPanelDemo: React.FC<AIChatPanelDemoProps> = ({
  chatVisible,
  isDocked,
  chatY,
  chatOpacity,
  typedText,
  showCursorBlink,
  promptText,
}) => {
  const logoUrl = staticFile('noderift-icon.jpg');

  if (isDocked) {
    return (
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(37, 99, 235, 0.5)',
          borderRadius: 30,
          padding: '8px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 0 20px rgba(37, 99, 235, 0.25)',
        }}
      >
        <SparklesIcon size={16} color="#60A5FA" />
        <span style={{color: '#E2E8F0', fontSize: 14, fontWeight: 500}}>
          Prompt: "{promptText.slice(0, 45)}…"
        </span>
      </div>
    );
  }

  if (!chatVisible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        right: 40,
        top: chatY,
        width: 420,
        height: 390,
        borderRadius: 20,
        background: 'rgba(15, 23, 42, 0.94)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(51, 65, 85, 0.6)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(37, 99, 235, 0.2)',
        opacity: chatOpacity,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
          background: 'rgba(30, 41, 59, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <img
            src={logoUrl}
            alt="Noderift Logo"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'transparent',
              objectFit: 'contain',
              boxShadow: '0 0 10px rgba(37, 99, 235, 0.4)',
            }}
          />
          <div>
            <div style={{color: '#F8FAFC', fontSize: 15, fontWeight: 600}}>Noderift AI</div>
            <div style={{color: '#94A3B8', fontSize: 12}}>Workflow Assistant</div>
          </div>
        </div>
      </div>

      <div style={{flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'hidden'}}>
        <div style={{display: 'flex', gap: 10}}>
          <img
            src={logoUrl}
            alt="Noderift AI"
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              flexShrink: 0,
            }}
          />
          <div style={{
            background: 'rgba(30, 41, 59, 0.8)',
            borderRadius: '4px 16px 16px 16px',
            padding: '10px 14px',
            color: '#CBD5E1',
            fontSize: 13,
            maxWidth: '82%',
            lineHeight: 1.4,
          }}>
            Describe what you want to automate and I'll build it for you.
          </div>
        </div>

        {typedText && (
          <div style={{display: 'flex', gap: 10, justifyContent: 'flex-end'}}>
            <div style={{
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              borderRadius: '16px 4px 16px 16px',
              padding: '10px 14px',
              color: '#FFF',
              fontSize: 13,
              maxWidth: '82%',
              lineHeight: 1.4,
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            }}>
              {typedText}
              {showCursorBlink && <span>|</span>}
            </div>
            <div style={{
              width: 28, height: 28, borderRadius: 14,
              background: '#334155',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <UserIcon size={14} />
            </div>
          </div>
        )}
      </div>

      <div style={{padding: 12, borderTop: '1px solid rgba(51, 65, 85, 0.5)', background: 'rgba(15, 23, 42, 0.6)'}}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid rgba(71, 85, 105, 0.5)',
          borderRadius: 12, padding: '8px 12px',
        }}>
          <div style={{flex: 1, color: typedText ? '#F8FAFC' : '#64748B', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
            {typedText || 'Describe your automation...'}
          </div>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: typedText ? 'linear-gradient(135deg, #2563EB, #1D4ED8)' : '#334155',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <SendIcon size={14} color={typedText ? '#FFF' : '#64748B'} />
          </div>
        </div>
      </div>
    </div>
  );
};
