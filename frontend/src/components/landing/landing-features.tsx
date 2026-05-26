import { Zap, Cpu, Plug } from "lucide-react";

const features = [
  {
    title: "Visual DAG Editor",
    description: "Drag, drop, and connect nodes to build any complex workflow visually in real-time.",
    icon: Zap,
    color: "#f97316",
  },
  {
    title: "AI Agent Nodes",
    description: "Agentic AI nodes that reason, dynamically execute tasks, and persist memory.",
    icon: Cpu,
    color: "#a855f7",
  },
  {
    title: "Robust Integrations",
    description: "Connect Slack, Gmail, database nodes, custom APIs and Python execution boxes.",
    icon: Plug,
    color: "#3b82f6",
  },
];

export function LandingFeatures() {
  return (
    <section className="relative py-16 md:py-24 px-6 md:px-8 bg-slate-950">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-xl p-8 bg-slate-900/30 border border-slate-900 hover:border-slate-800 transition-all duration-300 hover:-translate-y-1 overflow-hidden opacity-0 translate-y-4"
                style={{
                  animation: `fadeInUp 0.8s ease-out ${0.6 + idx * 0.15}s forwards`,
                }}
              >
                {/* Glow Background */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle 80px at 50% 30px, ${feature.color}15, transparent)`,
                  }}
                />

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl mb-6 transition-transform duration-300 group-hover:scale-105"
                    style={{ backgroundColor: `${feature.color}15`, boxShadow: `0 0 15px ${feature.color}10` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: feature.color }} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
