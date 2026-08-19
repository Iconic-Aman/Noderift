import React from 'react';
import {AbsoluteFill, interpolate, spring, staticFile, useVideoConfig} from 'remotion';
// import {loadFont} from '@remotion/google-fonts/Sora';

// const {fontFamily: soraFont} = loadFont('normal', {weights: ['700', '800']});

// SFX: low ambient hum starts

interface IntroCardDemoProps {
  frame: number;
}

// Total intro duration: 425 frames
// Scene 1:   0–45    Problem statement
// Scene 2/3: 45–192  Meet Noderift
// Scene NEW: 192–307 The AI-powered → slides left → workflow automation tool bursts in
// Scene 4:   307–425 No dragging. No wiring. / Just describe it.

export const IntroCardDemo: React.FC<IntroCardDemoProps> = ({frame}) => {
  const {fps} = useVideoConfig();
  const logoUrl = staticFile('noderift-icon.jpg');

  if (frame > 425) return null;

  const ambientScale = interpolate(frame, [0, 425], [1, 1.02], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // ── Scene 1: Problem statement (0–45f) ──────────────────────────────────
  const s1Pop = spring({fps, frame, config: {damping: 18, stiffness: 100, mass: 1}});
  const s1Out = interpolate(frame, [30, 45], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s1Opacity = interpolate(s1Pop, [0, 1], [0, 1]) * s1Out;
  const s1Y = interpolate(s1Pop, [0, 1], [8, 0]);

  // ── Scene 2/3: Meet [icon] Noderift (45–192f) ────────────────────────────
  const meetPop = spring({fps, frame: frame - 45, config: {damping: 12, stiffness: 140, mass: 0.8}});
  const meetX = interpolate(meetPop, [0, 1], [-30, 0]);
  const noderiftPop = spring({fps, frame: frame - 65, config: {damping: 12, stiffness: 140, mass: 0.8}});
  const noderiftX = interpolate(noderiftPop, [0, 1], [30, 0]);
  const logoPop = spring({fps, frame: frame - 88, config: {damping: 12, stiffness: 140, mass: 0.8}});
  const s3Out = interpolate(frame, [158, 185], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s3Scale = interpolate(frame, [158, 185], [1, 0.88], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s2Opacity = frame >= 45 && frame < 158 ? 1 : s3Out;

  // ── Scene NEW: "The AI-powered" → slides left → "workflow automation tool" bursts in (192–307f) ──
  const sNewLocal = frame - 192; // local 0..115

  // "The AI-powered" springs in at center (local 0–20)
  const aiPoweredIn = spring({fps, frame: sNewLocal, config: {damping: 14, stiffness: 130, mass: 0.9}});
  // Then slides LEFT (local 35–65) — spring physics slide
  const slideSpring = spring({fps, frame: sNewLocal - 35, config: {damping: 16, stiffness: 110, mass: 1}});
  const aiPoweredX = interpolate(slideSpring, [0, 1], [0, -580]);

  // "workflow automation tool" bursts in from center after slide starts (local 55–85)
  // Special animation: scale 0→1 spring overshoot + clip-path reveal left→right simultaneously
  const wfIn = spring({fps, frame: sNewLocal - 55, config: {damping: 10, stiffness: 160, mass: 0.7}}); // overshoot bounce
  const wfScale = interpolate(wfIn, [0, 1], [0.4, 1]);


  const wfGlow = interpolate(wfIn, [0, 0.4, 1], [0, 1, 0.6]);

  // Scene fade out (local 95–115)
  const sNewOut = interpolate(sNewLocal, [95, 115], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const sNewOpacity = sNewLocal >= 0 && sNewLocal < 95 ? 1 : sNewOut;

  // ── Scene 4: No dragging. No wiring. / Just describe it. (307–425f) ─────
  const line1Progress = spring({fps, frame: frame - 307, config: {damping: 18, stiffness: 100, mass: 1}});
  const line1ClipRight = interpolate(line1Progress, [0, 1], [100, 0]);
  const line1Y = interpolate(line1Progress, [0, 1], [8, 0]);
  const line2Progress = spring({fps, frame: frame - 335, config: {damping: 15, stiffness: 120, mass: 0.8}});
  const line2ClipRight = interpolate(line2Progress, [0, 1], [100, 0]);
  const line2Y = interpolate(line2Progress, [0, 1], [8, 0]);
  const s4Out = interpolate(frame, [395, 425], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s4Scale = interpolate(frame, [395, 425], [1, 0.88], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s4Opacity = frame >= 307 && frame < 395 ? 1 : s4Out;

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
      {/* Ambient radial glow */}
      <div
        style={{
          position: 'absolute',
          width: 750,
          height: 750,
          borderRadius: 375,
          transform: `scale(${ambientScale}) translateX(${interpolate(frame, [0, 425], [0, 30])}px)`,
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.28) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Scene 1 — Problem statement */}
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

      {/* Scene 2/3 — Meet [icon] Noderift */}
      {frame >= 45 && frame < 192 && s2Opacity > 0 && (
        <div style={{display: 'flex', alignItems: 'center', gap: 20, opacity: s2Opacity, transform: `scale(${s3Scale})`}}>
          <span style={{color: '#F8FAFC', fontSize: 64, fontWeight: 800, letterSpacing: '-0.02em', opacity: Math.min(1, meetPop), transform: `translateX(${meetX}px)`}}>
            Meet
          </span>
          {frame >= 88 && (
            <img
              src={logoUrl}
              alt="Noderift"
              style={{
                width: 68, height: 68, borderRadius: 18, background: 'transparent', objectFit: 'contain',
                boxShadow: '0 0 35px rgba(37, 99, 235, 0.7)',
                transform: `scale(${logoPop})`, opacity: Math.min(1, logoPop),
              }}
            />
          )}
          <span style={{color: '#3B82F6', fontSize: 64, fontWeight: 800, letterSpacing: '-0.02em', opacity: Math.min(1, noderiftPop), transform: `translateX(${noderiftX}px)`}}>
            Noderift
          </span>
        </div>
      )}

      {/* Scene NEW — "The AI-powered" slides left, "workflow automation tool" bursts in */}
      {frame >= 192 && frame < 307 && sNewOpacity > 0 && (
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            opacity: sNewOpacity,
          }}
        >
          {/* "The AI-powered" — springs in then slides left */}
          <span
            style={{
              color: '#F8FAFC',
              fontSize: 72,
              // fontFamily: soraFont,
              fontWeight: 800,
              letterSpacing: '-0.025em',
              whiteSpace: 'nowrap',
              opacity: Math.min(1, aiPoweredIn),
              transform: `translateX(${aiPoweredX}px) scale(${interpolate(aiPoweredIn, [0, 1], [0.85, 1])})`,
              textShadow: `0 0 ${interpolate(aiPoweredIn, [0, 1], [0, 40])}px rgba(99, 179, 237, 0.5)`,
            }}
          >
            The AI-powered
          </span>

          {/* "workflow automation tool" — bursts in with spring scale + opacity only, no bg artifacts */}
          {sNewLocal >= 52 && (
            <span
              style={{
                position: 'absolute',
                color: '#60A5FA',
                fontSize: 60,
                // fontFamily: soraFont,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                whiteSpace: 'nowrap',
                transform: `translateX(340px) scale(${wfScale})`,
                transformOrigin: 'center center',
                opacity: Math.min(1, wfIn),
                textShadow: `0 0 ${30 * wfGlow}px rgba(96, 165, 250, 0.6)`,
              }}
            >
              workflow automation tool
            </span>
          )}
        </div>
      )}

      {/* Scene 4 — No dragging. No wiring. / Just describe it. */}
      {frame >= 307 && s4Opacity > 0 && (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, opacity: s4Opacity, transform: `scale(${s4Scale})`}}>
          <div style={{overflow: 'hidden'}}>
            <div
              style={{
                color: '#F8FAFC', fontSize: 64, fontWeight: 800, letterSpacing: '-0.02em', textAlign: 'center',
                transform: `translateY(${line1Y}px)`,
                clipPath: `inset(0 ${line1ClipRight}% 0 0)`,
              }}
            >
              No dragging. No wiring.
            </div>
          </div>
          {frame >= 332 && (
            <div style={{overflow: 'hidden'}}>
              <div
                style={{
                  color: '#3B82F6', fontSize: 58, fontWeight: 800, letterSpacing: '-0.02em', textAlign: 'center',
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
