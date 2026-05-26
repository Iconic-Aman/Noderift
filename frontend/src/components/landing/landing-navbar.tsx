import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Github, Zap, Download, Menu, X } from "lucide-react";
import { DownloadModal } from "./download-modal";

export function LandingNavbar() {
  const [showModal, setShowModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setHasToken(!!localStorage.getItem("noderift_token"));
  }, []);

  return (
    <>
      {/* Open Left Wing - Logo */}
      <div className="fixed top-7 left-8 z-50 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5 text-white hover:scale-[1.02] transition-transform">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.4)]">
            <Zap className="h-4.5 w-4.5 text-white" />
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

      {/* Open Right Wing - Commands (Desktop) */}
      <div className="fixed top-7 right-8 z-50 hidden md:flex items-center gap-8">
        <Link
          to="/"
          className="relative py-1 text-slate-400 hover:text-white transition-colors duration-300 text-xs font-bold uppercase tracking-wider after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 hover:after:w-full after:bg-blue-500 after:transition-all after:duration-300"
        >
          Home
        </Link>
        <button
          onClick={() => setShowModal(true)}
          className="relative py-1 text-slate-400 hover:text-white transition-colors duration-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 bg-transparent border-0 cursor-pointer after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 hover:after:w-full after:bg-blue-500 after:transition-all after:duration-300"
        >
          <Download size={13} className="text-blue-500" />
          Download
        </button>
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
          <button
            onClick={() => navigate("/dashboard")}
            className="px-5 py-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-xs font-extrabold uppercase tracking-wider cursor-pointer border border-blue-500"
          >
            Dashboard
          </button>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="px-5 py-2.5 rounded-full border border-slate-800 hover:border-slate-700 bg-slate-950/20 hover:bg-slate-900/40 text-slate-300 hover:text-white hover:scale-[1.02] active:scale-[0.98] transition-all text-xs font-extrabold uppercase tracking-wider cursor-pointer"
          >
            Login / Sign Up
          </button>
        )}
      </div>

      {/* Open Right Wing - Mobile Trigger */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed top-7 right-8 z-50 md:hidden flex h-9 w-9 items-center justify-center bg-slate-900/30 border border-slate-800 hover:border-slate-700 rounded-lg backdrop-blur-sm text-slate-400 hover:text-white cursor-pointer transition-colors"
      >
        {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed top-20 right-8 left-8 z-40 md:hidden bg-slate-950/95 border border-slate-900 rounded-2xl p-5 backdrop-blur-md flex flex-col gap-4 shadow-2xl">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider py-1"
          >
            Home
          </Link>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              setShowModal(true);
            }}
            className="text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 bg-transparent border-0 cursor-pointer text-left py-1"
          >
            <Download size={14} className="text-blue-500" />
            Download
          </button>
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
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/dashboard");
              }}
              className="w-full text-center py-2.5 rounded-full bg-blue-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg cursor-pointer"
            >
              Dashboard
            </button>
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

      {/* Download Modal Component */}
      <DownloadModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
