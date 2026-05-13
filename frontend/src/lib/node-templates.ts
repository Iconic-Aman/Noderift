import { NodeTemplate } from "@/types/workflow";

export const nodeTemplates: NodeTemplate[] = [
  // Triggers
  {
    id: "webhook",
    label: "Webhook",
    icon: "webhook",
    category: "triggers",
    color: "#f97316",
    description: "Trigger workflow via HTTP webhook",
    configFields: [
      { name: "method", label: "HTTP Method", type: "select", options: [
        { label: "GET", value: "GET" },
        { label: "POST", value: "POST" },
        { label: "PUT", value: "PUT" },
        { label: "DELETE", value: "DELETE" },
      ]},
      { name: "path", label: "Path", type: "text", placeholder: "/api/webhook" },
    ],
  },
  {
    id: "schedule",
    label: "Schedule",
    icon: "clock",
    category: "triggers",
    color: "#f97316",
    description: "Run workflow on a schedule",
    configFields: [
      { name: "cron", label: "Cron Expression", type: "text", placeholder: "0 * * * *" },
      { name: "timezone", label: "Timezone", type: "text", placeholder: "UTC" },
    ],
  },
  {
    id: "email-trigger",
    label: "Email Received",
    icon: "mail",
    category: "triggers",
    color: "#f97316",
    description: "Trigger when email is received",
    configFields: [
      { name: "email", label: "Email Address", type: "text", placeholder: "trigger@example.com" },
      { name: "filter", label: "Subject Filter", type: "text", placeholder: "Contains..." },
    ],
  },
  // Actions
  {
    id: "slack",
    label: "Slack",
    icon: "slack",
    category: "actions",
    color: "#3b82f6",
    description: "Send message to Slack",
    configFields: [
      { name: "channel", label: "Channel", type: "text", placeholder: "#general" },
      { name: "message", label: "Message", type: "textarea", placeholder: "Enter message..." },
    ],
  },
  {
    id: "gmail",
    label: "Gmail",
    icon: "gmail",
    category: "actions",
    color: "#3b82f6",
    description: "Send email via Gmail",
    configFields: [
      { name: "to", label: "To", type: "text", placeholder: "recipient@example.com" },
      { name: "subject", label: "Subject", type: "text", placeholder: "Email subject" },
      { name: "body", label: "Body", type: "textarea", placeholder: "Email body..." },
    ],
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: "whatsapp",
    category: "actions",
    color: "#3b82f6",
    description: "Send WhatsApp message",
    configFields: [
      { name: "phone", label: "Phone Number", type: "text", placeholder: "+1234567890" },
      { name: "message", label: "Message", type: "textarea", placeholder: "Enter message..." },
    ],
  },
  {
    id: "http",
    label: "HTTP Request",
    icon: "globe",
    category: "actions",
    color: "#3b82f6",
    description: "Make HTTP request",
    configFields: [
      { name: "url", label: "URL", type: "text", placeholder: "https://api.example.com" },
      { name: "method", label: "Method", type: "select", options: [
        { label: "GET", value: "GET" },
        { label: "POST", value: "POST" },
        { label: "PUT", value: "PUT" },
        { label: "DELETE", value: "DELETE" },
      ]},
      { name: "headers", label: "Headers (JSON)", type: "textarea", placeholder: '{"Authorization": "Bearer ..."}' },
      { name: "body", label: "Body (JSON)", type: "textarea", placeholder: '{"key": "value"}' },
    ],
  },
  {
    id: "database",
    label: "Database",
    icon: "database",
    category: "actions",
    color: "#3b82f6",
    description: "Query database",
    configFields: [
      { name: "operation", label: "Operation", type: "select", options: [
        { label: "SELECT", value: "select" },
        { label: "INSERT", value: "insert" },
        { label: "UPDATE", value: "update" },
        { label: "DELETE", value: "delete" },
      ]},
      { name: "query", label: "Query", type: "textarea", placeholder: "SELECT * FROM users" },
    ],
  },
  // AI
  {
    id: "openai",
    label: "OpenAI",
    icon: "openai",
    category: "ai",
    color: "#a855f7",
    description: "Generate text with OpenAI",
    configFields: [
      { name: "model", label: "Model", type: "select", options: [
        { label: "GPT-4", value: "gpt-4" },
        { label: "GPT-4 Turbo", value: "gpt-4-turbo" },
        { label: "GPT-3.5 Turbo", value: "gpt-3.5-turbo" },
      ]},
      { name: "prompt", label: "Prompt", type: "textarea", placeholder: "Enter your prompt..." },
      { name: "temperature", label: "Temperature", type: "number", defaultValue: 0.7 },
    ],
  },
  {
    id: "anthropic",
    label: "Claude AI",
    icon: "anthropic",
    category: "ai",
    color: "#a855f7",
    description: "Generate text with Anthropic Claude",
    configFields: [
      { name: "model", label: "Model", type: "select", options: [
        { label: "Claude 3 Opus", value: "claude-3-opus" },
        { label: "Claude 3 Sonnet", value: "claude-3-sonnet" },
        { label: "Claude 3 Haiku", value: "claude-3-haiku" },
      ]},
      { name: "prompt", label: "Prompt", type: "textarea", placeholder: "Enter your prompt..." },
    ],
  },
  {
    id: "text-classifier",
    label: "Text Classifier",
    icon: "brain",
    category: "ai",
    color: "#a855f7",
    description: "Classify text into categories",
    configFields: [
      { name: "categories", label: "Categories", type: "textarea", placeholder: "spam, not_spam" },
      { name: "input", label: "Input Field", type: "text", placeholder: "{{message}}" },
    ],
  },
  // Logic
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
];

export const getNodesByCategory = (category: string) =>
  nodeTemplates.filter((node) => node.category === category);

export const getNodeTemplate = (id: string) =>
  nodeTemplates.find((node) => node.id === id);
