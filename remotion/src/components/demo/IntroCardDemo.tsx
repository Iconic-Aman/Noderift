import React from 'react';
import {AbsoluteFill, interpolate, spring, staticFile, useVideoConfig} from 'remotion';


// SFX: low ambient hum starts

interface IntroCardDemoProps {
  frame: number;
}

export const IntroCardDemo: React.FC<IntroCardDemoProps> = ({frame}) => {
  const {fps} = useVideoConfig();
  const logoUrl = staticFile('noderift-icon.jpg');

  if (frame > 310) return null;

  // --- Scene 1: Problem statement (0–45f) ---
  const s1Pop = spring({fps, frame, config: {damping: 18, stiffness: 100, mass: 1}});
  const s1Out = interpolate(frame, [30, 45], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s1Opacity = interpolate(s1Pop, [0, 1], [0, 1]) * s1Out;
  const s1Y = interpolate(s1Pop, [0, 1], [8, 0]);
  // Slow ambient drift behind text - background scale
  const ambientScale = interpolate(frame, [0, 310], [1, 1.02], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // --- Scene 2: "Meet [icon] Noderift" (45–165f) ---
  const meetPop = spring({fps, frame: frame - 45, config: {damping: 12, stiffness: 140, mass: 0.8}});
  const meetX = interpolate(meetPop, [0, 1], [-30, 0]);
  const noderiftPop = spring({fps, frame: frame - 65, config: {damping: 12, stiffness: 140, mass: 0.8}});
  const noderiftX = interpolate(noderiftPop, [0, 1], [30, 0]);
  const logoPop = spring({fps, frame: frame - 88, config: {damping: 12, stiffness: 140, mass: 0.8}});

  // --- Scene 3: Zoom out (158–185f) ---
  const s3Out = interpolate(frame, [158, 185], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s3Scale = interpolate(frame, [158, 185], [1, 0.88], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s2Opacity = frame >= 45 && frame < 158 ? 1 : s3Out;

  // --- Scene 4: Punchier tagline - two lines (190–310f) ---
  // Line 1: "No dragging. No wiring." — clip-path wipe in
  const line1Progress = spring({fps, frame: frame - 190, config: {damping: 18, stiffness: 100, mass: 1}});
  const line1ClipRight = interpolate(line1Progress, [0, 1], [100, 0]);
  const line1Y = interpolate(line1Progress, [0, 1], [8, 0]);

  // Line 2: "Just describe it." — clip-path wipe after line1 settles
  const line2Progress = spring({fps, frame: frame - 218, config: {damping: 15, stiffness: 120, mass: 0.8}});
  const line2ClipRight = interpolate(line2Progress, [0, 1], [100, 0]);
  const line2Y = interpolate(line2Progress, [0, 1], [8, 0]);

  const s4Out = interpolate(frame, [280, 310], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s4Scale = interpolate(frame, [280, 310], [1, 0.88], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s4Opacity = frame >= 190 && frame < 280 ? 1 : s4Out;

  return (
    <AbsoluteFill
      style={{
        background: '#070A12',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Ambient radial glow — nudged slightly per scene for variation */}
      <div
        style={{
          position: 'absolute',
          width: 750,
          height: 750,
          borderRadius: 375,
          transform: `scale(${ambientScale}) translateX(${interpolate(frame, [0, 310], [0, 30])}px)`,
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.28) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Scene 1 — Problem statement with clip-path wipe */}
      {frame < 50 && s1Opacity > 0 && (
        <div
          style={{
            opacity: s1Opacity,
            transform: `translateY(${s1Y}px)`,
            color: '#F1F5F9',
            fontSize: 56,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            textAlign: 'center',
            maxWidth: 1100,
            lineHeight: 1.3,
            clipPath: `inset(0 ${interpolate(s1Pop, [0, 1], [100, 0])}% 0 0)`,
          }}
        >
          Building workflows takes hours.
        </div>
      )}

      {/* Scene 2 & 3 — "Meet [icon] Noderift" */}
      {frame >= 45 && frame < 192 && s2Opacity > 0 && (
        <div style={{display: 'flex', alignItems: 'center', gap: 20, opacity: s2Opacity, transform: `scale(${s3Scale})`}}>
          <span style={{color: '#F8FAFC', fontSize: 64, fontWeight: 800, letterSpacing: '-0.02em', opacity: Math.min(1, meetPop), transform: `translateX(${meetX}px)`}}>
            Meet
          </span>

          {frame >= 88 && (
            // SFX: soft chime on logo pop
            <img
              src={logoUrl}
              alt="Noderift"
              style={{
                width: 68,
                height: 68,
                borderRadius: 18,
                background: 'transparent',
                objectFit: 'contain',
                boxShadow: '0 0 35px rgba(37, 99, 235, 0.7)',
                transform: `scale(${logoPop})`,
                opacity: Math.min(1, logoPop),
              }}
            />
          )}

          <span style={{color: '#3B82F6', fontSize: 64, fontWeight: 800, letterSpacing: '-0.02em', opacity: Math.min(1, noderiftPop), transform: `translateX(${noderiftX}px)`}}>
            Noderift
          </span>
        </div>
      )}

      {/* Scene 4 — Punchier two-line tagline with clip-path wipe reveals */}
      {frame >= 190 && s4Opacity > 0 && (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, opacity: s4Opacity, transform: `scale(${s4Scale})`}}>
          {/* Line 1: "No dragging. No wiring." */}
          <div style={{overflow: 'hidden'}}>
            <div
              style={{
                color: '#F8FAFC',
                fontSize: 64,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                textAlign: 'center',
                transform: `translateY(${line1Y}px)`,
                clipPath: `inset(0 ${line1ClipRight}% 0 0)`,
              }}
            >
              No dragging. No wiring.
            </div>
          </div>

          {/* Line 2: "Just describe it." emerges from inside with spring */}
          {frame >= 215 && (
            <div style={{overflow: 'hidden'}}>
              <div
                style={{
                  color: '#3B82F6',
                  fontSize: 58,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  textAlign: 'center',
                  transform: `translateY(${line2Y}px)`,
                  clipPath: `inset(0 ${line2ClipRight}% 0 0)`,
                }}
              >
                {/* MUSIC BEAT: on "Just describe it." */}
                Just describe it.
              </div>
            </div>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};
