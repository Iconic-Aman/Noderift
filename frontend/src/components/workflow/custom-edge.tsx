import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react';
import { Trash2 } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';

export function ButtonEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const { setEdges, edges, takeHistorySnapshot } = useWorkflowStore();
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgeClick = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    takeHistorySnapshot();
    setEdges(edges.filter((edge) => edge.id !== id));
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <foreignObject
        width={24}
        height={24}
        x={labelX - 12}
        y={labelY - 12}
        className="edgebutton-foreignobject"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <button
          type="button"
          className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-400 hover:bg-red-950 hover:text-red-200 hover:border-red-500/50 shadow-md transition-all active:scale-90 cursor-pointer"
          onClick={onEdgeClick}
          title="Delete Edge"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </foreignObject>
    </>
  );
}
