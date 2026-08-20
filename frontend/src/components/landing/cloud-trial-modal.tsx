import { useEffect } from "react";
import { X, Cloud, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CloudTrialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CloudTrialModal({ isOpen, onClose }: CloudTrialModalProps) {
  const navigate = useNavigate();

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

  const handleStartTrial = () => {
    onClose();
    navigate("/login");
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-indigo-500/30 rounded-2xl w-full max-w-lg max-h-[min(90vh,760px)] shadow-2xl relative flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />

        {/* Pinned Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-900/95 shrink-0 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Noderift Cloud Free Trial</span>
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
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 relative z-10">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-1.5 flex items-center gap-2">
              <Cloud className="text-indigo-400 h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
              Start Noderift Cloud
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Experience AI workflow generation and execution on our high-speed managed cloud.
            </p>
          </div>

          {/* Trial Card / Window */}
          <div className="bg-gradient-to-br from-indigo-950/40 to-slate-950 border border-indigo-500/20 rounded-xl p-4 sm:p-5">
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
                "No credit card required to start",
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-2.5 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            💡 <span className="font-semibold text-slate-300">Note:</span> You can start right now for free. Paid plans with higher execution limits will be available later.
          </div>

          <button
            onClick={handleStartTrial}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            Activate Free Cloud Trial <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
