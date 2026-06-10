import { useState, DragEvent } from "react";
import { Search, Zap, Play, Brain, GitBranch, ChevronDown, Lock } from "lucide-react";
import { nodeTemplates } from "@/lib/node-templates";
import { NodeTemplate } from "@/types/workflow";
import { NodeIcon } from "./node-icons";
import { cn } from "@/lib/utils";

const categories = [
  { id: "triggers", label: "Triggers", icon: Zap, color: "#f97316" },
  { id: "actions", label: "Actions", icon: Play, color: "#3b82f6" },
  { id: "ai", label: "AI", icon: Brain, color: "#a855f7" },
  { id: "logic", label: "Logic", icon: GitBranch, color: "#22c55e" },
];

function DraggableNode({ node }: { node: NodeTemplate }) {
  const unlockedIds = ["http", "code", "webhook", "schedule", "playwright", "composio", "whatsapp", "resend", "ai_agent", "filter", "if", "merge", "loop", "set_variable", "delay", "database"];
  const isLocked = !unlockedIds.includes(node.id);

  const onDragStart = (event: DragEvent<HTMLDivElement>) => {
    if (isLocked) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData("application/reactflow/type", node.id);
    event.dataTransfer.setData("application/reactflow/label", node.label);
    event.dataTransfer.setData("application/reactflow/icon", node.icon);
    event.dataTransfer.setData("application/reactflow/category", node.category);
    event.dataTransfer.setData("application/reactflow/color", node.color);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable={!isLocked}
      onDragStart={!isLocked ? onDragStart : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all select-none",
        isLocked
          ? "border-slate-800 bg-slate-900/30 opacity-40 cursor-not-allowed"
          : "border-slate-700/50 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-700/50 cursor-grab active:cursor-grabbing"
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: isLocked ? "#47556910" : `${node.color}20` }}>
        <NodeIcon icon={node.icon} color={isLocked ? "#475569" : node.color} className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className={cn("truncate text-sm font-medium", isLocked ? "text-slate-500" : "text-slate-200")}>{node.label}</p>
          {isLocked && <Lock className="h-3 w-3 text-slate-500 shrink-0 animate-pulse" />}
        </div>
        <p className={cn("truncate text-xs", isLocked ? "text-slate-600" : "text-slate-500")}>{isLocked ? "Coming Soon" : node.description}</p>
      </div>
    </div>
  );
}

export function NodePalette() {
  const [q, setQ] = useState("");
  const [exp, setExp] = useState<string[]>(["triggers", "actions", "ai", "logic"]);
  const filtered = nodeTemplates.filter(n => n.label.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="flex h-full w-full shrink-0 flex-col border-r border-slate-800 bg-slate-900">
      <div className="border-b border-slate-800 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Search nodes..." value={q} onChange={e => setQ(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-9 pr-4 text-sm text-slate-200 focus:border-slate-600 outline-none" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {categories.map(cat => (
          <div key={cat.id} className="border-b border-slate-800 last:border-0">
            <button onClick={() => setExp(p => p.includes(cat.id) ? p.filter(i => i !== cat.id) : [...p, cat.id])}
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <cat.icon className="h-4 w-4" style={{ color: cat.color }} />
                <span className="text-sm font-medium text-slate-300">{cat.label}</span>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-slate-500 transition-transform", exp.includes(cat.id) && "rotate-180")} />
            </button>
            {exp.includes(cat.id) && (
              <div className="space-y-1.5 px-3 pb-3">
                {filtered.filter(n => n.category === cat.id).map(node => <DraggableNode key={node.id} node={node} />)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
