import { useState } from "react";
import { Terminal, Copy, Check, Shield, ChevronRight } from "lucide-react";

interface Step {
  num: number;
  title: string;
  desc: string;
  command: string;
  output: string;
}

const steps: Step[] = [
  {
    num: 1,
    title: "Start Docker Desktop",
    desc: "Make sure Docker Desktop is active on your machine.",
    command: "docker --version",
    output: "Docker version 24.0.7, build afdd53b\n[SUCCESS] Docker environment active & running!",
  },
  {
    num: 2,
    title: "Pull Docker Image",
    desc: "Fetch the official open source Noderift container image.",
    command: "docker pull iconicaman/noderift:latest",
    output: "latest: Pulling from iconicaman/noderift\nae43cf21: Pull complete\n3b23c21a: Pull complete\nDigest: sha256:4d7c2a71f08e4... \nStatus: Downloaded newer image for iconicaman/noderift:latest",
  },
  {
    num: 3,
    title: "Run local Container",
    desc: "Launch the local instance on port 3000.",
    command: "docker run -d -p 3000:3000 --name noderift iconicaman/noderift:latest",
    output: "f8d3c2b1a0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5\n[SUCCESS] Noderift container started successfully on port 3000!",
  },
  {
    num: 4,
    title: "Launch Web Canvas",
    desc: "Open local application editor in browser.",
    command: "start http://localhost:3000",
    output: "[INFO] Access local visual workflow editor at:\n----> http://localhost:3000",
  },
];

export function LandingTerminal() {
  const [activeStep, setActiveStep] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="self-host-section" className="relative py-16 md:py-24 px-6 md:px-8 bg-slate-950 border-t border-slate-900 scroll-mt-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-white mb-4 flex items-center justify-center gap-2">
            <Shield className="text-blue-500 h-7 w-7 animate-[pulse_2s_infinite]" />
            Self-Host Open Source Stack
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
            Follow our 4-step terminal guide to fetch, run, and launch Noderift locally inside Docker.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
          {/* Steps selector - Left Pane */}
          <div className="lg:col-span-2 space-y-3.5">
            {steps.map((step, idx) => (
              <button
                key={step.num}
                onClick={() => setActiveStep(idx)}
                className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 group ${
                  activeStep === idx
                    ? "bg-slate-900 border-slate-800 shadow-[0_4px_20px_rgba(59,130,246,0.05)]"
                    : "bg-transparent border-transparent hover:bg-slate-900/30 hover:border-slate-900"
                }`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                    activeStep === idx
                      ? "bg-blue-600 text-white"
                      : "bg-slate-900 text-slate-400 group-hover:text-slate-200"
                  }`}
                >
                  {step.num}
                </div>
                <div>
                  <h4 className={`text-sm font-bold transition-colors ${activeStep === idx ? "text-white" : "text-slate-300 group-hover:text-white"}`}>
                    {step.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{step.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Terminal Simulator - Right Pane */}
          <div className="lg:col-span-3 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/40 shadow-2xl relative">
            {/* Header */}
            <div className="h-10 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between px-5 select-none">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>
              <span className="text-[10px] text-slate-600 font-semibold tracking-wider font-mono">noderift-installer.sh</span>
              <button
                onClick={() => handleCopy(steps[activeStep].command)}
                className="text-slate-500 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg border border-slate-800/80 transition-all cursor-pointer"
              >
                {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              </button>
            </div>

            {/* Code / Shell Output Terminal */}
            <div className="p-6 font-mono text-xs leading-relaxed min-h-[180px] bg-slate-950/80 flex flex-col justify-between">
              <div className="text-slate-300">
                <span className="text-blue-400 select-none">$ </span>
                <span className="text-white font-semibold">{steps[activeStep].command}</span>
                <div className="text-slate-500 whitespace-pre-line mt-3 font-medium">{steps[activeStep].output}</div>
              </div>
              <div className="text-slate-700 mt-6 flex items-center justify-between border-t border-slate-900 pt-3 select-none">
                <span>Step {steps[activeStep].num} of 4</span>
                <span className="flex items-center gap-0.5 text-blue-500/80 hover:text-blue-400 cursor-pointer text-[10px] font-bold" onClick={() => setActiveStep((prev) => (prev + 1) % 4)}>
                  Next Step <ChevronRight size={10} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
