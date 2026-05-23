import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Clock, CheckCircle2, AlertTriangle, Play, Calendar, Terminal } from "lucide-react";
import { useExecution, ExecutionState } from "../hooks/useExecution";
import { apiFetch } from "../lib/api";

export default function History() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getHistory, getExecutionDetail } = useExecution();
  const [history, setHistory] = useState<ExecutionState[]>([]);
  const [selectedRun, setSelectedRun] = useState<any | null>(null);
  const [workflowName, setWorkflowName] = useState("Workflow");

  useEffect(() => {
    if (!id) return;
    apiFetch(`/workflows/${id}`).then((wf) => setWorkflowName(wf.name)).catch(() => {});
    getHistory(id).then(setHistory);
  }, [id]);

  const handleSelectRun = async (runId: string) => {
    try {
      const details = await getExecutionDetail(runId);
      setSelectedRun(details);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-slate-950 text-slate-200">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900 px-6">
        <div className="flex items-center gap-3">
          <Link to={`/editor/${id}`} className="rounded p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex flex-col">
            <span className="text-xs text-slate-500">Execution History</span>
            <span className="text-sm font-semibold">{workflowName}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Runs list */}
        <div className="flex flex-1 flex-col overflow-y-auto p-6">
          <h2 className="mb-4 text-lg font-bold text-slate-100">Past Runs</h2>
          {history.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-lg bg-slate-900/10">
              <Calendar className="mb-2 h-8 w-8 opacity-40" />
              <p>No recorded execution history for this workflow.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((run) => (
                <div
                  key={run.id}
                  onClick={() => handleSelectRun(run.id)}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-all ${
                    selectedRun?.id === run.id
                      ? "border-blue-500 bg-blue-500/5 shadow-md"
                      : "border-slate-800/80 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-900/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {run.status === "success" && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                    {run.status === "failed" && <AlertTriangle className="h-5 w-5 text-red-400" />}
                    {run.status === "running" && <Clock className="h-5 w-5 text-blue-400 animate-spin" />}
                    
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-400">{run.id.slice(0, 8)}</span>
                      <span className="text-[10px] text-slate-500">{new Date(run.started_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                      {run.triggered_by}
                    </span>
                    {run.finished_at && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock className="h-3 w-3" />
                        {Math.round((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 10) / 100}s
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Run detail trace panel */}
        {selectedRun && (
          <div className="w-96 border-l border-slate-800 bg-slate-900/60 overflow-y-auto flex flex-col p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-blue-400" />
                Run Details
              </h3>
              <button onClick={() => setSelectedRun(null)} className="text-slate-500 hover:text-white text-xs">
                Close
              </button>
            </div>
            
            <div className="space-y-4">
              {selectedRun.node_logs?.length === 0 ? (
                <p className="text-xs text-slate-500">No node log details recorded for this run.</p>
              ) : (
                selectedRun.node_logs.map((log: any) => (
                  <div key={log.id} className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3 text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-200">{log.node_id.split("-")[0]}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                        log.status === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    {log.duration_ms && (
                      <span className="text-[10px] text-slate-500 block mb-2">Duration: {log.duration_ms}ms</span>
                    )}
                    {log.error ? (
                      <pre className="overflow-x-auto rounded bg-red-950/20 p-2 text-red-400 whitespace-pre-wrap">{log.error}</pre>
                    ) : (
                      <pre className="overflow-x-auto rounded bg-slate-900/50 p-2 text-blue-300 font-mono text-[10px]">
                        {JSON.stringify(log.output, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
