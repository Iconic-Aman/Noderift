import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Send, Sparkles, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { AIChatMessage, TypingIndicator } from "./ai-chat-message";
import { useAIPlannerSocket } from "@/hooks/useAIPlannerSocket";

type Message = { id: string; role: "user" | "assistant"; content: string };

export function AIChatPanel({ isDocked = false, onClose }: { isDocked?: boolean; onClose?: () => void }) {
  const { id: workflowId } = useParams();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const stepsRef = useRef<string[]>([]);

  const active = isDocked || open;

  // Enable live websocket canvas updates & agent step events while panel open
  useAIPlannerSocket(active ? workflowId : undefined, (stepText) => {
    stepsRef.current.push(stepText);
    setSteps([...stepsRef.current]);
  });

  useEffect(() => {
    if (!active || !workflowId) return;
    apiFetch(`/ai/plan/${workflowId}/messages`)
      .then(setMessages)
      .catch(() => setMessages([]));
  }, [active, workflowId]);

  const sendMessage = async () => {
    if (!workflowId || !input.trim()) return;
    const userMessage: Message = { id: `local-${Date.now()}`, role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    stepsRef.current = [];
    setSteps([]);
    setLoading(true);
    try {
      const res = await apiFetch("/ai/plan", {
        method: "POST",
        body: JSON.stringify({
          message: userMessage.content,
          session_id: workflowId,
        }),
      });
      const finalSteps = [...stepsRef.current];
      setMessages((prev) => [
        ...prev,
        { id: `res-${Date.now()}`, role: "assistant", content: res.reply, steps: finalSteps },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: err instanceof Error ? err.message : "Planner execution failed.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const headerContent = (
    <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
        <Sparkles className="h-4 w-4 text-violet-400" />
        AI Planner (Real-time)
      </div>
      {onClose && (
        <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  const bodyContent = (
    <div className="flex-1 space-y-3 overflow-y-auto p-4">
      {messages.length === 0 && (
        <div className="space-y-3">
          <p className="text-center text-xs text-slate-500">
            Ask me to design or modify this workflow live. Watch changes appear on canvas!
          </p>
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-400">⚡ Examples</p>
            <button
              onClick={() => setInput("add a webhook node, then add a code node and connect them")}
              className="w-full rounded border border-slate-700 bg-slate-800/60 px-3 py-2 text-left text-xs text-slate-300 hover:border-violet-500/50 hover:bg-slate-700 transition-colors"
            >
              📡 Webhook → Code flow
            </button>
          </div>
        </div>
      )}
      {messages.map((message) => (
        <AIChatMessage key={message.id} message={message} />
      ))}
      {loading && <TypingIndicator steps={steps} />}
    </div>
  );

  const inputContent = (
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
        placeholder="Describe what to build..."
        className="h-16 flex-1 resize-none rounded border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none"
      />
      <button onClick={sendMessage} disabled={loading} className="flex h-16 w-11 items-center justify-center rounded bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50">
        <Send className="h-4 w-4" />
      </button>
    </div>
  );

  if (isDocked) {
    return (
      <div className="flex h-full w-full flex-col overflow-hidden bg-slate-900 border-l border-slate-800">
        {headerContent}
        {bodyContent}
        {inputContent}
      </div>
    );
  }

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
              AI Planner (Real-time)
            </div>
            <button onClick={() => setOpen(false)} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          {bodyContent}
          {inputContent}
        </div>
      )}
    </>
  );
}
