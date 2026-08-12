import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingModes } from "@/components/landing/landing-modes";
import { LandingCanvas } from "@/components/landing/landing-canvas";
import { LandingTerminal } from "@/components/landing/landing-terminal";
import { LandingFeatures } from "@/components/landing/landing-features";

export function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 overflow-x-hidden flex flex-col font-sans">
      <LandingNavbar />
      <main className="flex-1">
        <LandingHero />
        <LandingModes />
        <LandingCanvas />
        <LandingTerminal />
        <LandingFeatures />
      </main>
      <footer className="border-t border-slate-900 bg-slate-950 py-10 px-6 md:px-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-xs font-medium">
          <p>© 2026 Noderift. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="https://github.com/Iconic-Aman/Noderift" target="_blank" rel="noreferrer" className="hover:text-slate-300 transition-colors">
              GitHub
            </a>
            <a href="#" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-slate-300 transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
