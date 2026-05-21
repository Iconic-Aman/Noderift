import { useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function AIChatPanel() {
  const [showNotification, setShowNotification] = useState(false);

  const handleClick = () => {
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 2500);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="fixed bottom-28 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer"
      >
        <Sparkles className="h-5 w-5" />
      </button>

      {showNotification && (
        <div className="fixed bottom-44 right-6 z-50 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 px-4 py-3 text-xs font-semibold text-slate-200 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-400 animate-pulse" />
          <span>Stay tuned! AI Workflow Builder is coming soon.</span>
        </div>
      )}
    </>
  );
}
