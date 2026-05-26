import { useState, useEffect } from "react";
import { ReactFlow, Background, BackgroundVariant, Node, Edge, Handle, Position } from "@xyflow/react";
import { Webhook, Code, Sparkles, Send, Check, Loader2 } from "lucide-react";
import "@xyflow/react/dist/style.css";

const nodeTypes = {
  landingNode: ({ data }: any) => {
    const Icon = data.icon;
    const status = data.status;
    return (
      <div
        className={`relative flex flex-col items-center rounded-xl border backdrop-blur-xl transition-all duration-300 w-36 px-4 py-3 bg-slate-900/80 ${
          status === "running"
            ? "border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.35)] scale-105"
            : status === "success"
            ? "border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            : "border-slate-800 hover:border-slate-700"
        }`}
      >
        <Handle type="target" position={Position.Left} className="!h-2 !w-2 !bg-slate-800 !border-slate-700" />
        {/* Status Badge */}
        {status === "running" && (
          <div className="absolute -top-2 -left-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 border border-blue-400">
            <Loader2 className="h-3 w-3 animate-spin text-white" />
          </div>
        )}
        {status === "success" && (
          <div className="absolute -top-2 -left-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 border border-emerald-400">
            <Check className="h-3 w-3 text-white" />
          </div>
        )}
        <div
          className="flex h-11 w-11 items-center justify-center rounded-lg mb-2"
          style={{ backgroundColor: `${data.color}15`, boxShadow: `0 0 15px ${data.color}20` }}
        >
          <Icon className="h-5.5 w-5.5" style={{ color: data.color }} />
        </div>
        <span className="text-xs font-semibold text-slate-200 truncate max-w-full">{data.label}</span>
        <span className="text-[10px] text-slate-500 font-medium mt-0.5">{data.type}</span>
        <Handle type="source" position={Position.Right} className="!h-2 !w-2 !bg-slate-800 !border-slate-700" />
      </div>
    );
  },
};

const initialNodes: Node[] = [
  { id: "1", type: "landingNode", position: { x: 50, y: 80 }, data: { label: "Webhook Trigger", type: "Trigger", icon: Webhook, color: "#f97316", status: "idle" } },
  { id: "2", type: "landingNode", position: { x: 260, y: 80 }, data: { label: "Python Exec", type: "Action", icon: Code, color: "#3b82f6", status: "idle" } },
  { id: "3", type: "landingNode", position: { x: 470, y: 80 }, data: { label: "OpenAI Agent", type: "AI", icon: Sparkles, color: "#a855f7", status: "idle" } },
  { id: "4", type: "landingNode", position: { x: 680, y: 80 }, data: { label: "Slack Notify", type: "Action", icon: Send, color: "#22c55e", status: "idle" } },
];

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", animated: false, style: { stroke: "#334155", strokeWidth: 2 } },
  { id: "e2-3", source: "2", target: "3", animated: false, style: { stroke: "#334155", strokeWidth: 2 } },
  { id: "e3-4", source: "3", target: "4", animated: false, style: { stroke: "#334155", strokeWidth: 2 } },
];

export function LandingCanvas() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  useEffect(() => {
    let step = 0;
    const runSimulation = () => {
      setNodes((currentNodes) =>
        currentNodes.map((n, idx) => {
          let status = "idle";
          if (step === idx) status = "running";
          else if (step > idx) status = "success";
          return { ...n, data: { ...n.data, status } };
        })
      );

      setEdges((currentEdges) =>
        currentEdges.map((e, idx) => {
          let animated = false;
          let stroke = "#334155";
          if (step === idx + 1) {
            animated = true;
            stroke = "#3b82f6";
          } else if (step > idx + 1) {
            stroke = "#10b981";
          }
          return { ...e, animated, style: { ...e.style, stroke } };
        })
      );

      step = (step + 1) % 5;
    };

    const interval = setInterval(runSimulation, 2200);
    runSimulation();
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative py-12 md:py-16 px-6 md:px-8 bg-slate-950">
      <div className="max-w-5xl mx-auto animate-[fadeInUp_0.8s_ease-out_0.4s_forwards] opacity-0 translate-y-4">
        <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/40 shadow-2xl shadow-blue-500/5">
          {/* Top Bar (Browser style) */}
          <div className="h-10 bg-slate-900/60 border-b border-slate-800/80 flex items-center px-5 gap-2 select-none">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
            <span className="text-xs text-slate-500 font-medium ml-4">noderift-canvas-preview</span>
          </div>

          {/* Canvas Wrapper */}
          <div className="h-[280px] w-full bg-slate-950">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
              nodesDraggable={false}
              zoomOnScroll={false}
              panOnDrag={false}
              preventScrolling={true}
              className="bg-slate-950/80"
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
            </ReactFlow>
          </div>
        </div>
      </div>
    </section>
  );
}
