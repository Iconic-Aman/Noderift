import React from 'react';
import {AbsoluteFill, interpolate, staticFile} from 'remotion';
import {clampProgress} from '../../components';

interface IntroCardDemoProps {
  frame: number;
}

export const IntroCardDemo: React.FC<IntroCardDemoProps> = ({frame}) => {
  const logoUrl = staticFile('noderift-icon.jpg');

  if (frame > 105) return null;

  const fadeOut = interpolate(frame, [85, 105], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const text1Opacity = clampProgress(frame, 0, 20);
  const text2Opacity = clampProgress(frame, 30, 50);
  const meetOpacity = clampProgress(frame, 55, 75);
  const meetScale = interpolate(clampProgress(frame, 55, 75), [0, 1], [0.8, 1]);

  return (
    <AbsoluteFill
      style={{
        background: '#070A12',
        zIndex: 50,
        opacity: fadeOut,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: 250,
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.3) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <div style={{color: '#94A3B8', fontSize: 24, fontWeight: 500, opacity: text1Opacity, marginBottom: 12}}>
        Why build workflows manually...
      </div>

      <div style={{color: '#E2E8F0', fontSize: 36, fontWeight: 700, opacity: text2Opacity, marginBottom: 36}}>
        when AI can build them for you?
      </div>

      {meetOpacity > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(37, 99, 235, 0.6)',
            backdropFilter: 'blur(16px)',
            borderRadius: 50,
            padding: '12px 32px',
            opacity: meetOpacity,
            transform: `scale(${meetScale})`,
            boxShadow: '0 0 40px rgba(37, 99, 235, 0.45)',
          }}
        >
          <img
            src={logoUrl}
            alt="Noderift Logo"
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'transparent',
              objectFit: 'contain',
              boxShadow: '0 0 16px rgba(37, 99, 235, 0.5)',
            }}
          />
          <span style={{color: '#FFF', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em'}}>
            Meet Noderift
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};
