import { useState, useEffect, useRef } from "react";
import { Node } from "@xyflow/react";
import { X, Settings, Copy, Play } from "lucide-react";
import { NodeData } from "@/types/workflow";
import { getNodeTemplate } from "@/lib/node-templates";
import { NodeIcon } from "./node-icons";
import { ConfigFieldInput } from "./config-field-input";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/store/workflowStore";
import { useParams } from "react-router-dom";
import { API_URL, apiFetch } from "@/lib/api";
import { ScheduleConfig } from "./schedule-config";
import { InputVariablesPanel } from "./input-variables-panel";

interface Props {
  node: Node<NodeData> | null;
  onClose: () => void;
  onConfigChange: (id: string, config: Record<string, any>) => void;
  onRunNode?: (nodeId: string) => void;
}

export function NodeConfigPanel({ node, onClose, onConfigChange, onRunNode }: Props) {
  const [cfg, setCfg] = useState<Record<string, any>>({});
  const { edges, nodes } = useWorkflowStore();
  const { id } = useParams();
  const [triggerData, setTriggerData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [bodyHeight, setBodyHeight] = useState(400);

  const template = node ? getNodeTemplate(node.data.label.toLowerCase().replace(/\s+/g, "-")) || getNodeTemplate(node.id.split("-")[0]) : null;

  useEffect(() => {
    if (node && id && (node.id.startsWith("webhook") || node.id.startsWith("schedule"))) {
      apiFetch(`/workflows/${id}/triggers`).then(setTriggerData).catch(() => setTriggerData(null));
    } else {
      setTriggerData(null);
    }
  }, [node, id]);

  useEffect(() => {
    if (node) setCfg(node.data.config || {});
  }, [node]);

  // Measure body height so bottom sheet knows how far up it can go
  useEffect(() => {
    if (!bodyRef.current) return;
    const obs = new ResizeObserver(() => {
      if (bodyRef.current) setBodyHeight(bodyRef.current.clientHeight);
    });
    obs.observe(bodyRef.current);
    return () => obs.disconnect();
  }, []);

  const handleFieldChange = (name: string, val: any) => {
    const next = { ...cfg, [name]: val };
    setCfg(next);
    if (node) onConfigChange(node.id, next);
  };

  const handleScheduleChange = (updates: Record<string, any>) => {
    setCfg(updates);
    if (node) onConfigChange(node.id, updates);
  };

  const isSchedule = node?.id.startsWith("schedule");
  const parentEdges = node ? edges.filter(e => e.target === node.id) : [];
  const parentNodes = parentEdges.map(e => nodes.find(n => n.id === e.source)).filter(Boolean) as Node<NodeData>[];

  if (!node) return null;

  return (
    <div className="flex h-full w-full shrink-0 flex-col border-l border-slate-800 bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 shrink-0">
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
            <button onClick={() => onRunNode(node.id)} title="Run only this node"
              className="flex items-center gap-1 rounded bg-blue-600 hover:bg-blue-500 border border-blue-500/30 px-2 py-1 text-[11px] font-semibold text-white transition-all active:scale-95 cursor-pointer shadow-md">
              <Play className="h-3 w-3" /><span>Run Node</span>
            </button>
          )}
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-800 rounded-lg"><X className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Scrollable config + absolute bottom sheet */}
      <div ref={bodyRef} className="relative flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-4">
          <div className="mb-4 flex items-center gap-2 text-slate-400"><Settings className="h-4 w-4" /><span className="text-xs font-medium uppercase">Configuration</span></div>
          {isSchedule ? (
            <ScheduleConfig cfg={cfg} onChange={handleScheduleChange} />
          ) : (
            template?.configFields?.filter(f => !f.showWhen || cfg[f.showWhen.field] === f.showWhen.value).map(f => (
              <div key={f.name} className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-slate-400">{f.label}{f.required && <span className="ml-1 text-red-400">*</span>}</label>
                <ConfigFieldInput field={f} value={cfg[f.name]} onChange={v => handleFieldChange(f.name, v)} />
              </div>
            )) || <p className="text-sm text-slate-500 text-center py-4 italic">No settings available.</p>
          )}
          {node.id.startsWith("webhook") && triggerData?.webhook && (
            <div className="mt-4 rounded-lg bg-slate-950/40 p-3.5 border border-slate-800/80">
              <p className="text-[10px] font-semibold text-slate-400 uppercase mb-2">Webhook URL</p>
              <div className="flex items-center gap-1.5 mb-2.5">
                <input type="text" readOnly value={`${API_URL}/webhooks/${triggerData.webhook.slug}`} className="w-full text-[10px] font-mono select-all bg-slate-900 border border-slate-700/60 rounded px-2 py-1.5 text-slate-300 outline-none" />
                <button onClick={() => { navigator.clipboard.writeText(`${API_URL}/webhooks/${triggerData.webhook.slug}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className={cn("flex h-7 w-7 items-center justify-center rounded border transition-all cursor-pointer shrink-0", copied ? "bg-emerald-600/20 border-emerald-500/50 text-emerald-400" : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 active:scale-95")} title="Copy URL">
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal mb-2">Send a <strong>POST</strong> request to this URL.</p>
            </div>
          )}
          {node.id.startsWith("schedule") && triggerData?.cron && (
            <div className="mt-4 rounded-lg bg-slate-950/40 p-3.5 border border-slate-800/80">
              <p className="text-[10px] font-semibold text-slate-400 uppercase mb-2">Schedule Status</p>
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5"><span className="text-slate-500">Expression</span><span className="font-mono text-slate-300">{triggerData.cron.cron_expression}</span></div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5"><span className="text-slate-500">Active</span><span className={cn("font-medium", triggerData.cron.is_active ? "text-emerald-400" : "text-amber-400")}>{triggerData.cron.is_active ? "Yes" : "No"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Next Run</span><span className="font-mono text-slate-300">{triggerData.cron.next_run_at ? new Date(triggerData.cron.next_run_at).toLocaleString() : "—"}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Absolute bottom sheet — slides UP over config */}
        <InputVariablesPanel parentNodes={parentNodes} containerHeight={bodyHeight} />
      </div>
    </div>
  );
}
