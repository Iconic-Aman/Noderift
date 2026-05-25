import { useState } from "react";
import { Node } from "@xyflow/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { NodeData } from "@/types/workflow";
import { cn } from "@/lib/utils";
import { InteractiveJSONNode } from "./interactive-json-node";

interface Props {
  parentNodes: Node<NodeData>[];
}

export function InputVariablesPanel({ parentNodes }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [panelHeight, setPanelHeight] = useState(180);
  const [isResizing, setIsResizing] = useState(false);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startY = e.clientY;
    const startH = panelHeight;

    const onMove = (me: MouseEvent) => {
      const delta = startY - me.clientY;
      setPanelHeight(Math.max(80, Math.min(500, startH + delta)));
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

  return (
    <div className="border-t border-slate-800 bg-slate-800/10 transition-all">
      {/* Drag handle to resize panel vertically */}
      <div
        onMouseDown={handleResizeStart}
        className={cn(
          "h-1.5 w-full cursor-row-resize hover:bg-blue-500/40 active:bg-blue-500/60 transition-all",
          isResizing && "bg-blue-500/40"
        )}
      />
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-2.5 hover:bg-slate-800/40 text-slate-400 font-semibold cursor-pointer border-b border-slate-800/50 active:bg-slate-800/20 select-none"
      >
        <span className="text-[10px] uppercase tracking-wider font-bold">Input Variables (Hover to Inspect)</span>
        {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-500" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-500" />}
      </button>

      {isExpanded && (
        <div className="flex flex-col gap-3.5 overflow-y-auto p-4" style={{ maxHeight: `${panelHeight}px` }}>
          {parentNodes.map(p => (
            <div key={p.id} className="relative group rounded-lg bg-slate-950/40 p-2.5 border border-slate-800/60 transition-all hover:bg-slate-950/80">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5 mb-2">
                <p className="text-[10px] font-semibold text-slate-300">{p.data.label} <span className="text-[9px] text-slate-500 font-mono font-normal">({p.id})</span></p>
                {p.data.status === "success" && <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-1 py-0.5">Executed</span>}
                {p.data.status === "failed" && <span className="text-[8px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded px-1 py-0.5">Failed</span>}
                {p.data.status === "running" && <span className="text-[8px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded px-1 py-0.5">Running</span>}
                {!p.data.status && <span className="text-[8px] font-bold text-slate-500 bg-slate-800/80 border border-slate-700/60 rounded px-1 py-0.5">Yet to execute</span>}
              </div>

              <div className="bg-slate-950/90 rounded border border-slate-850 p-2 max-h-[100px] overflow-y-auto">
                <InteractiveJSONNode
                  val={p.data.output ?? { response: "...", status_code: 200 }}
                  nodeId={p.id}
                  path=""
                />
              </div>

              {/* n8n-style hover JSON inspector */}
              <div className="absolute right-full mr-3 top-0 z-[100] hidden group-hover:block w-[290px] max-h-[320px] overflow-y-auto rounded-lg border border-slate-700 bg-slate-950/98 p-3.5 shadow-2xl backdrop-blur-md text-[10px] font-mono leading-relaxed text-blue-300">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Live Output Data ({p.id})</span>
                  {p.data.status === "success" ? <span className="text-[8px] font-bold text-emerald-400">Success</span>
                    : p.data.status === "failed" ? <span className="text-[8px] font-bold text-red-400">Failed</span>
                    : <span className="text-[8px] font-bold text-slate-500">Yet to execute</span>}
                </div>
                {p.data.status === "success" && p.data.output ? (
                  <pre className="whitespace-pre-wrap select-all font-mono leading-normal text-[10px] max-h-[240px] overflow-y-auto">{JSON.stringify(p.data.output, null, 2)}</pre>
                ) : p.data.status === "failed" && p.data.error ? (
                  <pre className="whitespace-pre-wrap select-all font-mono leading-normal text-[10px] max-h-[240px] overflow-y-auto text-red-400">{p.data.error}</pre>
                ) : (
                  <p className="text-slate-500 italic text-[10px]">No output data. Execute node to view live variables.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
