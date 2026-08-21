import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingModes } from "@/components/landing/landing-modes";
import { LandingCanvas } from "@/components/landing/landing-canvas";
import { LandingTerminal } from "@/components/landing/landing-terminal";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingFooter } from "@/components/landing/landing-footer";

export function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 overflow-x-hidden flex flex-col font-sans">
      <LandingNavbar />
      <main className="flex-1">
        <LandingHero />
        <LandingCanvas />
        <LandingModes />
        <LandingTerminal />
        <LandingFeatures />
      </main>
      <LandingFooter />
    </div>
  );
}
