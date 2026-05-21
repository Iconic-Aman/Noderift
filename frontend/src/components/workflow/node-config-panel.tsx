import { useState, useEffect } from "react";
import { Node } from "@xyflow/react";
import { X, Settings, Copy, Play } from "lucide-react";
import { NodeData } from "@/types/workflow";
import { getNodeTemplate } from "@/lib/node-templates";
import { NodeIcon } from "./node-icons";
import { ConfigFieldInput } from "./config-field-input";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/store/workflowStore";

interface Props {
  node: Node<NodeData> | null;
  onClose: () => void;
  onConfigChange: (id: string, config: Record<string, any>) => void;
  onRunNode?: (nodeId: string) => void;
}

export function NodeConfigPanel({ node, onClose, onConfigChange, onRunNode }: Props) {
  const [cfg, setCfg] = useState<Record<string, any>>({});
  const { edges, nodes } = useWorkflowStore();
  
  const template = node ? getNodeTemplate(node.data.label.toLowerCase().replace(/\s+/g, "-")) || getNodeTemplate(node.id.split("-")[0]) : null;

  useEffect(() => {
    if (node) setCfg(node.data.config || {});
  }, [node]);

  const handleFieldChange = (name: string, val: any) => {
    const next = { ...cfg, [name]: val };
    setCfg(next);
    if (node) onConfigChange(node.id, next);
  };

  // Find parent nodes
  const parentEdges = node ? edges.filter(e => e.target === node.id) : [];
  const parentNodes = parentEdges.map(e => nodes.find(n => n.id === e.source)).filter(Boolean) as Node<NodeData>[];

  return (
    <div className="flex h-full w-full shrink-0 flex-col border-l border-slate-800 bg-slate-900">
      {node && (
        <>
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${node.data.color}20` }}>
                <NodeIcon icon={node.data.icon} color={node.data.color} className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">{node.data.label}</h3>
                <p className="text-xs capitalize text-slate-500">{node.data.category}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {onRunNode && (
                <button
                  onClick={() => onRunNode(node.id)}
                  title="Run only this node"
                  className="flex items-center gap-1 rounded bg-blue-600 hover:bg-blue-500 border border-blue-500/30 px-2 py-1 text-[11px] font-semibold text-white transition-all active:scale-95 cursor-pointer shadow-md"
                >
                  <Play className="h-3 w-3" />
                  <span>Run Node</span>
                </button>
              )}
              <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-800 rounded-lg"><X className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-4 flex items-center gap-2 text-slate-400"><Settings className="h-4 w-4" /><span className="text-xs font-medium uppercase">Configuration</span></div>
            {template?.configFields?.map(f => (
              <div key={f.name} className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-slate-400">{f.label}{f.required && <span className="ml-1 text-red-400">*</span>}</label>
                <ConfigFieldInput field={f} value={cfg[f.name]} onChange={v => handleFieldChange(f.name, v)} />
              </div>
            )) || <p className="text-sm text-slate-500 text-center py-4 italic">No settings available.</p>}
          </div>

          {/* Upstream variables helper */}
          {parentNodes.length > 0 && (
            <div className="border-t border-slate-800 p-4 bg-slate-800/10">
              <p className="text-[10px] font-semibold text-slate-400 uppercase mb-2">Input Variables</p>
              <div className="flex flex-col gap-2">
                {parentNodes.map(p => (
                  <div key={p.id} className="rounded-lg bg-slate-950/40 p-2.5 border border-slate-800/60">
                    <p className="text-[11px] font-medium text-slate-300 mb-1">{p.data.label} ({p.id})</p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`{{${p.id}.response}}`);
                        }}
                        className="flex items-center gap-1 text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-700 transition-colors"
                      >
                        <Copy className="h-2.5 w-2.5" />
                        Response
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`{{${p.id}.status_code}}`);
                        }}
                        className="flex items-center gap-1 text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-700 transition-colors"
                      >
                        <Copy className="h-2.5 w-2.5" />
                        Status
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-slate-800 p-4 bg-slate-800/30">
            <p className="text-[10px] font-medium text-slate-500 uppercase mb-1">Node ID</p>
            <code className="text-[10px] text-slate-600 break-all">{node.id}</code>
          </div>
        </>
      )}
    </div>
  );
}
