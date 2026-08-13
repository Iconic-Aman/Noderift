import React from 'react';
import {clampProgress} from '../../components';

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
  if (!thinkingVisible) return null;

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
      }}
    >
      <div
        style={{
          color: '#60A5FA',
          fontSize: 13,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Noderift AI Reasoning
      </div>
      {steps.map((step, i) => {
        const stepStart = thinkingStart + i * thinkingStep;
        if (frame < stepStart) return null;
        const op = clampProgress(frame, stepStart, stepStart + 15);
        const done = frame >= stepStart + thinkingStep;
        return (
          <div
            key={step}
            style={{
              opacity: op,
              color: '#94A3B8',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
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
