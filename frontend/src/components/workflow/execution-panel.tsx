import { useEffect, useRef } from "react";
import { X, Play, Loader2, Terminal } from "lucide-react";
import { LogMessage } from "../../hooks/useWebSocket";
import { cn } from "../../lib/utils";
import { ExecutionLogEntry, LogEntry } from "./execution-log-entry";

interface ExecutionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogMessage[];
  status: string;
  onRun: () => void;
  loading: boolean;
  panelHeight?: number;
  onMouseDownResize?: (e: React.MouseEvent) => void;
  isResizing?: boolean;
}

function buildUnifiedLogs(logs: LogMessage[]): LogEntry[] {
  const unifiedLogs: LogEntry[] = [];
  const nodeIndexMap: Record<string, number> = {};

  logs.forEach((log) => {
    if (log.node_id) {
      const existingIdx = nodeIndexMap[log.node_id];
      if (existingIdx !== undefined) {
        const entry = unifiedLogs[existingIdx];
        if (log.type === "node_success") { entry.status = "success"; entry.duration_ms = log.duration_ms; entry.output = log.output; }
        else if (log.type === "node_failed") { entry.status = "failed"; entry.duration_ms = log.duration_ms; entry.error = log.error; }
      } else {
        nodeIndexMap[log.node_id] = unifiedLogs.length;
        unifiedLogs.push({ id: log.node_id, name: log.node_name || "Node", type: log.node_type || "node", status: log.type === "node_started" ? "running" : log.type === "node_success" ? "success" : "failed", message: "", duration_ms: log.duration_ms, output: log.output, error: log.error });
      }
    } else {
      unifiedLogs.push({ id: `system-${unifiedLogs.length}`, name: "System", type: "system", status: "system", message: log.type === "workflow_started" ? "Workflow execution started" : log.type === "workflow_success" ? "Workflow execution completed successfully" : log.type === "workflow_failed" ? `Workflow execution failed: ${log.error}` : "System event" });
    }
  });
  return unifiedLogs;
}

export function ExecutionPanel({ isOpen, onClose, logs, status, onRun, loading, panelHeight = 320, onMouseDownResize, isResizing = false }: ExecutionPanelProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const unifiedLogs = buildUnifiedLogs(logs);

  return (
    <div className={cn("fixed bottom-0 left-0 right-0 z-40 flex flex-col border-t border-slate-800 bg-slate-900/95 shadow-2xl backdrop-blur-md overflow-hidden", !isResizing && "transition-all duration-300")} style={{ height: isOpen ? `${panelHeight}px` : "0px" }}>
      {isOpen && onMouseDownResize && (
        <div onMouseDown={onMouseDownResize} className={cn("absolute top-0 left-0 right-0 h-1.5 cursor-row-resize hover:bg-blue-500/40 active:bg-blue-500 transition-all z-50", isResizing && "bg-blue-500/40 h-1.5")} style={{ transform: "translateY(-50%)" }} />
      )}
      <div className="flex h-11 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-semibold text-slate-200">Execution Logs & Trace</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status === "running" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : status === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20" : status === "failed" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-slate-800 text-slate-400"}`}>
            {status.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onRun} disabled={loading || status === "running"} className="flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
            Run Workflow
          </button>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-slate-300">
        {logs.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-slate-500">
            <Terminal className="mb-2 h-8 w-8 opacity-40" />
            <p>No execution logs yet. Hit 'Run' to execute.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {unifiedLogs.map(log => <ExecutionLogEntry key={log.id} log={log} />)}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
