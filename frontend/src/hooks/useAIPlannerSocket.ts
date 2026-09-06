import { useEffect, useRef } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import { API_URL } from '../lib/api';
import { getNodeTemplate } from '../lib/node-templates';

export function useAIPlannerSocket(sessionId: string | undefined, onAgentStep?: (step: string) => void) {
  const addNode = useWorkflowStore((state) => state.addNode);
  const updateNodeWebSocket = useWorkflowStore((state) => state.updateNodeWebSocket);
  const addEdgeWebSocket = useWorkflowStore((state) => state.addEdgeWebSocket);
  const removeNodeWebSocket = useWorkflowStore((state) => state.removeNodeWebSocket);
  const clearCanvasWebSocket = useWorkflowStore((state) => state.clearCanvasWebSocket);

  const onAgentStepRef = useRef(onAgentStep);
  useEffect(() => {
    onAgentStepRef.current = onAgentStep;
  }, [onAgentStep]);

  useEffect(() => {
    if (!sessionId) return;

    const apiUrl = API_URL || window.location.origin;
    const isAbs = apiUrl.startsWith('http');
    const wsProto = (isAbs ? apiUrl : window.location.origin).startsWith('https') ? 'wss' : 'ws';
    const host = isAbs ? new URL(apiUrl).host : window.location.host;
    const wsUrl = `${wsProto}://${host}/api/ai/ws/plan/${sessionId}`;

    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const { type, payload } = JSON.parse(event.data);
        if (type === 'agent_step' && payload?.text && onAgentStepRef.current) {
          onAgentStepRef.current(payload.text);
        }
        switch (type) {
          case 'node_added': {
            const nodeType = payload.data?.node_type || payload.id.split('-')[0];
            const template = getNodeTemplate(nodeType);
            if (template) {
              payload.data = {
                ...payload.data,
                icon: template.icon,
                color: template.color,
                category: template.category,
              };
            }
            addNode(payload);
            break;
          }
          case 'node_updated':
            updateNodeWebSocket(payload);
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
  }, [sessionId, addNode, updateNodeWebSocket, addEdgeWebSocket, removeNodeWebSocket, clearCanvasWebSocket]);
}

