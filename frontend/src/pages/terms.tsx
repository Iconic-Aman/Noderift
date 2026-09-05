import { useEffect } from "react";
import { Link } from "react-router-dom";
import { FileText, ArrowLeft } from "lucide-react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingFooter } from "@/components/landing/landing-footer";

export function Terms() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 overflow-x-hidden flex flex-col font-sans selection:bg-blue-500/30 selection:text-blue-200">
      <LandingNavbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 md:px-8 pt-32 pb-20">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>
        </div>

        <div className="mb-10 border-b border-slate-800/80 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-950/60 border border-blue-800/50 text-blue-400 text-xs font-mono font-bold uppercase tracking-wider mb-4 shadow-lg shadow-blue-950/40">
            <FileText className="h-3.5 w-3.5" />
            Terms of Service
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Last updated: September 5, 2026 • Governed by the laws of India
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-slate-300">
          <section className="space-y-3">
            <p>
              These Terms of Service (&quot;Terms&quot;) govern your use of Noderift, an AI-powered workflow automation platform, whether through our hosted cloud version or the self-hosted open-source version. By using Noderift, you agree to these Terms.
            </p>
          </section>

          <section className="space-y-3 rounded-xl border border-slate-800/80 bg-slate-900/40 p-6">
            <h2 className="text-lg font-bold text-white">1. Eligibility</h2>
            <p className="text-slate-400">
              Noderift is open for anyone to use. By using the platform, you agree to these Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. The Service & Pricing</h2>
            <p className="text-slate-400">
              Noderift lets you build, run, and automate workflows using visual nodes, including AI agent nodes that generate outputs using open-source large language models. Noderift is currently <strong className="text-slate-200">free to use</strong> in both its cloud and self-hosted forms. Notice will be provided prior to any future introduction of paid plans.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. AI-Generated Content & Model Behavior</h2>
            <ul className="list-disc list-inside space-y-2 text-slate-400">
              <li>
                <strong className="text-slate-200">Third-party routing:</strong> Noderift routes AI tasks through OpenRouter. We do not control underlying model training, availability, or accuracy.
              </li>
              <li>
                <strong className="text-slate-200">Availability:</strong> Free-tier models may be rate-limited, subject to provider latency, or substituted dynamically to keep automations operating.
              </li>
              <li>
                <strong className="text-slate-200">Validation responsibility:</strong> AI outputs may be inaccurate or incomplete. You are solely responsible for reviewing and verifying AI actions before executing automations that impact production or external systems.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. User Responsibilities & Prohibited Uses</h2>
            <p className="text-slate-400">You agree not to use Noderift to:</p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400">
              <li>Scrape, reverse-engineer, or disrupt Noderift infrastructure.</li>
              <li>Abuse or circumvent rate limits on free-tier inference APIs.</li>
              <li>Resell or redistribute unauthorized access to cloud AI credentials.</li>
              <li>Facilitate spam, unauthorized messaging, harassment, or unlawful activities.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">5. Disclaimers & Limitation of Liability</h2>
            <p className="text-slate-400">
              Noderift is provided &quot;as is&quot; without warranties of any kind. To the maximum extent permitted by Indian law, we are not liable for indirect, incidental, or consequential damages resulting from workflow failures, AI decisions, or service interruptions.
            </p>
          </section>

          <section className="space-y-3 rounded-xl border border-slate-800/80 bg-slate-900/20 p-5 text-xs text-slate-400">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Contact & Questions</h2>
            <p>
              For questions regarding these Terms of Service, contact:{" "}
              <a href="mailto:support@noderift.com" className="text-blue-400 hover:underline">
                support@noderift.com
              </a>
            </p>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
