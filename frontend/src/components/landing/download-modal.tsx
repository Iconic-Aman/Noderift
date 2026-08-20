import { X, Github, Key, Terminal, ExternalLink, Info } from "lucide-react";

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
    cmd: "cp .env.example .env   # then fill in your API keys",
    label: "Set up environment",
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative my-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <Github className="text-white h-5 w-5" />
          <h3 className="text-xl font-bold text-white">Run Noderift Locally</h3>
        </div>
        <p className="text-sm text-slate-400 mb-5">
          Noderift is fully open source. Clone from GitHub and spin up with one Docker command.
        </p>

        {/* GitHub Link */}
        <a
          href="https://github.com/Iconic-Aman/Noderift"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between w-full p-4 rounded-xl bg-slate-800/60 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 transition-all group mb-5"
        >
          <div className="flex items-center gap-3">
            <Github className="w-5 h-5 text-slate-300 group-hover:text-white" />
            <div>
              <div className="text-sm font-semibold text-white">Iconic-Aman/Noderift</div>
              <div className="text-xs text-slate-500">Full stack — frontend, backend, Celery, Redis</div>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
        </a>

        {/* Steps */}
        <div className="mb-5">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            <Terminal className="w-3.5 h-3.5" />
            Quick Start
          </div>
          <div className="space-y-2">
            {steps.map((step) => (
              <div key={step.num} className="flex gap-3 items-start">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
                  {step.num}
                </div>
                <div>
                  <code className="text-xs text-emerald-300 font-mono block leading-snug">
                    {step.cmd}
                  </code>
                  <span className="text-[11px] text-slate-500">{step.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Key Notice */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Key className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-amber-300">API Key Required for AI Mode</span>
          </div>
          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
            Noderift uses <span className="text-white font-medium">Llama 70B</span> (or similar) via your own API key. Add it to your <code className="text-emerald-400 bg-slate-800 px-1 py-0.5 rounded text-[11px]">.env</code> file. Choose a provider below:
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
                <div className="flex items-center gap-2.5">
                  <span className={`text-sm font-bold ${p.color}`}>{p.name}</span>
                  <span className="text-xs text-slate-500">{p.model}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${p.badgeColor}`}>
                    {p.badge}
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-slate-400" />
                </div>
              </a>
            ))}
          </div>
          <div className="flex items-start gap-2 mt-3 text-[11px] text-slate-500">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-600" />
            <span>Your API keys stay on your machine. Noderift never sees or stores them.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
