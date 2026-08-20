import { useState, useEffect } from "react";
import { X, Github, Key, Terminal, ExternalLink, Info, Copy, Check } from "lucide-react";

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  {
    num: 1,
    cmd: "git clone https://github.com/Iconic-Aman/Noderift.git",
    label: "Clone the repo",
  },
  {
    num: 2,
    cmd: "cp .env.example .env",
    label: "Set up environment (add your API keys)",
  },
  {
    num: 3,
    cmd: "docker compose up -d",
    label: "Start everything (frontend, backend, Redis, Celery)",
  },
  {
    num: 4,
    cmd: "open http://localhost:3000",
    label: "Open in browser",
  },
];

const apiProviders = [
  {
    name: "Groq",
    model: "Llama 3.1 70B",
    price: "Free tier available",
    url: "https://console.groq.com",
    color: "text-orange-400",
    badge: "FREE",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  {
    name: "OpenRouter",
    model: "Multiple models",
    price: "Pay per use",
    url: "https://openrouter.ai/keys",
    color: "text-purple-400",
    badge: "FLEXIBLE",
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  {
    name: "NVIDIA NIM",
    model: "Llama 3.1 70B",
    price: "Free credits on signup",
    url: "https://build.nvidia.com",
    color: "text-green-400",
    badge: "CREDITS",
    badgeColor: "bg-green-500/20 text-green-400 border-green-500/30",
  },
];

export function DownloadModal({ isOpen, onClose }: DownloadModalProps) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const copyCommand = (cmd: string, idx: number) => {
    navigator.clipboard.writeText(cmd);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[min(90vh,760px)] shadow-2xl relative flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pinned Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Github className="text-blue-400 h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">Run Noderift Locally</h3>
              <p className="text-xs text-slate-400">Open source self-hosted deployment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Noderift is fully open source. Clone from GitHub and spin up with Docker Compose in minutes.
          </p>

          {/* GitHub Link Card */}
          <a
            href="https://github.com/Iconic-Aman/Noderift"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between w-full p-3.5 rounded-xl bg-slate-800/60 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 transition-all group"
          >
            <div className="flex items-center gap-3">
              <Github className="w-5 h-5 text-slate-300 group-hover:text-white shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">Iconic-Aman/Noderift</div>
                <div className="text-xs text-slate-400 truncate">Full stack — frontend, backend, Celery, Redis</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-blue-400 shrink-0 ml-2" />
          </a>

          {/* Steps */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              Quick Start Steps
            </div>
            <div className="space-y-2.5">
              {steps.map((step, idx) => (
                <div
                  key={step.num}
                  className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 transition-all group"
                >
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {step.num}
                  </div>
                  <div className="min-w-0 flex-1">
                    <code className="text-xs text-emerald-300 font-mono block leading-snug break-all">
                      {step.cmd}
                    </code>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">{step.label}</span>
                  </div>
                  <button
                    onClick={() => copyCommand(step.cmd, idx)}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-all shrink-0 cursor-pointer"
                    title="Copy command"
                  >
                    {copiedIdx === idx ? (
                      <Check size={13} className="text-emerald-400" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* API Key Notice */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-amber-300">API Key Required for AI Mode</span>
            </div>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Add your LLM API key to <code className="text-emerald-400 bg-slate-800 px-1 py-0.5 rounded text-[11px]">.env</code>:
            </p>
            <div className="space-y-2">
              {apiProviders.map((p) => (
                <a
                  key={p.name}
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`text-xs sm:text-sm font-bold ${p.color}`}>{p.name}</span>
                    <span className="text-[11px] text-slate-500 truncate">{p.model}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${p.badgeColor}`}>
                      {p.badge}
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
                  </div>
                </a>
              ))}
            </div>
            <div className="flex items-start gap-2 mt-3 text-[11px] text-slate-500">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-500" />
              <span>API keys stay on your machine. Noderift never stores them.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
