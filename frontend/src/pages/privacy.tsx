import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingFooter } from "@/components/landing/landing-footer";

export function Privacy() {
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
            <ShieldCheck className="h-3.5 w-3.5" />
            Legal & Compliance
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Last updated: September 5, 2026 • Governed by the laws of India
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-slate-300">
          <section className="space-y-3">
            <p>
              Noderift (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;) is an AI-powered workflow automation platform. This policy explains what data we collect, how it is used, and how it is stored, whether you use our hosted cloud version or self-host the open-source version.
            </p>
          </section>

          <section className="space-y-3 rounded-xl border border-slate-800/80 bg-slate-900/40 p-6">
            <h2 className="text-lg font-bold text-white">1. Who This Applies To</h2>
            <p className="text-slate-400">
              This policy applies to all users of Noderift across both the cloud-hosted platform and self-hosted deployments.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white">2. What Data We Collect</h2>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-200">2.1 Account Data</h3>
              <p className="text-slate-400">
                <strong className="text-slate-300">Cloud version:</strong> You sign in via Google OAuth. We receive your name, email address, and profile picture from Google.
              </p>
              <p className="text-slate-400">
                <strong className="text-slate-300">Self-hosted version:</strong> Account credentials remain strictly within your own database and infrastructure. We do not receive or store this data.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-200">2.2 Workflow and Execution Data</h3>
              <p className="text-slate-400">
                Noderift stores the following in order to display execution history, debug workflows, and resume past work:
              </p>
              <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/60 my-3">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-900 text-slate-400 font-semibold uppercase">
                    <tr>
                      <th className="p-3">Table</th>
                      <th className="p-3">Data Stored</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                    <tr>
                      <td className="p-3 text-blue-400 font-semibold">workflows</td>
                      <td className="p-3 font-sans">Full node configuration graph and AI chat conversation history.</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-blue-400 font-semibold">node_logs</td>
                      <td className="p-3 font-sans">Per-node inputs (including prompt text, system prompts, queries, headers) and step output results.</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-blue-400 font-semibold">executions</td>
                      <td className="p-3 font-sans">Run status, trigger source, start/finish timestamps, and error messages.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-200">2.3 Analytics & Tracking</h3>
              <p className="text-slate-400">
                We do not currently use third-party behavioral analytics trackers (e.g. Google Analytics, Mixpanel, PostHog) and do not track you across other websites.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. Data Retention</h2>
            <p className="text-slate-400">
              Workflow data, node logs, and execution history are retained <strong className="text-slate-200">indefinitely</strong> until explicitly deleted by you. Deleting a workflow cascades to remove all associated execution records and logs. Deleting your account removes all associated workflows, executions, and data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. AI Processing & OpenRouter Data Flow</h2>
            <p className="text-slate-400">
              In the cloud version, AI node requests are routed through OpenRouter. Free-tier open-source models may be served by third-party inference providers whose data policies allow prompt retention and model training. In the self-hosted version, data processing is governed by your own OpenRouter account settings.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">5. Third Parties & Your Rights</h2>
            <p className="text-slate-400">
              We share data only with authentication providers (Google) and AI inference routing (OpenRouter) as necessary to operate the platform. We never sell your personal data. You may request data access or complete deletion at any time.
            </p>
          </section>

          <section className="space-y-3 rounded-xl border border-slate-800/80 bg-slate-900/20 p-5 text-xs text-slate-400">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Contact & Inquiries</h2>
            <p>
              For privacy-related questions, access requests, or deletion inquiries, contact us at:{" "}
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
