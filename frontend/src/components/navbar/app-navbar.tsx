import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { UserMenu } from "@/components/user-menu";

interface AppNavbarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backTo?: string;
  children?: React.ReactNode;
}

export function AppNavbar({ title, subtitle, showBack, backTo, children }: AppNavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else if (location.state?.from) {
      navigate(location.state.from);
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 px-6 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between">
      {/* Left section: Logo & Title */}
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={handleBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer mr-1"
            title="Go Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}

        <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden shadow-md shadow-blue-500/20">
            <img src="/noderift-icon.jpg" alt="Noderift" className="h-full w-full object-cover" />
          </div>
          <span className="font-extrabold text-sm tracking-wider uppercase bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Noderift
          </span>
        </Link>

        <div className="h-4 w-px bg-slate-800" />

        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-200">{title}</span>
          {subtitle && <span className="text-[10px] text-slate-500">{subtitle}</span>}
        </div>
      </div>

      {/* Right section: Action Buttons & User Menu */}
      <div className="flex items-center gap-3">
        {children}
        <UserMenu />
      </div>
    </header>
  );
}
