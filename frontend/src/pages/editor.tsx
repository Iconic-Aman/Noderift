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
import { ChevronLeft, ChevronRight, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

import { ButtonEdge } from "@/components/workflow/custom-edge";

const nodeTypes = {
  workflowNode: WorkflowNode,
};

const edgeTypes = {
  buttonEdge: ButtonEdge,
};

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { 
    nodes, edges, selectedNode, 
    onNodesChange, onEdgesChange, onConnect, 
    setNodes, setEdges, setSelectedNode, addNode, updateNodeConfig,
    undo, takeHistorySnapshot
  } = useWorkflowStore();
  
  const [workflowName, setWorkflowName] = useState("Loading...");
  const [isActive, setIsActive] = useState(false);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance<Node<NodeData>, Edge> | null>(null);

  // Sidebar toggle states
  const [isLeftOpen, setIsLeftOpen] = useState(true);
  const [isRightOpen, setIsRightOpen] = useState(true);

  // Resizable sidebar and logs panel states
  const [leftWidth, setLeftWidth] = useState(260);
  const [rightWidth, setRightWidth] = useState(300);
  const [panelHeight, setPanelHeight] = useState(320);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [isResizingPanel, setIsResizingPanel] = useState(false);

  const startLeftResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingLeft(true);
  }, []);

  const startRightResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingRight(true);
  }, []);

  const startPanelResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingPanel(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        const newWidth = Math.max(40, Math.min(500, e.clientX));
        setLeftWidth(newWidth);
      }
      if (isResizingRight) {
        const newWidth = Math.max(250, Math.min(600, window.innerWidth - e.clientX));
        setRightWidth(newWidth);
      }
      if (isResizingPanel) {
        const newHeight = Math.max(150, Math.min(600, window.innerHeight - e.clientY));
        setPanelHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
      setIsResizingPanel(false);
    };

    if (isResizingLeft || isResizingRight || isResizingPanel) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingLeft, isResizingRight, isResizingPanel]);

  // Execution integration
  const { triggerExecution, loading } = useExecution();
  const [activeExecutionId, setActiveExecutionId] = useState<string | null>(null);
  const [isExecutionPanelOpen, setIsExecutionPanelOpen] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<"idle" | "running" | "success">("idle");
  const [isSingleRun, setIsSingleRun] = useState(false);
  
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
      // If full run starting, logs is empty, we clear all node status. 
      // If single run starting, handleRunNode clears the target node directly, so we do nothing here.
      if (!isSingleRun) {
        const clearedNodes = currentNodes.map((n) => {
          if (n.data.status || n.data.output || n.data.error) {
            const { status, output, error, ...restData } = n.data;
            return { ...n, data: restData as NodeData };
          }
          return n;
        });
        if (clearedNodes.some((n, i) => n.data.status !== currentNodes[i].data.status)) {
          setNodes(clearedNodes);
        }
      }
      return;
    }

    const latestStatuses: Record<string, "running" | "success" | "failed"> = {};
    const latestOutputs: Record<string, any> = {};
    const latestErrors: Record<string, any> = {};
    for (const log of logs) {
      if (!log.node_id) continue;
      if (log.type === "node_started") {
        latestStatuses[log.node_id] = "running";
      } else if (log.type === "node_success") {
        latestStatuses[log.node_id] = "success";
        latestOutputs[log.node_id] = log.output;
      } else if (log.type === "node_failed") {
        latestStatuses[log.node_id] = "failed";
        latestErrors[log.node_id] = log.error;
      }
    }

    let hasChanges = false;
    const updatedNodes = currentNodes.map((n) => {
      const nextStatus = latestStatuses[n.id];
      const nextOutput = latestOutputs[n.id];
      const nextError = latestErrors[n.id];
      
      // If this is a single node run, only update the nodes that are actually part of the logs
      if (isSingleRun && nextStatus === undefined) {
        return n;
      }

      let nodeChanged = false;
      const nextData = { ...n.data };
      
      if (n.data.status !== nextStatus) {
        nextData.status = nextStatus;
        nodeChanged = true;
      }
      if (nextOutput !== undefined && JSON.stringify(nextOutput) !== JSON.stringify(n.data.output)) {
        nextData.output = nextOutput;
        nodeChanged = true;
      }
      if (nextError !== undefined && nextError !== n.data.error) {
        nextData.error = nextError;
        nodeChanged = true;
      }
      
      if (nodeChanged) {
        hasChanges = true;
        return { ...n, data: nextData };
      }
      return n;
    });

    if (hasChanges) {
      setNodes(updatedNodes);
    }
  }, [logs, setNodes, isSingleRun]);


  // Keyboard Undo Shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [undo]);

  const onNodeDragStop = useCallback(() => {
    takeHistorySnapshot();
  }, [takeHistorySnapshot]);

  useEffect(() => {
    if (!id) return;
    const fetchWorkflow = async () => {
      try {
        const wf = await apiFetch(`/workflows/${id}`);
        setWorkflowName(wf.name);
        setIsActive(wf.is_active);
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

  const onToggleActive = async () => {
    if (!id) return;
    try {
      await onSave();
      const res = await apiFetch(`/workflows/${id}/activate`, { method: "PATCH" });
      setIsActive(res.is_active);
    } catch (err) {
      console.error("Failed to toggle workflow triggers state", err);
    }
  };

  const handleRun = async () => {
    if (!id) return;
    // Auto-save graph before running
    await onSave();
    
    setIsSingleRun(false);
    setLogs([]);
    setExecutionStatus("running");
    setIsExecutionPanelOpen(true);

    // Clear all node execution states immediately for a full run
    const currentNodes = useWorkflowStore.getState().nodes;
    const clearedNodes = currentNodes.map((n) => {
      if (n.data.status || n.data.output || n.data.error) {
        const { status, output, error, ...restData } = n.data;
        return { ...n, data: restData as NodeData };
      }
      return n;
    });
    setNodes(clearedNodes);

    try {
      const runData = await triggerExecution(id);
      setActiveExecutionId(runData.id);
    } catch (err) {
      console.error("Failed to execute workflow", err);
      setExecutionStatus("idle");
    }
  };

  const handleRunNode = async (nodeId: string) => {
    if (!id) return;
    // Auto-save graph before running
    await onSave();
    
    setIsSingleRun(true);
    setLogs([]);
    setExecutionStatus("running");
    setIsExecutionPanelOpen(true);

    // Clear ONLY the target node state immediately for single run
    const currentNodes = useWorkflowStore.getState().nodes;
    const clearedNodes = currentNodes.map((n) => {
      if (n.id === nodeId) {
        const { status, output, error, ...restData } = n.data;
        return { ...n, data: restData as NodeData };
      }
      return n;
    });
    setNodes(clearedNodes);

    try {
      const runData = await triggerExecution(id, nodeId);
      setActiveExecutionId(runData.id);
    } catch (err) {
      console.error("Failed to execute node", err);
      setExecutionStatus("idle");
    }
  };

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<NodeData>) => {
    setSelectedNode(node);
    setIsRightOpen(true);
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
    <div className={cn(
      "flex h-screen w-full flex-col bg-slate-950 text-slate-200",
      (isResizingLeft || isResizingRight) && "select-none cursor-col-resize",
      isResizingPanel && "select-none cursor-row-resize"
    )}>
      <TopNavbar
        workflowName={workflowName}
        onNameChange={setWorkflowName}
        status={executionStatus}
        onSave={onSave}
        onUndo={undo}
        onRun={handleRun}
        onHistory={() => navigate(`/history/${id}`)}
        isActive={isActive}
        onToggleActive={onToggleActive}
      />
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sliding Sidebar */}
        <div className="relative flex h-full shrink-0 z-10">
          <div
            className={cn("overflow-hidden flex flex-col h-full", !isResizingLeft && "transition-all duration-300")}
            style={{ width: isLeftOpen ? `${leftWidth}px` : "0px" }}
          >
            <NodePalette />
          </div>
          <button
            onClick={() => setIsLeftOpen(!isLeftOpen)}
            className="absolute top-1/2 -right-3.5 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-400 hover:text-white shadow-lg hover:bg-slate-800 transition-all cursor-pointer"
            style={{ transform: "translateX(50%)" }}
          >
            {isLeftOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {isLeftOpen && (
            <div
              onMouseDown={startLeftResize}
              className={cn(
                "absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-blue-500/40 active:bg-blue-500 transition-all z-10",
                isResizingLeft && "bg-blue-500/40 w-1.5"
              )}
              style={{ transform: "translateX(50%)" }}
            />
          )}
        </div>

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
            edgeTypes={edgeTypes}
            defaultEdgeOptions={{ type: "buttonEdge" }}
            onNodeDragStop={onNodeDragStop}
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

        {/* Right Sliding Sidebar */}
        {selectedNode && (
          <div className="relative flex h-full shrink-0 z-10">
            <button
              onClick={() => setIsRightOpen(!isRightOpen)}
              className="absolute top-1/2 -left-3.5 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-400 hover:text-white shadow-lg hover:bg-slate-800 transition-all cursor-pointer"
              style={{ transform: "translateX(-50%)" }}
            >
              {isRightOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
            <div
              className={cn("overflow-hidden flex flex-col h-full", !isResizingRight && "transition-all duration-300")}
              style={{ width: isRightOpen ? `${rightWidth}px` : "0px" }}
            >
              <NodeConfigPanel
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
                onConfigChange={updateNodeConfig}
                onRunNode={handleRunNode}
              />
            </div>
            {isRightOpen && (
              <div
                onMouseDown={startRightResize}
                className={cn(
                  "absolute top-0 left-0 w-1.5 h-full cursor-col-resize hover:bg-blue-500/40 active:bg-blue-500 transition-all z-10",
                  isResizingRight && "bg-blue-500/40 w-1.5"
                )}
                style={{ transform: "translateX(-50%)" }}
              />
            )}
          </div>
        )}
        <AIChatPanel rfInstance={rfInstance} />
      </div>

      {/* Bottom Terminal Toggle Button */}
      <button
        onClick={() => setIsExecutionPanelOpen(!isExecutionPanelOpen)}
        className="fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/90 backdrop-blur-xl px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white shadow-2xl hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 cursor-pointer"
      >
        <Terminal className="h-3.5 w-3.5 text-blue-400" />
        <span>{isExecutionPanelOpen ? "Hide Execution Logs" : "Show Execution Logs"}</span>
      </button>

      <ExecutionPanel
        isOpen={isExecutionPanelOpen}
        onClose={() => setIsExecutionPanelOpen(false)}
        logs={logs}
        status={executionStatus}
        onRun={handleRun}
        loading={loading}
        panelHeight={panelHeight}
        onMouseDownResize={startPanelResize}
        isResizing={isResizingPanel}
      />
    </div>
  );
}
