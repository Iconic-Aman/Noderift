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
        defaultValue: "def main(inputs):\n    # Write your logic here\n    return {\"status\": \"success\"}\n" 
      },
    ],
  },
];
