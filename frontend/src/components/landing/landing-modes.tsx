import { useState } from "react";
import { Download, Cloud, Sparkles, ArrowRight, Check, HardDrive } from "lucide-react";
import { DownloadModal } from "./download-modal";
import { CloudTrialModal } from "./cloud-trial-modal";

export function LandingModes() {
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showCloudModal, setShowCloudModal] = useState(false);

  return (
    <section className="relative py-20 md:py-28 px-6 md:px-8 bg-slate-950 overflow-hidden">
      {/* Subtle divider glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

      <div className="max-w-5xl mx-auto">
        {/* Section label */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-1.5 text-xs font-semibold text-slate-400 tracking-widest uppercase mb-4">
            Deployment Options
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Two Ways to Use Noderift
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Choose between self-hosting locally on your computer or starting instantly with Noderift Cloud.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Option 1: Open Source (Localhost) */}
          <div className="group relative rounded-2xl border border-slate-800 bg-slate-900/40 p-8 hover:border-blue-500/40 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between overflow-hidden">
            {/* Hover glow */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: "radial-gradient(circle 140px at 50% 0px, rgba(59,130,246,0.1), transparent)" }}
            />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <HardDrive className="h-6 w-6 text-blue-400" />
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800/80 border border-slate-700 px-3 py-1 text-[11px] font-semibold text-slate-300">
                  100% Open Source
                </span>
              </div>

              <div className="mb-2">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400 mb-1">
                  Option 01 • Self-Hosted
                </p>
                <h3 className="text-xl font-bold text-white">Run on Localhost</h3>
              </div>

              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Download Noderift and run it locally on your computer using Docker or native scripts. Keep complete ownership of your data and API keys.
              </p>

              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 mb-6">
                <div className="text-xs font-semibold text-slate-300 mb-2">Key Highlights:</div>
                <ul className="space-y-2">
                  {[
                    "Zero network latency on localhost",
                    "Full privacy — keys stay on your machine",
                    "Unlimited local workflow executions",
                    "Docker Compose & macOS/Windows scripts"
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-slate-400">
                      <Check className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowDownloadModal(true)}
              className="relative z-10 w-full py-3.5 px-6 rounded-xl border border-blue-500/30 hover:border-blue-500 bg-blue-500/10 hover:bg-blue-600 text-blue-300 hover:text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download size={16} /> Download & Run Localhost
            </button>
          </div>

          {/* Option 2: Noderift Cloud (Limited Free Trial) */}
          <div className="group relative rounded-2xl border border-indigo-500/30 bg-slate-900/40 p-8 hover:border-indigo-500/60 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between overflow-hidden shadow-xl shadow-indigo-500/5">
            {/* Ambient background glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(circle 160px at 50% 0px, rgba(99,102,241,0.12), transparent)" }}
            />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <Cloud className="h-6 w-6 text-indigo-400" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 text-[11px] font-extrabold text-indigo-300 uppercase tracking-wider">
                  ✦ Cloud Hosted
                </span>
              </div>

              <div className="mb-2">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 mb-1">
                  Option 02 • Cloud Platform
                </p>
                <h3 className="text-xl font-bold text-white">Noderift Cloud</h3>
              </div>

              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Start instantly in your browser without installing anything. Managed AI infrastructure, live cloud webhooks, and automatic updates.
              </p>

              {/* Free Trial Window Highlight Box */}
              <div className="bg-gradient-to-br from-indigo-950/40 to-slate-950 rounded-xl p-4 border border-indigo-500/30 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Limited Free Trial Included
                  </span>
                  <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    FREE TRIAL
                  </span>
                </div>
                <ul className="space-y-2">
                  {[
                    "100 Free AI Workflow Generations",
                    "Instant access — no setup required",
                    "Managed webhooks & live execution logs",
                    "Upgrade options available later"
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-slate-300">
                      <Check className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowCloudModal(true)}
              className="relative z-10 w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              Try Noderift Cloud Free <ArrowRight size={16} />
            </button>
          </div>

        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

      {/* Modals */}
      <DownloadModal isOpen={showDownloadModal} onClose={() => setShowDownloadModal(false)} />
      <CloudTrialModal isOpen={showCloudModal} onClose={() => setShowCloudModal(false)} />
    </section>
  );
}
