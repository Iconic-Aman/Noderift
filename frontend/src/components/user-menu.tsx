import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, LayoutDashboard, KeyRound, LogOut, ChevronDown, Home } from "lucide-react";
import { useUser } from "@/hooks/useUser";

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

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
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
        <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-800 bg-slate-950/95 p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 z-50">
          <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
            <p className="text-xs font-semibold text-white truncate">{user?.name || firstName}</p>
            <p className="text-[11px] text-slate-400 truncate">{user?.email || (user?.username ? `@${user.username}` : "")}</p>

          </div>

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
  );
}
