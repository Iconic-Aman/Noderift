import { useState, useRef, useEffect } from "react";
import { Save, Play, Check, Loader2, Clock, Undo, Power, ArrowLeft, Download, MousePointer, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export function TopNavbar({
  workflowName,
  onNameChange,
  status,
  onSave,
  onRun,
  onHistory,
  onUndo,
  isActive,
  isDeploying,
  onToggleActive,
  onDownload,
  mode,
  onModeChange,
}: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(workflowName);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [showRunningNotice, setShowRunningNotice] = useState(false);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const handleRunClick = () => {
    if (status === "running") {
      setShowRunningNotice(true);
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = setTimeout(() => setShowRunningNotice(false), 3000);
      return;
    }
    onRun();
  };

  const handleSubmit = () => {
    onNameChange(editValue.trim() || workflowName);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setSaveState("saving");
    await onSave();
    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 2000);
  };

  const statusCfg: Record<string, { label: string; icon: any; cls: string; spin?: boolean }> = {
    idle: { label: "Idle", icon: Clock, cls: "bg-slate-700/50 text-slate-400 border-slate-600/50" },
    running: { label: "Running", icon: Loader2, cls: "bg-blue-500/10 text-blue-400 border-blue-500/30", spin: true },
    success: { label: "Success", icon: Check, cls: "bg-green-500/10 text-green-400 border-green-500/30" },
    failed: { label: "Failed", icon: Clock, cls: "bg-red-500/10 text-red-400 border-red-500/30" },
    needs_auth: { label: "Needs Auth", icon: Clock, cls: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  };
  const cfg = statusCfg[status] || statusCfg.idle;

  return (
    <div className="relative z-50 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard"
          className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back</span>
        </Link>
        <div className="flex items-center gap-2">
          <img src="/noderift-icon.jpg" alt="Noderift" className="h-8 w-8 rounded-lg object-cover shadow-sm" />
          <span className="text-sm font-semibold text-slate-200">Noderift</span>
        </div>
        <div className="h-5 w-px bg-slate-700" />
        {isEditing ? (
          <input ref={inputRef} value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={handleSubmit}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} className="bg-slate-800 text-sm px-2 py-1 rounded outline-none" />
        ) : (
          <button onClick={() => setIsEditing(true)} className="text-sm font-medium text-slate-300 hover:text-white cursor-pointer">{workflowName}</button>
        )}
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 p-0.5 shadow-inner">
        <button
          onClick={() => onModeChange("manual")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all cursor-pointer",
            mode === "manual"
              ? "bg-slate-800 text-slate-100 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <MousePointer className="h-3 w-3" />
          <span>Manual</span>
        </button>
        <button
          onClick={() => onModeChange("automatic")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all cursor-pointer",
            mode === "automatic"
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-950/40"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Sparkles className="h-3 w-3" />
          <span>AI Mode</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", cfg.cls)}>
          <cfg.icon className={cn("h-3 w-3", cfg.spin && "animate-spin")} />
          <span>{cfg.label}</span>
        </div>

        {onHistory && (
          <button
            onClick={onHistory}
            title="History"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer shadow-md active:scale-95 transition-all"
          >
            <Clock className="h-4 w-4" />
          </button>
        )}

        <button
          onClick={onUndo}
          title="Undo (Ctrl + Z)"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer shadow-md active:scale-95 transition-all"
        >
          <Undo className="h-4 w-4" />
        </button>

        <button
          onClick={onDownload}
          title="Export Workflow as JSON"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer shadow-md active:scale-95 transition-all"
        >
          <Download className="h-4 w-4" />
        </button>

        <button onClick={handleSave} disabled={saveState === "saving"} className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm hover:bg-slate-700 disabled:opacity-50 cursor-pointer">
          {saveState === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : saveState === "saved" ? <Check className="h-4 w-4 text-green-400" /> : <Save className="h-4 w-4" />}
          {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved!" : "Save"}
        </button>
        <button
          onClick={onToggleActive}
          disabled={isDeploying}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50",
            isActive
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 shadow-emerald-950/20"
              : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/80"
          )}
        >
          {isDeploying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              <span>Deploying...</span>
            </>
          ) : isActive ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Deployed</span>
            </>
          ) : (
            <>
              <Power className="h-4 w-4 text-slate-400" />
              <span>Deploy</span>
            </>
          )}
        </button>
        <div className="relative">
          <button
            onClick={handleRunClick}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all shadow-md active:scale-95 cursor-pointer",
              status === "running"
                ? "bg-blue-600/80 text-blue-100 hover:bg-blue-600/90"
                : "bg-blue-600 text-white hover:bg-blue-500"
            )}
          >
            {status === "running" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-blue-200" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Run</span>
              </>
            )}
          </button>
          {showRunningNotice && (
            <div className="absolute right-0 top-full mt-2 z-[99999] flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 border border-slate-200 shadow-2xl shadow-black/50 animate-in fade-in slide-in-from-top-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-900" />
              <span>It's running, wait to see output</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
