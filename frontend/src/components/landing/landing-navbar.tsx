import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Github, Menu, X, LayoutDashboard, KeyRound, LogOut } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { UserMenu } from "@/components/user-menu";

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const { logout } = useUser();
  const isVisible = useScrollDirection();
  const navigate = useNavigate();

  useEffect(() => {
    setHasToken(!!localStorage.getItem("noderift_token"));
  }, []);

  return (
    <>
      {/* Left - Logo */}
      <div className={`fixed top-7 left-8 z-50 flex items-center gap-3 transition-all duration-300 ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-24 opacity-0 pointer-events-none"}`}>
        <Link to="/" className="flex items-center gap-2.5 text-white hover:scale-[1.02] transition-transform">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden shadow-lg shadow-blue-500/20">
            <img src="/noderift-icon.jpg" alt="Noderift" className="h-full w-full object-cover" />
          </div>
          <span className="font-extrabold text-sm tracking-wider uppercase bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Noderift
          </span>
        </Link>
      </div>

      {/* Right - Desktop */}
      <div className={`fixed top-7 right-8 z-50 hidden md:flex items-center gap-6 pt-1.5 transition-all duration-300 ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-24 opacity-0 pointer-events-none"}`}>
        <a
          href="https://github.com/Iconic-Aman/Noderift"
          target="_blank"
          rel="noreferrer"
          className="relative py-1 text-slate-400 hover:text-white transition-colors duration-300 text-xs font-semibold flex items-center gap-1.5 after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 hover:after:w-full after:bg-blue-500 after:transition-all after:duration-300"
        >
          <Github size={13} />
          GitHub
        </a>

        {hasToken ? (
          <>
            <button
              onClick={() => navigate("/dashboard")}
              className="relative py-1 text-slate-400 hover:text-white transition-colors duration-300 text-xs font-semibold flex items-center gap-1.5 after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 hover:after:w-full after:bg-blue-500 after:transition-all after:duration-300 cursor-pointer"
            >
              <LayoutDashboard size={13} />
              Dashboard
            </button>
            <button
              onClick={() => navigate("/credentials")}
              className="relative py-1 text-slate-400 hover:text-white transition-colors duration-300 text-xs font-semibold flex items-center gap-1.5 after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 hover:after:w-full after:bg-blue-500 after:transition-all after:duration-300 cursor-pointer"
            >
              <KeyRound size={13} />
              Credentials
            </button>
            <div className="h-4 w-[1px] bg-slate-800" />
            <UserMenu />
          </>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="px-5 py-2.5 rounded-full border border-slate-800 hover:border-slate-700 bg-slate-950/20 hover:bg-slate-900/40 text-slate-300 hover:text-white hover:scale-[1.02] active:scale-[0.98] transition-all text-xs font-semibold cursor-pointer"
          >
            Login / Sign Up
          </button>
        )}
      </div>

      {/* Right - Mobile Trigger */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className={`fixed top-7 right-8 z-50 md:hidden flex h-9 w-9 items-center justify-center bg-slate-900/30 border border-slate-800 hover:border-slate-700 rounded-lg backdrop-blur-sm text-slate-400 hover:text-white cursor-pointer transition-all duration-300 ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-24 opacity-0 pointer-events-none"}`}
      >
        {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed top-20 right-8 left-8 z-40 md:hidden bg-slate-950/95 border border-slate-900 rounded-2xl p-5 backdrop-blur-md flex flex-col gap-3 shadow-2xl">
          <a
            href="https://github.com/Iconic-Aman/Noderift"
            target="_blank"
            rel="noreferrer"
            className="text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 py-1"
          >
            <Github size={14} />
            GitHub
          </a>
          <div className="h-[1px] bg-slate-800 w-full" />
          {hasToken ? (
            <div className="flex flex-col gap-2">
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
                  logout();
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
              className="w-full text-center py-2.5 rounded-full border border-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Login / Sign Up
            </button>
          )}
        </div>
      )}
    </>
  );
}
