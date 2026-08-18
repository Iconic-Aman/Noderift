import React from 'react';
import {AbsoluteFill, interpolate, spring, staticFile} from 'remotion';
import {clampProgress} from '../../components';

interface IntroCardDemoProps {
  frame: number;
}

export const IntroCardDemo: React.FC<IntroCardDemoProps> = ({frame}) => {
  const logoUrl = staticFile('noderift-icon.jpg');

  if (frame > 310) return null;

  // --- Scene 1: Problem statement (0–50f) ---
  const s1In = clampProgress(frame, 0, 18);
  const s1Out = interpolate(frame, [36, 50], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s1Opacity = s1In * s1Out;
  const s1Scale = interpolate(s1In, [0, 1], [0.94, 1]);

  // --- Scene 2: "Meet [icon] Noderift" (50–160f) ---
  const meetIn = clampProgress(frame, 50, 70);
  const meetX = interpolate(meetIn, [0, 1], [-30, 0]);

  const noderiftIn = clampProgress(frame, 70, 90);
  const noderiftX = interpolate(noderiftIn, [0, 1], [30, 0]);

  const logoSpring = spring({
    frame: frame - 90,
    fps: 30,
    config: {damping: 12, mass: 0.6},
  });

  // --- Scene 3: Zoom out & disappear (160–190f) ---
  const s3Out = interpolate(frame, [160, 190], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s3Scale = interpolate(frame, [160, 190], [1, 0.85], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s2Opacity = frame >= 50 && frame < 160 ? 1 : s3Out;

  // --- Scene 4: Tagline reveal (190–310f) ---
  const t1In = clampProgress(frame, 190, 210);

  const emergeSpring = spring({
    frame: frame - 212,
    fps: 30,
    config: {damping: 13, mass: 0.5},
  });

  const t2Scale = interpolate(emergeSpring, [0, 1], [0.15, 1]);
  const t2Y = interpolate(emergeSpring, [0, 1], [-45, 10]);
  const t2Opacity = interpolate(emergeSpring, [0, 0.3, 1], [0, 1, 1]);

  const s4Out = interpolate(frame, [280, 310], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s4Scale = interpolate(frame, [280, 310], [1, 0.88], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s4Opacity = frame >= 190 && frame < 280 ? Math.min(1, t1In) : s4Out;

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
      <div
        style={{
          position: 'absolute',
          width: 700,
          height: 700,
          borderRadius: 350,
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.28) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Scene 1 — Problem statement */}
      {frame < 55 && s1Opacity > 0 && (
        <div
          style={{
            opacity: s1Opacity,
            transform: `scale(${s1Scale})`,
            color: '#F1F5F9',
            fontSize: 54,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            textAlign: 'center',
            maxWidth: 1100,
            lineHeight: 1.3,
          }}
        >
          Building workflows takes hours.
        </div>
      )}

      {/* Scene 2 & 3 — "Meet [icon] Noderift" */}
      {frame >= 50 && frame < 195 && s2Opacity > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            opacity: s2Opacity,
            transform: `scale(${s3Scale})`,
          }}
        >
          <span
            style={{
              color: '#F8FAFC',
              fontSize: 64,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              opacity: meetIn,
              transform: `translateX(${meetX}px)`,
            }}
          >
            Meet
          </span>

          {frame >= 90 && (
            <img
              src={logoUrl}
              alt="Noderift Mark"
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: 'transparent',
                objectFit: 'contain',
                boxShadow: '0 0 35px rgba(37, 99, 235, 0.65)',
                transform: `scale(${logoSpring})`,
              }}
            />
          )}

          <span
            style={{
              color: '#3B82F6',
              fontSize: 64,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              opacity: noderiftIn,
              transform: `translateX(${noderiftX}px)`,
            }}
          >
            Noderift
          </span>
        </div>
      )}

      {/* Scene 4 — "The AI-powered" (Bigger 64px) with "workflow automation tool" emerging from inside */}
      {frame >= 190 && s4Opacity > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: s4Opacity,
            transform: `scale(${s4Scale})`,
            position: 'relative',
          }}
        >
          <div
            style={{
              color: '#F8FAFC',
              fontSize: 64,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              opacity: t1In,
              textAlign: 'center',
              zIndex: 2,
            }}
          >
            The AI-powered
          </div>

          <div
            style={{
              opacity: t2Opacity,
              transform: `translateY(${t2Y}px) scale(${t2Scale})`,
              color: '#3B82F6',
              fontSize: 52,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              textAlign: 'center',
              zIndex: 1,
            }}
          >
            workflow automation tool
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
