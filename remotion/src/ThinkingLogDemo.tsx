import React from 'react';
import {spring, staticFile, useVideoConfig} from 'remotion';

const AGENT_TOP = 630;

export const ThinkingLogDemo: React.FC<{
  thinkingVisible: boolean;
  frame: number;
  thinkingStart: number;
  thinkingStep: number;
  steps: string[];
}> = ({thinkingVisible, frame, thinkingStart, thinkingStep, steps}) => {
  const {fps} = useVideoConfig();
  const logoUrl = staticFile('noderift-icon.jpg');

  if (!thinkingVisible) return null;

  const localFrame = frame - thinkingStart;
  const groupSpring = spring({fps, frame: localFrame, config: {damping: 18, stiffness: 100, mass: 1}});

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: AGENT_TOP,
        transform: `translateX(-50%) translateY(${(1 - groupSpring) * 12}px)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        opacity: groupSpring,
      }}
    >
      {/* "AI Agent" row: label + bouncing typing dots + glowing logo avatar */}
      <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
        <div style={{color: '#94A3B8', fontSize: 15, fontWeight: 500}}>AI Agent</div>
        <div style={{display: 'flex', gap: 6}}>
          {[0, 1, 2].map((i) => {
            const bounce = Math.sin(localFrame * 0.3 + i * 0.9) * 4;
            return (
              <div key={i} style={{width: 7, height: 7, borderRadius: 3.5, background: '#60A5FA', transform: `translateY(${bounce}px)`}} />
            );
          })}
        </div>
        <img
          src={logoUrl}
          alt="Noderift AI"
          style={{width: 44, height: 44, borderRadius: 14, background: 'transparent', objectFit: 'contain', boxShadow: '0 0 25px rgba(37, 99, 235, 0.6)'}}
        />
      </div>

      {/* Centered step-by-step reasoning list — spring clip-path wipe per step */}
      <div style={{marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center'}}>
        {steps.map((step, i) => {
          const stepStart = thinkingStart + i * thinkingStep;
          if (frame < stepStart) return null;
          const stepSpring = spring({fps, frame: frame - stepStart, config: {damping: 16, stiffness: 120, mass: 0.8}});
          const done = frame >= stepStart + thinkingStep;
          return (
            <div
              key={step}
              style={{
                opacity: Math.min(1, stepSpring),
                color: done ? '#F1F5F9' : '#94A3B8',
                fontSize: 16,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                transform: `translateY(${(1 - stepSpring) * 6}px)`,
                clipPath: `inset(0 ${(1 - stepSpring) * 100}% 0 0)`,
              }}
            >
              <span style={{color: done ? '#22C55E' : '#3B82F6', fontWeight: 700}}>{done ? '✓' : '●'}</span>
              {step}
            </div>
          );
        })}
      </div>
    </div>
  );
};
