import { useEffect, useRef, useState } from "react";
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
        else if (log.type === "node_failed" || log.type === "needs_auth") { entry.status = "failed"; entry.duration_ms = log.duration_ms; entry.error = log.error || (log.node_type?.includes("gmail") ? "Gmail authentication required" : "Node execution failed"); }
      } else {
        nodeIndexMap[log.node_id] = unifiedLogs.length;
        unifiedLogs.push({
          id: log.node_id,
          name: log.node_name || log.node_id,
          type: log.node_type || log.node_id.split("-")[0],
          status: log.type === "node_started" ? "running" : log.type === "node_success" ? "success" : log.type === "node_failed" || log.type === "needs_auth" ? "failed" : "running",
          message: "",
          duration_ms: log.duration_ms,
          output: log.output,
          error: log.error || (log.type === "needs_auth" && log.node_type?.includes("gmail") ? "Gmail authentication required" : log.type === "needs_auth" ? "Authentication required" : undefined)
        });
      }
    } else {
      unifiedLogs.push({
        id: `system-${unifiedLogs.length}`,
        name: "System",
        type: "system",
        status: "system",
        message: log.type === "workflow_started"
          ? "Workflow execution started"
          : log.type === "workflow_success"
          ? "Workflow execution completed successfully"
          : log.type === "needs_auth"
          ? (log.node_type?.includes("gmail") ? "Gmail authentication required — click 'Connect Gmail' button above" : "Authentication required")
          : log.type === "workflow_failed"
          ? `Workflow execution failed: ${log.error}`
          : "System event"
      });
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

  const [showRunningNotice, setShowRunningNotice] = useState(false);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRunClick = () => {
    if (loading || status === "running") {
      setShowRunningNotice(true);
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = setTimeout(() => setShowRunningNotice(false), 3000);
      return;
    }
    onRun();
  };

  return (
    <div className={cn("fixed bottom-0 left-0 right-0 z-40 flex flex-col border-t border-slate-800 bg-slate-900/95 shadow-2xl backdrop-blur-md overflow-hidden", !isResizing && "transition-all duration-300")} style={{ height: isOpen ? `${panelHeight}px` : "0px" }}>
      {isOpen && onMouseDownResize && (
        <div onMouseDown={onMouseDownResize} className={cn("absolute top-0 left-0 right-0 h-1.5 cursor-row-resize hover:bg-blue-500/40 active:bg-blue-500 transition-all z-50", isResizing && "bg-blue-500/40 h-1.5")} style={{ transform: "translateY(-50%)" }} />
      )}
      <div className="flex h-11 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-semibold text-slate-200">Execution Logs & Trace</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status === "running" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : status === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20" : status === "needs_auth" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : status === "failed" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-slate-800 text-slate-400"}`}>
            {status.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {logs.some((l) => l.type === "needs_auth") && (
            <button
              onClick={() => {
                const authLog = logs.find((l) => l.type === "needs_auth");
                const connectUrl = authLog?.connect_url || "/api/oauth/gmail/start";
                const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api$/, "") : "";
                window.open(`${baseUrl}${connectUrl}`, "_blank", "width=600,height=700");
              }}
              className="flex items-center gap-1.5 rounded bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-500 cursor-pointer"
            >
              Connect {logs.find((l) => l.type === "needs_auth")?.provider === "slack" ? "Slack" : "Gmail"}
            </button>
          )}
          <div className="relative">
            <button
              onClick={handleRunClick}
              className={cn(
                "flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium transition-all shadow-md active:scale-95 cursor-pointer",
                loading || status === "running"
                  ? "bg-blue-600/70 text-blue-200"
                  : "bg-blue-600 text-white hover:bg-blue-500"
              )}
            >
              {loading || status === "running" ? <Loader2 className="h-3 w-3 animate-spin text-blue-200" /> : <Play className="h-3 w-3" />}
              <span>{loading || status === "running" ? "Running..." : "Run Workflow"}</span>
            </button>
            {showRunningNotice && (
              <div className="absolute right-0 top-full mt-2 z-[99999] flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-900 border border-slate-200 shadow-2xl shadow-black/50 animate-in fade-in slide-in-from-top-1">
                <Loader2 className="h-3 w-3 animate-spin text-slate-900" />
                <span>It's running, wait to see output</span>
              </div>
            )}
          </div>
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
