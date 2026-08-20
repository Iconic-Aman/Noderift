import { X, Cloud, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CloudTrialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CloudTrialModal({ isOpen, onClose }: CloudTrialModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleStartTrial = () => {
    onClose();
    navigate("/login");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative overflow-hidden">
        {/* Glow Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Noderift Cloud Free Trial</span>
        </div>

        <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Cloud className="text-indigo-400 h-6 w-6" />
          Start Noderift Cloud
        </h3>
        
        <p className="text-sm text-slate-300 mb-6">
          Experience AI workflow generation and execution on our high-speed managed cloud.
        </p>

        {/* Trial Card / Window */}
        <div className="bg-gradient-to-br from-indigo-950/40 to-slate-950 border border-indigo-500/20 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">
              Limited Free Trial Plan
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
              $0 / month
            </span>
          </div>

          <ul className="space-y-2.5">
            {[
              "1,000 Cloud Node Executions per month",
              "Instant Webhook triggers & live sandbox",
              "No credit card required to start"
            ].map((item, idx) => (
              <li key={idx} className="flex items-center gap-2.5 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-xs text-slate-400 mb-6 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
          💡 <span className="font-semibold text-slate-300">Note:</span> You can start right now for free. Paid plans with higher execution limits will be available later.
        </div>

        <button
          onClick={handleStartTrial}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
        >
          Activate Free Cloud Trial <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
