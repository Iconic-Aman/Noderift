import React from 'react';
import {staticFile} from 'remotion';
import {SparklesIcon} from '../../icons';

interface TopNavbarProps {
  logoOpacity: number;
  pillActive: boolean;
  runButtonVisible: boolean;
  runButtonOpacity: number;
  runClicked: boolean;
  runFinished: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  logoOpacity,
  pillActive,
  runButtonVisible,
  runButtonOpacity,
  runClicked,
  runFinished,
}) => {
  const logoUrl = staticFile('noderift-icon.jpg');

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 56,
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #1E293B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        opacity: logoOpacity,
        zIndex: 20,
      }}
    >
      {/* Brand & Title */}
      <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#020617',
            border: '1px solid #1E293B',
            borderRadius: 8,
            padding: '5px 10px',
            color: '#94A3B8',
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          <span>← Back</span>
        </div>
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
              boxShadow: '0 0 12px rgba(37, 99, 235, 0.4)',
            }}
          />
          <span style={{color: '#E2E8F0', fontSize: 15, fontWeight: 700}}>Noderift</span>
        </div>
        <div style={{width: 1, height: 20, background: '#334155'}} />
        <span style={{color: '#CBD5E1', fontSize: 14, fontWeight: 500}}>Gmail to Excel Automation</span>
      </div>

      {/* Mode Switcher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: '#020617',
          border: '1px solid #1E293B',
          borderRadius: 10,
          padding: 3,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 14px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            color: pillActive ? '#94A3B8' : '#F1F5F9',
            background: pillActive ? 'transparent' : '#1E293B',
            cursor: 'pointer',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3l7 18 3-7 7-3L3 3z" />
          </svg>
          <span>Manual</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 14px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            color: '#FFF',
            background: pillActive
              ? 'linear-gradient(90deg, #2563EB, #1D4ED8)'
              : 'transparent',
            boxShadow: pillActive ? '0 4px 14px rgba(37, 99, 235, 0.4)' : 'none',
            cursor: 'pointer',
          }}
        >
          <SparklesIcon size={14} color="#FFF" />
          <span>AI Mode</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
        {runButtonVisible && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 16px',
              borderRadius: 8,
              background: runFinished ? '#22C55E' : '#2563EB',
              color: '#FFF',
              fontSize: 13,
              fontWeight: 600,
              opacity: runButtonOpacity,
              boxShadow: '0 2px 10px rgba(37, 99, 235, 0.3)',
            }}
          >
            {runFinished ? '✓ Completed' : runClicked ? 'Running…' : '▶ Run'}
          </div>
        )}
      </div>
    </div>
  );
};
