import React from 'react';
import {AbsoluteFill, staticFile} from 'remotion';

interface EndCardDemoProps {
  endCardT: number;
}

export const EndCardDemo: React.FC<EndCardDemoProps> = ({endCardT}) => {
  const logoUrl = staticFile('noderift-icon.jpg');

  return (
    <AbsoluteFill
      style={{
        opacity: endCardT,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        background: '#070A12',
      }}
    >
      <img
        src={logoUrl}
        alt="Noderift Logo"
        style={{
          width: 80,
          height: 80,
          borderRadius: 22,
          background: 'transparent',
          objectFit: 'contain',
          boxShadow: '0 0 45px rgba(37, 99, 235, 0.6)',
          marginBottom: 20,
        }}
      />
      <div style={{color: '#F8FAFC', fontSize: 52, fontWeight: 800, letterSpacing: '-0.02em'}}>
        Noderift
      </div>
      <div style={{color: '#94A3B8', fontSize: 22, marginTop: 12, fontWeight: 500}}>
        Describe it. Watch it build itself.
      </div>
      <div
        style={{
          color: '#60A5FA',
          fontSize: 16,
          marginTop: 40,
          background: 'rgba(37, 99, 235, 0.15)',
          border: '1px solid rgba(37, 99, 235, 0.4)',
          padding: '8px 20px',
          borderRadius: 999,
          fontWeight: 600,
        }}
      >
        noderift.fun
      </div>
    </AbsoluteFill>
  );
};
