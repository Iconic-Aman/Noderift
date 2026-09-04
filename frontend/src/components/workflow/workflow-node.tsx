import { memo } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { X, Check, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { NodeData } from "@/types/workflow";
import { NodeIcon } from "./node-icons";
import { useWorkflowStore } from "@/store/workflowStore";

export const WorkflowNode = memo(({ id, data, selected }: NodeProps<Node<NodeData>>) => {
  const setNodeToDelete = useWorkflowStore((s) => s.setNodeToDelete);

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodeToDelete({ id, label: data.label || id });
  };

  // Dynamically resolve icon and color for database nodes
  let displayIcon = data.icon;
  let displayColor = data.color;
  
  if (id.startsWith("database")) {
    const dbType = data.config?.db_type || "postgres";
    displayIcon = dbType;
    if (dbType === "postgres") {
      displayColor = "#3b82f6"; // Postgres Blue
    } else if (dbType === "mysql") {
      displayColor = "#00758f"; // MySQL Teal
    } else if (dbType === "mongodb") {
      displayColor = "#47A248"; // MongoDB Green
    }
  }

  return (
    <div
      className={`
        group relative flex flex-col items-center
        rounded-xl border backdrop-blur-xl
        transition-all duration-200
        ${
          data.status === "running"
            ? "border-blue-500/80 shadow-lg shadow-blue-500/30 scale-105 animate-[pulse_1.5s_infinite]"
            : data.status === "success"
            ? "border-emerald-500/80 shadow-lg shadow-emerald-500/20"
            : data.status === "failed"
            ? "border-rose-500/80 shadow-lg shadow-rose-500/20"
            : selected
            ? "border-blue-500/50 shadow-lg shadow-blue-500/20"
            : "border-slate-600/30 hover:border-slate-500/50"
        }
        bg-slate-800/40
      `}
      style={{
        boxShadow: data.status === "running"
          ? "0 0 25px rgba(59, 130, 246, 0.4)"
          : data.status === "success"
          ? "0 0 25px rgba(16, 185, 129, 0.3)"
          : data.status === "failed"
          ? "0 0 25px rgba(244, 63, 94, 0.3)"
          : selected
          ? `0 0 20px ${displayColor}30, 0 0 40px ${displayColor}10`
          : "0 4px 20px rgba(0, 0, 0, 0.3)",
        transition: "all 0.4s ease-out",
      }}
    >
      {/* Status Badge */}
      {data.status === "running" && (
        <div className="absolute -top-2.5 -left-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg border border-blue-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        </div>
      )}
      {data.status === "success" && (
        <div className="absolute -top-2.5 -left-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg border border-emerald-400">
          <Check className="h-3.5 w-3.5" />
        </div>
      )}
      {data.status === "failed" && (
        <div className="absolute -top-2.5 -left-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg border border-rose-400">
          <AlertCircle className="h-3.5 w-3.5" />
        </div>
      )}

      {selected && (
        <button
          onClick={onDelete}
          title="Delete Node"
          className="absolute -top-3 -right-3 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 border border-rose-500/60 text-rose-400 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-lg active:scale-95 cursor-pointer"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !rounded-full !border-2 !border-slate-600 !bg-slate-800 transition-colors group-hover:!border-slate-500"
      />
      <div className="flex flex-col items-center gap-2 px-6 py-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl group-hover:scale-105"
          style={{
            backgroundColor: `${displayColor}15`,
            boxShadow: `0 0 20px ${displayColor}20`,
            transition: "all 0.4s ease-out",
          }}
        >
          <NodeIcon icon={displayIcon} color={displayColor} className="h-6 w-6" />
        </div>
        <span className="max-w-[100px] truncate text-center text-xs font-medium text-slate-300">
          {data.label}
        </span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !rounded-full !border-2 !border-slate-600 !bg-slate-800 transition-colors group-hover:!border-slate-500"
      />
    </div>
  );
});

WorkflowNode.displayName = "WorkflowNode";
