import { useState, useCallback, useRef, DragEvent, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ReactFlowInstance, Node, Edge } from "@xyflow/react";
import { NodeData } from "@/types/workflow";
import { apiFetch } from "@/lib/api";
import { useWorkflowStore } from "@/store/workflowStore";
import { useExecution } from "@/hooks/useExecution";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getNodeTemplate } from "@/lib/node-templates";

export function useEditorLogic() {
  const { id } = useParams();
  const navigate = useNavigate();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const {
    nodes, edges, selectedNode,
    onNodesChange, onEdgesChange, onConnect,
    setNodes, setEdges, setSelectedNode, addNode, updateNodeConfig,
    undo, takeHistorySnapshot,
  } = useWorkflowStore();

  const [workflowName, setWorkflowName] = useState("Loading...");
  const [isActive, setIsActive] = useState(false);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance<Node<NodeData>, Edge> | null>(null);

  // Sidebar toggle states
  const [isLeftOpen, setIsLeftOpen] = useState(true);
  const [isRightOpen, setIsRightOpen] = useState(true);

  // Mode and active right panel tab state
  const [mode, setMode] = useState<"manual" | "automatic">("manual");
  const [activeRightTab, setActiveRightTab] = useState<"chat" | "config">("chat");

  // Resizable sidebar and logs panel states
  const [leftWidth, setLeftWidth] = useState(260);
  const [rightWidth, setRightWidth] = useState(450);
  const [panelHeight, setPanelHeight] = useState(320);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [isResizingPanel, setIsResizingPanel] = useState(false);

  const startLeftResize = useCallback((e: React.MouseEvent) => { e.preventDefault(); setIsResizingLeft(true); }, []);
  const startRightResize = useCallback((e: React.MouseEvent) => { e.preventDefault(); setIsResizingRight(true); }, []);
  const startPanelResize = useCallback((e: React.MouseEvent) => { e.preventDefault(); setIsResizingPanel(true); }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) setLeftWidth(Math.max(40, Math.min(500, e.clientX)));
      if (isResizingRight) setRightWidth(Math.max(300, Math.min(800, window.innerWidth - e.clientX)));
      if (isResizingPanel) setPanelHeight(Math.max(150, Math.min(600, window.innerHeight - e.clientY)));
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
  const [executionStatus, setExecutionStatus] = useState<string>("idle");
  const [isSingleRun, setIsSingleRun] = useState(false);
  const { logs, setLogs } = useWebSocket(activeExecutionId);

  // Sync execution status from live websocket event logs
  useEffect(() => {
    if (logs.length > 0) {
      const hasNeedsAuth = logs.some((l) => l.type === "needs_auth");
      const hasFailed = logs.some((l) => l.type === "workflow_failed");
      const hasSuccess = logs.some((l) => l.type === "workflow_success");
      const hasStarted = logs.some((l) => l.type === "workflow_started");

      if (hasNeedsAuth) setExecutionStatus("needs_auth");
      else if (hasFailed) setExecutionStatus("failed");
      else if (hasSuccess) setExecutionStatus("success");
      else if (hasStarted) setExecutionStatus("running");
    }
  }, [logs]);

  // Sync individual node execution states from live websocket logs
  useEffect(() => {
    const currentNodes = useWorkflowStore.getState().nodes;
    if (logs.length === 0) {
      if (!isSingleRun) {
        const clearedNodes = currentNodes.map((n) => {
          if (n.data.status || n.data.output || n.data.error) {
            const { status, output, error, ...restData } = n.data;
            return { ...n, data: restData as NodeData };
          }
          return n;
        });
        if (clearedNodes.some((n, i) => n.data.status !== currentNodes[i].data.status)) setNodes(clearedNodes);
      }
      return;
    }

    const latestStatuses: Record<string, "running" | "success" | "failed"> = {};
    const latestOutputs: Record<string, any> = {};
    const latestErrors: Record<string, any> = {};
    for (const log of logs) {
      if (!log.node_id) continue;
      if (log.type === "node_started") latestStatuses[log.node_id] = "running";
      else if (log.type === "node_success") { latestStatuses[log.node_id] = "success"; latestOutputs[log.node_id] = log.output; }
      else if (log.type === "node_failed") { latestStatuses[log.node_id] = "failed"; latestErrors[log.node_id] = log.error; }
      else if (log.type === "needs_auth") { latestStatuses[log.node_id] = "failed"; latestErrors[log.node_id] = "Gmail account not connected"; }
    }

    let hasChanges = false;
    const updatedNodes = currentNodes.map((n) => {
      const nextStatus = latestStatuses[n.id];
      const nextOutput = latestOutputs[n.id];
      const nextError = latestErrors[n.id];
      if (isSingleRun && nextStatus === undefined) return n;
      let nodeChanged = false;
      const nextData = { ...n.data };
      if (n.data.status !== nextStatus) { nextData.status = nextStatus; nodeChanged = true; }
      if (nextOutput !== undefined && JSON.stringify(nextOutput) !== JSON.stringify(n.data.output)) { nextData.output = nextOutput; nodeChanged = true; }
      if (nextError !== undefined && nextError !== n.data.error) { nextData.error = nextError; nodeChanged = true; }
      if (nodeChanged) { hasChanges = true; return { ...n, data: nextData }; }
      return n;
    });
    if (hasChanges) setNodes(updatedNodes);
  }, [logs, setNodes, isSingleRun]);

  // Keyboard Undo Shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); undo(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo]);

  const onNodeDragStop = useCallback(() => takeHistorySnapshot(), [takeHistorySnapshot]);

  // Load workflow on mount
  useEffect(() => {
    if (!id) return;
    const fetchWorkflow = async () => {
      try {
        const wf = await apiFetch(`/workflows/${id}`);
        setWorkflowName(wf.name);
        setIsActive(wf.is_active);
        if (wf.graph && wf.graph.nodes) {
          const styledNodes = wf.graph.nodes.map((node: any) => {
            const prefix = node.id.split("-")[0];
            const template = getNodeTemplate(prefix);
            if (template) {
              return {
                ...node,
                data: {
                  icon: template.icon,
                  color: template.color,
                  category: template.category,
                  ...node.data,
                },
              };
            }
            return node;
          });
          setNodes(styledNodes);
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
        body: JSON.stringify({ name: workflowName, graph: { nodes, edges } }),
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
    await onSave();
    setIsSingleRun(false);
    setLogs([]);
    setExecutionStatus("running");
    setIsExecutionPanelOpen(true);
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
    await onSave();
    setIsSingleRun(true);
    setLogs([]);
    setExecutionStatus("running");
    setIsExecutionPanelOpen(true);
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

  const handleDownload = () => {
    if (!rfInstance) return;
    // Use rfInstance to get the live canvas state — always current
    const currentNodes = rfInstance.getNodes();
    const currentEdges = rfInstance.getEdges();
    const filename = `${workflowName.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "workflow"}.json`;
    const payload = JSON.stringify({ name: workflowName, nodes: currentNodes, edges: currentEdges }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
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

  const onDrop = useCallback((event: DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData("application/reactflow/type");
    if (!type || !rfInstance || !reactFlowWrapper.current) return;
    const position = rfInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
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
  }, [rfInstance, addNode]);

  return {
    id, navigate, reactFlowWrapper, rfInstance, setRfInstance,
    nodes, edges, selectedNode, setSelectedNode,
    onNodesChange, onEdgesChange, onConnect, onNodeClick, onPaneClick, onDragOver, onDrop, onNodeDragStop,
    updateNodeConfig,
    workflowName, setWorkflowName,
    isActive, isLeftOpen, setIsLeftOpen, isRightOpen, setIsRightOpen,
    mode, setMode, activeRightTab, setActiveRightTab,
    leftWidth, rightWidth, panelHeight,
    isResizingLeft, isResizingRight, isResizingPanel,
    startLeftResize, startRightResize, startPanelResize,
    executionStatus, isExecutionPanelOpen, setIsExecutionPanelOpen,
    logs, loading,
    undo,
    onSave, onToggleActive, handleRun, handleRunNode, handleDownload,
  };
}
