import { useEffect } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import { API_URL } from '../lib/api';

export function useAIPlannerSocket(sessionId: string | undefined) {
  const addNode = useWorkflowStore((state) => state.addNode);
  const updateNodeConfig = useWorkflowStore((state) => state.updateNodeConfig);
  const addEdgeWebSocket = useWorkflowStore((state) => state.addEdgeWebSocket);
  const removeNodeWebSocket = useWorkflowStore((state) => state.removeNodeWebSocket);
  const clearCanvasWebSocket = useWorkflowStore((state) => state.clearCanvasWebSocket);

  useEffect(() => {
    if (!sessionId) return;

    // Convert HTTP API URL to WebSocket protocol URL dynamically
    const wsUrl = `${API_URL}/ai/ws/plan/${sessionId}`.replace(/^http/, 'ws');
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const { type, payload } = JSON.parse(event.data);
        switch (type) {
          case 'node_added':
            addNode(payload);
            break;
          case 'node_updated':
            updateNodeConfig(payload.id, payload.config);
            break;
          case 'edge_added':
            addEdgeWebSocket(payload);
            break;
          case 'node_removed':
            removeNodeWebSocket(payload.id);
            break;
          case 'clear':
            clearCanvasWebSocket();
            break;
          default:
            break;
        }
      } catch (err) {
        console.error('Failed to process WebSocket message:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, [sessionId, addNode, updateNodeConfig, addEdgeWebSocket, removeNodeWebSocket, clearCanvasWebSocket]);
}
