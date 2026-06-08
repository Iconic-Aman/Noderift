import { useState } from "react";
import { Node } from "@xyflow/react";
import { ChevronDown, ChevronRight, GripHorizontal, Copy, Check } from "lucide-react";
import { NodeData } from "@/types/workflow";
import { cn } from "@/lib/utils";
import { InteractiveJSONNode } from "./interactive-json-node";

interface Props {
  parentNodes: Node<NodeData>[];
  containerHeight: number; // total height of parent container
}

const HEADER_H = 36; // header bar height in px

export function InputVariablesPanel({ parentNodes, containerHeight }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  // height = how tall the sheet is (from bottom up). Default ~350px.
  const [sheetHeight, setSheetHeight] = useState(350);
  const [isResizing, setIsResizing] = useState(false);
  const [copiedNodeId, setCopiedNodeId] = useState<string | null>(null);

  const handleCopy = (nodeId: string, data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedNodeId(nodeId);
    setTimeout(() => setCopiedNodeId(null), 2000);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startY = e.clientY;
    const startH = sheetHeight;
    const onMove = (me: MouseEvent) => {
      const delta = startY - me.clientY;
      // allow sliding up to nearly full container (minus header)
      setSheetHeight(Math.max(HEADER_H, Math.min(containerHeight - 60, startH + delta)));
    };
    const onUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  if (parentNodes.length === 0) return null;

  const currentH = isExpanded ? sheetHeight : HEADER_H;

  return (
    <div
      className={cn(
        "absolute bottom-0 left-0 right-0 flex flex-col bg-slate-900 border-t border-slate-700 shadow-2xl z-20",
        !isResizing && "transition-[height] duration-200"
      )}
      style={{ height: `${currentH}px` }}
    >
      {/* Drag handle — drag up/down to resize */}
      <div
        onMouseDown={handleResizeStart}
        className={cn(
          "flex items-center justify-center h-5 cursor-row-resize hover:bg-blue-500/20 shrink-0 select-none",
          isResizing && "bg-blue-500/20"
        )}
      >
        <GripHorizontal className="h-3 w-3 text-slate-600" />
      </div>

      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-1.5 hover:bg-slate-800/40 cursor-pointer border-b border-slate-800/50 select-none shrink-0"
      >
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Input Variables</span>
        {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-500" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-500" />}
      </button>

      {/* Scrollable content */}
      {isExpanded && (
        <div className="flex flex-col gap-3 overflow-y-auto p-3 flex-1">
          {parentNodes.map(p => (
            <div key={p.id} className="relative group rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/60 hover:bg-slate-950/90 transition-all">
              <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800/60">
                <p className="text-[10px] font-semibold text-slate-300">{p.data.label} <span className="text-[9px] text-slate-500 font-mono font-normal">({p.id})</span></p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy(p.id, p.data.output ?? { response: "...", status_code: 200 })}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                    title="Copy whole response"
                  >
                    {copiedNodeId === p.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  </button>
                  {p.data.status === "success" && <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-1 py-0.5">Executed</span>}
                  {p.data.status === "failed" && <span className="text-[8px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded px-1 py-0.5">Failed</span>}
                  {p.data.status === "running" && <span className="text-[8px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded px-1 py-0.5">Running</span>}
                  {!p.data.status && <span className="text-[8px] font-bold text-slate-500 bg-slate-800/80 border border-slate-700/60 rounded px-1 py-0.5">Yet to execute</span>}
                </div>
              </div>
              <div className="bg-slate-950/90 rounded border border-slate-800 p-2 max-h-[220px] overflow-y-auto">
                <InteractiveJSONNode val={p.data.output ?? { response: "...", status_code: 200 }} nodeId={p.id} path="" />
              </div>
              {/* n8n hover inspector */}
              <div className="absolute right-full mr-3 top-0 z-[100] hidden group-hover:block w-[280px] max-h-[300px] overflow-y-auto rounded-lg border border-slate-700 bg-slate-950/98 p-3 shadow-2xl backdrop-blur-md text-[10px]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Output ({p.id})</span>
                  {p.data.status === "success" ? <span className="text-[8px] font-bold text-emerald-400">Success</span>
                    : p.data.status === "failed" ? <span className="text-[8px] font-bold text-red-400">Failed</span>
                    : <span className="text-[8px] font-bold text-slate-500">Yet to execute</span>}
                </div>
                {p.data.status === "success" && p.data.output
                  ? <pre className="whitespace-pre-wrap font-mono text-[10px] text-blue-300 max-h-[220px] overflow-y-auto">{JSON.stringify(p.data.output, null, 2)}</pre>
                  : p.data.status === "failed" && p.data.error
                  ? <pre className="whitespace-pre-wrap font-mono text-[10px] text-red-400 max-h-[220px] overflow-y-auto">{String(p.data.error ?? "")}</pre>
                  : <p className="text-slate-500 italic">No output yet.</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
