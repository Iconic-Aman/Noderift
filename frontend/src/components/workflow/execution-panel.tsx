import { useState, useEffect, useRef } from "react";
import { X, Play, Loader2, CheckCircle2, AlertTriangle, ChevronDown, ChevronRight, Terminal } from "lucide-react";
import { LogMessage } from "../../hooks/useWebSocket";

interface ExecutionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogMessage[];
  status: string;
  onRun: () => void;
  loading: boolean;
}

export function ExecutionPanel({ isOpen, onClose, logs, status, onRun, loading }: ExecutionPanelProps) {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of logs on new messages
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  if (!isOpen) return null;

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex h-80 flex-col border-t border-slate-800 bg-slate-900/95 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex h-11 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-semibold text-slate-200">Execution Logs & Trace</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            status === "running" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
            status === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
            status === "failed" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
            "bg-slate-800 text-slate-400"
          }`}>
            {status.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRun}
            disabled={loading || status === "running"}
            className="flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
            Run Workflow
          </button>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Terminal Feed */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-slate-300">
        {logs.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-slate-500">
            <Terminal className="mb-2 h-8 w-8 opacity-40" />
            <p>No execution logs yet. Hit 'Run' to execute.</p>
          </div>
        ) : (() => {
          const unifiedLogs: Array<{
            id: string;
            name: string;
            type: string;
            status: "running" | "success" | "failed" | "system";
            message: string;
            duration_ms?: number;
            output?: any;
            error?: any;
          }> = [];

          const nodeIndexMap: Record<string, number> = {};

          logs.forEach((log) => {
            if (log.node_id) {
              const existingIdx = nodeIndexMap[log.node_id];
              if (existingIdx !== undefined) {
                const entry = unifiedLogs[existingIdx];
                if (log.type === "node_success") {
                  entry.status = "success";
                  entry.duration_ms = log.duration_ms;
                  entry.output = log.output;
                } else if (log.type === "node_failed") {
                  entry.status = "failed";
                  entry.duration_ms = log.duration_ms;
                  entry.error = log.error;
                }
              } else {
                nodeIndexMap[log.node_id] = unifiedLogs.length;
                unifiedLogs.push({
                  id: log.node_id,
                  name: log.node_name || "Node",
                  type: log.node_type || "node",
                  status: log.type === "node_started" ? "running" :
                          log.type === "node_success" ? "success" : "failed",
                  message: "",
                  duration_ms: log.duration_ms,
                  output: log.output,
                  error: log.error,
                });
              }
            } else {
              unifiedLogs.push({
                id: `system-${unifiedLogs.length}`,
                name: "System",
                type: "system",
                status: "system",
                message: log.type === "workflow_started" ? "Workflow execution started" :
                         log.type === "workflow_success" ? "Workflow execution completed successfully" :
                         log.type === "workflow_failed" ? `Workflow execution failed: ${log.error}` :
                         "System event",
              });
            }
          });

          return (
            <div className="space-y-2">
              {unifiedLogs.map((log) => {
                const isNode = log.status !== "system";
                const isExpandable = isNode && !!(log.output || log.error);
                const isExpanded = expandedNodes[log.id];

                return (
                  <div key={log.id} className="rounded border border-slate-800/60 bg-slate-950/40 p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {log.status === "running" && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />}
                        {log.status === "success" && <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />}
                        {log.status === "failed" && <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
                        {log.status === "system" && <Terminal className="h-3.5 w-3.5 text-slate-400" />}
                        
                        <span className="font-semibold text-slate-200">
                          {log.name}
                        </span>
                        {isNode && <span className="text-[10px] text-slate-500">({log.type})</span>}
                        
                        <span className="text-[10px] text-slate-400">
                          {log.status === "running" && "executing..."}
                          {log.status === "success" && "completed"}
                          {log.status === "failed" && "failed"}
                          {log.status === "system" && log.message}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {log.duration_ms !== undefined && (
                          <span className="text-[10px] text-slate-500">{log.duration_ms}ms</span>
                        )}
                        {isExpandable && (
                          <button
                            onClick={() => toggleExpand(log.id)}
                            className="flex items-center gap-1 text-[10px] text-blue-400 hover:underline"
                          >
                            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            {isExpanded ? "Hide Details" : "Show Details"}
                          </button>
                        )}
                      </div>
                    </div>

                    {isExpanded && isExpandable && (
                      <div className="mt-2 border-t border-slate-800/80 pt-2 text-[11px]">
                        {log.error ? (
                          <pre className="overflow-x-auto rounded bg-red-950/20 p-2 text-red-400 whitespace-pre-wrap font-sans">
                            {log.error}
                          </pre>
                        ) : (
                          <pre className="overflow-x-auto rounded bg-slate-900/60 p-2 text-blue-300 whitespace-pre-wrap">
                            {JSON.stringify(log.output, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={logsEndRef} />
            </div>
          );
        })()}
      </div>
    </div>
  );
}
