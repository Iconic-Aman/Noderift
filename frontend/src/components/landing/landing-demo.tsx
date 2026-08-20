import { Sparkles, CheckCircle2 } from "lucide-react";

export function LandingDemo() {
  return (
    <section className="relative py-16 md:py-24 px-6 md:px-8 bg-slate-950 overflow-hidden border-y border-slate-900">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Split Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Product Info */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-3">
              <Sparkles className="w-4 h-4" />
              <span>Smart Workflow Engine</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
              Describe your workflow. <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                Watch AI build it live.
              </span>
            </h2>

            <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-6">
              Noderift translates complex multi-step automations into connected execution graphs in seconds. No tedious manual node placement required.
            </p>

            <ul className="space-y-3">
              {[
                "Natural language to multi-node architecture",
                "Automated data passing & schema resolution",
                "Instant sandbox execution with live logs"
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-xs sm:text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column: Seamless Looping Video */}
          <div className="lg:col-span-7">
            <div className="relative rounded-2xl overflow-hidden bg-slate-900/50 border border-slate-800/80 shadow-2xl shadow-blue-500/10">
              {/* Subtle Ambient Blend Glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 via-transparent to-indigo-500/10 pointer-events-none z-10" />

              {/* Looping Product Background Video */}
              <video
                src="/demo.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover block select-none pointer-events-none"
              >
                <source src="/demo.mp4" type="video/mp4" />
              </video>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
