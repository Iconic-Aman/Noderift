import { useEffect, useState } from "react";

export interface LogMessage {
  type: string;
  execution_id: string;
  timestamp: string;
  node_id?: string;
  node_name?: string;
  node_type?: string;
  provider?: string;
  error?: string;
  output?: any;
  duration_ms?: number;
  connect_url?: string;
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

    const apiUrl = import.meta.env.VITE_API_URL || "";
    let wsUrl: string;
    try {
      if (apiUrl && (apiUrl.startsWith("http://") || apiUrl.startsWith("https://"))) {
        const urlObj = new URL(apiUrl);
        const wsProto = urlObj.protocol === "https:" ? "wss:" : "ws:";
        wsUrl = `${wsProto}//${urlObj.host}/ws/executions/${executionId}/logs`;
      } else {
        const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
        wsUrl = `${wsProto}//${window.location.host}/ws/executions/${executionId}/logs`;
      }
    } catch {
      const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
      wsUrl = `${wsProto}//${window.location.host}/ws/executions/${executionId}/logs`;
    }

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
