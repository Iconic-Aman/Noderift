import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, LayoutDashboard, KeyRound, LogOut, ChevronDown, Home, Sparkles, Bot } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { LlmKeyModal } from "@/components/workflow/llm-key-modal";
import { apiFetch } from "@/lib/api";

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const { user, firstName, logout } = useUser();
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goTo = (path: string) => {
    setOpen(false);
    navigate(path, { state: { from: location.pathname } });
  };

  const isHome = location.pathname === "/";
  const isDashboard = location.pathname === "/dashboard";
  const isCredentials = location.pathname === "/credentials";

  const [showAiModal, setShowAiModal] = useState(false);
  const [aiStatus, setAiStatus] = useState<{ configured: boolean; model?: string; masked_key?: string } | null>(null);

  const fetchAiStatus = () => {
    apiFetch("/ai/llm-key-status")
      .then((data) => setAiStatus(data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchAiStatus();
  }, []);

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => {
            setOpen((prev) => !prev);
            if (!open) fetchAiStatus();
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/90 hover:border-slate-700 hover:bg-slate-800/80 text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-lg shadow-black/20"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full overflow-hidden bg-blue-600/20 text-blue-400 border border-blue-500/30">
            {user?.picture ? (
              <img src={user.picture} alt={firstName} className="h-full w-full object-cover" />
            ) : (
              <User size={13} />
            )}
          </div>
          <span className="max-w-[120px] truncate text-slate-200">{firstName}</span>
          <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-800 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 z-50">
            {/* User Profile Card */}
            <div className="px-3 py-2 border-b border-slate-800/80 mb-2">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full overflow-hidden bg-blue-600/20 text-blue-400 border border-blue-500/30 shrink-0">
                  {user?.picture ? (
                    <img src={user.picture} alt={firstName} className="h-full w-full object-cover" />
                  ) : (
                    <User size={15} />
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-white truncate">{user?.name || firstName}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email || (user?.username ? `@${user.username}` : "")}</p>
                </div>
              </div>

              {/* AI Model & Key Badge */}
              <div className="mt-2.5 rounded-lg bg-slate-900/90 border border-slate-800 p-2 text-[11px]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Bot size={12} className="text-violet-400" /> AI Mode
                  </span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${aiStatus?.configured ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                    {aiStatus?.configured ? "Configured" : "Not Set"}
                  </span>
                </div>
                {aiStatus?.configured ? (
                  <div className="space-y-0.5 text-slate-300">
                    <div className="truncate"><span className="text-slate-500">Model:</span> <span className="font-mono text-slate-300 text-[10px]">{aiStatus.model || "Default"}</span></div>
                    {aiStatus.masked_key && (
                      <div><span className="text-slate-500">Key:</span> <span className="font-mono text-emerald-400 text-[10px]">{aiStatus.masked_key}</span></div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-500 text-[10px]">No API key configured</p>
                )}
              </div>
            </div>

            {/* AI Config / Override Button */}
            <button
              onClick={() => {
                setOpen(false);
                setShowAiModal(true);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-violet-300 hover:text-white hover:bg-violet-600/20 border border-violet-500/20 mb-1 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Sparkles size={14} className="text-violet-400" />
                AI API Key & Model
              </span>
              <span className="text-[10px] bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded font-mono">
                {aiStatus?.configured ? "Change" : "Setup"}
              </span>
            </button>

            {!isHome && (
              <button
                onClick={() => goTo("/")}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                <Home size={14} className="text-blue-400" />
                Home
              </button>
            )}

            {!isDashboard && (
              <button
                onClick={() => goTo("/dashboard")}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                <LayoutDashboard size={14} className="text-indigo-400" />
                Dashboard
              </button>
            )}

            {!isCredentials && (
              <button
                onClick={() => goTo("/credentials")}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                <KeyRound size={14} className="text-amber-400" />
                Credentials
              </button>
            )}

            <div className="my-1 h-[1px] bg-slate-800/80" />

            <button
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        )}
      </div>

      {showAiModal && (
        <LlmKeyModal
          onClose={() => setShowAiModal(false)}
          onSuccess={() => {
            setShowAiModal(false);
            fetchAiStatus();
          }}
        />
      )}
    </>
  );
}
