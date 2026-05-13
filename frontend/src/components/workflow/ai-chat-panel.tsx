import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIChatMessage, TypingIndicator } from "./ai-chat-message";

export function AIChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ id: "welcome", role: "assistant", content: "Describe what you want to automate and I'll build it for you." }]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);
  useEffect(() => { if (isOpen) inputRef.current?.focus(); }, [isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: "user", content: input.trim() }]);
    setInput("");
    setIsTyping(true);
    setTimeout(() => {
      const resp = ["I can help you build that workflow...", "Great idea!", "I understand.", "Perfect!"];
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: "assistant", content: resp[Math.floor(Math.random() * resp.length)] }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className={cn("fixed bottom-28 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg transition-all", isOpen && "scale-0")}>
        <Sparkles className="h-5 w-5" />
      </button>
      <div className={cn("fixed bottom-6 right-6 z-50 flex flex-col w-[380px] h-[500px] rounded-2xl overflow-hidden bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-2xl transition-all origin-bottom-right", isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none")}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
          <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-400" /><span className="text-sm font-semibold">Noderift AI</span></div>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(m => <AIChatMessage key={m.id} message={m as any} />)}
          {isTyping && <TypingIndicator />}
          <div ref={endRef} />
        </div>
        <div className="p-3 border-t border-slate-700/50 bg-slate-800/30">
          <div className="flex items-center gap-2 rounded-xl bg-slate-800/80 border border-slate-700/50 px-3 py-2">
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Describe automation..." className="flex-1 bg-transparent text-sm outline-none" />
            <button onClick={handleSend} disabled={!input.trim() || isTyping} className="text-violet-500 disabled:text-slate-500"><Send className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </>
  );
}
