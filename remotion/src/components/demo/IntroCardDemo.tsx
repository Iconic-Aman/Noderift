import React from 'react';
import {AbsoluteFill, interpolate, spring, staticFile, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Sora';

const {fontFamily: soraFont} = loadFont('normal', {weights: ['700', '800']});

interface IntroCardDemoProps {
  frame: number;
}

// Total intro duration: 345 frames (~11.5s @ 30fps)
// Scene 1:   0–45    Problem statement
// Scene 2/3: 45–125  Meet Noderift (full pop appearance, 0s dead pause, smooth fade: ~2.6s total)
// Scene NEW: 125–235 The AI-powered → slides left → workflow automation tool
// Scene 4:   235–345 No dragging. No wiring. / Just describe it.

export const IntroCardDemo: React.FC<IntroCardDemoProps> = ({frame}) => {
  const {fps} = useVideoConfig();
  const logoUrl = staticFile('noderift-icon.jpg');

  if (frame > 345) return null;

  const ambientScale = interpolate(frame, [0, 345], [1, 1.02], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // ── Scene 1: Problem statement (0–45f) ──────────────────────────────────
  const s1Pop = spring({fps, frame, config: {damping: 18, stiffness: 100, mass: 1}});
  const s1Out = interpolate(frame, [30, 45], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s1Opacity = interpolate(s1Pop, [0, 1], [0, 1]) * s1Out;
  const s1Y = interpolate(s1Pop, [0, 1], [8, 0]);

  // ── Scene 2/3: Meet [icon] Noderift (45–125f) ───────────────────────────
  // Full original appearance stagger: Meet @ 45, Noderift @ 65, Logo @ 88.
  // Zero dead hold pause: immediately transitions into fade-out (95–125f).
  const meetPop = spring({fps, frame: frame - 45, config: {damping: 12, stiffness: 140, mass: 0.8}});
  const meetX = interpolate(meetPop, [0, 1], [-30, 0]);
  const noderiftPop = spring({fps, frame: frame - 65, config: {damping: 12, stiffness: 140, mass: 0.8}});
  const noderiftX = interpolate(noderiftPop, [0, 1], [30, 0]);
  const logoPop = spring({fps, frame: frame - 88, config: {damping: 12, stiffness: 140, mass: 0.8}});

  const s3Out = interpolate(frame, [95, 125], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s3Scale = interpolate(frame, [95, 125], [1, 0.88], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s2Opacity = frame >= 45 && frame < 95 ? 1 : s3Out;

  // ── Scene NEW: "The AI-powered" → slides left → "workflow automation tool" (125–235f) ──
  const sNewLocal = frame - 125; // local 0..110

  const aiPoweredIn = spring({fps, frame: sNewLocal, config: {damping: 14, stiffness: 130, mass: 0.9}});
  const slideSpring = spring({fps, frame: sNewLocal - 25, config: {damping: 16, stiffness: 110, mass: 1}});
  const aiPoweredX = interpolate(slideSpring, [0, 1], [0, -580]);

  const wfIn = spring({fps, frame: sNewLocal - 45, config: {damping: 10, stiffness: 160, mass: 0.7}});
  const wfScale = interpolate(wfIn, [0, 1], [0.4, 1]);
  const wfGlow = interpolate(wfIn, [0, 0.4, 1], [0, 1, 0.6]);

  const sNewOut = interpolate(sNewLocal, [90, 110], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const sNewOpacity = sNewLocal >= 0 && sNewLocal < 90 ? 1 : sNewOut;

  // ── Scene 4: No dragging. No wiring. / Just describe it. (235–345f) ─────
  const s4Local = frame - 235;
  const line1Progress = spring({fps, frame: s4Local, config: {damping: 18, stiffness: 100, mass: 1}});
  const line1ClipRight = interpolate(line1Progress, [0, 1], [100, 0]);
  const line1Y = interpolate(line1Progress, [0, 1], [8, 0]);
  const line2Progress = spring({fps, frame: s4Local - 25, config: {damping: 15, stiffness: 120, mass: 0.8}});
  const line2ClipRight = interpolate(line2Progress, [0, 1], [100, 0]);
  const line2Y = interpolate(line2Progress, [0, 1], [8, 0]);
  const s4Out = interpolate(frame, [315, 345], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s4Scale = interpolate(frame, [315, 345], [1, 0.88], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s4Opacity = frame >= 235 && frame < 315 ? 1 : s4Out;

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
          transform: `scale(${ambientScale}) translateX(${interpolate(frame, [0, 345], [0, 30])}px)`,
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.28) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Scene 1 — Problem statement */}
      {frame < 45 && s1Opacity > 0 && (
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

      {/* Scene 2/3 — Meet [icon] Noderift (Full entrance preserved, zero static pause) */}
      {frame >= 45 && frame < 125 && s2Opacity > 0 && (
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
      {frame >= 125 && frame < 235 && sNewOpacity > 0 && (
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
          <span
            style={{
              color: '#F8FAFC',
              fontSize: 72,
              fontFamily: soraFont,
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

          {sNewLocal >= 45 && (
            <span
              style={{
                position: 'absolute',
                color: '#60A5FA',
                fontSize: 60,
                fontFamily: soraFont,
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
      {frame >= 235 && s4Opacity > 0 && (
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
          {s4Local >= 25 && (
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
