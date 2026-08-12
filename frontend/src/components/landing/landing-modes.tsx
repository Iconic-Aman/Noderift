import { useNavigate } from "react-router-dom";
import { MousePointer2, Sparkles, ArrowRight } from "lucide-react";

export function LandingModes() {
  const navigate = useNavigate();

  return (
    <section className="relative py-20 md:py-28 px-6 md:px-8 bg-slate-950 overflow-hidden">
      {/* Subtle divider glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

      <div className="max-w-5xl mx-auto">
        {/* Section label */}
        <div className="flex justify-center mb-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-1.5 text-xs font-semibold text-slate-400 tracking-widest uppercase">
            Two ways to build
          </span>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Manual Mode */}
          <div className="group relative rounded-2xl border border-slate-800 bg-slate-900/40 p-8 hover:border-slate-700 transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer"
            onClick={() => navigate("/login")}
          >
            {/* Hover glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: "radial-gradient(circle 120px at 50% 0px, rgba(251,146,60,0.08), transparent)" }} />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <MousePointer2 className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-orange-400/70 mb-0.5">Manual Mode</p>
                  <h3 className="text-lg font-bold text-white">You're in control</h3>
                </div>
              </div>

              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Drag nodes onto the canvas. Connect them. Configure every setting yourself.
                Perfect if you know exactly what you're building and want full control.
              </p>

              <ul className="space-y-2 mb-8">
                {["Drag & drop visual editor", "Full config control per node", "Real-time canvas preview", "Deploy with one click"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="h-1 w-1 rounded-full bg-orange-400/60 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-1.5 text-sm font-semibold text-orange-400 group-hover:gap-2.5 transition-all duration-200">
                Build manually <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* AI Mode */}
          <div className="group relative rounded-2xl border border-indigo-500/30 bg-slate-900/40 p-8 hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer"
            onClick={() => navigate("/login")}
          >
            {/* Glow always visible for AI */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(circle 140px at 50% 0px, rgba(99,102,241,0.1), transparent)" }} />
            {/* Extra hover glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: "radial-gradient(circle 180px at 50% 0px, rgba(99,102,241,0.15), transparent)" }} />

            {/* Recommended badge */}
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-0.5 text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                ✦ Recommended
              </span>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <Sparkles className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400/70 mb-0.5">AI Mode</p>
                  <h3 className="text-lg font-bold text-white">Just describe it</h3>
                </div>
              </div>

              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Type what you want in plain English. Noderift's AI builds the workflow,
                connects the nodes, writes the code, and verifies it — you just hit deploy.
              </p>

              <ul className="space-y-2 mb-8">
                {["Prompt → full workflow in seconds", "AI tests nodes with real API data", "Code written from actual responses", "Zero config, zero guessing"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="h-1 w-1 rounded-full bg-indigo-400/60 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-1.5 text-sm font-semibold text-indigo-400 group-hover:gap-2.5 transition-all duration-200">
                Try AI mode <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
    </section>
  );
}
