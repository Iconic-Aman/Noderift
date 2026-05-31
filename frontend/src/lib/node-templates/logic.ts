import { NodeTemplate } from "@/types/workflow";

export const logicTemplates: NodeTemplate[] = [
  {
    id: "if",
    label: "IF Condition",
    icon: "git-branch",
    category: "logic",
    color: "#22c55e",
    description: "Branch based on condition",
    configFields: [
      { name: "condition", label: "Condition", type: "text", placeholder: "{{value}} === true" },
    ],
  },
  {
    id: "switch",
    label: "Switch",
    icon: "layers",
    category: "logic",
    color: "#22c55e",
    description: "Multiple branch conditions",
    configFields: [
      { name: "value", label: "Value", type: "text", placeholder: "{{status}}" },
      { name: "cases", label: "Cases (JSON)", type: "textarea", placeholder: '{"active": 1, "inactive": 2}' },
    ],
  },
  {
    id: "loop",
    label: "Loop",
    icon: "repeat",
    category: "logic",
    color: "#22c55e",
    description: "Iterate over items",
    configFields: [
      { name: "items", label: "Items", type: "text", placeholder: "{{data.items}}" },
    ],
  },
  {
    id: "delay",
    label: "Delay",
    icon: "timer",
    category: "logic",
    color: "#22c55e",
    description: "Wait before continuing",
    configFields: [
      { name: "duration", label: "Duration (ms)", type: "number", placeholder: "1000" },
    ],
  },
  {
    id: "merge",
    label: "Merge",
    icon: "merge",
    category: "logic",
    color: "#22c55e",
    description: "Merge multiple inputs",
    configFields: [
      { name: "mode", label: "Mode", type: "select", options: [
        { label: "Append", value: "append" },
        { label: "Merge by Key", value: "key" },
        { label: "Combine", value: "combine" },
      ]},
    ],
  },
  {
    id: "set_variable",
    label: "Set Variable",
    icon: "hash",
    category: "logic",
    color: "#22c55e",
    description: "Store a value in execution state",
    configFields: [
      { name: "name", label: "Variable Name", type: "text", placeholder: "myVar" },
      { name: "value", label: "Value", type: "text", placeholder: "{{upstream.field}}" },
    ],
  },
];
