import { useState, useCallback, useRef, DragEvent, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  ReactFlowInstance,
  Node,
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { NodePalette } from "@/components/workflow/node-palette";
import { NodeConfigPanel } from "@/components/workflow/node-config-panel";
import { TopNavbar } from "@/components/workflow/top-navbar";
import { WorkflowNode } from "@/components/workflow/workflow-node";
import { AIChatPanel } from "@/components/workflow/ai-chat-panel";
import { NodeData } from "@/types/workflow";
import { apiFetch } from "@/lib/api";
import { useWorkflowStore } from "@/store/workflowStore";
import { useExecution } from "@/hooks/useExecution";
import { useWebSocket } from "@/hooks/useWebSocket";
import { ExecutionPanel } from "@/components/workflow/execution-panel";

const nodeTypes = {
  workflowNode: WorkflowNode,
};

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { 
    nodes, edges, selectedNode, 
    onNodesChange, onEdgesChange, onConnect, 
    setNodes, setEdges, setSelectedNode, addNode, updateNodeConfig 
  } = useWorkflowStore();
  
  const [workflowName, setWorkflowName] = useState("Loading...");
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance<Node<NodeData>, Edge> | null>(null);

  // Execution integration
  const { triggerExecution, loading } = useExecution();
  const [activeExecutionId, setActiveExecutionId] = useState<string | null>(null);
  const [isExecutionPanelOpen, setIsExecutionPanelOpen] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<"idle" | "running" | "success">("idle");
  
  const { logs, setLogs } = useWebSocket(activeExecutionId);

  // Sync execution status from live websocket event logs
  useEffect(() => {
    if (logs.length > 0) {
      const lastLog = logs[logs.length - 1];
      if (lastLog.type === "workflow_started") {
        setExecutionStatus("running");
      } else if (lastLog.type === "workflow_success") {
        setExecutionStatus("success");
      } else if (lastLog.type === "workflow_failed") {
        setExecutionStatus("idle");
      }
    }
  }, [logs]);

  // Sync individual node execution states from live websocket logs
  useEffect(() => {
    const currentNodes = useWorkflowStore.getState().nodes;
    if (logs.length === 0) {
      const clearedNodes = currentNodes.map((n) => {
        if (n.data.status) {
          const { status, ...restData } = n.data;
          return { ...n, data: restData as NodeData };
        }
        return n;
      });
      if (clearedNodes.some((n, i) => n.data.status !== currentNodes[i].data.status)) {
        setNodes(clearedNodes);
      }
      return;
    }

    const latestStatuses: Record<string, "running" | "success" | "failed"> = {};
    for (const log of logs) {
      if (!log.node_id) continue;
      if (log.type === "node_started") {
        latestStatuses[log.node_id] = "running";
      } else if (log.type === "node_success") {
        latestStatuses[log.node_id] = "success";
      } else if (log.type === "node_failed") {
        latestStatuses[log.node_id] = "failed";
      }
    }

    let hasChanges = false;
    const updatedNodes = currentNodes.map((n) => {
      const nextStatus = latestStatuses[n.id];
      if (n.data.status !== nextStatus) {
        hasChanges = true;
        return {
          ...n,
          data: {
            ...n.data,
            status: nextStatus,
          },
        };
      }
      return n;
    });

    if (hasChanges) {
      setNodes(updatedNodes);
    }
  }, [logs, setNodes]);

  useEffect(() => {
    if (!id) return;
    const fetchWorkflow = async () => {
      try {
        const wf = await apiFetch(`/workflows/${id}`);
        setWorkflowName(wf.name);
        if (wf.graph && wf.graph.nodes) {
          setNodes(wf.graph.nodes);
          setEdges(wf.graph.edges || []);
        }
      } catch (err) {
        console.error("Failed to load workflow", err);
      }
    };
    fetchWorkflow();
  }, [id, setNodes, setEdges]);

  const onSave = async () => {
    if (!id || !rfInstance) return;
    try {
      await apiFetch(`/workflows/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: workflowName,
          graph: { nodes, edges },
        }),
      });
    } catch (err) {
      console.error("Failed to save workflow", err);
    }
  };

  const handleRun = async () => {
    if (!id) return;
    // Auto-save graph before running
    await onSave();
    
    setLogs([]);
    setExecutionStatus("running");
    setIsExecutionPanelOpen(true);

    try {
      const runData = await triggerExecution(id);
      setActiveExecutionId(runData.id);
    } catch (err) {
      console.error("Failed to execute workflow", err);
      setExecutionStatus("idle");
    }
  };

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<NodeData>) => {
    setSelectedNode(node);
  }, [setSelectedNode]);

  const onPaneClick = useCallback(() => setSelectedNode(null), [setSelectedNode]);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow/type");
      if (!type || !rfInstance || !reactFlowWrapper.current) return;

      const position = rfInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node<NodeData> = {
        id: `${type}-${Date.now()}`,
        type: "workflowNode",
        position,
        data: {
          label: event.dataTransfer.getData("application/reactflow/label"),
          icon: event.dataTransfer.getData("application/reactflow/icon"),
          category: event.dataTransfer.getData("application/reactflow/category"),
          color: event.dataTransfer.getData("application/reactflow/color"),
          config: {},
        },
      };
      addNode(newNode);
    },
    [rfInstance, addNode]
  );

  return (
    <div className="flex h-screen w-full flex-col bg-slate-950 text-slate-200">
      <TopNavbar
        workflowName={workflowName}
        onNameChange={setWorkflowName}
        status={executionStatus}
        onSave={onSave}
        onRun={handleRun}
        onHistory={() => navigate(`/history/${id}`)}
      />
      <div className="flex flex-1 overflow-hidden">
        <NodePalette />
        <div ref={reactFlowWrapper} className="relative flex-1">
          <ReactFlow<Node<NodeData>, Edge>
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onInit={setRfInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            deleteKeyCode={['Backspace', 'Delete']}
            selectionKeyCode={['Shift']}
            fitView
            className="bg-slate-950"
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
            <Controls 
              position="bottom-left" 
              className="!bg-slate-800/80 !border-slate-700 !rounded-lg !shadow-xl [&>button]:!bg-slate-800 [&>button]:!border-slate-700 [&>button]:!text-slate-300 [&>button:hover]:!bg-slate-700"
            />
            <MiniMap 
              position="bottom-right"
              className="!bg-slate-800/80 !border-slate-700 !rounded-lg"
              nodeColor="#3b82f6"
              maskColor="rgba(15, 23, 42, 0.8)"
            />
          </ReactFlow>
        </div>
        <NodeConfigPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onConfigChange={updateNodeConfig}
        />
        <AIChatPanel />
      </div>

      <ExecutionPanel
        isOpen={isExecutionPanelOpen}
        onClose={() => setIsExecutionPanelOpen(false)}
        logs={logs}
        status={executionStatus}
        onRun={handleRun}
        loading={loading}
      />
    </div>
  );
}
