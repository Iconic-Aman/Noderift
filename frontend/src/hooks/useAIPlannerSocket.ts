import { useEffect } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import { API_URL } from '../lib/api';
import { getNodeTemplate } from '../lib/node-templates';

// Backend node_type → frontend template id (for types that differ)
const BACKEND_TYPE_TO_TEMPLATE_ID: Record<string, string> = {
  http_request: 'http',
  gmail_trigger: 'gmail_trigger',
  gmail: 'gmail',
  ai_agent: 'ai_agent',
  set_variable: 'set_variable',
  // types below have no template → they fall back to node_type itself
  filter: 'filter',
  composio: 'composio',
};

function resolveTemplate(nodeType: string, nodeId: string) {
  // 1. explicit mapping from backend type
  const mappedId = BACKEND_TYPE_TO_TEMPLATE_ID[nodeType] ?? nodeType;
  const t = getNodeTemplate(mappedId);
  if (t) return t;
  // 2. fallback: try the id prefix (e.g. 'http' from 'http-abc123')
  const prefix = nodeId.split('-')[0];
  return getNodeTemplate(prefix) ?? null;
}

export function useAIPlannerSocket(sessionId: string | undefined, onAgentStep?: (step: string) => void) {
  const addNode = useWorkflowStore((state) => state.addNode);
  const updateNodeWebSocket = useWorkflowStore((state) => state.updateNodeWebSocket);
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
        if (type === 'agent_step' && payload?.text && onAgentStep) {
          onAgentStep(payload.text);
        }
        switch (type) {
          case 'node_added': {
            const nodeType = payload.data?.node_type || payload.id.split('-')[0];
            const template = resolveTemplate(nodeType, payload.id);
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
