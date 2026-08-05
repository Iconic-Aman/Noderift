import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function AIChatMessage({ message }: { message: Message }) {
  const isAssistant = message.role === "assistant";
  
  return (
    <div className={cn("flex gap-3", !isAssistant && "flex-row-reverse")}>
      <div className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
        isAssistant ? "bg-gradient-to-br from-violet-600 to-indigo-600" : "bg-slate-600"
      )}>
        {isAssistant ? <Bot className="h-4 w-4 text-white" /> : <User className="h-3.5 w-3.5 text-white" />}
      </div>
      <div className={cn(
        "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
        isAssistant ? "bg-slate-800/80 text-slate-200 rounded-tl-md" : "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-md"
      )}>
        {message.content}
      </div>
    </div>
  );
}

export function TypingIndicator({ steps = [] }: { steps?: string[] }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="bg-slate-800/80 rounded-2xl rounded-tl-md px-4 py-3 flex-1 space-y-2">
        {steps.length === 0 ? (
          <div className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.3s]" />
            <span className="h-2 w-2 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.15s]" />
            <span className="h-2 w-2 rounded-full bg-slate-500 animate-bounce" />
          </div>
        ) : (
          <ul className="space-y-1">
            {steps.map((step, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
                <span className="text-emerald-400">✓</span>
                {step}
              </li>
            ))}
            <li className="flex items-center gap-2 text-xs text-slate-500">
              <span className="flex gap-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce" />
              </span>
              Working...
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
