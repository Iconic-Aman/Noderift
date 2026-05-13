import { useState, useRef, useEffect } from "react";
import { Save, Play, Check, Loader2, MoreHorizontal, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function TopNavbar({ workflowName, onNameChange, status, onSave, onRun }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(workflowName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const handleSubmit = () => {
    onNameChange(editValue.trim() || workflowName);
    setIsEditing(false);
  };

  const statusCfg = {
    idle: { label: "Idle", icon: Clock, cls: "bg-slate-700/50 text-slate-400 border-slate-600/50" },
    running: { label: "Running", icon: Loader2, cls: "bg-blue-500/10 text-blue-400 border-blue-500/30", spin: true },
    success: { label: "Success", icon: Check, cls: "bg-green-500/10 text-green-400 border-green-500/30" },
  };
  const cfg = statusCfg[status as keyof typeof statusCfg];

  return (
    <div className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600"><Zap className="h-4 w-4 text-white" /></div>
          <span className="text-sm font-semibold text-slate-200">Noderift</span>
        </div>
        <div className="h-5 w-px bg-slate-700" />
        {isEditing ? (
          <input ref={inputRef} value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={handleSubmit}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} className="bg-slate-800 text-sm px-2 py-1 rounded outline-none" />
        ) : (
          <button onClick={() => setIsEditing(true)} className="text-sm font-medium text-slate-300 hover:text-white">{workflowName}</button>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", cfg.cls)}>
          <cfg.icon className={cn("h-3 w-3", cfg.spin && "animate-spin")} />
          <span>{cfg.label}</span>
        </div>
        <button onClick={onSave} className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm hover:bg-slate-700"><Save className="h-4 w-4" />Save</button>
        <button onClick={onRun} disabled={status === "running"} className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500 disabled:opacity-50"><Play className="h-4 w-4" />Run</button>
      </div>
    </div>
  );
}

function Zap(props: any) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>;
}
