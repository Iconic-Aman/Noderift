import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Home, LayoutDashboard, KeyRound, LogOut, Menu, X } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { UserMenu } from "@/components/user-menu";

interface AppNavbarProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  backTo?: string;
  children?: React.ReactNode;
}

export function AppNavbar({ title, subtitle, showBack, backTo, children }: AppNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useUser();
  const isVisible = useScrollDirection();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else if (location.state?.from) {
      navigate(location.state.from);
    } else {
      navigate(-1);
    }
  };

  const isDashboard = location.pathname === "/dashboard";
  const isCredentials = location.pathname === "/credentials";

  return (
    <>
      {/* Left - Logo & Title (exact same position as Home) */}
      <div className={`fixed top-7 left-8 z-50 flex items-center gap-3 transition-all duration-300 ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-24 opacity-0 pointer-events-none"}`}>
        {showBack && (
          <button
            onClick={handleBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer mr-1"
            title="Go Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}

        <Link to="/" className="flex items-center gap-2.5 text-white hover:scale-[1.02] transition-transform">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden shadow-lg shadow-blue-500/20">
            <img src="/noderift-icon.jpg" alt="Noderift" className="h-full w-full object-cover" />
          </div>
          <span className="font-extrabold text-sm tracking-wider uppercase bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Noderift
          </span>
        </Link>

        {title && (
          <>
            <div className="h-3.5 w-[1px] bg-slate-800" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-200">{title}</span>
              {subtitle && <span className="text-[10px] text-slate-500">{subtitle}</span>}
            </div>
          </>
        )}
      </div>

      {/* Right - Desktop (hidden on Credentials page) */}
      {!isCredentials && (
        <div className={`fixed top-7 right-8 z-50 hidden md:flex items-center gap-6 pt-1.5 transition-all duration-300 ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-24 opacity-0 pointer-events-none"}`}>
          {children}

          <Link
            to="/"
            className="relative py-1 text-slate-400 hover:text-white transition-colors duration-300 text-xs font-semibold flex items-center gap-1.5 after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 hover:after:w-full after:bg-blue-500 after:transition-all after:duration-300"
          >
            <Home size={13} />
            Home
          </Link>

          {!isDashboard && (
            <button
              onClick={() => navigate("/dashboard")}
              className="relative py-1 text-slate-400 hover:text-white transition-colors duration-300 text-xs font-semibold flex items-center gap-1.5 after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 hover:after:w-full after:bg-blue-500 after:transition-all after:duration-300 cursor-pointer"
            >
              <LayoutDashboard size={13} />
              Dashboard
            </button>
          )}

          {!isCredentials && (
            <button
              onClick={() => navigate("/credentials", { state: { from: location.pathname } })}
              className="relative py-1 text-slate-400 hover:text-white transition-colors duration-300 text-xs font-semibold flex items-center gap-1.5 after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 hover:after:w-full after:bg-blue-500 after:transition-all after:duration-300 cursor-pointer"
            >
              <KeyRound size={13} />
              Credentials
            </button>
          )}

          <div className="h-4 w-[1px] bg-slate-800" />

          <UserMenu />
        </div>
      )}

      {/* Right - Mobile Trigger */}
      {!isCredentials && (
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`fixed top-7 right-8 z-50 md:hidden flex h-9 w-9 items-center justify-center bg-slate-900/30 border border-slate-800 hover:border-slate-700 rounded-lg backdrop-blur-sm text-slate-400 hover:text-white cursor-pointer transition-all duration-300 ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-24 opacity-0 pointer-events-none"}`}
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      )}

      {/* Mobile Menu Drawer */}
      {!isCredentials && mobileMenuOpen && (
        <div className="fixed top-20 right-8 left-8 z-40 md:hidden bg-slate-950/95 border border-slate-900 rounded-2xl p-5 backdrop-blur-md flex flex-col gap-3 shadow-2xl">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 py-1"
          >
            <Home size={14} className="text-blue-400" />
            Home
          </Link>
          <div className="h-[1px] bg-slate-800 w-full" />
          <div className="flex flex-col gap-2">
            {!isDashboard && (
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
            )}
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
        </div>
      )}
    </>
  );
}
