import { useState, useEffect } from "react";
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
  const [isLoadingTrigger, setIsLoadingTrigger] = useState(false);
  const [copied, setCopied] = useState(false);

  const getOutputKeys = (obj: any, prefix = ""): string[] => {
    if (!obj || typeof obj !== "object") return [];
    let keys: string[] = [];
    for (const k of Object.keys(obj)) {
      const val = obj[k];
      const path = prefix ? `${prefix}.${k}` : k;
      if (val && typeof val === "object" && !Array.isArray(val)) {
        keys = keys.concat(getOutputKeys(val, path));
      } else {
        keys.push(path);
      }
    }
    return keys;
  };

  useEffect(() => {
    if (node && id && (node.id.startsWith("webhook") || node.id.startsWith("schedule"))) {
      setIsLoadingTrigger(true);
      apiFetch(`/workflows/${id}/triggers`)
        .then(data => {
          setTriggerData(data);
        })
        .catch(err => {
          console.error("Failed to load trigger details", err);
        })
        .finally(() => {
          setIsLoadingTrigger(false);
        });
    } else {
      setTriggerData(null);
    }
  }, [node, id]);

  const template = node ? getNodeTemplate(node.data.label.toLowerCase().replace(/\s+/g, "-")) || getNodeTemplate(node.id.split("-")[0]) : null;

  useEffect(() => {
    if (node) setCfg(node.data.config || {});
  }, [node]);

  const handleFieldChange = (name: string, val: any) => {
    const next = { ...cfg, [name]: val };
    setCfg(next);
    if (node) onConfigChange(node.id, next);
  };

  const isSchedule = node?.id.startsWith("schedule");
  const baseCls = "w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 outline-none focus:border-slate-600 transition-colors";

  const frequency = cfg.frequency || "interval";
  const intervalValue = cfg.interval_value ?? 1;
  const intervalUnit = cfg.interval_unit || "hours";
  const timeValue = cfg.time || "12:00";
  const daysOfWeek = cfg.days_of_week || [];
  const customCron = cfg.cron || "0 * * * *";
  const timezoneValue = cfg.timezone || "UTC";

  const updateScheduleConfig = (updates: Record<string, any>) => {
    const nextCfg = { ...cfg, ...updates };
    const f = nextCfg.frequency || "interval";
    const val = nextCfg.interval_value ?? 1;
    const unit = nextCfg.interval_unit || "hours";
    const timeStr = nextCfg.time || "12:00";
    const days = nextCfg.days_of_week || [];
    const custom = nextCfg.cron || "0 * * * *";

    let computedCron = "0 * * * *";
    if (f === "interval") {
      if (unit === "minutes") computedCron = `*/${val} * * * *`;
      else if (unit === "hours") computedCron = `0 */${val} * * *`;
      else if (unit === "days") computedCron = `0 0 */${val} * *`;
    } else if (f === "daily") {
      const [h, m] = timeStr.split(":");
      computedCron = `${parseInt(m, 10) || 0} ${parseInt(h, 10) || 0} * * *`;
    } else if (f === "weekly") {
      const [h, m] = timeStr.split(":");
      const daysStr = days.length > 0 ? days.join(",") : "*";
      computedCron = `${parseInt(m, 10) || 0} ${parseInt(h, 10) || 0} * * ${daysStr}`;
    } else if (f === "cron") {
      computedCron = custom;
    }

    nextCfg.cron = computedCron;
    setCfg(nextCfg);
    if (node) onConfigChange(node.id, nextCfg);
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
            {isSchedule ? (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Trigger Frequency</label>
                  <select
                    value={frequency}
                    onChange={e => updateScheduleConfig({ frequency: e.target.value })}
                    className={baseCls}
                  >
                    <option value="interval">Every Interval (Minutes/Hours/Days)</option>
                    <option value="daily">Daily at Specific Time</option>
                    <option value="weekly">Weekly on Specific Days</option>
                    <option value="cron">Custom Cron Expression (Advanced)</option>
                  </select>
                </div>

                {frequency === "interval" && (
                  <div className="flex gap-2.5">
                    <div className="flex-1">
                      <label className="mb-1 block text-[11px] font-medium text-slate-400">Every</label>
                      <input
                        type="number"
                        min={1}
                        value={intervalValue}
                        onChange={e => updateScheduleConfig({ interval_value: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                        className={baseCls}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="mb-1 block text-[11px] font-medium text-slate-400">Unit</label>
                      <select
                        value={intervalUnit}
                        onChange={e => updateScheduleConfig({ interval_unit: e.target.value })}
                        className={baseCls}
                      >
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </select>
                    </div>
                  </div>
                )}

                {frequency === "daily" && (
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-400">Trigger Time (24h format)</label>
                    <input
                      type="time"
                      value={timeValue}
                      onChange={e => updateScheduleConfig({ time: e.target.value })}
                      className={baseCls}
                    />
                  </div>
                )}

                {frequency === "weekly" && (
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-slate-400">Trigger Time (24h format)</label>
                      <input
                        type="time"
                        value={timeValue}
                        onChange={e => updateScheduleConfig({ time: e.target.value })}
                        className={baseCls}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-medium text-slate-400">Days of the Week</label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: "M", value: "mon" },
                          { label: "T", value: "tue" },
                          { label: "W", value: "wed" },
                          { label: "T", value: "thu" },
                          { label: "F", value: "fri" },
                          { label: "S", value: "sat" },
                          { label: "S", value: "sun" },
                        ].map(d => {
                          const isSelected = daysOfWeek.includes(d.value);
                          return (
                            <button
                              key={d.value}
                              type="button"
                              onClick={() => {
                                const nextDays = isSelected
                                  ? daysOfWeek.filter((day: string) => day !== d.value)
                                  : [...daysOfWeek, d.value];
                                updateScheduleConfig({ days_of_week: nextDays });
                              }}
                              className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95",
                                isSelected
                                  ? "bg-blue-600 border-blue-500 text-white font-bold"
                                  : "bg-slate-800 hover:bg-slate-700/60 border-slate-700/80 text-slate-400"
                              )}
                            >
                              {d.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {frequency === "cron" && (
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-400">Cron Expression</label>
                    <input
                      type="text"
                      value={customCron}
                      onChange={e => updateScheduleConfig({ cron: e.target.value })}
                      placeholder="e.g. 0 * * * *"
                      className={baseCls}
                    />
                  </div>
                )}

                <div className="pt-2">
                  <label className="mb-1 block text-[11px] font-medium text-slate-400">Timezone</label>
                  <input
                    type="text"
                    value={timezoneValue}
                    onChange={e => updateScheduleConfig({ timezone: e.target.value })}
                    placeholder="UTC"
                    className={baseCls}
                  />
                </div>
              </div>
            ) : (
              template?.configFields?.map(f => (
                <div key={f.name} className="mb-4">
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">{f.label}{f.required && <span className="ml-1 text-red-400">*</span>}</label>
                  <ConfigFieldInput field={f} value={cfg[f.name]} onChange={v => handleFieldChange(f.name, v)} />
                </div>
              )) || <p className="text-sm text-slate-500 text-center py-4 italic">No settings available.</p>
            )}

            {node && node.id.startsWith("webhook") && triggerData?.webhook && (
              <div className="mt-4 rounded-lg bg-slate-950/40 p-3.5 border border-slate-800/80">
                <p className="text-[10px] font-semibold text-slate-400 uppercase mb-2">Webhook URL</p>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <input
                    type="text"
                    readOnly
                    value={`${API_URL}/webhooks/${triggerData.webhook.slug}`}
                    className="w-full text-[10px] font-mono select-all bg-slate-900 border border-slate-700/60 rounded px-2 py-1.5 text-slate-300 outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${API_URL}/webhooks/${triggerData.webhook.slug}`);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded border transition-all cursor-pointer shrink-0",
                      copied
                        ? "bg-emerald-600/20 border-emerald-500/50 text-emerald-400"
                        : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 active:scale-95"
                    )}
                    title="Copy URL"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal mb-2">
                  Send a <strong>POST</strong> request to this URL. The payload will be passed downstream.
                </p>
                <div className="bg-slate-900/50 rounded border border-slate-800/80 p-2 font-mono text-[9px] text-slate-400 select-all overflow-x-auto whitespace-nowrap">
                  curl -X POST "{API_URL}/webhooks/{triggerData.webhook.slug}" -H "Content-Type: application/json" -d '&#123;"hello": "world"&#125;'
                </div>
              </div>
            )}

            {node && node.id.startsWith("schedule") && triggerData?.cron && (
              <div className="mt-4 rounded-lg bg-slate-950/40 p-3.5 border border-slate-800/80">
                <p className="text-[10px] font-semibold text-slate-400 uppercase mb-2">Schedule Status</p>
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                    <span className="text-slate-500">Expression</span>
                    <span className="font-mono text-slate-300">{triggerData.cron.cron_expression}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                    <span className="text-slate-500">Timezone</span>
                    <span className="text-slate-300">{triggerData.cron.timezone}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                    <span className="text-slate-500">Active</span>
                    <span className={cn("font-medium", triggerData.cron.is_active ? "text-emerald-400" : "text-amber-400")}>
                      {triggerData.cron.is_active ? "Yes (Running)" : "No (Activate workflow)"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Next Scheduled Run</span>
                    <span className="font-mono text-slate-300">
                      {triggerData.cron.next_run_at 
                        ? new Date(triggerData.cron.next_run_at).toLocaleString() 
                        : "Not scheduled (Inactive)"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Upstream variables helper */}
          {parentNodes.length > 0 && (
            <div className="border-t border-slate-800 p-4 bg-slate-800/10">
              <p className="text-[10px] font-semibold text-slate-400 uppercase mb-2">Input Variables (Hover to Inspect)</p>
              <div className="flex flex-col gap-2">
                {parentNodes.map(p => (
                  <div key={p.id} className="relative group rounded-lg bg-slate-950/40 p-2.5 border border-slate-800/60 transition-all hover:bg-slate-950/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[11px] font-semibold text-slate-200">{p.data.label}</p>
                      {p.data.status === "success" && (
                        <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-1 py-0.5">Executed</span>
                      )}
                      {p.data.status === "failed" && (
                        <span className="text-[8px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded px-1 py-0.5">Failed</span>
                      )}
                      {p.data.status === "running" && (
                        <span className="text-[8px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded px-1 py-0.5">Running</span>
                      )}
                      {!p.data.status && (
                        <span className="text-[8px] font-bold text-slate-500 bg-slate-800/80 border border-slate-700/60 rounded px-1 py-0.5">Yet to execute</span>
                      )}
                    </div>
                    
                    {(() => {
                      const output = p.data.output;
                      const keys = getOutputKeys(output);
                      
                      if (keys.length > 0) {
                        return (
                          <div className="flex flex-wrap gap-1.5 w-full">
                            {keys.map(key => {
                              const textToInsert = `{{${p.id}.${key}}}`;
                              return (
                                <button
                                  key={key}
                                  draggable="true"
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData("text/plain", textToInsert);
                                    e.dataTransfer.effectAllowed = "copy";
                                  }}
                                  onClick={() => {
                                    navigator.clipboard.writeText(textToInsert);
                                  }}
                                  className="flex items-center gap-1 text-[9px] bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded px-2 py-1 text-slate-300 font-mono transition-all active:scale-95 cursor-grab select-none shadow-sm"
                                  title="Drag into input field or click to copy"
                                >
                                  <Copy className="h-2.5 w-2.5 text-blue-400" />
                                  <span>{key}</span>
                                </button>
                              );
                            })}
                          </div>
                        );
                      }
                      
                      return (
                        <div className="flex flex-wrap gap-1.5 w-full">
                          <button
                            draggable="true"
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", `{{${p.id}.response}}`);
                              e.dataTransfer.effectAllowed = "copy";
                            }}
                            onClick={() => {
                              navigator.clipboard.writeText(`{{${p.id}.response}}`);
                            }}
                            className="flex items-center gap-1 text-[9px] bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded px-2 py-1 text-slate-300 font-mono transition-all active:scale-95 cursor-grab select-none shadow-sm"
                            title="Drag into input field or click to copy"
                          >
                            <Copy className="h-2.5 w-2.5 text-blue-400" />
                            <span>Response</span>
                          </button>
                          <button
                            draggable="true"
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", `{{${p.id}.status_code}}`);
                              e.dataTransfer.effectAllowed = "copy";
                            }}
                            onClick={() => {
                              navigator.clipboard.writeText(`{{${p.id}.status_code}}`);
                            }}
                            className="flex items-center gap-1 text-[9px] bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded px-2 py-1 text-slate-300 font-mono transition-all active:scale-95 cursor-grab select-none shadow-sm"
                            title="Drag into input field or click to copy"
                          >
                            <Copy className="h-2.5 w-2.5 text-blue-400" />
                            <span>Status</span>
                          </button>
                        </div>
                      );
                    })()}


                    {/* n8n-style hover JSON variables inspector */}
                    <div className="absolute right-full mr-3 top-0 z-[100] hidden group-hover:block w-[290px] max-h-[320px] overflow-y-auto rounded-lg border border-slate-700 bg-slate-950/98 p-3.5 shadow-2xl backdrop-blur-md text-[10px] font-mono leading-relaxed text-blue-300">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Live Output Data ({p.id})</span>
                        {p.data.status === "success" ? (
                          <span className="text-[8px] font-bold text-emerald-400">Success</span>
                        ) : p.data.status === "failed" ? (
                          <span className="text-[8px] font-bold text-red-400">Failed</span>
                        ) : (
                          <span className="text-[8px] font-bold text-slate-500">Yet to execute</span>
                        )}
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
