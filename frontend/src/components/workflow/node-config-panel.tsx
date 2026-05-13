import { useState, useEffect } from "react";
import { Node } from "@xyflow/react";
import { X, Settings } from "lucide-react";
import { NodeData } from "@/types/workflow";
import { getNodeTemplate } from "@/lib/node-templates";
import { NodeIcon } from "./node-icons";
import { ConfigFieldInput } from "./config-field-input";
import { cn } from "@/lib/utils";

interface Props {
  node: Node<NodeData> | null;
  onClose: () => void;
  onConfigChange: (id: string, config: Record<string, any>) => void;
}

export function NodeConfigPanel({ node, onClose, onConfigChange }: Props) {
  const [cfg, setCfg] = useState<Record<string, any>>({});
  const template = node ? getNodeTemplate(node.data.label.toLowerCase().replace(/\s+/g, "-")) || getNodeTemplate(node.id.split("-")[0]) : null;

  useEffect(() => {
    if (node) setCfg(node.data.config || {});
  }, [node]);

  const handleFieldChange = (name: string, val: any) => {
    const next = { ...cfg, [name]: val };
    setCfg(next);
    if (node) onConfigChange(node.id, next);
  };

  return (
    <div className={cn("flex h-full w-[300px] shrink-0 flex-col border-l border-slate-800 bg-slate-900 transition-all duration-300", 
      node ? "translate-x-0" : "translate-x-full w-0 border-0")}>
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
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-800 rounded-lg"><X className="h-4 w-4" /></button>
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
          <div className="border-t border-slate-800 p-4 bg-slate-800/30">
            <p className="text-[10px] font-medium text-slate-500 uppercase mb-1">Node ID</p>
            <code className="text-[10px] text-slate-600 break-all">{node.id}</code>
          </div>
        </>
      )}
    </div>
  );
}
