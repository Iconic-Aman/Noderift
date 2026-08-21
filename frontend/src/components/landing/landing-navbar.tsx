import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Github, Menu, X, User, LayoutDashboard, KeyRound, LogOut, ChevronDown } from "lucide-react";

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setHasToken(!!localStorage.getItem("noderift_token"));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("noderift_token");
    setHasToken(false);
    setUserMenuOpen(false);
    navigate("/");
  };

  return (
    <>
      {/* Left - Logo */}
      <div className="fixed top-7 left-8 z-50 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5 text-white hover:scale-[1.02] transition-transform">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden shadow-lg shadow-blue-500/20">
            <img src="/noderift-icon.jpg" alt="Noderift" className="h-full w-full object-cover" />
          </div>
          <span className="font-extrabold text-sm tracking-wider uppercase bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Noderift
          </span>
        </Link>
        <div className="h-3.5 w-[1px] bg-slate-800" />
        <span className="text-[10px] font-mono text-blue-500 uppercase tracking-widest font-bold animate-pulse">
          OS v1.0
        </span>
      </div>

      {/* Right - Desktop */}
      <div className="fixed top-7 right-8 z-50 hidden md:flex items-center gap-6">
        <a
          href="https://github.com/Iconic-Aman/Noderift"
          target="_blank"
          rel="noreferrer"
          className="relative py-1 text-slate-400 hover:text-white transition-colors duration-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 hover:after:w-full after:bg-blue-500 after:transition-all after:duration-300"
        >
          <Github size={13} />
          GitHub
        </a>
        <div className="h-4 w-[1px] bg-slate-800" />

        {hasToken ? (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/90 hover:border-slate-700 hover:bg-slate-800/80 text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-lg shadow-black/20"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <User size={13} />
              </div>
              <span>Account</span>
              <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-800 bg-slate-950/95 p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 z-50">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate("/dashboard");
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                >
                  <LayoutDashboard size={14} className="text-blue-400" />
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate("/credentials");
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                >
                  <KeyRound size={14} className="text-slate-400" />
                  Credentials
                </button>
                <div className="my-1 h-[1px] bg-slate-800/80" />
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="px-5 py-2.5 rounded-full border border-slate-800 hover:border-slate-700 bg-slate-950/20 hover:bg-slate-900/40 text-slate-300 hover:text-white hover:scale-[1.02] active:scale-[0.98] transition-all text-xs font-extrabold uppercase tracking-wider cursor-pointer"
          >
            Login / Sign Up
          </button>
        )}
      </div>

      {/* Right - Mobile Trigger */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed top-7 right-8 z-50 md:hidden flex h-9 w-9 items-center justify-center bg-slate-900/30 border border-slate-800 hover:border-slate-700 rounded-lg backdrop-blur-sm text-slate-400 hover:text-white cursor-pointer transition-colors"
      >
        {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed top-20 right-8 left-8 z-40 md:hidden bg-slate-950/95 border border-slate-900 rounded-2xl p-5 backdrop-blur-md flex flex-col gap-4 shadow-2xl">
          <a
            href="https://github.com/Iconic-Aman/Noderift"
            target="_blank"
            rel="noreferrer"
            className="text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 py-1"
          >
            <Github size={14} />
            GitHub
          </a>
          <div className="h-[1px] bg-slate-800 w-full" />
          {hasToken ? (
            <div className="flex flex-col gap-1">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/dashboard");
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 cursor-pointer"
              >
                <LayoutDashboard size={14} className="text-blue-400" />
                Dashboard
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/credentials");
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 cursor-pointer"
              >
                <KeyRound size={14} className="text-slate-400" />
                Credentials
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 cursor-pointer"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/login");
              }}
              className="w-full text-center py-2.5 rounded-full border border-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Login / Sign Up
            </button>
          )}
        </div>
      )}
    </>
  );
}
