import { create } from 'zustand';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import { NodeData } from '@/types/workflow';

export type WorkflowState = {
  nodes: Node<NodeData>[];
  edges: Edge[];
  selectedNode: Node<NodeData> | null;
  pastStates: { nodes: Node<NodeData>[]; edges: Edge[] }[];
  onNodesChange: OnNodesChange<Node<NodeData>>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: Node<NodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  setSelectedNode: (node: Node<NodeData> | null) => void;
  updateNodeConfig: (id: string, config: any) => void;
  addNode: (node: Node<NodeData>) => void;
  addEdgeWebSocket: (edge: Edge) => void;
  removeNodeWebSocket: (id: string) => void;
  clearCanvasWebSocket: () => void;
  takeHistorySnapshot: () => void;
  undo: () => void;
};

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  pastStates: [],
  
  onNodesChange: (changes: NodeChange<Node<NodeData>>[]) => {
    const hasRemoval = changes.some(c => c.type === 'remove');
    if (hasRemoval) {
      get().takeHistorySnapshot();
    }
    set({
      nodes: applyNodeChanges(changes, get().nodes) as Node<NodeData>[],
    });
  },
  
  onEdgesChange: (changes: EdgeChange[]) => {
    const hasRemoval = changes.some(c => c.type === 'remove');
    if (hasRemoval) {
      get().takeHistorySnapshot();
    }
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  
  onConnect: (connection: Connection) => {
    get().takeHistorySnapshot();
    set({
      edges: addEdge(connection, get().edges),
    });
  },
  
  setNodes: (nodes: Node<NodeData>[]) => {
    set({ nodes });
  },
  
  setEdges: (edges: Edge[]) => {
    set({ edges });
  },
  
  setSelectedNode: (node: Node<NodeData> | null) => {
    set({ selectedNode: node });
  },
  
  updateNodeConfig: (id: string, config: any) => {
    get().takeHistorySnapshot();
    set({
      nodes: get().nodes.map((node) => 
        node.id === id 
          ? { ...node, data: { ...node.data, config } } 
          : node
      ),
    });
  },

  addNode: (node: Node<NodeData>) => {
    get().takeHistorySnapshot();
    set({
      nodes: [...get().nodes, node],
    });
  },

  addEdgeWebSocket: (edge: Edge) => {
    get().takeHistorySnapshot();
    set({
      edges: [...get().edges, edge],
    });
  },

  removeNodeWebSocket: (id: string) => {
    get().takeHistorySnapshot();
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
    });
  },

  clearCanvasWebSocket: () => {
    get().takeHistorySnapshot();
    set({
      nodes: [],
      edges: [],
    });
  },


  takeHistorySnapshot: () => {
    const current = {
      nodes: get().nodes.map(n => ({ ...n, data: { ...n.data, config: { ...n.data.config } } })),
      edges: get().edges.map(e => ({ ...e })),
    };
    
    const past = get().pastStates;
    if (past.length > 0) {
      const last = past[past.length - 1];
      if (JSON.stringify(last.nodes) === JSON.stringify(current.nodes) &&
          JSON.stringify(last.edges) === JSON.stringify(current.edges)) {
        return;
      }
    }
    
    set({
      pastStates: [...past, current].slice(-50)
    });
  },

  undo: () => {
    const past = get().pastStates;
    if (past.length === 0) return;
    const nextPast = [...past];
    const previous = nextPast.pop();
    if (previous) {
      set({
        nodes: previous.nodes,
        edges: previous.edges,
        pastStates: nextPast
      });
    }
  },
}));
