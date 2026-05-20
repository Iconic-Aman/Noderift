import { useState } from "react";
import { apiFetch } from "../lib/api";

export interface ExecutionState {
  id: string;
  workflow_id: string;
  status: string;
  triggered_by: string;
  started_at: string;
  finished_at?: string;
  error?: string;
}

export function useExecution() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeExecution, setActiveExecution] = useState<ExecutionState | null>(null);

  const triggerExecution = async (workflowId: string): Promise<ExecutionState> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/executions/${workflowId}`, {
        method: "POST"
      });
      setActiveExecution(data);
      return data;
    } catch (err: any) {
      setError(err.message || "Failed to trigger execution");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getExecutionDetail = async (executionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/executions/detail/${executionId}`);
      return data;
    } catch (err: any) {
      setError(err.message || "Failed to load execution details");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getHistory = async (workflowId: string): Promise<ExecutionState[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/executions/${workflowId}/history`);
      return data || [];
    } catch (err: any) {
      setError(err.message || "Failed to load history");
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    activeExecution,
    setActiveExecution,
    triggerExecution,
    getExecutionDetail,
    getHistory,
  };
}
