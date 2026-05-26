import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Github, Zap, Download } from "lucide-react";
import { DownloadModal } from "./download-modal";

export function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setHasToken(!!localStorage.getItem("noderift_token"));
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google/login`;
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-slate-950/80 backdrop-blur-md border-b border-slate-800" : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-white hover:opacity-95 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-md shadow-blue-500/20">
              <Zap className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Noderift</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">
              Home
            </Link>
            <button
              onClick={() => setShowModal(true)}
              className="text-slate-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-1.5 cursor-pointer bg-transparent border-0"
            >
              <Download size={15} />
              Download
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-1.5"
            >
              <Github size={16} />
              GitHub
            </a>
          </div>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {hasToken ? (
              <button
                onClick={() => navigate("/dashboard")}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition-all text-sm font-semibold cursor-pointer"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 transition-colors text-sm font-medium cursor-pointer"
                >
                  Login
                </button>
                <button
                  onClick={handleGoogleLogin}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] transition-all text-sm font-semibold cursor-pointer"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-slate-400 hover:text-white p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-950 border-b border-slate-800 px-6 py-5 flex flex-col gap-4">
            <Link to="/" className="text-slate-400 hover:text-white transition-colors text-sm" onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setShowModal(true);
              }}
              className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1.5 bg-transparent border-0 cursor-pointer text-left"
            >
              <Download size={15} />
              Download
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1.5"
            >
              <Github size={16} />
              GitHub
            </a>
            <div className="flex gap-3 mt-2">
              {hasToken ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/dashboard");
                  }}
                  className="flex-1 text-center py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold"
                >
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/login");
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-300 text-sm font-medium"
                  >
                    Login
                  </button>
                  <button
                    onClick={handleGoogleLogin}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Download Modal Component */}
      <DownloadModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
