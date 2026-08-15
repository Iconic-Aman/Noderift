import React from 'react';
import {staticFile} from 'remotion';

const AGENT_TOP = 520;

export const ThinkingLogDemo: React.FC<{
  thinkingVisible: boolean;
  frame: number;
  thinkingStart: number;
  thinkingStep: number;
  steps: string[];
}> = ({thinkingVisible, frame, thinkingStart, thinkingStep, steps}) => {
  const logoUrl = staticFile('noderift-icon.jpg');

  if (!thinkingVisible) return null;

  const localFrame = frame - thinkingStart;
  const groupOpacity = Math.min(1, Math.max(0, localFrame / 12));

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: AGENT_TOP,
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        opacity: groupOpacity,
      }}
    >
      {/* "AI Agent" row: label + bouncing typing dots + glowing logo avatar */}
      <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
        <div style={{color: '#94A3B8', fontSize: 15, fontWeight: 500}}>AI Agent</div>
        <div style={{display: 'flex', gap: 6}}>
          {[0, 1, 2].map((i) => {
            const bounce = Math.sin(localFrame * 0.3 + i * 0.9) * 4;
            return (
              <div
                key={i}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 3.5,
                  background: '#60A5FA',
                  transform: `translateY(${bounce}px)`,
                }}
              />
            );
          })}
        </div>
        <img
          src={logoUrl}
          alt="Noderift AI"
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: 'transparent',
            objectFit: 'contain',
            boxShadow: '0 0 25px rgba(37, 99, 235, 0.6)',
          }}
        />
      </div>

      {/* Centered step-by-step reasoning list */}
      <div style={{marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center'}}>
        {steps.map((step, i) => {
          const stepStart = thinkingStart + i * thinkingStep;
          if (frame < stepStart) return null;
          const op = Math.min(1, Math.max(0, (frame - stepStart) / 15));
          const done = frame >= stepStart + thinkingStep;
          return (
            <div
              key={step}
              style={{
                opacity: op,
                color: '#94A3B8',
                fontSize: 16,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{color: done ? '#22C55E' : '#3B82F6'}}>{done ? '✓' : '●'}</span>
              {step}
            </div>
          );
        })}
      </div>
    </div>
  );
};
