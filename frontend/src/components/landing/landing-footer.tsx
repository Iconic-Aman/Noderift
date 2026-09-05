import { Link } from "react-router-dom";

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-900 bg-slate-950 py-10 px-6 md:px-8">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-xs font-medium">
        <p>© 2026 Noderift. All rights reserved.</p>
        <div className="flex flex-wrap items-center justify-center gap-6">
          <a
            href="https://github.com/Iconic-Aman/Noderift"
            target="_blank"
            rel="noreferrer"
            className="hover:text-slate-300 transition-colors"
          >
            GitHub
          </a>
          <Link to="/privacy" className="hover:text-slate-300 transition-colors">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-slate-300 transition-colors">
            Terms of Service
          </Link>
          <Link
            to="/report-vulnerability"
            className="hover:text-slate-300 transition-colors"
          >
            Report a vulnerability
          </Link>
        </div>
      </div>
    </footer>
  );
}
