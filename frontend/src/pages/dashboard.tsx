import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Play, Trash2, AlertTriangle, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { AppNavbar } from "@/components/navbar/app-navbar";

type ConfirmModal = { type: "delete" | "undeploy"; workflowId: string; workflowName: string } | null;

export function Dashboard() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<ConfirmModal>(null);
  const navigate = useNavigate();

  useEffect(() => { loadWorkflows(); }, []);

  const loadWorkflows = async () => {
    try {
      const data = await apiFetch("/workflows/");
      setWorkflows(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const createWorkflow = async () => {
    try {
      const nw = await apiFetch("/workflows/", {
        method: "POST",
        body: JSON.stringify({ name: "New Workflow", description: "", is_active: false, graph: { nodes: [], edges: [] } }),
      });
      navigate(`/editor/${nw.id}`);
    } catch (e) { console.error(e); }
  };

  const handleDeleteClick = (wf: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (wf.is_active) {
      setConfirm({ type: "delete", workflowId: wf.id, workflowName: wf.name });
    } else {
      confirmDelete(wf.id);
    }
  };

  const confirmDelete = async (id: string) => {
    try {
      await apiFetch(`/workflows/${id}`, { method: "DELETE" });
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
    } catch (err) { console.error(err); } finally { setConfirm(null); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <AppNavbar title="Workflows" subtitle="My Automations">
        <button
          onClick={createWorkflow}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
        >
          <Plus className="h-4 w-4" /> New Workflow
        </button>
      </AppNavbar>

      {/* Confirmation Modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[420px] rounded-xl border border-amber-500/30 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="font-semibold text-white">
                  {confirm.type === "delete" ? "Delete Deployed Workflow?" : "Stop Automation?"}
                </p>
                <p className="text-xs text-slate-400">{confirm.workflowName}</p>
              </div>
              <button onClick={() => setConfirm(null)} className="ml-auto rounded p-1 text-slate-500 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-5 text-sm text-slate-300">
              {confirm.type === "delete"
                ? "This workflow is currently deployed and running automations. Deleting it will permanently stop all its triggers and scheduled jobs. This cannot be undone."
                : "This workflow is currently active. Undeploying it will stop all automations, webhooks, and scheduled triggers immediately."
              }
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirm(null)} className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 cursor-pointer">
                Cancel
              </button>
              <button
                onClick={() => confirm.type === "delete" ? confirmDelete(confirm.workflowId) : setConfirm(null)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 cursor-pointer"
              >
                {confirm.type === "delete" ? "Yes, Delete" : "Yes, Stop"}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 px-8 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workflows.map((wf) => (
              <div
                key={wf.id}
                onClick={() => navigate(`/editor/${wf.id}`)}
                className="group cursor-pointer rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition-all hover:border-slate-700 hover:bg-slate-800/50"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                    <Play className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${wf.is_active ? 'bg-green-500/10 text-green-400' : 'bg-slate-800 text-slate-400'}`}>
                      {wf.is_active && <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse inline-block" />}
                      {wf.is_active ? 'Deployed' : 'Inactive'}
                    </span>
                    <button onClick={(e) => handleDeleteClick(wf, e)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <h3 className="mb-1 text-base font-semibold text-white">{wf.name}</h3>
                <p className="text-xs text-slate-400">Nodes: {wf.node_count || 0}</p>
              </div>
            ))}
            {workflows.length === 0 && (
              <div className="col-span-full py-12 text-center border border-dashed border-slate-800 rounded-xl">
                <p className="text-slate-400 mb-2">No workflows yet.</p>
                <button onClick={createWorkflow} className="text-sm text-blue-400 hover:text-blue-300 cursor-pointer">Create your first one</button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
