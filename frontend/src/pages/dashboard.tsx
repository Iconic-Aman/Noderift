import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Play, LogOut, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

export function Dashboard() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadWorkflows();
  }, []);

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
    } catch (e) {
      console.error(e);
    }
  };

  const deleteWorkflow = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiFetch(`/workflows/${id}`, { method: "DELETE" });
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const logout = () => {
    localStorage.removeItem("noderift_token");
    navigate("/login");
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-950 px-8 py-10 text-slate-200">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">My Workflows</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={createWorkflow}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
            >
              <Plus className="h-4 w-4" /> New Workflow
            </button>
            <button onClick={logout} className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>

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
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${wf.is_active ? 'bg-green-500/10 text-green-400' : 'bg-slate-800 text-slate-400'}`}>
                    {wf.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button onClick={(e) => deleteWorkflow(wf.id, e)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
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
               <button onClick={createWorkflow} className="text-sm text-blue-400 hover:text-blue-300">Create your first one</button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
