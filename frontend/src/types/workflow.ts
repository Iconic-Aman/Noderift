export interface NodeData extends Record<string, unknown> {
  label: string;
  icon: any;
  category: string;
  color: string;
  config: Record<string, unknown>;
}

export interface NodeTemplate {
  id: string;
  label: string;
  icon: string;
  category: "triggers" | "actions" | "ai" | "logic";
  color: string;
  description: string;
  configFields: ConfigField[];
}

export interface ConfigField {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "toggle" | "code" | "credential";
  placeholder?: string;
  options?: { label: string; value: string }[];
  required?: boolean;
  defaultValue?: any;
  showWhen?: { field: string; value: unknown };
}
