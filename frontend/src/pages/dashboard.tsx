import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Play, Trash2, AlertTriangle, X, MousePointer, Sparkles, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { AppNavbar } from "@/components/navbar/app-navbar";
import { LlmKeyModal } from "@/components/workflow/llm-key-modal";
import { cn } from "@/lib/utils";

type ConfirmModal = { type: "delete" | "undeploy"; workflowId: string; workflowName: string } | null;

export function Dashboard() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmModal>(null);

  // Mode picker state
  const [showModePicker, setShowModePicker] = useState(false);
  const [pendingWorkflowId, setPendingWorkflowId] = useState<string | null>(null);
  const [showLlmModal, setShowLlmModal] = useState(false);

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
      // Show mode picker before going to editor
      setPendingWorkflowId(nw.id);
      setShowModePicker(true);
    } catch (e) { console.error(e); }
  };

  const openWorkflow = (id: string) => {
    setPendingWorkflowId(id);
    setShowModePicker(true);
  };

  const handleSelectManual = () => {
    setShowModePicker(false);
    navigate(`/editor/${pendingWorkflowId}?mode=manual`);
  };

  const handleSelectAI = async () => {
    try {
      const res = await apiFetch("/ai/llm-key-status");
      if (!res?.configured) {
        setShowModePicker(false);
        setShowLlmModal(true);
        return;
      }
    } catch {
      setShowModePicker(false);
      setShowLlmModal(true);
      return;
    }
    setShowModePicker(false);
    navigate(`/editor/${pendingWorkflowId}?mode=automatic`);
  };

  const handleDeleteClick = (wf: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirm({ type: "delete", workflowId: wf.id, workflowName: wf.name });
  };

  const confirmDelete = async (id: string) => {
    setDeletingId(id);
    setConfirm(null);
    try {
      await apiFetch(`/workflows/${id}`, { method: "DELETE" });
      setTimeout(() => {
        setWorkflows((prev) => prev.filter((w) => w.id !== id));
        setDeletingId(null);
      }, 350);
    } catch (err) {
      console.error(err);
      setDeletingId(null);
    }
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

      {/* Delete/Undeploy Confirmation Modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[420px] rounded-xl border border-rose-500/30 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/15">
                <AlertTriangle className="h-5 w-5 text-rose-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Delete Workflow?</p>
                <p className="text-xs text-slate-400">{confirm.workflowName}</p>
              </div>
              <button onClick={() => setConfirm(null)} className="ml-auto rounded p-1 text-slate-500 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-5 text-sm text-slate-300">
              Are you sure you want to delete this workflow? This action cannot be undone, and all nodes, settings, and logs will be permanently deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirm(null)} className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 cursor-pointer">
                Go Back
              </button>
              <button
                onClick={() => confirmDelete(confirm.workflowId)}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode Picker Modal */}
      {showModePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl p-8">
            <div className="text-center mb-8">
              <img src="/noderift-icon.jpg" alt="Noderift" className="h-10 w-10 rounded-xl object-cover mx-auto mb-3" />
              <h2 className="text-xl font-bold text-white mb-1">How do you want to build?</h2>
              <p className="text-sm text-slate-400">Choose your workflow editing mode</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Manual Mode */}
              <button
                onClick={handleSelectManual}
                className="group flex flex-col items-center gap-4 rounded-xl border border-slate-800 bg-slate-900 p-6 text-left hover:border-slate-600 hover:bg-slate-800/80 transition-all cursor-pointer"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 group-hover:bg-slate-700 transition-colors">
                  <MousePointer className="h-6 w-6 text-slate-300" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-white mb-1">Manual Mode</p>
                  <p className="text-xs text-slate-500 leading-relaxed">Drag & drop nodes to build your workflow visually</p>
                </div>
              </button>

              {/* AI Mode */}
              <button
                onClick={handleSelectAI}
                className="group flex flex-col items-center gap-4 rounded-xl border border-violet-500/30 bg-violet-500/5 p-6 text-left hover:border-violet-500/60 hover:bg-violet-500/10 transition-all cursor-pointer"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-950/50">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-white mb-1">AI Mode</p>
                  <p className="text-xs text-slate-500 leading-relaxed">Describe what you want â€” AI builds the workflow for you</p>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowModePicker(false)}
              className="mt-5 w-full rounded-lg py-2 text-xs text-slate-600 hover:text-slate-400 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* LLM Key Modal */}
      {showLlmModal && (
        <LlmKeyModal
          onClose={() => setShowLlmModal(false)}
          onSuccess={() => {
            setShowLlmModal(false);
            navigate(`/editor/${pendingWorkflowId}?mode=automatic`);
          }}
        />
      )}

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 md:px-8 pt-28 pb-12">
        <div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workflows.map((wf) => {
              const isDeleting = deletingId === wf.id;
              return (
                <div
                  key={wf.id}
                  onClick={() => !isDeleting && openWorkflow(wf.id)}
                  className={cn(
                    "group cursor-pointer rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition-all duration-300 ease-out",
                    isDeleting
                      ? "scale-90 opacity-0 -translate-y-3 bg-red-950/20 border-red-500/50 pointer-events-none shadow-lg shadow-red-950/30"
                      : "hover:border-slate-700 hover:bg-slate-800/50 hover:-translate-y-0.5"
                  )}
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
                      <button
                        onClick={(e) => handleDeleteClick(wf, e)}
                        disabled={isDeleting}
                        className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-100"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <h3 className="mb-1 text-base font-semibold text-white">{wf.name}</h3>
                  <p className="text-xs text-slate-400">Nodes: {wf.node_count || 0}</p>
                </div>
              );
            })}
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

