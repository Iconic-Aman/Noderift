import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Send, Sparkles, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { AIChatMessage, TypingIndicator } from "./ai-chat-message";

type Message = { id: string; role: "user" | "assistant"; content: string };
type Credential = { id: string; name: string };

export function AIChatPanel() {
  const { id: workflowId } = useParams();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [credentialId, setCredentialId] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch("/credentials/").then(setCredentials).catch(() => setCredentials([]));
  }, []);

  useEffect(() => {
    if (!open || !workflowId) return;
    apiFetch(`/workflows/${workflowId}/ai/messages`).then(setMessages).catch(() => setMessages([]));
  }, [open, workflowId]);

  const sendMessage = async () => {
    if (!workflowId || !input.trim() || !credentialId || !baseUrl.trim() || !model.trim()) return;
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
        }),
      });
      setMessages(res.history || [...messages, userMessage, res.message]);
    } finally {
      setLoading(false);
    }
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
    </>
  );
}
