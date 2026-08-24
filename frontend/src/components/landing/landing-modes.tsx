import { useState } from "react";
import { Cloud, Sparkles, ArrowRight, Check, HardDrive, Terminal, Copy } from "lucide-react";
import { CloudTrialModal } from "./cloud-trial-modal";
import toast from "react-hot-toast";

const DEPLOYMENT_OPTIONS = [
  {
    id: "localhost" as const,
    tag: "Option 01 • Self-Hosted",
    title: "Run on Localhost",
    description: "Run Noderift locally on your computer using Docker. Keep complete ownership of your data and API keys.",
    badge: { text: "100% Open Source", cls: "bg-slate-800/80 border-slate-700 text-slate-300" },
    icon: HardDrive,
    highlights: ["Full privacy — keys stay on your machine", "Unlimited local workflow executions", "One Docker command to get started"],
    extraHighlight: "Zero telemetry & full control of execution environment",
    codeSnippet: "curl -O https://raw.githubusercontent.com/Iconic-Aman/Noderift/main/docker-compose.yml && docker compose up -d",
    ctaText: "Self-Host with Docker ↓",
    ctaIcon: Terminal,
  },
  {
    id: "cloud" as const,
    tag: "Option 02 • Cloud Platform",
    title: "Noderift Cloud",
    description: "Start instantly in your browser without installing anything. Managed AI infrastructure, live cloud webhooks, and automatic updates.",
    badge: { text: "✦ Cloud Hosted", cls: "bg-indigo-500/20 border-indigo-500/30 text-indigo-300" },
    icon: Cloud,
    highlights: ["Instant access — no setup required", "Managed webhooks & live execution logs", "Upgrade options available later"],
    extraHighlight: "High-availability cloud runner with automated scaling",
    ctaText: "Try Noderift Cloud Free",
    ctaIcon: ArrowRight,
    isCloudCta: true,
  },
];

export function LandingModes() {
  const [activeId, setActiveId] = useState<"localhost" | "cloud">("localhost");
  const [showCloudModal, setShowCloudModal] = useState(false);

  const copyCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    toast.success("Docker command copied!");
  };

  return (
    <section className="relative py-20 md:py-28 px-6 md:px-8 bg-slate-950 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-1.5 text-xs font-semibold text-slate-400 tracking-widest uppercase mb-4">
            Deployment Options
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Two Ways to Use Noderift</h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Choose between self-hosting locally on your computer or starting instantly with Noderift Cloud.
          </p>
        </div>

        {/* Hover-activated Accordion Cards */}
        <div className="flex flex-col md:flex-row gap-6 w-full items-stretch transition-all duration-400">
          {DEPLOYMENT_OPTIONS.map((opt) => {
            const isSelected = activeId === opt.id;
            const Icon = opt.icon;
            const CtaIcon = opt.ctaIcon;

            return (
              <div
                key={opt.id}
                onMouseEnter={() => setActiveId(opt.id)}
                className={`group relative rounded-2xl border p-7 sm:p-8 flex flex-col justify-between overflow-hidden transition-all duration-400 ease-in-out select-none ${
                  isSelected
                    ? opt.id === "localhost"
                      ? "md:flex-[1.45] border-blue-500/50 bg-slate-900/70 shadow-2xl shadow-blue-500/10 ring-1 ring-blue-500/20"
                      : "md:flex-[1.45] border-indigo-500/50 bg-slate-900/70 shadow-2xl shadow-indigo-500/10 ring-1 ring-indigo-500/20"
                    : "md:flex-[0.8] border-slate-800/80 bg-slate-900/30 opacity-75 hover:opacity-100 hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${
                      opt.id === "localhost" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${opt.badge.cls}`}>
                      {opt.badge.text}
                    </span>
                  </div>

                  <div className="mb-2">
                    <p className={`text-[10px] font-extrabold uppercase tracking-widest mb-1 ${opt.id === "localhost" ? "text-blue-400" : "text-indigo-400"}`}>
                      {opt.tag}
                    </p>
                    <h3 className="text-xl font-bold text-white">{opt.title}</h3>
                  </div>

                  <p className="text-sm text-slate-400 leading-relaxed mb-6">{opt.description}</p>

                  <div className={`rounded-xl p-4 border mb-6 transition-all duration-300 ${
                    opt.id === "localhost" ? "bg-slate-950/60 border-slate-800/80" : "bg-gradient-to-br from-indigo-950/40 to-slate-950 border-indigo-500/30"
                  }`}>
                    {opt.id === "cloud" && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Limited Free Trial Included
                        </span>
                        <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                          FREE TRIAL
                        </span>
                      </div>
                    )}
                    {opt.id === "localhost" && <div className="text-xs font-semibold text-slate-300 mb-2">Key Highlights:</div>}
                    <ul className="space-y-2">
                      {opt.highlights.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-xs text-slate-300">
                          <Check className={`h-3.5 w-3.5 flex-shrink-0 ${opt.id === "localhost" ? "text-blue-400" : "text-indigo-400"}`} />
                          <span>{item}</span>
                        </li>
                      ))}
                      {isSelected && opt.extraHighlight && (
                        <li className="flex items-center gap-2 text-xs text-slate-300">
                          <Check className={`h-3.5 w-3.5 flex-shrink-0 ${opt.id === "localhost" ? "text-blue-400" : "text-indigo-400"}`} />
                          <span>{opt.extraHighlight}</span>
                        </li>
                      )}
                    </ul>
                  </div>

                  {isSelected && opt.codeSnippet && (
                    <div className="mb-6 rounded-xl bg-slate-950 border border-slate-800 p-3 flex items-center justify-between gap-2">
                      <code className="text-[11px] font-mono text-blue-300 truncate">{opt.codeSnippet}</code>
                      <button onClick={(e) => copyCode(e, opt.codeSnippet!)} className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors flex-shrink-0" title="Copy command">
                        <Copy size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {opt.isCloudCta ? (
                  <button
                    onClick={() => setShowCloudModal(true)}
                    className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {opt.ctaText} <CtaIcon size={16} />
                  </button>
                ) : (
                  <a
                    href="#self-host-section"
                    className="w-full py-3.5 px-6 rounded-xl border border-blue-500/30 hover:border-blue-500 bg-blue-500/10 hover:bg-blue-600 text-blue-300 hover:text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer text-center"
                  >
                    <CtaIcon size={16} /> {opt.ctaText}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
      <CloudTrialModal isOpen={showCloudModal} onClose={() => setShowCloudModal(false)} />
    </section>
  );
}
