import { memo } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { NodeData } from "@/types/workflow";
import { NodeIcon } from "./node-icons";

export const WorkflowNode = memo(({ data, selected }: NodeProps<Node<NodeData>>) => {
  return (
    <div
      className={`
        group relative flex flex-col items-center
        rounded-xl border backdrop-blur-xl
        transition-all duration-200
        ${
          selected
            ? "border-blue-500/50 shadow-lg shadow-blue-500/20"
            : "border-slate-600/30 hover:border-slate-500/50"
        }
        bg-slate-800/40
      `}
      style={{
        boxShadow: selected
          ? `0 0 20px ${data.color}30, 0 0 40px ${data.color}10`
          : "0 4px 20px rgba(0, 0, 0, 0.3)",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !rounded-full !border-2 !border-slate-600 !bg-slate-800 transition-colors group-hover:!border-slate-500"
      />
      <div className="flex flex-col items-center gap-2 px-6 py-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
          style={{
            backgroundColor: `${data.color}15`,
            boxShadow: `0 0 20px ${data.color}20`,
          }}
        >
          <NodeIcon icon={data.icon} color={data.color} className="h-6 w-6" />
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
