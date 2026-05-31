import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Send, Sparkles, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { AIChatMessage, TypingIndicator } from "./ai-chat-message";
import { nodeTemplates, getNodeTemplate } from "@/lib/node-templates";
import { useWorkflowStore } from "@/store/workflowStore";
import { ReactFlowInstance, Node, Edge } from "@xyflow/react";
import { NodeData } from "@/types/workflow";

type Message = { id: string; role: "user" | "assistant"; content: string };
type Credential = { id: string; name: string };
type Proposal = { nodes?: { id: string; type: string; config?: Record<string, any> }[]; edges?: { source: string; target: string }[] };
const builderNodeIds = new Set(["schedule", "webhook", "http", "code", "playwright", "composio", "whatsapp", "resend", "filter", "merge", "loop", "set_variable", "ai_agent"]);

export function AIChatPanel({ rfInstance }: { rfInstance: ReactFlowInstance<Node<NodeData>, Edge> | null }) {
  const { id: workflowId } = useParams();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [credentialId, setCredentialId] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [proposalNotice, setProposalNotice] = useState("");
  const [building, setBuilding] = useState(false);
  const { nodes, edges, setNodes, setEdges, takeHistorySnapshot } = useWorkflowStore();

  useEffect(() => {
    apiFetch("/credentials/").then(setCredentials).catch(() => setCredentials([]));
  }, []);

  useEffect(() => {
    if (!open || !workflowId) return;
    apiFetch(`/workflows/${workflowId}/ai/messages`).then(setMessages).catch(() => setMessages([]));
  }, [open, workflowId]);

  const sendMessage = async () => {
    if (!workflowId || !input.trim()) return;
    if (!credentialId || !baseUrl.trim() || !model.trim()) {
      setMessages((prev) => [...prev, { id: `error-${Date.now()}`, role: "assistant", content: "Select a provider credential, base URL, and model before sending." }]);
      return;
    }
    const userMessage: Message = { id: `local-${Date.now()}`, role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    try {
      const res = await apiFetch(`/workflows/${workflowId}/ai/chat`, {
        method: "POST",
        body: JSON.stringify({
          message: userMessage.content,
          credential_id: credentialId,
          base_url: baseUrl.trim(),
          model: model.trim(),
          temperature: 0.7,
          current_graph: { nodes, edges },
          node_catalog: nodeTemplates.filter((node) => builderNodeIds.has(node.id)).map((node) => ({
            id: node.id,
            label: node.label,
            category: node.category,
            description: node.description,
            fields: node.configFields.map((field) => ({ name: field.name, label: field.label, options: field.options })),
          })),
        }),
      });
      setMessages(res.history || [...messages, userMessage, res.message]);
      setProposal(res.proposal || null);
      setProposalNotice(res.proposal ? "" : "No workflow proposal was found in the AI response.");
    } catch (err) {
      setMessages((prev) => [...prev, {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: err instanceof Error ? err.message : "AI request failed.",
      }]);
      setProposalNotice("");
    } finally {
      setLoading(false);
    }
  };

  const applyProposal = () => {
    if (!proposal?.nodes?.length) return;
    setBuilding(true);
    takeHistorySnapshot();
    const idMap: Record<string, string> = {};
    const center = rfInstance?.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 }) || { x: 260, y: 180 };
    const startX = center.x - ((proposal.nodes.length - 1) * 280) / 2;
    const nextNodes = proposal.nodes.map((item, index) => {
      const template = getNodeTemplate(item.type);
      const id = item.id.includes("-") ? item.id : `${item.type}-${Date.now()}-${index}`;
      idMap[item.id] = id;
      return {
        id,
        type: "workflowNode",
        position: { x: startX + index * 280, y: center.y },
        data: {
          label: template?.label || item.type,
          icon: template?.icon || "zap",
          category: template?.category || "actions",
          color: template?.color || "#3b82f6",
          config: item.config || {},
        },
      };
    });
    const nextEdges = (proposal.edges || []).map((edge, index) => ({
      id: `ai-edge-${Date.now()}-${index}`,
      source: idMap[edge.source] || edge.source,
      target: idMap[edge.target] || edge.target,
      type: "buttonEdge",
    }));
    setNodes([...nodes, ...nextNodes]);
    setEdges([...edges, ...nextEdges]);
    setProposal(null);
    setProposalNotice("");
    setTimeout(() => {
      rfInstance?.fitView({ nodes: nextNodes.map((node) => ({ id: node.id })), padding: 0.45, duration: 700 });
      setBuilding(false);
    }, 350);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-28 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer"
      >
        <Sparkles className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[620px] w-[380px] flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <Sparkles className="h-4 w-4 text-violet-400" />
              AI Workflow Builder
            </div>
            <button onClick={() => setOpen(false)} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2 border-b border-slate-800 p-3">
            <select value={credentialId} onChange={(e) => setCredentialId(e.target.value)} className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200">
              <option value="">Provider credential</option>
              {credentials.map((credential) => <option key={credential.id} value={credential.id}>{credential.name}</option>)}
            </select>
            <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="Provider base URL" className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 outline-none" />
            <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model name" className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 outline-none" />
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && <p className="text-center text-xs text-slate-500">Ask me to design or change this workflow.</p>}
            {messages.map((message) => <AIChatMessage key={message.id} message={message} />)}
            {loading && <TypingIndicator />}
            {proposal?.nodes?.length ? (
              <button onClick={applyProposal} className="w-full rounded bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500">
                Apply {proposal.nodes.length} proposed node{proposal.nodes.length === 1 ? "" : "s"}
              </button>
            ) : null}
            {proposalNotice && <p className="rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">{proposalNotice}</p>}
          </div>

          <div className="flex gap-2 border-t border-slate-800 p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Describe the workflow you want..."
              className="h-16 flex-1 resize-none rounded border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none"
            />
            <button onClick={sendMessage} disabled={loading} className="flex h-16 w-11 items-center justify-center rounded bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {building && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-xl border border-violet-500/30 bg-slate-900 px-5 py-4 text-sm font-semibold text-slate-100 shadow-2xl">
            <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
            Building workflow...
          </div>
        </div>
      )}
    </>
  );
}
