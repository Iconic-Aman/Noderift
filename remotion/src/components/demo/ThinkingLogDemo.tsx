import React from 'react';
import {spring, useVideoConfig} from 'remotion';



interface ThinkingLogDemoProps {
  thinkingVisible: boolean;
  frame: number;
  thinkingStart: number;
  thinkingStep: number;
  steps: string[];
}

export const ThinkingLogDemo: React.FC<ThinkingLogDemoProps> = ({
  thinkingVisible,
  frame,
  thinkingStart,
  thinkingStep,
  steps,
}) => {
  const {fps} = useVideoConfig();
  if (!thinkingVisible) return null;

  const panelSpring = spring({fps, frame: frame - thinkingStart, config: {damping: 18, stiffness: 100, mass: 1}});

  return (
    <div
      style={{
        position: 'absolute',
        left: 50,
        top: 100,
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(51, 65, 85, 0.5)',
        borderRadius: 16,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
        opacity: panelSpring,
        transform: `translateY(${(1 - panelSpring) * 12}px)`,
      }}
    >
      <div style={{color: '#60A5FA', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em'}}>
        Noderift AI Reasoning
      </div>
      {steps.map((step, i) => {
        const stepStart = thinkingStart + i * thinkingStep;
        if (frame < stepStart) return null;
        const stepSpring = spring({fps, frame: frame - stepStart, config: {damping: 16, stiffness: 120, mass: 0.8}});
        const done = frame >= stepStart + thinkingStep;
        const clipRight = (1 - stepSpring) * 100;
        return (
          <div
            key={step}
            style={{
              opacity: Math.min(1, stepSpring),
              color: '#94A3B8',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              transform: `translateY(${(1 - stepSpring) * 6}px)`,
              clipPath: `inset(0 ${clipRight}% 0 0)`,
            }}
          >
            <span style={{color: done ? '#22C55E' : '#2563EB'}}>{done ? '✓' : '●'}</span>
            {step}
          </div>
        );
      })}
    </div>
  );
};
