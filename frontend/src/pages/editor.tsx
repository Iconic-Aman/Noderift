import { useState, useCallback, useRef, DragEvent, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ReactFlow,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  NodeTypes,
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

const nodeTypes = {
  workflowNode: WorkflowNode,
};

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  const [workflowName, setWorkflowName] = useState("Loading...");
  const [status, setStatus] = useState<"idle" | "running" | "success">("idle");
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance<Node<NodeData>, Edge> | null>(null);

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
      console.log("Workflow saved");
    } catch (err) {
      console.error("Failed to save workflow", err);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<NodeData>) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => setSelectedNode(null), []);

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
      setNodes((nds) => nds.concat(newNode));
    },
    [rfInstance, setNodes]
  );

  return (
    <div className="flex h-screen w-full flex-col bg-slate-950 text-slate-200">
      <TopNavbar
        workflowName={workflowName}
        onNameChange={setWorkflowName}
        status={status}
        onSave={onSave}
        onRun={() => {
          setStatus("running");
          setTimeout(() => setStatus("success"), 2000);
        }}
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
          onConfigChange={(id, config) => {
            setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, config } } : n)));
          }}
        />
        <AIChatPanel />
      </div>
    </div>
  );
}
