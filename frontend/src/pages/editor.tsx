import { Node, Edge } from "@xyflow/react";
import { ReactFlow, Controls, MiniMap, Background, BackgroundVariant } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { NodePalette } from "@/components/workflow/node-palette";
import { NodeConfigPanel } from "@/components/workflow/node-config-panel";
import { TopNavbar } from "@/components/workflow/top-navbar";
import { WorkflowNode } from "@/components/workflow/workflow-node";
import { AIChatPanel } from "@/components/workflow/ai-chat-panel";
import { LlmKeyModal } from "@/components/workflow/llm-key-modal";
import { NodeData } from "@/types/workflow";
import { ExecutionPanel } from "@/components/workflow/execution-panel";
import { ChevronLeft, ChevronRight, Terminal, Sparkles, Settings, AlertTriangle, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ButtonEdge } from "@/components/workflow/custom-edge";
import { useEditorLogic } from "@/hooks/useEditorLogic";
import { apiFetch } from "@/lib/api";

const nodeTypes = {
  workflowNode: WorkflowNode,
};

const edgeTypes = {
  buttonEdge: ButtonEdge,
};

export default function Editor() {
  const {
    id,
    navigate,
    reactFlowWrapper,
    rfInstance,
    setRfInstance,
    nodes,
    edges,
    selectedNode,
    setSelectedNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    onPaneClick,
    onDragOver,
    onDrop,
    onNodeDragStop,
    updateNodeConfig,
    workflowName,
    setWorkflowName,
    isActive,
    isDeploying,
    isLeftOpen,
    setIsLeftOpen,
    isRightOpen,
    setIsRightOpen,
    mode,
    setMode,
    activeRightTab,
    setActiveRightTab,
    leftWidth,
    rightWidth,
    panelHeight,
    isResizingLeft,
    isResizingRight,
    isResizingPanel,
    startLeftResize,
    startRightResize,
    startPanelResize,
    executionStatus,
    isExecutionPanelOpen,
    setIsExecutionPanelOpen,
    logs,
    loading,
    undo,
    onSave,
    onToggleActive,
    handleRun,
    handleRunNode,
    handleDownload,
  } = useEditorLogic();

  const [showUndeployWarning, setShowUndeployWarning] = useState(false);
  const [showLlmModal, setShowLlmModal] = useState(false);

  const handleDeployClick = () => {
    if (isActive) {
      setShowUndeployWarning(true);
    } else {
      onToggleActive();
    }
  };

  const confirmUndeploy = () => {
    setShowUndeployWarning(false);
    onToggleActive();
  };

  // Intercept AI Mode — check if user has LLM key saved
  const handleModeChange = async (newMode: "manual" | "automatic") => {
    if (newMode === "automatic") {
      try {
        const res = await apiFetch("/ai/llm-key-status");
        if (!res?.configured) {
          setShowLlmModal(true);
          return;
        }
      } catch {
        setShowLlmModal(true);
        return;
      }
      setIsRightOpen(true);
    }
    setMode(newMode);
  };

  // If page opens in automatic mode, verify credentials exist
  useEffect(() => {
    if (mode === "automatic") {
      apiFetch("/ai/llm-key-status")
        .then((res) => {
          if (!res?.configured) {
            setMode("manual");
            setShowLlmModal(true);
          }
        })
        .catch(() => {
          setMode("manual");
          setShowLlmModal(true);
        });
    }
  }, []);

  return (
    <div className={cn(
      "flex h-screen w-full flex-col bg-slate-950 text-slate-200",
      (isResizingLeft || isResizingRight) && "select-none cursor-col-resize",
      isResizingPanel && "select-none cursor-row-resize"
    )}>
      {/* Undeploy Warning Modal */}
      {showUndeployWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[420px] rounded-xl border border-amber-500/30 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Stop Automation?</p>
                <p className="text-xs text-slate-400">This workflow is currently live</p>
              </div>
              <button onClick={() => setShowUndeployWarning(false)} className="ml-auto rounded p-1 text-slate-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-5 text-sm text-slate-300">
              Undeploying will immediately stop all automations, webhooks, and scheduled triggers for this workflow. Your workflow data will be kept.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowUndeployWarning(false)} className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">
                Cancel
              </button>
              <button onClick={confirmUndeploy} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500">
                Yes, Stop Automation
              </button>
            </div>
          </div>
        </div>
      )}
      <TopNavbar
        workflowName={workflowName}
        onNameChange={setWorkflowName}
        status={executionStatus}
        onSave={onSave}
        onUndo={undo}
        onRun={handleRun}
        onHistory={() => navigate(`/history/${id}`)}
        isActive={isActive}
        isDeploying={isDeploying}
        onToggleActive={handleDeployClick}
        onDownload={handleDownload}
        mode={mode}
        onModeChange={handleModeChange}
      />
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sliding Sidebar - Manual Mode only */}
        {mode === "manual" && (
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
        )}

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

        {/* Right Sliding Sidebar - Manual Mode */}
        {mode === "manual" && selectedNode && (
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

        {/* Right Docked Panel - Automatic Mode (Chat Sidebar like Cursor) */}
        {mode === "automatic" && (
          <div className="relative flex h-full shrink-0 z-10">
            <div
              className={cn("overflow-hidden flex flex-col h-full bg-slate-900 border-l border-slate-800", !isResizingRight && "transition-all duration-300")}
              style={{ width: isRightOpen ? `${rightWidth}px` : "0px" }}
            >
              {selectedNode && (
                /* Tab Selector — only shown when a node is selected */
                <div className="flex h-10 border-b border-slate-800 bg-slate-950 shrink-0">
                  <button
                    onClick={() => setActiveRightTab("chat")}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 text-xs font-semibold border-b-2 transition-all cursor-pointer",
                      activeRightTab === "chat"
                        ? "border-violet-500 text-violet-400 bg-violet-500/5"
                        : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    )}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    AI Assistant
                  </button>
                  <button
                    onClick={() => setActiveRightTab("config")}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 text-xs font-semibold border-b-2 transition-all cursor-pointer",
                      activeRightTab === "config"
                        ? "border-blue-500 text-blue-400 bg-blue-500/5"
                        : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    )}
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Node Config
                  </button>
                </div>
              )}

              {/* AIChatPanel — always mounted, never unmounts, CSS hides when config tab active */}
              <div
                className="flex-1 overflow-hidden flex flex-col"
                style={{
                  display: selectedNode && activeRightTab === "config" ? "none" : "flex"
                }}
              >
                <AIChatPanel isDocked={true} onClose={() => setIsRightOpen(false)} />
              </div>

              {/* NodeConfigPanel — only when node selected + config tab */}
              {selectedNode && activeRightTab === "config" && (
                <div className="flex-1 overflow-hidden flex flex-col">
                  <NodeConfigPanel
                    node={selectedNode}
                    onClose={() => setSelectedNode(null)}
                    onConfigChange={updateNodeConfig}
                    onRunNode={handleRunNode}
                  />
                </div>
              )}
            </div>
            <div
              onMouseDown={startRightResize}
              className={cn(
                "absolute top-0 left-0 w-1.5 h-full cursor-col-resize hover:bg-blue-500/40 active:bg-blue-500 transition-all z-10",
                isResizingRight && "bg-blue-500/40 w-1.5"
              )}
              style={{ transform: "translateX(-50%)" }}
            />
          </div>
        )}

      </div>

      {/* Floating AI Pill Button when chat is shrunk (top-right, away from minimap) */}
      {mode === "automatic" && !isRightOpen && (
        <button
          onClick={() => setIsRightOpen(true)}
          title="Open AI Assistant"
          className="fixed top-16 right-4 z-40 flex h-9 items-center gap-2 rounded-full border border-violet-500/40 bg-slate-900/95 px-3.5 py-1.5 text-xs font-semibold text-slate-200 shadow-xl shadow-violet-950/30 backdrop-blur-md hover:border-violet-400 hover:bg-slate-800 hover:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          <span>AI Assistant</span>
        </button>
      )}

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

      {showLlmModal && (
        <LlmKeyModal
          onClose={() => setShowLlmModal(false)}
          onSuccess={() => {
            setShowLlmModal(false);
            setMode("automatic");
          }}
        />
      )}
    </div>
  );
}
