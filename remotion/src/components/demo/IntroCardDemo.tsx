import React from 'react';
import {AbsoluteFill, interpolate, staticFile} from 'remotion';
import {clampProgress} from '../../components';

interface IntroCardDemoProps {
  frame: number;
}

export const IntroCardDemo: React.FC<IntroCardDemoProps> = ({frame}) => {
  const logoUrl = staticFile('noderift-icon.jpg');

  // Return null once intro finishes (frame 310+)
  if (frame > 310) return null;

  // --- Scene 1: Problem statement (0–50f) ---
  const s1In = clampProgress(frame, 0, 15);
  const s1Out = interpolate(frame, [35, 50], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s1Opacity = s1In * s1Out;

  // --- Scene 2: "Meet [icon] Noderift" (50–160f) ---
  const meetIn = clampProgress(frame, 50, 70);
  const meetX = interpolate(meetIn, [0, 1], [-40, 0]);

  const noderiftIn = clampProgress(frame, 70, 90);
  const noderiftX = interpolate(noderiftIn, [0, 1], [40, 0]);

  const logoIn = clampProgress(frame, 90, 110);
  const logoScale = interpolate(logoIn, [0, 0.7, 1], [0, 1.2, 1]);

  // --- Scene 3: Zoom out & disappear (160–190f) ---
  const s3Out = interpolate(frame, [160, 190], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s3Scale = interpolate(frame, [160, 190], [1, 0.85], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s2Opacity = (frame >= 50 && frame < 160 ? 1 : s3Out);

  // --- Scene 4: Tagline reveal (190–310f) ---
  const t1In = clampProgress(frame, 190, 215);
  const t2In = clampProgress(frame, 225, 250);

  const t1SlideX = interpolate(t2In, [0, 1], [0, -140]);
  const t1Scale = interpolate(t2In, [0, 1], [1, 0.9]);

  const s4Out = interpolate(frame, [280, 310], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s4Scale = interpolate(frame, [280, 310], [1, 0.85], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s4Opacity = (frame >= 190 && frame < 280 ? Math.min(1, t1In) : s4Out);

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
      {/* Background ambient radial glow */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: 300,
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.25) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />

      {/* Scene 1 — Problem statement */}
      {frame < 55 && s1Opacity > 0 && (
        <div
          style={{
            opacity: s1Opacity,
            color: '#94A3B8',
            fontSize: 32,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            textAlign: 'center',
          }}
        >
          Building workflows takes hours.
        </div>
      )}

      {/* Scene 2 & 3 — "Meet [icon] Noderift" reveal & zoom out */}
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
          {/* "Meet" */}
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

          {/* Logo Mark Pop-in */}
          {logoIn > 0 && (
            <img
              src={logoUrl}
              alt="Noderift Mark"
              style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                background: 'transparent',
                objectFit: 'contain',
                boxShadow: '0 0 30px rgba(37, 99, 235, 0.6)',
                transform: `scale(${logoScale})`,
                opacity: logoIn,
              }}
            />
          )}

          {/* "Noderift" */}
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

      {/* Scene 4 — Tagline reveal & zoom out */}
      {frame >= 190 && s4Opacity > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            opacity: s4Opacity,
            transform: `scale(${s4Scale})`,
          }}
        >
          <span
            style={{
              color: '#F8FAFC',
              fontSize: 52,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              opacity: t1In,
              transform: `translateX(${t1SlideX}px) scale(${t1Scale})`,
              whiteSpace: 'nowrap',
            }}
          >
            The AI-powered
          </span>

          {t2In > 0 && (
            <span
              style={{
                color: '#3B82F6',
                fontSize: 52,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                opacity: t2In,
                whiteSpace: 'nowrap',
              }}
            >
              workflow automation tool
            </span>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};
