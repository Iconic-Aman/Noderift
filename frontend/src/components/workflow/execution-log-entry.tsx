import { useState } from "react";
import { Loader2, CheckCircle2, AlertTriangle, ChevronDown, ChevronRight, Terminal, Download } from "lucide-react";
import { API_URL } from "@/lib/api";

interface LogEntry {
  id: string;
  name: string;
  type: string;
  status: "running" | "success" | "failed" | "system";
  message: string;
  duration_ms?: number;
  output?: any;
  error?: any;
}

interface Props {
  log: LogEntry;
}

export function ExecutionLogEntry({ log }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isNode = log.status !== "system";
  const isExpandable = isNode && !!(log.output || log.error);

  return (
    <div className="rounded border border-slate-800/60 bg-slate-950/40 p-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {log.status === "running" && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />}
          {log.status === "success" && <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />}
          {log.status === "failed" && <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
          {log.status === "system" && <Terminal className="h-3.5 w-3.5 text-slate-400" />}
          <span className="font-semibold text-slate-200">{log.name}</span>
          {isNode && <span className="text-[10px] text-slate-500">({log.type})</span>}
          <span className="text-[10px] text-slate-400">
            {log.status === "running" && "executing..."}
            {log.status === "success" && "completed"}
            {log.status === "failed" && "failed"}
            {log.status === "system" && log.message}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {log.status === "success" && (() => {
            const files: string[] = log.output?._generated_files || (log.output?.file ? [log.output.file] : log.output?.filename ? [log.output.filename] : log.output?.excel_file ? [log.output.excel_file] : []);
            return files.map((file) => (
              <a
                key={file}
                href={`${API_URL}/files/download/${file}`}
                download={file}
                className="flex items-center gap-1 rounded bg-blue-600/20 px-2 py-0.5 text-[10px] font-medium text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 transition-all cursor-pointer"
              >
                <Download className="h-3 w-3" />
                <span>Download {file}</span>
              </a>
            ));
          })()}
          {log.duration_ms !== undefined && <span className="text-[10px] text-slate-500">{log.duration_ms}ms</span>}
          {isExpandable && (
            <button onClick={() => setIsExpanded(v => !v)} className="flex items-center gap-1 text-[10px] text-blue-400 hover:underline">
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              {isExpanded ? "Hide Details" : "Show Details"}
            </button>
          )}
        </div>
      </div>
      {isExpanded && isExpandable && (
        <div className="mt-2 border-t border-slate-800/80 pt-2 text-[11px]">
          {log.error ? (
            <pre className="overflow-x-auto rounded bg-red-950/20 p-2 text-red-400 whitespace-pre-wrap font-sans">{log.error}</pre>
          ) : (
            <pre className="overflow-x-auto rounded bg-slate-900/60 p-2 text-blue-300 whitespace-pre-wrap">{JSON.stringify(log.output, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
}

export type { LogEntry };
