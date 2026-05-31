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
      { name: "phone", label: "Phone Number", type: "text", placeholder: "919876543210" },
      { name: "message", label: "Message", type: "textarea", placeholder: "Enter message..." },
      { name: "credential_id", label: "Credential", type: "credential" },
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
    id: "resend",
    label: "Resend Email",
    icon: "mail",
    category: "actions",
    color: "#3b82f6",
    description: "Send email using Resend",
    configFields: [
      { name: "from", label: "From", type: "text", placeholder: "onboarding@resend.dev" },
      { name: "to", label: "To", type: "text", placeholder: "recipient@example.com" },
      { name: "subject", label: "Subject", type: "text", placeholder: "Email subject" },
      { name: "html", label: "HTML Body", type: "textarea", placeholder: "<p>Hello from Noderift</p>" },
      { name: "credential_id", label: "Credential", type: "credential" },
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
      { name: "app", label: "App", type: "select", options: [
        { label: "Gmail", value: "gmail" },
        { label: "Slack", value: "slack" },
      ]},
      { name: "action", label: "Action", type: "select", options: [
        { label: "Gmail - Send Email", value: "GMAIL_SEND_EMAIL" },
        { label: "Slack - Send Message", value: "SLACKBOT_CHAT_POST_MESSAGE" },
      ]},
      { name: "to", label: "To Email", type: "text", placeholder: "recipient@example.com", showWhen: { field: "action", value: "GMAIL_SEND_EMAIL" } },
      { name: "subject", label: "Subject", type: "text", placeholder: "Email subject", showWhen: { field: "action", value: "GMAIL_SEND_EMAIL" } },
      { name: "body", label: "Email Body", type: "textarea", placeholder: "Write the email...", showWhen: { field: "action", value: "GMAIL_SEND_EMAIL" } },
      { name: "channel", label: "Slack Channel", type: "text", placeholder: "#general or channel ID", showWhen: { field: "action", value: "SLACKBOT_CHAT_POST_MESSAGE" } },
      { name: "message", label: "Slack Message", type: "textarea", placeholder: "Write the message...", showWhen: { field: "action", value: "SLACKBOT_CHAT_POST_MESSAGE" } },
      { name: "parameters", label: "Advanced Params JSON", type: "textarea", placeholder: "{}" },
      { name: "credential_id", label: "Credential", type: "credential" },
    ],
  },
];
