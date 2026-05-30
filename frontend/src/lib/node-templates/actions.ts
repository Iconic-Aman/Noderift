import { NodeTemplate } from "@/types/workflow";

export const actionTemplates: NodeTemplate[] = [
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
    color: "#25D366",
    description: "Send WhatsApp message (Original Green)",
    configFields: [
      { name: "phone", label: "Phone Number", type: "text", placeholder: "+1234567890" },
      { name: "message", label: "Message", type: "textarea", placeholder: "Enter message..." },
    ],
  },
  {
    id: "whatsapp-blue",
    label: "WhatsApp (Blue)",
    icon: "whatsapp",
    category: "actions",
    color: "#3b82f6",
    description: "Send WhatsApp message (Blue)",
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
  {
    id: "code",
    label: "Code",
    icon: "code",
    category: "actions",
    color: "#3b82f6",
    description: "Run custom Python code",
    configFields: [
      {
        name: "code",
        label: "Python Code",
        type: "code",
        placeholder: "# input_data has outputs from previous nodes\n# set output_data dict to pass data forward"
      },
    ],
  },
  {
    id: "playwright",
    label: "Browser Automation",
    icon: "globe",
    category: "actions",
    color: "#6366f1",
    description: "Automate web browser with Playwright",
    configFields: [
      { name: "url", label: "Target URL", type: "text", placeholder: "https://example.com" },
      { name: "script", label: "Playwright Script (Python)", type: "code", placeholder: "# page is available\ncontent = await page.content()\noutput_data = {'html': content}" },
    ],
  },
  {
    id: "composio",
    label: "Composio",
    icon: "box",
    category: "actions",
    color: "#f59e0b",
    description: "Run integration actions via Composio",
    configFields: [
      { name: "app", label: "App Name", type: "text", placeholder: "gmail, slack, sheets" },
      { name: "action", label: "Action Name", type: "text", placeholder: "send_email, post_message" },
      { name: "parameters", label: "Parameters (JSON)", type: "textarea", placeholder: '{"to": "user@example.com"}' },
      { name: "credential_id", label: "Credential", type: "credential" },
    ],
  },
];
