export interface NodeData {
  label: string;
  icon: string;
  category: string;
  color: string;
  config: Record<string, any>;
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
  type: "text" | "textarea" | "select" | "number" | "toggle";
  placeholder?: string;
  options?: { label: string; value: string }[];
  required?: boolean;
  defaultValue?: any;
}
