import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Send, Sparkles, X, Minimize2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { AIChatMessage, TypingIndicator } from "./ai-chat-message";
import { useAIPlannerSocket } from "@/hooks/useAIPlannerSocket";

type Message = { id: string; role: "user" | "assistant"; content: string; steps?: string[] };

const GREETING: Message = {
  id: "greeting",
  role: "assistant",
  content: "👋 Hey! I'm your AI workflow assistant.\n\nTell me what you want to automate and I'll build it live on the canvas — or ask me anything about what Noderift can do!",
};

export function AIChatPanel({ isDocked = false, onClose }: { isDocked?: boolean; onClose?: () => void }) {
  const { id: workflowId } = useParams();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    if (!workflowId) return [GREETING];
    try {
      const cached = localStorage.getItem(`noderift_chat_${workflowId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [GREETING];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const stepsRef = useRef<string[]>([]);

  const active = isDocked || open;

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    if (workflowId && messages.length > 0) {
      try {
        localStorage.setItem(`noderift_chat_${workflowId}`, JSON.stringify(messages));
      } catch {}
    }
  }, [messages, workflowId]);

  // Enable live websocket canvas updates & agent step events while panel open
  useAIPlannerSocket(active ? workflowId : undefined, (stepText) => {
    stepsRef.current.push(stepText);
    setSteps([...stepsRef.current]);
  });

  useEffect(() => {
    if (!active || !workflowId) return;
    apiFetch(`/ai/plan/${workflowId}/messages`)
      .then((history: Message[]) => {
        if (!Array.isArray(history) || history.length === 0) return;
        const stepsMap: Record<string, string[]> = {};
        // preserve in-memory steps
        messages.forEach((m) => {
          if (m.steps && m.steps.length > 0) stepsMap[m.content] = m.steps;
        });
        const merged = history.map((m) => ({
          ...m,
          steps: m.steps || stepsMap[m.content],
        }));
        // always keep greeting at top
        setMessages([GREETING, ...merged]);
      })
      .catch(() => {});
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
      // Only show execution steps for actual build requests, not conversation
      const finalSteps = res.is_build ? [...stepsRef.current] : [];
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
        <button
          onClick={onClose}
          title="Shrink to bubble"
          className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  const bodyContent = (
    <div className="flex-1 space-y-3 overflow-y-auto p-4">
      {messages.map((message) => (
        <AIChatMessage key={message.id} message={message} />
      ))}
      {messages.length <= 1 && (
        <div className="mt-3 space-y-2 border-t border-slate-800/80 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">⚡ Try this out</p>
          {[
            { emoji: "😂", label: "Daily Joke → Excel", prompt: "build a workflow where I'll get a joke from https://v2.jokeapi.dev/joke/Any everyday at 6pm and create an excel sheet" },
          ].map(({ emoji, label, prompt }) => (
            <button
              key={label}
              onClick={() => setInput(prompt)}
              className="w-full rounded border border-slate-800 bg-slate-900/80 px-3 py-2 text-left text-xs text-slate-300 hover:border-violet-500/50 hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <span className="mr-2">{emoji}</span>
                <span className="font-semibold text-slate-200">{label}</span>
              </div>
              <span className="text-[10px] text-violet-400 opacity-80 group-hover:opacity-100 font-medium">Try →</span>
            </button>
          ))}
        </div>
      )}
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
