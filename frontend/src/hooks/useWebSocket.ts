import { useEffect, useState } from "react";

export interface LogMessage {
  type: string;
  execution_id: string;
  timestamp: string;
  node_id?: string;
  node_name?: string;
  node_type?: string;
  error?: string;
  output?: any;
  duration_ms?: number;
}

export function useWebSocket(executionId: string | null) {
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!executionId) {
      setLogs([]);
      setConnected(false);
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
    const wsProto = apiUrl.startsWith("https") ? "wss" : "ws";
    const urlObj = new URL(apiUrl);
    const wsUrl = `${wsProto}://${urlObj.host}/ws/executions/${executionId}/logs`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setConnected(true);
      setLogs([]);
    };

    ws.onmessage = (event) => {
      try {
        const message: LogMessage = JSON.parse(event.data);
        setLogs((prev) => [...prev, message]);
      } catch (err) {
        console.error("Failed to parse WebSocket log message", err);
      }
    };

    ws.onclose = () => {
      setConnected(false);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error in logs channel", err);
      setConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [executionId]);

  return { logs, connected, setLogs };
}
