import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export function LandingHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(!!localStorage.getItem("noderift_token"));

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      canvas.width = width;
      canvas.height = height;

      ctx.clearRect(0, 0, width, height);

      // Draw grid
      const dotSize = 1;
      const spacing = 30;
      const opacity = 0.05;

      for (let x = 0; x < width; x += spacing) {
        for (let y = 0; y < height; y += spacing) {
          ctx.fillStyle = `rgba(148, 163, 184, ${opacity})`;
          ctx.fillRect(x, y, dotSize, dotSize);
        }
      }

      // Draw premium blue/indigo radial glow
      const gradient = ctx.createRadialGradient(
        width / 2,
        height * 0.4,
        0,
        width / 2,
        height * 0.4,
        width * 0.55
      );
      gradient.addColorStop(0, "rgba(59, 130, 246, 0.12)");
      gradient.addColorStop(0.5, "rgba(99, 102, 241, 0.04)");
      gradient.addColorStop(1, "rgba(15, 23, 42, 0)");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const handleCTA = () => {
    if (hasToken) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <section className="relative min-h-[85vh] pt-32 pb-16 flex items-center justify-center overflow-hidden bg-slate-950">
      {/* Background canvas for grid and glow */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 md:px-8 text-center">
        {/* Headline */}
        <h1 className="text-balance text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 leading-[1.15] text-white">
          {/* Line 1 — outer to inner: letters start spread wide + blurred, compress to normal */}
          <span
            className="inline-block hero-line-1"
          >
            Stop building automations.
          </span>
          <br />
          {/* Line 2 — gradient + shimmer sweep left to right */}
          <span className="inline-block hero-line-2 bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Start describing them.
          </span>
        </h1>

        <style>{`
          /* Line 1: outer-to-inner — wide letter spacing collapses in + blur clears */
          @keyframes spreadCollapse {
            0% {
              opacity: 0;
              letter-spacing: 0.35em;
              filter: blur(12px);
              transform: scale(1.08);
            }
            60% {
              opacity: 1;
              filter: blur(0px);
            }
            100% {
              opacity: 1;
              letter-spacing: -0.01em;
              filter: blur(0px);
              transform: scale(1);
            }
          }

          /* Line 2: gradient shimmer sweep */
          @keyframes shimmerReveal {
            0% {
              opacity: 0;
              letter-spacing: 0.3em;
              filter: blur(10px);
              transform: scale(1.06);
            }
            50% {
              opacity: 1;
              filter: blur(0px);
            }
            100% {
              opacity: 1;
              letter-spacing: -0.01em;
              filter: blur(0px);
              transform: scale(1);
            }
          }

          @keyframes shimmerSweep {
            0%   { background-position: -200% center; }
            100% { background-position: 200% center; }
          }

          .hero-line-1 {
            opacity: 0;
            animation: spreadCollapse 1s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
          }

          .hero-line-2 {
            opacity: 0;
            animation: shimmerReveal 1s cubic-bezier(0.16, 1, 0.3, 1) 0.45s forwards;
            background-size: 300% auto;
            animation: shimmerReveal 1s cubic-bezier(0.16, 1, 0.3, 1) 0.45s forwards,
                       shimmerSweep 3s linear 1.4s infinite;
          }

          @keyframes fadeInUp {
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>

        {/* Subheadline */}
        <p
          className="text-base sm:text-lg md:text-xl text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed opacity-0 translate-y-4"
          style={{ animation: "fadeInUp 0.8s ease-out 0.55s forwards" }}
        >
          Just describe what you want to automate. Noderift&apos;s AI builds the workflow,
          connects the nodes, and runs it —{" "}
          <span className="text-slate-200 font-medium">you just hit deploy.</span>
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={handleCTA}
            className="w-full sm:w-auto group relative px-8 py-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] whitespace-nowrap cursor-pointer"
          >
            {hasToken ? "Go to Dashboard →" : "Start Building →"}
          </button>
          <a
            href="https://github.com/Iconic-Aman/Noderift"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto text-center px-8 py-4 rounded-xl border border-slate-800 text-slate-300 font-semibold hover:bg-slate-900/60 hover:text-white transition-all duration-200 whitespace-nowrap"
          >
            View on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
